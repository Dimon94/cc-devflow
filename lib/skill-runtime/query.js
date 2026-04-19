/**
 * [INPUT]: 依赖 store/artifacts/lifecycle 读取 requirement 工件，接收 repoRoot 和 changeId。
 * [OUTPUT]: 对外提供 getProgress/getNextTask/getFullState 查询函数，作为兼容查询面聚合当前阶段与 PR brief 路径。
 * [POS]: skill runtime 的薄查询兼容层，只读 artifact 与共享 lifecycle 语义，不再自带流程推导副本。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath,
  exists,
  readJson
} = require('./store');
const { getIntentPrBriefPath } = require('./artifacts');
const { deriveManifestExecutionState } = require('./planner');
const {
  getApprovalState,
  deriveLifecycleStage,
  deriveTaskProgress,
  isTaskCompletedStatus
} = require('./lifecycle');

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
    return deriveTaskProgress(manifest.tasks || []);
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
    const activePhase = manifest.activePhase ?? executionState.activePhase;
    const completedIds = new Set(
      (manifest.tasks || [])
        .filter((task) => isTaskCompletedStatus(task.status))
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
  const statePath = getRuntimeStatePath(repoRoot, changeId);
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
