const path = require('path');

const {
  BACKLOG_QUEUE_COLUMNS,
  BACKLOG_QUEUE_HEADER_TO_KEY,
  DEFAULT_TRACKING,
  PARKED_FIELD_MAP,
  READY_FIELD_MAP,
  ROADMAP_COLUMNS,
  ROADMAP_HEADER_TO_KEY,
  formatBacklogValue,
  formatCell,
  formatInlineCode,
  formatList,
  normalizeBoolean,
  normalizeCell,
  normalizeHeader,
  normalizeItem,
  normalizeTracking,
  parseList
} = require('./schema');

const DOCUMENT_LABELS = {
  en: {
    roadmapTitle: 'ROADMAP',
    backlogTitle: 'BACKLOG',
    implementationTracking: 'Implementation Tracking',
    technicalArchitecture: 'Technical Architecture',
    roadmapStateSource: 'Roadmap state source',
    trackingSource: 'Tracking source',
    deprecatedProjection: '> Deprecated projection. Edit `roadmap.json` instead.',
    backlogMeta: 'Backlog Meta',
    roadmapVersion: 'Roadmap version',
    skillVersion: 'Skill version',
    lastSynced: 'Last synced',
    currentFocusStage: 'Current focus stage',
    queue: 'Queue',
    dependencyHandoff: 'Dependency Handoff',
    serialSpine: 'Serial spine',
    parallelReadyNextWave: 'Parallel-ready next wave',
    notesOnBlockers: 'Notes on blockers',
    projectDirectionHandoff: 'Project Direction Handoff',
    projectDirectionMode: 'Project direction mode',
    projectDirectionRationale: 'Direction mode rationale',
    directionQuestionsSelected: 'Direction-specific questions selected',
    directionQuestionsSkipped: 'Direction-specific questions skipped',
    directionGuardrailsApplied: 'Direction guardrails applied',
    planningPosture: 'Planning posture',
    evidenceMaturity: 'Evidence maturity',
    readyForReqPlan: 'Ready For Req-Plan',
    parked: 'Parked',
    yes: 'Yes',
    no: 'No',
    readyEmpty:
      '- RM-001:\n  - Primary Capability:\n  - Secondary Capabilities:\n  - Why now:\n  - Success signal:\n  - Entry constraints:\n  - Capability gap:\n  - Expected spec delta:\n  - Open risks:\n  - First planning question:\n  - Required context to load:\n  - Depends On:\n  - Parallel With:\n  - Why this is ready now:',
    parkedEmpty: '- RM-XXX:\n  - Reason parked:\n  - Trigger to reopen:\n  - Missing evidence:',
    readyFields: {
      primaryCapability: 'Primary Capability',
      secondaryCapabilities: 'Secondary Capabilities',
      whyNow: 'Why now',
      successSignal: 'Success signal',
      entryConstraints: 'Entry constraints',
      capabilityGap: 'Capability gap',
      expectedSpecDelta: 'Expected spec delta',
      openRisks: 'Open risks',
      firstPlanningQuestion: 'First planning question',
      requiredContextToLoad: 'Required context to load',
      dependsOn: 'Depends On',
      parallelWith: 'Parallel With',
      whyReadyNow: 'Why this is ready now'
    },
    parkedFields: {
      parkedReason: 'Reason parked',
      triggerToReopen: 'Trigger to reopen',
      missingEvidence: 'Missing evidence'
    },
    roadmapColumns: ROADMAP_COLUMNS.map(([label, key]) => [label, key]),
    backlogColumns: BACKLOG_QUEUE_COLUMNS.map(([label, key]) => [label, key])
  },
  'zh-CN': {
    roadmapTitle: '路线图',
    backlogTitle: '待办队列',
    implementationTracking: '执行跟踪',
    technicalArchitecture: '技术架构',
    roadmapStateSource: '路线图状态源',
    trackingSource: '跟踪源',
    deprecatedProjection: '> 已废弃投影。请编辑 `roadmap.json`。',
    backlogMeta: '待办元信息',
    roadmapVersion: '路线图版本',
    skillVersion: 'Skill 版本',
    lastSynced: '最近同步',
    currentFocusStage: '当前聚焦阶段',
    queue: '队列',
    dependencyHandoff: '依赖交接',
    serialSpine: '串行主线',
    parallelReadyNextWave: '下一波可并行事项',
    notesOnBlockers: '阻塞说明',
    projectDirectionHandoff: '项目方向交接',
    projectDirectionMode: '项目方向模式',
    projectDirectionRationale: '方向模式理由',
    directionQuestionsSelected: '已选择的方向问题',
    directionQuestionsSkipped: '已跳过的方向问题',
    directionGuardrailsApplied: '已应用的方向护栏',
    planningPosture: '规划姿态',
    evidenceMaturity: '证据成熟度',
    readyForReqPlan: '可进入 Req-Plan',
    parked: '暂存',
    yes: '是',
    no: '否',
    readyEmpty:
      '- RM-001:\n  - 主能力:\n  - 次能力:\n  - 为什么现在做:\n  - 成功信号:\n  - 进入约束:\n  - 能力缺口:\n  - 预期规格变化:\n  - 未决风险:\n  - 首个规划问题:\n  - 必须加载的上下文:\n  - 依赖:\n  - 可并行:\n  - 为什么现在已就绪:',
    parkedEmpty: '- RM-XXX:\n  - 暂存原因:\n  - 重新打开触发条件:\n  - 缺失证据:',
    readyFields: {
      primaryCapability: '主能力',
      secondaryCapabilities: '次能力',
      whyNow: '为什么现在做',
      successSignal: '成功信号',
      entryConstraints: '进入约束',
      capabilityGap: '能力缺口',
      expectedSpecDelta: '预期规格变化',
      openRisks: '未决风险',
      firstPlanningQuestion: '首个规划问题',
      requiredContextToLoad: '必须加载的上下文',
      dependsOn: '依赖',
      parallelWith: '可并行',
      whyReadyNow: '为什么现在已就绪'
    },
    parkedFields: {
      parkedReason: '暂存原因',
      triggerToReopen: '重新打开触发条件',
      missingEvidence: '缺失证据'
    },
    roadmapColumns: [
      ['RM-ID', 'rmId'],
      ['事项', 'item'],
      ['阶段', 'stage'],
      ['优先级', 'priority'],
      ['主能力', 'primaryCapability'],
      ['次能力', 'secondaryCapabilities'],
      ['预期规格变化', 'expectedSpecDelta'],
      ['依赖', 'dependsOn'],
      ['状态', 'status'],
      ['REQ', 'req'],
      ['进度', 'progress']
    ],
    backlogColumns: [
      ['RM-ID', 'rmId'],
      ['标题', 'item'],
      ['来源阶段', 'stage'],
      ['优先级', 'priority'],
      ['主能力', 'primaryCapability'],
      ['次能力', 'secondaryCapabilities'],
      ['能力缺口', 'capabilityGap'],
      ['预期规格变化', 'expectedSpecDelta'],
      ['证据', 'evidence'],
      ['依赖', 'dependsOn'],
      ['可并行', 'parallelWith'],
      ['未知项', 'unknowns'],
      ['下一决策', 'nextDecision'],
      ['就绪', 'ready']
    ]
  }
};

function labelsFor(tracking) {
  return DOCUMENT_LABELS[tracking?.outputPolicy?.documentLanguage] || DOCUMENT_LABELS.en;
}

function extractAnySection(markdown, headings) {
  for (const heading of headings) {
    const section = extractSection(markdown, heading);
    if (section) {
      return section;
    }
  }

  return null;
}

function splitRow(line) {
  return line
    .trim()
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(markdown, headingText) {
  const heading = new RegExp(`^## ${escapeRegex(headingText)}\\s*$`, 'm');
  const match = heading.exec(markdown);
  if (!match) {
    return null;
  }

  const start = match.index;
  const headingEnd = markdown.indexOf('\n', start);
  const bodyStart = headingEnd === -1 ? markdown.length : headingEnd + 1;
  const nextHeadingMatch = /^##\s+/gm;
  nextHeadingMatch.lastIndex = bodyStart;
  const nextHeading = nextHeadingMatch.exec(markdown);
  const end = nextHeading ? nextHeading.index : markdown.length;

  return {
    start,
    end,
    body: markdown.slice(bodyStart, end)
  };
}

function extractTableLines(sectionBody) {
  const lines = sectionBody.split('\n');
  const tableLines = [];
  let started = false;

  for (const line of lines) {
    if (line.trim().startsWith('|')) {
      tableLines.push(line.trim());
      started = true;
      continue;
    }

    if (started) {
      break;
    }
  }

  return tableLines;
}

function parseTable(sectionBody, headerMap, buildRow) {
  const tableLines = extractTableLines(sectionBody);
  if (tableLines.length < 2) {
    return [];
  }

  const headers = splitRow(tableLines[0]);
  const keys = headers.map((header) => headerMap.get(normalizeHeader(header)) || null);
  const rows = [];

  for (const line of tableLines.slice(2)) {
    const cells = splitRow(line);
    if (!cells.length || cells.every((cell) => !cell.trim())) {
      continue;
    }

    rows.push(buildRow(keys, cells));
  }

  return rows;
}

function trackingFromRoadmap(markdown) {
  const section = extractAnySection(markdown, [
    'Implementation Tracking',
    DOCUMENT_LABELS['zh-CN'].implementationTracking
  ]);
  if (!section) {
    return [];
  }

  return parseTable(section.body, ROADMAP_HEADER_TO_KEY, (keys, cells) => {
    const next = normalizeItem({});
    keys.forEach((key, index) => {
      if (!key) {
        return;
      }

      const cell = cells[index] || '';
      if (key === 'secondaryCapabilities' || key === 'dependsOn') {
        next[key] = parseList(cell);
        return;
      }

      next[key] = normalizeCell(cell);
    });

    return next;
  }).filter((item) => item.rmId);
}

function parseBacklogMeta(sectionBody) {
  const lines = sectionBody
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const meta = {
    roadmapVersion: '',
    skillVersion: '',
    currentFocusStage: ''
  };
  let lastSyncedAt = '';

  for (const line of lines) {
    const match = /^-\s+([^:]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const label = normalizeHeader(match[1]);
    const value = normalizeCell(match[2].replace(/`/g, ''));

    if (label === 'roadmap version' || label === '路线图版本') {
      meta.roadmapVersion = value;
    } else if (label === 'skill version' || label === 'skill 版本') {
      meta.skillVersion = value;
    } else if (label === 'last synced' || label === '最近同步') {
      lastSyncedAt = value;
    } else if (label === 'current focus stage' || label === '当前聚焦阶段') {
      meta.currentFocusStage = value;
    }
  }

  return { meta, lastSyncedAt };
}

function parseBacklogQueue(sectionBody) {
  return parseTable(sectionBody, BACKLOG_QUEUE_HEADER_TO_KEY, (keys, cells) => {
    const next = normalizeItem({});

    keys.forEach((key, index) => {
      if (!key) {
        return;
      }

      const cell = cells[index] || '';
      if (key === 'secondaryCapabilities' || key === 'dependsOn' || key === 'parallelWith') {
        const list = parseList(cell);
        if (key === 'secondaryCapabilities' || key === 'dependsOn') {
          next[key] = list;
        } else {
          next.backlog.parallelWith = list;
        }
        return;
      }

      if (key === 'ready') {
        next.backlog.ready = normalizeBoolean(cell);
        return;
      }

      if (
        key === 'capabilityGap' ||
        key === 'evidence' ||
        key === 'unknowns' ||
        key === 'nextDecision'
      ) {
        next.backlog[key] = normalizeCell(cell);
        return;
      }

      next[key] = normalizeCell(cell);
    });

    return next;
  }).filter((item) => item.rmId);
}

function parseLabeledBlock(sectionBody, fieldMap, onStart) {
  const result = [];
  let current = null;

  for (const rawLine of sectionBody.split('\n')) {
    const line = rawLine.replace(/\r/g, '');
    const startMatch = /^-\s+(RM-[^:]+):\s*$/.exec(line.trim());
    if (startMatch) {
      current = onStart(startMatch[1]);
      result.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    const fieldMatch = /^\s*-\s+([^:]+):\s*(.*)$/.exec(line);
    if (!fieldMatch) {
      continue;
    }

    const key = fieldMap.get(normalizeHeader(fieldMatch[1]));
    if (!key) {
      continue;
    }

    current[key] = normalizeCell(fieldMatch[2].replace(/`/g, ''));
  }

  return result;
}

function parseReadySection(sectionBody) {
  return parseLabeledBlock(sectionBody, READY_FIELD_MAP, (rmId) => ({
    rmId,
    primaryCapability: '',
    secondaryCapabilities: '',
    whyNow: '',
    successSignal: '',
    entryConstraints: '',
    capabilityGap: '',
    expectedSpecDelta: '',
    openRisks: '',
    firstPlanningQuestion: '',
    requiredContextToLoad: '',
    dependsOn: '',
    parallelWith: '',
    whyReadyNow: ''
  }));
}

function parseParkedSection(sectionBody) {
  return parseLabeledBlock(sectionBody, PARKED_FIELD_MAP, (rmId) => ({
    rmId,
    parkedReason: '',
    triggerToReopen: '',
    missingEvidence: ''
  }));
}

function parseDependencyHandoff(sectionBody) {
  const next = {
    serialSpine: '',
    parallelReadyNextWave: '',
    notesOnBlockers: ''
  };

  for (const rawLine of sectionBody.split('\n')) {
    const line = rawLine.trim();
    const match = /^-\s+([^:]+):\s*(.*)$/.exec(line);
    if (!match) {
      continue;
    }

    const label = normalizeHeader(match[1]);
    const value = normalizeCell(match[2].replace(/`/g, ''));

    if (label === 'serial spine' || label === '串行主线') {
      next.serialSpine = value;
    } else if (label === 'parallel ready next wave' || label === '下一波可并行事项') {
      next.parallelReadyNextWave = value;
    } else if (label === 'notes on blockers' || label === '阻塞说明') {
      next.notesOnBlockers = value;
    }
  }

  return next;
}

function mergeItemMaps(baseItems, incomingItems) {
  const items = new Map();

  for (const item of baseItems) {
    items.set(item.rmId, normalizeItem(item));
  }

  for (const rawItem of incomingItems) {
    if (!rawItem.rmId) {
      continue;
    }

    const current = items.get(rawItem.rmId) || normalizeItem({ rmId: rawItem.rmId });
    const next = normalizeItem({
      ...current,
      ...rawItem,
      secondaryCapabilities:
        rawItem.secondaryCapabilities != null
          ? rawItem.secondaryCapabilities
          : current.secondaryCapabilities,
      dependsOn: rawItem.dependsOn != null ? rawItem.dependsOn : current.dependsOn,
      backlog: {
        ...current.backlog,
        ...(rawItem.backlog || {})
      }
    });

    items.set(next.rmId, next);
  }

  return Array.from(items.values());
}

function trackingFromBacklog(markdown, baseTracking) {
  const next = normalizeTracking(baseTracking);

  const metaSection = extractAnySection(markdown, ['Backlog Meta', DOCUMENT_LABELS['zh-CN'].backlogMeta]);
  if (metaSection) {
    const parsed = parseBacklogMeta(metaSection.body);
    next.backlogMeta = parsed.meta;
    if (parsed.lastSyncedAt) {
      next.lastSyncedAt = parsed.lastSyncedAt;
    }
  }

  const queueSection = extractAnySection(markdown, ['Queue', DOCUMENT_LABELS['zh-CN'].queue]);
  if (queueSection) {
    next.items = mergeItemMaps(next.items, parseBacklogQueue(queueSection.body));
  }

  const dependencySection = extractAnySection(markdown, [
    'Dependency Handoff',
    DOCUMENT_LABELS['zh-CN'].dependencyHandoff
  ]);
  if (dependencySection) {
    next.dependencyHandoff = parseDependencyHandoff(dependencySection.body);
  }

  const readySection = extractAnySection(markdown, [
    'Ready For Req-Plan',
    DOCUMENT_LABELS['zh-CN'].readyForReqPlan
  ]);
  if (readySection) {
    next.items = mergeItemMaps(
      next.items,
      parseReadySection(readySection.body).map((entry) => ({
        rmId: entry.rmId,
        primaryCapability: entry.primaryCapability,
        secondaryCapabilities: parseList(entry.secondaryCapabilities),
        expectedSpecDelta: entry.expectedSpecDelta,
        dependsOn: parseList(entry.dependsOn),
        backlog: {
          ready: true,
          whyNow: entry.whyNow,
          successSignal: entry.successSignal,
          entryConstraints: entry.entryConstraints,
          capabilityGap: entry.capabilityGap,
          openRisks: entry.openRisks,
          firstPlanningQuestion: entry.firstPlanningQuestion,
          requiredContextToLoad: entry.requiredContextToLoad,
          parallelWith: parseList(entry.parallelWith),
          whyReadyNow: entry.whyReadyNow,
          parked: false
        }
      }))
    );
  }

  const parkedSection = extractAnySection(markdown, ['Parked', DOCUMENT_LABELS['zh-CN'].parked]);
  if (parkedSection) {
    next.items = mergeItemMaps(
      next.items,
      parseParkedSection(parkedSection.body).map((entry) => ({
        rmId: entry.rmId,
        backlog: {
          parked: true,
          parkedReason: entry.parkedReason,
          triggerToReopen: entry.triggerToReopen,
          missingEvidence: entry.missingEvidence,
          ready: false
        }
      }))
    );
  }

  return next;
}

function trackingFromMarkdown(roadmapMarkdown = '', backlogMarkdown = '') {
  let tracking = normalizeTracking(DEFAULT_TRACKING);

  if (roadmapMarkdown) {
    tracking.items = trackingFromRoadmap(roadmapMarkdown);
  }

  if (backlogMarkdown) {
    tracking = trackingFromBacklog(backlogMarkdown, tracking);
  }

  return tracking;
}

function renderRoadmapTable(tracking) {
  const labels = labelsFor(tracking);
  const columns = labels.roadmapColumns;
  const header = `| ${columns.map(([label]) => label).join(' | ')} |`;
  const separator = `|${columns.map(() => '------').join('|')}|`;
  const rows = tracking.items.length
    ? tracking.items.map((item) =>
        [
          item.rmId,
          formatCell(item.item),
          formatCell(item.stage),
          formatCell(item.priority),
          formatCell(item.primaryCapability),
          formatList(item.secondaryCapabilities),
          formatCell(item.expectedSpecDelta),
          formatList(item.dependsOn),
          formatCell(item.status),
          formatCell(item.req),
          formatCell(item.progress)
        ].join(' | ')
      )
    : [
        [
          'RM-001',
          '-',
          'Stage 1',
          'P1',
          'cap-example',
          '-',
          'tighten current truth',
          '-',
          'Planned',
          '-',
          '0%'
        ].join(' | ')
      ];

  return [header, separator, ...rows.map((row) => `| ${row} |`)].join('\n');
}

function isRoadmapState(tracking) {
  return Number(tracking.version) === 3;
}

function buildTrackingBody(roadmapFile, trackingFile, tracking) {
  const labels = labelsFor(tracking);
  const relativePath = path.relative(path.dirname(roadmapFile), trackingFile).replace(/\\/g, '/');
  const displayPath = relativePath || path.basename(trackingFile);
  const sourceLabel = isRoadmapState(tracking) ? labels.roadmapStateSource : labels.trackingSource;

  return [
    '',
    `- ${sourceLabel}: \`${displayPath}\``,
    '',
    '<!-- roadmap-tracking:start -->',
    renderRoadmapTable(tracking),
    '<!-- roadmap-tracking:end -->',
    ''
  ].join('\n');
}

function formatMermaidId(value) {
  return String(value || '')
    .trim()
    .replace(/[^A-Za-z0-9_]/g, '_');
}

function formatMermaidLabel(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function renderArchitectureDiagram(tracking) {
  const labels = labelsFor(tracking);
  const architecture = tracking.architecture || {};
  const nodes = Array.isArray(architecture.nodes) ? architecture.nodes : [];
  const edges = Array.isArray(architecture.edges) ? architecture.edges : [];

  if (!nodes.length && !edges.length) {
    return '';
  }

  const lines = [`## ${labels.technicalArchitecture}`, '', '```mermaid', 'flowchart TD'];

  nodes.forEach((node) => {
    const id = formatMermaidId(node.id);
    if (id) {
      lines.push(`  ${id}["${formatMermaidLabel(node.label || node.id)}"]`);
    }
  });

  edges.forEach((edge) => {
    const from = formatMermaidId(edge.from);
    const to = formatMermaidId(edge.to);
    if (!from || !to) {
      return;
    }

    const label = String(edge.label || '').trim();
    lines.push(label ? `  ${from} -->|${formatMermaidLabel(label)}| ${to}` : `  ${from} --> ${to}`);
  });

  lines.push('```', '');
  return lines.join('\n');
}

function renderRoadmapDocument({ original = '# ROADMAP\n', roadmapFile, trackingFile, tracking }) {
  const labels = labelsFor(tracking);
  const baseOriginal = original.trim() === '# ROADMAP' ? `# ${labels.roadmapTitle}\n` : original;
  const section = extractAnySection(baseOriginal, [
    'Implementation Tracking',
    labels.implementationTracking
  ]);
  const body = buildTrackingBody(roadmapFile, trackingFile, tracking);
  const nextSection = `## ${labels.implementationTracking}${body}`;
  const architectureSection = isRoadmapState(tracking) ? `\n${renderArchitectureDiagram(tracking)}` : '';

  const rendered = section
    ? `${baseOriginal.slice(0, section.start)}${nextSection}${baseOriginal.slice(section.end)}`
    : `${baseOriginal.replace(/\s*$/, '')}\n\n${nextSection}\n`;

  if (!architectureSection.trim()) {
    return rendered;
  }

  const existingArchitecture = extractAnySection(rendered, [
    'Technical Architecture',
    labels.technicalArchitecture
  ]);
  if (existingArchitecture) {
    return `${rendered.slice(0, existingArchitecture.start)}${architectureSection.trimEnd()}\n${rendered.slice(existingArchitecture.end)}`;
  }

  return `${rendered.replace(/\s*$/, '')}\n\n${architectureSection}`;
}

function renderLocalizedBoolean(value, labels) {
  return value ? labels.yes : labels.no;
}

function renderBacklogQueue(tracking) {
  const labels = labelsFor(tracking);
  const columns = labels.backlogColumns;
  const header = `| ${columns.map(([label]) => label).join(' | ')} |`;
  const separator = `|${columns.map(() => '------').join('|')}|`;
  const queueItems = tracking.items.filter((item) => !item.backlog.parked);
  const rows = queueItems.length
    ? queueItems.map((item) =>
        [
          item.rmId,
          formatBacklogValue(item.item),
          formatBacklogValue(item.stage),
          formatBacklogValue(item.priority),
          formatBacklogValue(item.primaryCapability),
          formatList(item.secondaryCapabilities),
          formatBacklogValue(item.backlog.capabilityGap),
          formatBacklogValue(item.expectedSpecDelta),
          formatBacklogValue(item.backlog.evidence),
          formatList(item.dependsOn),
          formatList(item.backlog.parallelWith),
          formatBacklogValue(item.backlog.unknowns),
          formatBacklogValue(item.backlog.nextDecision),
          renderLocalizedBoolean(item.backlog.ready, labels)
        ].join(' | ')
      )
    : [
        [
          'RM-001',
          '-',
          'Stage 1',
          'P1',
          'cap-example',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          '-',
          labels.no
        ].join(' | ')
      ];

  return [header, separator, ...rows.map((row) => `| ${row} |`)].join('\n');
}

function renderReadyForReqPlan(tracking) {
  const labels = labelsFor(tracking);
  const fields = labels.readyFields;
  const readyItems = tracking.items.filter((item) => item.backlog.ready && !item.backlog.parked);
  if (!readyItems.length) {
    return labels.readyEmpty;
  }

  return readyItems
    .map((item) =>
      [
        `- ${item.rmId}:`,
        `  - ${fields.primaryCapability}: ${formatInlineCode(item.primaryCapability)}`,
        `  - ${fields.secondaryCapabilities}: ${item.secondaryCapabilities.length ? formatInlineCode(item.secondaryCapabilities.join(', ')) : '`-`'}`,
        `  - ${fields.whyNow}: ${formatBacklogValue(item.backlog.whyNow)}`,
        `  - ${fields.successSignal}: ${formatBacklogValue(item.backlog.successSignal)}`,
        `  - ${fields.entryConstraints}: ${formatBacklogValue(item.backlog.entryConstraints)}`,
        `  - ${fields.capabilityGap}: ${formatBacklogValue(item.backlog.capabilityGap)}`,
        `  - ${fields.expectedSpecDelta}: ${formatBacklogValue(item.expectedSpecDelta)}`,
        `  - ${fields.openRisks}: ${formatBacklogValue(item.backlog.openRisks)}`,
        `  - ${fields.firstPlanningQuestion}: ${formatBacklogValue(item.backlog.firstPlanningQuestion)}`,
        `  - ${fields.requiredContextToLoad}: ${formatBacklogValue(item.backlog.requiredContextToLoad)}`,
        `  - ${fields.dependsOn}: ${item.dependsOn.length ? formatInlineCode(item.dependsOn.join(', ')) : '`-`'}`,
        `  - ${fields.parallelWith}: ${item.backlog.parallelWith.length ? formatInlineCode(item.backlog.parallelWith.join(', ')) : '`-`'}`,
        `  - ${fields.whyReadyNow}: ${formatBacklogValue(item.backlog.whyReadyNow)}`
      ].join('\n')
    )
    .join('\n\n');
}

function renderParked(tracking) {
  const labels = labelsFor(tracking);
  const fields = labels.parkedFields;
  const parkedItems = tracking.items.filter((item) => item.backlog.parked);
  if (!parkedItems.length) {
    return labels.parkedEmpty;
  }

  return parkedItems
    .map((item) =>
      [
        `- ${item.rmId}:`,
        `  - ${fields.parkedReason}: ${formatBacklogValue(item.backlog.parkedReason)}`,
        `  - ${fields.triggerToReopen}: ${formatBacklogValue(item.backlog.triggerToReopen)}`,
        `  - ${fields.missingEvidence}: ${formatBacklogValue(item.backlog.missingEvidence)}`
      ].join('\n')
    )
    .join('\n\n');
}

function renderProjectDirectionHandoff(tracking) {
  const labels = labelsFor(tracking);
  const context = tracking.context || {};

  return [
    `- ${labels.projectDirectionMode}: ${formatBacklogValue(context.projectDirectionMode)}`,
    `- ${labels.projectDirectionRationale}: ${formatBacklogValue(context.projectDirectionRationale)}`,
    `- ${labels.directionQuestionsSelected}: ${formatList(context.directionQuestionsSelected || [])}`,
    `- ${labels.directionQuestionsSkipped}: ${formatList(context.directionQuestionsSkipped || [])}`,
    `- ${labels.directionGuardrailsApplied}: ${formatList(context.directionGuardrailsApplied || [])}`,
    `- ${labels.planningPosture}: ${formatBacklogValue(context.planningPosture)}`,
    `- ${labels.evidenceMaturity}: ${formatBacklogValue(context.evidenceMaturity)}`
  ].join('\n');
}

function renderBacklogDocument({ backlogFile, trackingFile, tracking }) {
  const labels = labelsFor(tracking);
  const relativePath = path.relative(path.dirname(backlogFile), trackingFile).replace(/\\/g, '/');
  const displayPath = relativePath || path.basename(trackingFile);
  const sourceLabel = isRoadmapState(tracking) ? labels.roadmapStateSource : labels.trackingSource;
  const deprecationNotice = isRoadmapState(tracking)
    ? [labels.deprecatedProjection, '']
    : [];

  return [
    `# ${labels.backlogTitle}`,
    '',
    ...deprecationNotice,
    `## ${labels.backlogMeta}`,
    '',
    `- ${labels.roadmapVersion}: ${formatInlineCode(tracking.backlogMeta.roadmapVersion)}`,
    `- ${labels.skillVersion}: ${formatInlineCode(tracking.backlogMeta.skillVersion)}`,
    `- ${labels.lastSynced}: ${formatInlineCode(tracking.lastSyncedAt)}`,
    `- ${labels.currentFocusStage}: ${formatInlineCode(tracking.backlogMeta.currentFocusStage)}`,
    `- ${sourceLabel}: \`${displayPath}\``,
    '',
    `## ${labels.queue}`,
    '',
    renderBacklogQueue(tracking),
    '',
    `## ${labels.dependencyHandoff}`,
    '',
    `- ${labels.serialSpine}: ${formatBacklogValue(tracking.dependencyHandoff.serialSpine)}`,
    `- ${labels.parallelReadyNextWave}: ${formatBacklogValue(tracking.dependencyHandoff.parallelReadyNextWave)}`,
    `- ${labels.notesOnBlockers}: ${formatBacklogValue(tracking.dependencyHandoff.notesOnBlockers)}`,
    '',
    `## ${labels.projectDirectionHandoff}`,
    '',
    renderProjectDirectionHandoff(tracking),
    '',
    `## ${labels.readyForReqPlan}`,
    '',
    renderReadyForReqPlan(tracking),
    '',
    `## ${labels.parked}`,
    '',
    renderParked(tracking),
    ''
  ].join('\n');
}

module.exports = {
  renderBacklogDocument,
  renderRoadmapDocument,
  trackingFromMarkdown
};
