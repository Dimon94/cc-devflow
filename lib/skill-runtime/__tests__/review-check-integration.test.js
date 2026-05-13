/**
 * [INPUT]: 依赖 runReviewSuite、临时 devflow review artifacts。
 * [OUTPUT]: 验证 cc-check review 读取 review-findings.json 优先并按 legacy 层级 fallback。
 * [POS]: REQ-003-minimize-workflow-artifacts T015 的 Red/Green 证据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { runReviewSuite } = require('../review');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
}

function makeReviewRoot(changeId, changeKey) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-review-check-'));
  const reviewDir = path.join(repoRoot, 'devflow', 'changes', changeKey, 'review');
  fs.mkdirSync(reviewDir, { recursive: true });
  return { repoRoot, reviewDir, changeId, changeKey };
}

function findingsDoc(overrides = {}) {
  return {
    schema: 'review-findings.v2',
    change: 'REQ-140-review-records',
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
        fingerprint: 'sha256:f001',
        scope: 'inside current requirement blast radius',
        path: 'lib/skill-runtime/review.js',
        evidence: 'review records should be consumed before legacy report text',
        recommendation: 'read review-findings.json first',
        route: 'cc-do'
      }
    ],
    ...overrides
  };
}

async function runReviewCase(files) {
  const ctx = makeReviewRoot('REQ-140', 'REQ-140-review-records');
  if (files.findings) {
    writeJson(path.join(ctx.reviewDir, 'review-findings.json'), files.findings);
  }
  if (files.ledger) {
    writeText(path.join(ctx.reviewDir, 'review-ledger.jsonl'), files.ledger);
  }
  if (files.legacyReport) {
    writeText(path.join(ctx.reviewDir, 'cc-review-report.md'), files.legacyReport);
  }

  const review = await runReviewSuite({
    repoRoot: ctx.repoRoot,
    changeId: ctx.changeId,
    manifest: { tasks: [] },
    strict: false,
    skipReview: true
  });
  fs.rmSync(ctx.repoRoot, { recursive: true, force: true });
  return review;
}

describe('cc-check review record fallback', () => {
  test('reads review-findings.json before ledger or legacy report', async () => {
    const review = await runReviewCase({
      findings: findingsDoc(),
      ledger: '{"schema":"review-ledger.v2","change":"REQ-140-review-records","reviewId":"RVW-20260512-002","createdAt":"2026-05-12T00:00:00.000Z","createdBy":"cc-devflow-cli","event":"review-closed","status":"clean","blockingCount":0,"warningCount":0,"next":"cc-check"}\n',
      legacyReport: '# Legacy Report\n'
    });

    expect(review.recordReview).toMatchObject({
      source: 'review-findings.json',
      status: 'fail',
      freshness: { status: 'fresh' }
    });
    expect(review.findings[0]).toMatchObject({
      id: 'F001',
      source: 'review-records',
      severity: 'important',
      displayTier: 'blocking'
    });
  });

  test('falls back to ledger tail when findings doc is missing', async () => {
    const review = await runReviewCase({
      ledger: [
        '{"schema":"review-ledger.v2","change":"REQ-140-review-records","reviewId":"RVW-20260512-001","createdAt":"2026-05-12T00:00:00.000Z","createdBy":"cc-devflow-cli","event":"review-started","mode":"implementation","scope":"current-diff","baseSha":"abc123","headSha":"def456","selectedNodes":[],"skippedNodes":[],"riskLanes":[]}',
        '{"schema":"review-ledger.v2","change":"REQ-140-review-records","reviewId":"RVW-20260512-001","createdAt":"2026-05-12T00:01:00.000Z","createdBy":"cc-devflow-cli","event":"review-closed","status":"clean","blockingCount":0,"warningCount":0,"next":"cc-check"}'
      ].join('\n')
    });

    expect(review.recordReview).toMatchObject({
      source: 'review-ledger.jsonl',
      status: 'pass',
      summary: expect.stringContaining('review ledger')
    });
  });

  test('falls back to legacy cc-review-report.md with unknown freshness', async () => {
    const review = await runReviewCase({
      legacyReport: '# Legacy Review\n\nNo blocking findings.\n'
    });

    expect(review.recordReview).toMatchObject({
      source: 'cc-review-report.md',
      status: 'pass',
      freshness: { status: 'unknown' }
    });
  });

  test('blocks when all review records are missing', async () => {
    const review = await runReviewCase({});

    expect(review.status).toBe('blocked');
    expect(review.recordReview).toMatchObject({
      source: 'review-records',
      status: 'blocked',
      summary: expect.stringContaining('review-missing')
    });
  });
});
