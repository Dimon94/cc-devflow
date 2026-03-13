/**
 * TDD Order Validation Tests
 *
 * Tests for Constitution Article VI enforcement in planner.js
 */

const { parseTasksMarkdown } = require('../planner');

describe('TDD Order Validation', () => {
  describe('Valid TDD sequences', () => {
    test('should accept TEST before IMPL with correct dependency', () => {
      const markdown = `
- [ ] T001 [TEST] 用户登录功能测试
- [ ] T002 [IMPL] 用户登录功能实现 (dependsOn:T001)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).not.toThrow();
    });

    test('should accept multiple TEST-IMPL pairs', () => {
      const markdown = `
- [ ] T001 [TEST] 用户登录测试
- [ ] T002 [IMPL] 用户登录实现 (dependsOn:T001)
- [ ] T003 [TEST] 用户注册测试 [P]
- [ ] T004 [IMPL] 用户注册实现 (dependsOn:T003)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).not.toThrow();
    });

    test('should accept tasks without TEST/IMPL markers', () => {
      const markdown = `
- [ ] T001 初始化项目结构
- [ ] T002 配置开发环境
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).not.toThrow();
    });
  });

  describe('TDD violations', () => {
    test('should reject IMPL without corresponding TEST', () => {
      const markdown = `
- [ ] T001 [IMPL] 用户登录功能实现
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).toThrow(
        /missing corresponding TEST task/
      );
    });

    test('should reject IMPL not depending on TEST', () => {
      const markdown = `
- [ ] T001 [TEST] 用户登录功能测试
- [ ] T002 [IMPL] 用户登录功能实现 [P]
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).toThrow(
        /must depend on T001/
      );
    });

    test('should reject TEST depending on IMPL', () => {
      const markdown = `
- [ ] T001 [IMPL] 用户登录功能实现
- [ ] T002 [TEST] 用户登录功能测试 (dependsOn:T001)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).toThrow(
        /Tests must be written BEFORE implementation/
      );
    });

    test('should reject IMPL depending on wrong TEST', () => {
      const markdown = `
- [ ] T001 [TEST] 用户注册测试
- [ ] T002 [IMPL] 用户登录实现 (dependsOn:T001)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).toThrow(
        /missing corresponding TEST task/
      );
    });
  });

  describe('Feature name extraction', () => {
    test('should match TEST and IMPL with same feature name', () => {
      const markdown = `
- [ ] T001 [TEST] 实现用户认证功能
- [ ] T002 [IMPL] 实现用户认证功能 (dependsOn:T001)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).not.toThrow();
    });

    test('should handle case-insensitive markers', () => {
      const markdown = `
- [ ] T001 [test] 用户登录
- [ ] T002 [impl] 用户登录 (dependsOn:T001)
      `.trim();

      expect(() => parseTasksMarkdown(markdown)).not.toThrow();
    });
  });

  describe('Error messages', () => {
    test('should provide clear violation details', () => {
      const markdown = `
- [ ] T001 [IMPL] 功能A
- [ ] T002 [TEST] 功能B
- [ ] T003 [IMPL] 功能B
      `.trim();

      try {
        parseTasksMarkdown(markdown);
        fail('Should have thrown TDD violation error');
      } catch (error) {
        expect(error.message).toContain('TDD Order Validation Failed');
        expect(error.message).toContain('Constitution Article VI');
        expect(error.message).toContain('T001');
        expect(error.message).toContain('missing corresponding TEST task');
      }
    });
  });
});
