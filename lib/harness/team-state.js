/**
 * [INPUT]: 依赖 intent/store 的路径约定与文件读写能力，接收 repoRoot/changeId 以维护 Team 真相源与兼容镜像。
 * [OUTPUT]: 对外提供 Team state 真相源路径、truth/mirror 读写、旧 orchestration_status 归一化回退能力。
 * [POS]: harness 的 Team 状态桥接层，让 delegate/team runtime 优先落到 intent artifacts，再按需同步 compatibility mirror。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const { ensureDir, readJson, writeJson, getRequirementDir, nowIso } = require('./store');
const { getIntentArtifactsDir } = require('./intent');

function getTeamStatePath(repoRoot, changeId) {
  return path.join(getIntentArtifactsDir(repoRoot, changeId), 'team-state.json');
}

function getCompatibilityStatusPath(repoRoot, changeId) {
  return path.join(getRequirementDir(repoRoot, changeId), 'orchestration_status.json');
}

function normalizeTeamState(changeId, payload = {}) {
  return {
    changeId,
    status: payload.status || 'delegated',
    phase: payload.phase || 'delegate',
    branch: payload.branch || 'unknown',
    updatedAt: payload.updatedAt || nowIso(),
    planVersion: payload.planVersion || 1,
    source: payload.source || {
      kind: 'harness-autopilot',
      derivedFrom: 'devflow/intent'
    },
    team: payload.team || null,
    ralphLoop: payload.ralphLoop || undefined
  };
}

function fromCompatibilityStatus(changeId, compatibility) {
  if (!compatibility?.team) {
    return null;
  }

  return normalizeTeamState(changeId, {
    status: compatibility.status,
    phase: compatibility.phase,
    branch: compatibility.branch,
    updatedAt: compatibility.updatedAt,
    planVersion: compatibility.compatibility?.planVersion || compatibility.planVersion || 1,
    source: {
      kind: 'compatibility-mirror',
      derivedFrom: 'devflow/requirements'
    },
    team: compatibility.team,
    ralphLoop: compatibility.ralphLoop
  });
}

function toCompatibilityStatus(teamState, previous = {}) {
  return {
    ...previous,
    reqId: teamState.changeId,
    status: teamState.status,
    phase: teamState.phase,
    branch: teamState.branch,
    updatedAt: teamState.updatedAt,
    compatibility: {
      ...(previous.compatibility || {}),
      source: teamState.source?.kind || 'team-state',
      derivedFrom: 'devflow/intent/artifacts/team-state.json',
      planVersion: teamState.planVersion || 1
    },
    team: teamState.team,
    ralphLoop: teamState.ralphLoop
  };
}

function ensureParentDirSync(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJsonSync(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonSync(filePath, payload) {
  ensureParentDirSync(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

async function readTeamState(repoRoot, changeId) {
  const truth = await readJson(getTeamStatePath(repoRoot, changeId), null);
  if (truth?.team) {
    return normalizeTeamState(changeId, truth);
  }

  const compatibility = await readJson(getCompatibilityStatusPath(repoRoot, changeId), null);
  return fromCompatibilityStatus(changeId, compatibility);
}

function readTeamStateSync(repoRoot, changeId) {
  const truth = readJsonSync(getTeamStatePath(repoRoot, changeId));
  if (truth?.team) {
    return normalizeTeamState(changeId, truth);
  }

  const compatibility = readJsonSync(getCompatibilityStatusPath(repoRoot, changeId));
  return fromCompatibilityStatus(changeId, compatibility);
}

async function writeTeamState(repoRoot, changeId, payload, options = {}) {
  const next = normalizeTeamState(changeId, payload);
  const truthPath = getTeamStatePath(repoRoot, changeId);
  await ensureDir(path.dirname(truthPath));
  await writeJson(truthPath, next);

  if (options.syncCompatibility !== false) {
    const previous = await readJson(getCompatibilityStatusPath(repoRoot, changeId), {});
    await writeJson(getCompatibilityStatusPath(repoRoot, changeId), toCompatibilityStatus(next, previous || {}));
  }

  return next;
}

function writeTeamStateSync(repoRoot, changeId, payload, options = {}) {
  const next = normalizeTeamState(changeId, payload);
  writeJsonSync(getTeamStatePath(repoRoot, changeId), next);

  if (options.syncCompatibility !== false) {
    const previous = readJsonSync(getCompatibilityStatusPath(repoRoot, changeId)) || {};
    writeJsonSync(getCompatibilityStatusPath(repoRoot, changeId), toCompatibilityStatus(next, previous));
  }

  return next;
}

async function updateTeamState(repoRoot, changeId, updater, options = {}) {
  const current = (await readTeamState(repoRoot, changeId)) || normalizeTeamState(changeId, {});
  const nextPayload = await updater(current);
  if (!nextPayload) {
    return current;
  }
  return writeTeamState(repoRoot, changeId, nextPayload, options);
}

function updateTeamStateSync(repoRoot, changeId, updater, options = {}) {
  const current = readTeamStateSync(repoRoot, changeId) || normalizeTeamState(changeId, {});
  const nextPayload = updater(current);
  if (!nextPayload) {
    return current;
  }
  return writeTeamStateSync(repoRoot, changeId, nextPayload, options);
}

function buildInitialTeamState(changeId, manifest, assignments, branch) {
  const delegateAssignments = assignments.filter((item) => item.route !== 'direct');
  const uniqueWorkers = Array.from(
    delegateAssignments.reduce((map, item) => {
      if (!map.has(item.workerId)) {
        map.set(item.workerId, {
          id: item.workerId,
          role: item.role,
          status: 'idle',
          currentTask: null,
          completedTasks: [],
          lastActiveAt: nowIso()
        });
      }
      return map;
    }, new Map()).values()
  );

  return normalizeTeamState(changeId, {
    status: 'delegated',
    phase: 'delegate',
    branch,
    planVersion: manifest.metadata?.planVersion || 1,
    source: {
      kind: 'harness-autopilot',
      derivedFrom: 'devflow/intent'
    },
    team: {
      mode: delegateAssignments.some((item) => item.route === 'team') ? 'parallel' : 'sequential',
      lead: 'main-agent',
      teammates: uniqueWorkers,
      taskAssignments: Object.fromEntries(delegateAssignments.map((item) => [item.taskId, item.workerId])),
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
  });
}

function findLatestTeamStatePath(repoRoot) {
  const intentDir = path.join(repoRoot, 'devflow', 'intent');
  if (fs.existsSync(intentDir)) {
    const candidates = fs.readdirSync(intentDir)
      .map((name) => ({
        path: getTeamStatePath(repoRoot, name),
        mtime: fs.existsSync(path.join(intentDir, name))
          ? fs.statSync(path.join(intentDir, name)).mtime.getTime()
          : 0
      }))
      .filter((item) => fs.existsSync(item.path))
      .sort((a, b) => b.mtime - a.mtime);

    if (candidates[0]?.path) {
      return candidates[0].path;
    }
  }

  const requirementsDir = path.join(repoRoot, 'devflow', 'requirements');
  if (!fs.existsSync(requirementsDir)) {
    return null;
  }

  const legacy = fs.readdirSync(requirementsDir)
    .map((name) => ({
      path: getCompatibilityStatusPath(repoRoot, name),
      mtime: fs.existsSync(path.join(requirementsDir, name))
        ? fs.statSync(path.join(requirementsDir, name)).mtime.getTime()
        : 0
    }))
    .filter((item) => fs.existsSync(item.path))
    .sort((a, b) => b.mtime - a.mtime);

  return legacy[0]?.path || null;
}

module.exports = {
  getTeamStatePath,
  getCompatibilityStatusPath,
  normalizeTeamState,
  fromCompatibilityStatus,
  toCompatibilityStatus,
  readTeamState,
  readTeamStateSync,
  writeTeamState,
  writeTeamStateSync,
  updateTeamState,
  updateTeamStateSync,
  buildInitialTeamState,
  findLatestTeamStatePath
};
