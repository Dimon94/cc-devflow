/**
 * T007: Qwen Rules Emitter Tests
 *
 * 测试 QwenRulesEmitter TOML 格式输出:
 * 1. 输出为有效 TOML (可被 @iarna/toml 解析)
 * 2. 包含 [skill] 和 [commands] 段
 * 3. 输出路径为 .qwen/commands/devflow.toml
 *
 * Reference: contracts/cli-spec.yaml#qwen
 */

const TOML = require('@iarna/toml');

describe('QwenRulesEmitter', () => {
  describe('format()', () => {
    test('should output valid TOML parseable by @iarna/toml', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'test-skill', description: 'Test', type: 'domain' }
        ]
      };

      const content = emitter.format(registry, []);

      // 验证 TOML 格式有效
      expect(() => TOML.parse(content)).not.toThrow();

      const parsed = TOML.parse(content);
      expect(parsed).toBeDefined();
    });

    test('should contain [skill] section', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();
      const registry = { version: '1.0', skills: [] };

      const content = emitter.format(registry, []);
      const parsed = TOML.parse(content);

      // 验证 [skill] 段存在
      expect(parsed).toHaveProperty('skill');
      expect(parsed.skill).toHaveProperty('name');
      expect(parsed.skill).toHaveProperty('description');
      expect(parsed.skill.name).toBe('cc-devflow');
    });

    test('should contain [skills.*] sections for each skill', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'cc-devflow-orchestrator', description: 'Router', type: 'domain', enforcement: 'suggest' },
          { name: 'devflow-tdd-enforcer', description: 'TDD', type: 'guardrail', enforcement: 'block' }
        ]
      };

      const content = emitter.format(registry, []);
      const parsed = TOML.parse(content);

      // 验证 [skills] 段存在
      expect(parsed).toHaveProperty('skills');
      expect(parsed.skills).toHaveProperty('cc-devflow-orchestrator');
      expect(parsed.skills).toHaveProperty('devflow-tdd-enforcer');

      // 验证技能属性
      expect(parsed.skills['cc-devflow-orchestrator'].description).toBe('Router');
      expect(parsed.skills['cc-devflow-orchestrator'].type).toBe('domain');
    });

    test('should contain [commands] section', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();
      const commands = [
        { name: 'flow-init', description: 'Initialize' },
        { name: 'flow-prd', description: 'Generate PRD' }
      ];

      const content = emitter.format({ skills: [] }, commands);
      const parsed = TOML.parse(content);

      // 验证 [commands] 段存在
      expect(parsed).toHaveProperty('commands');
      expect(parsed.commands).toHaveProperty('flow-init');
      expect(parsed.commands).toHaveProperty('flow-prd');

      expect(parsed.commands['flow-init'].description).toBe('Initialize');
    });
  });

  describe('emit()', () => {
    test('should output to .qwen/commands/devflow.toml', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();

      expect(emitter.outputPath).toBe('.qwen/commands/devflow.toml');
    });

    test('should write file with correct content', async () => {
      const { QwenRulesEmitter } = require('../../rules-emitters/qwen-rules-emitter');

      const emitter = new QwenRulesEmitter();
      const registry = { version: '1.0', skills: [] };

      const result = await emitter.emit(registry, []);

      expect(result).toHaveProperty('path');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('timestamp');

      expect(result.path).toBe('.qwen/commands/devflow.toml');
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
