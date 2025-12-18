/**
 * T014: CodexEmitter Tests
 * Tests for Codex platform output format
 * Expected: All tests FAIL (codex-emitter not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');

// ============================================================
// Emitter imports - will fail until lib/compiler/emitters/codex-emitter.js exists
// ============================================================
let CodexEmitter;
try {
  CodexEmitter = require('../../../lib/compiler/emitters/codex-emitter.js');
} catch (e) {
  CodexEmitter = null;
}

// Sample IR for testing
const createTestIR = (overrides = {}) => ({
  source: {
    path: '/test/flow-prd.md',
    filename: 'flow-prd',
    hash: 'sha256:abc123'
  },
  frontmatter: {
    name: 'flow-prd',
    description: 'Generate Product Requirements Document',
    scripts: {
      prereq: '.claude/scripts/check-prerequisites.sh'
    },
    ...overrides.frontmatter
  },
  body: overrides.body || '# Flow PRD\n\nContent here',
  placeholders: overrides.placeholders || []
});

describe('CodexEmitter', () => {
  beforeEach(() => {
    if (!CodexEmitter) {
      throw new Error('codex-emitter.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // AC1: Output to .codex/prompts/{filename}.md
  // ----------------------------------------------------------
  describe('AC1: Output directory and filename', () => {
    it('should have name "codex"', () => {
      const emitter = new CodexEmitter();
      expect(emitter.name).toBe('codex');
    });

    it('should output to .codex/prompts directory', () => {
      const emitter = new CodexEmitter();
      expect(emitter.outputDir).toBe('.codex/prompts');
    });

    it('should use .md extension', () => {
      const emitter = new CodexEmitter();
      expect(emitter.fileExtension).toBe('.md');
    });
  });

  // ----------------------------------------------------------
  // YAML frontmatter Tests
  // ----------------------------------------------------------
  describe('YAML frontmatter', () => {
    it('should include description in frontmatter', () => {
      const emitter = new CodexEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Content');

      // Parse YAML frontmatter
      const match = output.match(/^---\n([\s\S]*?)\n---/);
      expect(match).not.toBeNull();

      const frontmatter = yaml.load(match[1]);
      expect(frontmatter.description).toBe('Generate Product Requirements Document');
    });

    it('should include argument-hint with script aliases', () => {
      const emitter = new CodexEmitter();
      const ir = createTestIR({
        frontmatter: {
          name: 'test',
          description: 'Test',
          scripts: {
            prereq: 'path/prereq.sh',
            validate: 'path/validate.sh'
          }
        }
      });
      const output = emitter.format(ir, '# Content');

      const match = output.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = yaml.load(match[1]);
      expect(frontmatter['argument-hint']).toBeDefined();
      expect(frontmatter['argument-hint']).toContain('prereq');
      expect(frontmatter['argument-hint']).toContain('validate');
    });

    it('should handle missing scripts gracefully', () => {
      const emitter = new CodexEmitter();
      const ir = createTestIR({
        frontmatter: {
          name: 'simple',
          description: 'Simple command'
        }
      });
      const output = emitter.format(ir, '# Content');

      const match = output.match(/^---\n([\s\S]*?)\n---/);
      expect(match).not.toBeNull();
      const frontmatter = yaml.load(match[1]);
      expect(frontmatter.description).toBe('Simple command');
    });
  });

  // ----------------------------------------------------------
  // format() Tests
  // ----------------------------------------------------------
  describe('format()', () => {
    it('should produce valid Markdown + YAML structure', () => {
      const emitter = new CodexEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Test Content\n\nBody text');

      // Should start with ---
      expect(output.startsWith('---\n')).toBe(true);

      // Should have closing ---
      expect(output).toContain('\n---\n\n');

      // Should include body content after frontmatter
      expect(output).toContain('# Test Content');
      expect(output).toContain('Body text');
    });

    it('should preserve transformed content in output', () => {
      const emitter = new CodexEmitter();
      const ir = createTestIR();
      const transformedContent = '# Transformed\n\nWith expanded placeholders';
      const output = emitter.format(ir, transformedContent);

      expect(output).toContain('# Transformed');
      expect(output).toContain('With expanded placeholders');
    });
  });

  // ----------------------------------------------------------
  // Integration: emit() Tests
  // ----------------------------------------------------------
  describe('emit() integration', () => {
    it('should write Codex format to file', async () => {
      const tmpDir = path.join(os.tmpdir(), `codex-test-${Date.now()}`);
      const emitter = new CodexEmitter();
      // Override outputDir for testing
      Object.defineProperty(emitter, 'outputDir', { value: tmpDir });

      try {
        const result = await emitter.emit('flow-prd', '---\ndescription: Test\n---\n\n# Content');
        expect(fs.existsSync(result.path)).toBe(true);

        const content = fs.readFileSync(result.path, 'utf8');
        expect(content).toContain('---');
        expect(content).toContain('description');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
