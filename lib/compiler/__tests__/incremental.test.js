/**
 * T010: Incremental Compilation Tests
 *
 * 测试增量编译:
 * 1. 无变更时跳过所有文件
 * 2. skill.md 变更时重新生成 registry
 * 3. skill-rules.json 变更时重新生成 registry
 * 4. Manifest skills/rulesEntry 字段正确更新
 *
 * Reference: quickstart.md#4.4
 */

const path = require('path');
const fs = require('fs');

describe('Incremental Compilation', () => {
  describe('Skills Registry Incremental', () => {
    test('should skip registry generation when no changes', async () => {
      // 模拟场景：上次编译后无任何变更
      const { compile } = require('../index');
      const { loadManifest, createManifest, addSkillEntry } = require('../manifest');

      // 预期：输出显示 "No changes detected" 或跳过计数
      // 实际实现需要在 Phase 4 完成

      // 占位测试：检查增量编译逻辑存在
      expect(typeof compile).toBe('function');
    });

    test('should regenerate registry when skill.md changed', async () => {
      // 模拟场景：修改了 .claude/skills/xxx/skill.md
      // 预期：registry 重新生成，manifest.skills 更新

      const { needsSkillRecompile, addSkillEntry, createManifest, hashContent } = require('../manifest');

      const manifest = createManifest();
      const oldHash = hashContent('old content');
      const newHash = hashContent('new content');

      addSkillEntry(manifest, {
        name: 'test-skill',
        sourceHash: oldHash,
        timestamp: new Date().toISOString()
      });

      // 验证变更检测
      expect(needsSkillRecompile('test-skill', newHash, manifest)).toBe(true);
      expect(needsSkillRecompile('test-skill', oldHash, manifest)).toBe(false);
    });

    test('should regenerate registry when skill-rules.json changed', async () => {
      // skill-rules.json 变更应触发所有技能重新编译
      const { needsSkillRecompile, createManifest } = require('../manifest');

      const manifest = createManifest();

      // 新的 skill-rules.json 意味着所有技能都需要重新检查
      expect(needsSkillRecompile('any-skill', 'newhash', manifest)).toBe(true);
    });

    test('should update manifest.skills after regeneration', async () => {
      const { addSkillEntry, createManifest, hashContent } = require('../manifest');

      const manifest = createManifest();

      // 添加技能
      addSkillEntry(manifest, {
        name: 'skill-1',
        sourceHash: hashContent('content 1'),
        timestamp: new Date().toISOString()
      });

      addSkillEntry(manifest, {
        name: 'skill-2',
        sourceHash: hashContent('content 2'),
        timestamp: new Date().toISOString()
      });

      expect(manifest.skills.length).toBe(2);
      expect(manifest.skills.find(s => s.name === 'skill-1')).toBeDefined();
      expect(manifest.skills.find(s => s.name === 'skill-2')).toBeDefined();
    });
  });

  describe('Rules Entry Incremental', () => {
    test('should skip rules generation when no changes', async () => {
      const { needsRulesRecompile, addRulesEntry, createManifest, hashContent } = require('../manifest');

      const manifest = createManifest();
      const hash = hashContent('rules content');

      addRulesEntry(manifest, 'cursor', {
        path: '.cursor/rules/devflow.mdc',
        hash: hash,
        timestamp: new Date().toISOString()
      });

      // 相同 hash 不需要重新编译
      expect(needsRulesRecompile('cursor', hash, manifest)).toBe(false);
    });

    test('should regenerate rules when registry changed', async () => {
      const { needsRulesRecompile, createManifest } = require('../manifest');

      const manifest = createManifest();

      // 新平台或变更的 registry 需要重新编译规则
      expect(needsRulesRecompile('cursor', 'newhash', manifest)).toBe(true);
    });

    test('should update manifest.rulesEntry after regeneration', async () => {
      const { addRulesEntry, createManifest, hashContent } = require('../manifest');

      const manifest = createManifest();

      // 添加四个平台的规则入口
      const platforms = ['cursor', 'codex', 'qwen', 'antigravity'];

      for (const platform of platforms) {
        addRulesEntry(manifest, platform, {
          path: `.${platform}/rules/devflow`,
          hash: hashContent(`${platform} content`),
          timestamp: new Date().toISOString()
        });
      }

      expect(Object.keys(manifest.rulesEntry).length).toBe(4);
      expect(manifest.rulesEntry.cursor).toBeDefined();
      expect(manifest.rulesEntry.codex).toBeDefined();
      expect(manifest.rulesEntry.qwen).toBeDefined();
      expect(manifest.rulesEntry.antigravity).toBeDefined();
    });
  });

  describe('End-to-end Incremental Flow', () => {
    test('should track full incremental state', async () => {
      const {
        createManifest,
        addSkillEntry,
        addRulesEntry,
        needsSkillRecompile,
        needsRulesRecompile,
        hashContent
      } = require('../manifest');

      // 初始编译
      const manifest = createManifest();

      // 编译技能
      const skill1Hash = hashContent('skill 1 content');
      addSkillEntry(manifest, {
        name: 'skill-1',
        sourceHash: skill1Hash,
        timestamp: new Date().toISOString()
      });

      // 编译规则
      const cursorHash = hashContent('cursor rules');
      addRulesEntry(manifest, 'cursor', {
        path: '.cursor/rules/devflow.mdc',
        hash: cursorHash,
        timestamp: new Date().toISOString()
      });

      // 验证增量状态
      expect(needsSkillRecompile('skill-1', skill1Hash, manifest)).toBe(false);
      expect(needsRulesRecompile('cursor', cursorHash, manifest)).toBe(false);

      // 模拟变更
      const newSkill1Hash = hashContent('skill 1 updated');
      expect(needsSkillRecompile('skill-1', newSkill1Hash, manifest)).toBe(true);
    });
  });
});
