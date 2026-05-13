#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 从 task.md 选出第一个未完成任务
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: select-ready-tasks.sh --tasks task.md [--task T001]
EOF
}

TASKS=""
TASK_ID=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tasks) TASKS="$2"; shift 2 ;;
    --task) TASK_ID="$(echo "$2" | tr '[:lower:]' '[:upper:]')"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$TASKS" || ! -f "$TASKS" ]]; then
  usage
  exit 1
fi

node - "$TASKS" "$TASK_ID" <<'NODE'
const fs = require('fs');

const tasksPath = process.argv[2];
const requestedTask = process.argv[3] || '';
const text = fs.readFileSync(tasksPath, 'utf8');
const tasks = [];

for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^- \[( |x|X)\]\s+(T\d{3})\b\s*(.*)$/);
  if (!match) continue;
  const [, mark, id, title] = match;
  tasks.push({
    id,
    title: title.trim(),
    status: mark.toLowerCase() === 'x' ? 'passed' : 'pending'
  });
}

if (requestedTask) {
  const task = tasks.find((item) => item.id === requestedTask);
  if (!task) {
    process.stderr.write(`${requestedTask} not found\n`);
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify({ task, ready: task.status === 'pending' }, null, 2)}\n`);
  process.exit(0);
}

process.stdout.write(`${JSON.stringify({
  taskFile: tasksPath,
  readyTasks: tasks.filter((task) => task.status === 'pending').slice(0, 1),
  openTasks: tasks.filter((task) => task.status === 'pending'),
  completedTasks: tasks.filter((task) => task.status === 'passed')
}, null, 2)}\n`);
NODE
