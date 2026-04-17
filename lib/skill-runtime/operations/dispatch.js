/**
 * [INPUT]: 依赖 manifest/checkpoint/events 与 shell 执行能力，接收并行度与重试参数。
 * [OUTPUT]: 更新 task-manifest 状态，写入每任务 events.jsonl 与 checkpoint.json。
 * [POS]: skill runtime Stage-4 执行入口，被内部执行与恢复链路复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  ensureDir,
  appendJsonl,
  writeJson,
  readJson,
  runCommand,
  getTaskManifestPath,
  getRuntimeStatePath,
  getRuntimeTaskDir,
  getEventsPath,
  getCheckpointPath
} = require('../store');
const { parseManifest, parseCheckpoint } = require('../schemas');
const { applyManifestExecutionState } = require('../planner');
const { syncIntentMemory } = require('../intent');
const {
  summarizeTaskStates,
  classifyDelegationMode,
  getApprovalState,
  isExecutionApproved
} = require('../lifecycle');
const {
  findAssignment,
  ensureWorkerWorkspace,
  updateAssignmentStatus,
  updateWorkerState,
  appendWorkerJournal,
  appendMessageBus
} = require('../delegation');

function toSessionId(taskId) {
  return `${taskId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function dependenciesPassed(task, taskMap) {
  return task.dependsOn.every((depId) => {
    const dep = taskMap.get(depId);
    return dep && dep.status === 'passed';
  });
}

function dependenciesFailed(task, taskMap) {
  return task.dependsOn.some((depId) => {
    const dep = taskMap.get(depId);
    return dep && (dep.status === 'failed' || dep.status === 'skipped');
  });
}

function hasTouchConflict(task, lockedTouches) {
  if (!task.touches || task.touches.length === 0) {
    return false;
  }

  return task.touches.some((filePath) => lockedTouches.has(filePath));
}

function selectBatch(readyTasks, parallel) {
  const selected = [];
  const lockedTouches = new Set();

  for (const task of readyTasks) {
    if (selected.length >= parallel) {
      break;
    }

    if (hasTouchConflict(task, lockedTouches)) {
      continue;
    }

    selected.push(task);
    for (const touched of task.touches) {
      lockedTouches.add(touched);
    }
  }

  return selected;
}

async function writeCheckpoint(repoRoot, changeId, taskId, payload, options = {}) {
  const checkpointPath = getCheckpointPath(repoRoot, changeId, taskId);
  const checkpoint = parseCheckpoint(payload);
  await writeJson(checkpointPath, checkpoint);
}

async function writeEvent(repoRoot, changeId, taskId, event, debug = false) {
  if (!debug && !String(event.type || '').includes('failed') && !String(event.type || '').includes('rejected')) {
    return;
  }
  const eventsPath = getEventsPath(repoRoot, changeId, taskId);
  await appendJsonl(eventsPath, event);
}

async function writeManifest(repoRoot, changeId, manifest) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  applyManifestExecutionState(manifest, nowIso());
  await writeJson(manifestPath, manifest);
}

async function executeTask({ repoRoot, changeId, task, retryOverride, debug = false }) {
  const taskRuntimeDir = getRuntimeTaskDir(repoRoot, changeId, task.id);
  await ensureDir(taskRuntimeDir);

  const assignment = await findAssignment(repoRoot, changeId, task.id);
  const worker = await ensureWorkerWorkspace(repoRoot, changeId, assignment);
  const sessionId = toSessionId(task.id);
  const commands = [...task.run, ...task.checks];
  const taskRetry = Number.isInteger(retryOverride) ? retryOverride : task.maxRetries;
  const maxAttempts = Math.max(1, taskRetry + 1);
  const expectedPlanVersion = task.planVersion || 1;

  if (assignment) {
    await updateAssignmentStatus(repoRoot, changeId, task.id, {
      status: 'running',
      workspace: worker.workspacePath,
      sessionId,
      summary: worker.mode === 'worktree'
        ? `Worker ${assignment.workerId} running in worktree`
        : `Worker ${assignment.workerId} fell back to controller workspace: ${worker.reason}`
    });
    await updateWorkerState(repoRoot, changeId, assignment.workerId, {
      role: assignment.role,
      planVersion: expectedPlanVersion,
      status: 'running',
      currentTask: task.id,
      workspace: worker.workspacePath
    });
    await appendWorkerJournal(
      repoRoot,
      changeId,
      assignment.workerId,
      `started ${task.id} in ${worker.mode === 'worktree' ? worker.workspacePath : 'controller workspace'}`
    );
    await appendMessageBus(
      repoRoot,
      changeId,
      `${assignment.workerId} started ${task.id} in ${worker.mode === 'worktree' ? worker.workspacePath : 'controller workspace'}`
    );
  }

  while (task.attempts < maxAttempts) {
    task.attempts += 1;
    task.status = 'running';

    await writeEvent(repoRoot, changeId, task.id, {
      type: 'task_started',
      changeId,
      taskId: task.id,
      sessionId,
      attempt: task.attempts,
      timestamp: nowIso()
    }, debug);

    let failed = false;
    let failureMessage = '';

    for (const command of commands) {
      const result = await runCommand(command, {
        cwd: worker.cwd,
        timeoutMs: 30 * 60 * 1000
      });

      await writeEvent(repoRoot, changeId, task.id, {
        type: 'command_finished',
        changeId,
        taskId: task.id,
        sessionId,
        attempt: task.attempts,
        command,
        code: result.code,
        durationMs: result.durationMs,
        timestamp: nowIso()
      }, debug);

      if (result.code !== 0) {
        failed = true;
        failureMessage = (result.stderr || result.stdout || 'Command failed').trim();
        break;
      }
    }

    if (!failed) {
      const latestManifest = parseManifest(await readJson(getTaskManifestPath(repoRoot, changeId)));
      const latestPlanVersion = latestManifest.metadata?.planVersion || 1;

      if (latestPlanVersion !== expectedPlanVersion) {
        failed = true;
        failureMessage = `Stale result rejected: task ran with plan_version ${expectedPlanVersion} but current plan_version is ${latestPlanVersion}`;
      }
    }

    if (!failed) {
      task.status = 'passed';
      task.lastError = undefined;

      await writeCheckpoint(repoRoot, changeId, task.id, {
        changeId,
        taskId: task.id,
        sessionId,
        planVersion: expectedPlanVersion,
        status: task.status,
        summary: `Task passed after ${task.attempts} attempt(s)`,
        error: '',
        outputExcerpt: '',
        timestamp: nowIso(),
        attempt: task.attempts
      });

      await writeEvent(repoRoot, changeId, task.id, {
        type: 'task_passed',
        changeId,
        taskId: task.id,
        sessionId,
        attempts: task.attempts,
        timestamp: nowIso()
      }, debug);

      if (assignment) {
        await updateAssignmentStatus(repoRoot, changeId, task.id, {
          status: 'completed',
          workspace: worker.workspacePath,
          sessionId,
          summary: `Worker ${assignment.workerId} completed task successfully`
        });
        await updateWorkerState(repoRoot, changeId, assignment.workerId, {
          role: assignment.role,
          planVersion: expectedPlanVersion,
          status: 'idle',
          currentTask: 'none',
          workspace: worker.workspacePath
        });
        await appendWorkerJournal(repoRoot, changeId, assignment.workerId, `completed ${task.id}`);
        await appendMessageBus(repoRoot, changeId, `${assignment.workerId} completed ${task.id}`);
      }

      return;
    }

    task.status = 'failed';
    task.lastError = failureMessage;

    await writeCheckpoint(repoRoot, changeId, task.id, {
      changeId,
      taskId: task.id,
      sessionId,
      planVersion: expectedPlanVersion,
      status: task.status,
      summary: `Task failed: ${failureMessage.slice(0, 240)}`,
      error: failureMessage,
      outputExcerpt: failureMessage.slice(0, 400),
      timestamp: nowIso(),
      attempt: task.attempts
    });

    await writeEvent(repoRoot, changeId, task.id, {
      type: failureMessage.includes('Stale result rejected') ? 'task_stale_rejected' : 'task_failed',
      changeId,
      taskId: task.id,
      sessionId,
      attempt: task.attempts,
      error: failureMessage,
      timestamp: nowIso()
    }, debug);

    if (assignment) {
      await updateAssignmentStatus(repoRoot, changeId, task.id, {
        status: 'failed',
        workspace: worker.workspacePath,
        sessionId,
        summary: failureMessage.slice(0, 240)
      });
      await updateWorkerState(repoRoot, changeId, assignment.workerId, {
        role: assignment.role,
        planVersion: expectedPlanVersion,
        status: 'idle',
        currentTask: 'none',
        workspace: worker.workspacePath
      });
      await appendWorkerJournal(
        repoRoot,
        changeId,
        assignment.workerId,
        `failed ${task.id}: ${failureMessage.slice(0, 120)}`
      );
      await appendMessageBus(repoRoot, changeId, `${assignment.workerId} failed ${task.id}: ${failureMessage.slice(0, 120)}`);
    }
  }
}

function isTaskIncluded(task, executionScope, state) {
  if (executionScope === 'direct') {
    return classifyDelegationMode(task, state || {}) === 'direct';
  }

  return true;
}

async function runDispatch({
  repoRoot,
  changeId,
  parallel = 3,
  maxRetries,
  resume = false,
  executionScope = 'all',
  debug = false
}) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));
  const activePlanVersion = manifest.metadata?.planVersion || 1;

  // Update change-state.json to in_progress on first dispatch
  const statePath = getRuntimeStatePath(repoRoot, changeId);
  const state = await readJson(statePath, null);
  const stateExists = require('fs').existsSync(statePath);
  const approval = getApprovalState(state, manifest);
  if (!isExecutionApproved(state, manifest)) {
    await syncIntentMemory(repoRoot, changeId, {
      event: 'dispatch_blocked_unapproved',
      reason: `Plan version ${approval.planVersion || activePlanVersion} must be approved before execute`
    });

    return {
      changeId,
      manifestPath,
      summary: summarizeTaskStates(manifest.tasks),
      success: false,
      reason: `Execution blocked until plan_version ${approval.planVersion || activePlanVersion} is approved. Return to the cc-plan approval gate and keep execution mode ${approval.executionMode}.`
    };
  }

  if (stateExists) {
    if (state.status === 'planned' || state.status === 'initialized') {
      state.status = 'in_progress';
      state.updatedAt = nowIso();
      await writeJson(statePath, state);
    }
  }

  if (resume) {
    for (const task of manifest.tasks) {
      if (task.status === 'running') {
        task.status = 'pending';
      }
    }
  }

  for (const task of manifest.tasks) {
    task.planVersion = activePlanVersion;
  }

  await syncIntentMemory(repoRoot, changeId, {
    event: resume ? 'resume_started' : 'dispatch_started',
    reason: resume ? 'Resume flow entered dispatch loop' : 'Dispatch flow entered execution loop'
  });

  const safeParallel = Math.max(1, Number.parseInt(parallel, 10) || 1);

  while (true) {
    const taskMap = new Map(manifest.tasks.map((task) => [task.id, task]));
    const pending = manifest.tasks.filter((task) =>
      task.status === 'pending' && isTaskIncluded(task, executionScope, state)
    );

    if (pending.length === 0) {
      break;
    }

    for (const task of pending) {
      if (dependenciesFailed(task, taskMap)) {
        task.status = 'skipped';
        task.lastError = 'Blocked by failed dependency';
      }
    }

    const ready = manifest.tasks.filter(
      (task) => task.status === 'pending' &&
        isTaskIncluded(task, executionScope, state) &&
        dependenciesPassed(task, taskMap)
    );

    if (ready.length === 0) {
      await writeManifest(repoRoot, changeId, manifest);

      await syncIntentMemory(repoRoot, changeId, {
        event: 'dispatch_blocked',
        reason: 'No ready tasks left after dependency evaluation'
      });

      return {
        changeId,
        manifestPath,
        summary: summarizeTaskStates(manifest.tasks),
        success: false,
        reason: 'No ready tasks left. Check dependencies and failed tasks.'
      };
    }

    const batch = selectBatch(ready, safeParallel);

    if (batch.length === 0) {
      const firstReady = ready[0];
      batch.push(firstReady);
    }

    await Promise.all(
      batch.map((task) =>
        executeTask({
          repoRoot,
          changeId,
          task,
          retryOverride: Number.isInteger(maxRetries) ? maxRetries : undefined,
          debug
        })
      )
    );

    await writeManifest(repoRoot, changeId, manifest);
    await syncIntentMemory(repoRoot, changeId, {
      event: 'dispatch_batch_completed',
      reason: `Completed batch of ${batch.length} task(s)`
    });
  }

  await writeManifest(repoRoot, changeId, manifest);

  const summary = summarizeTaskStates(manifest.tasks);
  const scopedPending = manifest.tasks.filter((task) =>
    ['pending', 'running', 'failed'].includes(task.status) && isTaskIncluded(task, executionScope, state)
  );
  const success = scopedPending.length === 0;

  await syncIntentMemory(repoRoot, changeId, {
    event: success ? 'dispatch_completed' : 'dispatch_incomplete',
    reason: success ? 'All executable tasks completed' : 'Dispatch loop ended with unresolved tasks'
  });

  return {
    changeId,
    manifestPath,
    summary,
    success
  };
}

module.exports = {
  runDispatch
};
