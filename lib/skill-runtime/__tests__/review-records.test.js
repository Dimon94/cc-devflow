/**
 * [INPUT]: 依赖 lib/skill-runtime/schemas.js 暴露的 ReviewLedgerEventSchema + ReviewFindingsDocSchema 以及对应 parse helpers。
 * [OUTPUT]: 通过 zod parse 行为证明 review-ledger.jsonl 每种 event 和 review-findings.json 顶层 doc 的结构契约。
 * [POS]: REQ-003-minimize-workflow-artifacts T001 的 Red+Green 合一证据；支撑后续 review CLI 的 schema 边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  ReviewLedgerEventSchema,
  ReviewFindingsDocSchema,
  parseReviewLedgerEvent,
  parseReviewFindingsDoc
} = require('../schemas');
const { parseReviewLedger } = require('../review-records');

const CLI = path.resolve(__dirname, '../../../bin/cc-devflow-cli.js');

const VALID_COMMON = {
  schema: 'review-ledger.v2',
  change: 'REQ-003-minimize-workflow-artifacts',
  reviewId: 'RVW-20260512-001',
  createdAt: '2026-05-12T00:00:00.000Z',
  createdBy: 'cc-devflow-cli'
};

function build(eventOverrides) {
  return { ...VALID_COMMON, ...eventOverrides };
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

describe('ReviewLedgerEventSchema', () => {
  describe('review-started event', () => {
    const validStarted = () => build({
      event: 'review-started',
      mode: 'implementation',
      scope: 'current-diff',
      baseSha: 'abc123',
      headSha: 'def456',
      selectedNodes: ['R001', 'R002'],
      skippedNodes: [{ node: 'browser', reason: 'not UI-facing' }],
      riskLanes: ['intent-regression', 'contracts-coverage']
    });

    test('accepts a well-formed review-started event with selectedNodes and riskLanes', () => {
      expect(() => parseReviewLedgerEvent(validStarted())).not.toThrow();
    });

    test('rejects review-started event missing baseSha', () => {
      const bad = validStarted();
      delete bad.baseSha;
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/baseSha/);
    });

    test('rejects review-started event with unknown mode', () => {
      const bad = { ...validStarted(), mode: 'exploration' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/mode/);
    });
  });

  describe('review-node-checked event', () => {
    const validNode = () => build({
      event: 'review-node-checked',
      nodeId: 'R001',
      mode: 'implementation',
      target: 'lib/skill-runtime/workflow-context.js',
      status: 'checked',
      coverage: ['contract', 'tests'],
      evidenceRefs: ['cmd:npm test -- workflow-context'],
      findings: [],
      next: 'cc-check'
    });

    test('accepts a checked node with evidence refs', () => {
      expect(() => parseReviewLedgerEvent(validNode())).not.toThrow();
    });

    test('rejects a node event with unknown status', () => {
      const bad = { ...validNode(), status: 'maybe' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/status/);
    });

    test('rejects a node event with unknown next route', () => {
      const bad = { ...validNode(), next: 'cc-unknown' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/next/);
    });
  });

  describe('review-finding-added event', () => {
    const validFinding = () => build({
      event: 'review-finding-added',
      findingId: 'F001',
      severity: 'important',
      confidence: 8,
      displayTier: 'blocking',
      fingerprint: 'sha256:deadbeef',
      scope: 'inside current requirement blast radius',
      path: 'lib/skill-runtime/workflow-context.js',
      evidence: 'legacyFallback branch still returns exists:false',
      recommendation: 'ensure fallback branch probes both design.md and analysis.md',
      route: 'cc-do'
    });

    test('accepts a well-formed important finding with numeric confidence', () => {
      expect(() => parseReviewLedgerEvent(validFinding())).not.toThrow();
    });

    test('rejects a finding with unknown severity', () => {
      const bad = { ...validFinding(), severity: 'catastrophic' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/severity/);
    });

    test('rejects a finding whose confidence is out of 0..10 range', () => {
      const bad = { ...validFinding(), confidence: 11 };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/confidence/);
    });

    test('rejects a finding with unknown displayTier', () => {
      const bad = { ...validFinding(), displayTier: 'critical-bright-red' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/displayTier/);
    });
  });

  describe('review-closed event', () => {
    const validClosed = () => build({
      event: 'review-closed',
      status: 'findings',
      blockingCount: 1,
      warningCount: 0,
      next: 'cc-do'
    });

    test('accepts a well-formed review-closed event', () => {
      expect(() => parseReviewLedgerEvent(validClosed())).not.toThrow();
    });

    test('rejects a close event with unknown status', () => {
      const bad = { ...validClosed(), status: 'done' };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/status/);
    });

    test('rejects a close event with negative blockingCount', () => {
      const bad = { ...validClosed(), blockingCount: -1 };
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/blockingCount/);
    });
  });

  describe('discriminator', () => {
    test('rejects an event with unknown literal', () => {
      const bad = build({ event: 'review-suspended' });
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/event/);
    });

    test('rejects an event missing createdBy', () => {
      const bad = build({ event: 'review-closed', status: 'clean', blockingCount: 0, warningCount: 0, next: 'cc-check' });
      delete bad.createdBy;
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/createdBy/);
    });

    test('rejects an event with wrong schema string', () => {
      const bad = build({ event: 'review-closed', status: 'clean', blockingCount: 0, warningCount: 0, next: 'cc-check' });
      bad.schema = 'review-ledger.v1';
      expect(() => parseReviewLedgerEvent(bad)).toThrow(/schema/);
    });
  });
});

describe('review start CLI', () => {
  test('writes one parseable review-started event and prints the reviewId', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-review-start-'));
    const changeId = 'REQ-130';
    const changeKey = 'REQ-130-review-start';
    const result = spawnSync(process.execPath, [
      CLI,
      'review',
      'start',
      '--cwd',
      repoRoot,
      '--change',
      changeId,
      '--change-key',
      changeKey,
      '--mode',
      'implementation',
      '--scope',
      'current-diff',
      '--base-sha',
      'abc123',
      '--head-sha',
      'def456',
      '--selected-node',
      'R001',
      '--selected-node',
      'R002',
      '--skipped-node',
      'browser:not UI-facing',
      '--risk-lane',
      'intent-regression',
      '--risk-lane',
      'contracts-coverage'
    ], { encoding: 'utf8' });

    expect(result.status).toBe(0);
    const stdout = JSON.parse(result.stdout);
    expect(stdout.reviewId).toMatch(/^RVW-\d{8}-001$/);

    const ledgerPath = path.join(
      repoRoot,
      'devflow',
      'changes',
      changeKey,
      'review',
      'review-ledger.jsonl'
    );
    const events = readJsonl(ledgerPath);
    expect(events).toHaveLength(1);

    const event = parseReviewLedgerEvent(events[0]);
    expect(event).toMatchObject({
      schema: 'review-ledger.v2',
      change: changeKey,
      reviewId: stdout.reviewId,
      createdBy: 'cc-devflow-cli',
      event: 'review-started',
      mode: 'implementation',
      scope: 'current-diff',
      baseSha: 'abc123',
      headSha: 'def456',
      selectedNodes: ['R001', 'R002'],
      skippedNodes: [{ node: 'browser', reason: 'not UI-facing' }],
      riskLanes: ['intent-regression', 'contracts-coverage']
    });

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('review event CLI', () => {
  test('appends node, finding, and one close event after review start', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-review-events-'));
    const changeId = 'REQ-131';
    const changeKey = 'REQ-131-review-events';
    const scoped = [
      '--cwd',
      repoRoot,
      '--change',
      changeId,
      '--change-key',
      changeKey
    ];
    const start = spawnSync(process.execPath, [
      CLI,
      'review',
      'start',
      ...scoped,
      '--base-sha',
      'abc123',
      '--head-sha',
      'def456'
    ], { encoding: 'utf8' });
    const { reviewId } = JSON.parse(start.stdout);

    const recordNode = spawnSync(process.execPath, [
      CLI,
      'review',
      'record-node',
      ...scoped,
      '--review-id',
      reviewId,
      '--node-id',
      'R001',
      '--mode',
      'implementation',
      '--target',
      'lib/skill-runtime/workflow-context.js',
      '--status',
      'checked',
      '--coverage',
      'contract',
      '--coverage',
      'tests',
      '--evidence-ref',
      'cmd:npm test -- review-records',
      '--finding',
      'F001',
      '--next',
      'cc-do'
    ], { encoding: 'utf8' });
    const addFinding = spawnSync(process.execPath, [
      CLI,
      'review',
      'add-finding',
      ...scoped,
      '--review-id',
      reviewId,
      '--finding-id',
      'F001',
      '--severity',
      'important',
      '--confidence',
      '8',
      '--display-tier',
      'blocking',
      '--fingerprint',
      'sha256:abc123',
      '--scope',
      'inside current requirement blast radius',
      '--path',
      'lib/skill-runtime/workflow-context.js',
      '--evidence',
      'review start has no follow-up event writer',
      '--recommendation',
      'append node and finding events through review CLI',
      '--route',
      'cc-do'
    ], { encoding: 'utf8' });
    const close = spawnSync(process.execPath, [
      CLI,
      'review',
      'close',
      ...scoped,
      '--review-id',
      reviewId,
      '--status',
      'findings',
      '--blocking-count',
      '1',
      '--warning-count',
      '0',
      '--next',
      'cc-do'
    ], { encoding: 'utf8' });
    const duplicateClose = spawnSync(process.execPath, [
      CLI,
      'review',
      'close',
      ...scoped,
      '--review-id',
      reviewId,
      '--status',
      'findings',
      '--blocking-count',
      '1',
      '--warning-count',
      '0',
      '--next',
      'cc-do'
    ], { encoding: 'utf8' });

    expect(recordNode.status).toBe(0);
    expect(addFinding.status).toBe(0);
    expect(close.status).toBe(0);
    expect(duplicateClose.status).not.toBe(0);

    const ledgerPath = path.join(
      repoRoot,
      'devflow',
      'changes',
      changeKey,
      'review',
      'review-ledger.jsonl'
    );
    const events = readJsonl(ledgerPath).map(parseReviewLedgerEvent);
    expect(events.map((event) => event.event)).toEqual([
      'review-started',
      'review-node-checked',
      'review-finding-added',
      'review-closed'
    ]);
    expect(events[1]).toMatchObject({
      reviewId,
      nodeId: 'R001',
      coverage: ['contract', 'tests'],
      evidenceRefs: ['cmd:npm test -- review-records'],
      findings: ['F001'],
      next: 'cc-do'
    });
    expect(events[2]).toMatchObject({
      reviewId,
      findingId: 'F001',
      severity: 'important',
      confidence: 8,
      displayTier: 'blocking',
      route: 'cc-do'
    });
    expect(events[3]).toMatchObject({
      reviewId,
      status: 'findings',
      blockingCount: 1,
      warningCount: 0,
      next: 'cc-do'
    });

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('parseReviewLedger', () => {
  test('degrades malformed ledger rows to unknown freshness without throwing', () => {
    const parsed = parseReviewLedger([
      JSON.stringify(build({
        event: 'review-started',
        mode: 'implementation',
        scope: 'current-diff',
        baseSha: 'abc123',
        headSha: 'def456',
        selectedNodes: [],
        skippedNodes: [],
        riskLanes: []
      })),
      '{"schema":"review-ledger.v1","event":"review-closed"}'
    ].join('\n'));

    expect(parsed.entries).toHaveLength(1);
    expect(parsed.errors).toHaveLength(1);
    expect(parsed.freshness).toMatchObject({ status: 'unknown' });
  });
});

describe('review render CLI', () => {
  test('renders Markdown from ledger events on demand', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-review-render-'));
    const changeId = 'REQ-132';
    const changeKey = 'REQ-132-review-render';
    const outputPath = path.join(repoRoot, 'review-output.md');
    const scoped = [
      '--cwd',
      repoRoot,
      '--change',
      changeId,
      '--change-key',
      changeKey
    ];
    const start = spawnSync(process.execPath, [
      CLI,
      'review',
      'start',
      ...scoped,
      '--base-sha',
      'abc123',
      '--head-sha',
      'def456'
    ], { encoding: 'utf8' });
    const { reviewId } = JSON.parse(start.stdout);

    spawnSync(process.execPath, [
      CLI,
      'review',
      'record-node',
      ...scoped,
      '--review-id',
      reviewId,
      '--node-id',
      'R001',
      '--target',
      'lib/skill-runtime/workflow-context.js',
      '--status',
      'checked',
      '--coverage',
      'contract',
      '--evidence-ref',
      'cmd:npm test -- review-records',
      '--next',
      'cc-do'
    ], { encoding: 'utf8' });
    spawnSync(process.execPath, [
      CLI,
      'review',
      'add-finding',
      ...scoped,
      '--review-id',
      reviewId,
      '--finding-id',
      'F001',
      '--severity',
      'important',
      '--confidence',
      '8',
      '--display-tier',
      'blocking',
      '--fingerprint',
      'sha256:abc123',
      '--scope',
      'inside current requirement blast radius',
      '--path',
      'lib/skill-runtime/workflow-context.js',
      '--evidence',
      'review ledger needs Markdown output',
      '--recommendation',
      'render a compact review report from ledger events',
      '--route',
      'cc-do'
    ], { encoding: 'utf8' });
    spawnSync(process.execPath, [
      CLI,
      'review',
      'close',
      ...scoped,
      '--review-id',
      reviewId,
      '--status',
      'findings',
      '--blocking-count',
      '1',
      '--warning-count',
      '0',
      '--next',
      'cc-do'
    ], { encoding: 'utf8' });

    const render = spawnSync(process.execPath, [
      CLI,
      'review',
      'render',
      ...scoped,
      '--review-id',
      reviewId,
      '--output',
      outputPath
    ], { encoding: 'utf8' });

    expect(render.status).toBe(0);
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining(`reviewId: ${reviewId}`));
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining('Output language: en'));
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining('## Summary'));
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining('## Findings'));
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining('F001'));
    expect(fs.readFileSync(outputPath, 'utf8')).toEqual(expect.stringContaining('## Ledger Events'));

    fs.rmSync(repoRoot, { recursive: true, force: true });
  });
});

describe('ReviewFindingsDocSchema', () => {
  const validDoc = () => ({
    schema: 'review-findings.v2',
    change: 'REQ-003-minimize-workflow-artifacts',
    reviewId: 'RVW-20260512-001',
    headSha: 'def456',
    freshness: {
      status: 'fresh',
      reviewedCommit: 'def456',
      currentCommit: 'def456',
      commitsSinceReview: 0
    },
    summary: {
      status: 'findings',
      blockingCount: 1,
      warningCount: 0,
      next: 'cc-do'
    },
    findings: [
      {
        id: 'F001',
        severity: 'important',
        confidence: 8,
        displayTier: 'blocking',
        fingerprint: 'sha256:deadbeef',
        scope: 'inside current requirement blast radius',
        path: 'lib/skill-runtime/workflow-context.js',
        evidence: 'legacyFallback branch still returns exists:false',
        recommendation: 'ensure fallback branch probes both design.md and analysis.md',
        route: 'cc-do'
      }
    ]
  });

  test('accepts a well-formed findings doc with one finding', () => {
    expect(() => parseReviewFindingsDoc(validDoc())).not.toThrow();
  });

  test('accepts a clean findings doc with empty findings array', () => {
    const doc = validDoc();
    doc.summary = { status: 'clean', blockingCount: 0, warningCount: 0, next: 'cc-check' };
    doc.findings = [];
    expect(() => parseReviewFindingsDoc(doc)).not.toThrow();
  });

  test('rejects a findings doc with unknown freshness.status', () => {
    const bad = validDoc();
    bad.freshness.status = 'warm';
    expect(() => parseReviewFindingsDoc(bad)).toThrow(/freshness/);
  });

  test('rejects a findings doc with unknown summary.status', () => {
    const bad = validDoc();
    bad.summary.status = 'maybe';
    expect(() => parseReviewFindingsDoc(bad)).toThrow(/summary/);
  });

  test('rejects a findings doc whose schema string is not review-findings.v2', () => {
    const bad = validDoc();
    bad.schema = 'review-findings.v1';
    expect(() => parseReviewFindingsDoc(bad)).toThrow(/schema/);
  });

  test('rejects a finding entry with unknown severity', () => {
    const bad = validDoc();
    bad.findings[0].severity = 'catastrophic';
    expect(() => parseReviewFindingsDoc(bad)).toThrow(/severity/);
  });

  test('rejects a finding entry with confidence above 10', () => {
    const bad = validDoc();
    bad.findings[0].confidence = 12;
    expect(() => parseReviewFindingsDoc(bad)).toThrow(/confidence/);
  });
});
