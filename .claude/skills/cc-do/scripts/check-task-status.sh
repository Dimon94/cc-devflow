#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: check-task-status.sh --tasks task.md [--task T001]
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
const requested = process.argv[3] || '';
const text = fs.readFileSync(tasksPath, 'utf8');
const tasks = [];

for (const line of text.split(/\r?\n/)) {
  const match = line.match(/^\s*-\s+\[( |x|X)\]\s+(T\d{3})\b\s*(.*)$/);
  if (!match) continue;
  tasks.push({
    id: match[2],
    title: match[3].trim(),
    status: match[1].toLowerCase() === 'x' ? 'done' : 'pending'
  });
}

const payload = requested
  ? tasks.find((task) => task.id === requested) || null
  : {
      taskFile: tasksPath,
      total: tasks.length,
      done: tasks.filter((task) => task.status === 'done').length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      next: tasks.find((task) => task.status === 'pending') || null
    };

if (requested && !payload) {
  process.stderr.write(`${requested} not found\n`);
  process.exit(1);
}

process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
NODE
