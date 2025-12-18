/**
 * T021: Integration Tests
 * End-to-end tests for the full compilation pipeline
 * Expected: All tests FAIL (modules not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');
const toml = require('@iarna/toml');

// ============================================================
// Module imports - will fail until all modules exist
// ============================================================
let parser, transformer, manifest, compiler;
let CodexEmitter, CursorEmitter, QwenEmitter, AntigravityEmitter;

try {
  parser = require('../../lib/compiler/parser.js');
  transformer = require('../../lib/compiler/transformer.js');
  manifest = require('../../lib/compiler/manifest.js');
  compiler = require('../../lib/compiler/index.js');
  CodexEmitter = require('../../lib/compiler/emitters/codex-emitter.js');
  CursorEmitter = require('../../lib/compiler/emitters/cursor-emitter.js');
  QwenEmitter = require('../../lib/compiler/emitters/qwen-emitter.js');
  AntigravityEmitter = require('../../lib/compiler/emitters/antigravity-emitter.js');
} catch (e) {
  // Modules not yet implemented
}

describe('Integration Tests', () => {
  let tmpDir;

  beforeEach(() => {
    if (!parser || !transformer || !compiler) {
      throw new Error('Compiler modules not implemented');
    }
    tmpDir = path.join(os.tmpdir(), `integration-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Helper to create a test command file
  const createCommandFile = (filename, content) => {
    const commandsDir = path.join(tmpDir, 'commands');
    fs.mkdirSync(commandsDir, { recursive: true });
    const filePath = path.join(commandsDir, filename);
    fs.writeFileSync(filePath, content);
    return filePath;
  };

  // ----------------------------------------------------------
  // Full Pipeline: parse -> transform -> emit
  // ----------------------------------------------------------
  describe('Full pipeline: parse -> transform -> emit', () => {
    const testCommand = `---
name: test-command
description: Test command for integration testing
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
---
# Test Command

## User Input
$ARGUMENTS = "REQ_ID?"

## Execution Flow
1. Run {SCRIPT:prereq}
2. Process the result
`;

    it('should complete full pipeline for Codex', async () => {
      const filePath = createCommandFile('test-command.md', testCommand);

      // Parse
      const ir = parser.parseCommand(filePath);
      expect(ir.frontmatter.name).toBe('test-command');

      // Transform
      const transformed = transformer.transformForPlatform(ir, 'codex');
      expect(transformed.body).toContain('bash .claude/scripts/check-prerequisites.sh');
      expect(transformed.body).toContain('$ARGUMENTS'); // unchanged for codex

      // Emit
      const emitter = new CodexEmitter();
      const outputDir = path.join(tmpDir, '.codex', 'prompts');
      Object.defineProperty(emitter, 'outputDir', { value: outputDir });

      const formatted = emitter.format(ir, transformed.body);
      const result = await emitter.emit('test-command', formatted);

      expect(fs.existsSync(result.path)).toBe(true);
      const output = fs.readFileSync(result.path, 'utf8');
      expect(output).toContain('---');
      expect(output).toContain('description: Test command');
    });

    it('should complete full pipeline for Cursor', async () => {
      const filePath = createCommandFile('test-command.md', testCommand);

      const ir = parser.parseCommand(filePath);
      const transformed = transformer.transformForPlatform(ir, 'cursor');

      const emitter = new CursorEmitter();
      const outputDir = path.join(tmpDir, '.cursor', 'commands');
      Object.defineProperty(emitter, 'outputDir', { value: outputDir });

      const formatted = emitter.format(ir, transformed.body);
      const result = await emitter.emit('test-command', formatted);

      expect(fs.existsSync(result.path)).toBe(true);
      const output = fs.readFileSync(result.path, 'utf8');
      expect(output.startsWith('---')).toBe(false); // no frontmatter
      expect(output).toContain('# Test Command');
    });

    it('should complete full pipeline for Qwen', async () => {
      const filePath = createCommandFile('test-command.md', testCommand);

      const ir = parser.parseCommand(filePath);
      const transformed = transformer.transformForPlatform(ir, 'qwen');

      expect(transformed.body).toContain('{{args}}'); // Qwen syntax

      const emitter = new QwenEmitter();
      const outputDir = path.join(tmpDir, '.qwen', 'commands');
      Object.defineProperty(emitter, 'outputDir', { value: outputDir });

      const formatted = emitter.format(ir, transformed.body);
      const result = await emitter.emit('test-command', formatted);

      expect(fs.existsSync(result.path)).toBe(true);
      expect(result.path.endsWith('.toml')).toBe(true);

      const output = fs.readFileSync(result.path, 'utf8');
      const parsed = toml.parse(output);
      expect(parsed.description).toBe('Test command for integration testing');
      expect(parsed.prompt).toContain('{{args}}');
    });

    it('should complete full pipeline for Antigravity', async () => {
      const filePath = createCommandFile('test-command.md', testCommand);

      const ir = parser.parseCommand(filePath);
      const transformed = transformer.transformForPlatform(ir, 'antigravity');

      expect(transformed.body).toContain('[arguments]'); // Antigravity syntax

      const emitter = new AntigravityEmitter();
      const outputDir = path.join(tmpDir, '.agent', 'workflows');
      Object.defineProperty(emitter, 'outputDir', { value: outputDir });

      const formatted = emitter.format(ir, transformed.body);
      const result = await emitter.emit('test-command', formatted);

      expect(fs.existsSync(result.path)).toBe(true);
      const output = fs.readFileSync(result.path, 'utf8');
      expect(output).toContain('---');
      expect(output).toContain('[arguments]');
    });
  });

  // ----------------------------------------------------------
  // Test command file processing
  // ----------------------------------------------------------
  describe('Test command file processing', () => {
    it('should parse test command file', async () => {
      // 使用临时测试文件，避免依赖真实代码库文件状态
      const testFile = path.join(tmpDir, 'test-prd.md');
      fs.writeFileSync(testFile, `---
name: flow-prd
description: Generate PRD document
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
---
# Flow PRD

Run {SCRIPT:prereq}`);

      const ir = parser.parseCommand(testFile);
      expect(ir.frontmatter.name).toBe('flow-prd');
      expect(ir.frontmatter.description).toBeDefined();
    });

    it('should compile test commands directory', async () => {
      // 使用临时测试目录，避免依赖真实代码库文件状态
      const testDir = path.join(tmpDir, 'test-commands');
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(path.join(testDir, 'cmd1.md'), `---
name: cmd1
description: Test command 1
---
# Command 1`);
      fs.writeFileSync(path.join(testDir, 'cmd2.md'), `---
name: cmd2
description: Test command 2
---
# Command 2`);

      const irs = await parser.parseAllCommands(testDir);
      expect(irs.length).toBe(2);

      // Verify each IR has required structure
      irs.forEach(ir => {
        expect(ir.source).toBeDefined();
        expect(ir.frontmatter.name).toBeDefined();
        expect(ir.frontmatter.description).toBeDefined();
        expect(ir.body).toBeDefined();
        expect(ir.placeholders).toBeDefined();
      });
    });
  });

  // ----------------------------------------------------------
  // Compiler orchestration Tests
  // ----------------------------------------------------------
  describe('Compiler orchestration', () => {
    it('should compile to all platforms with compile()', async () => {
      // Create test commands directory
      const commandsDir = path.join(tmpDir, '.claude', 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      fs.writeFileSync(path.join(commandsDir, 'test.md'), `---
name: test
description: Test
---
# Test`);

      const result = await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });

      expect(result.success).toBe(true);
      expect(result.platforms).toHaveLength(4);
    });

    it('should generate manifest after compilation', async () => {
      const commandsDir = path.join(tmpDir, '.claude', 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      fs.writeFileSync(path.join(commandsDir, 'manifest-test.md'), `---
name: manifest-test
description: Test manifest
---
# Test`);

      await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });

      const manifestPath = path.join(tmpDir, 'devflow', '.generated', 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);

      const loadedManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(loadedManifest.version).toBe('1.0.0');
      expect(loadedManifest.entries.length).toBeGreaterThan(0);
    });
  });

  // ----------------------------------------------------------
  // Error handling integration Tests
  // ----------------------------------------------------------
  describe('Error handling', () => {
    it('should propagate parser errors', () => {
      const filePath = createCommandFile('no-frontmatter.md', '# No frontmatter');

      expect(() => parser.parseCommand(filePath)).toThrow();
    });

    it('should propagate transformer errors for unknown alias', () => {
      const filePath = createCommandFile('bad-alias.md', `---
name: bad
description: Bad
---
Run {SCRIPT:nonexistent}`);

      expect(() => parser.parseCommand(filePath)).toThrow('Unknown');
    });
  });

  // ----------------------------------------------------------
  // Incremental compilation integration Tests
  // ----------------------------------------------------------
  describe('Incremental compilation', () => {
    it('should skip unchanged files on second compile', async () => {
      const commandsDir = path.join(tmpDir, '.claude', 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      fs.writeFileSync(path.join(commandsDir, 'incremental.md'), `---
name: incremental
description: Incremental test
---
# Test`);

      // First compile
      const result1 = await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });
      expect(result1.filesCompiled).toBe(1);

      // Second compile (no changes)
      const result2 = await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });
      expect(result2.filesCompiled).toBe(0);
      // 1 file × 4 platforms = 4 skipped
      expect(result2.filesSkipped).toBe(4);
    });

    it('should recompile changed files', async () => {
      const commandsDir = path.join(tmpDir, '.claude', 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      const filePath = path.join(commandsDir, 'changed.md');
      fs.writeFileSync(filePath, `---
name: changed
description: Original
---
# Original`);

      // First compile
      await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });

      // Modify file
      fs.writeFileSync(filePath, `---
name: changed
description: Modified
---
# Modified`);

      // Second compile (file changed)
      const result = await compiler.compile({
        sourceDir: commandsDir,
        outputBaseDir: tmpDir
      });
      expect(result.filesCompiled).toBe(1);
    });
  });
});
