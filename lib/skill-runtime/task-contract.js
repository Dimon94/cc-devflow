/**
 * [INPUT]: 接收 tasks.md 原始 Markdown 字符串；无文件 IO、无全局状态。
 * [OUTPUT]: 对外暴露 extractTasksContractSummary / extractTasksRootCauseContract → {found, content, fields}。
 * [POS]: REQ-003 task-contract 纯函数层；后续 compile / validate / migrate 复用本文件的解析 engine。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

// ============================================================================
//  Section field schema
// ============================================================================

const CONTRACT_FIELD_MAP = {
  'Change': 'change',
  'Mode': 'mode',
  'Profile': 'profile',
  'Approval': 'approval',
  'Goal': 'goal',
  'Do Not Do': 'doNotDo',
  'Approved Direction': 'approvedDirection',
  'Acceptance': 'acceptance',
  'Verification': 'verification',
  'Risk / Escalate If': 'risk'
};

const CONTRACT_SINGLE_LINE = new Set(['change', 'mode', 'profile', 'approval']);
const CONTRACT_LIST = new Set(['goal', 'doNotDo', 'approvedDirection', 'acceptance', 'risk']);
const CONTRACT_VERIFICATION = new Set(['verification']);

const ROOT_CAUSE_FIELD_MAP = {
  'Change': 'change',
  'Mode': 'mode',
  'Profile': 'profile',
  'Diagnosis': 'diagnosis',
  'Symptom': 'symptom',
  'Reproduction': 'reproduction',
  'Expected': 'expected',
  'Actual': 'actual',
  'Root Cause': 'rootCause',
  'Evidence Chain': 'evidenceChain',
  'Repair Boundary': 'repairBoundary',
  'Verification': 'verification',
  'Prevention': 'prevention',
  'Risk / Escalate If': 'risk'
};

const ROOT_CAUSE_SINGLE_LINE = new Set(['change', 'mode', 'profile', 'diagnosis']);
const ROOT_CAUSE_LIST = new Set([
  'symptom',
  'reproduction',
  'expected',
  'actual',
  'rootCause',
  'evidenceChain',
  'repairBoundary',
  'prevention',
  'risk'
]);
const ROOT_CAUSE_VERIFICATION = new Set(['verification']);

// ============================================================================
//  Heading block extraction (shared engine)
// ============================================================================

function extractHeadingBlock(text, heading) {
  if (typeof text !== 'string') {
    throw new TypeError('task-contract parser expects a string input');
  }
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\n)(${escaped}\\r?\\n?)`);
  const match = text.match(pattern);
  if (!match) {
    return { found: false, content: '', body: '' };
  }
  const headingStart = match.index + match[1].length;
  const headingLineEnd = headingStart + match[2].length;
  const rest = text.slice(headingLineEnd);
  const nextIdx = rest.search(/\n## /);
  const blockEnd = nextIdx === -1 ? text.length : headingLineEnd + nextIdx;
  return {
    found: true,
    content: text.slice(headingStart, blockEnd),
    body: text.slice(headingLineEnd, blockEnd)
  };
}

// ============================================================================
//  Generic section parser
// ============================================================================

function parseSectionFields(body, schema) {
  const { fieldMap, singleLineKeys, listKeys, verificationKeys } = schema;
  const lines = body.split('\n');
  const fields = {};
  let currentLabel = null;
  let currentInline = null;
  let currentLines = [];

  const flush = () => {
    if (!currentLabel) return;
    const key = fieldMap[currentLabel];
    if (key) {
      const value = finalizeFieldValue(key, currentInline, currentLines, singleLineKeys, listKeys, verificationKeys);
      if (value !== undefined) fields[key] = value;
    }
    currentLabel = null;
    currentInline = null;
    currentLines = [];
  };

  for (const line of lines) {
    const kv = line.match(/^([A-Z][A-Za-z /]+?):\s*(.*)$/);
    if (kv && Object.prototype.hasOwnProperty.call(fieldMap, kv[1])) {
      flush();
      currentLabel = kv[1];
      currentInline = kv[2].length > 0 ? kv[2].trim() : null;
    } else if (currentLabel) {
      currentLines.push(line);
    }
  }
  flush();
  return fields;
}

function finalizeFieldValue(key, inline, lines, singleLineKeys, listKeys, verificationKeys) {
  if (singleLineKeys.has(key)) {
    return inline !== null ? inline : undefined;
  }
  if (listKeys.has(key)) {
    const items = lines
      .map(line => line.match(/^\s*-\s+(.*)$/))
      .filter(Boolean)
      .map(match => match[1].trim());
    if (items.length > 0) return items;
    return inline !== null ? inline : undefined;
  }
  if (verificationKeys.has(key)) {
    const joined = lines.join('\n');
    const fenceMatch = joined.match(/```[^\n]*\n([\s\S]*?)```/);
    if (fenceMatch) return fenceMatch[1].replace(/^\n+|\n+$/g, '');
    const trimmed = joined.replace(/^\n+|\n+$/g, '');
    if (trimmed.length > 0) return trimmed;
    return inline !== null ? inline : undefined;
  }
  return undefined;
}

// ============================================================================
//  Public parsers
// ============================================================================

function extractTasksContractSummary(text) {
  const block = extractHeadingBlock(text, '## Contract Summary');
  if (!block.found) {
    return { found: false, content: '', fields: {} };
  }
  return {
    found: true,
    content: block.content,
    fields: parseSectionFields(block.body, {
      fieldMap: CONTRACT_FIELD_MAP,
      singleLineKeys: CONTRACT_SINGLE_LINE,
      listKeys: CONTRACT_LIST,
      verificationKeys: CONTRACT_VERIFICATION
    })
  };
}

function extractTasksRootCauseContract(text) {
  const block = extractHeadingBlock(text, '## Root Cause Contract');
  if (!block.found) {
    return { found: false, content: '', fields: {} };
  }
  return {
    found: true,
    content: block.content,
    fields: parseSectionFields(block.body, {
      fieldMap: ROOT_CAUSE_FIELD_MAP,
      singleLineKeys: ROOT_CAUSE_SINGLE_LINE,
      listKeys: ROOT_CAUSE_LIST,
      verificationKeys: ROOT_CAUSE_VERIFICATION
    })
  };
}

module.exports = {
  extractTasksContractSummary,
  extractTasksRootCauseContract
};
