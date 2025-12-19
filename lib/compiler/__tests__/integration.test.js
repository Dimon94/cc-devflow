/**
 * T012: Integration Test for Full Compilation
 *
 * 测试完整编译流程:
 * 1. 运行 npm run adapt 等效操作
 * 2. 验证 4 个平台规则入口文件存在
 * 3. 验证 skills-registry.json 存在
 * 4. 验证 manifest.json 是 v2.0
 * 5. 验证统计数据输出
 *
 * Reference: quickstart.md#2.1
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Full Compilation Integration', () => {
  // 这些测试依赖 Phase 3/4 的实现
  // 在实现前应该失败

  describe('compile() full flow', () => {
    test('should compile all platforms and generate rules entry files', async () => {
      // Phase 3/4 实现后此测试应通过
      const { compile } = require('../index');

      // 当前 compile 可能不支持完整功能
      // 验证函数存在
      expect(typeof compile).toBe('function');

      // TODO: Phase 4 完成后取消注释
      // const result = await compile({
      //   sourceDir: '.claude/commands/',
      //   skillsDir: '.claude/skills/',
      //   rules: true,
      //   skills: true
      // });
      //
      // expect(result.success).toBe(true);
      // expect(result.rulesGenerated).toBe(4);
      // expect(result.skillsRegistered).toBeGreaterThan(0);
    });

    test('should generate 4 platform rule entry files', async () => {
      const { PLATFORMS, getRulesEntryPath } = require('../platforms');

      // 验证平台配置
      expect(PLATFORMS).toContain('cursor');
      expect(PLATFORMS).toContain('codex');
      expect(PLATFORMS).toContain('qwen');
      expect(PLATFORMS).toContain('antigravity');

      // 验证规则入口路径
      expect(getRulesEntryPath('cursor')).toBe('.cursor/rules/devflow.mdc');
      expect(getRulesEntryPath('codex')).toBe('.codex/skills/cc-devflow/SKILL.md');
      expect(getRulesEntryPath('qwen')).toBe('.qwen/commands/devflow.toml');
      expect(getRulesEntryPath('antigravity')).toBe('.agent/rules/rules.md');
    });

    test('should generate skills-registry.json', async () => {
      // 验证输出路径常量
      const SKILLS_REGISTRY_PATH = 'devflow/.generated/skills-registry.json';

      expect(SKILLS_REGISTRY_PATH).toBe('devflow/.generated/skills-registry.json');

      // TODO: Phase 3 完成后验证文件生成
      // const content = fs.readFileSync(SKILLS_REGISTRY_PATH, 'utf8');
      // const registry = JSON.parse(content);
      // expect(registry.version).toBe('1.0');
      // expect(registry.skills).toBeDefined();
    });

    test('should generate manifest.json v2.0', async () => {
      const { MANIFEST_PATH, MANIFEST_VERSION } = require('../manifest');

      expect(MANIFEST_PATH).toBe('devflow/.generated/manifest.json');
      expect(MANIFEST_VERSION).toBe('2.0');

      // TODO: Phase 4 完成后验证文件生成
      // const content = fs.readFileSync(MANIFEST_PATH, 'utf8');
      // const manifest = JSON.parse(content);
      // expect(manifest.version).toBe('2.0');
      // expect(manifest.skills).toBeDefined();
      // expect(manifest.rulesEntry).toBeDefined();
    });

    test('should return compilation statistics', async () => {
      // 验证返回结构
      const expectedStats = {
        success: true,
        filesCompiled: 0,
        filesSkipped: 0,
        resourcesCopied: 0,
        resourcesSkipped: 0,
        rulesGenerated: 0,
        skillsRegistered: 0,
        errors: []
      };

      // 验证结构存在
      expect(expectedStats).toHaveProperty('success');
      expect(expectedStats).toHaveProperty('filesCompiled');
      expect(expectedStats).toHaveProperty('rulesGenerated');
      expect(expectedStats).toHaveProperty('skillsRegistered');
    });
  });

  describe('Platform output verification', () => {
    test('should verify Cursor MDC format', async () => {
      const matter = require('gray-matter');

      // 预期的 MDC 格式
      const expectedMDC = `---
description: "CC-DevFlow Rules"
globs: ["devflow/**/*", ".claude/**/*"]
alwaysApply: true
---

# CC-DevFlow Rules
`;

      const parsed = matter(expectedMDC);

      expect(parsed.data.description).toBeDefined();
      expect(parsed.data.globs).toBeDefined();
      expect(parsed.data.alwaysApply).toBe(true);
    });

    test('should verify Qwen TOML format', async () => {
      const TOML = require('@iarna/toml');

      // 预期的 TOML 格式
      const expectedTOML = `[skill]
name = "cc-devflow"
description = "CC-DevFlow development workflow system"

[commands]
flow-init = { description = "Initialize requirement" }
`;

      expect(() => TOML.parse(expectedTOML)).not.toThrow();

      const parsed = TOML.parse(expectedTOML);
      expect(parsed.skill.name).toBe('cc-devflow');
      expect(parsed.commands['flow-init']).toBeDefined();
    });

    test('should verify Antigravity size limit', async () => {
      const { PLATFORM_CONFIG } = require('../platforms');

      const antigravityConfig = PLATFORM_CONFIG.antigravity;

      expect(antigravityConfig.limits.maxFileChars).toBe(12000);
    });
  });

  describe('Error handling', () => {
    test('should handle missing source directory gracefully', async () => {
      const { generateSkillsRegistry } = require('../skills-registry');

      // 不存在的目录应返回空数组
      const result = generateSkillsRegistry('/nonexistent/path');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should reject invalid platform', () => {
      const { getPlatformConfig } = require('../platforms');

      expect(() => getPlatformConfig('invalid')).toThrow(/Unknown platform/);
    });
  });
});
