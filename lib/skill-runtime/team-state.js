/**
 * [INPUT]: 依赖 canonical path/store 的文件读写能力，接收 repoRoot/changeId 以维护 Team 真相源。
 * [OUTPUT]: 对外提供 Team state 真相源路径与读写能力。
 * [POS]: skill runtime 的 Team 状态桥接层，让 delegate/team runtime 统一落到 devflow/changes。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const { ensureDir, readJson, writeJson, nowIso } = require('./store');
const { getChangePaths } = require('./paths');

function getTeamStatePath(repoRoot, changeId) {
  return path.join(getChangePaths(repoRoot, changeId).executionDir, 'team-state.json');
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
      kind: 'skill-runtime-autopilot',
      derivedFrom: 'devflow/changes'
    },
    team: payload.team || null,
    ralphLoop: payload.ralphLoop || undefined
  };
}

async function readTeamState(repoRoot, changeId) {
  const truth = await readJson(getTeamStatePath(repoRoot, changeId), null);
  return truth?.team ? normalizeTeamState(changeId, truth) : null;
}

async function writeTeamState(repoRoot, changeId, payload) {
  const next = normalizeTeamState(changeId, payload);
  const truthPath = getTeamStatePath(repoRoot, changeId);
  await ensureDir(path.dirname(truthPath));
  await writeJson(truthPath, next);

  return next;
}

async function updateTeamState(repoRoot, changeId, updater) {
  const current = (await readTeamState(repoRoot, changeId)) || normalizeTeamState(changeId, {});
  const nextPayload = await updater(current);
  if (!nextPayload) {
    return current;
  }
  return writeTeamState(repoRoot, changeId, nextPayload);
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
      kind: 'skill-runtime-autopilot',
      derivedFrom: 'devflow/changes'
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
  const changesRoot = path.join(repoRoot, 'devflow', 'changes');
  if (!fs.existsSync(changesRoot)) {
    return null;
  }

  const candidates = fs.readdirSync(changesRoot)
    .map((name) => ({
      path: path.join(changesRoot, name, 'execution', 'team-state.json'),
      mtime: fs.existsSync(path.join(changesRoot, name))
        ? fs.statSync(path.join(changesRoot, name)).mtime.getTime()
        : 0
    }))
    .filter((item) => fs.existsSync(item.path))
    .sort((a, b) => b.mtime - a.mtime);

  return candidates[0]?.path || null;
}

module.exports = {
  getTeamStatePath,
  normalizeTeamState,
  readTeamState,
  writeTeamState,
  updateTeamState,
  buildInitialTeamState,
  findLatestTeamStatePath
};
