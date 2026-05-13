#!/usr/bin/env node

/**
 * [INPUT]: 接收 repo root，读取 .claude/skills 下每个 SKILL.md。
 * [OUTPUT]: 输出每个 skill 入口的 token/byte/line 预算检查结果；超预算时 exit 1。
 * [POS]: skill 入口瘦身基准，防止 Harness 规则重新膨胀成默认上下文负担。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_LIMIT = {
  maxBytes: 35000,
  maxLines: 700
};

const SKILL_LIMITS = {
  'cc-plan': {
    maxBytes: 16000,
    maxLines: 360
  },
  'cc-investigate': {
    maxBytes: 16000,
    maxLines: 360
  }
};

function estimateTokens(text) {
  return Math.ceil(String(text || '').length / 4);
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function listSkillFiles(rootDir) {
  const skillsDir = path.join(rootDir, '.claude', 'skills');
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((skillName) => ({
      skillName,
      filePath: path.join(skillsDir, skillName, 'SKILL.md')
    }))
    .filter((entry) => fs.existsSync(entry.filePath));
}

function lineCount(text) {
  if (!text) {
    return 0;
  }
  return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
}

function benchmarkRows(rootDir) {
  return listSkillFiles(rootDir).map(({ skillName, filePath }) => {
    const text = readText(filePath);
    const limit = SKILL_LIMITS[skillName] || DEFAULT_LIMIT;
    const bytes = Buffer.byteLength(text, 'utf8');
    const lines = lineCount(text);
    const tokens = estimateTokens(text);
    const bytesPass = bytes <= limit.maxBytes;
    const linesPass = lines <= limit.maxLines;

    return {
      skill: skillName,
      relative_path: path.relative(rootDir, filePath),
      estimated_tokens: tokens,
      bytes,
      max_bytes: limit.maxBytes,
      lines,
      max_lines: limit.maxLines,
      correctness_pass: bytesPass && linesPass,
      note: bytesPass && linesPass ? '' : 'skill entrypoint exceeds context budget'
    };
  });
}

function runBenchmarkSkills(rootDir = process.cwd()) {
  const rows = benchmarkRows(path.resolve(rootDir));
  return {
    code: rows.some((row) => row.correctness_pass === false) ? 1 : 0,
    rows
  };
}

function main(argv = process.argv.slice(2)) {
  const rootDir = argv[0] || process.cwd();
  const result = runBenchmarkSkills(rootDir);
  process.stdout.write(`${JSON.stringify(result.rows, null, 2)}\n`);
  process.exit(result.code);
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_LIMIT,
  SKILL_LIMITS,
  estimateTokens,
  runBenchmarkSkills
};
