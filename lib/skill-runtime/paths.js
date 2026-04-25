/**
 * [INPUT]: 依赖 fs/path，接收 repoRoot/changeId/taskId/workerId 等定位参数。
 * [OUTPUT]: 对外提供 devflow canonical layout 的唯一路径解析能力。
 * [POS]: skill runtime 的路径真相源，强制新 change 目录使用 REQ/FIX 前缀。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

const CHANGE_ID_PATTERN = /^(REQ|FIX)-\d+$/;

function slugifySegment(value, fallback = 'change') {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function assertChangeId(changeId) {
  const value = String(changeId || '').trim();
  if (!CHANGE_ID_PATTERN.test(value)) {
    throw new Error(
      `Invalid changeId "${value}". Use REQ-<number> or FIX-<number>.`
    );
  }

  return value;
}

function getChangeKeyPrefix(changeId) {
  return assertChangeId(changeId);
}

function stripChangeIdPrefix(changeId, value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const prefixes = Array.from(new Set([
    String(changeId || '').trim(),
    getChangeKeyPrefix(changeId),
    slugifySegment(changeId, 'change')
  ]))
    .filter(Boolean)
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  for (const prefix of prefixes) {
    const stripped = text.replace(new RegExp(`^${prefix}[\\s:._-]*`, 'i'), '').trim();
    if (stripped !== text) {
      return stripped;
    }
  }

  return text;
}

function getDevflowRoot(repoRoot) {
  return path.join(repoRoot, 'devflow');
}

function getChangesRoot(repoRoot) {
  return path.join(getDevflowRoot(repoRoot), 'changes');
}

function getWorkspacesRoot(repoRoot) {
  return path.join(getDevflowRoot(repoRoot), 'workspaces');
}

function listChangeKeys(repoRoot) {
  const changesRoot = getChangesRoot(repoRoot);
  if (!fs.existsSync(changesRoot)) {
    return [];
  }

  return fs.readdirSync(changesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function findExistingChangeKey(repoRoot, changeId) {
  const canonicalPrefix = `${getChangeKeyPrefix(changeId)}-`;
  const legacyKey = slugifySegment(changeId, 'change');
  const legacyPrefix = `${legacyKey}-`;

  return listChangeKeys(repoRoot).find((name) => (
    name === changeId
    || name === legacyKey
    || name.startsWith(canonicalPrefix)
    || name.startsWith(legacyPrefix)
  )) || null;
}

function assertChangeKey(changeId, changeKey) {
  const key = String(changeKey || '').trim();
  const prefix = `${getChangeKeyPrefix(changeId)}-`;
  if (!key.startsWith(prefix)) {
    throw new Error(`Invalid changeKey "${key}". Expected ${prefix}<description>.`);
  }

  return key;
}

function buildChangeKey(changeId, options = {}) {
  const rawSlug = options.slug || stripChangeIdPrefix(changeId, options.goal) || 'change';
  return `${getChangeKeyPrefix(changeId)}-${slugifySegment(rawSlug, 'change')}`;
}

function getChangeSlug(changeId, changeKey) {
  const canonicalPrefix = `${getChangeKeyPrefix(changeId)}-`;
  if (String(changeKey || '').startsWith(canonicalPrefix)) {
    return changeKey.slice(canonicalPrefix.length);
  }

  const legacyPrefix = `${slugifySegment(changeId, 'change')}-`;
  if (String(changeKey || '').startsWith(legacyPrefix)) {
    return changeKey.slice(legacyPrefix.length);
  }

  return String(changeKey || '').trim();
}

function resolveChangeKey(repoRoot, changeId, options = {}) {
  if (options.changeKey) {
    return assertChangeKey(changeId, options.changeKey);
  }

  const existing = findExistingChangeKey(repoRoot, changeId);
  if (existing) {
    return existing;
  }

  return buildChangeKey(changeId, options);
}

function getChangePaths(repoRoot, changeId, options = {}) {
  const changeKey = resolveChangeKey(repoRoot, changeId, options);
  const changeDir = path.join(getChangesRoot(repoRoot), changeKey);
  const metaDir = path.join(changeDir, 'meta');
  const planningDir = path.join(changeDir, 'planning');
  const executionDir = path.join(changeDir, 'execution');
  const reviewDir = path.join(changeDir, 'review');
  const handoffDir = path.join(changeDir, 'handoff');

  return {
    changeId,
    changeKey,
    changeDir,
    metaDir,
    planningDir,
    executionDir,
    reviewDir,
    handoffDir,
    tasksDir: path.join(executionDir, 'tasks'),
    workersDir: path.join(executionDir, 'workers'),
    workspacesDir: path.join(getWorkspacesRoot(repoRoot), changeKey)
  };
}

function getTaskPaths(repoRoot, changeId, taskId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  const taskDir = path.join(change.tasksDir, taskId);

  return {
    ...change,
    taskId,
    taskDir,
    checkpointPath: path.join(taskDir, 'checkpoint.json'),
    eventsPath: path.join(taskDir, 'events.jsonl')
  };
}

function getWorkerPaths(repoRoot, changeId, workerId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  const workspacePath = path.join(change.workspacesDir, workerId);
  const workerDir = path.join(workspacePath, '.runtime');

  return {
    ...change,
    workerId,
    workerDir,
    sharedRuntimeDir: path.join(change.workspacesDir, '.runtime'),
    assignmentPath: path.join(workerDir, 'assignment.md'),
    promptPath: path.join(workerDir, 'prompt.md'),
    launchPath: path.join(workerDir, 'launch.md'),
    statePath: path.join(workerDir, 'state.md'),
    journalPath: path.join(workerDir, 'journal.md'),
    sessionLogPath: path.join(workerDir, 'session.log'),
    workspacePath
  };
}

module.exports = {
  CHANGE_ID_PATTERN,
  slugifySegment,
  getChangeKeyPrefix,
  getChangeSlug,
  getDevflowRoot,
  getChangesRoot,
  getWorkspacesRoot,
  resolveChangeKey,
  buildChangeKey,
  getChangePaths,
  getTaskPaths,
  getWorkerPaths
};
