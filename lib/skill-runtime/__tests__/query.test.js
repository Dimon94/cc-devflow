const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getFullState,
  getNextTask,
  getProgress,
  getWorkflowContext,
  listQueryIds,
  runQuery
} = require('../query');
const {
  getRuntimeStatePath,
  getTaskManifestPath,
  getReportCardPath
} = require('../store');
const { getIntentPrBriefPath } = require('../artifacts');

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe('query helpers', () => {
  test('reuses shared lifecycle progress semantics', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-progress-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-122'), {
      changeId: 'REQ-122',
      goal: 'Expose shared progress summary',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        { id: 'T001', status: 'pending' },
        { id: 'T002', status: 'running' },
        { id: 'T003', status: 'passed' },
        { id: 'T004', status: 'failed' },
        { id: 'T005', status: 'skipped' },
        { id: 'T006', status: 'legacy' }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(getProgress(repoRoot, 'REQ-122')).resolves.toEqual({
      totalTasks: 6,
      completedTasks: 1,
      failedTasks: 1,
      pendingTasks: 1,
      runningTasks: 1,
      skippedTasks: 1
    });
  });

  test('reports approve stage when a planned manifest exists without approval', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-approve-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose approval gate',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      approval: {
        status: 'pending',
        executionMode: 'delegate'
      },
      updatedAt: '2026-03-25T01:05:00.000Z'
    });

    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose approval gate',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Pending',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['echo ok'],
          checks: [],
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

    const state = await getFullState(repoRoot, 'REQ-123');

    expect(state.lifecycle.stage).toBe('approve');
    expect(state.lifecycle.approval).toMatchObject({
      status: 'pending',
      executionMode: 'delegate',
      planVersion: 1
    });
  });

  test('reports prepare-pr stage and pr brief path when PR-ready artifact exists', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-'));

    writeJson(getRuntimeStatePath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose query stage',
      status: 'verified',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:05:00.000Z',
      verifiedAt: '2026-03-25T01:10:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z'
    });

    writeJson(getTaskManifestPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      goal: 'Expose query stage',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        {
          id: 'T001',
          title: 'Done',
          type: 'IMPL',
          dependsOn: [],
          touches: ['src/a.ts'],
          run: ['echo ok'],
          checks: [],
          status: 'passed',
          attempts: 1,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    writeJson(getReportCardPath(repoRoot, 'REQ-123'), {
      changeId: 'REQ-123',
      overall: 'pass',
      quickGates: [],
      strictGates: [],
      review: { status: 'pass', details: '' },
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    fs.mkdirSync(path.dirname(getIntentPrBriefPath(repoRoot, 'REQ-123')), { recursive: true });
    fs.writeFileSync(getIntentPrBriefPath(repoRoot, 'REQ-123'), '# PR Brief: REQ-123\n');

    const state = await getFullState(repoRoot, 'REQ-123');

    expect(state.lifecycle.stage).toBe('prepare-pr');
    expect(state.delivery.prBriefPath).toBe(getIntentPrBriefPath(repoRoot, 'REQ-123'));
  });

  test('returns the ready task instead of the first pending task', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-next-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-124'), {
      changeId: 'REQ-124',
      goal: 'Expose dependency-aware next task',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      currentTaskId: 'T002',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: 'Blocked task',
          type: 'OTHER',
          phase: 1,
          dependsOn: ['T999'],
          touches: ['src/a.ts'],
          files: [],
          run: ['echo blocked'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: 'Ready task',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          touches: ['src/b.ts'],
          files: [],
          run: ['echo ready'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
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

    const next = await getNextTask(repoRoot, 'REQ-124');

    expect(next.id).toBe('T002');
  });

  test('treats legacy passed aliases as completed dependencies via shared lifecycle semantics', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-legacy-next-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-125'), {
      changeId: 'REQ-125',
      goal: 'Reuse shared task completion aliases',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      activePhase: 1,
      tasks: [
        {
          id: 'T001',
          title: 'Legacy completed prerequisite',
          type: 'OTHER',
          phase: 1,
          dependsOn: [],
          touches: ['src/a.ts'],
          files: [],
          run: ['echo done'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
          status: 'verified',
          attempts: 1,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: 'Ready after legacy prerequisite',
          type: 'OTHER',
          phase: 1,
          dependsOn: ['T001'],
          touches: ['src/b.ts'],
          files: [],
          run: ['echo ready'],
          checks: [],
          acceptance: [],
          verification: [],
          evidence: [],
          context: { readFiles: [], commands: [], notes: [] },
          reviews: { spec: 'pending', code: 'pending' },
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

    const next = await getNextTask(repoRoot, 'REQ-125');

    expect(next.id).toBe('T002');
  });

  test('returns compact workflow context for the current ready task', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-workflow-context-'));
    const manifestPath = getTaskManifestPath(repoRoot, 'REQ-126');
    const planningDir = path.dirname(manifestPath);
    const changeDir = path.dirname(planningDir);

    fs.mkdirSync(planningDir, { recursive: true });
    fs.writeFileSync(path.join(planningDir, 'design.md'), '# Design\n');
    fs.writeFileSync(path.join(planningDir, 'tasks.md'), '# Tasks\n');
    writeJson(path.join(changeDir, 'change-meta.json'), {
      spec: {
        primaryCapability: 'cap-compact-context',
        syncStatus: 'planned'
      }
    });
    writeJson(manifestPath, {
      changeId: 'REQ-126',
      goal: 'Expose compact workflow context',
      createdAt: '2026-05-12T01:00:00.000Z',
      updatedAt: '2026-05-12T01:05:00.000Z',
      currentTaskId: 'T002',
      planningMeta: {
        reqPlanSkillVersion: '3.8.8'
      },
      tasks: [
        {
          id: 'T001',
          title: 'Completed test task',
          type: 'TEST',
          phase: 1,
          dependsOn: [],
          touches: ['src/feature.test.ts'],
          files: ['src/feature.test.ts'],
          run: ['npm test -- src/feature.test.ts'],
          checks: [],
          acceptance: [],
          verification: ['npm test -- src/feature.test.ts'],
          evidence: ['red output'],
          context: { readFiles: ['planning/design.md'], commands: ['npm test -- src/feature.test.ts'], notes: [] },
          status: 'passed',
          attempts: 1,
          maxRetries: 1
        },
        {
          id: 'T002',
          title: 'Implement compact context',
          type: 'IMPL',
          phase: 1,
          dependsOn: ['T001'],
          touches: ['lib/skill-runtime/query.js'],
          files: ['lib/skill-runtime/query.js'],
          run: ['npm test -- lib/skill-runtime/__tests__/query.test.js'],
          checks: [],
          acceptance: [],
          verification: ['npm test -- lib/skill-runtime/__tests__/query.test.js'],
          evidence: ['green output'],
          context: {
            readFiles: ['design.md', 'tasks.md', 'change-meta.json', 'lib/skill-runtime/query.js'],
            commands: ['npm test -- lib/skill-runtime/__tests__/query.test.js'],
            notes: ['Read the context index before opening deep docs']
          },
          status: 'pending',
          attempts: 0,
          maxRetries: 1
        }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 2
      }
    });

    const context = await getWorkflowContext(repoRoot, 'REQ-126');

    expect(context.nextAction).toMatchObject({
      skill: 'cc-do',
      action: 'execute-current-task',
      taskId: 'T002'
    });
    expect(context.currentTask).toMatchObject({
      id: 'T002',
      context: {
        readFiles: expect.arrayContaining(['design.md', 'tasks.md', 'change-meta.json', 'lib/skill-runtime/query.js'])
      }
    });
    expect(context.progressiveDisclosure).toMatchObject({
      mode: 'compact-first',
      rule: expect.stringContaining('context index'),
      packetOnly: {
        contractDigest: expect.any(String),
        manifestDigest: expect.any(String),
        currentTaskDigest: expect.any(String),
        evidenceDigest: expect.any(String),
        mustNotForgetDigest: expect.any(String)
      }
    });
    expect(context.source.manifest).toMatchObject({
      path: expect.stringContaining('planning/task-manifest.json'),
      hash: expect.stringMatching(/^sha256:/)
    });
    expect(context.progressiveDisclosure.sourceHashes).toEqual(expect.objectContaining({
      [context.source.manifest.path]: expect.stringMatching(/^sha256:/)
    }));
    expect(context.progressiveDisclosure.mustNotForget).toMatchObject({
      goal: {
        value: 'Expose compact workflow context',
        source: {
          ref: expect.stringContaining('planning/task-manifest.json#/goal'),
          hash: expect.stringMatching(/^sha256:/)
        }
      },
      nonNegotiables: expect.arrayContaining([
        expect.objectContaining({
          value: expect.stringContaining('read-only'),
          source: expect.objectContaining({ ref: expect.any(String) })
        })
      ]),
      acceptanceGates: expect.arrayContaining([
        expect.objectContaining({
          value: 'npm test -- lib/skill-runtime/__tests__/query.test.js',
          source: expect.objectContaining({ ref: expect.stringContaining('planning/task-manifest.json#/tasks/T002') })
        })
      ])
    });
    expect(context.progressiveDisclosure.defaultOpen).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ref: expect.stringContaining('planning/design.md#design'),
        reason: 'primary task contract',
        exists: true,
        sourceHash: expect.stringMatching(/^sha256:/)
      }),
      expect.objectContaining({
        ref: expect.stringContaining('planning/task-manifest.json#/tasks/T002'),
        reason: 'current task source of truth',
        sourceHash: expect.stringMatching(/^sha256:/)
      }),
      expect.objectContaining({
        ref: expect.stringContaining('change-meta.json#/spec')
      })
    ]));
    expect(context.progressiveDisclosure.defaultOpen.every((entry) => entry.exists === true)).toBe(true);
    expect(context.progressiveDisclosure.defaultRead).toBeUndefined();
    expect(context.progressiveDisclosure.deepOpen).toEqual(expect.arrayContaining([
      expect.objectContaining({
        when: 'scope_or_contract_uncertain',
        conditions: expect.arrayContaining(['confidence.scope < 0.85']),
        refs: expect.arrayContaining([
          expect.objectContaining({ ref: expect.stringContaining('planning/design.md') })
        ])
      }),
      expect.objectContaining({
        when: 'implementation_details_needed',
        refs: expect.arrayContaining([
          expect.objectContaining({ ref: 'lib/skill-runtime/query.js' })
        ])
      })
    ]));
    expect(context.progressiveDisclosure.defaultOpen).not.toEqual(expect.arrayContaining([
      'design.md',
      'tasks.md',
      'change-meta.json'
    ]));
    expect(context.progressiveDisclosure.commandsToTrust).toContain('npm test -- lib/skill-runtime/__tests__/query.test.js');
    expect(context.progressiveDisclosure.openWhen).toEqual(expect.arrayContaining([
      expect.objectContaining({
        trigger: expect.stringContaining('all tasks are complete'),
        conditions: expect.arrayContaining(['nextAction.skill == cc-act'])
      })
    ]));
    expect(context.planningMeta).toMatchObject({
      reqPlanSkillVersion: '3.8.8',
      sourceCapability: 'cap-compact-context',
      specSyncStatus: 'planned'
    });
  });

  test('routes compact workflow context through check and act after execution', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-workflow-terminal-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-127'), {
      changeId: 'REQ-127',
      goal: 'Expose terminal workflow routing',
      createdAt: '2026-05-12T01:00:00.000Z',
      updatedAt: '2026-05-12T01:05:00.000Z',
      tasks: [
        {
          id: 'T001',
          status: 'passed',
          verification: ['npm test -- final.test.js'],
          context: {
            commands: ['npm test -- final.test.js']
          }
        }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-127')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-check',
        action: 'build-fresh-verdict'
      },
      progressiveDisclosure: {
        commandsToTrust: ['npm test -- final.test.js']
      }
    });

    writeJson(getReportCardPath(repoRoot, 'REQ-127'), {
      changeId: 'REQ-127',
      verdict: 'pass',
      overall: 'pass',
      reroute: 'none',
      specSyncReady: false,
      blockingFindings: [],
      timestamp: '2026-05-12T01:10:00.000Z'
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-127')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-check',
        action: 'build-fresh-verdict',
        blockers: expect.arrayContaining(['specSyncReady is not true'])
      }
    });

    writeJson(getReportCardPath(repoRoot, 'REQ-127'), {
      changeId: 'REQ-127',
      verdict: 'pass',
      overall: 'pass',
      reroute: 'none',
      specSyncReady: true,
      blockingFindings: [],
      timestamp: '2026-05-12T01:11:00.000Z'
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-127')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-act',
        action: 'ship-or-handoff'
      }
    });
  });

  test('resumes current running task before selecting another ready task', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-workflow-resume-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-130'), {
      changeId: 'REQ-130',
      currentTaskId: 'T002',
      tasks: [
        { id: 'T001', status: 'passed' },
        {
          id: 'T002',
          status: 'running',
          dependsOn: ['T001'],
          verification: ['npm test -- src/current.test.ts'],
          context: {
            commands: ['npm test -- src/current.test.ts']
          }
        },
        {
          id: 'T003',
          status: 'pending',
          dependsOn: ['T001'],
          verification: ['npm test -- src/ready.test.ts'],
          context: {
            commands: ['npm test -- src/ready.test.ts']
          }
        }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-130')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-do',
        action: 'resume-current-task',
        taskId: 'T002'
      },
      currentTask: {
        id: 'T002',
        status: 'running'
      }
    });
  });

  test('resumes inferred running task before selecting ready task when currentTaskId is missing', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-workflow-inferred-resume-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-132'), {
      changeId: 'REQ-132',
      tasks: [
        { id: 'T001', status: 'passed' },
        {
          id: 'T002',
          status: 'running',
          dependsOn: ['T001'],
          verification: ['npm test -- src/current.test.ts'],
          context: {
            commands: ['npm test -- src/current.test.ts']
          }
        },
        {
          id: 'T003',
          status: 'pending',
          dependsOn: ['T001'],
          verification: ['npm test -- src/ready.test.ts'],
          context: {
            commands: ['npm test -- src/ready.test.ts']
          }
        }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-132')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-do',
        action: 'resume-current-task',
        taskId: 'T002'
      },
      currentTask: {
        id: 'T002',
        status: 'running'
      }
    });
  });

  test('reports missing verification commands instead of trusting the query command', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-workflow-missing-commands-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-131'), {
      changeId: 'REQ-131',
      currentTaskId: 'T001',
      tasks: [
        {
          id: 'T001',
          status: 'pending',
          context: {
            readFiles: ['design.md']
          }
        }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(getWorkflowContext(repoRoot, 'REQ-131')).resolves.toMatchObject({
      nextAction: {
        skill: 'cc-plan',
        action: 'repair-task-verification',
        taskId: 'T001'
      },
      progressiveDisclosure: {
        commandsToTrust: [],
        missingVerificationCommands: true,
        manifestIssue: 'current task has no executable verification command',
        failClosed: expect.arrayContaining([
          expect.stringContaining('verification command is missing')
        ])
      }
    });
  });

  test('dispatches typed query ids with trace metadata', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-registry-'));

    writeJson(getTaskManifestPath(repoRoot, 'REQ-126'), {
      changeId: 'REQ-126',
      goal: 'Expose typed query registry',
      createdAt: '2026-03-25T01:05:00.000Z',
      updatedAt: '2026-03-25T01:10:00.000Z',
      tasks: [
        { id: 'T001', status: 'pending' }
      ],
      metadata: {
        source: 'default',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(runQuery('progress', { repoRoot, changeId: 'REQ-126' })).resolves.toMatchObject({
      ok: true,
      queryId: 'progress',
      data: {
        totalTasks: 1,
        pendingTasks: 1
      },
      trace: {
        artifactRefs: expect.arrayContaining([
          expect.stringContaining('task-manifest.json')
        ]),
        nextAction: 'read-query-result'
      }
    });

    expect(listQueryIds()).toEqual(expect.arrayContaining(['full-state', 'next-task', 'progress', 'workflow-context']));
  });

  test('requires a full change key when duplicate local numbers exist', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-duplicate-key-'));
    const firstKey = 'REQ-132-first-plan';
    const secondKey = 'REQ-132-second-plan';

    fs.mkdirSync(path.join(repoRoot, 'devflow', 'changes', firstKey), { recursive: true });
    writeJson(getTaskManifestPath(repoRoot, 'REQ-132', { changeKey: secondKey }), {
      changeId: 'REQ-132',
      goal: 'Resolve duplicate local numbers',
      createdAt: '2026-05-08T01:00:00.000Z',
      updatedAt: '2026-05-08T01:05:00.000Z',
      tasks: [
        { id: 'T001', status: 'passed' },
        { id: 'T002', status: 'pending' }
      ],
      metadata: {
        source: 'test',
        generatedBy: 'test',
        planVersion: 1
      }
    });

    await expect(runQuery('progress', { repoRoot, changeId: 'REQ-132' })).resolves.toMatchObject({
      ok: false,
      queryId: 'progress',
      error: {
        message: expect.stringContaining('Ambiguous changeId "REQ-132"')
      },
      trace: {
        event: 'query.progress.failed',
        nextAction: 'inspect-workflow-artifacts'
      }
    });

    await expect(runQuery('progress', {
      repoRoot,
      changeId: 'REQ-132',
      changeKey: secondKey
    })).resolves.toMatchObject({
      ok: true,
      queryId: 'progress',
      data: {
        totalTasks: 2,
        completedTasks: 1,
        pendingTasks: 1
      }
    });
  });

  test('returns a named error for unknown query ids', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-unknown-'));

    await expect(runQuery('unknown-query', { repoRoot, changeId: 'REQ-127' })).resolves.toMatchObject({
      ok: false,
      queryId: 'unknown-query',
      error: {
        name: 'UnknownQueryError',
        rescueAction: 'use one of: full-state, next-task, progress, ship-readiness, workflow-context'
      },
      trace: {
        nextAction: 'choose-supported-query'
      }
    });
  });

  test('returns a named error when typed queries miss required artifacts', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-missing-manifest-'));

    await expect(runQuery('progress', { repoRoot, changeId: 'REQ-130' })).resolves.toMatchObject({
      ok: false,
      queryId: 'progress',
      error: {
        name: 'MissingQueryArtifactError',
        artifactRefs: [
          expect.stringContaining('task-manifest.json')
        ],
        rescueAction: 'create required workflow artifacts before running this query'
      },
      trace: {
        event: 'query.progress.failed',
        nextAction: 'create required workflow artifacts before running this query'
      }
    });
  });

  test('returns a named error when required query artifacts are malformed', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-invalid-manifest-'));
    const manifestPath = getTaskManifestPath(repoRoot, 'REQ-131');
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, '{bad json\n');

    await expect(runQuery('progress', { repoRoot, changeId: 'REQ-131' })).resolves.toMatchObject({
      ok: false,
      queryId: 'progress',
      error: {
        name: 'InvalidQueryArtifactError',
        artifactRefs: [
          expect.stringContaining('task-manifest.json')
        ],
        rescueAction: 'repair or regenerate the invalid workflow artifact before running this query'
      },
      trace: {
        event: 'query.progress.failed',
        nextAction: 'repair or regenerate the invalid workflow artifact before running this query'
      }
    });
  });

  test('returns MissingReportCardError for ship readiness without report card', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-missing-report-'));

    await expect(runQuery('ship-readiness', { repoRoot, changeId: 'REQ-128' })).resolves.toMatchObject({
      ok: false,
      queryId: 'ship-readiness',
      error: {
        name: 'MissingReportCardError',
        artifactRefs: [
          expect.stringContaining('report-card.json')
        ],
        rescueAction: 'run cc-check and create review/report-card.json before cc-act'
      },
      trace: {
        nextAction: 'run cc-check and create review/report-card.json before cc-act'
      }
    });
  });

  test('reports ship readiness from report-card truth', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-ship-ready-'));

    writeJson(getReportCardPath(repoRoot, 'REQ-129'), {
      changeId: 'REQ-129',
      verdict: 'pass',
      overall: 'pass',
      reroute: 'none',
      specSyncReady: true,
      blockingFindings: [],
      timestamp: '2026-03-25T01:11:00.000Z'
    });

    await expect(runQuery('ship-readiness', { repoRoot, changeId: 'REQ-129' })).resolves.toMatchObject({
      ok: true,
      queryId: 'ship-readiness',
      data: {
        ready: true,
        verdict: 'pass',
        reroute: 'none',
        specSyncReady: true,
        blockers: []
      }
    });
  });
});
