const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  getFullState,
  getNextTask,
  getProgress,
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

    expect(listQueryIds()).toEqual(expect.arrayContaining(['full-state', 'next-task', 'progress']));
  });

  test('returns a named error for unknown query ids', async () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-query-unknown-'));

    await expect(runQuery('unknown-query', { repoRoot, changeId: 'REQ-127' })).resolves.toMatchObject({
      ok: false,
      queryId: 'unknown-query',
      error: {
        name: 'UnknownQueryError',
        rescueAction: 'use one of: full-state, next-task, progress, ship-readiness'
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
        rescueAction: 'create required runtime artifacts before running this query'
      },
      trace: {
        event: 'query.progress.failed',
        nextAction: 'create required runtime artifacts before running this query'
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
        rescueAction: 'repair or regenerate the invalid runtime artifact before running this query'
      },
      trace: {
        event: 'query.progress.failed',
        nextAction: 'repair or regenerate the invalid runtime artifact before running this query'
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
