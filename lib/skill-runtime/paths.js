/**
 * [INPUT]: 依赖 fs/path，接收 repoRoot/changeId 等定位参数。
 * [OUTPUT]: 对外提供 devflow canonical change layout 的唯一路径解析能力。
 * [POS]: skill runtime 的路径真相源，完整 change key 才是目录身份。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

const CHANGE_ID_PATTERN = /^(REQ|FIX)-\d+(?:-[a-z0-9-]+)?$/;

function slugifySegment(value, fallback = 'change') {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
}

function assertChangeId(changeId) {
  const value = String(changeId || '').trim();
  if (!CHANGE_ID_PATTERN.test(value)) {
    throw new Error(
      `Invalid changeId "${value}". Use REQ-<number>[-description] or FIX-<number>[-description].`
    );
  }

  return value;
}

function getChangeKeyPrefix(changeId) {
  const value = assertChangeId(changeId);
  return value.match(/^(REQ|FIX)-\d+/)[0];
}

function stripChangeIdPrefix(changeId, value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const prefixes = Array.from(new Set([
    String(changeId || '').trim(),
    getChangeKeyPrefix(changeId),
    slugifySegment(changeId, 'change')
  ]))
    .filter(Boolean)
    .map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  for (const prefix of prefixes) {
    const stripped = text.replace(new RegExp(`^${prefix}[\\s:._-]*`, 'i'), '').trim();
    if (stripped !== text) {
      return stripped;
    }
  }

  return text;
}

function getDevflowRoot(repoRoot) {
  return path.join(repoRoot, 'devflow');
}

function getChangesRoot(repoRoot) {
  return path.join(getDevflowRoot(repoRoot), 'changes');
}

function listChangeKeys(repoRoot) {
  const changesRoot = getChangesRoot(repoRoot);
  if (!fs.existsSync(changesRoot)) {
    return [];
  }

  return fs.readdirSync(changesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function findExistingChangeKeys(repoRoot, changeId) {
  const canonicalPrefix = `${getChangeKeyPrefix(changeId)}-`;
  const legacyKey = slugifySegment(changeId, 'change');
  const legacyPrefix = `${legacyKey}-`;

  return listChangeKeys(repoRoot).filter((name) => (
    name === changeId
    || name === legacyKey
    || name.startsWith(canonicalPrefix)
    || name.startsWith(legacyPrefix)
  ));
}

function findExactChangeKey(repoRoot, changeId, changeKey) {
  const slug = getChangeSlug(changeId, changeKey);
  const aliases = new Set([
    changeKey,
    `${slugifySegment(changeId, 'change')}-${slug}`
  ]);

  return listChangeKeys(repoRoot).find((name) => aliases.has(name)) || null;
}

function assertChangeKey(changeId, changeKey) {
  const key = String(changeKey || '').trim();
  const prefix = `${getChangeKeyPrefix(changeId)}-`;
  if (!key.startsWith(prefix)) {
    throw new Error(`Invalid changeKey "${key}". Expected ${prefix}<description>.`);
  }

  return key;
}

function buildChangeKey(changeId, options = {}) {
  const rawSlug = options.slug || stripChangeIdPrefix(changeId, options.goal) || 'change';
  return `${getChangeKeyPrefix(changeId)}-${slugifySegment(rawSlug, 'change')}`;
}

function getChangeSlug(changeId, changeKey) {
  const canonicalPrefix = `${getChangeKeyPrefix(changeId)}-`;
  if (String(changeKey || '').startsWith(canonicalPrefix)) {
    return changeKey.slice(canonicalPrefix.length);
  }

  const legacyPrefix = `${slugifySegment(changeId, 'change')}-`;
  if (String(changeKey || '').startsWith(legacyPrefix)) {
    return changeKey.slice(legacyPrefix.length);
  }

  return String(changeKey || '').trim();
}

function resolveChangeKey(repoRoot, changeId, options = {}) {
  if (options.changeKey) {
    return assertChangeKey(changeId, options.changeKey);
  }

  const requestedSlug = options.slug || stripChangeIdPrefix(changeId, options.goal);
  if (requestedSlug) {
    const requestedKey = buildChangeKey(changeId, { slug: requestedSlug });
    return findExactChangeKey(repoRoot, changeId, requestedKey) || requestedKey;
  }

  const existing = findExistingChangeKeys(repoRoot, changeId);
  if (existing.length === 1) {
    return existing[0];
  }
  if (existing.length > 1) {
    throw new Error(
      `Ambiguous changeId "${changeId}": found ${existing.join(', ')}. Pass an explicit changeKey.`
    );
  }

  return buildChangeKey(changeId, options);
}

function nextChangeKey(repoRoot, prefix, description) {
  const upper = String(prefix || '').toUpperCase();
  if (upper !== 'REQ' && upper !== 'FIX') {
    throw new Error(`Invalid prefix "${prefix}". Use REQ or FIX.`);
  }

  const numberPattern = new RegExp(`^${upper}-(\\d+)`);
  let maxNum = 0;
  let padWidth = 3;

  for (const name of listChangeKeys(repoRoot)) {
    const match = name.match(numberPattern);
    if (match) {
      const numStr = match[1];
      const num = parseInt(numStr, 10);
      if (num > maxNum) maxNum = num;
      if (numStr.length > padWidth) padWidth = numStr.length;
    }
  }

  const paddedNum = String(maxNum + 1).padStart(padWidth, '0');
  const changeId = `${upper}-${paddedNum}`;
  const slug = slugifySegment(
    stripChangeIdPrefix(changeId, description) || description,
    'change'
  );
  const changeKey = `${changeId}-${slug}`;

  return { changeId, changeKey };
}

function getChangePaths(repoRoot, changeId, options = {}) {
  const changeKey = resolveChangeKey(repoRoot, changeId, options);
  const changeDir = path.join(getChangesRoot(repoRoot), changeKey);
  const handoffDir = path.join(changeDir, 'handoff');

  return {
    changeId,
    changeKey,
    changeDir,
    handoffDir,
    taskPath: path.join(changeDir, 'task.md'),
    prBriefPath: path.join(handoffDir, 'pr-brief.md')
  };
}

module.exports = {
  CHANGE_ID_PATTERN,
  slugifySegment,
  getChangeKeyPrefix,
  getChangeSlug,
  getDevflowRoot,
  getChangesRoot,
  nextChangeKey,
  resolveChangeKey,
  buildChangeKey,
  getChangePaths,
  assertChangeId
};
