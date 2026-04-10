#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 根据 manifest 选出当前 ready tasks / 并行候选
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: select-ready-tasks.sh --manifest task-manifest.json [--task T001]
EOF
}

MANIFEST=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --manifest) MANIFEST="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$MANIFEST" || ! -f "$MANIFEST" ]]; then
  usage
  exit 1
fi

node - "$MANIFEST" "$TASK_ID" <<'NODE'
const fs = require('fs');

const manifestPath = process.argv[2];
const taskId = process.argv[3] || '';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const tasks = Array.isArray(manifest.tasks) ? manifest.tasks : [];
const doneStates = new Set(['passed', 'completed', 'done', 'verified']);
const blockedStates = new Set(['failed', 'skipped', 'blocked']);

function statusOf(task) {
  if (task.status) return task.status;
  return task.completed ? 'passed' : 'pending';
}

const taskMap = new Map(tasks.map((task) => [task.id, task]));
const unfinished = tasks.filter((task) => !doneStates.has(statusOf(task)));
const phases = unfinished.map((task) => Number.isFinite(task.phase) ? task.phase : 0);
const activePhase = phases.length > 0 ? Math.min(...phases) : null;

function unmetDependencies(task) {
  return (task.dependsOn || []).filter((depId) => {
    const depTask = taskMap.get(depId);
    return !depTask || !doneStates.has(statusOf(depTask));
  });
}

function summarize(task) {
  return {
    id: task.id,
    title: task.title,
    phase: task.phase || 0,
    status: statusOf(task),
    dependsOn: task.dependsOn || [],
    parallel: Boolean(task.parallel),
    touches: task.touches || task.files || [],
    waitingOn: unmetDependencies(task)
  };
}

const runningTasks = unfinished
  .filter((task) => (activePhase === null || (task.phase || 0) === activePhase) && statusOf(task) === 'running')
  .map(summarize);

const readyTasks = unfinished
  .filter((task) => {
    const taskPhase = task.phase || 0;
    const status = statusOf(task);
    return (
      (activePhase === null || taskPhase === activePhase) &&
      status === 'pending' &&
      unmetDependencies(task).length === 0
    );
  })
  .map(summarize);

const blockedTasks = unfinished
  .filter((task) => {
    const taskPhase = task.phase || 0;
    const status = statusOf(task);
    return (
      (activePhase === null || taskPhase === activePhase) &&
      (unmetDependencies(task).length > 0 || blockedStates.has(status))
    );
  })
  .map(summarize);

const deferredTasks = unfinished
  .filter((task) => activePhase !== null && (task.phase || 0) !== activePhase)
  .map(summarize);

const payload = {
  changeId: manifest.changeId || manifest.requirementId || 'unknown',
  currentTaskId: manifest.currentTaskId || null,
  activePhase,
  runningTasks,
  readyTasks,
  parallelCandidates: readyTasks.filter((task) => task.parallel),
  blockedTasks,
  deferredTasks
};

if (taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    process.stderr.write(`${taskId} not found\n`);
    process.exit(1);
  }

  const summary = summarize(task);
  process.stdout.write(JSON.stringify({
    changeId: payload.changeId,
    activePhase,
    task: {
      ...summary,
      ready: readyTasks.some((item) => item.id === taskId),
      running: runningTasks.some((item) => item.id === taskId)
    }
  }, null, 2) + '\n');
  process.exit(0);
}

process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
NODE
