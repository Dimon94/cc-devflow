#!/usr/bin/env node

const path = require('path');

const { loadTracking, applySyncArgs, persistTrackingFiles } = require('./lib/roadmap-tracking/store');
const { findTrackingMatches, formatTrackingMatches } = require('./lib/roadmap-tracking/query');

function usage() {
  process.stderr.write(
    [
      'Usage:',
      '  roadmap-tracking.js sync --roadmap <ROADMAP.md> --backlog <BACKLOG.md> --tracking <roadmap-tracking.json> --rm <RM-ID> [field updates]',
      '  roadmap-tracking.js render --roadmap <ROADMAP.md> --backlog <BACKLOG.md> --tracking <roadmap-tracking.json>',
      '  roadmap-tracking.js find --tracking <roadmap-tracking.json> --id <RM-ID|REQ-ID>',
      '',
      'Fields:',
      '  --item <title>',
      '  --stage <Stage 1>',
      '  --priority <P1>',
      '  --primary-capability <cap-id>',
      '  --secondary-capabilities "cap-a,cap-b"',
      '  --spec-delta "delta summary"',
      '  --depends-on "RM-001,RM-002"',
      '  --status <Planned>',
      '  --req <REQ-001>',
      '  --progress <50%>'
    ].join('\n')
  );
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };

  for (let index = 0; index < rest.length; index += 1) {
    const key = rest[index];
    const value = rest[index + 1];

    if (!key.startsWith('--')) {
      throw createError(`Unknown arg: ${key}`);
    }

    if (value == null || value.startsWith('--')) {
      throw createError(`Missing value for ${key}`);
    }

    args[key.slice(2)] = value;
    index += 1;
  }

  return args;
}

function createError(message, showUsage = true) {
  const error = new Error(message);
  error.showUsage = showUsage;
  return error;
}

function normalizePathArg(filePath) {
  return path.resolve(filePath);
}

function requireArgs(args, names, message) {
  const missing = names.filter((name) => !args[name]);
  if (missing.length) {
    throw createError(message);
  }
}

function syncTracking(args) {
  requireArgs(
    args,
    ['roadmap', 'backlog', 'tracking', 'rm'],
    'sync requires --roadmap, --backlog, --tracking, and --rm'
  );

  const files = {
    roadmapFile: normalizePathArg(args.roadmap),
    backlogFile: normalizePathArg(args.backlog),
    trackingFile: normalizePathArg(args.tracking)
  };
  const tracking = loadTracking(files);
  applySyncArgs(tracking, args);
  persistTrackingFiles({
    ...files,
    tracking
  });
}

function renderOnly(args) {
  requireArgs(
    args,
    ['roadmap', 'backlog', 'tracking'],
    'render requires --roadmap, --backlog, and --tracking'
  );

  const files = {
    roadmapFile: normalizePathArg(args.roadmap),
    backlogFile: normalizePathArg(args.backlog),
    trackingFile: normalizePathArg(args.tracking)
  };
  const tracking = loadTracking(files);
  persistTrackingFiles({
    ...files,
    tracking
  });
}

function findTracking(args) {
  requireArgs(args, ['tracking', 'id'], 'find requires --tracking and --id');

  const tracking = loadTracking({
    trackingFile: normalizePathArg(args.tracking)
  });
  const matches = findTrackingMatches(tracking, args.id);
  if (!matches.length) {
    throw createError(`Not found in tracking: ${args.id}`, false);
  }

  process.stdout.write(formatTrackingMatches(matches));
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));

    if (args.command === 'sync') {
      syncTracking(args);
      return;
    }

    if (args.command === 'render') {
      renderOnly(args);
      return;
    }

    if (args.command === 'find') {
      findTracking(args);
      return;
    }

    throw createError(`Unknown command: ${args.command || '<missing>'}`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    if (error.showUsage !== false) {
      usage();
    }
    process.exitCode = 1;
  }
}

main();
