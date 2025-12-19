/**
 * T005: Cursor Rules Emitter Tests
 *
 * 测试 CursorRulesEmitter MDC 格式输出:
 * 1. 输出包含 YAML frontmatter (description, globs, alwaysApply)
 * 2. 输出路径为 .cursor/rules/devflow.mdc
 * 3. MDC 格式验证 (--- 分隔符)
 *
 * Reference: contracts/cli-spec.yaml#cursor
 */

const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');

describe('CursorRulesEmitter', () => {
  describe('format()', () => {
    test('should output valid MDC format with YAML frontmatter', async () => {
      const { CursorRulesEmitter } = require('../../rules-emitters/cursor-rules-emitter');

      const emitter = new CursorRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'test-skill', description: 'Test', type: 'domain' }
        ]
      };
      const commands = [
        { name: 'test-cmd', description: 'Test command' }
      ];

      const content = emitter.format(registry, commands);

      // 验证 MDC 格式 (YAML frontmatter + Markdown)
      expect(content).toMatch(/^---\n/);
      expect(content).toMatch(/\n---\n/);

      // 解析 frontmatter
      const parsed = matter(content);

      // 验证必需的 frontmatter 字段
      expect(parsed.data).toHaveProperty('description');
      expect(parsed.data).toHaveProperty('globs');
      expect(parsed.data).toHaveProperty('alwaysApply');

      // globs 应该是数组
      expect(Array.isArray(parsed.data.globs)).toBe(true);
      expect(parsed.data.globs).toContain('devflow/**/*');
      expect(parsed.data.globs).toContain('.claude/**/*');

      // alwaysApply 应该是 boolean
      expect(typeof parsed.data.alwaysApply).toBe('boolean');
    });

    test('should include Skills section with skill list', async () => {
      const { CursorRulesEmitter } = require('../../rules-emitters/cursor-rules-emitter');

      const emitter = new CursorRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'cc-devflow-orchestrator', description: 'Workflow router', type: 'domain' },
          { name: 'devflow-tdd-enforcer', description: 'TDD enforcement', type: 'guardrail' }
        ]
      };

      const content = emitter.format(registry, []);
      const parsed = matter(content);

      // Markdown body 应包含 Skills 部分
      expect(parsed.content).toMatch(/## Available Skills/i);
      expect(parsed.content).toContain('cc-devflow-orchestrator');
      expect(parsed.content).toContain('devflow-tdd-enforcer');
    });

    test('should include Commands section with command list', async () => {
      const { CursorRulesEmitter } = require('../../rules-emitters/cursor-rules-emitter');

      const emitter = new CursorRulesEmitter();
      const commands = [
        { name: 'flow-init', description: 'Initialize requirement' },
        { name: 'flow-prd', description: 'Generate PRD' }
      ];

      const content = emitter.format({ skills: [] }, commands);
      const parsed = matter(content);

      // Markdown body 应包含 Commands 部分
      expect(parsed.content).toMatch(/## Key Commands|## Commands/i);
      expect(parsed.content).toContain('flow-init');
      expect(parsed.content).toContain('flow-prd');
    });
  });

  describe('emit()', () => {
    test('should output to .cursor/rules/devflow.mdc', async () => {
      const { CursorRulesEmitter } = require('../../rules-emitters/cursor-rules-emitter');

      const emitter = new CursorRulesEmitter();

      // 验证输出路径
      expect(emitter.outputPath).toBe('.cursor/rules/devflow.mdc');
    });

    test('should write file with correct content', async () => {
      const { CursorRulesEmitter } = require('../../rules-emitters/cursor-rules-emitter');

      const emitter = new CursorRulesEmitter();
      const registry = { version: '1.0', skills: [] };
      const commands = [];

      const result = await emitter.emit(registry, commands);

      // 验证返回结果
      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('timestamp');

      expect(result.path).toBe('.cursor/rules/devflow.mdc');
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
