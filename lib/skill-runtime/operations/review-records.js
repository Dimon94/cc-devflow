/**
 * [INPUT]: 依赖 review-records helper、store.appendJsonl、ReviewLedgerEventSchema。
 * [OUTPUT]: 实现 review durable records CLI operation，当前只写 review-started。
 * [POS]: CLI 与 durable review ledger 的边界层；负责校验后追加 JSONL。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');

const { getChangePaths } = require('../paths');
const { appendJsonl, readText, writeText } = require('../store');
const { parseReviewLedgerEvent } = require('../schemas');
const {
  getReviewLedgerPath,
  nextReviewId,
  parseSkippedNode
} = require('../review-records');

function readLedgerEvents(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function normalizeArray(values) {
  return (values || [])
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

async function loadLedger(repoRoot, changeId, changeKey) {
  const change = getChangePaths(repoRoot, changeId, { changeKey });
  const ledgerPath = getReviewLedgerPath(repoRoot, changeId, { changeKey });
  const events = readLedgerEvents(await readText(ledgerPath, ''));
  return { change, ledgerPath, events };
}

function hasStarted(events, reviewId) {
  return events.some((event) => event.reviewId === reviewId && event.event === 'review-started');
}

function hasClosed(events, reviewId) {
  return events.some((event) => event.reviewId === reviewId && event.event === 'review-closed');
}

async function appendReviewEvent(options, eventFields) {
  const {
    repoRoot,
    changeId,
    changeKey,
    reviewId,
    now = new Date()
  } = options;
  const { change, ledgerPath, events } = await loadLedger(repoRoot, changeId, changeKey);

  if (!reviewId || !hasStarted(events, reviewId)) {
    return {
      code: 4,
      stderr: `Review ${reviewId || '<missing>'} has not been started`
    };
  }

  if (eventFields.event === 'review-closed' && hasClosed(events, reviewId)) {
    return {
      code: 4,
      stderr: `Review ${reviewId} is already closed`
    };
  }

  const event = parseReviewLedgerEvent({
    schema: 'review-ledger.v2',
    change: change.changeKey,
    reviewId,
    createdAt: now.toISOString(),
    createdBy: 'cc-devflow-cli',
    ...eventFields
  });

  await appendJsonl(ledgerPath, event);

  return {
    code: 0,
    reviewId,
    ledgerPath: path.relative(repoRoot, ledgerPath),
    event: event.event
  };
}

async function runReviewStart(options) {
  const {
    repoRoot,
    changeId,
    changeKey,
    mode = 'implementation',
    scope = 'current-diff',
    baseSha = 'unknown',
    headSha = 'unknown',
    selectedNodes = [],
    skippedNodes = [],
    riskLanes = [],
    now = new Date()
  } = options;
  const change = getChangePaths(repoRoot, changeId, { changeKey });
  const ledgerPath = getReviewLedgerPath(repoRoot, changeId, { changeKey });
  const existingEvents = readLedgerEvents(await readText(ledgerPath, ''));
  const reviewId = nextReviewId(existingEvents, now);
  const event = parseReviewLedgerEvent({
    schema: 'review-ledger.v2',
    change: change.changeKey,
    reviewId,
    createdAt: now.toISOString(),
    createdBy: 'cc-devflow-cli',
    event: 'review-started',
    mode,
    scope,
    baseSha,
    headSha,
    selectedNodes: normalizeArray(selectedNodes),
    skippedNodes: skippedNodes.map(parseSkippedNode),
    riskLanes: normalizeArray(riskLanes)
  });

  await appendJsonl(ledgerPath, event);

  return {
    code: 0,
    reviewId,
    ledgerPath: path.relative(repoRoot, ledgerPath),
    event: event.event
  };
}

async function runReviewRecordNode(options) {
  return appendReviewEvent(options, {
    event: 'review-node-checked',
    nodeId: options.nodeId,
    mode: options.mode || 'implementation',
    target: options.target,
    status: options.status || 'checked',
    coverage: normalizeArray(options.coverage),
    evidenceRefs: normalizeArray(options.evidenceRefs),
    findings: normalizeArray(options.findings),
    next: options.next || 'cc-check'
  });
}

async function runReviewAddFinding(options) {
  return appendReviewEvent(options, {
    event: 'review-finding-added',
    findingId: options.findingId,
    severity: options.severity || 'important',
    confidence: Number(options.confidence),
    displayTier: options.displayTier || 'blocking',
    fingerprint: options.fingerprint,
    scope: options.scope,
    path: options.path,
    evidence: options.evidence,
    recommendation: options.recommendation,
    route: options.route || 'cc-do'
  });
}

async function runReviewClose(options) {
  return appendReviewEvent(options, {
    event: 'review-closed',
    status: options.status || 'clean',
    blockingCount: Number(options.blockingCount || 0),
    warningCount: Number(options.warningCount || 0),
    next: options.next || 'cc-check'
  });
}

function renderReviewMarkdown({ changeKey, reviewId, events }) {
  const closed = events.find((event) => event.event === 'review-closed');
  const findings = events.filter((event) => event.event === 'review-finding-added');
  const lines = [
    '---',
    'Output language: en',
    `reviewId: ${reviewId}`,
    `change: ${changeKey}`,
    '---',
    '',
    `# Review ${reviewId}`,
    '',
    '## Summary',
    '',
    `- Status: ${closed?.status || 'open'}`,
    `- Blocking findings: ${closed?.blockingCount ?? 0}`,
    `- Warnings: ${closed?.warningCount ?? 0}`,
    `- Next: ${closed?.next || 'cc-check'}`,
    '',
    '## Findings',
    ''
  ];

  if (findings.length === 0) {
    lines.push('- None');
  } else {
    for (const finding of findings) {
      lines.push(
        `- ${finding.findingId} [${finding.severity}/${finding.displayTier}, confidence ${finding.confidence}] ${finding.path}`,
        `  - Evidence: ${finding.evidence}`,
        `  - Recommendation: ${finding.recommendation}`,
        `  - Route: ${finding.route}`
      );
    }
  }

  lines.push('', '## Ledger Events', '');
  for (const event of events) {
    lines.push(`- ${event.event} at ${event.createdAt}`);
  }

  return `${lines.join('\n')}\n`;
}

async function runReviewRender(options) {
  const {
    repoRoot,
    changeId,
    changeKey,
    reviewId,
    output
  } = options;
  const { change, events } = await loadLedger(repoRoot, changeId, changeKey);
  const selectedReviewId = reviewId
    || [...events].reverse().find((event) => event.event === 'review-started')?.reviewId;

  if (!selectedReviewId) {
    return { code: 4, stderr: 'No reviewId available to render' };
  }

  if (!output) {
    return { code: 4, stderr: 'review render --output is required' };
  }

  const reviewEvents = events.filter((event) => event.reviewId === selectedReviewId);
  if (reviewEvents.length === 0) {
    return { code: 4, stderr: `Review ${selectedReviewId} has no ledger events` };
  }

  const outputPath = path.isAbsolute(output) ? output : path.join(repoRoot, output);
  await writeText(outputPath, renderReviewMarkdown({
    changeKey: change.changeKey,
    reviewId: selectedReviewId,
    events: reviewEvents
  }));

  return {
    code: 0,
    reviewId: selectedReviewId,
    outputPath: path.relative(repoRoot, outputPath)
  };
}

module.exports = {
  runReviewAddFinding,
  runReviewClose,
  runReviewRecordNode,
  runReviewRender,
  runReviewStart
};
