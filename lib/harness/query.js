/**
 * [INPUT]: 依赖 store 读取 harness-state/task-manifest/report-card，接收 repoRoot 和 changeId。
 * [OUTPUT]: 对外提供 getProgress/getNextTask/getFullState 查询函数，聚合分散状态并暴露当前阶段与 PR brief 路径。
 * [POS]: harness 查询工具层，被 CLI 与 skills 调用以获取聚合状态视图。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  getHarnessStatePath,
  getTaskManifestPath,
  getReportCardPath,
  exists,
  readJson
} = require('./store');
const { getIntentPrBriefPath } = require('./intent');
const { deriveLifecycleStage, getApprovalState } = require('./lifecycle');
const { deriveManifestExecutionState } = require('./planner');

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
    const executionState = deriveManifestExecutionState(manifest.tasks || []);
    const doneStates = new Set(['passed', 'completed', 'done', 'verified']);
    const activePhase = manifest.activePhase ?? executionState.activePhase;
    const completedIds = new Set(
      (manifest.tasks || [])
        .filter((task) => doneStates.has(task.status))
        .map((task) => task.id)
    );
    const currentTaskId = manifest.currentTaskId ?? executionState.currentTaskId;

    if (currentTaskId) {
      const currentTask = manifest.tasks.find((task) => task.id === currentTaskId);
      if (currentTask && currentTask.status === 'pending') {
        return currentTask;
      }
    }

    const nextTask = (manifest.tasks || []).find((task) => {
      if (task.status !== 'pending') {
        return false;
      }

      if (activePhase !== null && activePhase !== undefined && (task.phase || 1) !== activePhase) {
        return false;
      }

      return (task.dependsOn || []).every((depId) => completedIds.has(depId));
    });

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
  const prBriefPath = getIntentPrBriefPath(repoRoot, changeId);

  try {
    const [state, manifest, hasPrBrief] = await Promise.all([
      readJson(statePath),
      readJson(getTaskManifestPath(repoRoot, changeId), null),
      exists(prBriefPath)
    ]);
    const progress = await getProgress(repoRoot, changeId);
    const nextTask = await getNextTask(repoRoot, changeId);
    const report = await readJson(reportPath, null);

    return {
      lifecycle: {
        changeId: state.changeId,
        goal: state.goal,
        status: state.status,
        initializedAt: state.initializedAt,
        plannedAt: state.plannedAt,
        verifiedAt: state.verifiedAt,
        releasedAt: state.releasedAt,
        updatedAt: state.updatedAt,
        stage: deriveLifecycleStage({ state, manifest, report, hasPrBrief }),
        approval: getApprovalState(state, manifest)
      },
      progress,
      nextTask,
      delivery: {
        prBriefPath: hasPrBrief ? prBriefPath : null
      },
      quality: report ? {
        overall: report.overall,
        verdict: report.verdict || (report.overall === 'pass' ? 'pass' : 'fail'),
        reviewStatus: report.review?.status || 'skipped',
        reviewFindings: (report.review?.findings || []).length,
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
