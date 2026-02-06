/**
 * Multi-Module Emitters Test Suite
 *
 * [INPUT]: 测试 fixtures
 * [OUTPUT]: 测试结果
 * [POS]: 编译器测试套件，验证多模块编译功能
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 测试覆盖:
 * - context-expander.js
 * - 各平台 Emitter 的多模块方法
 * - compileMultiModule 集成测试
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const { ContextExpander } = require('../context-expander.js');
const CodexEmitter = require('../emitters/codex-emitter.js');
const CursorEmitter = require('../emitters/cursor-emitter.js');
const QwenEmitter = require('../emitters/qwen-emitter.js');
const AntigravityEmitter = require('../emitters/antigravity-emitter.js');
const { compileMultiModule, PLATFORMS, DEFAULT_MODULES } = require('../index.js');

// ============================================================
// Test Fixtures
// ============================================================
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'multi-module');

// 创建临时目录
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-test-'));
}

// 清理临时目录
function cleanupTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// 创建测试 fixtures
function setupFixtures(tempDir) {
  // 创建 skills 目录结构
  const skillsDir = path.join(tempDir, '.claude', 'skills', 'workflow', 'test-skill');
  fs.mkdirSync(skillsDir, { recursive: true });

  // 创建 SKILL.md
  fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), `---
name: test-skill
description: A test skill for unit testing
---

# Test Skill

This is a test skill.

## Usage

Use this skill for testing.
`);

  // 创建 context.jsonl
  fs.writeFileSync(path.join(skillsDir, 'context.jsonl'), `{"file": "devflow/requirements/REQ-001/PRD.md", "reason": "Product requirements"}
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions", "optional": true}
`);

  // 创建 agents 目录
  const agentsDir = path.join(tempDir, '.claude', 'agents');
  fs.mkdirSync(agentsDir, { recursive: true });

  fs.writeFileSync(path.join(agentsDir, 'test-agent.md'), `---
name: test-agent
description: A test agent
tools: Read, Write
---

# Test Agent

This agent is for testing.
`);

  // 创建 rules 目录
  const rulesDir = path.join(tempDir, '.claude', 'rules');
  fs.mkdirSync(rulesDir, { recursive: true });

  fs.writeFileSync(path.join(rulesDir, 'test-rule.md'), `---
description: A test rule
alwaysApply: true
---

# Test Rule

This rule is for testing.
`);

  // 创建 hooks 目录
  const hooksDir = path.join(tempDir, '.claude', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });

  fs.writeFileSync(path.join(hooksDir, 'preToolUse-test.ts'), `// Test hook
export default function preToolUseTest() {
  console.log('Hook triggered');
}
`);

  return tempDir;
}

// ============================================================
// ContextExpander Tests
// ============================================================
describe('ContextExpander', () => {
  describe('parseJsonl', () => {
    test('parses valid JSONL content', () => {
      const jsonl = `{"file": "a.md", "reason": "test"}
{"file": "b.md", "reason": "test2", "optional": true}`;

      const result = ContextExpander.parseJsonl(jsonl);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ file: 'a.md', reason: 'test', optional: false });
      expect(result[1]).toEqual({ file: 'b.md', reason: 'test2', optional: true });
    });

    test('handles empty content', () => {
      expect(ContextExpander.parseJsonl('')).toEqual([]);
      expect(ContextExpander.parseJsonl('   ')).toEqual([]);
    });

    test('skips invalid lines', () => {
      const jsonl = `{"file": "a.md", "reason": "test"}
invalid json
{"file": "b.md", "reason": "test2"}`;

      const result = ContextExpander.parseJsonl(jsonl);
      expect(result).toHaveLength(2);
    });
  });

  describe('expand', () => {
    const contexts = [
      { file: 'a.md', reason: 'test', optional: false },
      { file: 'b.md', reason: 'test2', optional: true }
    ];

    test('expands for Cursor with @file references', () => {
      const result = ContextExpander.expand(contexts, 'cursor');

      expect(result).toContain('@a.md');
      expect(result).toContain('@b.md (optional)');
      expect(result).toContain('## Context Files');
    });

    test('expands for Codex with Required Context section', () => {
      const result = ContextExpander.expand(contexts, 'codex');

      expect(result).toContain('## Required Context');
      expect(result).toContain('`a.md`');
      expect(result).toContain('`b.md`');
    });

    test('expands for Qwen with Required Context section', () => {
      const result = ContextExpander.expand(contexts, 'qwen');

      expect(result).toContain('## Required Context');
    });

    test('expands for Antigravity with Required Context section', () => {
      const result = ContextExpander.expand(contexts, 'antigravity');

      expect(result).toContain('## Required Context');
    });

    test('returns empty string for empty contexts', () => {
      expect(ContextExpander.expand([], 'cursor')).toBe('');
      expect(ContextExpander.expand(null, 'cursor')).toBe('');
    });
  });
});

// ============================================================
// CodexEmitter Multi-Module Tests
// ============================================================
describe('CodexEmitter Multi-Module', () => {
  let tempDir;
  let emitter;

  beforeEach(() => {
    tempDir = createTempDir();
    setupFixtures(tempDir);
    emitter = new CodexEmitter();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('emitSkills creates SKILL.md in target directory', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'skills');
    const targetDir = path.join(tempDir, '.codex', 'skills');

    const results = await emitter.emitSkills(sourceDir, targetDir);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].skillName).toBe('test-skill');

    const targetPath = path.join(targetDir, 'test-skill', 'SKILL.md');
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('name: test-skill');
    expect(content).toContain('## Required Context');
  });

  test('emitAgents merges to AGENTS.md', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'agents');
    const targetPath = path.join(tempDir, 'AGENTS.md');

    const results = await emitter.emitAgents(sourceDir, targetPath);

    expect(results.length).toBe(1);
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('# Agents');
    expect(content).toContain('## test-agent');
  });

  test('emitRules appends to AGENTS.md', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'rules');
    const targetPath = path.join(tempDir, 'AGENTS.md');

    // 先创建 AGENTS.md
    fs.writeFileSync(targetPath, '# Agents\n\nExisting content.\n');

    const results = await emitter.emitRules(sourceDir, targetPath);

    expect(results.length).toBe(1);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('# Agents');
    expect(content).toContain('## Rules');
    expect(content).toContain('### test-rule');
  });
});

// ============================================================
// CursorEmitter Multi-Module Tests
// ============================================================
describe('CursorEmitter Multi-Module', () => {
  let tempDir;
  let emitter;

  beforeEach(() => {
    tempDir = createTempDir();
    setupFixtures(tempDir);
    emitter = new CursorEmitter();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('emitSkills creates .mdc files in rules directory', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'skills');
    const targetDir = path.join(tempDir, '.cursor', 'rules');

    const results = await emitter.emitSkills(sourceDir, targetDir);

    expect(results.length).toBeGreaterThan(0);

    const targetPath = path.join(targetDir, 'test-skill.mdc');
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('description:');
    expect(content).toContain('globs:');
    expect(content).toContain('@devflow/requirements/REQ-001/PRD.md');
  });

  test('emitAgents creates subagent files', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'agents');
    const targetDir = path.join(tempDir, '.cursor', 'subagents');

    const results = await emitter.emitAgents(sourceDir, targetDir);

    expect(results.length).toBe(1);

    const targetPath = path.join(targetDir, 'test-agent.md');
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('name: test-agent');
    expect(content).toContain('description:');
  });

  test('emitRules creates .mdc files', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'rules');
    const targetDir = path.join(tempDir, '.cursor', 'rules');

    const results = await emitter.emitRules(sourceDir, targetDir);

    expect(results.length).toBe(1);

    const targetPath = path.join(targetDir, 'test-rule.mdc');
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('description:');
    expect(content).toContain('alwaysApply:');
  });

  test('emitHooks creates hooks.json and shell scripts', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'hooks');
    const targetDir = path.join(tempDir, '.cursor');

    const results = await emitter.emitHooks(sourceDir, targetDir);

    expect(results.length).toBeGreaterThan(0);

    const configPath = path.join(targetDir, 'hooks.json');
    expect(fs.existsSync(configPath)).toBe(true);

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    expect(config.version).toBe(1);
    expect(config.hooks).toBeDefined();
  });
});

// ============================================================
// QwenEmitter Multi-Module Tests
// ============================================================
describe('QwenEmitter Multi-Module', () => {
  let tempDir;
  let emitter;

  beforeEach(() => {
    tempDir = createTempDir();
    setupFixtures(tempDir);
    emitter = new QwenEmitter();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('emitSkills creates .toml files', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'skills');
    const targetDir = path.join(tempDir, '.qwen', 'commands');

    const results = await emitter.emitSkills(sourceDir, targetDir);

    expect(results.length).toBeGreaterThan(0);

    const targetPath = path.join(targetDir, 'test-skill.toml');
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('description =');
    expect(content).toContain('prompt =');
  });

  test('emitAgents creates agent files', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'agents');
    const targetDir = path.join(tempDir, '.qwen', 'agents');

    const results = await emitter.emitAgents(sourceDir, targetDir);

    expect(results.length).toBe(1);

    const targetPath = path.join(targetDir, 'test-agent.md');
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  test('emitRules creates CONTEXT.md', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'rules');
    const targetPath = path.join(tempDir, 'CONTEXT.md');

    const results = await emitter.emitRules(sourceDir, targetPath);

    expect(results.length).toBe(1);
    expect(fs.existsSync(targetPath)).toBe(true);

    const content = fs.readFileSync(targetPath, 'utf8');
    expect(content).toContain('# Project Context');
    expect(content).toContain('## test-rule');
  });
});

// ============================================================
// AntigravityEmitter Multi-Module Tests
// ============================================================
describe('AntigravityEmitter Multi-Module', () => {
  let tempDir;
  let emitter;

  beforeEach(() => {
    tempDir = createTempDir();
    setupFixtures(tempDir);
    emitter = new AntigravityEmitter();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('emitSkills creates SKILL.md in skills directory', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'skills');
    const targetDir = path.join(tempDir, '.agent', 'skills');

    const results = await emitter.emitSkills(sourceDir, targetDir);

    expect(results.length).toBeGreaterThan(0);

    const targetPath = path.join(targetDir, 'test-skill', 'SKILL.md');
    expect(fs.existsSync(targetPath)).toBe(true);
  });

  test('emitRules creates rule files', async () => {
    const sourceDir = path.join(tempDir, '.claude', 'rules');
    const targetDir = path.join(tempDir, '.agent', 'rules');

    const results = await emitter.emitRules(sourceDir, targetDir);

    expect(results.length).toBe(1);

    const targetPath = path.join(targetDir, 'test-rule.md');
    expect(fs.existsSync(targetPath)).toBe(true);
  });
});

// ============================================================
// compileMultiModule Integration Tests
// ============================================================
describe('compileMultiModule Integration', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
    setupFixtures(tempDir);

    // 创建 devflow/.generated 目录
    fs.mkdirSync(path.join(tempDir, 'devflow', '.generated'), { recursive: true });
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('compiles all modules for all platforms', async () => {
    const result = await compileMultiModule({
      sourceBaseDir: path.join(tempDir, '.claude'),
      outputBaseDir: tempDir,
      platforms: ['codex', 'cursor'],
      modules: ['skills', 'agents', 'rules'],
      verbose: false
    });

    expect(result.success).toBe(true);
    expect(result.skillsEmitted).toBeGreaterThan(0);
    expect(result.agentsEmitted).toBeGreaterThan(0);
    expect(result.rulesEmitted).toBeGreaterThan(0);
  });

  test('compiles only specified modules', async () => {
    const result = await compileMultiModule({
      sourceBaseDir: path.join(tempDir, '.claude'),
      outputBaseDir: tempDir,
      platforms: ['codex'],
      modules: ['skills'],
      verbose: false
    });

    expect(result.success).toBe(true);
    expect(result.skillsEmitted).toBeGreaterThan(0);
    expect(result.agentsEmitted).toBe(0);
    expect(result.rulesEmitted).toBe(0);
  });

  test('handles missing source directories gracefully', async () => {
    const emptyDir = createTempDir();

    try {
      const result = await compileMultiModule({
        sourceBaseDir: path.join(emptyDir, '.claude'),
        outputBaseDir: emptyDir,
        platforms: ['codex'],
        modules: ['skills', 'agents', 'rules'],
        verbose: false
      });

      expect(result.success).toBe(true);
      expect(result.skillsEmitted).toBe(0);
      expect(result.agentsEmitted).toBe(0);
      expect(result.rulesEmitted).toBe(0);
    } finally {
      cleanupTempDir(emptyDir);
    }
  });

  test('exports DEFAULT_MODULES', () => {
    expect(DEFAULT_MODULES).toContain('skills');
    expect(DEFAULT_MODULES).toContain('commands');
    expect(DEFAULT_MODULES).toContain('agents');
    expect(DEFAULT_MODULES).toContain('rules');
  });
});
