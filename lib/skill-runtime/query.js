/**
 * [INPUT]: 依赖 store/artifacts/lifecycle 读取 requirement 工件，接收 repoRoot、changeId 和可选 changeKey。
 * [OUTPUT]: 对外提供 typed query registry 与兼容查询函数，附 named error 和 trace shape。
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
const { createQueryRegistry } = require('./query-registry');
const { namedError } = require('./errors');
const { deriveShipReadiness } = require('./readiness');

async function readQueryArtifact(filePath, { required = true } = {}) {
  try {
    const value = await readJson(filePath, null);

    if (required && value === null) {
      throw namedError(
        'MissingQueryArtifactError',
        `Missing required query artifact: ${filePath}`,
        {
          artifactRefs: [filePath],
          rescueAction: 'create required runtime artifacts before running this query'
        }
      );
    }

    return value;
  } catch (error) {
    if (error.name === 'MissingQueryArtifactError') {
      throw error;
    }

    throw namedError(
      'InvalidQueryArtifactError',
      `Invalid query artifact ${filePath}: ${error.message}`,
      {
        artifactRefs: [filePath],
        rescueAction: 'repair or regenerate the invalid runtime artifact before running this query',
        details: {
          cause: error.name || 'Error'
        }
      }
    );
  }
}

/**
 * 获取任务进度统计
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object>} 进度统计对象
 */
async function getProgress(repoRoot, changeId, options = {}) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId, options);
  const manifest = await readQueryArtifact(manifestPath);
  return deriveTaskProgress(manifest.tasks || []);
}

/**
 * 获取下一个待执行的任务
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object|null>} 下一个任务对象或 null
 */
async function getNextTask(repoRoot, changeId, options = {}) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId, options);
  const manifest = await readQueryArtifact(manifestPath);
  const executionState = deriveManifestExecutionState(manifest.tasks || []);
  const activePhase = executionState.activePhase;
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
}

/**
 * 获取完整的聚合状态视图
 * @param {string} repoRoot - 仓库根目录
 * @param {string} changeId - 需求 ID
 * @returns {Promise<Object>} 完整状态对象
 */
async function getFullState(repoRoot, changeId, options = {}) {
  const statePath = getRuntimeStatePath(repoRoot, changeId, options);
  const reportPath = getReportCardPath(repoRoot, changeId, options);
  const prBriefPath = getIntentPrBriefPath(repoRoot, changeId, options);

  const [state, manifest, hasPrBrief] = await Promise.all([
    readQueryArtifact(statePath),
    readQueryArtifact(getTaskManifestPath(repoRoot, changeId, options)),
    exists(prBriefPath)
  ]);
  const progress = await getProgress(repoRoot, changeId, options);
  const nextTask = await getNextTask(repoRoot, changeId, options);
  const report = await readQueryArtifact(reportPath, { required: false });

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
}

async function getShipReadiness(repoRoot, changeId, options = {}) {
  const reportPath = getReportCardPath(repoRoot, changeId, options);
  const report = await readJson(reportPath, null);

  if (!report) {
    throw namedError(
      'MissingReportCardError',
      `Missing report card for ${changeId}`,
      {
        artifactRefs: [reportPath],
        rescueAction: 'run cc-check and create review/report-card.json before cc-act'
      }
    );
  }

  return deriveShipReadiness(report, { reportPath });
}

function queryArtifactRefs(repoRoot, changeId, names, options = {}) {
  const refs = {
    manifest: getTaskManifestPath(repoRoot, changeId, options),
    state: getRuntimeStatePath(repoRoot, changeId, options),
    report: getReportCardPath(repoRoot, changeId, options),
    prBrief: getIntentPrBriefPath(repoRoot, changeId, options)
  };

  return names.map((name) => refs[name]).filter(Boolean);
}

const registry = createQueryRegistry([
  {
    id: 'progress',
    artifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['manifest'], { changeKey }),
    requiredArtifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['manifest'], { changeKey }),
    handler: ({ repoRoot, changeId, changeKey }) => getProgress(repoRoot, changeId, { changeKey })
  },
  {
    id: 'next-task',
    artifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['manifest'], { changeKey }),
    requiredArtifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['manifest'], { changeKey }),
    handler: ({ repoRoot, changeId, changeKey }) => getNextTask(repoRoot, changeId, { changeKey })
  },
  {
    id: 'full-state',
    artifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['state', 'manifest', 'report', 'prBrief'], { changeKey }),
    requiredArtifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['state', 'manifest'], { changeKey }),
    handler: ({ repoRoot, changeId, changeKey }) => getFullState(repoRoot, changeId, { changeKey })
  },
  {
    id: 'ship-readiness',
    artifactRefs: ({ repoRoot, changeId, changeKey }) => queryArtifactRefs(repoRoot, changeId, ['report'], { changeKey }),
    handler: ({ repoRoot, changeId, changeKey }) => getShipReadiness(repoRoot, changeId, { changeKey })
  }
]);

module.exports = {
  getProgress,
  getNextTask,
  getFullState,
  getShipReadiness,
  listQueryIds: registry.listQueryIds,
  runQuery: registry.runQuery
};
