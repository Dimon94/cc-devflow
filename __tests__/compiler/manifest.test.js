/**
 * T018: Manifest Tests
 * Tests for manifest generation, incremental compilation, and drift detection
 * Expected: All tests FAIL (manifest not implemented)
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// Manifest imports - will fail until lib/compiler/manifest.js exists
// ============================================================
let manifest;
try {
  manifest = require('../../lib/compiler/manifest.js');
} catch (e) {
  manifest = null;
}

describe('Manifest Module', () => {
  let tmpDir;

  beforeEach(() => {
    if (!manifest) {
      throw new Error('manifest.js not implemented');
    }
    tmpDir = path.join(os.tmpdir(), `manifest-test-${Date.now()}`);
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ----------------------------------------------------------
  // AC1: manifest.json contains source, target, hash, timestamp, platform
  // ----------------------------------------------------------
  describe('AC1: Manifest entry fields', () => {
    it('should create manifest entry with all required fields', () => {
      const entry = manifest.createEntry({
        source: '.claude/commands/flow-prd.md',
        target: '.codex/prompts/flow-prd.md',
        sourceHash: 'sha256:abc123',
        targetHash: 'sha256:def456',
        platform: 'codex'
      });

      expect(entry).toHaveProperty('source');
      expect(entry).toHaveProperty('target');
      expect(entry).toHaveProperty('hash');
      expect(entry).toHaveProperty('timestamp');
      expect(entry).toHaveProperty('platform');
    });

    it('should set ISO 8601 timestamp', () => {
      const entry = manifest.createEntry({
        source: 'test.md',
        target: 'test-out.md',
        sourceHash: 'abc',
        targetHash: 'def',
        platform: 'codex'
      });

      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  // ----------------------------------------------------------
  // AC2: Skip unchanged files (hash match)
  // ----------------------------------------------------------
  describe('AC2: Skip unchanged files', () => {
    it('should return false for needsRecompile when hash matches', () => {
      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: '.codex/prompts/flow-prd.md',
          hash: 'abc123',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const result = manifest.needsRecompile(
        '.claude/commands/flow-prd.md',
        'abc123', // same hash
        existingManifest,
        'codex'   // same platform
      );

      expect(result).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // AC3: Recompile changed files (hash mismatch)
  // ----------------------------------------------------------
  describe('AC3: Recompile changed files', () => {
    it('should return true for needsRecompile when hash differs', () => {
      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: '.codex/prompts/flow-prd.md',
          hash: 'old-hash',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const result = manifest.needsRecompile(
        '.claude/commands/flow-prd.md',
        'new-hash', // different hash
        existingManifest,
        'codex'
      );

      expect(result).toBe(true);
    });

    it('should return true for new files not in manifest', () => {
      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: []
      };

      const result = manifest.needsRecompile(
        '.claude/commands/new-command.md',
        'any-hash',
        existingManifest,
        'codex'
      );

      expect(result).toBe(true);
    });

    it('should return true for same source different platform', () => {
      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: '.codex/prompts/flow-prd.md',
          hash: 'abc123',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      // Same source, same hash, but different platform
      const result = manifest.needsRecompile(
        '.claude/commands/flow-prd.md',
        'abc123',
        existingManifest,
        'cursor'  // different platform
      );

      expect(result).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // AC4: checkDrift() returns drifted files
  // ----------------------------------------------------------
  describe('AC4: Drift detection', () => {
    it('should detect drift when target file is modified', async () => {
      // Create a target file with different content
      const targetPath = path.join(tmpDir, 'flow-prd.md');
      fs.writeFileSync(targetPath, 'Modified content');

      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: targetPath,
          hash: 'original-hash',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const drift = await manifest.checkDrift(existingManifest);

      expect(drift.length).toBeGreaterThan(0);
      expect(drift[0].source).toContain('flow-prd');
      expect(drift[0].issue).toContain('modified');
    });

    it('should detect drift when target file is missing', async () => {
      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: '/nonexistent/path/flow-prd.md',
          hash: 'abc',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const drift = await manifest.checkDrift(existingManifest);

      expect(drift.length).toBeGreaterThan(0);
      expect(drift[0].issue).toContain('missing');
    });

    it('should return empty array when no drift', async () => {
      // Create target file with matching hash
      const targetPath = path.join(tmpDir, 'flow-prd.md');
      const content = 'Original content';
      fs.writeFileSync(targetPath, content);
      const hash = manifest.hashContent(content);

      const existingManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: '.claude/commands/flow-prd.md',
          target: targetPath,
          hash: hash,
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const drift = await manifest.checkDrift(existingManifest);

      expect(drift).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // hashContent() Tests
  // ----------------------------------------------------------
  describe('hashContent()', () => {
    it('should generate SHA-256 hash', () => {
      const hash = manifest.hashContent('test content');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent hash for same content', () => {
      const hash1 = manifest.hashContent('same content');
      const hash2 = manifest.hashContent('same content');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different content', () => {
      const hash1 = manifest.hashContent('content 1');
      const hash2 = manifest.hashContent('content 2');
      expect(hash1).not.toBe(hash2);
    });
  });

  // ----------------------------------------------------------
  // loadManifest() / saveManifest() Tests
  // ----------------------------------------------------------
  describe('loadManifest() / saveManifest()', () => {
    it('should return null for non-existent manifest', async () => {
      const result = await manifest.loadManifest(path.join(tmpDir, 'nonexistent.json'));
      expect(result).toBeNull();
    });

    it('should save and load manifest roundtrip', async () => {
      const manifestPath = path.join(tmpDir, 'manifest.json');
      const testManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: 'test.md',
          target: 'out.md',
          hash: 'abc',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      await manifest.saveManifest(testManifest, manifestPath);
      const loaded = await manifest.loadManifest(manifestPath);

      expect(loaded).toEqual(testManifest);
    });

    it('should create directory for manifest if not exists', async () => {
      const manifestPath = path.join(tmpDir, 'nested', 'dir', 'manifest.json');
      const testManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: []
      };

      await manifest.saveManifest(testManifest, manifestPath);
      expect(fs.existsSync(manifestPath)).toBe(true);
    });
  });

  // ----------------------------------------------------------
  // addEntry() Tests
  // ----------------------------------------------------------
  describe('addEntry()', () => {
    it('should add new entry to manifest', () => {
      const testManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: []
      };

      const entry = {
        source: 'new.md',
        target: 'out.md',
        hash: 'abc',
        timestamp: '2025-12-18T11:00:00Z',
        platform: 'codex'
      };

      manifest.addEntry(testManifest, entry);

      expect(testManifest.entries).toHaveLength(1);
      expect(testManifest.entries[0].source).toBe('new.md');
    });

    it('should update existing entry with same source', () => {
      const testManifest = {
        version: '1.0.0',
        generatedAt: '2025-12-18T10:00:00Z',
        entries: [{
          source: 'existing.md',
          target: 'out.md',
          hash: 'old-hash',
          timestamp: '2025-12-18T10:00:00Z',
          platform: 'codex'
        }]
      };

      const updatedEntry = {
        source: 'existing.md',
        target: 'out.md',
        hash: 'new-hash',
        timestamp: '2025-12-18T11:00:00Z',
        platform: 'codex'
      };

      manifest.addEntry(testManifest, updatedEntry);

      expect(testManifest.entries).toHaveLength(1);
      expect(testManifest.entries[0].hash).toBe('new-hash');
    });
  });

  // ----------------------------------------------------------
  // MANIFEST_PATH constant Tests
  // ----------------------------------------------------------
  describe('MANIFEST_PATH', () => {
    it('should be devflow/.generated/manifest.json', () => {
      expect(manifest.MANIFEST_PATH).toBe('devflow/.generated/manifest.json');
    });
  });
});
