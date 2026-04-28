#!/usr/bin/env node

const fs = require('fs');

function usage() {
  console.error(
    'Usage: render-report-card.js --change-id REQ-123 --manifest task-manifest.json --quick quick.json --strict strict.json --review review.json'
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseArgs(argv) {
  const args = {
    changeId: '',
    manifest: '',
    quick: '',
    strict: '',
    review: '',
    timestamp: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--change-id') {
      args.changeId = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--manifest') {
      args.manifest = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--quick') {
      args.quick = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--strict') {
      args.strict = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--review') {
      args.review = argv[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--timestamp') {
      args.timestamp = argv[index + 1] || '';
      index += 1;
      continue;
    }
  }

  return args;
}

function deriveVerdict(manifest, quickGates, strictGates, review) {
  if ((manifest.tasks || []).some((task) => task.status === 'failed')) {
    return 'fail';
  }

  if ([...quickGates, ...strictGates].some((gate) => gate.status === 'fail')) {
    return 'fail';
  }

  if ([...quickGates, ...strictGates].some((gate) => ['blocked', 'pending'].includes(gate.status))) {
    return 'blocked';
  }

  if (review.qa?.status === 'fail') {
    return 'fail';
  }

  if (['blocked', 'pending'].includes(review.qa?.status)) {
    return 'blocked';
  }

  if (['fail'].includes(review.qa?.feedbackLoop?.status)) {
    return 'fail';
  }

  if (['blocked', 'pending'].includes(review.qa?.feedbackLoop?.status)) {
    return 'blocked';
  }

  if (['fail'].includes(review.qa?.behaviorEvidence?.status)) {
    return 'fail';
  }

  if (['blocked', 'pending'].includes(review.qa?.behaviorEvidence?.status)) {
    return 'blocked';
  }

  if (review.status === 'blocked') {
    return 'blocked';
  }

  if (review.status === 'fail') {
    return 'fail';
  }

  const freshness = buildReviewFreshness(review).status;
  if (review.status === 'pass' && !['fresh', 'not-applicable'].includes(freshness)) {
    return 'blocked';
  }

  const openOwnedFailures = (review.runtime?.failureOwnership || []).some((item) => {
    const classification = item.classification || '';
    const status = item.status || 'open';
    return ['in-branch', 'ambiguous'].includes(classification) && !['resolved', 'closed'].includes(status);
  });
  if (openOwnedFailures) {
    return 'blocked';
  }

  return 'pass';
}

function deriveReroute({ verdict, review, manifest, blockingFindings }) {
  if (verdict === 'pass') {
    return 'none';
  }

  const taskFailures = (manifest.tasks || []).some((task) => task.status === 'failed');
  if (taskFailures) {
    return 'cc-do';
  }

  const rerouteSignals = [
    review.summary || '',
    review.details || '',
    ...(blockingFindings || [])
  ].join(' ').toLowerCase();

  if (/(root cause|repro|debug|investigat|regression)/.test(rerouteSignals)) {
    return 'cc-investigate';
  }

  if (/(design|scope|plan|planning|requirement|contract)/.test(rerouteSignals)) {
    return 'cc-plan';
  }

  return 'cc-do';
}

function buildSummary({ quickGates, strictGates, review, verdict }) {
  const gateSummary = (gates) => `${gates.filter((gate) => gate.status === 'pass').length}/${gates.length}`;
  return [
    `verdict=${verdict}`,
    `quick=${gateSummary(quickGates)}`,
    `strict=${gateSummary(strictGates)}`,
    `review=${review.status}`
  ].join(' ');
}

function claimFromGate(gate) {
  const name = String(gate.name || '').toLowerCase();
  if (/test|spec/.test(name)) {
    return 'tests-pass';
  }
  if (/lint/.test(name)) {
    return 'lint-clean';
  }
  if (/type/.test(name)) {
    return 'typecheck-clean';
  }
  if (/build|compile/.test(name)) {
    return 'build-succeeds';
  }
  return `gate-${gate.name || 'unknown'}`;
}

function buildClaimEvidence({ manifest, quickGates, strictGates, review }) {
  const gateClaims = [...quickGates, ...strictGates].map((gate) => ({
    claim: claimFromGate(gate),
    requiredProof: 'fresh command output with exit status and key observation',
    commandOrArtifact: gate.command || gate.name || '',
    exitStatus: gate.exitStatus ?? null,
    keyObservation: gate.summary || gate.details || '',
    status: gate.status || 'blocked'
  }));

  const openTasks = (manifest.tasks || []).filter((task) => task.status !== 'done' && task.status !== 'completed');
  gateClaims.push({
    claim: 'requirements-met',
    requiredProof: 'line-by-line planning/tasks.md and task-manifest.json checklist',
    commandOrArtifact: 'planning/tasks.md + planning/task-manifest.json',
    exitStatus: null,
    keyObservation: openTasks.length === 0 ? 'no open task gaps recorded' : `${openTasks.length} open task gaps recorded`,
    status: openTasks.length === 0 && review.status === 'pass' ? 'pass' : 'blocked'
  });

  return [...(review.claimEvidence || []), ...gateClaims];
}

function buildQa(review) {
  return {
    status: review.qa?.status || 'skipped',
    feedbackLoop: review.qa?.feedbackLoop || {
      status: 'skipped',
      mode: 'not-applicable',
      commandOrArtifact: '',
      speed: '',
      determinism: '',
      signalSharpness: '',
      reproductionRate: '',
      attempts: [],
      blockedReason: 'not recorded'
    },
    behaviorEvidence: review.qa?.behaviorEvidence || {
      status: 'skipped',
      userFacingBoundary: '',
      expectedBehavior: '',
      actualBehavior: '',
      reproductionSteps: [],
      consistency: '',
      domainLanguage: []
    },
    regressionProof: review.qa?.regressionProof || [],
    testQuality: review.qa?.testQuality || [],
    coverageAudit: review.qa?.coverageAudit || {
      status: 'skipped',
      coveragePct: null,
      pathMap: [],
      gaps: [],
      testsAdded: [],
      e2eRequired: false,
      evalRequired: false,
      qualityStars: ''
    },
    browserEvidence: review.qa?.browserEvidence || {
      status: 'skipped',
      mode: 'not-applicable',
      affectedRoutes: [],
      screenshots: [],
      consoleErrors: [],
      healthScore: null,
      issues: [],
      skipReason: 'not recorded'
    },
    architectureFollowUps: review.qa?.architectureFollowUps || [],
    tddException: review.qa?.tddException || null
  };
}

function buildRuntime(review) {
  const failureOwnership = review.runtime?.failureOwnership || [];
  const hasOpenOwnedFailure = failureOwnership.some((item) => {
    const classification = item.classification || '';
    const status = item.status || 'open';
    return ['in-branch', 'ambiguous'].includes(classification) && !['resolved', 'closed'].includes(status);
  });

  return {
    status: review.runtime?.status || (hasOpenOwnedFailure ? 'blocked' : 'pass'),
    failureOwnership
  };
}

function firstReviewHead(review) {
  return [
    review.taskReviews?.reviewPacket?.headSha,
    review.diffReview?.reviewPacket?.headSha
  ].find((value) => typeof value === 'string' && value.length > 0) || '';
}

function buildReviewFreshness(review) {
  if (review.freshness) {
    return review.freshness;
  }

  const headSha = firstReviewHead(review);
  if (!headSha) {
    return {
      status: 'unknown',
      reviewedCommit: '',
      currentCommit: '',
      commitsSinceReview: null,
      staleReason: 'review headSha is not recorded'
    };
  }

  return {
    status: 'fresh',
    reviewedCommit: headSha,
    currentCommit: headSha,
    commitsSinceReview: 0,
    staleReason: ''
  };
}

function buildReview(review) {
  return {
    ...review,
    freshness: buildReviewFreshness(review),
    qualityScore: review.qualityScore ?? null,
    specialistReviews: review.specialistReviews || []
  };
}

function isFindingOpen(item) {
  const status = item.status || item.triageStatus || '';
  return !['resolved', 'accepted', 'informational', 'accepted-fixed', 'rejected-with-evidence', 'deferred-minor'].includes(status);
}

function summarizeOpenReviewFindings(findings = []) {
  return findings
    .filter(isFindingOpen)
    .map((item) => `${item.source || 'review'}: ${item.summary || item.evidence || 'open finding'}`);
}

function collectBlockingFindings({ manifest, quickGates, strictGates, review }) {
  const findings = [];

  for (const task of manifest.tasks || []) {
    if (task.status === 'failed') {
      findings.push(`${task.id}: ${task.lastError || 'task failed'}`);
    }
  }

  for (const gate of [...quickGates, ...strictGates]) {
    if (['fail', 'blocked', 'pending'].includes(gate.status)) {
      findings.push(`${gate.name}: ${gate.details || gate.summary || gate.status}`);
    }
  }

  if (review.status === 'blocked' || review.status === 'fail') {
    findings.push(`review: ${review.summary || review.details || review.status}`);
  }

  return findings.concat(summarizeOpenReviewFindings(review.findings || []));
}

function deriveSpecSignals(manifest, verdict, review) {
  const spec = manifest.spec || {};
  const hasSpec =
    Boolean(spec.primaryCapability) ||
    (Array.isArray(spec.secondaryCapabilities) && spec.secondaryCapabilities.length > 0) ||
    (Array.isArray(spec.specFiles) && spec.specFiles.length > 0);

  if (!hasSpec || review.status === 'blocked') {
    return {
      specAlignment: 'blocked',
      specDeltaVerified: false,
      specSyncReady: false
    };
  }

  if (verdict === 'fail') {
    return {
      specAlignment: 'fail',
      specDeltaVerified: false,
      specSyncReady: false
    };
  }

  return {
    specAlignment: 'pass',
    specDeltaVerified: true,
    specSyncReady: true
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.changeId || !args.manifest || !args.quick || !args.strict || !args.review) {
    usage();
    process.exit(1);
  }

  const manifest = readJson(args.manifest);
  const quickGates = readJson(args.quick);
  const strictGates = readJson(args.strict);
  const review = readJson(args.review);

  const blockingFindings = collectBlockingFindings({
    manifest,
    quickGates,
    strictGates,
    review
  });
  const verdict = deriveVerdict(manifest, quickGates, strictGates, review);
  const reroute = deriveReroute({
    verdict,
    review,
    manifest,
    blockingFindings
  });
  const specSignals = deriveSpecSignals(manifest, verdict, review);
  const claimEvidence = buildClaimEvidence({
    manifest,
    quickGates,
    strictGates,
    review
  });
  const runtime = buildRuntime(review);
  const qa = buildQa(review);
  const reviewReport = buildReview(review);

  const report = {
    changeId: args.changeId,
    verdict,
    overall: verdict === 'pass' ? 'pass' : 'fail',
    summary: buildSummary({
      quickGates,
      strictGates,
      review,
      verdict
    }),
    specAlignment: specSignals.specAlignment,
    specDeltaVerified: specSignals.specDeltaVerified,
    specSyncReady: specSignals.specSyncReady,
    runtime,
    claimEvidence,
    qa,
    quickGates,
    strictGates,
    review: reviewReport,
    blockingFindings,
    gaps: manifest.spec?.newGaps || [],
    reroute,
    timestamp: args.timestamp || new Date().toISOString()
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
