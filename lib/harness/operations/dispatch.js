/**
 * [INPUT]: 依赖 manifest/checkpoint/events 与 shell 执行能力，接收并行度与重试参数。
 * [OUTPUT]: 更新 task-manifest 状态，写入每任务 events.jsonl 与 checkpoint.json。
 * [POS]: harness Stage-4 执行入口，被 CLI `harness:dispatch` 与 `harness:resume` 复用。
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
  getRuntimeTaskDir,
  getEventsPath,
  getCheckpointPath
} = require('../store');
const { parseManifest, parseCheckpoint } = require('../schemas');

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

async function writeCheckpoint(repoRoot, changeId, taskId, payload) {
  const checkpointPath = getCheckpointPath(repoRoot, changeId, taskId);
  const checkpoint = parseCheckpoint(payload);
  await writeJson(checkpointPath, checkpoint);
}

async function writeEvent(repoRoot, changeId, taskId, event) {
  const eventsPath = getEventsPath(repoRoot, changeId, taskId);
  await appendJsonl(eventsPath, event);
}

async function executeTask({ repoRoot, changeId, task, retryOverride }) {
  const taskRuntimeDir = getRuntimeTaskDir(repoRoot, changeId, task.id);
  await ensureDir(taskRuntimeDir);

  const sessionId = toSessionId(task.id);
  const commands = [...task.run, ...task.checks];
  const taskRetry = Number.isInteger(retryOverride) ? retryOverride : task.maxRetries;
  const maxAttempts = Math.max(1, taskRetry + 1);

  while (task.attempts < maxAttempts) {
    task.attempts += 1;
    task.status = 'running';

    await writeCheckpoint(repoRoot, changeId, task.id, {
      changeId,
      taskId: task.id,
      sessionId,
      status: task.status,
      summary: `Task started (attempt ${task.attempts}/${maxAttempts})`,
      timestamp: nowIso(),
      attempt: task.attempts
    });

    await writeEvent(repoRoot, changeId, task.id, {
      type: 'task_started',
      changeId,
      taskId: task.id,
      sessionId,
      attempt: task.attempts,
      timestamp: nowIso()
    });

    let failed = false;
    let failureMessage = '';

    for (const command of commands) {
      const result = await runCommand(command, {
        cwd: repoRoot,
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
      });

      if (result.code !== 0) {
        failed = true;
        failureMessage = (result.stderr || result.stdout || 'Command failed').trim();
        break;
      }
    }

    if (!failed) {
      task.status = 'passed';
      task.lastError = undefined;

      await writeCheckpoint(repoRoot, changeId, task.id, {
        changeId,
        taskId: task.id,
        sessionId,
        status: task.status,
        summary: `Task passed after ${task.attempts} attempt(s)`,
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
      });

      return;
    }

    task.status = 'failed';
    task.lastError = failureMessage;

    await writeCheckpoint(repoRoot, changeId, task.id, {
      changeId,
      taskId: task.id,
      sessionId,
      status: task.status,
      summary: `Task failed: ${failureMessage.slice(0, 240)}`,
      timestamp: nowIso(),
      attempt: task.attempts
    });

    await writeEvent(repoRoot, changeId, task.id, {
      type: 'task_failed',
      changeId,
      taskId: task.id,
      sessionId,
      attempt: task.attempts,
      error: failureMessage,
      timestamp: nowIso()
    });
  }
}

function summarizeTasks(tasks) {
  return tasks.reduce(
    (acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    },
    { pending: 0, running: 0, passed: 0, failed: 0, skipped: 0 }
  );
}

async function runDispatch({ repoRoot, changeId, parallel = 3, maxRetries, resume = false }) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));

  if (resume) {
    for (const task of manifest.tasks) {
      if (task.status === 'running') {
        task.status = 'pending';
      }
    }
  }

  const safeParallel = Math.max(1, Number.parseInt(parallel, 10) || 1);

  while (true) {
    const taskMap = new Map(manifest.tasks.map((task) => [task.id, task]));
    const pending = manifest.tasks.filter((task) => task.status === 'pending');

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
      (task) => task.status === 'pending' && dependenciesPassed(task, taskMap)
    );

    if (ready.length === 0) {
      await writeJson(manifestPath, {
        ...manifest,
        updatedAt: nowIso()
      });

      return {
        changeId,
        manifestPath,
        summary: summarizeTasks(manifest.tasks),
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
          retryOverride: Number.isInteger(maxRetries) ? maxRetries : undefined
        })
      )
    );

    manifest.updatedAt = nowIso();
    await writeJson(manifestPath, manifest);
  }

  const summary = summarizeTasks(manifest.tasks);
  const success = summary.failed === 0 && summary.pending === 0;

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
