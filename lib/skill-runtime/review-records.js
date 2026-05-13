/**
 * [INPUT]: 依赖 path/change paths 和 review ledger event 列表。
 * [OUTPUT]: 提供 review 记录路径、reviewId 分配、CLI 参数归一化和 ledger 容错解析。
 * [POS]: review durable records 的小核心；不写文件，只计算稳定标识和路径。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');

const { getChangePaths } = require('./paths');
const { parseReviewLedgerEvent } = require('./schemas');

function getReviewLedgerPath(repoRoot, changeId, options = {}) {
  return path.join(getChangePaths(repoRoot, changeId, options).reviewDir, 'review-ledger.jsonl');
}

function getReviewFindingsPath(repoRoot, changeId, options = {}) {
  return path.join(getChangePaths(repoRoot, changeId, options).reviewDir, 'review-findings.json');
}

function reviewIdDate(date = new Date()) {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function nextReviewId(events = [], date = new Date()) {
  const datePart = reviewIdDate(date);
  const prefix = `RVW-${datePart}-`;
  const maxSequence = events.reduce((max, event) => {
    const reviewId = String(event?.reviewId || '');
    if (!reviewId.startsWith(prefix)) {
      return max;
    }

    const sequence = Number(reviewId.slice(prefix.length));
    return Number.isInteger(sequence) && sequence > max ? sequence : max;
  }, 0);

  return `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;
}

function parseSkippedNode(value) {
  const text = String(value || '').trim();
  const separator = text.indexOf(':');
  if (separator === -1) {
    return { node: text, reason: '' };
  }

  return {
    node: text.slice(0, separator).trim(),
    reason: text.slice(separator + 1).trim()
  };
}

function freshnessForLedger(entries, errors) {
  if (errors.length > 0) {
    return {
      status: 'unknown',
      reviewedCommit: '',
      currentCommit: '',
      commitsSinceReview: null,
      staleReason: 'review ledger contained unparseable rows'
    };
  }

  const latestClosed = [...entries].reverse().find((event) => event.event === 'review-closed');
  const started = latestClosed
    ? entries.find((event) => event.reviewId === latestClosed.reviewId && event.event === 'review-started')
    : [...entries].reverse().find((event) => event.event === 'review-started');
  const headSha = started?.headSha || '';

  return {
    status: headSha ? 'fresh' : 'unknown',
    reviewedCommit: headSha,
    currentCommit: headSha,
    commitsSinceReview: headSha ? 0 : null,
    staleReason: headSha ? '' : 'review ledger has no started event with headSha'
  };
}

function parseReviewLedger(text = '') {
  const entries = [];
  const errors = [];

  String(text || '').split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      entries.push(parseReviewLedgerEvent(JSON.parse(trimmed)));
    } catch (error) {
      errors.push(`line ${index + 1}: ${error.message}`);
    }
  });

  const latestClosed = [...entries].reverse().find((event) => event.event === 'review-closed');
  const findings = entries.filter((event) => event.event === 'review-finding-added');

  return {
    entries,
    errors,
    freshness: freshnessForLedger(entries, errors),
    summary: {
      status: latestClosed?.status || 'blocked',
      blockingCount: latestClosed?.blockingCount ?? findings.filter((event) => event.displayTier === 'blocking').length,
      warningCount: latestClosed?.warningCount ?? findings.filter((event) => event.displayTier === 'warning').length,
      next: latestClosed?.next || (errors.length > 0 ? 'cc-do' : 'cc-check')
    },
    findings
  };
}

module.exports = {
  getReviewFindingsPath,
  getReviewLedgerPath,
  nextReviewId,
  parseReviewLedger,
  parseSkippedNode
};
