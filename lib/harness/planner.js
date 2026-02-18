/**
 * [INPUT]: 依赖 store 读取 TASKS.md 与输出路径，依赖 schemas 校验 manifest。
 * [OUTPUT]: 对外提供 TASKS.md → task-manifest.json 的解析与生成能力。
 * [POS]: harness 计划编排层，被 operations/plan 直接调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readText,
  readJson,
  writeJson,
  exists,
  getTaskManifestPath,
  getTasksMarkdownPath
} = require('./store');
const { parseManifest } = require('./schemas');

const TASK_LINE = /^- \[( |x|X)\]\s+(T\d{3})\s*(.*)$/;
const TRAILING_PATHS = /\(([^)]+)\)\s*$/;
const DEPENDS_TAG = /dependsOn:([A-Za-z0-9_,-]+)/i;

function normalizeTitle(rawTitle) {
  return rawTitle
    .replace(/\[P\]/g, '')
    .replace(DEPENDS_TAG, '')
    .trim();
}

function parseTouches(rawTail) {
  const match = rawTail.match(TRAILING_PATHS);
  if (!match) {
    return [];
  }

  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDependsOn(rawTail, fallbackDependsOn, isParallel) {
  const explicit = rawTail.match(DEPENDS_TAG);
  if (explicit) {
    return explicit[1]
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (isParallel || !fallbackDependsOn) {
    return [];
  }

  return [fallbackDependsOn];
}

function parseTasksMarkdown(content) {
  const lines = content.split(/\r?\n/);
  const tasks = [];
  let previousTaskId = null;

  for (const line of lines) {
    const match = line.match(TASK_LINE);
    if (!match) {
      continue;
    }

    const [, doneMark, taskId, tail] = match;
    const isParallel = /\[P\]/.test(tail);
    const touches = parseTouches(tail);
    const dependsOn = parseDependsOn(tail, previousTaskId, isParallel);
    const title = normalizeTitle(tail).replace(TRAILING_PATHS, '').trim() || `Task ${taskId}`;

    tasks.push({
      id: taskId,
      title,
      dependsOn,
      touches,
      run: [`echo "[TASK ${taskId}] ${title}"`],
      checks: [],
      status: doneMark.toLowerCase() === 'x' ? 'passed' : 'pending',
      attempts: 0,
      maxRetries: 1
    });

    previousTaskId = taskId;
  }

  return tasks;
}

function buildDefaultTasks(changeId) {
  return [
    {
      id: 'T001',
      title: `Bootstrap ${changeId}`,
      dependsOn: [],
      touches: [],
      run: [`echo "[TASK T001] Bootstrap ${changeId}"`],
      checks: [],
      status: 'pending',
      attempts: 0,
      maxRetries: 1
    }
  ];
}

async function createTaskManifest({ repoRoot, changeId, goal, overwrite = false }) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);

  if (!overwrite && (await exists(manifestPath))) {
    const existing = await readJson(manifestPath);
    return parseManifest(existing);
  }

  const tasksPath = getTasksMarkdownPath(repoRoot, changeId);
  const hasTasksFile = await exists(tasksPath);
  const rawTasks = hasTasksFile ? parseTasksMarkdown(await readText(tasksPath)) : [];
  const tasks = rawTasks.length > 0 ? rawTasks : buildDefaultTasks(changeId);

  const manifest = parseManifest({
    changeId,
    goal: goal || `Deliver ${changeId} safely with auditable checkpoints.`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    tasks,
    metadata: {
      source: hasTasksFile ? 'TASKS.md' : 'default',
      generatedBy: 'harness:plan'
    }
  });

  await writeJson(manifestPath, manifest);
  return manifest;
}

module.exports = {
  parseTasksMarkdown,
  createTaskManifest
};
