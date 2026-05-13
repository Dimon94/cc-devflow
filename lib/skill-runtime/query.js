/**
 * [INPUT]: 依赖 task.md、handoff/pr-brief.md 与 Git 状态。
 * [OUTPUT]: 提供 Git-first workflow-context 查询，不读取流程 JSON。
 * [POS]: cc-devflow CLI 的只读上下文层；Git 是历史真相，task.md 是任务真相。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createQueryRegistry } = require('./query-registry');
const { getChangePaths } = require('./paths');
const { createTrace } = require('./trace');

function readTextIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function runGit(repoRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    return null;
  }

  return result.stdout.trim();
}

function parseTaskSummary(markdown) {
  const lines = String(markdown || '').split(/\r?\n/);
  const tasks = [];

  for (const line of lines) {
    const match = line.match(/^\s*-\s+\[( |x|X)\]\s+((?:T\d+|[A-Z]+-\d+)[^:\n]*)(?::\s*)?(.*)$/);
    if (!match) continue;

    tasks.push({
      id: match[2].trim().split(/\s+/)[0],
      title: (match[3] || match[2]).trim(),
      status: match[1].toLowerCase() === 'x' ? 'done' : 'pending'
    });
  }

  const completed = tasks.filter((task) => task.status === 'done').length;
  const next = tasks.find((task) => task.status === 'pending') || null;

  return {
    total: tasks.length,
    completed,
    pending: tasks.length - completed,
    next
  };
}

function getWorkflowContextArtifactRefs(repoRoot, changeId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  return [
    path.join(change.changeDir, 'task.md'),
    path.join(change.handoffDir, 'pr-brief.md')
  ];
}

function getWorkflowContextRequiredArtifactRefs(repoRoot, changeId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  return [path.join(change.changeDir, 'task.md')];
}

async function getWorkflowContext(repoRoot, changeId, options = {}) {
  const change = getChangePaths(repoRoot, changeId, options);
  const taskPath = path.join(change.changeDir, 'task.md');
  const prBriefPath = path.join(change.handoffDir, 'pr-brief.md');
  const taskMarkdown = readTextIfExists(taskPath) || '';
  const taskSummary = parseTaskSummary(taskMarkdown);

  const branch = runGit(repoRoot, ['branch', '--show-current']) || '';
  const head = runGit(repoRoot, ['rev-parse', '--short', 'HEAD']) || '';
  const status = runGit(repoRoot, ['status', '--short']) || '';
  const recentCommits = runGit(repoRoot, ['log', '--oneline', '-5']) || '';

  return {
    changeId,
    changeKey: change.changeKey,
    nextAction: {
      skill: taskSummary.next ? 'cc-do' : 'cc-check',
      taskId: taskSummary.next ? taskSummary.next.id : null
    },
    files: {
      task: taskPath,
      prBrief: fs.existsSync(prBriefPath) ? prBriefPath : null
    },
    taskSummary,
    git: {
      branch,
      head,
      dirty: status.length > 0,
      status: status ? status.split(/\r?\n/) : [],
      recentCommits: recentCommits ? recentCommits.split(/\r?\n/) : []
    }
  };
}

const registry = createQueryRegistry([
  {
    id: 'workflow-context',
    artifactRefs: ({ repoRoot, changeId, changeKey }) => (
      getWorkflowContextArtifactRefs(repoRoot, changeId, { changeKey })
    ),
    requiredArtifactRefs: ({ repoRoot, changeId, changeKey }) => (
      getWorkflowContextRequiredArtifactRefs(repoRoot, changeId, { changeKey })
    ),
    nextAction: 'read-task-md-and-git-history',
    handler: ({ repoRoot, changeId, changeKey }) => getWorkflowContext(repoRoot, changeId, { changeKey })
  }
]);

module.exports = {
  getWorkflowContext,
  getWorkflowContextArtifactRefs,
  getWorkflowContextRequiredArtifactRefs,
  listQueryIds: registry.listQueryIds,
  runQuery: registry.runQuery,
  createTrace
};
