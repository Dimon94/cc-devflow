/**
 * [INPUT]: 依赖 manifest 与 canonical devflow 路径，依赖 store 的文件读写能力，接收 repoRoot/changeId 以生成本地委派骨架。
 * [OUTPUT]: 对外提供 assignment/team-memory/message-bus/team-state 真相源与 worker workspace 管理能力。
 * [POS]: skill runtime 的本地委派桥接层，把 delegate/team 语义落成可恢复、可扫描的本地工件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');
const {
  ensureDir,
  writeText,
  exists,
  readText,
  runCommand,
  nowIso
} = require('./store');
const { classifyDelegationMode } = require('./lifecycle');
const {
  readTeamState,
  writeTeamState,
  buildInitialTeamState
} = require('./team-state');
const {
  getChangePaths,
  getTaskPaths,
  getWorkerPaths
} = require('./paths');

function getAssignmentsDir(repoRoot, changeId) {
  return getChangePaths(repoRoot, changeId).workersDir;
}

function getTeamMemoryPath(repoRoot, changeId) {
  return path.join(getChangePaths(repoRoot, changeId).executionDir, 'team-memory.md');
}

function getMessageBusPath(repoRoot, changeId) {
  return path.join(getChangePaths(repoRoot, changeId).executionDir, 'message-bus.md');
}

function getWorkerWorkspacePath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).workspacePath;
}

function getWorkersDir(repoRoot, changeId) {
  return getChangePaths(repoRoot, changeId).workersDir;
}

function getWorkerDir(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).workerDir;
}

function getWorkerAssignmentPath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).assignmentPath;
}

function getWorkerStatePath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).statePath;
}

function getWorkerPromptPath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).promptPath;
}

function getWorkerJournalPath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).journalPath;
}

function getWorkerLaunchPath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).launchPath;
}

function getWorkerSessionLogPath(repoRoot, changeId, workerId) {
  return getWorkerPaths(repoRoot, changeId, workerId).sessionLogPath;
}

function guessWorkerRole(task) {
  if (task.type === 'TEST') {
    return 'qa-reviewer';
  }
  if (task.type === 'IMPL') {
    return 'dev-implementer';
  }
  return 'operator';
}

function buildOwnershipKey(task, state) {
  return JSON.stringify([
    classifyDelegationMode(task, state || {}),
    guessWorkerRole(task),
    [...(task.touches || [])].sort()
  ]);
}

function allocateWorkers(tasks, state) {
  const workerMap = new Map();
  const assignments = [];
  let sequence = 1;

  for (const task of tasks) {
    const route = classifyDelegationMode(task, state || {});
    if (route === 'direct') {
      assignments.push({
        taskId: task.id,
        route,
        workerId: 'main-agent',
        role: 'controller'
      });
      continue;
    }

    const key = buildOwnershipKey(task, state);
    if (!workerMap.has(key)) {
      const workerId = `${route}-${String(sequence).padStart(2, '0')}`;
      workerMap.set(key, {
        workerId,
        role: guessWorkerRole(task)
      });
      sequence += 1;
    }

    assignments.push({
      taskId: task.id,
      route,
      ...workerMap.get(key)
    });
  }

  return assignments;
}

async function detectCurrentBranch(repoRoot) {
  const branch = await runCommand('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot });
  return branch.code === 0 ? branch.stdout.trim() : 'unknown';
}

function getSuggestedWorktreePath(repoRoot, changeId, workerId) {
  return getWorkerWorkspacePath(repoRoot, changeId, workerId);
}

async function ensureDelegationScaffold(repoRoot, changeId) {
  const change = getChangePaths(repoRoot, changeId);
  await ensureDir(change.executionDir);
  await ensureDir(change.workersDir);
}

async function syncMessageBus(repoRoot, changeId, assignments, planVersion) {
  const busPath = getMessageBusPath(repoRoot, changeId);
  const existing = await readText(busPath, '');
  const header = existing.trim().length > 0 ? '' : '# Message Bus\n\n';
  const lines = [
    `## plan_version ${planVersion}`,
    '',
    ...assignments
      .filter((item) => item.route !== 'direct')
      .map((item) => `- ${item.workerId} queued for ${item.taskId} (${item.route})`)
  ];

  await writeText(busPath, `${existing}${header}${lines.join('\n')}\n\n`);
}

async function syncTeamMemory(repoRoot, changeId, manifest, assignments) {
  const teamMemoryPath = getTeamMemoryPath(repoRoot, changeId);
  const delegateAssignments = assignments.filter((item) => item.route !== 'direct');
  const content = [
    `# Team Memory: ${changeId}`,
    '',
    `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
    `- Worker Count: ${new Set(delegateAssignments.map((item) => item.workerId)).size}`,
    '',
    '## Shared Constraints',
    '',
    '- 共享 memory 以 devflow/changes 下的 canonical 工件为准。',
    '- change-state.json、task-manifest.json、team-state.json 是三条真相源。',
    '- plan_version 不匹配的结果必须拒收。',
    '',
    '## Active Worker Ownership',
    '',
    ...(delegateAssignments.length > 0
      ? delegateAssignments.map((item) => `- ${item.workerId} (${item.role}) owns ${item.taskId}`)
      : ['- No delegate/team workers in current plan'])
  ].join('\n');

  await writeText(teamMemoryPath, `${content}\n`);
}

function groupAssignmentsByWorker(assignments) {
  return assignments
    .filter((item) => item.route !== 'direct')
    .reduce((map, item) => {
      if (!map.has(item.workerId)) {
        map.set(item.workerId, []);
      }
      map.get(item.workerId).push(item);
      return map;
    }, new Map());
}

async function syncAssignmentFiles(repoRoot, changeId, manifest, assignments, branch) {
  const grouped = groupAssignmentsByWorker(assignments);

  for (const [workerId, owned] of grouped.entries()) {
    const assignmentPath = getWorkerAssignmentPath(repoRoot, changeId, workerId);
    const role = owned[0].role;
    const lines = [
      `# Assignment: ${workerId}`,
      '',
      `- Worker: \`${workerId}\``,
      `- Role: \`${role}\``,
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      `- Branch: ${branch}`,
      `- Suggested Worktree: \`${getSuggestedWorktreePath(repoRoot, changeId, workerId)}\``,
      '',
      '## Owned Tasks',
      ''
    ];

    for (const assignment of owned) {
      const task = manifest.tasks.find((item) => item.id === assignment.taskId);
      const taskPaths = getTaskPaths(repoRoot, changeId, assignment.taskId);
      lines.push(`- \`${assignment.taskId}\` ${task.title}`);
      lines.push(`  brief: \`${taskPaths.briefPath}\``);
      lines.push(`  result: \`${taskPaths.resultPath}\``);
    }

    lines.push('', '## Activity Log', '', '- queued');
    await writeText(assignmentPath, `${lines.join('\n')}\n`);
  }
}

async function syncWorkerFiles(repoRoot, changeId, manifest, assignments, branch) {
  const grouped = groupAssignmentsByWorker(assignments);

  for (const [workerId, owned] of grouped.entries()) {
    const role = owned[0].role;
    const workerDir = getWorkerDir(repoRoot, changeId, workerId);
    const workerPaths = getWorkerPaths(repoRoot, changeId, workerId);
    await ensureDir(workerDir);

    const prompt = [
      `# Worker Prompt: ${workerId}`,
      '',
      `- Change: \`${changeId}\``,
      `- Role: \`${role}\``,
      `- Branch: ${branch}`,
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      '',
      '## Mission',
      '',
      '- 只处理分配给自己的任务。',
      '- 共享 memory 以 devflow/changes 下的 Markdown/JSON 工件为准。',
      '- 结果必须落到 execution/tasks/<TASK>/result.md 与 checkpoint 中。',
      '- 如果 plan_version 变化，立即放弃旧结果并刷新 brief。',
      '',
      '## Assigned Tasks',
      '',
      ...owned.map((item) => `- \`${item.taskId}\``)
    ].join('\n');

    const state = [
      `# Worker State: ${workerId}`,
      '',
      `- Role: \`${role}\``,
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      '- Status: `idle`',
      '- Current Task: `none`',
      `- Branch: ${branch}`,
      `- Suggested Workspace: \`${workerPaths.workspacePath}\``
    ].join('\n');

    const journal = [
      `# Worker Journal: ${workerId}`,
      '',
      '## Initialized',
      '',
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      `- Assigned Tasks: ${owned.map((item) => item.taskId).join(', ')}`
    ].join('\n');

    const launch = [
      `# Worker Launch: ${workerId}`,
      '',
      `- Change: \`${changeId}\``,
      `- Role: \`${role}\``,
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      '',
      '## Read First',
      '',
      `- \`${workerPaths.assignmentPath}\``,
      `- \`${workerPaths.promptPath}\``,
      `- \`${workerPaths.statePath}\``,
      `- \`${workerPaths.journalPath}\``,
      '',
      '## Resume Command',
      '',
      `- \`node bin/cc-devflow.js worker --change-id ${changeId} --worker ${workerId}\``
    ].join('\n');

    await writeText(workerPaths.promptPath, `${prompt}\n`);
    await writeText(workerPaths.statePath, `${state}\n`);
    await writeText(workerPaths.journalPath, `${journal}\n`);
    await writeText(workerPaths.launchPath, `${launch}\n`);
  }
}

async function syncTeamStateArtifacts(repoRoot, changeId, manifest, assignments, branch) {
  const delegateAssignments = assignments.filter((item) => item.route !== 'direct');
  if (delegateAssignments.length === 0) {
    return;
  }

  await writeTeamState(repoRoot, changeId, buildInitialTeamState(changeId, manifest, assignments, branch));
}

async function syncDelegationRuntime(repoRoot, changeId, manifest, state) {
  await ensureDelegationScaffold(repoRoot, changeId);

  const assignments = allocateWorkers(manifest.tasks || [], state);
  const branch = await detectCurrentBranch(repoRoot);
  const planVersion = manifest.metadata?.planVersion || 1;

  await syncWorkerFiles(repoRoot, changeId, manifest, assignments, branch);
  await syncAssignmentFiles(repoRoot, changeId, manifest, assignments, branch);
  await syncTeamMemory(repoRoot, changeId, manifest, assignments);
  await syncMessageBus(repoRoot, changeId, assignments, planVersion);
  await syncTeamStateArtifacts(repoRoot, changeId, manifest, assignments, branch);

  return {
    planVersion,
    assignments,
    delegatedCount: assignments.filter((item) => item.route !== 'direct').length,
    teamCount: assignments.filter((item) => item.route === 'team').length
  };
}

async function findAssignment(repoRoot, changeId, taskId) {
  const teamState = await readTeamState(repoRoot, changeId);
  if (!teamState?.team?.taskAssignments?.[taskId]) {
    return null;
  }

  const workerId = teamState.team.taskAssignments[taskId];
  const teammate = (teamState.team.teammates || []).find((item) => item.id === workerId);
  return {
    taskId,
    workerId,
    role: teammate?.role || 'developer',
    route: teamState.team.mode === 'parallel' ? 'team' : 'delegate'
  };
}

async function replaceSection(content, header, lines) {
  const next = lines.join('\n');
  const pattern = new RegExp(`## ${header}[\\s\\S]*?(?=\\n## |$)`, 'm');
  const section = `## ${header}\n\n${next}`;

  if (pattern.test(content)) {
    return content.replace(pattern, section);
  }

  return `${content.trimEnd()}\n\n${section}\n`;
}

async function updateAssignmentStatus(repoRoot, changeId, taskId, fields) {
  const assignment = await findAssignment(repoRoot, changeId, taskId);
  if (!assignment || assignment.workerId === 'main-agent') {
    return;
  }

  const assignmentPath = getWorkerAssignmentPath(repoRoot, changeId, assignment.workerId);
  if (!(await exists(assignmentPath))) {
    return;
  }

  const existing = await readText(assignmentPath, '');
  const logLines = existing.includes('## Activity Log')
    ? existing
    : await replaceSection(existing, 'Activity Log', ['- queued']);
  const message = [
    `- ${nowIso()} \`${taskId}\``,
    fields.status ? `status=\`${fields.status}\`` : '',
    fields.workspace ? `workspace=\`${fields.workspace}\`` : '',
    fields.sessionId ? `session=\`${fields.sessionId}\`` : '',
    fields.summary ? `summary=${fields.summary}` : ''
  ].filter(Boolean).join(' ');

  await writeText(assignmentPath, `${logLines.trimEnd()}\n${message}\n`);
}

async function updateWorkerState(repoRoot, changeId, workerId, fields) {
  const statePath = getWorkerStatePath(repoRoot, changeId, workerId);
  if (!(await exists(statePath))) {
    return;
  }

  const content = [
    `# Worker State: ${workerId}`,
    '',
    `- Role: \`${fields.role || 'developer'}\``,
    `- Plan Version: ${fields.planVersion || 1}`,
    `- Status: \`${fields.status || 'idle'}\``,
    `- Current Task: \`${fields.currentTask || 'none'}\``,
    `- Branch: ${fields.branch || 'unknown'}`,
    `- Suggested Workspace: \`${fields.workspace || 'pending'}\``
  ].join('\n');
  await writeText(statePath, `${content}\n`);
}

async function appendWorkerJournal(repoRoot, changeId, workerId, message) {
  const journalPath = getWorkerJournalPath(repoRoot, changeId, workerId);
  const existing = await readText(journalPath, '');
  const header = existing.trim().length > 0 ? '' : `# Worker Journal: ${workerId}\n\n`;
  await writeText(journalPath, `${existing}${header}- ${message}\n`);
}

async function listWorkers(repoRoot, changeId) {
  const teamState = await readTeamState(repoRoot, changeId);
  if (!teamState?.team?.teammates) {
    return [];
  }

  return teamState.team.teammates.map((item) => ({
    workerId: item.id,
    role: item.role,
    status: item.status,
    currentTask: item.currentTask
  }));
}

async function buildWorkerHandoff(repoRoot, changeId, workerId) {
  const teamState = await readTeamState(repoRoot, changeId);
  if (!teamState?.team?.taskAssignments) {
    throw new Error(`No delegation runtime found for ${changeId}`);
  }

  const tasks = Object.entries(teamState.team.taskAssignments)
    .filter(([, assignedWorkerId]) => assignedWorkerId === workerId)
    .map(([taskId]) => taskId);

  if (tasks.length === 0) {
    throw new Error(`Worker ${workerId} has no assigned tasks`);
  }

  const teammate = (teamState.team.teammates || []).find((item) => item.id === workerId);
  const workerPaths = getWorkerPaths(repoRoot, changeId, workerId);

  return {
    changeId,
    workerId,
    role: teammate?.role || 'developer',
    status: teammate?.status || 'idle',
    planVersion: teamState.planVersion || 1,
    currentTask: teammate?.currentTask || null,
    taskIds: tasks,
    launchPath: workerPaths.launchPath,
    promptPath: workerPaths.promptPath,
    statePath: workerPaths.statePath,
    journalPath: workerPaths.journalPath,
    sessionLogPath: workerPaths.sessionLogPath,
    assignmentPath: workerPaths.assignmentPath
  };
}

async function appendMessageBus(repoRoot, changeId, message) {
  const busPath = getMessageBusPath(repoRoot, changeId);
  const existing = await readText(busPath, '');
  const header = existing.trim().length > 0 ? '' : '# Message Bus\n\n';
  await writeText(busPath, `${existing}${header}- ${message}\n`);
}

async function ensureWorkerWorkspace(repoRoot, changeId, assignment) {
  const fallback = {
    cwd: repoRoot,
    mode: 'fallback',
    workspacePath: repoRoot,
    reason: 'direct-or-no-worktree'
  };

  if (!assignment || assignment.workerId === 'main-agent') {
    return fallback;
  }

  const workspacePath = getWorkerWorkspacePath(repoRoot, changeId, assignment.workerId);
  if (await exists(workspacePath)) {
    return {
      cwd: workspacePath,
      mode: 'worktree',
      workspacePath,
      reason: 'reused'
    };
  }

  const hasGit = await runCommand('git rev-parse --show-toplevel', { cwd: repoRoot });
  if (hasGit.code !== 0) {
    return {
      cwd: repoRoot,
      mode: 'fallback',
      workspacePath: repoRoot,
      reason: 'git-unavailable'
    };
  }

  await ensureDir(path.dirname(workspacePath));
  const create = await runCommand(`git worktree add --detach "${workspacePath}" HEAD`, {
    cwd: repoRoot,
    timeoutMs: 60 * 1000
  });
  if (create.code !== 0) {
    return {
      cwd: repoRoot,
      mode: 'fallback',
      workspacePath: repoRoot,
      reason: (create.stderr || create.stdout || 'worktree add failed').trim().slice(0, 200)
    };
  }

  return {
    cwd: workspacePath,
    mode: 'worktree',
    workspacePath,
    reason: 'created'
  };
}

module.exports = {
  getAssignmentsDir,
  getTeamMemoryPath,
  getMessageBusPath,
  getWorkerWorkspacePath,
  getWorkersDir,
  getWorkerDir,
  getWorkerAssignmentPath,
  getWorkerStatePath,
  getWorkerPromptPath,
  getWorkerJournalPath,
  getWorkerLaunchPath,
  getWorkerSessionLogPath,
  allocateWorkers,
  syncDelegationRuntime,
  findAssignment,
  updateAssignmentStatus,
  updateWorkerState,
  appendWorkerJournal,
  listWorkers,
  buildWorkerHandoff,
  appendMessageBus,
  ensureWorkerWorkspace
};
