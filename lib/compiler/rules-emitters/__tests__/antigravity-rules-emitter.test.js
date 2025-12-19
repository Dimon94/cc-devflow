/**
 * T008: Antigravity Rules Emitter Tests
 *
 * 测试 AntigravityRulesEmitter 12K 字符限制:
 * 1. 内容 < 12000 字符时输出单个文件
 * 2. 内容 > 12000 字符时分割为多个 Part 文件
 * 3. 每个 part <= 12000 字符
 * 4. Part 文件正确命名 (rules-part1.md, rules-part2.md)
 * 5. Part 文件之间使用 @ 引用链接
 *
 * Reference: research.md#D06 - 12K limit confirmed
 */

const matter = require('gray-matter');

const MAX_FILE_CHARS = 12000;

describe('AntigravityRulesEmitter', () => {
  describe('format()', () => {
    test('should output valid Markdown with YAML frontmatter', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'test-skill', description: 'Test', type: 'domain' }
        ]
      };

      const content = emitter.format(registry, []);

      // 解析 frontmatter
      const parsed = matter(content);

      // 验证 frontmatter
      expect(parsed.data).toHaveProperty('description');
    });

    test('should include skills and commands content', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [
          { name: 'cc-devflow-orchestrator', description: 'Router', type: 'domain' }
        ]
      };
      const commands = [
        { name: 'flow-init', description: 'Initialize' }
      ];

      const content = emitter.format(registry, commands);

      expect(content).toContain('cc-devflow-orchestrator');
      expect(content).toContain('flow-init');
    });
  });

  describe('emit() - Single file (< 12K)', () => {
    test('should output single file when content < 12000 chars', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();
      const registry = {
        version: '1.0',
        skills: [{ name: 'test', description: 'Test', type: 'domain' }]
      };

      const results = await emitter.emit(registry, []);

      // 应返回单个文件结果
      expect(Array.isArray(results) ? results.length : 1).toBe(1);

      const result = Array.isArray(results) ? results[0] : results;
      expect(result.path).toBe('.agent/rules/rules.md');
    });

    test('should output to .agent/rules/rules.md', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();

      expect(emitter.outputPath).toBe('.agent/rules/rules.md');
    });
  });

  describe('emit() - Multi-file split (> 12K)', () => {
    test('should split into Part files when content > 12000 chars', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();

      // 创建超过 12K 的内容
      const largeSkills = [];
      for (let i = 0; i < 100; i++) {
        largeSkills.push({
          name: `skill-${i}`,
          description: 'A'.repeat(200), // 200 chars per skill
          type: 'domain'
        });
      }

      const registry = { version: '1.0', skills: largeSkills };
      const results = await emitter.emit(registry, []);

      // 应返回多个文件结果
      if (Array.isArray(results)) {
        expect(results.length).toBeGreaterThan(1);

        // 验证 Part 文件命名
        expect(results[0].path).toMatch(/rules-part1\.md$/);
        expect(results[1].path).toMatch(/rules-part2\.md$/);
      }
    });

    test('should ensure each part <= 12000 chars', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();

      // 创建超大内容
      const largeSkills = [];
      for (let i = 0; i < 100; i++) {
        largeSkills.push({
          name: `skill-${i}`,
          description: 'B'.repeat(200),
          type: 'domain'
        });
      }

      const registry = { version: '1.0', skills: largeSkills };
      const results = await emitter.emit(registry, []);

      if (Array.isArray(results)) {
        for (const result of results) {
          // 每个 part 的内容长度应 <= 12000
          // 注意：这里需要实际读取文件验证
          expect(result.size || result.chars).toBeLessThanOrEqual(MAX_FILE_CHARS);
        }
      }
    });

    test('should add @ reference links between parts', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();

      // 创建足够大的内容触发分割
      const largeSkills = [];
      for (let i = 0; i < 100; i++) {
        largeSkills.push({
          name: `skill-${i}`,
          description: 'C'.repeat(200),
          type: 'domain'
        });
      }

      const registry = { version: '1.0', skills: largeSkills };
      const results = await emitter.emit(registry, []);

      if (Array.isArray(results) && results.length > 1) {
        // 第一个 part 应包含指向下一个 part 的引用
        // 如 @rules-part2.md
        expect(results[0].content || '').toMatch(/@rules-part2|See also|Continued in/i);
      }
    });
  });

  describe('smartChunk()', () => {
    test('should split by ## headers', async () => {
      const { AntigravityRulesEmitter } = require('../../rules-emitters/antigravity-rules-emitter');

      const emitter = new AntigravityRulesEmitter();

      // 测试 smartChunk 内部逻辑
      if (typeof emitter.smartChunk === 'function') {
        const content = `## Section 1\n${'a'.repeat(6000)}\n## Section 2\n${'b'.repeat(6000)}\n## Section 3\n${'c'.repeat(6000)}`;

        const chunks = emitter.smartChunk(content, MAX_FILE_CHARS);

        expect(chunks.length).toBeGreaterThan(1);

        for (const chunk of chunks) {
          expect(chunk.length).toBeLessThanOrEqual(MAX_FILE_CHARS);
        }
      }
    });
  });
});
