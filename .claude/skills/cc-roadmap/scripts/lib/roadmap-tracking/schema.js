const ROADMAP_COLUMNS = [
  ['RM-ID', 'rmId'],
  ['Item', 'item'],
  ['Stage', 'stage'],
  ['Priority', 'priority'],
  ['Primary Capability', 'primaryCapability'],
  ['Secondary Capabilities', 'secondaryCapabilities'],
  ['Expected Spec Delta', 'expectedSpecDelta'],
  ['Depends On', 'dependsOn'],
  ['Status', 'status'],
  ['REQ', 'req'],
  ['Progress', 'progress']
];

const BACKLOG_QUEUE_COLUMNS = [
  ['RM-ID', 'rmId'],
  ['Title', 'item'],
  ['Source Stage', 'stage'],
  ['Priority', 'priority'],
  ['Primary Capability', 'primaryCapability'],
  ['Secondary Capabilities', 'secondaryCapabilities'],
  ['Capability Gap', 'capabilityGap'],
  ['Expected Spec Delta', 'expectedSpecDelta'],
  ['Evidence', 'evidence'],
  ['Depends On', 'dependsOn'],
  ['Parallel With', 'parallelWith'],
  ['Unknowns', 'unknowns'],
  ['Next Decision', 'nextDecision'],
  ['Ready', 'ready']
];

const DEFAULT_BACKLOG = {
  capabilityGap: '',
  evidence: '',
  parallelWith: [],
  unknowns: '',
  nextDecision: '',
  ready: false,
  whyNow: '',
  successSignal: '',
  entryConstraints: '',
  openRisks: '',
  reviewGateHints: '',
  firstPlanningQuestion: '',
  requiredContextToLoad: '',
  whyReadyNow: '',
  parked: false,
  parkedReason: '',
  triggerToReopen: '',
  missingEvidence: ''
};

const DEFAULT_TRACKING = {
  version: 2,
  outputPolicy: {
    documentLanguage: 'en'
  },
  lastSyncedAt: '',
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
  items: []
};

const DEFAULT_ROADMAP_STATE = {
  version: 3,
  outputPolicy: {
    documentLanguage: 'en'
  },
  meta: {
    roadmapVersion: '',
    skillVersion: '',
    status: 'active',
    lastUpdated: '',
    currentFocusStage: ''
  },
  context: {
    projectDirectionMode: '',
    projectDirectionRationale: '',
    directionQuestionsSelected: [],
    directionQuestionsSkipped: [],
    directionGuardrailsApplied: [],
    planningPosture: '',
    evidenceMaturity: '',
    canonicalTerms: [],
    durableDecisionSources: []
  },
  evidence: [],
  route: {
    recommended: '',
    whyThisWinsNow: '',
    rejectedRoutes: [],
    firstSignal: '',
    killSignal: ''
  },
  stages: [],
  items: [],
  handoff: {
    readyForCcPlan: [],
    parked: [],
    serialSpine: [],
    parallelWaves: []
  },
  architecture: {
    diagramType: 'flowchart',
    nodes: [],
    edges: []
  }
};

function normalizeHeader(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ');
}

function normalizeCell(value) {
  const trimmed = String(value || '').trim();
  return trimmed === '-' ? '' : trimmed;
}

function parseList(value) {
  const cleaned = normalizeCell(value);
  if (!cleaned) {
    return [];
  }

  return cleaned
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatList(items) {
  return items.length ? items.join(', ') : '-';
}

function formatCell(value) {
  const cleaned = String(value || '').trim();
  return cleaned || '-';
}

function formatBacklogValue(value) {
  return formatCell(value);
}

function formatBoolean(value) {
  return value ? 'Yes' : 'No';
}

function formatInlineCode(value) {
  const cleaned = String(value || '').trim();
  return cleaned ? `\`${cleaned}\`` : '';
}

function normalizeBoolean(value) {
  const normalized = normalizeCell(value).toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '是';
}

function emptyBacklog() {
  return {
    ...DEFAULT_BACKLOG,
    parallelWith: []
  };
}

function normalizeItem(raw) {
  const backlog = raw.backlog || {};

  return {
    rmId: String(raw.rmId || '').trim(),
    item: String(raw.item || '').trim(),
    stage: String(raw.stage || '').trim(),
    priority: String(raw.priority || '').trim(),
    primaryCapability: String(raw.primaryCapability || '').trim(),
    secondaryCapabilities: Array.isArray(raw.secondaryCapabilities)
      ? raw.secondaryCapabilities.map((entry) => String(entry).trim()).filter(Boolean)
      : parseList(raw.secondaryCapabilities),
    expectedSpecDelta: String(raw.expectedSpecDelta || '').trim(),
    dependsOn: Array.isArray(raw.dependsOn)
      ? raw.dependsOn.map((entry) => String(entry).trim()).filter(Boolean)
      : parseList(raw.dependsOn),
    status: String(raw.status || '').trim(),
    req: String(raw.req || '').trim(),
    progress: String(raw.progress || '').trim(),
    backlog: {
      capabilityGap: String(backlog.capabilityGap || '').trim(),
      evidence: String(backlog.evidence || '').trim(),
      parallelWith: Array.isArray(backlog.parallelWith)
        ? backlog.parallelWith.map((entry) => String(entry).trim()).filter(Boolean)
        : parseList(backlog.parallelWith),
      unknowns: String(backlog.unknowns || '').trim(),
      nextDecision: String(backlog.nextDecision || '').trim(),
      ready: Boolean(backlog.ready),
      whyNow: String(backlog.whyNow || '').trim(),
      successSignal: String(backlog.successSignal || '').trim(),
      entryConstraints: String(backlog.entryConstraints || '').trim(),
      openRisks: String(backlog.openRisks || '').trim(),
      reviewGateHints: String(backlog.reviewGateHints || '').trim(),
      firstPlanningQuestion: String(backlog.firstPlanningQuestion || '').trim(),
      requiredContextToLoad: String(backlog.requiredContextToLoad || '').trim(),
      whyReadyNow: String(backlog.whyReadyNow || '').trim(),
      parked: Boolean(backlog.parked),
      parkedReason: String(backlog.parkedReason || '').trim(),
      triggerToReopen: String(backlog.triggerToReopen || '').trim(),
      missingEvidence: String(backlog.missingEvidence || '').trim()
    }
  };
}

function normalizeTracking(raw) {
  const backlogMeta = raw.backlogMeta || {};
  const dependencyHandoff = raw.dependencyHandoff || {};
  const items = Array.isArray(raw.items) ? raw.items.map(normalizeItem) : [];

  return {
    version: 2,
    outputPolicy: {
      ...DEFAULT_TRACKING.outputPolicy,
      ...(raw.outputPolicy || {})
    },
    lastSyncedAt: String(raw.lastSyncedAt || '').trim(),
    backlogMeta: {
      roadmapVersion: String(backlogMeta.roadmapVersion || '').trim(),
      skillVersion: String(backlogMeta.skillVersion || '').trim(),
      currentFocusStage: String(backlogMeta.currentFocusStage || '').trim()
    },
    dependencyHandoff: {
      serialSpine: String(dependencyHandoff.serialSpine || '').trim(),
      parallelReadyNextWave: String(dependencyHandoff.parallelReadyNextWave || '').trim(),
      notesOnBlockers: String(dependencyHandoff.notesOnBlockers || '').trim()
    },
    items
  };
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return parseList(value);
}

function buildRoadmapHandoff(tracking, handoff = {}) {
  const items = Array.isArray(tracking.items) ? tracking.items : [];
  const dependencyHandoff = tracking.dependencyHandoff || {};
  const readyForCcPlan = normalizeStringList(handoff.readyForCcPlan);
  const parked = normalizeStringList(handoff.parked);

  return {
    readyForCcPlan: readyForCcPlan.length
      ? readyForCcPlan
      : items.filter((item) => item.backlog.ready && !item.backlog.parked).map((item) => item.rmId),
    parked: parked.length
      ? parked
      : items.filter((item) => item.backlog.parked).map((item) => item.rmId),
    serialSpine: normalizeStringList(handoff.serialSpine || dependencyHandoff.serialSpine),
    parallelWaves: normalizeStringList(
      handoff.parallelWaves || dependencyHandoff.parallelReadyNextWave
    )
  };
}

function normalizeRoadmapState(raw = {}) {
  const tracking = normalizeTracking(raw);
  const meta = raw.meta || {};
  const context = raw.context || {};
  const route = raw.route || {};
  const architecture = raw.architecture || {};
  const normalizedMeta = {
    ...DEFAULT_ROADMAP_STATE.meta,
    roadmapVersion: String(meta.roadmapVersion || tracking.backlogMeta.roadmapVersion).trim(),
    skillVersion: String(meta.skillVersion || tracking.backlogMeta.skillVersion).trim(),
    status: String(meta.status || DEFAULT_ROADMAP_STATE.meta.status).trim(),
    lastUpdated: String(meta.lastUpdated || tracking.lastSyncedAt).trim(),
    currentFocusStage: String(meta.currentFocusStage || tracking.backlogMeta.currentFocusStage).trim()
  };

  return {
    ...DEFAULT_ROADMAP_STATE,
    version: 3,
    outputPolicy: {
      ...DEFAULT_ROADMAP_STATE.outputPolicy,
      ...(raw.outputPolicy || {})
    },
    meta: normalizedMeta,
    context: {
      ...DEFAULT_ROADMAP_STATE.context,
      ...context,
      directionQuestionsSelected: normalizeStringList(context.directionQuestionsSelected),
      directionQuestionsSkipped: normalizeStringList(context.directionQuestionsSkipped),
      directionGuardrailsApplied: normalizeStringList(context.directionGuardrailsApplied),
      canonicalTerms: normalizeStringList(context.canonicalTerms),
      durableDecisionSources: normalizeStringList(context.durableDecisionSources)
    },
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [],
    route: {
      ...DEFAULT_ROADMAP_STATE.route,
      ...route,
      rejectedRoutes: Array.isArray(route.rejectedRoutes) ? route.rejectedRoutes : []
    },
    stages: Array.isArray(raw.stages) ? raw.stages : [],
    items: tracking.items,
    backlogMeta: {
      roadmapVersion: normalizedMeta.roadmapVersion,
      skillVersion: normalizedMeta.skillVersion,
      currentFocusStage: normalizedMeta.currentFocusStage
    },
    dependencyHandoff: tracking.dependencyHandoff,
    lastSyncedAt: tracking.lastSyncedAt,
    handoff: buildRoadmapHandoff(tracking, raw.handoff || {}),
    architecture: {
      ...DEFAULT_ROADMAP_STATE.architecture,
      ...architecture,
      nodes: Array.isArray(architecture.nodes) ? architecture.nodes : [],
      edges: Array.isArray(architecture.edges) ? architecture.edges : []
    }
  };
}

const ROADMAP_HEADER_TO_KEY = new Map(
  [
    ...ROADMAP_COLUMNS,
    ['事项', 'item'],
    ['阶段', 'stage'],
    ['优先级', 'priority'],
    ['主能力', 'primaryCapability'],
    ['次能力', 'secondaryCapabilities'],
    ['预期规格变化', 'expectedSpecDelta'],
    ['依赖', 'dependsOn'],
    ['状态', 'status'],
    ['进度', 'progress']
  ].map(([header, key]) => [normalizeHeader(header), key])
);

const BACKLOG_QUEUE_HEADER_TO_KEY = new Map(
  [
    ...BACKLOG_QUEUE_COLUMNS,
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
  ].map(([header, key]) => [normalizeHeader(header), key])
);

const READY_FIELD_MAP = new Map(
  [
    ['Primary Capability', 'primaryCapability'],
    ['主能力', 'primaryCapability'],
    ['Secondary Capabilities', 'secondaryCapabilities'],
    ['次能力', 'secondaryCapabilities'],
    ['Why now', 'whyNow'],
    ['为什么现在做', 'whyNow'],
    ['Success signal', 'successSignal'],
    ['成功信号', 'successSignal'],
    ['Entry constraints', 'entryConstraints'],
    ['进入约束', 'entryConstraints'],
    ['Capability gap', 'capabilityGap'],
    ['能力缺口', 'capabilityGap'],
    ['Expected spec delta', 'expectedSpecDelta'],
    ['预期规格变化', 'expectedSpecDelta'],
    ['Open risks', 'openRisks'],
    ['未决风险', 'openRisks'],
    ['Review gate hints', 'reviewGateHints'],
    ['审查门禁提示', 'reviewGateHints'],
    ['First planning question', 'firstPlanningQuestion'],
    ['首个规划问题', 'firstPlanningQuestion'],
    ['Required context to load', 'requiredContextToLoad'],
    ['必须加载的上下文', 'requiredContextToLoad'],
    ['Depends On', 'dependsOn'],
    ['依赖', 'dependsOn'],
    ['Parallel With', 'parallelWith'],
    ['可并行', 'parallelWith'],
    ['Why this is ready now', 'whyReadyNow'],
    ['为什么现在已就绪', 'whyReadyNow']
  ].map(([label, key]) => [normalizeHeader(label), key])
);

const PARKED_FIELD_MAP = new Map(
  [
    ['Reason parked', 'parkedReason'],
    ['暂存原因', 'parkedReason'],
    ['Trigger to reopen', 'triggerToReopen'],
    ['重新打开触发条件', 'triggerToReopen'],
    ['Missing evidence', 'missingEvidence'],
    ['缺失证据', 'missingEvidence']
  ].map(([label, key]) => [normalizeHeader(label), key])
);

module.exports = {
  BACKLOG_QUEUE_COLUMNS,
  BACKLOG_QUEUE_HEADER_TO_KEY,
  DEFAULT_ROADMAP_STATE,
  DEFAULT_TRACKING,
  PARKED_FIELD_MAP,
  READY_FIELD_MAP,
  ROADMAP_COLUMNS,
  ROADMAP_HEADER_TO_KEY,
  emptyBacklog,
  formatBacklogValue,
  formatBoolean,
  formatCell,
  formatInlineCode,
  formatList,
  normalizeBoolean,
  normalizeCell,
  normalizeHeader,
  normalizeItem,
  normalizeRoadmapState,
  normalizeTracking,
  parseList
};
