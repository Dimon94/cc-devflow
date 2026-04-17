/**
 * [INPUT]: 依赖 store 读取 change-state/package scripts，并通过 git 命令收集仓库事实。
 * [OUTPUT]: 生成 planning/planning-snapshot.md，提供 discover 阶段需要的仓库事实与下一步命令。
 * [POS]: skill runtime Stage-2 内部快照入口，被 autopilot discover 阶段调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readJson,
  writeText,
  getPlanningSnapshotPath,
  getRuntimeStatePath,
  runCommand,
  getPackageScripts
} = require('../store');

async function collectGitFacts(repoRoot) {
  const [branch, commit, status] = await Promise.all([
    runCommand('git rev-parse --abbrev-ref HEAD', { cwd: repoRoot }),
    runCommand('git rev-parse HEAD', { cwd: repoRoot }),
    runCommand('git status --short', { cwd: repoRoot })
  ]);

  return {
    branch: branch.code === 0 ? branch.stdout.trim() : 'unknown',
    commit: commit.code === 0 ? commit.stdout.trim() : 'unknown',
    status: status.code === 0 ? status.stdout.trim() : '(clean)'
  };
}

function buildPlanningSnapshotMarkdown({ changeId, goal, gitFacts, scripts }) {
  const nextActions = [
    `Use cc-plan to refresh planning/design.md, planning/tasks.md, and task-manifest.json for ${changeId} when scope or feature design changed`,
    `Use cc-investigate to freeze planning/analysis.md, planning/tasks.md, and task-manifest.json for ${changeId} when the next problem is root cause, not product scope`,
    'Use cc-do to execute ready tasks and leave runtime checkpoints',
    'Use cc-check to rerun strict verification and regenerate review/report-card.json',
    'Use cc-act to assemble release or handoff materials once verification passes'
  ];

  return [
    `# Planning Snapshot - ${changeId}`,
    '',
    `- Generated: ${nowIso()}`,
    `- Goal: ${goal}`,
    '',
    '## Repository Facts',
    '',
    `- Branch: ${gitFacts.branch}`,
    `- Commit: ${gitFacts.commit}`,
    '',
    '### Git Status',
    '',
    '```text',
    gitFacts.status || '(clean)',
    '```',
    '',
    '## Constraints',
    '',
    '- Keep tasks dependency-aware and checkpointed.',
    '- Block release when strict verification fails.',
    '- Preserve auditable runtime logs in devflow/changes/<change>/execution/tasks/.',
    '',
    '## Available npm scripts',
    '',
    '```text',
    Object.keys(scripts).sort().join('\n') || '(none)',
    '```',
    '',
    '## Next Actions',
    '',
    ...nextActions.map((action) => `- ${action}`),
    ''
  ].join('\n');
}

async function runPlanningSnapshot({ repoRoot, changeId, goal }) {
  const state = (await readJson(getRuntimeStatePath(repoRoot, changeId), {})) || {};
  const effectiveGoal = goal || state.goal || `Deliver ${changeId} safely with auditable checkpoints.`;
  const gitFacts = await collectGitFacts(repoRoot);
  const scripts = await getPackageScripts(repoRoot);
  const snapshot = buildPlanningSnapshotMarkdown({
    changeId,
    goal: effectiveGoal,
    gitFacts,
    scripts
  });

  const outputPath = getPlanningSnapshotPath(repoRoot, changeId);
  await writeText(outputPath, snapshot);

  return {
    changeId,
    outputPath,
    goal: effectiveGoal
  };
}

module.exports = {
  runPlanningSnapshot,
  buildPlanningSnapshotMarkdown
};
