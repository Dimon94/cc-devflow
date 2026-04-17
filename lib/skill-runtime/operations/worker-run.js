/**
 * [INPUT]: 依赖 delegation/store 提供的 handoff、workspace 与 shell 执行能力，接收 changeId/workerId/taskId/command/provider 以运行本地 worker。
 * [OUTPUT]: 对外提供 worker-run 执行结果，并写入 session.log、state、journal、message bus、目标 assignment 状态与 provider session prompt。
 * [POS]: skill runtime 的本地 worker 执行壳，把 Markdown handoff bundle 接到真实本地命令执行，并以最薄 provider launcher 连接 codex/claude。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const path = require('path');
const {
  buildWorkerHandoff,
  appendWorkerJournal,
  appendMessageBus,
  updateWorkerState,
  updateAssignmentStatus,
  ensureWorkerWorkspace,
  getWorkerSessionLogPath
} = require('../delegation');
const { getIntentTaskBriefPath } = require('../artifacts');
const {
  readText,
  readJson,
  writeText,
  nowIso,
  ensureDir,
  writeJson,
  appendJsonl,
  runCommand,
  getRuntimeTaskDir,
  getCheckpointPath,
  getEventsPath,
  getTaskManifestPath,
  getRuntimeStatePath
} = require('../store');
const { parseCheckpoint, parseManifest, parseRuntimeState } = require('../schemas');
const { applyManifestExecutionState } = require('../planner');
const {
  syncIntentCheckpoint,
  syncIntentTaskResult,
  syncIntentMemory
} = require('../intent');

function quoteShellArg(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

function summarizeOutput(result) {
  const combined = [result.stdout, result.stderr]
    .filter(Boolean)
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim();

  if (!combined) {
    return result.code === 0 ? 'command finished without output' : 'command failed without output';
  }

  return combined.slice(0, 240);
}

function quoteCommandArg(value) {
  return `'${String(value).replace(/'/g, `'\"'\"'`)}'`;
}

async function appendSessionLog(logPath, lines) {
  const previous = await readText(logPath, '');
  const chunk = `${lines.join('\n')}\n`;
  await writeText(logPath, `${previous}${chunk}`);
}

async function writeWorkerEvent(repoRoot, changeId, taskId, event) {
  await appendJsonl(getEventsPath(repoRoot, changeId, taskId), event);
}

async function updateAssignments(repoRoot, changeId, handoff, fields) {
  for (const taskId of handoff.taskIds) {
    await updateAssignmentStatus(repoRoot, changeId, taskId, fields(taskId));
  }
}

function pickTaskId(handoff, requestedTaskId) {
  if (!requestedTaskId) {
    return handoff.taskIds[0];
  }

  if (!handoff.taskIds.includes(requestedTaskId)) {
    throw new Error(`Worker ${handoff.workerId} is not assigned to task ${requestedTaskId}`);
  }

  return requestedTaskId;
}

function getProviderPromptPath(handoff, taskId) {
  return path.join(path.dirname(handoff.promptPath), `session-${taskId}.md`);
}

function getProviderLastMessagePath(handoff, taskId) {
  return path.join(path.dirname(handoff.promptPath), `session-${taskId}.last-message.md`);
}

function getProviderTranscriptPath(handoff, taskId, provider) {
  return path.join(path.dirname(handoff.promptPath), `session-${taskId}.${provider}.jsonl`);
}

async function buildProviderPrompt(repoRootOrHandoff, handoffOrTaskId, maybeTaskId) {
  const repoRoot = typeof repoRootOrHandoff === 'string' ? repoRootOrHandoff : process.cwd();
  const handoff = typeof repoRootOrHandoff === 'string' ? handoffOrTaskId : repoRootOrHandoff;
  const taskId = typeof repoRootOrHandoff === 'string' ? maybeTaskId : handoffOrTaskId;
  const [prompt, launch, assignment, taskBrief] = await Promise.all([
    readText(handoff.promptPath, ''),
    readText(handoff.launchPath, ''),
    readText(handoff.assignmentPath, ''),
    readText(getIntentTaskBriefPath(repoRoot, handoff.changeId, taskId), '')
  ]);

  return [
    `# Worker Session`,
    '',
    `- Change: \`${handoff.changeId}\``,
    `- Worker: \`${handoff.workerId}\``,
    `- Role: \`${handoff.role}\``,
    `- Task: \`${taskId}\``,
    `- Plan Version: ${handoff.planVersion}`,
    '',
    '## Operating Rules',
    '',
    '- 先阅读下面的 worker prompt、launch 和 assignment，再执行当前任务。',
    '- 仅处理当前 task，不要擅自结算同 worker 的其他任务。',
    '- 所有关键结论先落到仓库工件，再结束会话。',
    '- 如果发现 plan_version 漂移，停止并返回阻塞说明。',
    '',
    '## Worker Prompt',
    '',
    prompt.trim(),
    '',
    '## Launch',
    '',
    launch.trim(),
    '',
    '## Worker Assignment',
    '',
    assignment.trim(),
    '',
    '## Selected Task Brief',
    '',
    taskBrief.trim(),
    ''
  ].join('\n');
}

function buildProviderCommand({
  provider,
  providerPromptPath,
  providerLastMessagePath,
  providerTranscriptPath,
  workspace,
  providerArgs
}) {
  const extraArgs = providerArgs ? ` ${providerArgs.trim()}` : '';
  const stdinPromptArg = provider === 'codex' ? ' -' : '';

  if (provider === 'codex') {
    return `cat ${quoteCommandArg(providerPromptPath)} | codex exec --json --dangerously-bypass-approvals-and-sandbox -C ${quoteCommandArg(workspace)} -o ${quoteCommandArg(providerLastMessagePath)}${stdinPromptArg}${extraArgs} | tee ${quoteCommandArg(providerTranscriptPath)}`;
  }

  if (provider === 'claude') {
    return `cat ${quoteCommandArg(providerPromptPath)} | claude -p --dangerously-skip-permissions --add-dir ${quoteCommandArg(workspace)}${extraArgs}`;
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

function parseCodexTranscript(stdout = '') {
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const summary = {
    threadId: null,
    agentMessages: [],
    commandExecutions: [],
    fileChanges: [],
    toolCalls: [],
    errors: []
  };

  for (const line of lines) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type === 'thread.started' && event.thread_id) {
      summary.threadId = event.thread_id;
      continue;
    }

    if (event.type !== 'item.completed' || !event.item) {
      continue;
    }

    if (event.item.type === 'agent_message' && event.item.text) {
      summary.agentMessages.push(event.item.text);
      continue;
    }

    if (event.item.type === 'command_execution') {
      summary.commandExecutions.push({
        command: event.item.command,
        status: event.item.status,
        exitCode: event.item.exit_code
      });
      continue;
    }

    if (event.item.type === 'file_change') {
      summary.fileChanges.push(...(event.item.changes || []).map((change) => `${change.kind}:${change.path}`));
      continue;
    }

    if (event.item.type === 'mcp_tool_call') {
      summary.toolCalls.push(`${event.item.server}:${event.item.tool}:${event.item.status}`);
      continue;
    }

    if (event.item.type === 'error' && event.item.message) {
      summary.errors.push(event.item.message);
    }
  }

  return summary;
}

async function updateManifestTaskState(repoRoot, changeId, taskId, fields) {
  const manifestPath = getTaskManifestPath(repoRoot, changeId);
  const manifest = parseManifest(await readJson(manifestPath));
  const task = manifest.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task ${taskId} not found in manifest`);
  }

  if (fields.status) {
    task.status = fields.status;
  }
  if (Number.isInteger(fields.attempts)) {
    task.attempts = fields.attempts;
  }
  if (Object.prototype.hasOwnProperty.call(fields, 'lastError')) {
    task.lastError = fields.lastError || undefined;
  }

  applyManifestExecutionState(manifest, nowIso());
  await writeJson(manifestPath, manifest);
  return manifest;
}

async function markRuntimeInProgress(repoRoot, changeId) {
  const statePath = getRuntimeStatePath(repoRoot, changeId);
  const state = await readJson(statePath, null);
  if (!state) {
    return;
  }

  const parsed = parseRuntimeState(state);
  if (parsed.status === 'planned' || parsed.status === 'initialized') {
    parsed.status = 'in_progress';
  }
  parsed.updatedAt = nowIso();
  await writeJson(statePath, parsed);
}

async function runWorkerCommand({
  repoRoot,
  changeId,
  workerId,
  taskId,
  command,
  provider,
  providerArgs,
  timeoutMs = 15 * 60 * 1000
}) {
  if (!command && !provider) {
    throw new Error('Missing execution mode: provide --command "<local agent command>" or --provider <codex|claude>');
  }

  if (command && provider) {
    throw new Error('Use either --command or --provider, not both');
  }

  const handoff = await buildWorkerHandoff(repoRoot, changeId, workerId);
  const primaryTaskId = pickTaskId(handoff, taskId);
  const assignment = {
    workerId,
    role: handoff.role
  };
  const workspace = await ensureWorkerWorkspace(repoRoot, changeId, assignment);
  const sessionId = `${workerId}-${Date.now()}`;
  const startedAt = nowIso();
  const sessionLogPath = handoff.sessionLogPath || getWorkerSessionLogPath(repoRoot, changeId, workerId);
  const runtimeTaskDir = getRuntimeTaskDir(repoRoot, changeId, primaryTaskId);
  const providerPromptPath = getProviderPromptPath(handoff, primaryTaskId);
  const providerLastMessagePath = getProviderLastMessagePath(handoff, primaryTaskId);
  const providerTranscriptPath = provider ? getProviderTranscriptPath(handoff, primaryTaskId, provider) : null;
  await ensureDir(runtimeTaskDir);
  await markRuntimeInProgress(repoRoot, changeId);
  const providerPrompt = provider ? await buildProviderPrompt(repoRoot, handoff, primaryTaskId) : null;
  if (providerPrompt) {
    await writeText(providerPromptPath, `${providerPrompt}\n`);
  }
  const resolvedCommand = command || buildProviderCommand({
    provider,
    providerPromptPath,
    providerLastMessagePath,
    providerTranscriptPath,
    workspace: workspace.workspacePath,
    providerArgs
  });
  const wrappedCommand = [
    `export CC_DEVFLOW_CHANGE_ID=${quoteShellArg(changeId)}`,
    `export CC_DEVFLOW_WORKER_ID=${quoteShellArg(workerId)}`,
    `export CC_DEVFLOW_WORKER_ROLE=${quoteShellArg(handoff.role)}`,
    `export CC_DEVFLOW_TASK_ID=${quoteShellArg(primaryTaskId)}`,
    `export CC_DEVFLOW_WORKER_PROMPT=${quoteShellArg(handoff.promptPath)}`,
    `export CC_DEVFLOW_WORKER_LAUNCH=${quoteShellArg(handoff.launchPath)}`,
    `export CC_DEVFLOW_WORKER_STATE=${quoteShellArg(handoff.statePath)}`,
    `export CC_DEVFLOW_WORKER_JOURNAL=${quoteShellArg(handoff.journalPath)}`,
    `export CC_DEVFLOW_WORKER_SESSION_LOG=${quoteShellArg(sessionLogPath)}`,
    providerPrompt ? `export CC_DEVFLOW_PROVIDER_PROMPT=${quoteShellArg(providerPromptPath)}` : '',
    providerPrompt ? `export CC_DEVFLOW_PROVIDER_LAST_MESSAGE=${quoteShellArg(providerLastMessagePath)}` : '',
    providerTranscriptPath ? `export CC_DEVFLOW_PROVIDER_TRANSCRIPT=${quoteShellArg(providerTranscriptPath)}` : '',
    provider ? `export CC_DEVFLOW_PROVIDER=${quoteShellArg(provider)}` : '',
    resolvedCommand
  ].join('\n');

  await updateWorkerState(repoRoot, changeId, workerId, {
    role: handoff.role,
    planVersion: handoff.planVersion,
    status: 'running',
    currentTask: primaryTaskId,
    branch: workspace.mode === 'worktree' ? 'detached-worktree' : 'controller',
    workspace: workspace.workspacePath
  });
  await updateManifestTaskState(repoRoot, changeId, primaryTaskId, {
    status: 'running',
    attempts: 1,
    lastError: undefined
  });
  await updateAssignments(repoRoot, changeId, handoff, (taskId) => ({
    status: taskId === primaryTaskId ? 'running' : undefined,
    workspace: taskId === primaryTaskId ? workspace.workspacePath : undefined,
    sessionId: taskId === primaryTaskId ? sessionId : undefined,
    summary: taskId === primaryTaskId
      ? `worker ${workerId} started ${provider || 'custom'} execution`
      : undefined
  }));
  await appendWorkerJournal(
    repoRoot,
    changeId,
    workerId,
    `${startedAt} started ${sessionId} in ${workspace.mode} workspace for ${primaryTaskId} via ${provider || 'custom-command'}`
  );
  await appendMessageBus(
    repoRoot,
    changeId,
    `${workerId} started ${primaryTaskId} via ${provider || 'custom-command'} in ${workspace.mode} workspace`
  );
  await writeWorkerEvent(repoRoot, changeId, primaryTaskId, {
    type: 'worker_run_started',
    changeId,
    taskId: primaryTaskId,
    sessionId,
    provider: provider || 'custom',
    workerId,
    timestamp: startedAt
  });
  await appendSessionLog(sessionLogPath, [
    `# Session ${sessionId}`,
    `started_at: ${startedAt}`,
    `worker: ${workerId}`,
    `role: ${handoff.role}`,
    `workspace: ${workspace.workspacePath}`,
    `workspace_mode: ${workspace.mode}`,
    `workspace_reason: ${workspace.reason}`,
    `provider: ${provider || 'custom'}`,
    providerPrompt ? `provider_prompt: ${providerPromptPath}` : '',
    `command: ${resolvedCommand}`,
    '',
    '## output'
  ].filter(Boolean));

  const result = await runCommand(wrappedCommand, {
    cwd: workspace.cwd,
    timeoutMs
  });
  const finishedAt = nowIso();
  const finalStatus = result.code === 0 ? 'completed' : 'failed';
  const summary = summarizeOutput(result);
  const providerOutputRaw = provider === 'codex'
    ? await readText(providerLastMessagePath, '')
    : provider === 'claude'
      ? result.stdout
      : result.stdout;
  const providerOutput = providerOutputRaw.trim();
  const codexTranscript = provider === 'codex' ? parseCodexTranscript(result.stdout) : null;

  await appendSessionLog(sessionLogPath, [
    result.stdout ? result.stdout.trimEnd() : '',
    result.stderr ? `\n## stderr\n${result.stderr.trimEnd()}` : '',
    '',
    `exit_code: ${result.code}`,
    `finished_at: ${finishedAt}`,
    `duration_ms: ${result.durationMs}`,
    `timed_out: ${result.killedByTimeout ? 'true' : 'false'}`,
    ''
  ].filter(Boolean));

  const checkpointStatus = result.code === 0 ? 'passed' : 'failed';
  const checkpointSummary = providerOutput
    ? providerOutput.slice(0, 400)
    : `${provider || 'custom'} execution ${checkpointStatus}`;
  const checkpoint = parseCheckpoint({
    changeId,
    taskId: primaryTaskId,
    sessionId,
    planVersion: handoff.planVersion,
    status: checkpointStatus,
    summary: checkpointSummary,
    timestamp: finishedAt,
    attempt: 1
  });
  await writeJson(getCheckpointPath(repoRoot, changeId, primaryTaskId), checkpoint);
  await updateManifestTaskState(repoRoot, changeId, primaryTaskId, {
    status: checkpointStatus,
    attempts: 1,
    lastError: result.code === 0 ? undefined : (result.stderr || result.stdout || '').trim()
  });
  await writeWorkerEvent(repoRoot, changeId, primaryTaskId, {
    type: result.code === 0 ? 'worker_run_passed' : 'worker_run_failed',
    changeId,
    taskId: primaryTaskId,
    sessionId,
    provider: provider || 'custom',
    workerId,
    timestamp: finishedAt,
    error: result.code === 0 ? undefined : (result.stderr || result.stdout || '').trim()
  });
  await syncIntentCheckpoint(repoRoot, changeId, checkpoint);
  await syncIntentTaskResult(
    repoRoot,
    changeId,
    checkpoint,
    result.code === 0 ? '' : (result.stderr || result.stdout || '').trim(),
    {
      output: providerOutput || '',
      metadata: {
        provider: provider || 'custom',
        workspace: workspace.workspacePath,
        session_log: sessionLogPath,
        transcript_path: providerTranscriptPath || 'n/a',
        thread_id: codexTranscript?.threadId || 'n/a',
        command_count: codexTranscript ? codexTranscript.commandExecutions.length : 'n/a',
        file_change_count: codexTranscript ? codexTranscript.fileChanges.length : 'n/a'
      }
    }
  );
  await syncIntentMemory(repoRoot, changeId, {
    event: result.code === 0 ? 'worker_run_completed' : 'worker_run_failed',
    reason: `${workerId} ${result.code === 0 ? 'completed' : 'failed'} ${primaryTaskId} via ${provider || 'custom-command'}`
  });

  await updateWorkerState(repoRoot, changeId, workerId, {
    role: handoff.role,
    planVersion: handoff.planVersion,
    status: finalStatus,
    currentTask: result.code === 0 ? 'none' : primaryTaskId,
    branch: workspace.mode === 'worktree' ? 'detached-worktree' : 'controller',
    workspace: workspace.workspacePath
  });
  await updateAssignments(repoRoot, changeId, handoff, (taskId) => ({
    status: taskId === primaryTaskId ? finalStatus : undefined,
    workspace: taskId === primaryTaskId ? workspace.workspacePath : undefined,
    sessionId: taskId === primaryTaskId ? sessionId : undefined,
    summary: taskId === primaryTaskId ? `${workerId} ${finalStatus}: ${summary}` : undefined
  }));
  await appendWorkerJournal(
    repoRoot,
    changeId,
    workerId,
    `${finishedAt} ${sessionId} ${finalStatus} (exit ${result.code})`
  );
  await appendMessageBus(
    repoRoot,
    changeId,
    `${workerId} ${finalStatus} ${primaryTaskId}: ${summary}`
  );

  return {
    changeId,
    workerId,
    role: handoff.role,
    sessionId,
    status: finalStatus,
    taskId: primaryTaskId,
    workspace,
    provider: provider || null,
    providerPromptPath: providerPrompt ? providerPromptPath : null,
    providerLastMessagePath: providerPrompt ? providerLastMessagePath : null,
    providerTranscriptPath,
    command: resolvedCommand,
    sessionLogPath,
    result
  };
}

module.exports = {
  buildProviderCommand,
  buildProviderPrompt,
  runWorkerCommand
};
