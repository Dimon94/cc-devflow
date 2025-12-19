/**
 * T006: Codex Rules Emitter Tests
 *
 * 测试 CodexRulesEmitter SKILL.md 格式输出:
 * 1. 输出包含 YAML frontmatter (name, description, type)
 * 2. 输出路径为 .codex/skills/cc-devflow/SKILL.md
 * 3. Skills 和 Commands 部分存在
 *
 * Reference: contracts/cli-spec.yaml#codex
 */

const matter = require('gray-matter');

describe('CodexRulesEmitter', () => {
  describe('format()', () => {
    test('should output YAML frontmatter with name, description, type', async () => {
      const { CodexRulesEmitter } = require('../../rules-emitters/codex-rules-emitter');

      const emitter = new CodexRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'test-skill', description: 'Test', type: 'domain' }
        ]
      };

      const content = emitter.format(registry, []);

      // 解析 frontmatter
      const parsed = matter(content);

      // 验证必需的 frontmatter 字段
      expect(parsed.data).toHaveProperty('name');
      expect(parsed.data).toHaveProperty('description');
      expect(parsed.data).toHaveProperty('type');

      expect(parsed.data.name).toBe('cc-devflow');
      expect(parsed.data.type).toBe('domain');
    });

    test('should include Skills section', async () => {
      const { CodexRulesEmitter } = require('../../rules-emitters/codex-rules-emitter');

      const emitter = new CodexRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'cc-devflow-orchestrator', description: 'Router', type: 'domain', enforcement: 'suggest' },
          { name: 'devflow-tdd-enforcer', description: 'TDD', type: 'guardrail', enforcement: 'block' }
        ]
      };

      const content = emitter.format(registry, []);
      const parsed = matter(content);

      // 验证 Skills 部分
      expect(parsed.content).toMatch(/## Skills/i);
      expect(parsed.content).toContain('cc-devflow-orchestrator');
      expect(parsed.content).toContain('devflow-tdd-enforcer');

      // 验证包含 Triggers 和 Enforcement 信息
      expect(parsed.content).toMatch(/Triggers|Enforcement/i);
    });

    test('should include Commands section', async () => {
      const { CodexRulesEmitter } = require('../../rules-emitters/codex-rules-emitter');

      const emitter = new CodexRulesEmitter();
      const commands = [
        { name: 'flow-init', description: 'Initialize' },
        { name: 'flow-prd', description: 'Generate PRD' }
      ];

      const content = emitter.format({ skills: [] }, commands);
      const parsed = matter(content);

      // 验证 Commands 部分
      expect(parsed.content).toMatch(/## Commands/i);
      expect(parsed.content).toContain('flow-init');
      expect(parsed.content).toContain('flow-prd');
    });
  });

  describe('emit()', () => {
    test('should output to .codex/skills/cc-devflow/SKILL.md', async () => {
      const { CodexRulesEmitter } = require('../../rules-emitters/codex-rules-emitter');

      const emitter = new CodexRulesEmitter();

      expect(emitter.outputPath).toBe('.codex/skills/cc-devflow/SKILL.md');
    });

    test('should write file with correct content', async () => {
      const { CodexRulesEmitter } = require('../../rules-emitters/codex-rules-emitter');

      const emitter = new CodexRulesEmitter();
      const registry = { version: '1.0', skills: [] };

      const result = await emitter.emit(registry, []);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('timestamp');

      expect(result.path).toBe('.codex/skills/cc-devflow/SKILL.md');
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
