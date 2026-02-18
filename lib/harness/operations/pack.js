/**
 * [INPUT]: 依赖 store 读取 harness-state/package scripts，并通过 git 命令收集仓库事实。
 * [OUTPUT]: 生成 context-package.md，提供可复现的目标/约束/下一步命令。
 * [POS]: harness Stage-2 上下文打包入口，被 CLI `harness:pack` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const {
  nowIso,
  readJson,
  writeText,
  getContextPackagePath,
  getHarnessStatePath,
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

function buildContextMarkdown({ changeId, goal, gitFacts, scripts }) {
  const nextCommands = [
    `npm run harness:plan -- --change-id ${changeId}`,
    `npm run harness:dispatch -- --change-id ${changeId} --parallel 3`,
    `npm run harness:verify -- --change-id ${changeId} --strict`,
    `npm run harness:release -- --change-id ${changeId}`
  ];

  return [
    `# Context Package - ${changeId}`,
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
    '- Preserve auditable runtime logs in .harness/runtime/.',
    '',
    '## Available npm scripts',
    '',
    '```text',
    Object.keys(scripts).sort().join('\n') || '(none)',
    '```',
    '',
    '## Next Commands',
    '',
    ...nextCommands.map((command) => `- \`${command}\``),
    ''
  ].join('\n');
}

async function runPack({ repoRoot, changeId, goal }) {
  const state = (await readJson(getHarnessStatePath(repoRoot, changeId), {})) || {};
  const effectiveGoal = goal || state.goal || `Deliver ${changeId} safely with auditable checkpoints.`;
  const gitFacts = await collectGitFacts(repoRoot);
  const scripts = await getPackageScripts(repoRoot);
  const context = buildContextMarkdown({
    changeId,
    goal: effectiveGoal,
    gitFacts,
    scripts
  });

  const outputPath = getContextPackagePath(repoRoot, changeId);
  await writeText(outputPath, `${context}`);

  return {
    changeId,
    outputPath,
    goal: effectiveGoal
  };
}

module.exports = {
  runPack
};
