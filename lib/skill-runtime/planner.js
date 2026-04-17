/**
 * [INPUT]: 依赖 store 读取 TASKS.md 与输出路径，依赖 schemas 校验 manifest。
 * [OUTPUT]: 对外提供 TASKS.md → task-manifest.json 的解析与生成能力。
 * [POS]: skill runtime 计划编排层，被 operations/plan 直接调用。
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
const PHASE_HEADING = /^##\s+Phase\s+(\d+)\s*:/i;
const FIELD_LINE = /^\s{2,}([A-Za-z ]+):\s*(.*)$/;

function normalizeTitle(rawTitle) {
  return rawTitle
    .replace(/\[P\]/g, '')
    .replace(DEPENDS_TAG, '')
    .replace(/`[^`]+`/g, '')
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

function parseInlineCodeRefs(rawText) {
  const refs = [];
  const pattern = /`([^`]+)`/g;
  let match;

  while ((match = pattern.exec(rawText)) !== null) {
    const value = match[1].trim();
    if (!value || value.includes('&&') || value.includes('--') || value.includes(' ')) {
      continue;
    }
    refs.push(value);
  }

  return refs;
}

function parseCsvLike(rawText) {
  return String(rawText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseFieldValues(rawValue) {
  const inlineRefs = parseInlineCodeRefs(rawValue);
  if (inlineRefs.length > 0) {
    return inlineRefs;
  }

  return parseCsvLike(
    String(rawValue || '')
      .replace(/`/g, '')
      .replace(/\s*\+\s*/g, ', ')
  );
}

function applyTaskField(task, label, value) {
  const normalizedLabel = label.trim().toLowerCase();

  if (normalizedLabel === 'goal') {
    const goal = value.trim();
    if (goal) {
      task.acceptance.push(goal);
      task.context.notes.push(goal);
    }
    return;
  }

  if (normalizedLabel === 'files') {
    const files = parseFieldValues(value);
    task.files.push(...files);
    task.touches.push(...files);
    return;
  }

  if (normalizedLabel === 'read first') {
    task.context.readFiles.push(...parseFieldValues(value));
    return;
  }

  if (normalizedLabel === 'verification') {
    const verification = value.trim();
    if (verification) {
      task.verification.push(verification);
      task.checks.push(verification);
      task.context.commands.push(verification);
    }
    return;
  }

  if (normalizedLabel === 'evidence') {
    task.evidence.push(...parseCsvLike(value));
  }
}

function dedupeList(values) {
  return [...new Set(values.filter(Boolean))];
}

function pickPrimaryTestTarget(task) {
  return [...(task.files || []), ...(task.touches || [])].find((item) => /\.test\./i.test(item)) || '';
}

function enrichTaskMetadata(task) {
  const primaryTestTarget = pickPrimaryTestTarget(task);

  if (task.acceptance.length === 0) {
    if (task.type === 'TEST') {
      task.acceptance.push(`Prove ${extractFeatureName(task.title) || task.title} fails before implementation`);
    } else if (task.type === 'IMPL') {
      task.acceptance.push(`Make ${extractFeatureName(task.title) || task.title} pass with the smallest implementation`);
    }
  }

  if (task.verification.length === 0) {
    if (primaryTestTarget) {
      task.verification.push(`npm test -- ${primaryTestTarget}`);
    } else if (task.type !== 'OTHER') {
      task.verification.push(`echo "verify ${task.id}"`);
    }
  }

  if (task.evidence.length === 0) {
    if (task.type === 'TEST') {
      task.evidence.push('failing test output');
    } else if (task.type === 'IMPL') {
      task.evidence.push('passing test output');
    }
  }

  if (task.context.readFiles.length === 0) {
    task.context.readFiles.push('DESIGN.md');
    if (task.type === 'TEST') {
      task.context.readFiles.push('TASKS.md');
    }
    if (primaryTestTarget && !task.context.readFiles.includes(primaryTestTarget)) {
      task.context.readFiles.push(primaryTestTarget);
    }
  }

  if (task.context.commands.length === 0) {
    task.context.commands.push(...task.verification);
  }
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
  let currentPhase = 1;
  let currentTask = null;

  function finalizeTask(task) {
    if (!task) {
      return;
    }

    task.touches = dedupeList(task.touches);
    task.files = dedupeList(task.files);
    task.checks = dedupeList(task.checks);
    task.acceptance = dedupeList(task.acceptance);
    task.verification = dedupeList(task.verification);
    task.evidence = dedupeList(task.evidence);
    task.context.readFiles = dedupeList(task.context.readFiles);
    task.context.commands = dedupeList(task.context.commands);
    task.context.notes = dedupeList(task.context.notes);
    enrichTaskMetadata(task);
    task.acceptance = dedupeList(task.acceptance);
    task.verification = dedupeList(task.verification);
    task.evidence = dedupeList(task.evidence);
    task.context.readFiles = dedupeList(task.context.readFiles);
    task.context.commands = dedupeList(task.context.commands);
    tasks.push(task);
    previousTaskId = task.id;
  }

  for (const line of lines) {
    const phaseMatch = line.match(PHASE_HEADING);
    if (phaseMatch) {
      currentPhase = Number(phaseMatch[1]);
      continue;
    }

    const match = line.match(TASK_LINE);
    if (match) {
      finalizeTask(currentTask);

      const [, doneMark, taskId, tail] = match;
      const isParallel = /\[P\]/.test(tail);
      const inlineFiles = parseInlineCodeRefs(tail);
      const touches = [...parseTouches(tail), ...inlineFiles];
      const dependsOn = parseDependsOn(tail, previousTaskId, isParallel);
      const title = normalizeTitle(tail).replace(TRAILING_PATHS, '').trim() || `Task ${taskId}`;

      // 提取任务类型 [TEST] 或 [IMPL]
      const taskType = extractTaskType(title);

      currentTask = {
        id: taskId,
        title,
        type: taskType,
        phase: currentPhase,
        parallel: isParallel,
        dependsOn,
        touches,
        files: inlineFiles,
        run: [`echo "[TASK ${taskId}] ${title}"`],
        checks: [],
        acceptance: [],
        verification: [],
        evidence: [],
        context: {
          readFiles: [],
          commands: [],
          notes: []
        },
        reviews: {
          spec: 'pending',
          code: 'pending'
        },
        status: doneMark.toLowerCase() === 'x' ? 'passed' : 'pending',
        attempts: 0,
        maxRetries: 1
      };
      continue;
    }

    if (!currentTask) {
      continue;
    }

    const fieldMatch = line.match(FIELD_LINE);
    if (fieldMatch) {
      applyTaskField(currentTask, fieldMatch[1], fieldMatch[2]);
      continue;
    }
  }

  finalizeTask(currentTask);

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
      type: 'OTHER',
      phase: 1,
      parallel: false,
      dependsOn: [],
      touches: [],
      files: [],
      run: [`echo "[TASK T001] Bootstrap ${changeId}"`],
      checks: [],
      acceptance: ['Bootstrap the requirement workspace'],
      verification: ['echo "[TASK T001] Bootstrap complete"'],
      evidence: ['bootstrap output'],
      context: {
        readFiles: ['TASKS.md', 'DESIGN.md'],
        commands: ['echo "[TASK T001] Bootstrap complete"'],
        notes: ['Default bootstrap task created because TASKS.md was missing']
      },
      reviews: {
        spec: 'pending',
        code: 'pending'
      },
      status: 'pending',
      attempts: 0,
      maxRetries: 1
    }
  ];
}

function deriveManifestExecutionState(tasks) {
  const doneStates = new Set(['passed', 'completed', 'done', 'verified']);
  const unfinished = tasks.filter((task) => !doneStates.has(task.status));

  if (unfinished.length === 0) {
    return {
      currentTaskId: null,
      activePhase: null
    };
  }

  const activePhase = Math.min(...unfinished.map((task) => task.phase || 1));
  const completedIds = new Set(tasks.filter((task) => doneStates.has(task.status)).map((task) => task.id));
  const currentTask = unfinished.find((task) => {
    if ((task.phase || 1) !== activePhase) {
      return false;
    }

    return (task.dependsOn || []).every((depId) => completedIds.has(depId));
  });

  return {
    currentTaskId: currentTask ? currentTask.id : null,
    activePhase
  };
}

function applyManifestExecutionState(manifest, updatedAt = nowIso()) {
  const executionState = deriveManifestExecutionState(manifest.tasks || []);
  manifest.currentTaskId = executionState.currentTaskId;
  manifest.activePhase = executionState.activePhase;
  manifest.updatedAt = updatedAt;
  return manifest;
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
  const manifest = applyManifestExecutionState({
    changeId,
    goal: goal || `Deliver ${changeId} safely with auditable checkpoints.`,
    createdAt: previous?.createdAt || nowIso(),
    updatedAt: nowIso(),
    currentTaskId: null,
    activePhase: null,
    tasks,
    metadata: {
      source: hasTasksFile ? 'TASKS.md' : 'default',
      generatedBy: 'skill:cc-plan',
      planVersion: previousPlanVersion > 0 ? previousPlanVersion + 1 : 1
    }
  });

  const parsedManifest = parseManifest(manifest);

  await writeJson(manifestPath, parsedManifest);
  return parsedManifest;
}

module.exports = {
  parseTasksMarkdown,
  deriveManifestExecutionState,
  applyManifestExecutionState,
  createTaskManifest
};
