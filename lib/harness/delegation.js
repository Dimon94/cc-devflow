/**
 * [INPUT]: 依赖 manifest 与 intent 工件路径，依赖 store 的文件读写能力，接收 repoRoot/changeId 以生成本地委派骨架。
 * [OUTPUT]: 对外提供 assignment/team-memory/message-bus/team-state 真相源与 compatibility mirror 的生成能力。
 * [POS]: harness 的本地委派桥接层，把 delegate/team 语义落成可恢复、可扫描的本地工件，而不是厚平台。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');
const {
  ensureDir,
  writeText,
  exists,
  readText,
  readJson,
  runCommand
} = require('./store');
const {
  classifyDelegationMode,
  getIntentArtifactsDir
} = require('./intent');
const {
  getCompatibilityStatusPath,
  getTeamStatePath,
  readTeamState,
  writeTeamState,
  buildInitialTeamState
} = require('./team-state');

function getAssignmentsDir(repoRoot, changeId) {
  return path.join(getIntentArtifactsDir(repoRoot, changeId), 'assignments');
}

function getAssignmentPath(repoRoot, changeId, taskId) {
  return path.join(getAssignmentsDir(repoRoot, changeId), `${taskId}.md`);
}

function getTeamMemoryPath(repoRoot, changeId) {
  return path.join(getIntentArtifactsDir(repoRoot, changeId), 'team-memory.md');
}

function getMessageBusPath(repoRoot, changeId) {
  return path.join(getIntentArtifactsDir(repoRoot, changeId), 'message-bus.md');
}

function getWorkerWorkspacePath(repoRoot, changeId, workerId) {
  return path.join(repoRoot, '.harness', 'worktrees', changeId, workerId);
}

function getWorkersDir(repoRoot, changeId) {
  return path.join(getIntentArtifactsDir(repoRoot, changeId), 'workers');
}

function getWorkerDir(repoRoot, changeId, workerId) {
  return path.join(getWorkersDir(repoRoot, changeId), workerId);
}

function getWorkerStatePath(repoRoot, changeId, workerId) {
  return path.join(getWorkerDir(repoRoot, changeId, workerId), 'state.md');
}

function getWorkerPromptPath(repoRoot, changeId, workerId) {
  return path.join(getWorkerDir(repoRoot, changeId, workerId), 'prompt.md');
}

function getWorkerJournalPath(repoRoot, changeId, workerId) {
  return path.join(getWorkerDir(repoRoot, changeId, workerId), 'journal.md');
}

function getWorkerLaunchPath(repoRoot, changeId, workerId) {
  return path.join(getWorkerDir(repoRoot, changeId, workerId), 'launch.md');
}

function getWorkerSessionLogPath(repoRoot, changeId, workerId) {
  return path.join(getWorkerDir(repoRoot, changeId, workerId), 'session.log');
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

function buildOwnershipKey(task) {
  return JSON.stringify([
    classifyDelegationMode(task),
    guessWorkerRole(task),
    [...task.touches].sort()
  ]);
}

function allocateWorkers(tasks) {
  const workerMap = new Map();
  const assignments = [];
  let sequence = 1;

  for (const task of tasks) {
    const route = classifyDelegationMode(task);
    if (route === 'direct') {
      assignments.push({
        taskId: task.id,
        route,
        workerId: 'main-agent',
        role: 'controller'
      });
      continue;
    }

    const key = buildOwnershipKey(task);
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
  await ensureDir(getAssignmentsDir(repoRoot, changeId));
  await ensureDir(getWorkersDir(repoRoot, changeId));
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
    '- 共享 memory 以 intent Markdown 工件为准。',
    '- 兼容层 orchestration_status.json 只做镜像，不做真相源。',
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

async function syncAssignmentFiles(repoRoot, changeId, manifest, assignments, branch) {
  for (const assignment of assignments) {
    if (assignment.route === 'direct') {
      continue;
    }

    const task = manifest.tasks.find((item) => item.id === assignment.taskId);
    const assignmentPath = getAssignmentPath(repoRoot, changeId, assignment.taskId);
    const content = [
      `# Assignment: ${assignment.taskId}`,
      '',
      `- Route: \`${assignment.route}\``,
      `- Worker: \`${assignment.workerId}\``,
      `- Role: \`${assignment.role}\``,
      `- Plan Version: ${manifest.metadata?.planVersion || 1}`,
      `- Branch: ${branch}`,
      `- Suggested Worktree: \`${getSuggestedWorktreePath(repoRoot, changeId, assignment.workerId)}\``,
      '',
      '## Task',
      '',
      `- Title: ${task.title}`,
      `- Type: \`${task.type}\``,
      '',
      '## Dependencies',
      '',
      ...(task.dependsOn.length > 0 ? task.dependsOn.map((dep) => `- \`${dep}\``) : ['- None']),
      '',
      '## Touched Files',
      '',
      ...(task.touches.length > 0 ? task.touches.map((file) => `- \`${file}\``) : ['- None']),
      '',
      '## Execution',
      '',
      '- Status: `queued`',
      '- Workspace: `pending`',
      '- Result Artifact: write to `devflow/intent/<REQ>/artifacts/results/<TASK>.md`',
      '- Resume Rule: if plan_version changes, discard local result and refresh brief'
    ].join('\n');

    await writeText(assignmentPath, `${content}\n`);
  }
}

async function syncWorkerFiles(repoRoot, changeId, manifest, assignments, branch) {
  const grouped = assignments
    .filter((item) => item.route !== 'direct')
    .reduce((map, item) => {
      if (!map.has(item.workerId)) {
        map.set(item.workerId, []);
      }
      map.get(item.workerId).push(item);
      return map;
    }, new Map());

  for (const [workerId, owned] of grouped.entries()) {
    const role = owned[0].role;
    const workerDir = getWorkerDir(repoRoot, changeId, workerId);
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
      '- 共享 memory 以 devflow/intent 下的 Markdown 工件为准。',
      '- 结果必须落到 artifacts/results/ 与 checkpoint 中。',
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
      `- Status: \`idle\``,
      `- Current Task: \`none\``,
      `- Branch: ${branch}`,
      `- Suggested Workspace: \`${getSuggestedWorktreePath(repoRoot, changeId, workerId)}\``
    ].join('\n');

    const journal = [
      `# Worker Journal: ${workerId}`,
      '',
      `## Initialized`,
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
      `- \`${getWorkerPromptPath(repoRoot, changeId, workerId)}\``,
      `- \`${getWorkerStatePath(repoRoot, changeId, workerId)}\``,
      `- \`${getWorkerJournalPath(repoRoot, changeId, workerId)}\``,
      '',
      '## Assignment Files',
      '',
      ...owned.map((item) => `- \`${getAssignmentPath(repoRoot, changeId, item.taskId)}\``),
      '',
      '## Resume Command',
      '',
      `- \`node bin/harness.js worker --change-id ${changeId} --worker ${workerId}\``
    ].join('\n');

    await writeText(getWorkerPromptPath(repoRoot, changeId, workerId), `${prompt}\n`);
    await writeText(getWorkerStatePath(repoRoot, changeId, workerId), `${state}\n`);
    await writeText(getWorkerJournalPath(repoRoot, changeId, workerId), `${journal}\n`);
    await writeText(getWorkerLaunchPath(repoRoot, changeId, workerId), `${launch}\n`);
  }
}

async function syncTeamStateArtifacts(repoRoot, changeId, manifest, assignments, branch) {
  const delegateAssignments = assignments.filter((item) => item.route !== 'direct');

  if (delegateAssignments.length === 0) {
    return;
  }

  await writeTeamState(repoRoot, changeId, buildInitialTeamState(changeId, manifest, assignments, branch));
}

async function syncDelegationRuntime(repoRoot, changeId, manifest) {
  await ensureDelegationScaffold(repoRoot, changeId);

  const assignments = allocateWorkers(manifest.tasks || []);
  const branch = await detectCurrentBranch(repoRoot);
  const planVersion = manifest.metadata?.planVersion || 1;

  await syncAssignmentFiles(repoRoot, changeId, manifest, assignments, branch);
  await syncWorkerFiles(repoRoot, changeId, manifest, assignments, branch);
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

async function readCompatibilityStatus(repoRoot, changeId) {
  return readJson(getCompatibilityStatusPath(repoRoot, changeId), null);
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
    route: teamState.team.mode === 'parallel' ? 'delegate' : 'delegate'
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
  const assignmentPath = getAssignmentPath(repoRoot, changeId, taskId);
  if (!(await exists(assignmentPath))) {
    return;
  }

  let content = await readText(assignmentPath, '');
  if (fields.summary) {
    content = await replaceSection(content, 'Execution', [
      `- Status: \`${fields.status || 'queued'}\``,
      `- Workspace: \`${fields.workspace || 'pending'}\``,
      `- Session: \`${fields.sessionId || 'n/a'}\``,
      `- Summary: ${fields.summary}`,
      `- Result Artifact: write to \`devflow/intent/<REQ>/artifacts/results/<TASK>.md\``,
      '- Resume Rule: if plan_version changes, discard local result and refresh brief'
    ]);
  }
  await writeText(assignmentPath, content);
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

  return {
    changeId,
    workerId,
    role: teammate?.role || 'developer',
    status: teammate?.status || 'idle',
    planVersion: teamState.planVersion || 1,
    currentTask: teammate?.currentTask || null,
    taskIds: tasks,
    launchPath: getWorkerLaunchPath(repoRoot, changeId, workerId),
    promptPath: getWorkerPromptPath(repoRoot, changeId, workerId),
    statePath: getWorkerStatePath(repoRoot, changeId, workerId),
    journalPath: getWorkerJournalPath(repoRoot, changeId, workerId),
    sessionLogPath: getWorkerSessionLogPath(repoRoot, changeId, workerId),
    assignmentPaths: tasks.map((taskId) => getAssignmentPath(repoRoot, changeId, taskId))
  };
}

async function appendMessageBus(repoRoot, changeId, message) {
  const busPath = getMessageBusPath(repoRoot, changeId);
  const existing = await readText(busPath, '');
  const header = existing.trim().length > 0 ? '' : '# Message Bus\n\n';
  await writeText(busPath, `${existing}${header}- ${message}\n`);
}

async function updateCompatibilityWorkerStatus(repoRoot, changeId, workerId, fields) {
  const teamState = await readTeamState(repoRoot, changeId);
  if (!teamState?.team?.teammates) {
    return;
  }

  const now = new Date().toISOString();
  const next = {
    ...teamState,
    updatedAt: now,
    team: {
      ...teamState.team,
      updatedAt: now,
      teammates: teamState.team.teammates.map((item) => {
        if (item.id !== workerId) {
          return item;
        }

        return {
          ...item,
          status: fields.status || item.status,
          currentTask: Object.prototype.hasOwnProperty.call(fields, 'currentTask') ? fields.currentTask : item.currentTask,
          lastActiveAt: now
        };
      })
    }
  };

  await writeTeamState(repoRoot, changeId, next);
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
  const create = await runCommand(`git worktree add --detach "${workspacePath}" HEAD`, { cwd: repoRoot, timeoutMs: 60 * 1000 });
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
  getAssignmentPath,
  getTeamMemoryPath,
  getMessageBusPath,
  getTeamStatePath,
  getCompatibilityStatusPath,
  getWorkerWorkspacePath,
  getWorkersDir,
  getWorkerDir,
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
  updateCompatibilityWorkerStatus,
  ensureWorkerWorkspace
};
