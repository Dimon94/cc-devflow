/**
 * [INPUT]: 依赖 store/intent/delegation 与 dispatch/resume/worker-run，接收执行阶段上下文与 worker 配置。
 * [OUTPUT]: 对外提供 autopilot 的执行阶段工具与 runner，返回更新后的 snapshot 与 executed。
 * [POS]: autopilot 的执行层，负责 direct/controller 与 delegated worker 的混合执行循环。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  readJson,
  writeJson,
  getTaskManifestPath
} = require('../store');
const {
  syncIntentMemory,
  classifyDelegationMode
} = require('../intent');
const { findAssignment } = require('../delegation');
const { runDispatch } = require('./dispatch');
const { runResume } = require('./resume');
const { runWorkerCommand } = require('./worker-run');
const {
  stageIndex,
  hasUnresolvedTasks,
  loadState
} = require('./autopilot-shared');

function hasDirectUnresolvedTasks(manifest) {
  if (!manifest) {
    return false;
  }

  return manifest.tasks.some((task) =>
    classifyDelegationMode(task) === 'direct' &&
    ['pending', 'running', 'failed'].includes(task.status)
  );
}

function dependenciesPassed(task, taskMap) {
  return task.dependsOn.every((depId) => {
    const dep = taskMap.get(depId);
    return dep && dep.status === 'passed';
  });
}

function usesWorkerPool(workerProvider, workerCommand) {
  return Boolean(workerProvider || workerCommand);
}

function shouldResumeTasks(manifest, executionScope = 'all') {
  if (!manifest) {
    return false;
  }

  return manifest.tasks.some((task) => {
    if (executionScope === 'direct' && classifyDelegationMode(task) !== 'direct') {
      return false;
    }

    return task.status === 'failed' || task.status === 'running';
  });
}

async function requeueDelegatedTasksForResume(repoRoot, changeId) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = await readJson(manifestPath, null);
  if (!manifest) {
    return 0;
  }

  let updated = 0;
  for (const task of manifest.tasks) {
    if (classifyDelegationMode(task) === 'direct') {
      continue;
    }

    if (task.status === 'running' || task.status === 'failed') {
      task.status = 'pending';
      updated += 1;
    }
  }

  if (updated > 0) {
    manifest.updatedAt = new Date().toISOString();
    await writeJson(manifestPath, manifest);
  }

  return updated;
}

async function runDelegatedAutopilotWorkers({
  repoRoot,
  changeId,
  workerProvider,
  workerProviderArgs,
  workerCommand
}) {
  const manifest = await readJson(getTaskManifestPath(repoRoot, changeId), null);
  if (!manifest) {
    return { executedCount: 0 };
  }

  const taskMap = new Map(manifest.tasks.map((task) => [task.id, task]));
  const readyDelegatedTasks = manifest.tasks.filter((task) =>
    classifyDelegationMode(task) !== 'direct' &&
    task.status === 'pending' &&
    dependenciesPassed(task, taskMap)
  );

  let executedCount = 0;

  for (const task of readyDelegatedTasks) {
    const assignment = await findAssignment(repoRoot, changeId, task.id);
    if (!assignment) {
      continue;
    }

    await runWorkerCommand({
      repoRoot,
      changeId,
      workerId: assignment.workerId,
      taskId: task.id,
      provider: workerProvider,
      providerArgs: workerProviderArgs,
      command: workerCommand
    });
    executedCount += 1;
  }

  return { executedCount };
}

async function runControllerExecutionPass({
  repoRoot,
  changeId,
  manifest,
  parallel,
  maxRetries,
  resume,
  executionScope = 'all'
}) {
  const shouldResume = resume || shouldResumeTasks(manifest, executionScope);
  const command = shouldResume ? 'resume' : 'dispatch';
  const runnerArgs = {
    repoRoot,
    changeId,
    parallel,
    maxRetries
  };

  if (executionScope === 'direct') {
    runnerArgs.executionScope = 'direct';
  }

  const result = shouldResume
    ? await runResume(runnerArgs)
    : await runDispatch(runnerArgs);

  await syncIntentMemory(repoRoot, changeId, {
    event: shouldResume ? 'autopilot_resume_completed' : 'autopilot_execute_completed',
    reason: result.success
      ? (executionScope === 'direct'
        ? 'Controller execution completed current direct frontier'
        : 'Execution stage completed without unresolved tasks')
      : result.reason || 'Execution stopped with unresolved tasks'
  });

  return {
    command,
    snapshot: await loadState(repoRoot, changeId)
  };
}

async function runHybridExecutionStage({
  repoRoot,
  changeId,
  snapshot,
  executed,
  parallel,
  maxRetries,
  resume,
  workerProvider,
  workerProviderArgs,
  workerCommand
}) {
  let nextSnapshot = snapshot;
  let workerResumeApplied = !resume;
  let executedWorkerPool = false;

  while (nextSnapshot.manifest && hasUnresolvedTasks(nextSnapshot.manifest)) {
    let progressed = false;

    if (!workerResumeApplied) {
      const requeued = await requeueDelegatedTasksForResume(repoRoot, changeId);
      workerResumeApplied = true;

      if (requeued > 0) {
        progressed = true;
        nextSnapshot = await loadState(repoRoot, changeId);
      }
    }

    const workerResult = await runDelegatedAutopilotWorkers({
      repoRoot,
      changeId,
      workerProvider,
      workerProviderArgs,
      workerCommand
    });

    if (workerResult.executedCount > 0) {
      executedWorkerPool = true;
      progressed = true;
      nextSnapshot = await loadState(repoRoot, changeId);
    }

    if (nextSnapshot.manifest && hasDirectUnresolvedTasks(nextSnapshot.manifest)) {
      const controllerPass = await runControllerExecutionPass({
        repoRoot,
        changeId,
        manifest: nextSnapshot.manifest,
        parallel,
        maxRetries,
        resume,
        executionScope: 'direct'
      });

      executed.push(controllerPass.command);
      nextSnapshot = controllerPass.snapshot;
      progressed = true;
    }

    if (!progressed) {
      break;
    }
  }

  if (executedWorkerPool) {
    executed.push('worker-run');
    await syncIntentMemory(repoRoot, changeId, {
      event: 'autopilot_worker_pool_completed',
      reason: `Delegated worker pool executed via ${workerProvider || 'custom-command'}`
    });
    nextSnapshot = await loadState(repoRoot, changeId);
  }

  return nextSnapshot;
}

async function runExecutionStage({
  repoRoot,
  changeId,
  fromIndex,
  snapshot,
  executed,
  parallel,
  maxRetries,
  resume,
  workerProvider,
  workerProviderArgs,
  workerCommand
}) {
  if (fromIndex > stageIndex('execute') || !snapshot.manifest || !hasUnresolvedTasks(snapshot.manifest)) {
    return snapshot;
  }

  if (usesWorkerPool(workerProvider, workerCommand)) {
    return runHybridExecutionStage({
      repoRoot,
      changeId,
      snapshot,
      executed,
      parallel,
      maxRetries,
      resume,
      workerProvider,
      workerProviderArgs,
      workerCommand
    });
  }

  const controllerPass = await runControllerExecutionPass({
    repoRoot,
    changeId,
    manifest: snapshot.manifest,
    parallel,
    maxRetries,
    resume
  });

  executed.push(controllerPass.command);
  return controllerPass.snapshot;
}

module.exports = {
  runExecutionStage
};
