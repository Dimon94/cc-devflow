/**
 * T013: BaseEmitter Tests
 * Tests for base emitter interface
 * Expected: All tests FAIL (base-emitter not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// Emitter imports - will fail until lib/compiler/emitters/base-emitter.js exists
// ============================================================
let BaseEmitter;
try {
  BaseEmitter = require('../../../lib/compiler/emitters/base-emitter.js');
} catch (e) {
  BaseEmitter = null;
}

describe('BaseEmitter', () => {
  beforeEach(() => {
    if (!BaseEmitter) {
      throw new Error('base-emitter.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // Interface Tests
  // ----------------------------------------------------------
  describe('Interface', () => {
    it('should throw "Not implemented" for name getter', () => {
      const emitter = new BaseEmitter();
      expect(() => emitter.name).toThrow('Not implemented');
    });

    it('should throw "Not implemented" for outputDir getter', () => {
      const emitter = new BaseEmitter();
      expect(() => emitter.outputDir).toThrow('Not implemented');
    });

    it('should throw "Not implemented" for fileExtension getter', () => {
      const emitter = new BaseEmitter();
      expect(() => emitter.fileExtension).toThrow('Not implemented');
    });

    it('should throw "Not implemented" for format method', () => {
      const emitter = new BaseEmitter();
      expect(() => emitter.format({}, 'content')).toThrow('Not implemented');
    });
  });

  // ----------------------------------------------------------
  // emit() Tests
  // ----------------------------------------------------------
  describe('emit()', () => {
    // Create a concrete implementation for testing emit()
    class TestEmitter extends BaseEmitter {
      get name() { return 'test'; }
      get outputDir() { return this._outputDir; }
      get fileExtension() { return '.md'; }
      format(ir, content) { return content; }

      constructor(outputDir) {
        super();
        this._outputDir = outputDir;
      }
    }

    it('should write file to correct path', async () => {
      const tmpDir = path.join(os.tmpdir(), `emit-test-${Date.now()}`);
      const emitter = new TestEmitter(tmpDir);

      try {
        const result = await emitter.emit('test-file', 'Test content');
        expect(result.path).toBe(path.join(tmpDir, 'test-file.md'));
        expect(fs.existsSync(result.path)).toBe(true);
        expect(fs.readFileSync(result.path, 'utf8')).toBe('Test content');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should create output directory if not exists', async () => {
      const tmpDir = path.join(os.tmpdir(), `emit-test-${Date.now()}`, 'nested', 'dir');
      const emitter = new TestEmitter(tmpDir);

      try {
        await emitter.emit('test-file', 'Content');
        expect(fs.existsSync(tmpDir)).toBe(true);
      } finally {
        fs.rmSync(path.join(os.tmpdir(), `emit-test-${Date.now()}`), { recursive: true, force: true });
      }
    });

    it('should return EmitResult with path, hash, timestamp', async () => {
      const tmpDir = path.join(os.tmpdir(), `emit-test-${Date.now()}`);
      const emitter = new TestEmitter(tmpDir);

      try {
        const result = await emitter.emit('test-file', 'Content');
        expect(result).toHaveProperty('path');
        expect(result).toHaveProperty('hash');
        expect(result).toHaveProperty('timestamp');
        expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should overwrite existing file', async () => {
      const tmpDir = path.join(os.tmpdir(), `emit-test-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });
      const emitter = new TestEmitter(tmpDir);
      const filePath = path.join(tmpDir, 'test-file.md');
      fs.writeFileSync(filePath, 'Old content');

      try {
        await emitter.emit('test-file', 'New content');
        expect(fs.readFileSync(filePath, 'utf8')).toBe('New content');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
