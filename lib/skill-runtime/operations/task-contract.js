/**
 * [INPUT]: 接收 repoRoot/changeId/changeKey，读取 planning/tasks.md。
 * [OUTPUT]: 对外提供 task-contract compile / validate / migrate，生成、检查、迁移最小 workflow artifacts。
 * [POS]: REQ-003 task-contract CLI operation 层。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { createTaskManifest } = require('../planner');
const fsp = require('fs/promises');
const path = require('path');
const { getChangePaths } = require('../paths');
const {
  extractTasksContractSummary,
  extractTasksRootCauseContract
} = require('../task-contract');
const {
  exists,
  ensureDir,
  getTaskManifestPath,
  getTasksMarkdownPath,
  readText,
  readJson,
  writeText,
  writeJson
} = require('../store');

const GENERATED_BY = 'cc-devflow task-contract';
const ACCEPTED_GENERATORS = new Set(['cc-devflow task-contract', 'skill:cc-plan']);
const PROFILE_BUDGETS = {
  tiny: 1200,
  standard: 2500,
  deep: 5000
};
const TASK_LINE = /^- \[[ xX]\]\s+(T\d{3})\b/;
const TASK_FIELD_LINE = /^\s{2,}([A-Za-z][A-Za-z /-]*):\s*(.*)$/;
const PLAN_TASK_REQUIRED_FIELDS = [
  'goal',
  'source funnel rounds',
  'contract',
  'do not re-decide',
  'artifact updates',
  'tdd phase',
  'files',
  'read first',
  'project postmortem search',
  'verification',
  'evidence',
  'completion',
  'ready when'
];
const ROOT_CAUSE_TASK_REQUIRED_FIELDS = [
  'goal',
  'root cause proof',
  'do not re-decide',
  'artifact updates',
  'tdd phase',
  'files',
  'read first',
  'project postmortem search',
  'verification',
  'evidence',
  'completion',
  'ready when'
];

function listField(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function buildSummaryChangeMeta(change, fields) {
  const contractChange = fields.change || change.changeKey;
  return {
    changeId: contractChange,
    requirementId: contractChange,
    goal: listField(fields.goal),
    acceptance: listField(fields.acceptance),
    specReference: {
      source: 'planning/tasks.md#contract-summary',
      change: contractChange,
      mode: fields.mode || '',
      profile: fields.profile || '',
      approval: fields.approval || ''
    },
    _meta: {
      generatedBy: GENERATED_BY,
      generatedAt: new Date().toISOString()
    }
  };
}

function buildRootCauseChangeMeta(change, fields) {
  const contractChange = fields.change || change.changeKey;
  return {
    changeId: contractChange,
    requirementId: contractChange,
    goal: listField(fields.rootCause || fields.symptom || `Repair confirmed root cause for ${contractChange}`),
    acceptance: [
      ...listField(fields.repairBoundary),
      ...listField(fields.verification)
    ],
    specReference: {
      source: 'planning/tasks.md#root-cause-contract',
      change: contractChange,
      mode: fields.mode || 'investigation',
      profile: fields.profile || '',
      approval: fields.diagnosis || ''
    },
    rootCause: {
      diagnosis: fields.diagnosis || '',
      symptom: listField(fields.symptom),
      reproduction: listField(fields.reproduction),
      confirmed: listField(fields.rootCause),
      repairBoundary: listField(fields.repairBoundary),
      prevention: listField(fields.prevention)
    },
    _meta: {
      generatedBy: GENERATED_BY,
      generatedAt: new Date().toISOString()
    }
  };
}

function extractCompileContract(tasksText) {
  const summary = extractTasksContractSummary(tasksText);
  if (summary.found) {
    return {
      type: 'summary',
      source: 'planning/tasks.md#contract-summary',
      fields: summary.fields
    };
  }

  const rootCause = extractTasksRootCauseContract(tasksText);
  if (rootCause.found) {
    return {
      type: 'root-cause',
      source: 'planning/tasks.md#root-cause-contract',
      fields: rootCause.fields
    };
  }

  return null;
}

function buildChangeMeta(change, contract) {
  if (contract.type === 'root-cause') {
    return buildRootCauseChangeMeta(change, contract.fields);
  }
  return buildSummaryChangeMeta(change, contract.fields);
}

function summarizeContractGoal(contract) {
  const fields = contract.fields || {};
  if (contract.type === 'root-cause') {
    return listField(fields.rootCause)[0] || listField(fields.symptom)[0] || '';
  }
  return listField(fields.goal)[0] || '';
}

async function relativeExists(change, relativePath) {
  return exists(path.join(change.changeDir, relativePath));
}

async function readJsonSafe(filePath) {
  try {
    return await readJson(filePath, null);
  } catch {
    return null;
  }
}

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function contractProfile(tasksText) {
  const contract = extractTasksContractSummary(tasksText);
  if (contract.found) return contract.fields.profile || 'standard';
  const rootCause = extractTasksRootCauseContract(tasksText);
  if (rootCause.found) return rootCause.fields.profile || 'standard';
  return 'standard';
}

function hasAnyContract(tasksText) {
  return extractTasksContractSummary(tasksText).found || extractTasksRootCauseContract(tasksText).found;
}

function normalizeTaskField(label) {
  return String(label || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function extractTaskBlocks(tasksText) {
  const blocks = [];
  let current = null;

  for (const line of String(tasksText || '').replace(/\r\n/g, '\n').split('\n')) {
    const taskMatch = line.match(TASK_LINE);
    if (taskMatch) {
      if (current) blocks.push(current);
      current = { id: taskMatch[1], fields: new Set() };
      continue;
    }

    if (!current) continue;
    const fieldMatch = line.match(TASK_FIELD_LINE);
    if (fieldMatch) {
      current.fields.add(normalizeTaskField(fieldMatch[1]));
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

function taskTemplateRequiredFields(contract) {
  return contract?.type === 'root-cause'
    ? ROOT_CAUSE_TASK_REQUIRED_FIELDS
    : PLAN_TASK_REQUIRED_FIELDS;
}

function validateTaskTemplateCompliance(tasksText, contract = extractCompileContract(tasksText)) {
  const blocks = extractTaskBlocks(tasksText);
  if (blocks.length === 0) {
    return 'planning/tasks.md has no executable task blocks';
  }

  const required = taskTemplateRequiredFields(contract);
  const missingByTask = blocks
    .map((block) => ({
      id: block.id,
      missing: required.filter((field) => !block.fields.has(field))
    }))
    .filter((block) => block.missing.length > 0);

  if (missingByTask.length === 0) return '';
  return `planning/tasks.md task template incomplete: ${missingByTask
    .map((block) => `${block.id} missing ${block.missing.join(', ')}`)
    .join('; ')}`;
}

function countTracerSlices(tasksText) {
  const matches = [...String(tasksText || '').matchAll(/Vertical slice:\s*([^\n]+)/gi)];
  if (matches.length > 0) {
    return new Set(matches.map((match) => match[1].trim())).size;
  }
  return [...String(tasksText || '').matchAll(/^- \[[ xX]\]\s+T\d{3}\b/gm)].length;
}

function quoteLegacyMarkdown(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n*$/, '')
    .split('\n')
    .map((line) => (line.length > 0 ? `> ${line}` : '>'))
    .join('\n');
}

function appendToSection(tasksText, heading, addition) {
  const lines = String(tasksText || '').replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex((line) => line.trimEnd() === heading);
  if (start === -1) return '';
  let end = start + 1;
  while (end < lines.length && !lines[end].startsWith('## ')) end += 1;
  return [...lines.slice(0, end), '', addition, '', ...lines.slice(end)].join('\n').replace(/\n*$/, '\n');
}

function insertAfterTitle(tasksText, section) {
  const lines = String(tasksText || '').replace(/\r\n/g, '\n').split('\n');
  if (!lines[0]?.startsWith('# ')) {
    return `${section}\n\n${String(tasksText || '').replace(/\n*$/, '\n')}`;
  }
  let tailStart = 1;
  while (lines[tailStart] === '') tailStart += 1;
  return [lines[0], '', section, '', ...lines.slice(tailStart)].join('\n').replace(/\n*$/, '\n');
}

function upsertContractSection(tasksText, heading, section, addition) {
  return appendToSection(tasksText, heading, addition) || insertAfterTitle(tasksText, section);
}

function legacyBlock(label, content) {
  return [`${label}:`, quoteLegacyMarkdown(content)].join('\n');
}

function designContractSection(change, content) {
  const block = legacyBlock('Legacy Design', content);
  return [
    '## Contract Summary',
    '',
    `Change: ${change.changeKey}`,
    'Mode: migrated',
    'Profile: standard',
    'Approval: migrated',
    '',
    'Goal:',
    '- Preserve the legacy planning contract inside tasks.md.',
    '',
    'Do Not Do:',
    '- Do not auto-run this migration during compile.',
    '',
    'Approved Direction:',
    '- Use tasks.md as the canonical human-authored contract after migration.',
    '',
    'Acceptance:',
    '- Legacy planning/design.md content is folded into this section.',
    '- planning/design.md is archived to assets/legacy/design.md.bak.',
    '',
    'Verification:',
    '',
    '```bash',
    'npm test -- -t "task-contract migrate"',
    '```',
    '',
    'Risk / Escalate If:',
    '- Review migrated content before deleting any legacy references.',
    '',
    block
  ].join('\n');
}

function analysisContractSection(change, content) {
  const block = legacyBlock('Legacy Analysis', content);
  return [
    '## Root Cause Contract',
    '',
    `Change: ${change.changeKey}`,
    'Mode: migrated',
    'Profile: standard',
    'Diagnosis: Migrated from legacy planning/analysis.md.',
    '',
    'Symptom:',
    '- Legacy investigation contract lived outside tasks.md.',
    '',
    'Reproduction:',
    '- Run task-contract migrate with --fold-analysis.',
    '',
    'Expected:',
    '- tasks.md owns the root-cause contract.',
    '',
    'Actual:',
    '- planning/analysis.md was the legacy contract file.',
    '',
    'Root Cause:',
    '- The pre-minimization workflow used a separate analysis.md artifact.',
    '',
    'Evidence Chain:',
    '- Migrated content is quoted below.',
    '',
    'Repair Boundary:',
    '- Archive only the requested legacy analysis file.',
    '',
    'Prevention:',
    '- Keep future root-cause contracts in tasks.md.',
    '',
    'Risk / Escalate If:',
    '- Review migrated content before deleting any legacy references.',
    '',
    block
  ].join('\n');
}

function firstViolation(violations) {
  if (violations.length === 0) {
    return {
      code: 0,
      ok: true,
      violations: [],
      stderr: ''
    };
  }
  const code = violations[0].exitCode;
  return {
    code,
    ok: false,
    violations,
    stderr: violations.map((violation) => `${violation.ruleId}: ${violation.message}`).join('\n')
  };
}

function budgetWarnings(tasksText) {
  const profile = contractProfile(tasksText);
  const budget = PROFILE_BUDGETS[profile] || PROFILE_BUDGETS.standard;
  const tokens = estimateTokens(tasksText);
  if (tokens <= budget) return [];
  return [{
    ruleId: 'C10',
    severity: 'warning',
    message: `tasks.md token estimate ${tokens} exceeds ${profile} advisory budget ${budget}`
  }];
}

const VALIDATE_RULES = [
  {
    id: 'C1',
    exitCode: 2,
    check: async ({ change }) => (await relativeExists(change, 'planning/design.md'))
      ? 'planning/design.md is a legacy default artifact'
      : ''
  },
  {
    id: 'C2',
    exitCode: 2,
    check: async ({ change }) => (await relativeExists(change, 'planning/analysis.md'))
      ? 'planning/analysis.md is a legacy default artifact'
      : ''
  },
  {
    id: 'C3',
    exitCode: 2,
    check: async ({ change }) => {
      const legacy = [];
      if (await relativeExists(change, 'review/cc-review-report.md')) legacy.push('review/cc-review-report.md');
      if (await relativeExists(change, 'review/cc-review-plan.md')) legacy.push('review/cc-review-plan.md');
      return legacy.length > 0 ? `legacy review Markdown exists: ${legacy.join(', ')}` : '';
    }
  },
  {
    id: 'C4',
    exitCode: 3,
    check: async ({ tasksText }) => hasAnyContract(tasksText)
      ? ''
      : 'planning/tasks.md is missing ## Contract Summary or ## Root Cause Contract'
  },
  {
    id: 'C5',
    exitCode: 3,
    check: async ({ manifestPath }) => {
      const manifest = await readJsonSafe(manifestPath);
      const generator = manifest?.metadata?.generatedBy || '';
      return ACCEPTED_GENERATORS.has(generator) ? '' : `task-manifest.json generatedBy is unknown: ${generator || '<missing>'}`;
    }
  },
  {
    id: 'C6',
    exitCode: 3,
    check: async ({ changeMetaPath }) => {
      const changeMeta = await readJsonSafe(changeMetaPath);
      const generator = changeMeta?._meta?.generatedBy || '';
      return ACCEPTED_GENERATORS.has(generator) ? '' : `change-meta.json _meta.generatedBy is unknown: ${generator || '<missing>'}`;
    }
  },
  {
    id: 'C7',
    exitCode: 4,
    check: async ({ tasksText }) => {
      const profile = contractProfile(tasksText);
      const slices = countTracerSlices(tasksText);
      return profile === 'tiny' && slices > 1 ? `tiny profile has ${slices} tracer slices` : '';
    }
  },
  {
    id: 'C8',
    exitCode: 5,
    check: async ({ change }) => {
      const ledgerPath = path.join(change.changeDir, 'review', 'review-ledger.jsonl');
      if (!(await exists(ledgerPath))) return '';
      const lines = (await readText(ledgerPath)).split(/\r?\n/).filter(Boolean);
      const missing = lines.some((line) => {
        try {
          return !JSON.parse(line).createdBy;
        } catch {
          return true;
        }
      });
      return missing ? 'review-ledger.jsonl has a row without createdBy' : '';
    }
  },
  {
    id: 'C9',
    exitCode: 5,
    check: async ({ change }) => {
      const reportPath = path.join(change.changeDir, 'review', 'report-card.json');
      if (!(await exists(reportPath))) return '';
      const report = await readJsonSafe(reportPath);
      const generator = report?._meta?.generatedBy || '';
      return ACCEPTED_GENERATORS.has(generator) ? '' : `report-card.json generatedBy is unknown: ${generator || '<missing>'}`;
    }
  },
  {
    id: 'C11',
    exitCode: 3,
    check: async ({ tasksText }) => validateTaskTemplateCompliance(tasksText)
  }
];

async function runCompile({
  repoRoot,
  changeId,
  changeKey,
  goal,
  overwrite = true
}) {
  const pathOptions = changeKey ? { changeKey } : {};
  const change = getChangePaths(repoRoot, changeId, pathOptions);
  const tasksPath = getTasksMarkdownPath(repoRoot, changeId, { changeKey: change.changeKey });

  if (!(await exists(tasksPath))) {
    return {
      code: 3,
      changeId,
      changeKey: change.changeKey,
      error: `Missing planning/tasks.md: ${tasksPath}`
    };
  }

  const tasksText = await readText(tasksPath);
  const contract = extractCompileContract(tasksText);
  if (!contract) {
    return {
      code: 3,
      changeId,
      changeKey: change.changeKey,
      error: `Missing ## Contract Summary or ## Root Cause Contract in planning/tasks.md: ${tasksPath}`
    };
  }

  const templateError = validateTaskTemplateCompliance(tasksText, contract);
  if (templateError) {
    return {
      code: 3,
      changeId,
      changeKey: change.changeKey,
      error: templateError
    };
  }

  await createTaskManifest({
    repoRoot,
    changeId,
    changeKey: change.changeKey,
    goal: goal || summarizeContractGoal(contract),
    overwrite
  });

  const manifestPath = getTaskManifestPath(repoRoot, changeId, { changeKey: change.changeKey });
  const changeMetaPath = path.join(change.changeDir, 'change-meta.json');
  const manifest = await readJson(manifestPath);
  const compiled = {
    ...manifest,
    metadata: {
      ...manifest.metadata,
      source: 'tasks.md',
      generatedBy: GENERATED_BY
    }
  };

  await writeJson(manifestPath, compiled);
  await writeJson(changeMetaPath, buildChangeMeta(change, contract));

  return {
    code: 0,
    changeId,
    changeKey: change.changeKey,
    manifestPath,
    changeMetaPath,
    metadata: compiled.metadata
  };
}

async function runValidate({ repoRoot, changeId, changeKey }) {
  const pathOptions = changeKey ? { changeKey } : {};
  const change = getChangePaths(repoRoot, changeId, pathOptions);
  const tasksPath = getTasksMarkdownPath(repoRoot, changeId, { changeKey: change.changeKey });
  const manifestPath = getTaskManifestPath(repoRoot, changeId, { changeKey: change.changeKey });
  const changeMetaPath = path.join(change.changeDir, 'change-meta.json');
  const tasksText = await readText(tasksPath);
  const context = { change, tasksPath, manifestPath, changeMetaPath, tasksText };
  const violations = [];

  for (const rule of VALIDATE_RULES) {
    const message = await rule.check(context);
    if (message) {
      violations.push({ ruleId: rule.id, exitCode: rule.exitCode, message });
    }
  }

  return {
    ...firstViolation(violations),
    changeId,
    changeKey: change.changeKey,
    warnings: budgetWarnings(tasksText)
  };
}

async function prepareLegacyFold(change, tasksText, config) {
  const sourcePath = path.join(change.changeDir, 'planning', config.fileName);
  if (!(await exists(sourcePath))) {
    return { code: 3, error: `Missing planning/${config.fileName}: ${sourcePath}` };
  }

  let legacyText;
  try {
    legacyText = await readText(sourcePath);
  } catch (error) {
    return { code: 4, error: `Unable to read planning/${config.fileName}: ${error.message}` };
  }

  const archivePath = path.join(change.changeDir, 'assets', 'legacy', `${config.fileName}.bak`);
  if (await exists(archivePath)) {
    return { code: 4, error: `Legacy archive already exists: ${archivePath}` };
  }

  return {
    code: 0,
    fileName: config.fileName,
    sourcePath,
    archivePath,
    tasksText: upsertContractSection(
      tasksText,
      config.heading,
      config.section(change, legacyText),
      legacyBlock(config.label, legacyText)
    )
  };
}

async function runMigrate({
  repoRoot,
  changeId,
  changeKey,
  foldDesign = false,
  foldAnalysis = false
}) {
  if (!foldDesign && !foldAnalysis) {
    return {
      code: 3,
      changeId,
      changeKey,
      error: 'task-contract migrate requires --fold-design and/or --fold-analysis'
    };
  }

  const pathOptions = changeKey ? { changeKey } : {};
  const change = getChangePaths(repoRoot, changeId, pathOptions);
  const tasksPath = getTasksMarkdownPath(repoRoot, changeId, { changeKey: change.changeKey });
  if (!(await exists(tasksPath))) {
    return {
      code: 3,
      changeId,
      changeKey: change.changeKey,
      error: `Missing planning/tasks.md: ${tasksPath}`
    };
  }

  let tasksText = await readText(tasksPath);
  const folds = [];
  if (foldDesign) {
    folds.push({
      fileName: 'design.md',
      heading: '## Contract Summary',
      label: 'Legacy Design',
      section: designContractSection
    });
  }
  if (foldAnalysis) {
    folds.push({
      fileName: 'analysis.md',
      heading: '## Root Cause Contract',
      label: 'Legacy Analysis',
      section: analysisContractSection
    });
  }

  const prepared = [];
  for (const fold of folds) {
    const result = await prepareLegacyFold(change, tasksText, fold);
    if (result.code !== 0) {
      return { ...result, changeId, changeKey: change.changeKey };
    }
    tasksText = result.tasksText;
    prepared.push(result);
  }

  await writeText(tasksPath, tasksText);
  for (const fold of prepared) {
    await ensureDir(path.dirname(fold.archivePath));
    await fsp.rename(fold.sourcePath, fold.archivePath);
  }

  return {
    code: 0,
    changeId,
    changeKey: change.changeKey,
    tasksPath,
    migrated: prepared.map((fold) => fold.fileName),
    archives: prepared.map((fold) => fold.archivePath)
  };
}

module.exports = {
  GENERATED_BY,
  runCompile,
  runValidate,
  runMigrate
};
