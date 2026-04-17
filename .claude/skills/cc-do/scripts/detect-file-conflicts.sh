#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 读取 JSON 任务列表，检查并行触点 / 依赖冲突
# ------------------------------------------------------------

input="$(cat)"

node - "$input" <<'NODE'
const raw = process.argv[2] || '';

function fail(message) {
  process.stdout.write(JSON.stringify({ hasConflicts: false, error: message }) + '\n');
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  fail('invalid json');
}

const sourceTasks = Array.isArray(parsed)
  ? parsed
  : parsed.parallelCandidates || parsed.readyTasks || parsed.tasks || [];

const tasks = sourceTasks.filter((task) => task && task.parallel !== false);
const fileConflicts = [];
const dependencyConflicts = [];
const conflictedTaskIds = new Set();

function touchesOf(task) {
  return [...new Set([...(task.touches || []), ...(task.files || [])].filter(Boolean))];
}

for (let index = 0; index < tasks.length; index += 1) {
  for (let offset = index + 1; offset < tasks.length; offset += 1) {
    const left = tasks[index];
    const right = tasks[offset];
    const leftTouches = new Set(touchesOf(left));
    const sharedTouches = touchesOf(right).filter((touch) => leftTouches.has(touch));

    if (sharedTouches.length > 0) {
      conflictedTaskIds.add(left.id);
      conflictedTaskIds.add(right.id);
      fileConflicts.push({
        tasks: [left.id, right.id],
        sharedTouches
      });
    }

    const leftDeps = new Set(left.dependsOn || []);
    const rightDeps = new Set(right.dependsOn || []);

    if (leftDeps.has(right.id) || rightDeps.has(left.id)) {
      conflictedTaskIds.add(left.id);
      conflictedTaskIds.add(right.id);
      dependencyConflicts.push({
        tasks: [left.id, right.id],
        reason: leftDeps.has(right.id)
          ? `${left.id} dependsOn ${right.id}`
          : `${right.id} dependsOn ${left.id}`
      });
    }
  }
}

const safeTaskIds = tasks
  .map((task) => task.id)
  .filter((taskId) => !conflictedTaskIds.has(taskId));

process.stdout.write(
  JSON.stringify(
    {
      hasConflicts: fileConflicts.length > 0 || dependencyConflicts.length > 0,
      fileConflicts,
      dependencyConflicts,
      safeTaskIds
    },
    null,
    2
  ) + '\n'
);
NODE
