/**
 * TDD Order Validation Tests
 *
 * Tests for Constitution Article VI enforcement in planner.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const { parseTasksMarkdown, createTaskManifest, deriveManifestExecutionState } = require('../planner');

describe('TDD Order Validation', () => {
  describe('Rich task metadata parsing', () => {
    test('should preserve phase, files, acceptance, verification, evidence and context', () => {
      const markdown = `
## Phase 1: Foundation

- [ ] T001 [TEST] Counter behavior (dependsOn:none) \`src/counter.test.ts\`
  Goal: prove the current behavior is broken first
  Files: \`src/counter.test.ts\`
  Read first: \`DESIGN.md\`, \`TASKS.md\`
  Verification: npm test -- src/counter.test.ts
  Evidence: failing output, screenshot

- [ ] T002 [P] [IMPL] Counter behavior (dependsOn:T001) \`src/counter.ts\`
  Goal: make the counter test pass
  Files: \`src/counter.ts\`
  Read first: \`DESIGN.md\`, \`src/counter.test.ts\`
  Verification: npm test -- src/counter.test.ts
  Evidence: passing output, review notes
      `.trim();

      const tasks = parseTasksMarkdown(markdown);

      expect(tasks).toHaveLength(2);
      expect(tasks[0]).toMatchObject({
        id: 'T001',
        phase: 1,
        parallel: false,
        type: 'TEST',
        files: ['src/counter.test.ts'],
        touches: ['src/counter.test.ts'],
        acceptance: ['prove the current behavior is broken first'],
        verification: ['npm test -- src/counter.test.ts'],
        evidence: ['failing output', 'screenshot'],
        reviews: { spec: 'pending', code: 'pending' }
      });
      expect(tasks[0].checks).toContain('npm test -- src/counter.test.ts');
      expect(tasks[0].context.readFiles).toEqual(['DESIGN.md', 'TASKS.md']);
      expect(tasks[0].context.commands).toContain('npm test -- src/counter.test.ts');

      expect(tasks[1]).toMatchObject({
        id: 'T002',
        phase: 1,
        parallel: true,
        type: 'IMPL',
        files: ['src/counter.ts'],
        touches: ['src/counter.ts'],
        acceptance: ['make the counter test pass'],
        verification: ['npm test -- src/counter.test.ts'],
        evidence: ['passing output', 'review notes']
      });
      expect(tasks[1].context.readFiles).toEqual(['DESIGN.md', 'src/counter.test.ts']);
    });

    test('should backfill minimum metadata for TEST and IMPL tasks from plain TASKS lines', () => {
      const markdown = `
## Phase 1: Build

- [ ] T001 [TEST] Counter behavior \`src/counter.test.ts\`
- [ ] T002 [IMPL] Counter behavior (dependsOn:T001) \`src/counter.ts\`
      `.trim();

      const tasks = parseTasksMarkdown(markdown);

      expect(tasks[0].acceptance).toEqual(['Prove Counter behavior fails before implementation']);
      expect(tasks[0].verification).toEqual(['npm test -- src/counter.test.ts']);
      expect(tasks[0].evidence).toEqual(['failing test output']);
      expect(tasks[0].context.readFiles).toEqual(['DESIGN.md', 'TASKS.md', 'src/counter.test.ts']);

      expect(tasks[1].acceptance).toEqual(['Make Counter behavior pass with the smallest implementation']);
      expect(tasks[1].verification).toEqual(['echo "verify T002"']);
      expect(tasks[1].evidence).toEqual(['passing test output']);
      expect(tasks[1].context.readFiles).toEqual(['DESIGN.md']);
    });
  });

  describe('Manifest execution state', () => {
    test('should derive active phase and current task from ready tasks', () => {
      const state = deriveManifestExecutionState([
        { id: 'T001', phase: 1, status: 'passed', dependsOn: [] },
        { id: 'T002', phase: 2, status: 'pending', dependsOn: ['T001'] },
        { id: 'T003', phase: 2, status: 'pending', dependsOn: ['T002'] }
      ]);

      expect(state).toEqual({
        currentTaskId: 'T002',
        activePhase: 2
      });
    });

    test('should write currentTaskId and activePhase into manifest', async () => {
      const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-planner-'));
      const changeId = 'REQ-321';
      const reqDir = path.join(repoRoot, 'devflow', 'requirements', changeId);
      fs.mkdirSync(reqDir, { recursive: true });

      fs.writeFileSync(
        path.join(reqDir, 'TASKS.md'),
        [
          '## Phase 1: Foundation',
          '',
          '- [x] T001 [TEST] Setup smoke test `src/setup.test.ts`',
          '- [ ] T002 [IMPL] Setup smoke test (dependsOn:T001) `src/setup.ts`',
          '',
          '## Phase 2: Verify',
          '',
          '- [ ] T003 Run final verification'
        ].join('\n')
      );

      const manifest = await createTaskManifest({
        repoRoot,
        changeId,
        goal: 'Exercise manifest execution state',
        overwrite: true
      });

      expect(manifest.activePhase).toBe(1);
      expect(manifest.currentTaskId).toBe('T002');
      expect(manifest.tasks[1].reviews).toEqual({ spec: 'pending', code: 'pending' });
    });
  });

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
