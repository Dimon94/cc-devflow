const fs = require('fs');

const {
  emptyBacklog,
  normalizeItem,
  normalizeTracking,
  parseList
} = require('./schema');
const {
  renderBacklogDocument,
  renderRoadmapDocument,
  trackingFromMarkdown
} = require('./markdown');

function ensureDir(filePath) {
  fs.mkdirSync(require('path').dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function readFileIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return '';
  }

  return fs.readFileSync(filePath, 'utf8');
}

function upgradeLegacyTracking(parsed) {
  if (parsed.version === 2 || parsed.backlogMeta || parsed.dependencyHandoff) {
    return normalizeTracking(parsed);
  }

  return normalizeTracking({
    version: 2,
    lastSyncedAt: parsed.lastSyncedAt || '',
    backlogMeta: {
      roadmapVersion: '',
      skillVersion: '',
      currentFocusStage: ''
    },
    dependencyHandoff: {
      serialSpine: '',
      parallelReadyNextWave: '',
      notesOnBlockers: ''
    },
    items: Array.isArray(parsed.items)
      ? parsed.items.map((item) => ({
          ...item,
          backlog: {
            ...emptyBacklog(),
            ...(item.backlog || {})
          }
        }))
      : []
  });
}

function loadTracking({ trackingFile, roadmapFile = '', backlogFile = '' }) {
  if (trackingFile && fs.existsSync(trackingFile)) {
    return upgradeLegacyTracking(readJson(trackingFile));
  }

  return trackingFromMarkdown(readFileIfExists(roadmapFile), readFileIfExists(backlogFile));
}

function applySyncArgs(tracking, args) {
  const index = tracking.items.findIndex((item) => item.rmId === args.rm);
  const item = index === -1 ? normalizeItem({ rmId: args.rm }) : tracking.items[index];

  const scalarUpdates = [
    ['item', 'item'],
    ['stage', 'stage'],
    ['priority', 'priority'],
    ['primary-capability', 'primaryCapability'],
    ['spec-delta', 'expectedSpecDelta'],
    ['status', 'status'],
    ['req', 'req'],
    ['progress', 'progress']
  ];

  scalarUpdates.forEach(([argName, key]) => {
    if (args[argName] != null) {
      item[key] = String(args[argName]).trim();
    }
  });

  if (args['secondary-capabilities'] != null) {
    item.secondaryCapabilities = parseList(args['secondary-capabilities']);
  }

  if (args['depends-on'] != null) {
    item.dependsOn = parseList(args['depends-on']);
  }

  const normalized = normalizeItem(item);
  if (index === -1) {
    tracking.items.push(normalized);
  } else {
    tracking.items[index] = normalized;
  }

  tracking.lastSyncedAt = new Date().toISOString().slice(0, 10);
  return tracking;
}

function persistTrackingFiles({ trackingFile, roadmapFile, backlogFile, tracking }) {
  writeJson(trackingFile, tracking);

  const roadmapOutput = renderRoadmapDocument({
    original: readFileIfExists(roadmapFile) || '# ROADMAP\n',
    roadmapFile,
    trackingFile,
    tracking
  });
  const backlogOutput = renderBacklogDocument({
    backlogFile,
    trackingFile,
    tracking
  });

  ensureDir(roadmapFile);
  fs.writeFileSync(roadmapFile, roadmapOutput);
  ensureDir(backlogFile);
  fs.writeFileSync(backlogFile, backlogOutput);
}

module.exports = {
  applySyncArgs,
  loadTracking,
  persistTrackingFiles
};
