/**
 * [INPUT]: 依赖 fs/path，接收 repoRoot/changeId/taskId/workerId 等定位参数。
 * [OUTPUT]: 对外提供 devflow canonical layout 的唯一路径解析能力。
 * [POS]: skill runtime 的路径真相源，统一收口所有输出目录命名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

function slugifySegment(value, fallback = 'change') {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, ' ')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function getChangeKeyPrefix(changeId) {
  return slugifySegment(changeId, 'change');
}

function stripChangeIdPrefix(changeId, value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const prefixes = Array.from(new Set([String(changeId || '').trim(), getChangeKeyPrefix(changeId)]))
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
  const legacyPrefix = `${changeId}-`;
  const canonicalPrefix = `${getChangeKeyPrefix(changeId)}-`;

  return listChangeKeys(repoRoot).find((name) => (
    name === changeId
    || name === getChangeKeyPrefix(changeId)
    || name.startsWith(legacyPrefix)
    || name.startsWith(canonicalPrefix)
  )) || null;
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

  const legacyPrefix = `${changeId}-`;
  if (String(changeKey || '').startsWith(legacyPrefix)) {
    return changeKey.slice(legacyPrefix.length);
  }

  return String(changeKey || '').trim();
}

function resolveChangeKey(repoRoot, changeId, options = {}) {
  if (options.changeKey) {
    return options.changeKey;
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
