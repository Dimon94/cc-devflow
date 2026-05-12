/**
 * [INPUT]: 依赖 lib/skill-runtime/task-contract.js 暴露的 extractTasksContractSummary 纯函数。
 * [OUTPUT]: 通过返回值结构证明 tasks.md 的 `## Contract Summary` 区块抽取与 KV 字段解析契约。
 * [POS]: REQ-003-minimize-workflow-artifacts T002 的 Red+Green 证据；为 T004 task-contract compile 建立 contract 源。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  extractTasksContractSummary,
  extractTasksRootCauseContract
} = require('../task-contract');

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
