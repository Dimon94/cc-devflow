/**
 * [INPUT]: 依赖 task-contract parser、operation 层与 CLI 子进程。
 * [OUTPUT]: 通过 parser 返回值、生成文件、validate 规则与 CLI stderr 证明 tasks.md contract 行为。
 * [POS]: REQ-003-minimize-workflow-artifacts T002-T006 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  extractTasksContractSummary,
  extractTasksRootCauseContract
} = require('../task-contract');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { runCompile, runValidate } = require('../operations/task-contract');

const CLI_BIN = path.resolve(__dirname, '../../..', 'bin/cc-devflow-cli.js');

const SAMPLE_WITH_HEADING = `# REQ-003-minimize-workflow-artifacts

## Plan Meta

Some plan meta prose.

## Contract Summary

Change: REQ-003-minimize-workflow-artifacts
Mode: plan
Profile: deep
Approval: approved (ExitPlanMode 2026-05-12)

Goal:
- Collapse default artifact surface.
- Switch workflow-context canonical refs.

Do Not Do:
- Do not migrate REQ-001 / REQ-002 by default.
- Do not rebuild task-manifest.json.

Approved Direction:
- Single REQ-003 PR covering v2 PR-A + PR-B + PR-C.
- 18 vertical slices.

Acceptance:
- New REQ-003-example directory emits only tasks.md.
- verify:artifacts passes.

Verification:

\`\`\`bash
npm test
npm run verify:artifacts
\`\`\`

Risk / Escalate If:
- benchmark-workflow-context-tokens fails for REQ-001.
- Total LOC exceeds 3500.

## Implementation Surface Map

Other content that must not leak into the Contract Summary block.
`;

const SAMPLE_WITHOUT_HEADING = `# REQ-999

## Plan Meta

Just plan meta.

## Something Else

Unrelated.
`;

describe('extractTasksContractSummary', () => {
  describe('when `## Contract Summary` heading is present', () => {
    test('returns found:true', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.found).toBe(true);
    });

    test('content spans from the heading line up to (but not including) the next H2 heading', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.content).toMatch(/^## Contract Summary/);
      expect(result.content).not.toMatch(/## Implementation Surface Map/);
      expect(result.content).not.toMatch(/Other content that must not leak/);
    });

    test('content includes the trailing risk block before the next heading', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.content).toMatch(/Risk \/ Escalate If:/);
      expect(result.content).toMatch(/Total LOC exceeds 3500\./);
    });

    test('fields parses Change as a single-line KV', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.change).toBe('REQ-003-minimize-workflow-artifacts');
    });

    test('fields parses Mode and Profile as single-line KVs', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.mode).toBe('plan');
      expect(result.fields.profile).toBe('deep');
    });

    test('fields parses Approval as a single-line KV preserving inline parentheses', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.approval).toBe('approved (ExitPlanMode 2026-05-12)');
    });

    test('fields parses Goal as a multi-line bullet list', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(Array.isArray(result.fields.goal)).toBe(true);
      expect(result.fields.goal).toEqual([
        'Collapse default artifact surface.',
        'Switch workflow-context canonical refs.'
      ]);
    });

    test('fields parses Do Not Do as a bullet list', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.doNotDo).toEqual([
        'Do not migrate REQ-001 / REQ-002 by default.',
        'Do not rebuild task-manifest.json.'
      ]);
    });

    test('fields parses Approved Direction as a bullet list', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.approvedDirection).toEqual([
        'Single REQ-003 PR covering v2 PR-A + PR-B + PR-C.',
        '18 vertical slices.'
      ]);
    });

    test('fields parses Acceptance as a bullet list', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.acceptance).toEqual([
        'New REQ-003-example directory emits only tasks.md.',
        'verify:artifacts passes.'
      ]);
    });

    test('fields parses Verification as a fenced code block string', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(typeof result.fields.verification).toBe('string');
      expect(result.fields.verification).toMatch(/npm test/);
      expect(result.fields.verification).toMatch(/npm run verify:artifacts/);
      expect(result.fields.verification).not.toMatch(/```/);
    });

    test('fields parses Risk / Escalate If as a bullet list', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields.risk).toEqual([
        'benchmark-workflow-context-tokens fails for REQ-001.',
        'Total LOC exceeds 3500.'
      ]);
    });

    test('fields does not include keys from sections outside Contract Summary', () => {
      const result = extractTasksContractSummary(SAMPLE_WITH_HEADING);
      expect(result.fields).not.toHaveProperty('implementationSurfaceMap');
      expect(result.fields).not.toHaveProperty('something');
    });
  });

  describe('when `## Contract Summary` heading is absent', () => {
    test('returns found:false', () => {
      const result = extractTasksContractSummary(SAMPLE_WITHOUT_HEADING);
      expect(result.found).toBe(false);
    });

    test('returns empty content and empty fields', () => {
      const result = extractTasksContractSummary(SAMPLE_WITHOUT_HEADING);
      expect(result.content).toBe('');
      expect(result.fields).toEqual({});
    });
  });

  describe('edge cases', () => {
    test('treats a heading-only block with no body as found:true with empty fields', () => {
      const headingOnly = '## Contract Summary\n\n## Next Heading\n\nBody\n';
      const result = extractTasksContractSummary(headingOnly);
      expect(result.found).toBe(true);
      expect(result.content).toMatch(/^## Contract Summary/);
      expect(result.fields).toEqual({});
    });

    test('is case-sensitive on the canonical heading spelling', () => {
      const wrongCase = '## contract summary\n\nChange: REQ-999\n\n## Next\n';
      const result = extractTasksContractSummary(wrongCase);
      expect(result.found).toBe(false);
    });

    test('throws a TypeError when input is not a string', () => {
      expect(() => extractTasksContractSummary(null)).toThrow(TypeError);
      expect(() => extractTasksContractSummary(undefined)).toThrow(TypeError);
      expect(() => extractTasksContractSummary(42)).toThrow(TypeError);
    });
  });
});

const FIX_SAMPLE_WITH_HEADING = `# FIX-042-cache-stampede

## Plan Meta

Just meta.

## Root Cause Contract

Change: FIX-042-cache-stampede
Mode: investigation
Profile: standard
Diagnosis: cache stampede on cold start under parallel burst.

Symptom:
- p99 latency spike to 12s every deploy.
- Redis CPU saturates at 100% for ~20s.

Reproduction:
- Restart app with empty cache.
- Send 200 rps synthetic burst.

Expected:
- First miss population single-flight; subsequent callers await the in-flight promise.

Actual:
- N parallel callers all miss, all hit origin, all write back.

Root Cause:
- Missing in-flight promise map in \`lib/cache/remote.js\`.

Evidence Chain:
- flamegraph 2026-05-10 shows 184 origin calls within 50ms.
- \`remote.js:42\` unconditionally calls \`origin.fetch\` under a cache-miss branch.

Repair Boundary:
- Introduce in-flight map keyed by cache key; reject propagation errors to all awaiters.
- Do not touch eviction policy or TTL logic.

Verification:

\`\`\`bash
npm test -- lib/cache/remote.test.js
\`\`\`

Prevention:
- Add a regression test that fires 50 parallel callers with an empty cache and asserts origin.fetch called once.

Risk / Escalate If:
- If the in-flight map leaks on rejection, memory grows unbounded — escalate to owner.
- If fix adds >5% p50 latency, roll back.

## Repair Plan

Other content that must not leak into the Root Cause Contract block.
`;

const FIX_SAMPLE_WITHOUT_HEADING = `# FIX-000

## Plan Meta

Nothing here.

## Something Else

Unrelated.
`;

describe('extractTasksRootCauseContract', () => {
  describe('when `## Root Cause Contract` heading is present', () => {
    test('returns found:true', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.found).toBe(true);
    });

    test('content spans from the heading line up to (but not including) the next H2 heading', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.content).toMatch(/^## Root Cause Contract/);
      expect(result.content).not.toMatch(/## Repair Plan/);
      expect(result.content).not.toMatch(/Other content that must not leak/);
    });

    test('fields parses Change / Mode / Profile as single-line KVs', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.change).toBe('FIX-042-cache-stampede');
      expect(result.fields.mode).toBe('investigation');
      expect(result.fields.profile).toBe('standard');
    });

    test('fields parses Diagnosis as a single-line KV preserving punctuation', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.diagnosis).toBe('cache stampede on cold start under parallel burst.');
    });

    test('fields parses Symptom as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.symptom).toEqual([
        'p99 latency spike to 12s every deploy.',
        'Redis CPU saturates at 100% for ~20s.'
      ]);
    });

    test('fields parses Reproduction as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.reproduction).toEqual([
        'Restart app with empty cache.',
        'Send 200 rps synthetic burst.'
      ]);
    });

    test('fields parses Expected as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.expected).toEqual([
        'First miss population single-flight; subsequent callers await the in-flight promise.'
      ]);
    });

    test('fields parses Actual as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.actual).toEqual([
        'N parallel callers all miss, all hit origin, all write back.'
      ]);
    });

    test('fields parses Root Cause as a bullet list preserving inline code spans', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.rootCause).toEqual([
        'Missing in-flight promise map in `lib/cache/remote.js`.'
      ]);
    });

    test('fields parses Evidence Chain as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.evidenceChain).toEqual([
        'flamegraph 2026-05-10 shows 184 origin calls within 50ms.',
        '`remote.js:42` unconditionally calls `origin.fetch` under a cache-miss branch.'
      ]);
    });

    test('fields parses Repair Boundary as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.repairBoundary).toEqual([
        'Introduce in-flight map keyed by cache key; reject propagation errors to all awaiters.',
        'Do not touch eviction policy or TTL logic.'
      ]);
    });

    test('fields parses Verification as a fenced command block', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.verification).toBe('npm test -- lib/cache/remote.test.js');
    });

    test('fields parses Prevention as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.prevention).toEqual([
        'Add a regression test that fires 50 parallel callers with an empty cache and asserts origin.fetch called once.'
      ]);
    });

    test('fields parses Risk / Escalate If as a bullet list', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields.risk).toEqual([
        'If the in-flight map leaks on rejection, memory grows unbounded — escalate to owner.',
        'If fix adds >5% p50 latency, roll back.'
      ]);
    });

    test('fields does not include keys from sections outside Root Cause Contract', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITH_HEADING);
      expect(result.fields).not.toHaveProperty('repairPlan');
      expect(result.fields).not.toHaveProperty('something');
    });
  });

  describe('when `## Root Cause Contract` heading is absent', () => {
    test('returns found:false with empty content and empty fields', () => {
      const result = extractTasksRootCauseContract(FIX_SAMPLE_WITHOUT_HEADING);
      expect(result.found).toBe(false);
      expect(result.content).toBe('');
      expect(result.fields).toEqual({});
    });
  });

  describe('edge cases', () => {
    test('is case-sensitive on the canonical heading spelling', () => {
      const wrongCase = '## root cause contract\n\nChange: FIX-999\n\n## Next\n';
      const result = extractTasksRootCauseContract(wrongCase);
      expect(result.found).toBe(false);
    });

    test('throws a TypeError when input is not a string', () => {
      expect(() => extractTasksRootCauseContract(null)).toThrow(TypeError);
      expect(() => extractTasksRootCauseContract(undefined)).toThrow(TypeError);
      expect(() => extractTasksRootCauseContract({})).toThrow(TypeError);
    });
  });
});

describe('extractTasksContractSummary and extractTasksRootCauseContract share independent contracts', () => {
  test('a document with only Contract Summary returns found:false for Root Cause Contract', () => {
    const r = extractTasksRootCauseContract(SAMPLE_WITH_HEADING);
    expect(r.found).toBe(false);
    expect(r.fields).toEqual({});
  });

  test('a document with only Root Cause Contract returns found:false for Contract Summary', () => {
    const r = extractTasksContractSummary(FIX_SAMPLE_WITH_HEADING);
    expect(r.found).toBe(false);
    expect(r.fields).toEqual({});
  });
});

describe('task-contract compile', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-task-contract-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), '{"name":"tmp"}\n');
    fs.mkdirSync(path.join(repoRoot, '.git'));
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  test('writes manifest whose metadata.source equals tasks.md', async () => {
    const changeId = 'REQ-777';
    const changeKey = 'REQ-777-compile-manifest';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(
      path.join(planningDir, 'tasks.md'),
      [
        '# TASKS',
        '',
        '## Contract Summary',
        '',
        'Change: REQ-777-compile-manifest',
        'Mode: plan',
        'Profile: standard',
        'Approval: approved',
        '',
        'Goal:',
        '- Compile manifest from tasks.md.',
        '',
        'Do Not Do:',
        '- Do not add validate or migrate behavior.',
        '',
        'Approved Direction:',
        '- Reuse planner.createTaskManifest.',
        '',
        'Acceptance:',
        '- Manifest metadata.source is tasks.md.',
        '',
        'Verification:',
        '',
        '```bash',
        'npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '```',
        '',
        'Risk / Escalate If:',
        '- Missing tasks.md should exit 3.',
        '',
        '## Phase 1: Compile',
        '',
        '- [ ] T001 compile manifest',
        '  Goal: Write task-manifest.json from tasks.md.',
        '  Files: `lib/skill-runtime/operations/task-contract.js`',
        '  Verification: npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '  Evidence: manifest metadata assertions',
        ''
      ].join('\n')
    );

    const result = await runCompile({ repoRoot, changeId, changeKey });
    const manifestPath = path.join(planningDir, 'task-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    expect(result).toEqual(expect.objectContaining({
      code: 0,
      changeId,
      changeKey,
      manifestPath
    }));
    expect(manifest.metadata.source).toBe('tasks.md');
    expect(manifest.metadata.generatedBy).toBe('cc-devflow task-contract');
  });

  test('returns exit code 3 when planning/tasks.md is missing', async () => {
    const changeId = 'REQ-778';
    const changeKey = 'REQ-778-missing-tasks';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });

    const result = await runCompile({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(3);
    expect(result.error).toMatch(/Missing planning\/tasks\.md/);
    expect(fs.existsSync(path.join(planningDir, 'task-manifest.json'))).toBe(false);
  });

  test('extracts goal and acceptance into change-meta.json', async () => {
    const changeId = 'REQ-780';
    const changeKey = 'REQ-780-compile-change-meta';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    const planningDir = path.join(changeDir, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(
      path.join(planningDir, 'tasks.md'),
      [
        '# TASKS',
        '',
        '## Contract Summary',
        '',
        'Change: REQ-780-compile-change-meta',
        'Mode: plan',
        'Profile: standard',
        'Approval: approved',
        '',
        'Goal:',
        '- Generate change metadata from the contract.',
        '- Keep the manifest writer unchanged.',
        '',
        'Do Not Do:',
        '- Do not add validate or migrate behavior.',
        '',
        'Approved Direction:',
        '- The Contract Summary is the human-authored source.',
        '',
        'Acceptance:',
        '- change-meta.json contains goal items.',
        '- change-meta.json records specReference.',
        '',
        'Verification:',
        '',
        '```bash',
        'npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '```',
        '',
        'Risk / Escalate If:',
        '- Missing Contract Summary exits 3.',
        '',
        '## Phase 1: Compile',
        '',
        '- [ ] T001 compile metadata',
        '  Goal: Write change-meta.json from tasks.md.',
        '  Files: `lib/skill-runtime/operations/task-contract.js`',
        '  Verification: npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '  Evidence: change-meta.json field assertions',
        ''
      ].join('\n')
    );

    const result = await runCompile({ repoRoot, changeId, changeKey });
    const changeMeta = JSON.parse(fs.readFileSync(path.join(changeDir, 'change-meta.json'), 'utf8'));

    expect(result.code).toBe(0);
    expect(changeMeta.goal).toEqual([
      'Generate change metadata from the contract.',
      'Keep the manifest writer unchanged.'
    ]);
    expect(changeMeta.acceptance).toEqual([
      'change-meta.json contains goal items.',
      'change-meta.json records specReference.'
    ]);
    expect(changeMeta.specReference).toEqual({
      source: 'planning/tasks.md#contract-summary',
      change: 'REQ-780-compile-change-meta',
      mode: 'plan',
      profile: 'standard',
      approval: 'approved'
    });
    expect(changeMeta._meta.generatedBy).toBe('cc-devflow task-contract');
  });

  test('compiles Root Cause Contract into generated manifest and change-meta', async () => {
    const changeId = 'FIX-781';
    const changeKey = 'FIX-781-compile-root-cause';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    const planningDir = path.join(changeDir, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(
      path.join(planningDir, 'tasks.md'),
      [
        '# TASKS',
        '',
        '## Root Cause Contract',
        '',
        'Change: FIX-781-compile-root-cause',
        'Mode: investigation',
        'Profile: standard',
        'Diagnosis: confirmed',
        '',
        'Symptom:',
        '- Task-contract compile rejects bug investigations.',
        '',
        'Reproduction:',
        '- Run compile against a Root Cause Contract-only tasks.md.',
        '',
        'Expected:',
        '- CLI owns task-manifest.json and change-meta.json.',
        '',
        'Actual:',
        '- Compile required Contract Summary.',
        '',
        'Root Cause:',
        '- The compile path reused only the planning contract parser.',
        '',
        'Evidence Chain:',
        '- validate already accepts Root Cause Contract.',
        '',
        'Repair Boundary:',
        '- Accept Root Cause Contract as the human-authored source.',
        '',
        'Verification:',
        '',
        '```bash',
        'npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '```',
        '',
        'Prevention:',
        '- Keep generated machine records behind task-contract compile.',
        '',
        'Risk / Escalate If:',
        '- Generated metadata loses the root-cause source.',
        '',
        '## Phase 1: Compile',
        '',
        '- [ ] T001 compile root-cause metadata',
        '  Goal: Generate machine artifacts from the root-cause contract.',
        '  Files: `lib/skill-runtime/operations/task-contract.js`',
        '  Verification: npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '  Evidence: generated metadata assertions',
        ''
      ].join('\n')
    );

    const result = await runCompile({ repoRoot, changeId, changeKey });
    const manifest = JSON.parse(fs.readFileSync(path.join(planningDir, 'task-manifest.json'), 'utf8'));
    const changeMeta = JSON.parse(fs.readFileSync(path.join(changeDir, 'change-meta.json'), 'utf8'));

    expect(result.code).toBe(0);
    expect(manifest.goal).toBe('The compile path reused only the planning contract parser.');
    expect(manifest.metadata.generatedBy).toBe('cc-devflow task-contract');
    expect(changeMeta.specReference.source).toBe('planning/tasks.md#root-cause-contract');
    expect(changeMeta.rootCause.confirmed).toEqual([
      'The compile path reused only the planning contract parser.'
    ]);
    expect(changeMeta.acceptance).toEqual([
      'Accept Root Cause Contract as the human-authored source.',
      'npm test -- lib/skill-runtime/__tests__/task-contract.test.js'
    ]);
    expect(changeMeta._meta.generatedBy).toBe('cc-devflow task-contract');
  });

  test('returns exit code 3 when Contract Summary is missing', async () => {
    const changeId = 'REQ-781';
    const changeKey = 'REQ-781-missing-contract-summary';
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    const planningDir = path.join(changeDir, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(
      path.join(planningDir, 'tasks.md'),
      [
        '# TASKS',
        '',
        '## Phase 1: Compile',
        '',
        '- [ ] T001 compile metadata',
        '  Goal: Write nothing when Contract Summary is absent.',
        '  Files: `lib/skill-runtime/operations/task-contract.js`',
        '  Verification: npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
        '  Evidence: exit code assertion',
        ''
      ].join('\n')
    );

    const result = await runCompile({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(3);
    expect(result.error).toMatch(/Missing ## Contract Summary or ## Root Cause Contract/);
    expect(fs.existsSync(path.join(changeDir, 'change-meta.json'))).toBe(false);
  });
});

describe('task-contract validate', () => {
  let repoRoot;

  beforeEach(() => {
    repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-task-validate-'));
    fs.writeFileSync(path.join(repoRoot, 'package.json'), '{"name":"tmp"}\n');
    fs.mkdirSync(path.join(repoRoot, '.git'));
  });

  afterEach(() => {
    fs.rmSync(repoRoot, { recursive: true, force: true });
  });

  function tasksMarkdown(changeKey, options = {}) {
    const {
      profile = 'standard',
      includeContract = true,
      taskCount = 1,
      extraBody = ''
    } = options;
    const contract = includeContract
      ? [
          '## Contract Summary',
          '',
          `Change: ${changeKey}`,
          'Mode: plan',
          `Profile: ${profile}`,
          'Approval: approved',
          '',
          'Goal:',
          '- Validate artifact contract.',
          '',
          'Do Not Do:',
          '- Do not add migrate behavior.',
          '',
          'Approved Direction:',
          '- Validate with a rule table.',
          '',
          'Acceptance:',
          '- Validate exits with rule-specific codes.',
          '',
          'Verification:',
          '',
          '```bash',
          'npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
          '```',
          '',
          'Risk / Escalate If:',
          '- Budget overflow exits 6.',
          ''
        ]
      : [];
    const tasks = Array.from({ length: taskCount }, (_, index) => [
      `- [ ] T${String(index + 1).padStart(3, '0')} validate slice ${index + 1}`,
      '  Goal: Keep validation deterministic.',
      '  Files: `lib/skill-runtime/operations/task-contract.js`',
      '  Verification: npm test -- lib/skill-runtime/__tests__/task-contract.test.js',
      '  Evidence: exit code assertion',
      `  Vertical slice: Slice ${index + 1}`,
      ''
    ].join('\n'));
    return ['# TASKS', '', ...contract, extraBody, '## Phase 1: Validate', '', ...tasks].join('\n');
  }

  async function seedCompiledChange(changeId, changeKey, options = {}) {
    const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
    const planningDir = path.join(changeDir, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(path.join(planningDir, 'tasks.md'), tasksMarkdown(changeKey, options));
    const compileResult = await runCompile({ repoRoot, changeId, changeKey });
    expect(compileResult.code).toBe(0);
    return { changeDir, planningDir };
  }

  const ruleCases = [
    ['C1', 2, async (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'design.md'), '# legacy design\n')],
    ['C2', 2, async (ctx) => fs.writeFileSync(path.join(ctx.planningDir, 'analysis.md'), '# legacy analysis\n')],
    ['C3', 2, async (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'cc-review-report.md'), '# legacy review report\n');
    }],
    ['C5', 3, async (ctx) => {
      const manifestPath = path.join(ctx.planningDir, 'task-manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      manifest.metadata.generatedBy = 'manual';
      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    }],
    ['C6', 3, async (ctx) => {
      const metaPath = path.join(ctx.changeDir, 'change-meta.json');
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      meta._meta.generatedBy = 'manual';
      fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
    }],
    ['C8', 5, async (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'review-ledger.jsonl'), '{"event":"review-started"}\n');
    }],
    ['C9', 5, async (ctx) => {
      const reviewDir = path.join(ctx.changeDir, 'review');
      fs.mkdirSync(reviewDir, { recursive: true });
      fs.writeFileSync(path.join(reviewDir, 'report-card.json'), '{"overall":"pass"}\n');
    }]
  ];

  test.each(ruleCases)('%s returns exit code %i', async (ruleId, exitCode, mutate) => {
    const changeId = `REQ-${ruleId.slice(1).padStart(3, '0')}`;
    const changeKey = `${changeId.toLowerCase()}-validate-${ruleId.toLowerCase()}`.toUpperCase().replace('_', '-');
    const ctx = await seedCompiledChange(changeId, changeKey);
    await mutate(ctx);

    const result = await runValidate({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(exitCode);
    expect(result.stderr).toContain(ruleId);
  });

  test('returns exit code 3 for C4 when Contract Summary is missing', async () => {
    const changeId = 'REQ-704';
    const changeKey = 'REQ-704-missing-contract';
    const planningDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'planning');
    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(path.join(planningDir, 'tasks.md'), tasksMarkdown(changeKey, { includeContract: false }));

    const result = await runValidate({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(3);
    expect(result.stderr).toContain('C4');
  });

  test('returns exit code 4 for C7 when tiny profile has more than one tracer slice', async () => {
    const changeId = 'REQ-707';
    const changeKey = 'REQ-707-tiny-over-sliced';
    await seedCompiledChange(changeId, changeKey, { profile: 'tiny', taskCount: 2 });

    const result = await runValidate({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(4);
    expect(result.stderr).toContain('C7');
  });

  test('returns exit code 6 for C10 when tasks.md exceeds the profile budget', async () => {
    const changeId = 'REQ-710';
    const changeKey = 'REQ-710-budget-overflow';
    await seedCompiledChange(changeId, changeKey, {
      profile: 'standard',
      extraBody: 'x'.repeat(12000)
    });

    const result = await runValidate({ repoRoot, changeId, changeKey });

    expect(result.code).toBe(6);
    expect(result.stderr).toContain('C10');
  });

  test('passes a valid compiled task contract', async () => {
    const changeId = 'REQ-799';
    const changeKey = 'REQ-799-valid-contract';
    await seedCompiledChange(changeId, changeKey);

    const result = await runValidate({ repoRoot, changeId, changeKey });

    expect(result).toEqual(expect.objectContaining({
      code: 0,
      ok: true,
      violations: []
    }));
  });

  test('CLI validate failure prints the violated rule id', async () => {
    const changeId = 'REQ-711';
    const changeKey = 'REQ-711-cli-rule-output';
    const { planningDir } = await seedCompiledChange(changeId, changeKey);
    fs.writeFileSync(path.join(planningDir, 'design.md'), '# legacy design\n');

    const result = spawnSync(
      process.execPath,
      [CLI_BIN, 'task-contract', 'validate', '--cwd', repoRoot, '--change', changeId, '--change-key', changeKey],
      { encoding: 'utf8' }
    );

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('C1');
    expect(result.stderr).toContain('planning/design.md');
  });
});
