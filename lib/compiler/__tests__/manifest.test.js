/**
 * T009: Manifest v2.0 Schema Tests
 *
 * 测试 Manifest v2.0:
 * 1. v2.0 schema 接受 skills 和 rulesEntry 字段
 * 2. v1.0 → v2.0 向后兼容迁移
 * 3. Hash 格式验证 (64 字符十六进制)
 * 4. Timestamp 格式验证 (ISO8601)
 *
 * Reference: data-model.md#ManifestV2
 */

const {
  MANIFEST_VERSION,
  createManifest,
  createEntry,
  migrateToV2,
  needsRecompile,
  addEntry,
  addSkillEntry,
  addRulesEntry,
  pruneCommandEntries,
  needsSkillRecompile,
  needsRulesRecompile,
  hashContent
} = require('../manifest');

describe('Manifest v2.0', () => {
  describe('createManifest()', () => {
    test('should create v2.0 manifest with skills and rulesEntry fields', () => {
      const manifest = createManifest();

      expect(manifest.version).toBe('2.0');
      expect(manifest).toHaveProperty('generatedAt');
      expect(manifest).toHaveProperty('entries');
      expect(manifest).toHaveProperty('skills');
      expect(manifest).toHaveProperty('rulesEntry');

      expect(Array.isArray(manifest.entries)).toBe(true);
      expect(Array.isArray(manifest.skills)).toBe(true);
      expect(typeof manifest.rulesEntry).toBe('object');
    });

    test('should generate valid ISO8601 timestamp', () => {
      const manifest = createManifest();

      // ISO8601 格式验证
      expect(() => new Date(manifest.generatedAt)).not.toThrow();
      expect(new Date(manifest.generatedAt).toISOString()).toBe(manifest.generatedAt);
    });
  });

  describe('migrateToV2()', () => {
    test('should migrate v1.0 manifest to v2.0', () => {
      const v1Manifest = {
        version: '1.0.0',
        generatedAt: '2025-01-01T00:00:00.000Z',
        entries: [
          { source: 'test.md', target: 'out/test.md', hash: 'abc', platform: 'codex' }
        ]
      };

      const v2Manifest = migrateToV2(v1Manifest);

      expect(v2Manifest.version).toBe('2.0');
      expect(v2Manifest.entries).toEqual(v1Manifest.entries);
      expect(v2Manifest.skills).toEqual([]);
      expect(v2Manifest.rulesEntry).toEqual({});
    });

    test('should preserve v2.0 manifest unchanged', () => {
      const v2Manifest = {
        version: '2.0',
        generatedAt: '2025-01-01T00:00:00.000Z',
        entries: [],
        skills: [{ name: 'test', sourceHash: 'abc', timestamp: '2025-01-01T00:00:00.000Z' }],
        rulesEntry: { cursor: { path: '.cursor/rules/devflow.mdc', hash: 'def' } }
      };

      const result = migrateToV2(v2Manifest);

      expect(result).toEqual(v2Manifest);
    });

    test('should create new v2.0 manifest from null', () => {
      const result = migrateToV2(null);

      expect(result.version).toBe('2.0');
      expect(result.skills).toEqual([]);
      expect(result.rulesEntry).toEqual({});
    });
  });

  describe('createEntry()', () => {
    test('should persist sourceHash for incremental compile and target hash for drift check', () => {
      const sourceHash = 'a'.repeat(64);
      const targetHash = 'b'.repeat(64);
      const entry = createEntry({
        source: '.claude/commands/flow/init.md',
        target: '.codex/prompts/flow/init.md',
        sourceHash,
        targetHash,
        platform: 'codex'
      });

      expect(entry.sourceHash).toBe(sourceHash);
      expect(entry.hash).toBe(targetHash);
    });
  });

  describe('needsRecompile()', () => {
    test('should return false when sourceHash is unchanged', () => {
      const sourcePath = '.claude/commands/flow/init.md';
      const sourceHash = hashContent('source content');
      const manifest = createManifest();

      manifest.entries.push({
        source: sourcePath,
        target: '.codex/prompts/flow/init.md',
        hash: hashContent('target content'),
        sourceHash,
        platform: 'codex'
      });

      expect(needsRecompile(sourcePath, sourceHash, manifest, 'codex')).toBe(false);
    });

    test('should return true for legacy entries without sourceHash', () => {
      const sourcePath = '.claude/commands/flow/init.md';
      const sourceHash = hashContent('source content');
      const manifest = createManifest();

      manifest.entries.push({
        source: sourcePath,
        target: '.codex/prompts/flow/init.md',
        hash: sourceHash,
        platform: 'codex'
      });

      expect(needsRecompile(sourcePath, sourceHash, manifest, 'codex')).toBe(true);
    });

    test('should return false when all split outputs share same sourceHash', () => {
      const sourcePath = '.claude/commands/flow/init.md';
      const sourceHash = hashContent('source content');
      const manifest = createManifest();

      manifest.entries.push({
        source: sourcePath,
        target: '.agent/workflows/flow/init.md',
        hash: hashContent('output a'),
        sourceHash,
        platform: 'antigravity'
      });
      manifest.entries.push({
        source: sourcePath,
        target: '.agent/workflows/flow/init.toml',
        hash: hashContent('output b'),
        sourceHash,
        platform: 'antigravity'
      });

      expect(needsRecompile(sourcePath, sourceHash, manifest, 'antigravity')).toBe(false);
    });
  });

  describe('addEntry()', () => {
    test('should keep multiple outputs for same source and platform', () => {
      const manifest = createManifest();
      addEntry(manifest, {
        source: '.claude/commands/flow/init.md',
        target: '.agent/workflows/flow/init.md',
        hash: 'a',
        sourceHash: 'sa',
        platform: 'antigravity'
      });
      addEntry(manifest, {
        source: '.claude/commands/flow/init.md',
        target: '.agent/workflows/flow/init.toml',
        hash: 'b',
        sourceHash: 'sa',
        platform: 'antigravity'
      });

      expect(manifest.entries).toHaveLength(2);
    });

    test('should update only the matching output target', () => {
      const manifest = createManifest();
      addEntry(manifest, {
        source: '.claude/commands/flow/init.md',
        target: '.agent/workflows/flow/init.md',
        hash: 'a',
        sourceHash: 'sa',
        platform: 'antigravity'
      });
      addEntry(manifest, {
        source: '.claude/commands/flow/init.md',
        target: '.agent/workflows/flow/init.toml',
        hash: 'b',
        sourceHash: 'sa',
        platform: 'antigravity'
      });
      addEntry(manifest, {
        source: '.claude/commands/flow/init.md',
        target: '.agent/workflows/flow/init.md',
        hash: 'c',
        sourceHash: 'sb',
        platform: 'antigravity'
      });

      expect(manifest.entries).toHaveLength(2);
      expect(
        manifest.entries.find(entry => entry.target === '.agent/workflows/flow/init.md')
      ).toMatchObject({ hash: 'c', sourceHash: 'sb' });
      expect(
        manifest.entries.find(entry => entry.target === '.agent/workflows/flow/init.toml')
      ).toMatchObject({ hash: 'b', sourceHash: 'sa' });
    });
  });

  describe('pruneCommandEntries()', () => {
    test('should remove stale command entries for selected platforms only', () => {
      const manifest = createManifest();
      manifest.entries = [
        { source: '.claude/commands/flow/init.md', target: '.codex/prompts/flow/init.md', hash: '1', platform: 'codex' },
        { source: '.claude/commands/flow/old.md', target: '.codex/prompts/flow/old.md', hash: '2', platform: 'codex' },
        { source: '.claude/commands/flow/old.md', target: '.qwen/commands/flow/old.toml', hash: '3', platform: 'qwen' },
        { source: '.claude/rules/base.md', target: '.cursor/rules/base.mdc', hash: '4', platform: 'cursor' }
      ];

      const removed = pruneCommandEntries(manifest, {
        sourcePrefix: '.claude/commands',
        activeSources: new Set(['.claude/commands/flow/init.md']),
        platforms: ['codex', 'cursor']
      });

      expect(removed).toBe(1);
      expect(manifest.entries).toHaveLength(3);
      expect(manifest.entries.find(e => e.target === '.codex/prompts/flow/old.md')).toBeUndefined();
      expect(manifest.entries.find(e => e.target === '.qwen/commands/flow/old.toml')).toBeDefined();
      expect(manifest.entries.find(e => e.target === '.cursor/rules/base.mdc')).toBeDefined();
    });
  });

  describe('addSkillEntry()', () => {
    test('should add new skill entry', () => {
      const manifest = createManifest();
      const skillEntry = {
        name: 'cc-devflow-orchestrator',
        sourceHash: 'a'.repeat(64),
        timestamp: new Date().toISOString()
      };

      addSkillEntry(manifest, skillEntry);

      expect(manifest.skills.length).toBe(1);
      expect(manifest.skills[0]).toEqual(skillEntry);
    });

    test('should update existing skill entry', () => {
      const manifest = createManifest();
      const oldEntry = {
        name: 'test-skill',
        sourceHash: 'a'.repeat(64),
        timestamp: '2025-01-01T00:00:00.000Z'
      };
      const newEntry = {
        name: 'test-skill',
        sourceHash: 'b'.repeat(64),
        timestamp: '2025-01-02T00:00:00.000Z'
      };

      addSkillEntry(manifest, oldEntry);
      addSkillEntry(manifest, newEntry);

      expect(manifest.skills.length).toBe(1);
      expect(manifest.skills[0].sourceHash).toBe('b'.repeat(64));
    });
  });

  describe('addRulesEntry()', () => {
    test('should add rules entry for platform', () => {
      const manifest = createManifest();
      const rulesEntry = {
        path: '.cursor/rules/devflow.mdc',
        hash: 'c'.repeat(64),
        timestamp: new Date().toISOString()
      };

      addRulesEntry(manifest, 'cursor', rulesEntry);

      expect(manifest.rulesEntry.cursor).toEqual(rulesEntry);
    });

    test('should update existing rules entry', () => {
      const manifest = createManifest();
      const oldEntry = { path: '.cursor/rules/devflow.mdc', hash: 'a'.repeat(64) };
      const newEntry = { path: '.cursor/rules/devflow.mdc', hash: 'b'.repeat(64) };

      addRulesEntry(manifest, 'cursor', oldEntry);
      addRulesEntry(manifest, 'cursor', newEntry);

      expect(manifest.rulesEntry.cursor.hash).toBe('b'.repeat(64));
    });
  });

  describe('needsSkillRecompile()', () => {
    test('should return true for new skill', () => {
      const manifest = createManifest();

      const result = needsSkillRecompile('new-skill', 'somehash', manifest);

      expect(result).toBe(true);
    });

    test('should return true when hash changed', () => {
      const manifest = createManifest();
      addSkillEntry(manifest, {
        name: 'test-skill',
        sourceHash: 'oldhash',
        timestamp: new Date().toISOString()
      });

      const result = needsSkillRecompile('test-skill', 'newhash', manifest);

      expect(result).toBe(true);
    });

    test('should return false when hash unchanged', () => {
      const manifest = createManifest();
      const hash = 'samehash';
      addSkillEntry(manifest, {
        name: 'test-skill',
        sourceHash: hash,
        timestamp: new Date().toISOString()
      });

      const result = needsSkillRecompile('test-skill', hash, manifest);

      expect(result).toBe(false);
    });
  });

  describe('needsRulesRecompile()', () => {
    test('should return true for new platform', () => {
      const manifest = createManifest();

      const result = needsRulesRecompile('cursor', 'somehash', manifest);

      expect(result).toBe(true);
    });

    test('should return true when hash changed', () => {
      const manifest = createManifest();
      addRulesEntry(manifest, 'cursor', {
        path: '.cursor/rules/devflow.mdc',
        hash: 'oldhash',
        timestamp: new Date().toISOString()
      });

      const result = needsRulesRecompile('cursor', 'newhash', manifest);

      expect(result).toBe(true);
    });

    test('should return false when hash unchanged', () => {
      const manifest = createManifest();
      const hash = 'samehash';
      addRulesEntry(manifest, 'cursor', {
        path: '.cursor/rules/devflow.mdc',
        hash: hash,
        timestamp: new Date().toISOString()
      });

      const result = needsRulesRecompile('cursor', hash, manifest);

      expect(result).toBe(false);
    });
  });

  describe('Hash format validation', () => {
    test('hashContent should return 64-char hex string', () => {
      const hash = hashContent('test content');

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
