/**
 * [INPUT]: 依赖 manifest/runtime/codex 输出，接收 repoRoot、changeId、strict、skipReview 等上下文。
 * [OUTPUT]: 生成任务层与需求层的统一审查结果，包含 reviewer、findings、summary 与 blocking 结论。
 * [POS]: skill runtime 原生审查层，被 verify/intent/query 等阶段复用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  runCommand
} = require('./store');

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
  fingerprint
}) {
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
    ...(fingerprint ? { fingerprint } : {})
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

function deriveReviewStatus(taskReviews, diffReview) {
  let status = 'pass';

  for (const section of [taskReviews, diffReview]) {
    if (!section.required && section.status === 'skipped') {
      continue;
    }
    status = mergeSectionStatus(status, section.status);
  }

  return status;
}

async function runReviewSuite({ repoRoot, changeId, manifest, strict, skipReview }) {
  const taskReviews = await runTaskReviewSection({ repoRoot, changeId, manifest });
  const diffReview = await runDiffReviewSection({ repoRoot, strict, skipReview });
  const findings = flattenFindings(taskReviews, diffReview);
  const status = deriveReviewStatus(taskReviews, diffReview);
  const details = [
    taskReviews.summary,
    diffReview.summary
  ].filter(Boolean).join(' ');

  return {
    status,
    summary: `Task review: ${taskReviews.status}. Diff review: ${diffReview.status}.`,
    details,
    taskReviews,
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
