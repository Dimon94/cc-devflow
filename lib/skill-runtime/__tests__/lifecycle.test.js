const {
  deriveLifecycleStage,
  classifyDelegationMode,
  getApprovalState,
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
});
