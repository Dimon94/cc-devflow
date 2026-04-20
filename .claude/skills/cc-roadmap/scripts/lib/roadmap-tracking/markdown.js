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
  formatBoolean,
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
  const section = extractSection(markdown, 'Implementation Tracking');
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

    if (label === 'roadmap version') {
      meta.roadmapVersion = value;
    } else if (label === 'skill version') {
      meta.skillVersion = value;
    } else if (label === 'last synced') {
      lastSyncedAt = value;
    } else if (label === 'current focus stage') {
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

    if (label === 'serial spine') {
      next.serialSpine = value;
    } else if (label === 'parallel ready next wave') {
      next.parallelReadyNextWave = value;
    } else if (label === 'notes on blockers') {
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

  const metaSection = extractSection(markdown, 'Backlog Meta');
  if (metaSection) {
    const parsed = parseBacklogMeta(metaSection.body);
    next.backlogMeta = parsed.meta;
    if (parsed.lastSyncedAt) {
      next.lastSyncedAt = parsed.lastSyncedAt;
    }
  }

  const queueSection = extractSection(markdown, 'Queue');
  if (queueSection) {
    next.items = mergeItemMaps(next.items, parseBacklogQueue(queueSection.body));
  }

  const dependencySection = extractSection(markdown, 'Dependency Handoff');
  if (dependencySection) {
    next.dependencyHandoff = parseDependencyHandoff(dependencySection.body);
  }

  const readySection = extractSection(markdown, 'Ready For Req-Plan');
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

  const parkedSection = extractSection(markdown, 'Parked');
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
  const header = `| ${ROADMAP_COLUMNS.map(([label]) => label).join(' | ')} |`;
  const separator = `|${ROADMAP_COLUMNS.map(() => '------').join('|')}|`;
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

function buildTrackingBody(roadmapFile, trackingFile, tracking) {
  const relativePath = path.relative(path.dirname(roadmapFile), trackingFile).replace(/\\/g, '/');
  const displayPath = relativePath || path.basename(trackingFile);

  return [
    '',
    `- Tracking source: \`${displayPath}\``,
    '',
    '<!-- roadmap-tracking:start -->',
    renderRoadmapTable(tracking),
    '<!-- roadmap-tracking:end -->',
    ''
  ].join('\n');
}

function renderRoadmapDocument({ original = '# ROADMAP\n', roadmapFile, trackingFile, tracking }) {
  const section = extractSection(original, 'Implementation Tracking');
  const body = buildTrackingBody(roadmapFile, trackingFile, tracking);
  const nextSection = `## Implementation Tracking${body}`;

  return section
    ? `${original.slice(0, section.start)}${nextSection}${original.slice(section.end)}`
    : `${original.replace(/\s*$/, '')}\n\n${nextSection}\n`;
}

function renderBacklogQueue(tracking) {
  const header = `| ${BACKLOG_QUEUE_COLUMNS.map(([label]) => label).join(' | ')} |`;
  const separator = `|${BACKLOG_QUEUE_COLUMNS.map(() => '------').join('|')}|`;
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
          formatBoolean(item.backlog.ready)
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
          'No'
        ].join(' | ')
      ];

  return [header, separator, ...rows.map((row) => `| ${row} |`)].join('\n');
}

function renderReadyForReqPlan(tracking) {
  const readyItems = tracking.items.filter((item) => item.backlog.ready && !item.backlog.parked);
  if (!readyItems.length) {
    return '- RM-001:\n  - Primary Capability:\n  - Secondary Capabilities:\n  - Why now:\n  - Success signal:\n  - Entry constraints:\n  - Capability gap:\n  - Expected spec delta:\n  - Open risks:\n  - First planning question:\n  - Required context to load:\n  - Depends On:\n  - Parallel With:\n  - Why this is ready now:';
  }

  return readyItems
    .map((item) =>
      [
        `- ${item.rmId}:`,
        `  - Primary Capability: ${formatInlineCode(item.primaryCapability)}`,
        `  - Secondary Capabilities: ${item.secondaryCapabilities.length ? formatInlineCode(item.secondaryCapabilities.join(', ')) : '`-`'}`,
        `  - Why now: ${formatBacklogValue(item.backlog.whyNow)}`,
        `  - Success signal: ${formatBacklogValue(item.backlog.successSignal)}`,
        `  - Entry constraints: ${formatBacklogValue(item.backlog.entryConstraints)}`,
        `  - Capability gap: ${formatBacklogValue(item.backlog.capabilityGap)}`,
        `  - Expected spec delta: ${formatBacklogValue(item.expectedSpecDelta)}`,
        `  - Open risks: ${formatBacklogValue(item.backlog.openRisks)}`,
        `  - First planning question: ${formatBacklogValue(item.backlog.firstPlanningQuestion)}`,
        `  - Required context to load: ${formatBacklogValue(item.backlog.requiredContextToLoad)}`,
        `  - Depends On: ${item.dependsOn.length ? formatInlineCode(item.dependsOn.join(', ')) : '`-`'}`,
        `  - Parallel With: ${item.backlog.parallelWith.length ? formatInlineCode(item.backlog.parallelWith.join(', ')) : '`-`'}`,
        `  - Why this is ready now: ${formatBacklogValue(item.backlog.whyReadyNow)}`
      ].join('\n')
    )
    .join('\n\n');
}

function renderParked(tracking) {
  const parkedItems = tracking.items.filter((item) => item.backlog.parked);
  if (!parkedItems.length) {
    return '- RM-XXX:\n  - Reason parked:\n  - Trigger to reopen:\n  - Missing evidence:';
  }

  return parkedItems
    .map((item) =>
      [
        `- ${item.rmId}:`,
        `  - Reason parked: ${formatBacklogValue(item.backlog.parkedReason)}`,
        `  - Trigger to reopen: ${formatBacklogValue(item.backlog.triggerToReopen)}`,
        `  - Missing evidence: ${formatBacklogValue(item.backlog.missingEvidence)}`
      ].join('\n')
    )
    .join('\n\n');
}

function renderBacklogDocument({ backlogFile, trackingFile, tracking }) {
  const relativePath = path.relative(path.dirname(backlogFile), trackingFile).replace(/\\/g, '/');
  const displayPath = relativePath || path.basename(trackingFile);

  return [
    '# BACKLOG',
    '',
    '## Backlog Meta',
    '',
    `- Roadmap version: ${formatInlineCode(tracking.backlogMeta.roadmapVersion)}`,
    `- Skill version: ${formatInlineCode(tracking.backlogMeta.skillVersion)}`,
    `- Last synced: ${formatInlineCode(tracking.lastSyncedAt)}`,
    `- Current focus stage: ${formatInlineCode(tracking.backlogMeta.currentFocusStage)}`,
    `- Tracking source: \`${displayPath}\``,
    '',
    '## Queue',
    '',
    renderBacklogQueue(tracking),
    '',
    '## Dependency Handoff',
    '',
    `- Serial spine: ${formatBacklogValue(tracking.dependencyHandoff.serialSpine)}`,
    `- Parallel-ready next wave: ${formatBacklogValue(tracking.dependencyHandoff.parallelReadyNextWave)}`,
    `- Notes on blockers: ${formatBacklogValue(tracking.dependencyHandoff.notesOnBlockers)}`,
    '',
    '## Ready For Req-Plan',
    '',
    renderReadyForReqPlan(tracking),
    '',
    '## Parked',
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
