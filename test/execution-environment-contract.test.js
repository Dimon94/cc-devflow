const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const SKILL_PATH = '.claude/skills/execution-environment-contract/SKILL.md';
const PARALLEL_REF = '.claude/skills/cc-dev/references/parallel-orchestration.md';
const VALIDATOR_PATH = '.claude/skills/execution-environment-contract/scripts/validate-execution-environments.js';
const PARALLEL_READERS = ['cc-dev', 'cc-plan'];
const { validate } = require(path.join(ROOT, VALIDATOR_PATH));

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function readSkill(relativePath) {
  return matter(readText(relativePath));
}

function baseTask({ rows, allocations = '', contracts = '' }) {
  return `# task.md

## Execution Environments

| Env | Route | Status | DependsOn | Parallel | Child | Commit | Gate |
|-----|-------|--------|-----------|----------|-------|--------|------|
${rows}

## Environment Task Allocation

| Env | Assigned tasks | TDD sequence | Independent proof | Cannot overlap with |
|-----|----------------|--------------|-------------------|---------------------|
${allocations}

## Environment Contracts

${contracts}
`;
}

function boundary(env, body = 'Touches:\n- none\nMutable resources:\n- none') {
  return `--- CHILD DISPATCH START ${env} ---

### ${env} slice
Goal:
Route: cc-do
Status: planned
Tasks:
Assigned task IDs:

${body}

--- CHILD DISPATCH END ${env} ---`;
}

function codes(result) {
  return result.errors.map((item) => item.code);
}

describe('execution-environment-contract Chain Skill contract', () => {
  test('source skill defines parallel graph and integration semantics only', () => {
    const skill = readSkill(SKILL_PATH);
    const body = skill.content;

    expect(skill.data.name).toBe('execution-environment-contract');
    expect(skill.data.description).toMatch(/Chain Skill/i);
    expect(skill.data).not.toHaveProperty('triggers');

    for (const required of [
      /implementation environment/i,
      /review-only environment/i,
      /verification-only environment/i,
      /closeout or handoff environment/i,
      /diagnosis environment/i,
      /DependsOn/i,
      /Parallel/i,
      /Assigned task IDs/i,
      /Touches/i,
      /Mutable resources/i,
      /Verification/i,
      /CHILD DISPATCH START/i,
      /Child Final Report/i,
      /Integration Gate/i,
      /clean worktree/i,
      /touched-path audit/i,
      /focused verification/i,
      /cherry-pick/i,
      /Worktree Closeout/i,
      /validate-execution-environments\.js/,
      /error.*blocker.*warning/is,
      /task-contract/i,
      /workflow-chain-contract/i,
      /quality-gate-contract/i,
      /skill-authoring-gate/i
    ]) {
      expect(body).toMatch(required);
    }

    for (const nonGoal of [
      /does not own Codex thread tool wrappers/i,
      /heartbeat implementation/i,
      /model\s+selection/i,
      /platform UI behavior/i
    ]) {
      expect(body).toMatch(nonGoal);
    }
  });

  test('parallel orchestration readers consume the shared execution contract', () => {
    for (const skillName of PARALLEL_READERS) {
      const skill = readSkill(`.claude/skills/${skillName}/SKILL.md`);

      expect(skill.data.reads).toContain('../execution-environment-contract/SKILL.md');
      expect(skill.data.reads).toContain('../execution-environment-contract/scripts/validate-execution-environments.js');
    }

    expect(readText(PARALLEL_REF)).toMatch(/execution-environment-contract\/SKILL\.md/);
  });

  test('validator reports missing sections as errors', () => {
    const result = validate('# task.md\n');

    expect(codes(result)).toContain('missing-section');
    expect(result.errors.some((item) => item.level === 'error')).toBe(true);
  });

  test('validator reports missing child dispatch boundary as an error', () => {
    const result = validate(baseTask({
      rows: '| E001 | cc-do | planned | none | yes | pending | pending | pending |',
      allocations: '| E001 |  |  |  |  |'
    }));

    expect(codes(result)).toContain('missing-dispatch-boundary');
  });

  test('validator requires assigned tasks inside their environment boundary', () => {
    const result = validate(baseTask({
      rows: '| E001 | cc-do | planned | none | yes | pending | pending | pending |',
      allocations: '| E001 | T001 | red | proof | none |',
      contracts: boundary('E001')
    }));

    expect(codes(result)).toContain('missing-assigned-task');
  });

  test('validator blocks dependencies completed by file-changing routes', () => {
    const result = validate(baseTask({
      rows: [
        '| E001 | cc-do | completed | none | no | done | abc123 | pending |',
        '| E002 | cc-do | planned | E001 | yes | pending | pending | pending |'
      ].join('\n'),
      allocations: [
        '| E001 |  |  |  |  |',
        '| E002 |  |  |  |  |'
      ].join('\n'),
      contracts: [boundary('E001'), boundary('E002')].join('\n\n')
    }));

    expect(codes(result)).toContain('dependency-not-ready');
    expect(result.environments.find((env) => env.id === 'E002').ready).toBe(false);
  });

  test('validator accepts completed check dependencies as ready', () => {
    const result = validate(baseTask({
      rows: [
        '| C001 | cc-check | completed | none | no | done | none | done |',
        '| E002 | cc-do | planned | C001 | yes | pending | pending | pending |'
      ].join('\n'),
      allocations: [
        '| C001 |  |  |  |  |',
        '| E002 |  |  |  |  |'
      ].join('\n'),
      contracts: [boundary('C001'), boundary('E002')].join('\n\n')
    }));

    expect(codes(result)).not.toContain('dependency-not-ready');
    expect(result.environments.find((env) => env.id === 'E002').ready).toBe(true);
  });

  test('validator blocks running sibling touch prefix conflicts', () => {
    const result = validate(baseTask({
      rows: [
        '| E001 | cc-do | running | none | yes | thread | pending | pending |',
        '| E002 | cc-do | planned | none | yes | pending | pending | pending |'
      ].join('\n'),
      allocations: [
        '| E001 |  |  |  |  |',
        '| E002 |  |  |  |  |'
      ].join('\n'),
      contracts: [
        boundary('E001', 'Touches:\n- src\nMutable resources:\n- none'),
        boundary('E002', 'Touches:\n- src/foo.js\nMutable resources:\n- none')
      ].join('\n\n')
    }), { running: ['E001'] });

    expect(codes(result)).toContain('running-touch-conflict');
    expect(result.environments.find((env) => env.id === 'E002').ready).toBe(false);
  });
});
