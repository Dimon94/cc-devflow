const {
  deriveLifecycleStage,
  deriveLifecycleNextAction,
  classifyDelegationMode,
  deriveTaskProgress,
  getApprovalState,
  isTaskCompletedStatus,
  isTaskSettledStatus,
  normalizeTaskStatus,
  stageIndex
} = require('../lifecycle');

describe('lifecycle helpers', () => {
  test('derives approve stage from an unapproved planned manifest and switches to delegate after approval', () => {
    const state = {
      changeId: 'REQ-123',
      goal: 'Lock approval truth',
      status: 'planned',
      approval: {
        status: 'pending',
        executionMode: 'delegate'
      }
    };
    const manifest = {
      metadata: {
        planVersion: 3
      },
      tasks: [
        { id: 'T001', status: 'pending' }
      ]
    };

    expect(deriveLifecycleStage({ state, manifest, report: null, hasPrBrief: false })).toBe('approve');
    expect(getApprovalState(state, manifest)).toMatchObject({
      status: 'pending',
      executionMode: 'delegate',
      planVersion: 3
    });

    const approvedState = {
      ...state,
      approval: {
        status: 'approved',
        executionMode: 'delegate',
        planVersion: 3,
        approvedAt: '2026-04-09T05:00:00.000Z'
      }
    };

    expect(deriveLifecycleStage({ state: approvedState, manifest, report: null, hasPrBrief: false })).toBe('delegate');
    expect(stageIndex('approve')).toBeLessThan(stageIndex('delegate'));
  });

  test('keeps team mode explicit opt-in when routing tasks', () => {
    const task = {
      id: 'T900',
      title: 'Cross-module implementation',
      type: 'IMPL',
      dependsOn: ['T001', 'T002', 'T003'],
      touches: ['a.ts', 'b.ts', 'c.ts', 'd.ts'],
      run: ['echo one', 'echo two'],
      checks: []
    };

    expect(classifyDelegationMode(task, { approval: { executionMode: 'delegate' } })).toBe('delegate');
    expect(classifyDelegationMode(task, { approval: { executionMode: 'team' } })).toBe('team');
  });

  test('derives next action from shared lifecycle stage rules', () => {
    const state = {
      changeId: 'REQ-123',
      goal: 'Lock approval truth',
      status: 'planned',
      approval: {
        status: 'pending',
        executionMode: 'delegate'
      }
    };
    const manifest = {
      metadata: {
        planVersion: 3
      },
      tasks: [
        { id: 'T001', status: 'pending' },
        { id: 'T002', status: 'failed' }
      ]
    };

    expect(deriveLifecycleNextAction({ state: null, manifest: null, report: null })).toBe(
      '生成或刷新 task-manifest，然后回到批准闸。'
    );
    expect(deriveLifecycleNextAction({ state, manifest, report: null })).toBe(
      '先批准当前计划版本 3，再进入执行。'
    );

    const approvedState = {
      ...state,
      approval: {
        status: 'approved',
        executionMode: 'delegate',
        planVersion: 3,
        approvedAt: '2026-04-09T05:00:00.000Z'
      }
    };

    expect(deriveLifecycleNextAction({ state: approvedState, manifest, report: null })).toBe(
      '优先修复失败任务 T002，然后从最近稳定 checkpoint 恢复。'
    );
    expect(
      deriveLifecycleNextAction({
        state: approvedState,
        manifest: {
          ...manifest,
          tasks: [
            { id: 'T001', status: 'passed' }
          ]
        },
        report: { overall: 'pass' },
        hasPrBrief: true
      })
    ).toBe('PR brief 已生成，可直接整理提交并创建 PR。');
    expect(
      deriveLifecycleNextAction({
        state: approvedState,
        manifest: {
          ...manifest,
          tasks: [
            { id: 'T001', status: 'passed' }
          ]
        },
        report: { overall: 'pass' },
        hasReleaseNote: true
      })
    ).toBe('发布材料已经生成，可归档或启动下一轮增量。');
  });

  test('derives query progress from the shared task summary', () => {
    expect(
      deriveTaskProgress([
        { id: 'T001', status: 'pending' },
        { id: 'T002', status: 'running' },
        { id: 'T003', status: 'passed' },
        { id: 'T004', status: 'failed' },
        { id: 'T005', status: 'skipped' },
        { id: 'T006', status: 'custom-state' }
      ])
    ).toEqual({
      totalTasks: 6,
      completedTasks: 1,
      failedTasks: 1,
      pendingTasks: 1,
      runningTasks: 1,
      skippedTasks: 1
    });
  });

  test('normalizes legacy completion aliases into shared lifecycle semantics', () => {
    expect(normalizeTaskStatus('completed')).toBe('passed');
    expect(normalizeTaskStatus('done')).toBe('passed');
    expect(normalizeTaskStatus('verified')).toBe('passed');
    expect(isTaskCompletedStatus('passed')).toBe(true);
    expect(isTaskCompletedStatus('verified')).toBe(true);
    expect(isTaskCompletedStatus('skipped')).toBe(false);
    expect(isTaskSettledStatus('passed')).toBe(true);
    expect(isTaskSettledStatus('verified')).toBe(true);
    expect(isTaskSettledStatus('skipped')).toBe(true);
    expect(isTaskSettledStatus('failed')).toBe(false);
  });
});
