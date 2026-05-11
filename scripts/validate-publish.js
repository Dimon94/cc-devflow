const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const matter = require('gray-matter');
const { validateSkillInventory } = require('../lib/compiler/inventory');

const ROOT = path.resolve(__dirname, '..');
const DISTRIBUTION_CONFIG = require(path.join(ROOT, 'config', 'distributable-skills.json'));
const PUBLIC_SKILLS = DISTRIBUTION_CONFIG.publicSkills || [];
const DISTRIBUTED_SKILLS = DISTRIBUTION_CONFIG.distributedSkills || PUBLIC_SKILLS;
const INTERNAL_SKILLS = DISTRIBUTION_CONFIG.internalSkills || [];

function statType(stat) {
  if (stat.isFile()) {
    return 'file';
  }
  if (stat.isDirectory()) {
    return 'dir';
  }
  return 'other';
}

function ensurePath(relPath, expectedType, errors) {
  const target = path.join(ROOT, relPath);

  if (!fs.existsSync(target)) {
    errors.push(`Missing ${expectedType}: ${relPath}`);
    return;
  }

  const actualType = statType(fs.statSync(target));
  if (actualType !== expectedType) {
    errors.push(`Expected ${expectedType} but found ${actualType}: ${relPath}`);
  }
}

function ensureArrayIncludes(list, value, errors, label) {
  if (!Array.isArray(list)) {
    errors.push(`${label} must be an array`);
    return;
  }

  if (!list.includes(value)) {
    errors.push(`${label} missing: ${value}`);
  }
}

function validatePackageJson(errors) {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.bin || typeof pkg.bin !== 'object') {
    errors.push('package.json missing bin field');
    return;
  }

  const binPath = pkg.bin['cc-devflow'];
  if (!binPath) {
    errors.push('package.json bin missing cc-devflow entry');
  } else {
    ensurePath(binPath, 'file', errors);
  }

  if (pkg.main !== 'bin/cc-devflow.js') {
    errors.push('package.json main must be "bin/cc-devflow.js"');
  }

  if (pkg.license !== 'MIT') {
    errors.push('package.json license must be "MIT"');
  }

  if (pkg.private === true) {
    errors.push('package.json should not be private when restoring the distributable CLI');
  }

  if (pkg.publishConfig?.access !== 'public') {
    errors.push('package.json publishConfig.access must be "public"');
  }

  const scripts = pkg.scripts || {};
  if (scripts.prepublishOnly !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.prepublishOnly must be "node scripts/validate-publish.js"');
  }
  if (scripts['verify:examples'] !== 'bash docs/examples/scripts/check-example-bindings.sh') {
    errors.push('package.json scripts.verify:examples must run the example bindings check');
  }
  if (scripts['verify:publish'] !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.verify:publish must be "node scripts/validate-publish.js"');
  }
  if (typeof scripts.verify !== 'string' || !scripts.verify.includes('npm run verify:examples')) {
    errors.push('package.json scripts.verify must include "npm run verify:examples"');
  }

  ensureArrayIncludes(pkg.files, 'bin/', errors, 'package.json files');
  ensureArrayIncludes(pkg.files, 'lib/', errors, 'package.json files');
  ensureArrayIncludes(pkg.files, 'config/', errors, 'package.json files');
  ensureArrayIncludes(pkg.files, 'docs/assets/', errors, 'package.json files');
  for (const skillName of DISTRIBUTED_SKILLS) {
    ensureArrayIncludes(pkg.files, `.claude/skills/${skillName}/`, errors, 'package.json files');
  }

  if (pkg.files.includes('.claude/skills/')) {
    errors.push('package.json files should not include broad ".claude/skills/" entry');
  }
}

function validateTemplate(errors) {
  ensurePath('.claude', 'dir', errors);
  ensurePath('.claude/skills', 'dir', errors);
  ensurePath('bin/adapt.js', 'file', errors);
  ensurePath('bin/cc-devflow-cli.js', 'file', errors);
  ensurePath('bin/cc-devflow.js', 'file', errors);
  ensurePath('config/adapters.yml', 'file', errors);
  ensurePath('config/schema/adapters.schema.json', 'file', errors);
  ensurePath('lib/compiler', 'dir', errors);
  for (const skillName of DISTRIBUTED_SKILLS) {
    ensurePath(`.claude/skills/${skillName}`, 'dir', errors);
    ensurePath(`.claude/skills/${skillName}/SKILL.md`, 'file', errors);
  }

  for (const skillName of PUBLIC_SKILLS) {
    ensurePath(`.claude/skills/${skillName}/PLAYBOOK.md`, 'file', errors);
  }
}

function validateInventoryParity(errors) {
  errors.push(...validateSkillInventory({
    root: ROOT,
    publicSkills: PUBLIC_SKILLS,
    distributedSkills: DISTRIBUTED_SKILLS,
    internalSkills: INTERNAL_SKILLS,
    codexSkills: DISTRIBUTED_SKILLS
  }));
}

function ensureNonEmptyString(value, label, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function ensureStringArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      const actualType = Array.isArray(item) ? 'array' : typeof item;
      const serialized = item === undefined ? 'undefined' : JSON.stringify(item);
      errors.push(
        `${label}[${index}] must be a non-empty string; got ${actualType} ${serialized}. ` +
          'Quote YAML list items that contain ": " so they do not parse as mappings.'
      );
    }
  });
}

function ensureWritesArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      errors.push(`${label} must contain objects`);
      return;
    }

    ensureNonEmptyString(item.path, `${label}.path`, errors);

    if (item.durability !== undefined) {
      ensureNonEmptyString(item.durability, `${label}.durability`, errors);
    }

    if (item.required !== undefined && typeof item.required !== 'boolean') {
      errors.push(`${label}.required must be a boolean when present`);
    }
  }
}

function readSkillVersion(skillName) {
  const skill = fs.readFileSync(path.join(ROOT, '.claude/skills', skillName, 'SKILL.md'), 'utf8');
  return matter(skill).data?.version || '';
}

function collectDecisionQuestionOptionErrors(manifest, label, errors) {
  const questions = manifest?.planningMeta?.decisionQuestions || [];
  if (!Array.isArray(questions)) {
    errors.push(`${label}.planningMeta.decisionQuestions must be an array`);
    return;
  }

  questions.forEach((question, questionIndex) => {
    const options = question?.options || [];
    const questionLabel = `${label}.planningMeta.decisionQuestions[${questionIndex}]`;

    if (!Array.isArray(options) || options.length < 2 || options.length > 3) {
      errors.push(`${questionLabel}.options must contain 2-3 lettered options`);
      return;
    }

    const ids = new Set();
    options.forEach((option, optionIndex) => {
      const optionLabel = `${questionLabel}.options[${optionIndex}].id`;
      const optionId = option?.id;

      if (!/^[A-C]$/.test(optionId || '')) {
        errors.push(`${optionLabel} must be A, B, or C; got ${JSON.stringify(optionId)}`);
        return;
      }

      if (ids.has(optionId)) {
        errors.push(`${questionLabel}.options must not repeat option id ${optionId}`);
      }
      ids.add(optionId);
    });

    const userChoice = question?.userChoice;
    if (userChoice !== null && userChoice !== undefined && !ids.has(userChoice)) {
      errors.push(`${questionLabel}.userChoice must match a lettered option id`);
    }
  });
}

const EXTERNAL_BEST_PRACTICE_STATUSES = ['not-needed', 'ask-user', 'approved', 'declined', 'search-unavailable'];
const EXTERNAL_BEST_PRACTICE_VERDICTS = ['confirmed', 'adjusted', 'contradicted', 'skipped'];
const EXTERNAL_BEST_PRACTICE_TRUST_LEVELS = [
  'internal-contract',
  'repo-evidence',
  'external-evidence',
  'untrusted-text'
];

function collectExternalSourceErrors(sources, label, errors) {
  if (!Array.isArray(sources)) {
    errors.push(`${label}.sourcesChecked must be an array`);
    return;
  }

  sources.forEach((source, index) => {
    const sourceLabel = `${label}.sourcesChecked[${index}]`;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      errors.push(`${sourceLabel} must be an object`);
      return;
    }

    ensureNonEmptyString(source.source, `${sourceLabel}.source`, errors);
    if (!EXTERNAL_BEST_PRACTICE_TRUST_LEVELS.includes(source.trustLevel)) {
      errors.push(`${sourceLabel}.trustLevel must be one of ${EXTERNAL_BEST_PRACTICE_TRUST_LEVELS.join(', ')}`);
    }
    ensureNonEmptyString(source.keyPoint, `${sourceLabel}.keyPoint`, errors);
    if (!EXTERNAL_BEST_PRACTICE_VERDICTS.includes(source.repoFitVerdict)) {
      errors.push(`${sourceLabel}.repoFitVerdict must be one of ${EXTERNAL_BEST_PRACTICE_VERDICTS.join(', ')}`);
    }
    ensureNonEmptyString(source.designImpact, `${sourceLabel}.designImpact`, errors);
  });
}

function collectExternalBestPracticeErrors(manifest, label, errors) {
  const value = manifest?.planningMeta?.externalBestPractice;
  const fieldLabel = `${label}.planningMeta.externalBestPractice`;

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${fieldLabel} must be an object`);
    return;
  }

  if (typeof value.needed !== 'boolean') {
    errors.push(`${fieldLabel}.needed must be a boolean`);
  }

  if (!EXTERNAL_BEST_PRACTICE_STATUSES.includes(value.decisionStatus)) {
    errors.push(`${fieldLabel}.decisionStatus must be one of ${EXTERNAL_BEST_PRACTICE_STATUSES.join(', ')}`);
  }

  if (typeof value.privacyGuard !== 'string' || !value.privacyGuard.includes('generalized terms only')) {
    errors.push(`${fieldLabel}.privacyGuard must require generalized terms only`);
  }

  if (!Array.isArray(value.generalizedSearchTerms)) {
    errors.push(`${fieldLabel}.generalizedSearchTerms must be an array`);
  }

  collectExternalSourceErrors(value.sourcesChecked, fieldLabel, errors);

  if (!EXTERNAL_BEST_PRACTICE_VERDICTS.includes(value.repoFitVerdict)) {
    errors.push(`${fieldLabel}.repoFitVerdict must be one of ${EXTERNAL_BEST_PRACTICE_VERDICTS.join(', ')}`);
  }

  if (!Array.isArray(value.designImpacts)) {
    errors.push(`${fieldLabel}.designImpacts must be an array`);
  }

  if (value.needed === false && value.decisionStatus !== 'not-needed') {
    errors.push(`${fieldLabel}.decisionStatus must be not-needed when needed is false`);
  }

  if (value.needed === true && value.decisionStatus === 'not-needed') {
    errors.push(`${fieldLabel}.decisionStatus must not be not-needed when needed is true`);
  }

  if (['not-needed', 'declined', 'search-unavailable'].includes(value.decisionStatus)) {
    ensureNonEmptyString(value.skippedReason, `${fieldLabel}.skippedReason`, errors);
  }

  if (value.decisionStatus === 'approved') {
    ensureStringArray(value.generalizedSearchTerms, `${fieldLabel}.generalizedSearchTerms`, errors);
    if (!Array.isArray(value.sourcesChecked) || value.sourcesChecked.length === 0) {
      errors.push(`${fieldLabel}.sourcesChecked must be non-empty when decisionStatus is approved`);
    }
    ensureNonEmptyString(value.conventionalWisdom, `${fieldLabel}.conventionalWisdom`, errors);
    ensureNonEmptyString(value.currentDiscourse, `${fieldLabel}.currentDiscourse`, errors);
    if (value.repoFitVerdict === 'skipped') {
      errors.push(`${fieldLabel}.repoFitVerdict must not be skipped when decisionStatus is approved`);
    }
  }
}

const RETIRED_CC_PLAN_MANIFEST_FIELDS = [
  'status',
  'activePhase',
  'sourceRoadmap',
  'spec',
  'executionProtocol',
  'sourceEvidence',
  'languageAndDecisions',
  'executionDiscipline',
  'approvedOption',
  'designStatus',
  'reviewStatus',
  'tasteDecisions',
  'userChallenges',
  'frozenDecisions',
  'deferredQuestions'
];

const RETIRED_CC_PLAN_META_FIELDS = [
  'requirementBrief',
  'ambiguityGate',
  'reviewLoop',
  'approvedBy'
];

const RETIRED_CC_PLAN_TASK_FIELDS = [
  'completion',
  'testQuality',
  'allowedMocks',
  'greenMinimality',
  'refactorCandidates'
];

function collectSlimManifestErrors(manifest, label, errors) {
  for (const field of RETIRED_CC_PLAN_MANIFEST_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest || {}, field)) {
      errors.push(`${label}.${field} is retired; keep that detail in planning/design.md or planning/tasks.md`);
    }
  }

  for (const field of RETIRED_CC_PLAN_META_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(manifest?.planningMeta || {}, field)) {
      errors.push(`${label}.planningMeta.${field} is retired; keep that detail in planning/design.md`);
    }
  }

  (manifest?.tasks || []).forEach((task, index) => {
    for (const field of RETIRED_CC_PLAN_TASK_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(task || {}, field)) {
        errors.push(`${label}.tasks[${index}].${field} is retired; keep that detail in planning/tasks.md`);
      }
    }
  });
}

function validateCcPlanPlanningContracts(errors) {
  const skill = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-plan/SKILL.md'), 'utf8');
  const fullDesign = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-plan/assets/DESIGN_TEMPLATE.md'), 'utf8');
  const tinyDesign = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-plan/assets/TINY_DESIGN_TEMPLATE.md'), 'utf8');
  const tasks = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-plan/assets/TASKS_TEMPLATE.md'), 'utf8');
  const manifestPath = path.join(ROOT, '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json');
  const planningContract = fs.readFileSync(
    path.join(ROOT, '.claude/skills/cc-plan/references/planning-contract.md'),
    'utf8'
  );

  const requiredSnippets = [
    ['cc-plan SKILL.md', skill, '## Decision Question Protocol'],
    ['cc-plan SKILL.md', skill, 'D<N> - <decision title>'],
    ['cc-plan SKILL.md', skill, 'A) <label> (recommended)'],
    ['cc-plan SKILL.md', skill, 'B) <label>'],
    ['cc-plan SKILL.md', skill, '禁止输出 `1)` / `2)` / `3)`'],
    ['cc-plan SKILL.md', skill, 'STOP: wait for the user answer before continuing.'],
    ['cc-plan DESIGN_TEMPLATE.md', fullDesign, '## Decision Questions'],
    ['cc-plan planning-contract.md', planningContract, 'options：只能使用 `A` / `B` / `C`']
  ];

  const aiLeverageSnippets = [
    ['cc-plan SKILL.md', skill, '## AI Leverage Decision Lens'],
    ['cc-plan SKILL.md', skill, '`boil-lake` / `sharp-wedge` / `needs-evidence` / `pivot`'],
    ['cc-plan DESIGN_TEMPLATE.md', fullDesign, '## AI Leverage Decision Lens'],
    ['cc-plan TINY_DESIGN_TEMPLATE.md', tinyDesign, '## AI Leverage Decision Lens'],
    ['cc-plan TASKS_TEMPLATE.md', tasks, 'AI Leverage Decision Lens: boil-lake | sharp-wedge | needs-evidence | pivot'],
    ['cc-plan planning-contract.md', planningContract, 'AI Leverage Decision Lens 必须在任务生成前闭合']
  ];

  for (const [label, content, snippet] of requiredSnippets) {
    if (!content.includes(snippet)) {
      errors.push(`${label} missing decision-question snippet: ${snippet}`);
    }
  }

  for (const [label, content, snippet] of aiLeverageSnippets) {
    if (!content.includes(snippet)) {
      errors.push(`${label} missing ai-leverage-decision snippet: ${snippet}`);
    }
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const currentPlanVersion = readSkillVersion('cc-plan');
  if (manifest?.planningMeta?.reqPlanSkillVersion !== currentPlanVersion) {
    errors.push(
      `cc-plan TASK_MANIFEST_TEMPLATE.json planningMeta.reqPlanSkillVersion must be ${currentPlanVersion}`
    );
  }
  if (!manifest?.planningMeta?.aiLeverageDecisionLens) {
    errors.push('cc-plan TASK_MANIFEST_TEMPLATE.json missing planningMeta.aiLeverageDecisionLens');
  }
  if (!Object.prototype.hasOwnProperty.call(manifest?.planningMeta?.aiLeverageDecisionLens || {}, 'completeLakeBoundary')) {
    errors.push('cc-plan TASK_MANIFEST_TEMPLATE.json missing planningMeta.aiLeverageDecisionLens.completeLakeBoundary');
  }
  collectSlimManifestErrors(
    manifest,
    '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json',
    errors
  );

  collectDecisionQuestionOptionErrors(
    manifest,
    '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json',
    errors
  );
  collectExternalBestPracticeErrors(
    manifest,
    '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json',
    errors
  );

  const examplesRoot = path.join(ROOT, 'docs/examples');
  for (const exampleName of fs.readdirSync(examplesRoot)) {
    const changesRoot = path.join(examplesRoot, exampleName, 'changes');
    if (!fs.existsSync(changesRoot)) {
      continue;
    }

    for (const changeName of fs.readdirSync(changesRoot)) {
      const exampleManifestPath = path.join(changesRoot, changeName, 'planning/task-manifest.json');
      if (!fs.existsSync(exampleManifestPath)) {
        continue;
      }

      collectDecisionQuestionOptionErrors(
        JSON.parse(fs.readFileSync(exampleManifestPath, 'utf8')),
        path.relative(ROOT, exampleManifestPath),
        errors
      );
      collectExternalBestPracticeErrors(
        JSON.parse(fs.readFileSync(exampleManifestPath, 'utf8')),
        path.relative(ROOT, exampleManifestPath),
        errors
      );
      collectSlimManifestErrors(
        JSON.parse(fs.readFileSync(exampleManifestPath, 'utf8')),
        path.relative(ROOT, exampleManifestPath),
        errors
      );
    }
  }
}

function validateArtifactOwnershipContracts(errors) {
  ensurePath('docs/guides/artifact-contract.md', 'file', errors);
  const contract = fs.readFileSync(path.join(ROOT, 'docs/guides/artifact-contract.md'), 'utf8');
  for (const snippet of [
    '## Progressive Disclosure',
    '## State Owners',
    'Task manifests must not duplicate PRD narrative',
    'Who owns this state?'
  ]) {
    if (!contract.includes(snippet)) {
      errors.push(`docs/guides/artifact-contract.md missing artifact contract snippet: ${snippet}`);
    }
  }

  const manifestTemplates = [
    '.claude/skills/cc-plan/assets/TASK_MANIFEST_TEMPLATE.json',
    '.claude/skills/cc-investigate/assets/TASK_MANIFEST_TEMPLATE.json'
  ];

  for (const relPath of manifestTemplates) {
    collectSlimManifestErrors(
      JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8')),
      relPath,
      errors
    );
  }
}

function validateCcRoadmapContracts(errors) {
  const skill = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-roadmap/SKILL.md'), 'utf8');
  const roadmap = fs.readFileSync(path.join(ROOT, '.claude/skills/cc-roadmap/assets/ROADMAP_TEMPLATE.md'), 'utf8');
  const tracking = JSON.parse(
    fs.readFileSync(path.join(ROOT, '.claude/skills/cc-roadmap/assets/TRACKING_TEMPLATE.json'), 'utf8')
  );

  const requiredSnippets = [
    ['cc-roadmap SKILL.md', skill, '## AI Leverage Route Lens'],
    ['cc-roadmap SKILL.md', skill, '`boil-lake`：已有真实用户'],
    ['cc-roadmap ROADMAP_TEMPLATE.md', roadmap, '## AI Leverage Route Lens'],
    ['cc-roadmap ROADMAP_TEMPLATE.md', roadmap, 'Verdict: `boil-lake` | `sharp-wedge` | `needs-evidence` | `pivot`']
  ];

  for (const [label, content, snippet] of requiredSnippets) {
    if (!content.includes(snippet)) {
      errors.push(`${label} missing ai-leverage-route snippet: ${snippet}`);
    }
  }

  if (!tracking?.context?.aiLeverageRouteLens) {
    errors.push('cc-roadmap TRACKING_TEMPLATE.json missing context.aiLeverageRouteLens');
  }
  if (!Object.prototype.hasOwnProperty.call(tracking?.context?.aiLeverageRouteLens || {}, 'completeLakeBoundary')) {
    errors.push('cc-roadmap TRACKING_TEMPLATE.json missing context.aiLeverageRouteLens.completeLakeBoundary');
  }
}

function validatePublicSkillContracts(errors) {
  for (const skillName of PUBLIC_SKILLS) {
    const skillPath = path.join(ROOT, '.claude', 'skills', skillName, 'SKILL.md');
    const playbookPath = path.join(ROOT, '.claude', 'skills', skillName, 'PLAYBOOK.md');
    const skillBody = fs.readFileSync(skillPath, 'utf8');
    const playbookBody = fs.readFileSync(playbookPath, 'utf8');

    let parsed;
    try {
      parsed = matter(skillBody);
    } catch (error) {
      errors.push(`Failed to parse public skill ${skillName}: ${error.message}`);
      continue;
    }

    const data = parsed.data || {};
    ensureNonEmptyString(data.name, `${skillName} frontmatter.name`, errors);
    ensureNonEmptyString(data.version, `${skillName} frontmatter.version`, errors);
    ensureNonEmptyString(data.description, `${skillName} frontmatter.description`, errors);
    ensureStringArray(data.triggers, `${skillName} frontmatter.triggers`, errors);
    ensureStringArray(data.reads, `${skillName} frontmatter.reads`, errors);
    ensureWritesArray(data.writes, `${skillName} frontmatter.writes`, errors);
    ensureStringArray(data.entry_gate, `${skillName} frontmatter.entry_gate`, errors);
    ensureStringArray(data.exit_criteria, `${skillName} frontmatter.exit_criteria`, errors);

    if (!Array.isArray(data.reroutes) || data.reroutes.length === 0) {
      errors.push(`${skillName} frontmatter.reroutes must be a non-empty array`);
    } else {
      for (const route of data.reroutes) {
        if (!route || typeof route !== 'object') {
          errors.push(`${skillName} frontmatter.reroutes must contain objects`);
          break;
        }
        ensureNonEmptyString(route.when, `${skillName} reroutes.when`, errors);
        ensureNonEmptyString(route.target, `${skillName} reroutes.target`, errors);
      }
    }

    if (!Array.isArray(data.recovery_modes) || data.recovery_modes.length === 0) {
      errors.push(`${skillName} frontmatter.recovery_modes must be a non-empty array`);
    } else {
      for (const mode of data.recovery_modes) {
        if (!mode || typeof mode !== 'object') {
          errors.push(`${skillName} frontmatter.recovery_modes must contain objects`);
          break;
        }
        ensureNonEmptyString(mode.name, `${skillName} recovery_modes.name`, errors);
        ensureNonEmptyString(mode.when, `${skillName} recovery_modes.when`, errors);
        ensureNonEmptyString(mode.action, `${skillName} recovery_modes.action`, errors);
      }
    }

    const budget = data.tool_budget;
    if (!budget || typeof budget !== 'object') {
      errors.push(`${skillName} frontmatter.tool_budget must be an object`);
    } else {
      for (const key of ['read_files', 'search_steps', 'shell_commands']) {
        if (!Number.isInteger(budget[key]) || budget[key] < 0) {
          errors.push(`${skillName} frontmatter.tool_budget.${key} must be a non-negative integer`);
        }
      }
    }

    if (!/## Harness Contract\b/.test(parsed.content)) {
      errors.push(`${skillName} SKILL.md must include "## Harness Contract"`);
    }

    if (!/## Visible State Machine\b/.test(playbookBody)) {
      errors.push(`${skillName} PLAYBOOK.md must include "## Visible State Machine"`);
    }
  }
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' });

  if (result.error) {
    return { ok: false, error: result.error.message, output: '' };
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    return { ok: false, error: output || `${command} exited with code ${result.status}`, output };
  }

  return { ok: true, error: '', output: result.stdout || '' };
}

function readString(buffer, start, length) {
  const slice = buffer.slice(start, start + length);
  const nullIndex = slice.indexOf(0);
  const end = nullIndex === -1 ? slice.length : nullIndex;
  return slice.slice(0, end).toString('utf8');
}

function parseOctal(buffer, start, length) {
  const raw = readString(buffer, start, length).trim();
  if (!raw) {
    return 0;
  }
  return parseInt(raw, 8);
}

function parsePaxHeader(content) {
  const text = content.toString('utf8');
  let index = 0;
  let pathValue = null;

  while (index < text.length) {
    const spaceIndex = text.indexOf(' ', index);
    if (spaceIndex === -1) {
      break;
    }

    const lengthStr = text.slice(index, spaceIndex);
    const recordLength = parseInt(lengthStr, 10);
    if (!Number.isFinite(recordLength) || recordLength <= 0) {
      break;
    }

    const record = text.slice(index, index + recordLength);
    const eqIndex = record.indexOf('=');
    if (eqIndex !== -1) {
      const key = record.slice(record.indexOf(' ') + 1, eqIndex);
      const value = record.slice(eqIndex + 1, recordLength - 1);
      if (key === 'path') {
        pathValue = value;
      }
    }

    index += recordLength;
  }

  return { path: pathValue };
}

function listTarEntries(tarBuffer) {
  const entries = [];
  let offset = 0;
  let longName = null;
  let paxPath = null;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.slice(offset, offset + 512);
    const isEmpty = header.every((byte) => byte === 0);
    if (isEmpty) {
      break;
    }

    const name = readString(header, 0, 100);
    const size = parseOctal(header, 124, 12);
    const typeflag = String.fromCharCode(header[156] || 0);
    const prefix = readString(header, 345, 155);
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;

    let fullName = name;
    if (prefix) {
      fullName = `${prefix}/${name}`;
    }

    if (typeflag === 'L') {
      longName = readString(tarBuffer.slice(contentStart, contentEnd), 0, size);
    } else if (typeflag === 'x') {
      const pax = parsePaxHeader(tarBuffer.slice(contentStart, contentEnd));
      paxPath = pax.path || null;
    } else {
      if (longName) {
        fullName = longName;
        longName = null;
      }
      if (paxPath) {
        fullName = paxPath;
        paxPath = null;
      }
      if (fullName) {
        entries.push(fullName);
      }
    }

    const paddedSize = Math.ceil(size / 512) * 512;
    offset = contentStart + paddedSize;
  }

  return entries;
}

function validatePackTarball(errors) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-pack-'));
  const packEnv = { ...process.env };
  delete packEnv.npm_config_dry_run;
  delete packEnv.NPM_CONFIG_DRY_RUN;

  const packResult = runCommand('npm', ['pack', '--pack-destination', tmpDir], {
    cwd: ROOT,
    env: packEnv
  });

  if (!packResult.ok) {
    errors.push(`npm pack failed: ${packResult.error}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const tarballs = fs.readdirSync(tmpDir).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length === 0) {
    errors.push('npm pack produced no .tgz file');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const tarballPath = path.join(tmpDir, tarballs[0]);
  let entries;

  try {
    const tgzBuffer = fs.readFileSync(tarballPath);
    const tarBuffer = zlib.gunzipSync(tgzBuffer);
    entries = listTarEntries(tarBuffer);
  } catch (error) {
    errors.push(`Failed to read tarball: ${error.message}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const requiredEntries = [
    'package/bin/cc-devflow-cli.js',
    'package/bin/adapt.js',
    'package/bin/cc-devflow.js',
    'package/lib/compiler/index.js',
    'package/config/adapters.yml',
    'package/docs/assets/cc-devflow-pr-harness-en.svg',
    'package/docs/assets/cc-devflow-pr-harness-zh.svg',
    'package/README.md',
    'package/README.zh-CN.md',
    'package/CHANGELOG.md',
    'package/LICENSE',
    'package/package.json'
  ];

  for (const skillName of DISTRIBUTED_SKILLS) {
    requiredEntries.push(`package/.claude/skills/${skillName}/SKILL.md`);
  }

  for (const skillName of PUBLIC_SKILLS) {
    requiredEntries.push(`package/.claude/skills/${skillName}/PLAYBOOK.md`);
  }

  for (const entry of requiredEntries) {
    if (!entries.includes(entry)) {
      errors.push(`Tarball missing: ${entry}`);
    }
  }

  for (const entry of entries) {
    if (entry.includes('/.DS_Store') || entry.includes('.claude/tsc-cache/')) {
      errors.push(`Tarball should not include transient file: ${entry}`);
    }
  }

  for (const skillName of INTERNAL_SKILLS) {
    for (const entry of entries) {
      if (entry.startsWith(`package/.claude/skills/${skillName}/`)) {
        errors.push(`Tarball should not include internal skill: ${entry}`);
      }
    }
  }

  validatePackRuntimeSmoke(tarballPath, errors);
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function validatePackRuntimeSmoke(tarballPath, errors) {
  const installDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-pack-smoke-'));
  const installEnv = { ...process.env };
  delete installEnv.npm_config_dry_run;
  delete installEnv.NPM_CONFIG_DRY_RUN;

  try {
    const install = runCommand('npm', [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      tarballPath
    ], {
      cwd: installDir,
      env: installEnv
    });

    if (!install.ok) {
      errors.push(`pack runtime smoke install failed: ${install.error}`);
      return;
    }

    const cliPath = path.join(installDir, 'node_modules', 'cc-devflow', 'bin', 'cc-devflow-cli.js');
    const queryList = runCommand(process.execPath, [cliPath, 'query', 'list'], {
      cwd: installDir,
      env: installEnv
    });

    if (!queryList.ok || !queryList.output.includes('ship-readiness')) {
      errors.push(`pack runtime smoke query failed: ${queryList.error || queryList.output}`);
      return;
    }

    const configResolve = runCommand(process.execPath, [cliPath, 'config', 'resolve', '--format', 'policy'], {
      cwd: installDir,
      env: installEnv
    });

    if (!configResolve.ok || !configResolve.output.includes('Output language')) {
      errors.push(`pack runtime smoke config failed: ${configResolve.error || configResolve.output}`);
      return;
    }

    console.log('Pack runtime smoke passed.');
  } finally {
    fs.rmSync(installDir, { recursive: true, force: true });
  }
}

function validateExampleBindings(errors) {
  ensurePath('docs/examples/example-bindings.json', 'file', errors);
  ensurePath('docs/examples/scripts/check-example-bindings.sh', 'file', errors);

  const result = runCommand('bash', ['docs/examples/scripts/check-example-bindings.sh'], {
    cwd: ROOT,
    env: process.env
  });

  if (!result.ok) {
    errors.push(`example bindings check failed: ${result.error}`);
  }
}

function main() {
  const errors = [];

  ensurePath('LICENSE', 'file', errors);
  ensurePath('README.md', 'file', errors);
  ensurePath('README.zh-CN.md', 'file', errors);
  ensurePath('CHANGELOG.md', 'file', errors);
  ensurePath('bin', 'dir', errors);
  ensurePath('lib', 'dir', errors);
  ensurePath('config', 'dir', errors);

  validatePackageJson(errors);
  validateTemplate(errors);
  validateInventoryParity(errors);
  validateCcRoadmapContracts(errors);
  validateCcPlanPlanningContracts(errors);
  validateArtifactOwnershipContracts(errors);
  validatePublicSkillContracts(errors);
  validateExampleBindings(errors);
  validatePackTarball(errors);

  if (errors.length > 0) {
    console.error('Publish validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Publish validation passed.');
}

if (require.main === module) {
  main();
}

module.exports = {
  collectDecisionQuestionOptionErrors,
  collectExternalBestPracticeErrors,
  collectSlimManifestErrors,
  validateArtifactOwnershipContracts,
  ensureStringArray
};
