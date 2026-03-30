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

    // 提取任务类型 [TEST] 或 [IMPL]
    const taskType = extractTaskType(title);

    tasks.push({
      id: taskId,
      title,
      type: taskType,
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

  // TDD 顺序验证 (Constitution Article VI)
  validateTDDOrder(tasks);

  return tasks;
}

function extractTaskType(title) {
  if (/\[TEST\]/i.test(title)) {
    return 'TEST';
  }
  if (/\[IMPL\]/i.test(title)) {
    return 'IMPL';
  }
  return 'OTHER';
}

/**
 * TDD 顺序验证 (Constitution Article VI)
 *
 * 规则:
 * 1. 每个 [IMPL] 任务必须有对应的 [TEST] 任务
 * 2. [IMPL] 任务必须依赖对应的 [TEST] 任务 (通过 dependsOn)
 * 3. [TEST] 任务不能依赖 [IMPL] 任务
 *
 * @param {Array} tasks - 任务列表
 * @throws {Error} - TDD 顺序违规时抛出错误
 */
function validateTDDOrder(tasks) {
  const violations = [];
  const testTasks = tasks.filter(t => t.type === 'TEST');
  const implTasks = tasks.filter(t => t.type === 'IMPL');

  // 为每个 IMPL 任务查找对应的 TEST 任务
  for (const implTask of implTasks) {
    // 提取功能名称 (去除 [IMPL] 标记后的主要描述)
    const implFeature = extractFeatureName(implTask.title);

    // 查找匹配的 TEST 任务 (使用模糊匹配)
    const matchingTest = testTasks.find(testTask => {
      const testFeature = extractFeatureName(testTask.title);
      // 模糊匹配：检查是否包含相同的核心关键词
      return isSimilarFeature(testFeature, implFeature);
    });

    if (!matchingTest) {
      violations.push(
        `Task ${implTask.id} (${implTask.title}) missing corresponding TEST task. ` +
        `Constitution Article VI requires: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST.`
      );
      continue;
    }

    // 检查依赖关系
    if (!implTask.dependsOn.includes(matchingTest.id)) {
      violations.push(
        `Task ${implTask.id} (${implTask.title}) must depend on ${matchingTest.id} (${matchingTest.title}). ` +
        `TDD violation: Implementation must come AFTER test.`
      );
    }
  }

  // 检查 TEST 任务不能依赖 IMPL 任务
  for (const testTask of testTasks) {
    const implDeps = testTask.dependsOn.filter(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.type === 'IMPL';
    });

    if (implDeps.length > 0) {
      violations.push(
        `Task ${testTask.id} (${testTask.title}) depends on IMPL tasks: ${implDeps.join(', ')}. ` +
        `TDD violation: Tests must be written BEFORE implementation.`
      );
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `TDD Order Validation Failed (Constitution Article VI):\n\n` +
      violations.map((v, i) => `${i + 1}. ${v}`).join('\n\n') +
      `\n\nFix TASKS.md to follow TDD sequence: [TEST] tasks BEFORE [IMPL] tasks.`
    );
  }
}

/**
 * 从任务标题中提取功能名称
 * 例如: "[TEST] 用户登录功能" -> "用户登录功能"
 *       "[IMPL] 用户登录功能" -> "用户登录功能"
 */
function extractFeatureName(title) {
  return title
    .replace(/\[TEST\]/gi, '')
    .replace(/\[IMPL\]/gi, '')
    .replace(/\[P\]/gi, '')
    .replace(/\(dependsOn:[^)]*\)/gi, '')
    .replace(/\([^)]*\)/g, '')
    .trim();
}

/**
 * 判断两个功能名称是否相似
 * 使用核心关键词匹配策略
 */
function isSimilarFeature(feature1, feature2) {
  // 提取核心关键词 (去除常见后缀如"测试"、"实现"、"功能"等)
  const normalize = (str) => str
    .replace(/测试$/g, '')
    .replace(/实现$/g, '')
    .replace(/功能$/g, '')
    .replace(/开发$/g, '')
    .replace(/编写$/g, '')
    .trim();

  const core1 = normalize(feature1);
  const core2 = normalize(feature2);

  // 精确匹配
  if (core1 === core2) {
    return true;
  }

  // 包含匹配 (较长的包含较短的)
  if (core1.length > core2.length) {
    return core1.includes(core2);
  } else {
    return core2.includes(core1);
  }
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
  const previous = await readJson(manifestPath, null);

  if (!overwrite && (await exists(manifestPath))) {
    return parseManifest(previous);
  }

  const tasksPath = getTasksMarkdownPath(repoRoot, changeId);
  const hasTasksFile = await exists(tasksPath);
  const rawTasks = hasTasksFile ? parseTasksMarkdown(await readText(tasksPath)) : [];
  const tasks = rawTasks.length > 0 ? rawTasks : buildDefaultTasks(changeId);
  const previousPlanVersion = previous?.metadata?.planVersion || 0;

  const manifest = parseManifest({
    changeId,
    goal: goal || `Deliver ${changeId} safely with auditable checkpoints.`,
    createdAt: previous?.createdAt || nowIso(),
    updatedAt: nowIso(),
    tasks,
    metadata: {
      source: hasTasksFile ? 'TASKS.md' : 'default',
      generatedBy: 'harness:plan',
      planVersion: previousPlanVersion > 0 ? previousPlanVersion + 1 : 1
    }
  });

  await writeJson(manifestPath, manifest);
  return manifest;
}

module.exports = {
  parseTasksMarkdown,
  createTaskManifest
};
