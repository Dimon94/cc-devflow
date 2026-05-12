#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');

const { getWorkflowContext } = require('../lib/skill-runtime/query');
const {
  getReportCardPath,
  getTaskManifestPath
} = require('../lib/skill-runtime/store');

const ROOT = path.resolve(__dirname, '..');

const EXAMPLE_CASES = [
  {
    caseName: 'pdca-loop',
    changeId: 'REQ-001',
    changeKey: 'REQ-001-copy-invite-link',
    tokenBaseline: true,
    expected: { sourceHashes: true, verificationCommands: true }
  },
  {
    caseName: 'full-design-blocked',
    changeId: 'REQ-002',
    changeKey: 'REQ-002-bulk-invite-import',
    tokenBaseline: true,
    expected: { sourceHashes: true, verificationCommands: true }
  },
  {
    caseName: 'local-handoff',
    changeId: 'REQ-003',
    changeKey: 'REQ-003-audit-log-export',
    tokenBaseline: true,
    expected: { sourceHashes: true, verificationCommands: true }
  }
];

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function splitRef(ref) {
  const [filePath, fragment = ''] = String(ref || '').split('#');
  return { filePath, fragment };
}

function normalizeRef(refOrEntry) {
  return typeof refOrEntry === 'string' ? refOrEntry : refOrEntry?.ref;
}

function effectiveRef(refOrEntry) {
  if (typeof refOrEntry === 'string') {
    return refOrEntry;
  }

  if (refOrEntry?.exists === false && refOrEntry?.fallbackRef) {
    return refOrEntry.fallbackRef;
  }

  return refOrEntry?.ref;
}

function defaultOpenRefs(context) {
  return (context.progressiveDisclosure.defaultOpen || [])
    .map(effectiveRef)
    .filter(Boolean);
}

function deepOpenRefs(context) {
  return (context.progressiveDisclosure.deepOpen || [])
    .flatMap((group) => (group.refs || []).map(effectiveRef))
    .filter(Boolean);
}

function countMissingSectionRefs(context) {
  const defaultOpenMissing = (context.progressiveDisclosure.defaultOpen || [])
    .filter((entry) => entry && typeof entry === 'object' && entry.exists === false)
    .length;
  const deepOpenMissing = (context.progressiveDisclosure.deepOpen || [])
    .flatMap((group) => group.refs || [])
    .filter((entry) => entry && typeof entry === 'object' && entry.exists === false)
    .length;
  return defaultOpenMissing + deepOpenMissing;
}

function resolveMarkdownHeading(markdown, fragment) {
  const slug = String(fragment || '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
  const lines = String(markdown || '').split('\n');
  const start = lines.findIndex((line) => {
    const match = line.match(/^#+\s+(.+?)\s*$/);
    if (!match) {
      return false;
    }

    const headingSlug = match[1]
      .trim()
      .toLowerCase()
      .replace(/`/g, '')
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-');

    return headingSlug === slug;
  });

  if (start === -1) {
    return null;
  }

  const level = (lines[start].match(/^#+/) || [''])[0].length;
  const end = lines.findIndex((line, index) => (
    index > start
    && /^#+\s/.test(line)
    && (line.match(/^#+/) || [''])[0].length <= level
  ));
  return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

function extractHeadingSection(markdown, headingPattern) {
  const lines = String(markdown || '').split('\n');
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start === -1) {
    return lines.slice(0, 24).join('\n');
  }

  const level = (lines[start].match(/^#+/) || [''])[0].length;
  const end = lines.findIndex((line, index) => (
    index > start
    && /^#+\s/.test(line)
    && (line.match(/^#+/) || [''])[0].length <= level
  ));

  return lines.slice(start, end === -1 ? Math.min(lines.length, start + 32) : end).join('\n');
}

function resolveRefText(repoRoot, ref) {
  const { filePath, fragment } = splitRef(ref);
  const absolutePath = path.join(repoRoot, filePath);

  if (!fs.existsSync(absolutePath)) {
    return ref;
  }

  if (!fragment) {
    return readText(absolutePath);
  }

  if (filePath.endsWith('task-manifest.json')) {
    const manifest = readJson(absolutePath);
    if (fragment.startsWith('/tasks/')) {
      const taskId = fragment.slice('/tasks/'.length);
      return JSON.stringify((manifest?.tasks || []).find((task) => task.id === taskId) || { missingTask: taskId });
    }
    if (fragment.startsWith('tasks.')) {
      const taskId = fragment.slice('tasks.'.length);
      return JSON.stringify((manifest?.tasks || []).find((task) => task.id === taskId) || { missingTask: taskId });
    }

    return JSON.stringify({
      changeId: manifest?.changeId,
      currentTaskId: manifest?.currentTaskId,
      tasks: (manifest?.tasks || []).map((task) => ({
        id: task.id,
        status: task.status,
        dependsOn: task.dependsOn || []
      }))
    });
  }

  if (filePath.endsWith('change-meta.json')) {
    const meta = readJson(absolutePath);
    if (fragment.startsWith('/')) {
      const segments = fragment.split('/').filter(Boolean);
      const resolved = segments.reduce((value, segment) => (
        value == null ? undefined : value[segment.replace(/~1/g, '/').replace(/~0/g, '~')]
      ), meta);
      return JSON.stringify(resolved === undefined ? meta || {} : resolved);
    }
    return JSON.stringify(meta || {});
  }

  if (filePath.endsWith('report-card.json')) {
    const report = readJson(absolutePath);
    return JSON.stringify({
      verdict: report?.verdict,
      overall: report?.overall,
      reroute: report?.reroute,
      specSyncReady: report?.specSyncReady,
      blockingFindings: report?.blockingFindings || [],
      gaps: report?.gaps || []
    });
  }

  const text = readText(absolutePath);
  if (fragment) {
    const section = resolveMarkdownHeading(text, fragment);
    if (section) {
      return section;
    }
  }

  return ref;
}

function copyExampleToDevflowRoot(caseName) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `cc-devflow-token-bench-${caseName}-`));
  const sourceChanges = path.join(ROOT, 'docs/examples', caseName, 'changes');
  const targetChanges = path.join(tempRoot, 'devflow', 'changes');
  fs.mkdirSync(path.dirname(targetChanges), { recursive: true });
  fs.cpSync(sourceChanges, targetChanges, { recursive: true });
  return tempRoot;
}

function baselineTokens(repoRoot, changeKey) {
  const changeDir = path.join(repoRoot, 'devflow', 'changes', changeKey);
  const baselineFiles = [
    'planning/design.md',
    'planning/analysis.md',
    'planning/tasks.md',
    'planning/task-manifest.json',
    'change-meta.json',
    'review/report-card.json'
  ];

  return baselineFiles.reduce((total, relativePath) => (
    total + estimateTokens(readText(path.join(changeDir, relativePath)))
  ), 0);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createSyntheticCase(caseName, changeId, manifest, report = null, files = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), `cc-devflow-token-bench-${caseName}-`));
  if (files.designMd) {
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', changeId, 'planning'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'devflow', 'changes', changeId, 'planning', 'design.md'), `${files.designMd}\n`);
  }
  if (files.tasksMd) {
    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', changeId, 'planning'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'devflow', 'changes', changeId, 'planning', 'tasks.md'), `${files.tasksMd}\n`);
  }
  writeJson(getTaskManifestPath(repoRoot, changeId), {
    changeId,
    goal: `Benchmark ${caseName}`,
    createdAt: '2026-05-12T00:00:00.000Z',
    updatedAt: '2026-05-12T00:00:00.000Z',
    ...manifest
  });
  if (report) {
    writeJson(getReportCardPath(repoRoot, changeId), {
      changeId,
      timestamp: '2026-05-12T00:10:00.000Z',
      ...report
    });
  }

  return repoRoot;
}

function syntheticCases() {
  const task = (id, status = 'pending', extra = {}) => ({
    id,
    title: `Task ${id}`,
    status,
    phase: 1,
    dependsOn: [],
    verification: [`npm test -- ${id}.test.js`],
    context: { commands: [`npm test -- ${id}.test.js`], readFiles: ['planning/tasks.md'], notes: [] },
    ...extra
  });

  return [
    {
      caseName: 'pending-task',
      changeId: 'REQ-901',
      repoRoot: createSyntheticCase('pending-task', 'REQ-901', {
        tasks: [task('T001')]
      }),
      expected: { selectedSkill: 'cc-do', selectedTask: 'T001', verificationCommands: true }
    },
    {
      caseName: 'running-task',
      changeId: 'REQ-902',
      repoRoot: createSyntheticCase('running-task', 'REQ-902', {
        currentTaskId: 'T002',
        tasks: [
          task('T001', 'passed'),
          task('T002', 'running', { dependsOn: ['T001'] }),
          task('T003', 'pending', { dependsOn: ['T001'] })
        ]
      }),
      expected: { selectedSkill: 'cc-do', selectedTask: 'T002', action: 'resume-current-task' }
    },
    {
      caseName: 'blocked-task',
      changeId: 'REQ-903',
      repoRoot: createSyntheticCase('blocked-task', 'REQ-903', {
        currentTaskId: 'T002',
        tasks: [
          task('T001', 'passed'),
          task('T002', 'blocked', { dependsOn: ['T001'] }),
          task('T003', 'pending', { dependsOn: ['T001'] })
        ]
      }),
      expected: { selectedSkill: 'cc-do', selectedTask: 'T002', action: 'resume-current-task' }
    },
    {
      caseName: 'complete-no-report',
      changeId: 'REQ-904',
      repoRoot: createSyntheticCase('complete-no-report', 'REQ-904', {
        tasks: [task('T001', 'passed')]
      }),
      expected: { selectedSkill: 'cc-check', action: 'build-fresh-verdict', verificationCommands: true }
    },
    {
      caseName: 'complete-ship-blocked',
      changeId: 'REQ-905',
      repoRoot: createSyntheticCase('complete-ship-blocked', 'REQ-905', {
        tasks: [task('T001', 'passed')]
      }, {
        verdict: 'pass',
        overall: 'pass',
        reroute: 'none',
        specSyncReady: false,
        blockingFindings: []
      }),
      expected: { selectedSkill: 'cc-check', action: 'build-fresh-verdict', verificationCommands: true }
    },
    {
      caseName: 'missing-verification',
      changeId: 'REQ-906',
      repoRoot: createSyntheticCase('missing-verification', 'REQ-906', {
        currentTaskId: 'T001',
        tasks: [
          task('T001', 'pending', {
            verification: [],
            context: { commands: [], readFiles: ['planning/tasks.md'], notes: [] }
          })
        ]
      }),
      expected: { selectedSkill: 'cc-plan', action: 'repair-task-verification', verificationCommands: false }
    },
    {
      caseName: 'missing-section-ref',
      changeId: 'REQ-907',
      repoRoot: createSyntheticCase('missing-section-ref', 'REQ-907', {
        tasks: [task('T001')]
      }, null, {
        designMd: [
          '# Design',
          '',
          '## Frozen Design Card',
          '- Keep the current dialog surface.',
          '',
          '## Validation',
          '- Targeted tests stay green.'
        ].join('\n')
      }),
      expected: { selectedSkill: 'cc-do', selectedTask: 'T001', missingSectionRefs: 1, sectionRefFallback: true }
    }
  ];
}

function passesCorrectness(context, expected = {}) {
  const checks = [
    expected.selectedSkill ? context.nextAction.skill === expected.selectedSkill : true,
    expected.action ? context.nextAction.action === expected.action : true,
    expected.selectedTask ? context.currentTask?.id === expected.selectedTask : true,
    expected.verificationCommands === true ? context.progressiveDisclosure.commandsToTrust.length > 0 : true,
    expected.verificationCommands === false ? context.progressiveDisclosure.commandsToTrust.length === 0 : true,
    expected.sourceHashes ? Object.keys(context.progressiveDisclosure.sourceHashes || {}).length > 0 : true,
    typeof expected.missingSectionRefs === 'number'
      ? countMissingSectionRefs(context) >= expected.missingSectionRefs
      : true,
    expected.sectionRefFallback
      ? (context.progressiveDisclosure.defaultOpen || []).some((entry) => entry.exists === false && entry.fallbackRef)
      : true
  ];

  return checks.every(Boolean);
}

async function benchmarkCase(example) {
  const repoRoot = example.repoRoot || copyExampleToDevflowRoot(example.caseName);
  const context = await getWorkflowContext(repoRoot, example.changeId, { changeKey: example.changeKey });
  const actualCliDataOnlyTokens = estimateTokens(JSON.stringify(context));
  const routingPacketPayload = {
    schemaVersion: context.schemaVersion,
    changeId: context.changeId,
    changeKey: context.changeKey,
    source: context.source,
    route: context.route,
    progress: context.progress,
    nextAction: context.nextAction,
    currentTask: context.currentTask,
    queues: context.queues,
    packetOnly: context.progressiveDisclosure.packetOnly,
    mustNotForget: context.progressiveDisclosure.mustNotForget,
    sourceHashes: context.progressiveDisclosure.sourceHashes,
    defaultOpen: context.progressiveDisclosure.defaultOpen,
    failClosed: context.progressiveDisclosure.failClosed,
    planningMeta: context.planningMeta
  };
  const routingPacketTokens = estimateTokens(JSON.stringify(routingPacketPayload));
  const defaultOpenTokens = defaultOpenRefs(context)
    .reduce((total, ref) => total + estimateTokens(resolveRefText(repoRoot, ref)), 0);
  const deepOpenTokens = deepOpenRefs(context)
    .reduce((total, ref) => total + estimateTokens(resolveRefText(repoRoot, ref)), 0);
  const totalActualTokens = actualCliDataOnlyTokens + defaultOpenTokens;
  const totalRoutingModeTokens = routingPacketTokens + defaultOpenTokens;
  const baseline = example.tokenBaseline
    ? baselineTokens(repoRoot, example.changeKey)
    : 0;
  const actualSavings = baseline > 0 ? `${(((baseline - totalActualTokens) / baseline) * 100).toFixed(1)}%` : 'n/a';
  const routingSavings = baseline > 0 ? `${(((baseline - totalRoutingModeTokens) / baseline) * 100).toFixed(1)}%` : 'n/a';

  return {
    case: example.caseName,
    stage: `${context.nextAction.skill}:${context.nextAction.action}`,
    actual_cli_data_only_tokens: actualCliDataOnlyTokens,
    routing_packet_tokens: routingPacketTokens,
    default_open_tokens: defaultOpenTokens,
    deep_open_tokens: deepOpenTokens,
    total_actual_tokens: totalActualTokens,
    total_routing_mode_tokens: totalRoutingModeTokens,
    savings_actual_vs_baseline: actualSavings,
    savings_routing_vs_baseline: routingSavings,
    selected_task: context.currentTask?.id || '-',
    selected_skill: context.nextAction.skill,
    required_files_opened: defaultOpenRefs(context).length,
    verification_commands: context.progressiveDisclosure.commandsToTrust.length,
    missing_section_refs: countMissingSectionRefs(context),
    correctness_pass: passesCorrectness(context, example.expected) ? 'yes' : 'no'
  };
}

async function main() {
  const rows = [];
  for (const example of [...EXAMPLE_CASES, ...syntheticCases()]) {
    rows.push(await benchmarkCase(example));
  }

  console.log('Note: actual_cli_data_only_tokens measures the full CLI data-only output. routing_packet_tokens is the smaller routing subset. deep_open_tokens is the additional worst-case cost if deep triggers fire.');
  console.log('| case | stage | actual_cli_data_only_tokens | routing_packet_tokens | default_open_tokens | deep_open_tokens | total_actual_tokens | total_routing_mode_tokens | savings_actual_vs_baseline | savings_routing_vs_baseline | selected_task | selected_skill | required_files_opened | verification_commands | missing_section_refs | correctness_pass |');
  console.log('| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- |');
  for (const row of rows) {
    console.log(`| ${row.case} | ${row.stage} | ${row.actual_cli_data_only_tokens} | ${row.routing_packet_tokens} | ${row.default_open_tokens} | ${row.deep_open_tokens} | ${row.total_actual_tokens} | ${row.total_routing_mode_tokens} | ${row.savings_actual_vs_baseline} | ${row.savings_routing_vs_baseline} | ${row.selected_task} | ${row.selected_skill} | ${row.required_files_opened} | ${row.verification_commands} | ${row.missing_section_refs} | ${row.correctness_pass} |`);
  }

  const failures = rows.filter((row) => row.correctness_pass !== 'yes');
  if (failures.length > 0) {
    console.error(`Workflow context benchmark correctness failed: ${failures.map((row) => row.case).join(', ')}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
