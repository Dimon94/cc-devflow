/**
 * T015: CursorEmitter Tests
 * Tests for Cursor platform output format
 * Expected: All tests FAIL (cursor-emitter not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// Emitter imports - will fail until lib/compiler/emitters/cursor-emitter.js exists
// ============================================================
let CursorEmitter;
try {
  CursorEmitter = require('../../../lib/compiler/emitters/cursor-emitter.js');
} catch (e) {
  CursorEmitter = null;
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
    ...overrides.frontmatter
  },
  body: overrides.body || '# Flow PRD\n\nContent here',
  placeholders: overrides.placeholders || []
});

describe('CursorEmitter', () => {
  beforeEach(() => {
    if (!CursorEmitter) {
      throw new Error('cursor-emitter.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // AC2: Output to .cursor/commands/{filename}.md
  // ----------------------------------------------------------
  describe('AC2: Output directory and filename', () => {
    it('should have name "cursor"', () => {
      const emitter = new CursorEmitter();
      expect(emitter.name).toBe('cursor');
    });

    it('should output to .cursor/commands directory', () => {
      const emitter = new CursorEmitter();
      expect(emitter.outputDir).toBe('.cursor/commands');
    });

    it('should use .md extension', () => {
      const emitter = new CursorEmitter();
      expect(emitter.fileExtension).toBe('.md');
    });
  });

  // ----------------------------------------------------------
  // Pure Markdown format Tests
  // ----------------------------------------------------------
  describe('Pure Markdown format', () => {
    it('should NOT include YAML frontmatter', () => {
      const emitter = new CursorEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Content');

      // Should NOT start with ---
      expect(output.startsWith('---')).toBe(false);
    });

    it('should return body content directly', () => {
      const emitter = new CursorEmitter();
      const ir = createTestIR();
      const transformedContent = '# Test Command\n\nBody content here';
      const output = emitter.format(ir, transformedContent);

      expect(output).toBe(transformedContent);
    });
  });

  // ----------------------------------------------------------
  // format() Tests
  // ----------------------------------------------------------
  describe('format()', () => {
    it('should return transformed content unchanged', () => {
      const emitter = new CursorEmitter();
      const ir = createTestIR();
      const content = '# Header\n\n## Section\n\nContent';
      const output = emitter.format(ir, content);

      expect(output).toBe(content);
    });

    it('should handle empty content', () => {
      const emitter = new CursorEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '');

      expect(output).toBe('');
    });

    it('should preserve special characters', () => {
      const emitter = new CursorEmitter();
      const ir = createTestIR();
      const content = '```bash\necho "test"\n```\n\n{{args}} and [arguments]';
      const output = emitter.format(ir, content);

      expect(output).toBe(content);
    });
  });

  // ----------------------------------------------------------
  // Integration: emit() Tests
  // ----------------------------------------------------------
  describe('emit() integration', () => {
    it('should write pure Markdown to file', async () => {
      const tmpDir = path.join(os.tmpdir(), `cursor-test-${Date.now()}`);
      const emitter = new CursorEmitter();
      Object.defineProperty(emitter, 'outputDir', { value: tmpDir });

      try {
        const result = await emitter.emit('flow-prd', '# Pure Markdown\n\nNo frontmatter');
        expect(fs.existsSync(result.path)).toBe(true);

        const content = fs.readFileSync(result.path, 'utf8');
        expect(content.startsWith('# Pure Markdown')).toBe(true);
        expect(content).not.toContain('---\n');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
