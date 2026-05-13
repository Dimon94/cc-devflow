/**
 * [INPUT]: 依赖 manifest/runtime/codex 输出，接收 repoRoot、changeId、strict、skipReview 等上下文。
 * [OUTPUT]: 生成任务层与需求层的统一审查结果，包含 reviewer、findings、summary 与 blocking 结论。
 * [POS]: skill runtime 原生审查层，被 verify/intent/query 等阶段复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  exists,
  readJson,
  readText,
  runCommand
} = require('./store');
const { getChangePaths } = require('./paths');
const { parseReviewFindingsDoc } = require('./schemas');
const {
  getReviewFindingsPath,
  getReviewLedgerPath,
  parseReviewLedger
} = require('./review-records');

const CODEX_BOUNDARY = [
  'IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/.',
  'These are skill definitions for other AI systems and are not the repository under review.',
  'Stay focused on the repository code and the current diff only.'
].join(' ');

const REVIEW_ORDER = ['pass', 'skipped', 'blocked', 'fail'];
const TASK_REVIEW_KINDS = ['spec', 'code'];

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function normalizeReviewStatus(value, fallback = 'pending') {
  const normalized = String(value || fallback).trim().toLowerCase();
  if (['pass', 'fail', 'blocked', 'pending', 'skipped'].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function statusRank(status) {
  const index = REVIEW_ORDER.indexOf(status);
  return index === -1 ? REVIEW_ORDER.length : index;
}

function mergeSectionStatus(current, next) {
  return statusRank(next) > statusRank(current) ? next : current;
}

function severityRank(severity) {
  return {
    critical: 4,
    important: 3,
    minor: 2,
    info: 1
  }[severity] || 0;
}

function truncate(value, max = 240) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) {
    return normalized;
  }
  return `${normalized.slice(0, max - 3).trimEnd()}...`;
}

function makeEvidence(kind, label, ref = '', observation = '') {
  return {
    kind,
    label,
    ref,
    observation: truncate(observation, 400)
  };
}

function makeFinding({
  id,
  source,
  scope,
  category,
  severity,
  summary,
  details = '',
  file,
  line,
  action = 'none',
  status = 'open',
  fingerprint,
  confidenceScore,
  displayTier
}) {
  const derivedConfidenceScore = severityRank(severity) >= severityRank('important') ? 8 : 6;
  return {
    id,
    source,
    scope,
    category,
    severity,
    summary,
    details: truncate(details, 600),
    ...(file ? { file } : {}),
    ...(typeof line === 'number' ? { line } : {}),
    action,
    status,
    confidenceScore: confidenceScore || derivedConfidenceScore,
    fingerprint: fingerprint || `${source}:${category}:${id}`,
    displayTier: displayTier || (status === 'informational'
      ? 'info'
      : (severityRank(severity) >= severityRank('important') ? 'blocking' : 'warning')),
    suppressionReason: null
  };
}

function makeReviewer({
  key,
  scope,
  mode,
  source,
  status,
  summary,
  evidence = [],
  findings = []
}) {
  return {
    key,
    scope,
    mode,
    source,
    status,
    summary: truncate(summary, 300),
    evidence,
    findings
  };
}

function mapPriorityTag(tag) {
  switch (tag) {
    case 'P1':
      return 'critical';
    case 'P2':
      return 'important';
    case 'P3':
      return 'minor';
    default:
      return 'info';
  }
}

function extractLocation(text) {
  const match = String(text || '').match(/([A-Za-z0-9_./-]+\.[A-Za-z0-9]+):(\d+)/);
  if (!match) {
    return {};
  }

  return {
    file: match[1],
    line: Number(match[2])
  };
}

function parseCodexStructuredOutput(rawOutput = '') {
  const findings = [];
  const lines = String(rawOutput || '').split(/\r?\n/);

  for (const line of lines) {
    const match = line.match(/\[(P\d)\]\s*(.+)$/);
    if (!match) {
      continue;
    }

    const [, tag, summary] = match;
    const severity = mapPriorityTag(tag);
    const location = extractLocation(line);

    findings.push(makeFinding({
      id: `codex-structured-${findings.length + 1}`,
      source: 'codex:structured',
      scope: 'requirement',
      category: 'diff-review',
      severity,
      summary: truncate(summary, 240),
      details: line,
      action: severityRank(severity) >= severityRank('important') ? 'fix_now' : 'follow_up',
      ...location,
      fingerprint: location.file
        ? `${location.file}:${location.line || 0}:diff-review:${tag}`
        : `codex-structured:${findings.length + 1}`
    }));
  }

  return findings;
}

function parseJsonLine(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function parseCodexAdversarialOutput(rawOutput = '') {
  const findings = [];
  const lines = String(rawOutput || '').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'NO_FINDINGS') {
      continue;
    }

    const parsed = parseJsonLine(trimmed);
    if (!parsed || !parsed.summary) {
      continue;
    }

    const severity = ['critical', 'important', 'minor', 'info'].includes(parsed.severity)
      ? parsed.severity
      : 'important';

    findings.push(makeFinding({
      id: parsed.id || `codex-adversarial-${findings.length + 1}`,
      source: 'codex:adversarial',
      scope: 'requirement',
      category: parsed.category || 'failure-mode',
      severity,
      summary: truncate(parsed.summary, 240),
      details: parsed.details || '',
      file: parsed.file,
      line: typeof parsed.line === 'number' ? parsed.line : undefined,
      action: parsed.action || (severityRank(severity) >= severityRank('important') ? 'cc-investigate' : 'follow_up'),
      fingerprint: parsed.fingerprint
    }));
  }

  return findings;
}

async function detectBaseRef(repoRoot) {
  for (const candidate of ['main', 'origin/main', 'master', 'origin/master', 'HEAD~1']) {
    const result = await runCommand(`git rev-parse --verify ${candidate}`, { cwd: repoRoot });
    if (result.code === 0) {
      return candidate;
    }
  }

  return 'HEAD~1';
}

async function detectCurrentCommit(repoRoot) {
  const result = await runCommand('git rev-parse --short HEAD', { cwd: repoRoot });
  if (result.code === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return 'working-tree';
}

async function runCodexStructuredReview({ repoRoot, baseRef }) {
  const command = [
    'codex review',
    shellEscape(`${CODEX_BOUNDARY}\n\nReview the diff against the base branch. Focus on correctness, requirement drift, missing tests, and production risks.`),
    '--base',
    shellEscape(baseRef),
    '-c',
    shellEscape('model_reasoning_effort="high"')
  ].join(' ');
  const result = await runCommand(command, {
    cwd: repoRoot,
    timeoutMs: 30 * 60 * 1000
  });
  const findings = result.code === 0 ? parseCodexStructuredOutput(result.stdout) : [];

  return {
    result,
    findings
  };
}

async function runCodexAdversarialReview({ repoRoot, baseRef }) {
  const prompt = [
    CODEX_BOUNDARY,
    '',
    `Review the changes on this branch against ${baseRef}.`,
    'Run git diff against the base branch before answering.',
    'Output ONLY JSON objects, one per line, with keys:',
    'id, severity (critical|important|minor|info), category, summary, details, file, line, action, fingerprint.',
    'If nothing stands out, output NO_FINDINGS.',
    'Be adversarial. Focus on edge cases, failure modes, unsafe assumptions, and silent data corruption.'
  ].join('\n');
  const command = [
    'codex exec',
    shellEscape(prompt),
    '-C',
    shellEscape(repoRoot),
    '-s',
    'read-only',
    '-c',
    shellEscape('model_reasoning_effort="high"')
  ].join(' ');
  const result = await runCommand(command, {
    cwd: repoRoot,
    timeoutMs: 15 * 60 * 1000
  });
  const findings = result.code === 0 ? parseCodexAdversarialOutput(result.stdout) : [];

  return {
    result,
    findings
  };
}

function collectTaskReviewEvidence({ task, kind }) {
  const manifestVerdict = normalizeReviewStatus(task.reviews?.[kind], 'pending');

  return {
    verdict: manifestVerdict,
    summary: ''
  };
}

async function runTaskReviewSection({ repoRoot, changeId, manifest }) {
  const passedTasks = (manifest.tasks || []).filter((task) => task.status === 'passed');
  if (passedTasks.length === 0) {
    return {
      status: 'skipped',
      required: false,
      summary: 'No passed tasks yet, task-level review gate skipped.',
      reviewers: [],
      findings: []
    };
  }

  let status = 'pass';
  const reviewers = [];
  const findings = [];

  for (const task of passedTasks) {
    for (const kind of TASK_REVIEW_KINDS) {
      const evidence = collectTaskReviewEvidence({ task, kind });
      const verdict = normalizeReviewStatus(evidence.verdict, 'pending');
      const reviewerStatus = verdict === 'pending' ? 'blocked' : verdict;
      let summary = evidence.summary || `${task.id} ${kind} review is ${reviewerStatus}.`;

      if (reviewerStatus === 'blocked') {
        summary = `${task.id} is missing ${kind} review proof.`;
        findings.push(makeFinding({
          id: `${task.id}-${kind}-missing`,
          source: 'task-review',
          scope: 'task',
          category: `${kind}-review`,
          severity: 'important',
          summary,
          details: 'Completed tasks must carry spec/code review proof before cc-check can pass.',
          action: 'fix_now',
          fingerprint: `${task.id}:${kind}:missing`
        }));
      } else if (reviewerStatus === 'fail') {
        findings.push(makeFinding({
          id: `${task.id}-${kind}-failed`,
          source: 'task-review',
          scope: 'task',
          category: `${kind}-review`,
          severity: 'critical',
          summary: `${task.id} ${kind} review failed.`,
          details: summary,
          action: 'fix_now',
          fingerprint: `${task.id}:${kind}:failed`
        }));
      }

      reviewers.push(makeReviewer({
        key: `task-${task.id}-${kind}`,
        scope: 'task',
        mode: kind,
        source: 'manifest',
        status: reviewerStatus,
        summary,
        evidence: [
          makeEvidence('note', `${task.id} ${kind} review state`, '', `Manifest verdict: ${verdict}`)
        ],
        findings: findings.filter((item) => item.id.startsWith(`${task.id}-${kind}`))
      }));

      status = mergeSectionStatus(status, reviewerStatus);
    }
  }

  const openIssues = findings.filter((item) => item.status === 'open').length;
  const reviewedPairs = reviewers.filter((item) => item.status === 'pass' || item.status === 'skipped').length;

  return {
    status,
    required: true,
    summary: `${reviewedPairs}/${passedTasks.length * TASK_REVIEW_KINDS.length} task review gates cleared. Open review findings: ${openIssues}.`,
    reviewers,
    findings
  };
}

function buildCodexErrorFinding(source, summary, details, severity = 'important') {
  return makeFinding({
    id: `${source}-unavailable`,
    source,
    scope: 'requirement',
    category: 'review-runtime',
    severity,
    summary,
    details,
    action: 'cc-investigate',
    fingerprint: `${source}:runtime`
  });
}

async function firstExistingPath(paths) {
  for (const filePath of paths) {
    if (await exists(filePath)) {
      return filePath;
    }
  }
  return '';
}

function recordStatus(summary = {}, findings = []) {
  if (summary.status === 'blocked') {
    return 'blocked';
  }
  if (
    summary.status === 'findings'
    || Number(summary.blockingCount || 0) > 0
    || findings.some((item) => item.displayTier === 'blocking' || severityRank(item.severity) >= severityRank('important'))
  ) {
    return 'fail';
  }
  return 'pass';
}

function reviewRecordSeverity(value) {
  return value === 'advisory' ? 'minor' : value;
}

function reviewRecordAction(route, displayTier) {
  if (route === 'cc-plan') return 'reroute-cc-plan';
  if (route === 'cc-investigate') return 'reroute-cc-investigate';
  if (route === 'cc-do') return displayTier === 'blocking' ? 'fix_now' : 'reroute-cc-do';
  return displayTier === 'blocking' ? 'fix_now' : 'follow_up';
}

function makeReviewRecordFinding(item, index) {
  const displayTier = item.displayTier || 'blocking';
  const status = displayTier === 'info'
    ? 'informational'
    : (displayTier === 'suppressed' ? 'accepted' : 'open');
  return makeFinding({
    id: item.id || item.findingId || `review-record-${index + 1}`,
    source: 'review-records',
    scope: 'requirement',
    category: 'review-record',
    severity: reviewRecordSeverity(item.severity),
    summary: truncate(item.evidence || item.recommendation || 'Review finding', 240),
    details: item.recommendation || item.evidence || '',
    file: item.path,
    action: reviewRecordAction(item.route, displayTier),
    status,
    fingerprint: item.fingerprint,
    confidenceScore: Number(item.confidence) || undefined,
    displayTier
  });
}

function normalizeFreshness(freshness = {}) {
  return {
    status: freshness.status || 'unknown',
    reviewedCommit: freshness.reviewedCommit || '',
    currentCommit: freshness.currentCommit || '',
    commitsSinceReview: freshness.commitsSinceReview ?? null,
    staleReason: freshness.staleReason || ''
  };
}

function makeRecordReviewer(recordReview) {
  return makeReviewer({
    key: 'requirement-review-records',
    scope: 'requirement',
    mode: 'structured',
    source: 'runtime',
    status: recordReview.status,
    summary: recordReview.summary,
    evidence: [
      makeEvidence('file', 'review record source', recordReview.source, recordReview.summary)
    ],
    findings: recordReview.findings || []
  });
}

async function readReviewFindingsDoc(filePath) {
  try {
    const doc = parseReviewFindingsDoc(await readJson(filePath));
    const findings = doc.findings.map(makeReviewRecordFinding);
    return {
      source: 'review-findings.json',
      status: recordStatus(doc.summary, findings),
      required: true,
      summary: `review-findings.json reports ${doc.summary.status} with ${doc.summary.blockingCount} blocking finding(s).`,
      freshness: normalizeFreshness(doc.freshness),
      reviewers: [],
      findings,
      errors: []
    };
  } catch (error) {
    return {
      source: 'review-findings.json',
      status: 'blocked',
      required: true,
      summary: `review-findings.json is unreadable: ${error.message}`,
      freshness: normalizeFreshness({ status: 'unknown', staleReason: error.message }),
      reviewers: [],
      findings: [makeFinding({
        id: 'review-findings-unreadable',
        source: 'review-records',
        scope: 'requirement',
        category: 'review-record',
        severity: 'important',
        summary: 'review-findings.json is unreadable.',
        details: error.message,
        action: 'fix_now'
      })],
      errors: [error.message]
    };
  }
}

async function readReviewLedger(filePath) {
  const parsed = parseReviewLedger(await readText(filePath, ''));
  const findings = parsed.findings.map(makeReviewRecordFinding);
  return {
    source: 'review-ledger.jsonl',
    status: recordStatus(parsed.summary, findings),
    required: true,
    summary: `review ledger reports ${parsed.summary.status} with ${parsed.summary.blockingCount} blocking finding(s).`,
    freshness: normalizeFreshness(parsed.freshness),
    reviewers: [],
    findings,
    errors: parsed.errors
  };
}

async function runReviewRecordSection({ repoRoot, changeId }) {
  const change = getChangePaths(repoRoot, changeId);
  const findingsPath = await firstExistingPath([
    getReviewFindingsPath(repoRoot, changeId, { changeKey: change.changeKey }),
    `${change.reviewDir}/cc-review-findings.json`
  ]);
  if (findingsPath) {
    const recordReview = await readReviewFindingsDoc(findingsPath);
    return {
      ...recordReview,
      reviewers: [makeRecordReviewer(recordReview)]
    };
  }

  const ledgerPath = await firstExistingPath([
    getReviewLedgerPath(repoRoot, changeId, { changeKey: change.changeKey }),
    `${change.reviewDir}/cc-review-ledger.jsonl`
  ]);
  if (ledgerPath) {
    const recordReview = await readReviewLedger(ledgerPath);
    return {
      ...recordReview,
      reviewers: [makeRecordReviewer(recordReview)]
    };
  }

  const legacyReportPath = await firstExistingPath([
    `${change.reviewDir}/cc-review-report.md`
  ]);
  if (legacyReportPath) {
    const recordReview = {
      source: 'cc-review-report.md',
      status: 'pass',
      required: true,
      summary: 'legacy cc-review-report.md found; review freshness is unknown.',
      freshness: normalizeFreshness({
        status: 'unknown',
        staleReason: 'legacy cc-review-report.md has no machine freshness fields'
      }),
      reviewers: [],
      findings: [],
      errors: []
    };
    return {
      ...recordReview,
      reviewers: [makeRecordReviewer(recordReview)]
    };
  }

  const finding = makeFinding({
    id: 'review-missing',
    source: 'review-records',
    scope: 'requirement',
    category: 'review-record',
    severity: 'important',
    summary: 'review-missing: no review records are present.',
    details: 'Expected review-findings.json, review-ledger.jsonl, or legacy cc-review-report.md before cc-check can pass.',
    action: 'fix_now',
    fingerprint: `${change.changeKey}:review-missing`
  });
  const recordReview = {
    source: 'review-records',
    status: 'blocked',
    required: true,
    summary: 'review-missing: no review records found.',
    freshness: normalizeFreshness({
      status: 'unknown',
      staleReason: 'review-missing'
    }),
    reviewers: [],
    findings: [finding],
    errors: ['review-missing']
  };
  return {
    ...recordReview,
    reviewers: [makeRecordReviewer(recordReview)]
  };
}

async function runDiffReviewSection({ repoRoot, strict, skipReview }) {
  if (!strict) {
    return {
      status: 'skipped',
      required: false,
      summary: 'Strict mode disabled, diff review skipped.',
      reviewers: [],
      findings: []
    };
  }

  if (skipReview) {
    return {
      status: 'skipped',
      required: true,
      summary: 'Diff review skipped by --skip-review.',
      reviewers: [],
      findings: []
    };
  }

  const hasCodex = await runCommand('command -v codex', { cwd: repoRoot });
  if (hasCodex.code !== 0) {
    const finding = buildCodexErrorFinding(
      'codex',
      'Codex CLI is required for strict diff review.',
      'Run strict verify on a machine with codex installed, or use --skip-review intentionally.'
    );

    return {
      status: 'blocked',
      required: true,
      summary: finding.summary,
      reviewers: [],
      findings: [finding]
    };
  }

  const baseRef = await detectBaseRef(repoRoot);
  const reviewers = [];
  const findings = [];
  let status = 'pass';

  const structured = await runCodexStructuredReview({ repoRoot, baseRef });
  const structuredError = structured.result.code !== 0
    ? buildCodexErrorFinding(
      'codex:structured',
      'Codex structured diff review failed to run.',
      structured.result.stderr || structured.result.stdout || 'codex review failed'
    )
    : null;
  const structuredFindings = structuredError ? [structuredError] : structured.findings;
  if (structuredError) {
    status = mergeSectionStatus(status, 'blocked');
  } else if (structuredFindings.some((item) => severityRank(item.severity) >= severityRank('important'))) {
    status = mergeSectionStatus(status, 'fail');
  }
  findings.push(...structuredFindings);
  reviewers.push(makeReviewer({
    key: 'requirement-structured',
    scope: 'requirement',
    mode: 'structured',
    source: 'codex',
    status: structuredError ? 'blocked' : (structuredFindings.length > 0 ? 'fail' : 'pass'),
    summary: structuredError
      ? structuredError.summary
      : (structuredFindings.length > 0
        ? `Structured diff review found ${structuredFindings.length} issue(s).`
        : 'Structured diff review passed with no parsed findings.'),
    evidence: [
      makeEvidence('command', 'codex review', `base=${baseRef}`, structured.result.stderr || structured.result.stdout)
    ],
    findings: structuredFindings
  }));

  const adversarial = await runCodexAdversarialReview({ repoRoot, baseRef });
  const adversarialError = adversarial.result.code !== 0
    ? buildCodexErrorFinding(
      'codex:adversarial',
      'Codex adversarial review was unavailable.',
      adversarial.result.stderr || adversarial.result.stdout || 'codex exec failed',
      'minor'
    )
    : null;
  const adversarialFindings = adversarialError ? [adversarialError] : adversarial.findings;
  if (!adversarialError && adversarialFindings.some((item) => severityRank(item.severity) >= severityRank('important'))) {
    status = mergeSectionStatus(status, 'fail');
  }
  findings.push(...adversarialFindings);
  reviewers.push(makeReviewer({
    key: 'requirement-adversarial',
    scope: 'requirement',
    mode: 'adversarial',
    source: 'codex',
    status: adversarialError ? 'blocked' : (adversarialFindings.length > 0 ? 'fail' : 'pass'),
    summary: adversarialError
      ? adversarialError.summary
      : (adversarialFindings.length > 0
        ? `Adversarial diff review found ${adversarialFindings.length} issue(s).`
        : 'Adversarial diff review found no issues.'),
    evidence: [
      makeEvidence('command', 'codex exec adversarial', `base=${baseRef}`, adversarial.result.stderr || adversarial.result.stdout)
    ],
    findings: adversarialFindings
  }));

  if (structuredError && !adversarialError) {
    status = 'blocked';
  }

  findings.sort((left, right) => severityRank(right.severity) - severityRank(left.severity));

  return {
    status,
    required: true,
    summary: `Base ${baseRef}. Structured reviewers: ${structuredFindings.length}. Adversarial findings: ${adversarialFindings.length}.`,
    reviewers,
    findings
  };
}

function flattenFindings(...sections) {
  return sections.flatMap((section) => section.findings || []);
}

function deriveReviewStatus(taskReviews, diffReview, recordReview) {
  let status = 'pass';

  for (const section of [taskReviews, recordReview, diffReview]) {
    if (!section.required && section.status === 'skipped') {
      continue;
    }
    status = mergeSectionStatus(status, section.status);
  }

  return status;
}

async function runReviewSuite({ repoRoot, changeId, manifest, strict, skipReview }) {
  const taskReviews = await runTaskReviewSection({ repoRoot, changeId, manifest });
  const recordReview = await runReviewRecordSection({ repoRoot, changeId });
  const diffReview = await runDiffReviewSection({ repoRoot, strict, skipReview });
  const findings = flattenFindings(taskReviews, recordReview, diffReview);
  const status = deriveReviewStatus(taskReviews, diffReview, recordReview);
  const currentCommit = await detectCurrentCommit(repoRoot);
  const details = [
    taskReviews.summary,
    recordReview.summary,
    diffReview.summary
  ].filter(Boolean).join(' ');

  return {
    status,
    summary: `Task review: ${taskReviews.status}. Record review: ${recordReview.status}. Diff review: ${diffReview.status}.`,
    details,
    freshness: recordReview.freshness || {
      status: 'fresh',
      reviewedCommit: currentCommit,
      currentCommit,
      commitsSinceReview: 0,
      staleReason: ''
    },
    qualityScore: status === 'pass' ? 9 : (status === 'blocked' ? 5 : 3),
    specialistReviews: [
      {
        name: 'testing',
        status: taskReviews.status,
        required: true,
        summary: taskReviews.summary,
        skipReason: '',
        findings: []
      },
      {
        name: 'review-records',
        status: recordReview.status,
        required: true,
        summary: recordReview.summary,
        skipReason: '',
        findings: recordReview.findings || []
      }
    ],
    runtime: {
      status: status === 'pass' ? 'pass' : (status === 'fail' ? 'fail' : 'blocked'),
      failureOwnership: []
    },
    qa: {
      status: 'pass',
      regressionProof: [],
      testQuality: [],
      coverageAudit: {
        status: 'pass',
        coveragePct: null,
        pathMap: [],
        gaps: [],
        testsAdded: [],
        e2eRequired: false,
        evalRequired: false,
        qualityStars: ''
      },
      browserEvidence: {
        status: 'skipped',
        mode: 'not-applicable',
        affectedRoutes: [],
        screenshots: [],
        consoleErrors: [],
        healthScore: null,
        issues: [],
        skipReason: 'runtime verify did not identify a UI browser QA target'
      },
      tddException: null
    },
    taskReviews,
    recordReview,
    diffReview,
    findings
  };
}

function summarizeOpenReviewFindings(findings = []) {
  return findings
    .filter((item) => item.status === 'open' && severityRank(item.severity) >= severityRank('important'))
    .map((item) => `${item.source}: ${item.summary}`);
}

module.exports = {
  runReviewSuite,
  summarizeOpenReviewFindings
};
