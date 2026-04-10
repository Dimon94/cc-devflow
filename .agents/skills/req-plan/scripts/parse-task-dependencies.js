#!/usr/bin/env node

'use strict';

// ------------------------------------------------------------
// 解析 TASKS.md 里的 phase / [P] / 文件触点
// ------------------------------------------------------------

const fs = require('fs');

const phaseRegex = /^##\s+Phase\s+(\d+):\s*(.+)$/;
const taskRegex = /^-\s+\[([ xX])\]\s+(?:\*\*)?(T\d+)(?:\*\*)?\s+(.*)$/;
const fileRegex = /`([^`]+)`/g;

function parse(content) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const tasks = [];
  let phase = 0;

  for (const line of lines) {
    const phaseMatch = line.match(phaseRegex);
    if (phaseMatch) {
      phase = Number(phaseMatch[1]);
      continue;
    }

    const taskMatch = line.match(taskRegex);
    if (!taskMatch) continue;

    const [, box, id, rest] = taskMatch;
    const files = [...rest.matchAll(fileRegex)].map((m) => m[1]);
    tasks.push({
      id,
      phase,
      completed: box.toLowerCase() === 'x',
      parallel: rest.includes('[P]'),
      files,
      title: rest.replace(/\[P\]/g, '').replace(fileRegex, '').replace(/\*\*/g, '').trim()
    });
  }

  return tasks;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: parse-task-dependencies.js TASKS.md');
    process.exit(1);
  }

  const tasks = parse(fs.readFileSync(file, 'utf8'));
  const nextPhase = tasks.filter((t) => !t.completed).reduce((min, t) => Math.min(min, t.phase), Infinity);
  const nextTasks = Number.isFinite(nextPhase) ? tasks.filter((t) => t.phase === nextPhase && !t.completed) : [];

  process.stdout.write(JSON.stringify({ tasks, nextTasks }, null, 2));
}

if (require.main === module) {
  main();
}
