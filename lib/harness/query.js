/**
 * [INPUT]: 依赖 store 读取 harness-state/task-manifest/report-card，接收 repoRoot 和 changeId。
 * [OUTPUT]: 对外提供 getProgress/getNextTask/getFullState 查询函数，聚合分散的状态信息。
 * [POS]: harness 查询工具层，被 CLI 与 skills 调用以获取聚合状态视图。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  getHarnessStatePath,
  getTaskManifestPath,
  getReportCardPath,
  readJson
} = require('./store');

/**
 * 获取任务进度统计
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object>} 进度统计对象
 */
async function getProgress(repoRoot, changeId) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);

  try {
    const manifest = await readJson(manifestPath);

    return {
      totalTasks: manifest.tasks.length,
      completedTasks: manifest.tasks.filter(t => t.status === 'passed').length,
      failedTasks: manifest.tasks.filter(t => t.status === 'failed').length,
      pendingTasks: manifest.tasks.filter(t => t.status === 'pending').length,
      runningTasks: manifest.tasks.filter(t => t.status === 'running').length,
      skippedTasks: manifest.tasks.filter(t => t.status === 'skipped').length
    };
  } catch (error) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      pendingTasks: 0,
      runningTasks: 0,
      skippedTasks: 0,
      error: error.message
    };
  }
}

/**
 * 获取下一个待执行的任务
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object|null>} 下一个任务对象或 null
 */
async function getNextTask(repoRoot, changeId) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);

  try {
    const manifest = await readJson(manifestPath);

    // 找到第一个 pending 状态的任务
    const nextTask = manifest.tasks.find(t => t.status === 'pending');

    return nextTask || null;
  } catch (error) {
    return null;
  }
}

/**
 * 获取完整的聚合状态视图
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object>} 完整状态对象
 */
async function getFullState(repoRoot, changeId) {
  const statePath = getHarnessStatePath(repoRoot, changeId);
  const reportPath = getReportCardPath(repoRoot, changeId);

  try {
    const state = await readJson(statePath);
    const progress = await getProgress(repoRoot, changeId);
    const nextTask = await getNextTask(repoRoot, changeId);

    let report = null;
    try {
      report = await readJson(reportPath);
    } catch {
      // report-card.json 可能不存在（未执行 verify）
      report = null;
    }

    return {
      lifecycle: {
        changeId: state.changeId,
        goal: state.goal,
        status: state.status,
        initializedAt: state.initializedAt,
        plannedAt: state.plannedAt,
        verifiedAt: state.verifiedAt,
        releasedAt: state.releasedAt,
        updatedAt: state.updatedAt
      },
      progress,
      nextTask,
      quality: report ? {
        overall: report.overall,
        blockingFindings: report.blockingFindings,
        timestamp: report.timestamp
      } : null
    };
  } catch (error) {
    return {
      error: error.message,
      lifecycle: null,
      progress: null,
      nextTask: null,
      quality: null
    };
  }
}

module.exports = {
  getProgress,
  getNextTask,
  getFullState
};
