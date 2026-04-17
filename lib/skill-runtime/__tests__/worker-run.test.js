const fs = require('fs');
const os = require('os');
const path = require('path');

const { syncDelegationRuntime } = require('../delegation');
const {
  buildProviderPrompt,
  buildProviderCommand,
  runWorkerCommand
} = require('../operations/worker-run');
const { buildWorkerHandoff } = require('../delegation');

function createManifest() {
  return {
    changeId: 'REQ-123',
    goal: 'Run delegated worker command',
    createdAt: '2026-03-25T01:00:00.000Z',
    updatedAt: '2026-03-25T01:01:00.000Z',
    tasks: [
      {
        id: 'T002',
        title: 'Delegated task',
        type: 'IMPL',
        dependsOn: [],
        touches: ['src/a.ts', 'src/b.ts'],
        run: ['echo delegated'],
        checks: [],
        status: 'pending',
        attempts: 0,
        maxRetries: 1
      }
    ],
    metadata: {
      source: 'default',
      generatedBy: 'test',
      planVersion: 2
    }
  };
}

function createSharedWorkerManifest() {
  return {
    changeId: 'REQ-123',
    goal: 'Run delegated worker command',
    createdAt: '2026-03-25T01:00:00.000Z',
    updatedAt: '2026-03-25T01:01:00.000Z',
    tasks: [
      {
        id: 'T002',
        title: 'Delegated task one',
        type: 'IMPL',
        dependsOn: [],
        touches: ['src/a.ts', 'src/b.ts'],
        run: ['echo delegated-one'],
        checks: [],
        status: 'pending',
        attempts: 0,
        maxRetries: 1
      },
      {
        id: 'T003',
        title: 'Delegated task two',
        type: 'IMPL',
        dependsOn: [],
        touches: ['src/a.ts', 'src/b.ts'],
        run: ['echo delegated-two'],
        checks: [],
        status: 'pending',
        attempts: 0,
        maxRetries: 1
      }
    ],
    metadata: {
      source: 'default',
      generatedBy: 'test',
      planVersion: 2
    }
  };
}

function setupRepoRoot(prefix) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  fs.writeFileSync(
    path.join(repoRoot, 'package.json'),
    JSON.stringify({ name: 'worker-run-test', version: '1.0.0' }, null, 2)
  );
  fs.mkdirSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123'), { recursive: true });
  fs.writeFileSync(
    path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'runtime-state.json'),
    JSON.stringify({
      changeId: 'REQ-123',
      goal: 'Run delegated worker command',
      status: 'planned',
      initializedAt: '2026-03-25T01:00:00.000Z',
      plannedAt: '2026-03-25T01:01:00.000Z',
      updatedAt: '2026-03-25T01:01:00.000Z'
    }, null, 2)
  );
  return repoRoot;
}

function writeManifest(repoRoot, manifest) {
  fs.writeFileSync(
    path.join(repoRoot, 'devflow', 'requirements', manifest.changeId, 'task-manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

describe('runWorkerCommand', () => {
  test('builds thin provider launch commands for codex and claude', () => {
    const codexCommand = buildProviderCommand({
      provider: 'codex',
      providerPromptPath: '/tmp/provider.md',
      providerLastMessagePath: '/tmp/last-message.md',
      providerTranscriptPath: '/tmp/transcript.jsonl',
      workspace: '/tmp/worktree',
      providerArgs: '--model gpt-5'
    });
    const claudeCommand = buildProviderCommand({
      provider: 'claude',
      providerPromptPath: '/tmp/provider.md',
      providerLastMessagePath: '/tmp/last-message.md',
      providerTranscriptPath: '/tmp/transcript.jsonl',
      workspace: '/tmp/worktree',
      providerArgs: '--model sonnet --permission-mode bypassPermissions'
    });

    expect(codexCommand).toContain('cat');
    expect(codexCommand).toContain('codex exec');
    expect(codexCommand).toContain('--json');
    expect(codexCommand).toContain('--dangerously-bypass-approvals-and-sandbox');
    expect(codexCommand).toContain('/tmp/last-message.md');
    expect(codexCommand).toContain('tee');
    expect(codexCommand).toContain('/tmp/transcript.jsonl');
    expect(codexCommand).toContain('--model gpt-5');
    expect(claudeCommand).toContain('claude -p');
    expect(claudeCommand).toContain('--dangerously-skip-permissions');
    expect(claudeCommand).toContain('--permission-mode bypassPermissions');
  });

  test('runs local worker command and records completed session artifacts', async () => {
    const repoRoot = setupRepoRoot('cc-devflow-worker-run-pass-');
    const manifest = createManifest();
    writeManifest(repoRoot, manifest);
    const delegation = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);
    const workerId = delegation.assignments.find((item) => item.taskId === 'T002').workerId;

    const result = await runWorkerCommand({
      repoRoot,
      changeId: 'REQ-123',
      workerId,
      command: 'printf "worker-ok"'
    });

    const state = fs.readFileSync(result.sessionLogPath.replace('session.log', 'state.md'), 'utf8');
    const journal = fs.readFileSync(result.sessionLogPath.replace('session.log', 'journal.md'), 'utf8');
    const log = fs.readFileSync(result.sessionLogPath, 'utf8');
    const bus = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'message-bus.md'),
      'utf8'
    );
    const assignment = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'assignments', 'T002.md'),
      'utf8'
    );
    const taskResult = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T002.md'),
      'utf8'
    );
    const checkpoint = JSON.parse(
      fs.readFileSync(path.join(repoRoot, '.skill-runtime', 'runtime', 'REQ-123', 'T002', 'checkpoint.json'), 'utf8')
    );
    const events = fs.readFileSync(
      path.join(repoRoot, '.skill-runtime', 'runtime', 'REQ-123', 'T002', 'events.jsonl'),
      'utf8'
    );
    const nextManifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );
    const harnessState = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'runtime-state.json'), 'utf8')
    );

    expect(result.status).toBe('completed');
    expect(state).toContain('Status: `completed`');
    expect(journal).toContain('completed (exit 0)');
    expect(log).toContain('worker-ok');
    expect(bus).toContain(`${workerId} completed T002`);
    expect(assignment).toContain('Status: `completed`');
    expect(taskResult).toContain('Task Result: T002');
    expect(taskResult).toContain('Status: `passed`');
    expect(taskResult).toContain('## Output');
    expect(taskResult).toContain('worker-ok');
    expect(taskResult).toContain('transcript_path: n/a');
    expect(checkpoint.status).toBe('passed');
    expect(events).toContain('worker_run_started');
    expect(events).toContain('worker_run_passed');
    expect(nextManifest.tasks[0].status).toBe('passed');
    expect(harnessState.status).toBe('in_progress');
  });

  test('builds provider prompt from handoff bundle', async () => {
    const repoRoot = setupRepoRoot('cc-devflow-worker-run-provider-');
    const manifest = createManifest();
    writeManifest(repoRoot, manifest);
    const delegation = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);
    const workerId = delegation.assignments.find((item) => item.taskId === 'T002').workerId;
    const handoff = await buildWorkerHandoff(repoRoot, 'REQ-123', workerId);

    const providerPrompt = await buildProviderPrompt(handoff, 'T002');

    expect(providerPrompt).toContain('## Worker Prompt');
    expect(providerPrompt).toContain('## Launch');
    expect(providerPrompt).toContain('## Selected Assignment');
    expect(providerPrompt).toContain('Task: `T002`');
  });

  test('marks worker and assignment as failed when local command exits non-zero', async () => {
    const repoRoot = setupRepoRoot('cc-devflow-worker-run-fail-');
    const manifest = createManifest();
    writeManifest(repoRoot, manifest);
    const delegation = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);
    const workerId = delegation.assignments.find((item) => item.taskId === 'T002').workerId;

    const result = await runWorkerCommand({
      repoRoot,
      changeId: 'REQ-123',
      workerId,
      command: 'echo boom >&2 && exit 7'
    });

    const state = fs.readFileSync(result.sessionLogPath.replace('session.log', 'state.md'), 'utf8');
    const log = fs.readFileSync(result.sessionLogPath, 'utf8');
    const assignment = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'assignments', 'T002.md'),
      'utf8'
    );
    const taskResult = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'results', 'T002.md'),
      'utf8'
    );
    const failedManifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );

    expect(result.status).toBe('failed');
    expect(result.result.code).toBe(7);
    expect(state).toContain('Status: `failed`');
    expect(log).toContain('## stderr');
    expect(log).toContain('boom');
    expect(assignment).toContain('Status: `failed`');
    expect(taskResult).toContain('Status: `failed`');
    expect(taskResult).toContain('boom');
    expect(failedManifest.tasks[0].status).toBe('failed');
  });

  test('updates only the selected task when a worker owns multiple assignments', async () => {
    const repoRoot = setupRepoRoot('cc-devflow-worker-run-multi-');
    const manifest = createSharedWorkerManifest();
    writeManifest(repoRoot, manifest);
    const delegation = await syncDelegationRuntime(repoRoot, 'REQ-123', manifest);
    const workerId = delegation.assignments.find((item) => item.taskId === 'T002').workerId;

    expect(delegation.assignments.find((item) => item.taskId === 'T003').workerId).toBe(workerId);

    const result = await runWorkerCommand({
      repoRoot,
      changeId: 'REQ-123',
      workerId,
      taskId: 'T003',
      command: 'printf "worker-t003"'
    });

    const assignmentTwo = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'assignments', 'T002.md'),
      'utf8'
    );
    const assignmentThree = fs.readFileSync(
      path.join(repoRoot, 'devflow', 'intent', 'REQ-123', 'artifacts', 'assignments', 'T003.md'),
      'utf8'
    );

    expect(result.taskId).toBe('T003');
    expect(assignmentTwo).toContain('Status: `queued`');
    expect(assignmentTwo).not.toContain('worker-t003');
    expect(assignmentThree).toContain('Status: `completed`');
    expect(assignmentThree).toContain('worker-t003');
    const nextManifest = JSON.parse(
      fs.readFileSync(path.join(repoRoot, 'devflow', 'requirements', 'REQ-123', 'task-manifest.json'), 'utf8')
    );
    expect(nextManifest.tasks.find((task) => task.id === 'T002').status).toBe('pending');
    expect(nextManifest.tasks.find((task) => task.id === 'T003').status).toBe('passed');
  });
});
