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

  if (review.status === 'blocked') {
    return 'blocked';
  }

  if (review.status === 'fail') {
    return 'fail';
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

function summarizeOpenReviewFindings(findings = []) {
  return findings
    .filter((item) => item.status !== 'resolved' && item.status !== 'accepted' && item.status !== 'informational')
    .map((item) => `${item.source}: ${item.summary}`);
}

function collectBlockingFindings({ manifest, quickGates, strictGates, review }) {
  const findings = [];

  for (const task of manifest.tasks || []) {
    if (task.status === 'failed') {
      findings.push(`${task.id}: ${task.lastError || 'task failed'}`);
    }
  }

  for (const gate of [...quickGates, ...strictGates]) {
    if (gate.status === 'fail') {
      findings.push(`${gate.name}: ${gate.details}`);
    }
  }

  if (review.status === 'blocked' || review.status === 'fail') {
    findings.push(`review: ${review.summary || review.details || review.status}`);
  }

  return findings.concat(summarizeOpenReviewFindings(review.findings || []));
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
    quickGates,
    strictGates,
    review,
    blockingFindings,
    reroute,
    timestamp: args.timestamp || new Date().toISOString()
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main();
