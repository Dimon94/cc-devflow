/**
 * [INPUT]: 依赖 devflow/changes 下 execution/tasks 目录与 mtime，接收保留小时阈值。
 * [OUTPUT]: 删除过期任务运行态目录，并输出清理统计。
 * [POS]: skill runtime 熵清理入口，被 CLI `harness:janitor` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const {
  listDirectories,
  getRuntimeRoot
} = require('../store');

async function removeDirectoryRecursive(dirPath) {
  await fs.promises.rm(dirPath, { recursive: true, force: true });
}

async function runJanitor({ repoRoot, hours = 72 }) {
  const runtimeRoot = getRuntimeRoot(repoRoot);
  const cutoffMs = Date.now() - Number(hours) * 60 * 60 * 1000;

  const changeDirs = await listDirectories(runtimeRoot);
  let removedTaskDirs = 0;
  let removedChangeDirs = 0;

  for (const changeDir of changeDirs) {
    const taskDirs = await listDirectories(path.join(changeDir, 'execution', 'tasks'));

    for (const taskDir of taskDirs) {
      const stat = await fs.promises.stat(taskDir);
      const isStale = stat.mtimeMs < cutoffMs;
      if (!isStale) {
        continue;
      }

      await removeDirectoryRecursive(taskDir);
      removedTaskDirs += 1;
    }

    const remaining = await listDirectories(path.join(changeDir, 'execution', 'tasks'));
    if (remaining.length === 0) {
      const stat = await fs.promises.stat(changeDir);
      if (stat.mtimeMs < cutoffMs) {
        await removeDirectoryRecursive(path.join(changeDir, 'execution', 'tasks'));
        removedChangeDirs += 1;
      }
    }
  }

  return {
    runtimeRoot,
    removedTaskDirs,
    removedChangeDirs,
    cutoffHours: Number(hours)
  };
}

module.exports = {
  runJanitor
};
