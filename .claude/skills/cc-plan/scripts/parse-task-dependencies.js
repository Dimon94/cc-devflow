#!/usr/bin/env node

'use strict';

// ------------------------------------------------------------
// 解析 tasks.md 里的 phase / [P] / 文件触点
// ------------------------------------------------------------

const fs = require('fs');

const phaseRegex = /^##\s+Phase\s+(\d+):\s*(.+)$/;
const taskRegex = /^-\s+\[([ xX])\]\s+(?:\*\*)?(T\d+)(?:\*\*)?\s+(.*)$/;
const fileRegex = /`([^`]+)`/g;
const dependsOnRegex = /\(dependsOn:([^)]+)\)/;

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
    const dependsOnMatch = rest.match(dependsOnRegex);
    const dependsOnValue = dependsOnMatch ? dependsOnMatch[1].trim() : '';
    const dependsOn = !dependsOnValue || dependsOnValue === 'none'
      ? []
      : dependsOnValue.split(',').map((item) => item.trim()).filter(Boolean);
    tasks.push({
      id,
      phase,
      completed: box.toLowerCase() === 'x',
      parallel: rest.includes('[P]'),
      dependsOn,
      files,
      title: rest
        .replace(/\[P\]/g, '')
        .replace(dependsOnRegex, '')
        .replace(fileRegex, '')
        .replace(/\*\*/g, '')
        .trim()
    });
  }

  return tasks;
}

function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: parse-task-dependencies.js tasks.md');
    process.exit(1);
  }

  const tasks = parse(fs.readFileSync(file, 'utf8'));
  const completedIds = new Set(tasks.filter((t) => t.completed).map((t) => t.id));
  const runnableTasks = tasks.filter((t) => !t.completed && t.dependsOn.every((dep) => completedIds.has(dep)));
  const nextPhase = runnableTasks.reduce((min, t) => Math.min(min, t.phase), Infinity);
  const nextTasks = Number.isFinite(nextPhase) ? runnableTasks.filter((t) => t.phase === nextPhase) : [];

  process.stdout.write(JSON.stringify({ tasks, nextTasks }, null, 2));
}

if (require.main === module) {
  main();
}
