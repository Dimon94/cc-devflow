/**
 * [INPUT]: 依赖 .harness/runtime 目录与 checkpoint 状态，接收保留小时阈值。
 * [OUTPUT]: 删除过期且非运行中的任务运行态目录，并输出清理统计。
 * [POS]: harness 熵清理入口，被 CLI `harness:janitor` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const {
  readJson,
  listDirectories,
  getRuntimeRoot
} = require('../store');

async function removeDirectoryRecursive(dirPath) {
  await fs.promises.rm(dirPath, { recursive: true, force: true });
}

async function isTaskActive(taskDir) {
  const checkpointPath = path.join(taskDir, 'checkpoint.json');
  const checkpoint = await readJson(checkpointPath, null);

  if (!checkpoint) {
    return false;
  }

  return checkpoint.status === 'running';
}

async function runJanitor({ repoRoot, hours = 72 }) {
  const runtimeRoot = getRuntimeRoot(repoRoot);
  const cutoffMs = Date.now() - Number(hours) * 60 * 60 * 1000;

  const changeDirs = await listDirectories(runtimeRoot);
  let removedTaskDirs = 0;
  let removedChangeDirs = 0;

  for (const changeDir of changeDirs) {
    const taskDirs = await listDirectories(changeDir);

    for (const taskDir of taskDirs) {
      const stat = await fs.promises.stat(taskDir);
      const isStale = stat.mtimeMs < cutoffMs;
      if (!isStale) {
        continue;
      }

      if (await isTaskActive(taskDir)) {
        continue;
      }

      await removeDirectoryRecursive(taskDir);
      removedTaskDirs += 1;
    }

    const remaining = await listDirectories(changeDir);
    if (remaining.length === 0) {
      await removeDirectoryRecursive(changeDir);
      removedChangeDirs += 1;
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
