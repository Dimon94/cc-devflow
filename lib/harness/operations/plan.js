/**
 * [INPUT]: 依赖 planner.createTaskManifest，接收 changeId/goal/overwrite 参数。
 * [OUTPUT]: 生成并返回已校验的 task-manifest.json 摘要。
 * [POS]: harness Stage-3 计划生成入口，被 CLI `harness:plan` 调用。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const { createTaskManifest } = require('../planner');
const { getTaskManifestPath, getHarnessStatePath, exists, readText, readJson, writeJson } = require('../store');
const path = require('path');
const { execSync } = require('child_process');

async function runPlan({ repoRoot, changeId, goal, overwrite }) {
  // v4.3: 检查是否存在 proposal.md（新架构）
  const reqDir = path.join(repoRoot, 'devflow', 'requirements', changeId);
  const proposalPath = path.join(reqDir, 'proposal.md');
  const hasProposal = await exists(proposalPath);

  if (hasProposal) {
    console.log(`[v4.3] Detected proposal.md, generating design.md and Delta specs...`);

    // 注意：实际的 design.md 和 Delta specs 生成由 Claude Agent 在 /flow:spec 中完成
    // 这里只是检测并提示，不执行生成逻辑
    // 生成逻辑在 .claude/skills/flow-spec/SKILL.md 的 Execution Steps 中定义

    const designPath = path.join(reqDir, 'design.md');
    const specsDir = path.join(reqDir, 'specs');
    const scopeReportPath = path.join(reqDir, 'scope-creep-report.md');

    // 检查必需产物是否存在
    const hasDesign = await exists(designPath);
    const hasSpecs = await exists(specsDir);
    const hasScopeReport = await exists(scopeReportPath);

    if (!hasDesign) {
      console.warn(`[v4.3] WARNING: design.md not found. Expected at ${designPath}`);
    }

    if (!hasSpecs) {
      console.warn(`[v4.3] WARNING: specs/ directory not found. Expected at ${specsDir}`);
    }

    if (!hasScopeReport) {
      console.warn(`[v4.3] WARNING: scope-creep-report.md not found. Run validate-scope.sh`);
    }

    // 如果存在 scope-creep-report.md，检查是否有阻塞性警告
    if (hasScopeReport) {
      const reportContent = await readText(scopeReportPath);
      if (reportContent.includes('⚠️') && reportContent.includes('Potential scope creep')) {
        console.warn(`[v4.3] WARNING: Scope creep detected. Review ${scopeReportPath}`);
      }
    }
  }

  const manifest = await createTaskManifest({
    repoRoot,
    changeId,
    goal,
    overwrite
  });

  // Update harness-state.json with plannedAt timestamp
  const statePath = getHarnessStatePath(repoRoot, changeId);
  if (await exists(statePath)) {
    const state = await readJson(statePath);
    state.status = 'planned';
    state.plannedAt = new Date().toISOString();
    state.updatedAt = new Date().toISOString();
    await writeJson(statePath, state);
  }

  return {
    changeId,
    manifestPath: getTaskManifestPath(repoRoot, changeId),
    taskCount: manifest.tasks.length,
    source: manifest.metadata.source
  };
}

module.exports = {
  runPlan
};
