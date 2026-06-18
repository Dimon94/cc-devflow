#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const matter = require('gray-matter');
const { validateSkillInventory } = require('../lib/compiler/inventory');

const ROOT = path.resolve(__dirname, '..');
const DISTRIBUTION_CONFIG = require(path.join(ROOT, 'config', 'distributable-skills.json'));
const PUBLIC_SKILLS = DISTRIBUTION_CONFIG.publicSkills || [];
const DISTRIBUTED_SKILLS = DISTRIBUTION_CONFIG.distributedSkills || PUBLIC_SKILLS;
const INTERNAL_SKILLS = DISTRIBUTION_CONFIG.internalSkills || [];
const COMMIT_GUIDELINE_SKILLS = ['cc-plan', 'cc-dev', 'cc-do', 'cc-check', 'cc-diagnose', 'cc-act', 'npm-release'];
const COMMIT_GUIDELINE_REF = 'references/git-commit-guidelines.md';

const RETIRED_PATTERNS = [
  'task-manifest.json',
  'change-meta.json',
  'report-card.json',
  'review-ledger',
  'review-findings',
  'review-agent-results',
  'events.jsonl',
  'team-state.json',
  'change-state.json',
  'resume-index.md',
  'status.md',
  'principles.md',
  'verify:artifacts',
  'benchmark:artifacts',
  'benchmark:workflow-context'
];

function ensurePath(relPath, expectedType, errors) {
  const target = path.join(ROOT, relPath);
  if (!fs.existsSync(target)) {
    errors.push(`Missing ${expectedType}: ${relPath}`);
    return;
  }

  const stat = fs.statSync(target);
  const actualType = stat.isDirectory() ? 'dir' : stat.isFile() ? 'file' : 'other';
  if (actualType !== expectedType) {
    errors.push(`Expected ${expectedType} but found ${actualType}: ${relPath}`);
  }
}

function readText(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function validatePackageJson(errors) {
  const pkg = JSON.parse(readText('package.json'));
  const scripts = pkg.scripts || {};

  if (pkg.main !== 'bin/cc-devflow.js') {
    errors.push('package.json main must be "bin/cc-devflow.js"');
  }
  if (pkg.bin?.['cc-devflow'] !== 'bin/cc-devflow-cli.js') {
    errors.push('package.json bin.cc-devflow must be "bin/cc-devflow-cli.js"');
  }
  if (scripts.prepublishOnly !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.prepublishOnly must run validate-publish.js');
  }
  if (scripts['verify:publish'] !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.verify:publish must run validate-publish.js');
  }
  if (scripts['verify:examples'] !== 'bash docs/examples/scripts/check-example-bindings.sh') {
    errors.push('package.json scripts.verify:examples must run check-example-bindings.sh');
  }
  if (scripts['benchmark:skills'] !== 'node scripts/benchmark-skills.js') {
    errors.push('package.json scripts.benchmark:skills must run benchmark-skills.js');
  }

  for (const retired of ['verify:artifacts', 'benchmark:artifacts', 'benchmark:workflow-context']) {
    if (Object.prototype.hasOwnProperty.call(scripts, retired)) {
      errors.push(`package.json must not expose retired script ${retired}`);
    }
  }

  for (const relPath of ['bin/', 'lib/', 'config/', 'docs/assets/']) {
    if (!pkg.files.includes(relPath)) {
      errors.push(`package.json files missing: ${relPath}`);
    }
  }
  for (const skillName of DISTRIBUTED_SKILLS) {
    const relPath = `.claude/skills/${skillName}/`;
    if (!pkg.files.includes(relPath)) {
      errors.push(`package.json files missing: ${relPath}`);
    }
  }
}

function validateTemplate(errors) {
  ensurePath('.claude/skills', 'dir', errors);
  ensurePath('bin/cc-devflow-cli.js', 'file', errors);
  ensurePath('bin/cc-devflow.js', 'file', errors);
  ensurePath('bin/adapt.js', 'file', errors);
  ensurePath('lib/compiler', 'dir', errors);

  for (const skillName of DISTRIBUTED_SKILLS) {
    ensurePath(`.claude/skills/${skillName}/SKILL.md`, 'file', errors);
  }
  for (const skillName of PUBLIC_SKILLS) {
    ensurePath(`.claude/skills/${skillName}/PLAYBOOK.md`, 'file', errors);
  }
}

function walkFiles(start, filter = () => true) {
  const out = [];
  function visit(target) {
    if (!fs.existsSync(target)) return;
    const stat = fs.statSync(target);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(target)) {
        if (entry === 'node_modules' || entry === '.git') continue;
        visit(path.join(target, entry));
      }
      return;
    }
    if (stat.isFile() && filter(target)) {
      out.push(target);
    }
  }
  visit(start);
  return out;
}

function validateNoRetiredFiles(errors) {
  const retiredNames = new Set([
    'task-manifest.json',
    'change-meta.json',
    'report-card.json',
    'review-ledger.jsonl',
    'review-findings.json',
    'review-agent-results.jsonl',
    'resume-index.md',
    'status.md',
    'principles.md'
  ]);
  const allowedTaskContractFiles = new Set([
    '.claude/skills/task-contract/SKILL.md',
    '.codex/skills/task-contract/SKILL.md',
    'test/task-contract.test.js'
  ]);

  for (const file of walkFiles(ROOT)) {
    const rel = path.relative(ROOT, file);
    if (retiredNames.has(path.basename(file))) {
      errors.push(`Retired process file must not exist: ${rel}`);
    }
    if (/task-contract|review-records|benchmark-artifacts|verify-artifacts/.test(rel) && !allowedTaskContractFiles.has(rel)) {
      errors.push(`Retired process module/script must not exist: ${rel}`);
    }
  }
}

function validateNoRetiredText(errors) {
  const roots = ['.claude/skills', 'bin', 'lib/skill-runtime', 'docs/guides', 'docs/examples', 'devflow/changes'];
  const files = roots.flatMap((root) => walkFiles(path.join(ROOT, root), (file) => {
    const rel = path.relative(ROOT, file);
    if (rel === 'scripts/validate-publish.js') return false;
    if (path.basename(file) === 'CHANGELOG.md') return false;
    if (rel.includes('/assets/legacy/')) return false;
    return /\.(md|js|sh|json)$/.test(file);
  }));

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    for (const pattern of RETIRED_PATTERNS) {
      if (text.includes(pattern)) {
        errors.push(`Retired process reference "${pattern}" found in ${rel}`);
      }
    }
  }
}

function validateNoMainBranchAutoSwitch(errors) {
  const forbiddenPatterns = [
    {
      pattern: /\bgit\s+(checkout|switch)\s+main\b/,
      message: 'must not tell agents to checkout or switch to main'
    },
    {
      pattern: /\bgit\s+push\s+origin\s+main\b/,
      message: 'must not hard-code pushing origin main'
    },
    {
      pattern: /On branch main/,
      message: 'must not require status text for main branch'
    },
    {
      pattern: /Not on main branch/,
      message: 'must not treat non-main branches as release blockers'
    }
  ];

  const files = walkFiles(path.join(ROOT, '.claude', 'skills'), (file) => /\.(md|sh)$/.test(file));

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(text)) {
        errors.push(`Branch isolation violation in ${rel}: ${message}`);
      }
    }
  }
}

function validateSkillFrontmatter(errors) {
  for (const skillName of DISTRIBUTED_SKILLS) {
    const rel = `.claude/skills/${skillName}/SKILL.md`;
    const parsed = matter(readText(rel));
    if (!parsed.data.name) errors.push(`${rel} missing name`);
    if (!parsed.data.version) errors.push(`${rel} missing version`);
    if (!Array.isArray(parsed.data.reads)) errors.push(`${rel} reads must be an array`);
    if (!Array.isArray(parsed.data.writes)) errors.push(`${rel} writes must be an array`);
  }
}

function validateCommitGuidelineRefs(errors) {
  const canonical = readText('.claude/skills/cc-act/references/git-commit-guidelines.md');

  for (const skillName of COMMIT_GUIDELINE_SKILLS) {
    const skillRel = `.claude/skills/${skillName}/SKILL.md`;
    const guidelineRel = `.claude/skills/${skillName}/${COMMIT_GUIDELINE_REF}`;
    const skillText = readText(skillRel);

    ensurePath(guidelineRel, 'file', errors);
    if (fs.existsSync(path.join(ROOT, guidelineRel)) && readText(guidelineRel) !== canonical) {
      errors.push(`${guidelineRel} must match the canonical commit guideline copy`);
    }
    if (!skillText.includes(COMMIT_GUIDELINE_REF)) {
      errors.push(`${skillRel} must reference its local ${COMMIT_GUIDELINE_REF}`);
    }
  }

  const ccDevPacket = readText('.claude/skills/cc-dev/assets/CHILD_DISPATCH_PACKET.md');
  if (!ccDevPacket.includes(COMMIT_GUIDELINE_REF)) {
    errors.push('.claude/skills/cc-dev/assets/CHILD_DISPATCH_PACKET.md must include the commit guideline reference');
  }

  const ccDoPlaybook = readText('.claude/skills/cc-do/PLAYBOOK.md');
  if (!ccDoPlaybook.includes(COMMIT_GUIDELINE_REF)) {
    errors.push('.claude/skills/cc-do/PLAYBOOK.md must include the commit guideline reference');
  }

  const ccCheckPlaybook = readText('.claude/skills/cc-check/PLAYBOOK.md');
  if (!ccCheckPlaybook.includes(COMMIT_GUIDELINE_REF)) {
    errors.push('.claude/skills/cc-check/PLAYBOOK.md must include the commit guideline reference');
  }
}

function validateCliSurface(errors) {
  const help = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', '--help'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (help.status !== 0) {
    errors.push(`cc-devflow --help failed: ${help.stderr || help.stdout}`);
    return;
  }
  for (const retired of ['task-contract', ' review ', 'compile ', 'validate ']) {
    if (help.stdout.includes(retired)) {
      errors.push(`CLI help exposes retired command/reference: ${retired.trim()}`);
    }
  }

  if (help.stdout.includes('query ')) {
    errors.push('CLI help exposes retired query command');
  }

  const query = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', 'query', 'list'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (query.status !== 3 || !query.stderr.includes('cc-devflow query has been removed')) {
    errors.push(`cc-devflow query must fail closed, got status ${query.status}: ${query.stderr || query.stdout}`);
  }

  const topLevelOption = spawnSync(process.execPath, ['bin/cc-devflow-cli.js', '--cwd', ROOT], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (topLevelOption.status !== 3 || !topLevelOption.stderr.includes('Unknown top-level option: --cwd')) {
    errors.push(`top-level options must fail closed, got status ${topLevelOption.status}: ${topLevelOption.stderr || topLevelOption.stdout}`);
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

function validateExampleBindings(errors) {
  const result = spawnSync('bash', ['docs/examples/scripts/check-example-bindings.sh'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    errors.push(`example bindings failed:\n${result.stdout}${result.stderr}`);
  }
}

function validatePackSmoke(errors) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-pack-'));
  try {
    const pack = spawnSync('npm', ['pack', '--pack-destination', tmpDir], {
      cwd: ROOT,
      encoding: 'utf8'
    });
    if (pack.status !== 0) {
      errors.push(`npm pack failed:\n${pack.stdout}${pack.stderr}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function main() {
  const errors = [];
  validatePackageJson(errors);
  validateTemplate(errors);
  validateInventoryParity(errors);
  validateSkillFrontmatter(errors);
  validateCommitGuidelineRefs(errors);
  validateNoRetiredFiles(errors);
  validateNoRetiredText(errors);
  validateNoMainBranchAutoSwitch(errors);
  validateCliSurface(errors);
  validateExampleBindings(errors);
  validatePackSmoke(errors);

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('validate-publish: ok');
}

if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validateTemplate,
  validateInventoryParity,
  validateSkillFrontmatter,
  validateCommitGuidelineRefs,
  validateNoRetiredFiles,
  validateNoRetiredText,
  validateNoMainBranchAutoSwitch,
  validateCliSurface,
  validateExampleBindings,
  validatePackSmoke
};
