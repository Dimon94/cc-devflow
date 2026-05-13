/**
 * [INPUT]: workflow-context 的源 artifact 路径、manifest、当前 task、report。
 * [OUTPUT]: 生成 context index 所需的 source hash、must-not-forget、open refs 与 digest。
 * [POS]: skill runtime 的上下文索引构造层；只做只读索引，不决定 workflow 路由。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function dedupe(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stableStringify(value[key])}`
    )).join(',')}}`;
  }

  return JSON.stringify(value);
}

function digestValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  return crypto
    .createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
    .slice(0, 16);
}

async function fileExists(filePath) {
  if (!filePath) {
    return false;
  }

  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath) {
  if (!(await fileExists(filePath))) {
    return null;
  }

  const bytes = await fs.promises.readFile(filePath);
  return `sha256:${crypto
    .createHash('sha256')
    .update(bytes)
    .digest('hex')}`;
}

async function digestFile(filePath) {
  const hash = await hashFile(filePath);
  return hash ? hash.replace(/^sha256:/, '').slice(0, 16) : null;
}

function withFragment(filePath, fragment) {
  return filePath && fragment ? `${filePath}#${fragment}` : filePath;
}

function splitRef(ref) {
  const [filePath, fragment = ''] = String(ref || '').split('#');
  return { filePath, fragment };
}

function limitList(values, limit = 6) {
  return dedupe(values)
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function stripMarkdownBullet(line) {
  return String(line || '')
    .replace(/^\s*[-*]\s+/, '')
    .replace(/`/g, '')
    .trim();
}

async function readTextIfExists(filePath) {
  if (!(await fileExists(filePath))) {
    return '';
  }

  return fs.promises.readFile(filePath, 'utf8');
}

function extractHeadingSection(markdown, headingPattern) {
  const lines = String(markdown || '').split('\n');
  const start = lines.findIndex((line) => headingPattern.test(line));
  if (start === -1) {
    return '';
  }

  const level = (lines[start].match(/^#+/) || [''])[0].length;
  const end = lines.findIndex((line, index) => (
    index > start
    && /^#+\s/.test(line)
    && (line.match(/^#+/) || [''])[0].length <= level
  ));

  return lines.slice(start, end === -1 ? lines.length : end).join('\n');
}

function extractBulletsFromSections(markdown, headingPatterns, limit = 6) {
  const bullets = [];
  for (const pattern of headingPatterns) {
    const section = extractHeadingSection(markdown, pattern);
    if (!section) {
      continue;
    }

    for (const line of section.split('\n')) {
      if (/^\s*[-*]\s+/.test(line)) {
        bullets.push(stripMarkdownBullet(line));
      }
    }
  }

  return limitList(bullets, limit);
}

function extractNestedBulletsAfterMarker(markdown, markerPattern, limit = 6) {
  const lines = String(markdown || '').split('\n');
  const markerIndex = lines.findIndex((line) => markerPattern.test(line));
  if (markerIndex === -1) {
    return [];
  }

  const bullets = [];
  for (let index = markerIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^#+\s/.test(line)) {
      break;
    }
    if (!/^\s*[-*]\s+/.test(line)) {
      continue;
    }
    if (/^\s{2,}[-*]\s+/.test(line)) {
      bullets.push(stripMarkdownBullet(line));
      continue;
    }
    if (bullets.length > 0) {
      break;
    }
  }

  return limitList(bullets, limit);
}

function sourceHashForRef(source, ref) {
  const { filePath } = splitRef(ref);
  const match = Object.values(source || {}).find((entry) => entry?.path === filePath);
  return match?.hash || null;
}

function openRef(ref, reason, source) {
  if (!ref) {
    return null;
  }

  return {
    ref,
    reason,
    sourceHash: sourceHashForRef(source, ref)
  };
}

function slugifyHeading(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
}

function markdownHeadings(markdown) {
  return String(markdown || '')
    .split('\n')
    .map((line) => {
      const match = line.match(/^#+\s+(.+?)\s*$/);
      return match ? match[1].trim() : null;
    })
    .filter(Boolean);
}

function jsonPointerExists(value, pointer) {
  if (!pointer) {
    return true;
  }

  if (pointer === '/summary') {
    return true;
  }

  if (pointer.startsWith('/tasks/')) {
    const taskId = pointer.slice('/tasks/'.length);
    return Array.isArray(value?.tasks) && value.tasks.some((task) => task.id === taskId);
  }

  return pointer
    .split('/')
    .filter(Boolean)
    .reduce((current, segment) => {
      if (current === undefined || current === null) {
        return undefined;
      }

      const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
      return current[key];
    }, value) !== undefined;
}

function fallbackMarkdownRef(relativePath, headings) {
  const preferred = [
    'Progressive Disclosure Index',
    'Frozen Design Card',
    'Approved Direction',
    'Requirement Snapshot',
    'Validation',
    'Main Risk'
  ];
  const heading = preferred.find((candidate) => (
    headings.some((actual) => slugifyHeading(actual) === slugifyHeading(candidate))
  )) || headings[0];

  return heading ? withFragment(relativePath, slugifyHeading(heading)) : relativePath;
}

async function validateRef(entry, repoRoot) {
  if (!entry?.ref || entry.ref.includes('<change-key>')) {
    return entry;
  }

  const { filePath, fragment } = splitRef(entry.ref);
  const absolutePath = path.join(repoRoot, filePath);
  if (!(await fileExists(absolutePath))) {
    return {
      ...entry,
      exists: false,
      manifestIssue: `missing referenced artifact: ${filePath}`
    };
  }

  if (!fragment) {
    return { ...entry, exists: true };
  }

  if (filePath.endsWith('.json')) {
    try {
      const value = JSON.parse(await fs.promises.readFile(absolutePath, 'utf8'));
      const exists = jsonPointerExists(value, fragment);
      return exists ? { ...entry, exists: true } : {
        ...entry,
        exists: false,
        fallbackRef: filePath,
        manifestIssue: `missing JSON pointer ${fragment} in ${filePath}`
      };
    } catch {
      return {
        ...entry,
        exists: false,
        fallbackRef: filePath,
        manifestIssue: `invalid JSON while validating ${entry.ref}`
      };
    }
  }

  if (filePath.endsWith('.md')) {
    const text = await fs.promises.readFile(absolutePath, 'utf8');
    const headings = markdownHeadings(text);
    const exists = headings.some((heading) => slugifyHeading(heading) === slugifyHeading(fragment));
    return exists ? { ...entry, exists: true } : {
      ...entry,
      exists: false,
      fallbackRef: fallbackMarkdownRef(filePath, headings),
      manifestIssue: `missing markdown section ${fragment} in ${filePath}`
    };
  }

  return { ...entry, exists: true };
}

async function validateOpenRefs(entries, { repoRoot }) {
  return Promise.all((entries || []).map((entry) => validateRef(entry, repoRoot)));
}

async function validateDeepOpenGroups(groups, { repoRoot }) {
  return Promise.all((groups || []).map(async (group) => ({
    ...group,
    refs: await validateOpenRefs(group.refs, { repoRoot })
  })));
}

function dedupeOpenRefs(entries) {
  const seen = new Set();
  return (entries || []).filter((entry) => {
    if (!entry?.ref || seen.has(entry.ref)) {
      return false;
    }
    seen.add(entry.ref);
    return true;
  });
}

function buildDefaultOpenRefs({ nextTask, refs, source }) {
  const taskId = nextTask?.id || null;
  return dedupeOpenRefs([
    openRef(
      refs.relativePrimaryContractRef,
      'primary task contract',
      source
    ),
    openRef(
      taskId ? withFragment(refs.relativeManifestPath, `/tasks/${taskId}`) : withFragment(refs.relativeManifestPath, '/summary'),
      taskId ? 'current task source of truth' : 'task graph summary source of truth',
      source
    ),
    openRef(
      refs.relativeContractIndexRef
        || (refs.relativeContractPath ? withFragment(refs.relativeContractPath, 'progressive-disclosure-index') : null),
      'contract index for non-negotiable design constraints',
      source
    ),
    openRef(
      refs.relativeChangeMetaPath ? withFragment(refs.relativeChangeMetaPath, '/spec') : null,
      'scope and spec-sync status',
      source
    ),
    openRef(
      refs.relativeReportPath ? withFragment(refs.relativeReportPath, '/verdict') : null,
      'latest verification verdict',
      source
    )
  ]);
}

function deepOpenGroup({ when, conditions, refs: openRefs, source, command }) {
  const group = {
    when,
    conditions,
    refs: dedupeOpenRefs(openRefs.map((entry) => (
      typeof entry === 'string'
        ? openRef(entry, when, source)
        : openRef(entry.ref, entry.reason || when, source)
    )))
  };

  if (command) {
    group.command = command;
  }

  return group;
}

function summarizeManifestForDigest(manifest) {
  return {
    changeId: manifest.changeId || null,
    currentTaskId: manifest.currentTaskId || null,
    tasks: (manifest.tasks || []).map((task) => ({
      id: task.id,
      status: task.status || 'pending',
      phase: task.phase || 0,
      dependsOn: task.dependsOn || [],
      files: task.files || [],
      verification: task.verification || []
    }))
  };
}

function summarizeEvidenceForDigest({ nextTask, report }) {
  return {
    currentTaskEvidence: nextTask?.evidence || [],
    report: report ? {
      overall: report.overall || null,
      verdict: report.verdict || null,
      reroute: report.reroute || null,
      specSyncReady: report.specSyncReady === true,
      blockingFindings: report.blockingFindings || [],
      gaps: report.gaps || []
    } : null
  };
}

async function buildPacketOnly({
  canonicalContractPath,
  manifest,
  currentTaskSummary,
  nextTask,
  report,
  mustNotForget
}) {
  return {
    contractDigest: await digestFile(canonicalContractPath),
    manifestDigest: digestValue(summarizeManifestForDigest(manifest)),
    currentTaskDigest: digestValue(currentTaskSummary),
    evidenceDigest: digestValue(summarizeEvidenceForDigest({ nextTask, report })),
    mustNotForgetDigest: digestValue(mustNotForget)
  };
}

async function buildSourceIndex({
  manifestPath,
  canonicalContractPath,
  tasksPath,
  changeMetaPath,
  reportPath,
  checkpointPath,
  refs
}) {
  const entries = {
    manifest: {
      path: refs.relativeManifestPath,
      hash: await hashFile(manifestPath)
    },
    contract: refs.relativeContractPath ? {
      path: refs.relativeContractPath,
      hash: await hashFile(canonicalContractPath)
    } : null,
    tasks: refs.relativeTasksPath ? {
      path: refs.relativeTasksPath,
      hash: await hashFile(tasksPath)
    } : null,
    changeMeta: refs.relativeChangeMetaPath ? {
      path: refs.relativeChangeMetaPath,
      hash: await hashFile(changeMetaPath)
    } : null,
    reportCard: refs.relativeReportPath ? {
      path: refs.relativeReportPath,
      hash: await hashFile(reportPath)
    } : null,
    checkpoint: refs.relativeCheckpointPath ? {
      path: refs.relativeCheckpointPath,
      hash: await hashFile(checkpointPath)
    } : null
  };

  return Object.fromEntries(Object.entries(entries).filter(([, value]) => value));
}

function buildSourceHashes(source) {
  return Object.fromEntries(
    Object.values(source || {})
      .filter((entry) => entry?.path && entry.hash)
      .map((entry) => [entry.path, entry.hash])
  );
}

function sourcePointer(ref, source) {
  return {
    ref,
    hash: sourceHashForRef(source, ref)
  };
}

function sourcedValue(value, ref, source) {
  return {
    value,
    source: sourcePointer(ref, source)
  };
}

async function buildMustNotForget({
  manifest,
  nextTask,
  report,
  source,
  refs,
  canonicalContractPath,
  missingVerificationCommands
}) {
  const contractText = await readTextIfExists(canonicalContractPath);
  const taskRef = nextTask
    ? withFragment(refs.relativeManifestPath, `/tasks/${nextTask.id}`)
    : withFragment(refs.relativeManifestPath, '/summary');
  const contractRef = refs.relativeContractPath
    ? (refs.relativeContractRef || withFragment(refs.relativeContractPath, 'contract-index'))
    : taskRef;
  const goal = manifest.goal || 'Deliver planned requirement changes safely.';
  const taskContract = nextTask?.contract || {};
  const taskNotes = nextTask?.context?.notes || [];
  const designDecisions = [
    ...extractNestedBulletsAfterMarker(contractText, /must not re-decide|Frozen decisions/i),
    ...extractBulletsFromSections(contractText, [/^##\s+Approved Direction/i, /^##\s+Frozen Design Card/i], 6)
  ];
  const risks = [
    ...extractBulletsFromSections(contractText, [/^##\s+Main Risk/i, /^##\s+Success Criteria/i], 6),
    ...(report?.blockingFindings || []),
    ...(report?.gaps || [])
  ];
  const nonNegotiables = limitList([
    'workflow-context is read-only and must not mutate source artifacts',
    'source-of-truth artifacts remain authoritative; chat memory never replaces them',
    'ship-readiness remains the source of truth for cc-act routing',
    'current task state comes from task-manifest.json, not the ready queue alone',
    missingVerificationCommands ? 'verification commands are required before execution can continue' : null,
    ...taskNotes.filter((note) => /do not|must|keep|only|without/i.test(note))
  ]);
  const doNotRedecide = limitList([
    ...(taskContract.doNotRedecide || []),
    ...designDecisions
  ]);
  const acceptanceGates = limitList([
    ...(nextTask?.acceptance || []),
    ...(nextTask?.verification || []),
    nextTask?.testSeam?.publicVerificationPath || null
  ]);
  const knownRisks = limitList([
    ...risks,
    'if scope, task ownership, or source hashes are uncertain, open the source artifact before acting'
  ]);

  return {
    goal: sourcedValue(goal, withFragment(refs.relativeManifestPath, '/goal'), source),
    nonNegotiables: nonNegotiables.map((value) => sourcedValue(value, contractRef, source)),
    doNotRedecide: doNotRedecide.map((value) => sourcedValue(value, contractRef, source)),
    acceptanceGates: acceptanceGates.map((value) => sourcedValue(value, taskRef, source)),
    knownRisks: knownRisks.map((value) => sourcedValue(value, contractRef, source))
  };
}

module.exports = {
  buildDefaultOpenRefs,
  buildMustNotForget,
  buildPacketOnly,
  buildSourceHashes,
  buildSourceIndex,
  dedupeOpenRefs,
  deepOpenGroup,
  openRef,
  validateDeepOpenGroups,
  validateOpenRefs,
  withFragment
};
