const { parseManifest } = require('../schemas');

describe('Manifest schema hard constraints', () => {
  test('accepts a tasks.md manifest with review and context metadata', () => {
    const manifest = parseManifest({
      changeId: 'REQ-555',
      goal: 'Validate schema contract',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T001',
      tasks: [
        {
          id: 'T001',
          title: '[TEST] Counter behavior',
          type: 'TEST',
          phase: 1,
          parallel: false,
          dependsOn: [],
          touches: ['src/counter.test.ts'],
          files: ['src/counter.test.ts'],
          run: ['echo "[TASK T001] Counter behavior"'],
          checks: ['npm test -- src/counter.test.ts'],
          acceptance: ['Prove counter behavior fails first'],
          verification: ['npm test -- src/counter.test.ts'],
          evidence: ['failing test output'],
          context: {
            readFiles: ['design.md', 'tasks.md'],
            commands: ['npm test -- src/counter.test.ts'],
            notes: ['Start from red']
          },
          reviews: {
            spec: 'pending',
            code: 'pending'
          },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: '[IMPL] Counter behavior',
          type: 'IMPL',
          phase: 1,
          parallel: false,
          dependsOn: ['T001'],
          touches: ['src/counter.ts'],
          files: ['src/counter.ts'],
          run: ['echo "[TASK T002] Counter behavior"'],
          checks: ['npm test -- src/counter.test.ts'],
          acceptance: ['Make counter behavior pass'],
          verification: ['npm test -- src/counter.test.ts'],
          evidence: ['passing test output'],
          context: {
            readFiles: ['design.md', 'src/counter.test.ts'],
            commands: ['npm test -- src/counter.test.ts'],
            notes: ['Smallest green implementation']
          },
          reviews: {
            spec: 'pending',
            code: 'pending'
          },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'tasks.md',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    expect(manifest.currentTaskId).toBe('T001');
    expect(manifest.activePhase).toBeUndefined();
  });

  test('accepts legacy activePhase input without preserving the retired field', () => {
    const manifest = parseManifest({
      changeId: 'REQ-560',
      goal: 'Validate legacy manifest compatibility',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T001',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: '[TEST] Counter behavior',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          run: ['echo ok'],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    expect(manifest.currentTaskId).toBe('T001');
    expect(manifest.activePhase).toBeUndefined();
  });

  test('rejects invalid currentTaskId for tasks.md manifest', () => {
    expect(() => parseManifest({
      changeId: 'REQ-556',
      goal: 'Reject invalid current task',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T999',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: '[TEST] Counter behavior',
          type: 'TEST',
          phase: 1,
          dependsOn: [],
          run: ['echo ok'],
          checks: ['npm test -- src/counter.test.ts'],
          acceptance: ['Prove failure'],
          verification: ['npm test -- src/counter.test.ts'],
          evidence: ['failing test output'],
          context: {
            readFiles: ['design.md'],
            commands: ['npm test -- src/counter.test.ts'],
            notes: []
          },
          reviews: {
            spec: 'pending',
            code: 'pending'
          },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'tasks.md',
        generatedBy: 'test',
        planVersion: 1
      }
    })).toThrow(/currentTaskId T999 is not present/);
  });

  test('accepts FIX ids and rejects legacy BUG ids', () => {
    const baseManifest = {
      goal: 'Validate fix id',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T001',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: 'Bootstrap fix',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          run: ['echo ok'],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    };

    expect(parseManifest({ ...baseManifest, changeId: 'FIX-556' }).changeId).toBe('FIX-556');
    expect(() => parseManifest({ ...baseManifest, changeId: 'BUG-556' })).toThrow(/Invalid changeId format/);
  });

  test('accepts current full change keys and review/verification task types', () => {
    const manifest = parseManifest({
      changeId: 'REQ-001-personal-output-config',
      goal: 'Validate current manifest shape',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T007',
      tasks: [
        {
          id: 'T007',
          title: '[REFACTOR] Apply review fixes',
          type: 'REFACTOR',
          phase: 4,
          dependsOn: [],
          run: ['echo ok'],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T008',
          title: '[VERIFY] Run full gates',
          type: 'VERIFY',
          phase: 4,
          dependsOn: ['T007'],
          run: ['npm test'],
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'planning/tasks.md',
        generatedBy: 'cc-plan',
        planVersion: 1
      }
    });

    expect(manifest.changeId).toBe('REQ-001-personal-output-config');
    expect(manifest.tasks.map((task) => task.type)).toEqual(['REFACTOR', 'VERIFY']);
    expect(manifest.metadata.source).toBe('planning/tasks.md');
  });

  test('rejects conflicting parallel tasks that share touches in same phase', () => {
    expect(() => parseManifest({
      changeId: 'REQ-557',
      goal: 'Reject bad parallel plan',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T001',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: '[TEST] A',
          type: 'TEST',
          phase: 1,
          parallel: true,
          dependsOn: [],
          touches: ['src/shared.ts'],
          run: ['echo ok'],
          checks: ['npm test -- a'],
          acceptance: ['Prove A fails'],
          verification: ['npm test -- a'],
          evidence: ['failing output'],
          context: { readFiles: ['design.md'], commands: ['npm test -- a'], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: '[TEST] B',
          type: 'TEST',
          phase: 1,
          parallel: true,
          dependsOn: [],
          touches: ['src/shared.ts'],
          run: ['echo ok'],
          checks: ['npm test -- b'],
          acceptance: ['Prove B fails'],
          verification: ['npm test -- b'],
          evidence: ['failing output'],
          context: { readFiles: ['design.md'], commands: ['npm test -- b'], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'tasks.md',
        generatedBy: 'test',
        planVersion: 1
      }
    })).toThrow(/share touches/);
  });

  test('rejects conflicting parallel tasks with nested touches in same phase', () => {
    expect(() => parseManifest({
      changeId: 'REQ-558',
      goal: 'Reject nested parallel plan',
      createdAt: '2026-04-10T01:00:00.000Z',
      updatedAt: '2026-04-10T01:05:00.000Z',
      currentTaskId: 'T001',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: '[TEST] A',
          type: 'TEST',
          phase: 1,
          parallel: true,
          dependsOn: [],
          touches: ['packages/billing'],
          run: ['echo ok'],
          checks: ['npm test -- a'],
          acceptance: ['Prove A fails'],
          verification: ['npm test -- a'],
          evidence: ['failing output'],
          context: { readFiles: ['design.md'], commands: ['npm test -- a'], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: '[TEST] B',
          type: 'TEST',
          phase: 1,
          parallel: true,
          dependsOn: [],
          touches: ['packages/billing/src/invoices.js'],
          run: ['echo ok'],
          checks: ['npm test -- b'],
          acceptance: ['Prove B fails'],
          verification: ['npm test -- b'],
          evidence: ['failing output'],
          context: { readFiles: ['design.md'], commands: ['npm test -- b'], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'tasks.md',
        generatedBy: 'test',
        planVersion: 1
      }
    })).toThrow(/share touches: packages\/billing/);
  });
});
