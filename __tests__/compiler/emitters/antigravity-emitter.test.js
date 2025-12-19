/**
 * T017: AntigravityEmitter Tests
 * Tests for Antigravity platform output format
 * Expected: All tests FAIL (antigravity-emitter not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml');

// ============================================================
// Emitter imports - will fail until lib/compiler/emitters/antigravity-emitter.js exists
// ============================================================
let AntigravityEmitter;
try {
  AntigravityEmitter = require('../../../lib/compiler/emitters/antigravity-emitter.js');
} catch (e) {
  AntigravityEmitter = null;
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

describe('AntigravityEmitter', () => {
  beforeEach(() => {
    if (!AntigravityEmitter) {
      throw new Error('antigravity-emitter.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // AC4: Output to .agent/workflows/{filename}.md
  // ----------------------------------------------------------
  describe('AC4: Output directory and filename', () => {
    it('should have name "antigravity"', () => {
      const emitter = new AntigravityEmitter();
      expect(emitter.name).toBe('antigravity');
    });

    it('should output to .agent/workflows directory', () => {
      const emitter = new AntigravityEmitter();
      expect(emitter.outputDir).toBe('.agent/workflows');
    });

    it('should use .md extension', () => {
      const emitter = new AntigravityEmitter();
      expect(emitter.fileExtension).toBe('.md');
    });
  });

  // ----------------------------------------------------------
  // YAML frontmatter Tests
  // ----------------------------------------------------------
  describe('YAML frontmatter', () => {
    it('should include description in frontmatter', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Content');

      const match = output.match(/^---\n([\s\S]*?)\n---/);
      expect(match).not.toBeNull();

      const frontmatter = yaml.load(match[1]);
      expect(frontmatter.description).toBeDefined();
    });

    it('should truncate description to max 250 chars', () => {
      const emitter = new AntigravityEmitter();
      const longDesc = 'A'.repeat(300);
      const ir = createTestIR({
        frontmatter: {
          name: 'test',
          description: longDesc
        }
      });
      const output = emitter.format(ir, '# Content');

      const match = output.match(/^---\n([\s\S]*?)\n---/);
      const frontmatter = yaml.load(match[1]);
      expect(frontmatter.description.length).toBeLessThanOrEqual(250);
    });
  });

  // ----------------------------------------------------------
  // AC5: Content >12K split into multiple files
  // ----------------------------------------------------------
  describe('AC5: 12K content limit', () => {
    it('should have CONTENT_LIMIT constant of 12000', () => {
      const emitter = new AntigravityEmitter();
      expect(AntigravityEmitter.CONTENT_LIMIT || emitter.contentLimit).toBe(12000);
    });

    it('should return single string for content under 12K', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const shortContent = '# Short Content\n\n' + 'x'.repeat(1000);
      const output = emitter.format(ir, shortContent);

      expect(typeof output).toBe('string');
    });

    it('should return array for content over 12K', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const longContent = '# Long Content\n\n' + 'x'.repeat(15000);
      const output = emitter.format(ir, longContent);

      // Should return array of { filename, content } objects
      expect(Array.isArray(output)).toBe(true);
      expect(output.length).toBeGreaterThan(1);
    });

    it('should split with proper naming convention', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR({
        frontmatter: { name: 'flow-prd', description: 'Test' }
      });
      const longContent = '# Section 1\n\n' + 'x'.repeat(8000) + '\n\n# Section 2\n\n' + 'y'.repeat(8000);
      const output = emitter.format(ir, longContent);

      if (Array.isArray(output)) {
        // 拆分文件使用 -partN 命名
        expect(output[0].filename).toMatch(/flow-prd(-part1)?/);
        expect(output[1].filename).toMatch(/flow-prd-part\d/);
      }
    });

    it('should include part number in description for split files', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR({
        frontmatter: { name: 'flow-prd', description: 'Test description' }
      });
      const longContent = '# Section 1\n\n' + 'x'.repeat(8000) + '\n\n# Section 2\n\n' + 'y'.repeat(8000);
      const output = emitter.format(ir, longContent);

      if (Array.isArray(output) && output.length > 1) {
        // 第二个及以后的文件应该在 description 中包含 part 信息
        const match = output[1].content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = yaml.load(match[1]);
        expect(frontmatter.description).toMatch(/Part \d+\/\d+/);
      }
    });
  });

  // ----------------------------------------------------------
  // splitContent() Tests
  // ----------------------------------------------------------
  describe('splitContent()', () => {
    it('should split by sections when possible', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();

      // Create content with clear section breaks
      const section1 = '# Section 1\n\n' + 'Content 1\n'.repeat(500);
      const section2 = '# Section 2\n\n' + 'Content 2\n'.repeat(500);
      const section3 = '# Section 3\n\n' + 'Content 3\n'.repeat(500);
      const longContent = section1 + section2 + section3;

      const result = emitter.splitContent(ir, longContent);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(part => {
        expect(part.content.length).toBeLessThanOrEqual(12000);
      });
    });

    it('should ensure each part has YAML frontmatter', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const longContent = 'x'.repeat(15000);

      const result = emitter.splitContent(ir, longContent);

      result.forEach(part => {
        expect(part.content.startsWith('---\n')).toBe(true);
      });
    });
  });

  // ----------------------------------------------------------
  // format() Tests
  // ----------------------------------------------------------
  describe('format()', () => {
    it('should produce valid Markdown + YAML structure', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Test Content');

      expect(output.startsWith('---\n')).toBe(true);
      expect(output).toContain('\n---\n\n');
      expect(output).toContain('# Test Content');
    });

    it('should preserve body content after frontmatter', () => {
      const emitter = new AntigravityEmitter();
      const ir = createTestIR();
      const output = emitter.format(ir, '# Header\n\nParagraph with [arguments]');

      expect(output).toContain('# Header');
      expect(output).toContain('[arguments]');
    });
  });

  // ----------------------------------------------------------
  // Integration: emit() Tests
  // ----------------------------------------------------------
  describe('emit() integration', () => {
    it('should write Antigravity format to file', async () => {
      const tmpDir = path.join(os.tmpdir(), `antigravity-test-${Date.now()}`);
      const emitter = new AntigravityEmitter();
      Object.defineProperty(emitter, 'outputDir', { value: tmpDir });

      try {
        const ir = createTestIR();
        const formatted = emitter.format(ir, '# Content');
        const result = await emitter.emit('flow-prd', formatted);
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
