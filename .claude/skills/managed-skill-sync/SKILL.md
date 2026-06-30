---
name: managed-skill-sync
description: cc-devflow 维护者专用。用于修改、发布或同步 cc-devflow 技能包，处理 .claude 源技能、.codex 镜像、公开 allowlist、npm publish、verify:publish、下游 refresh/explainer-comic 托管技能同步，以及只提交托管输出的 commit hygiene。
skill_class: maintenance
route_family: maintenance
---

# cc-devflow 托管技能同步

这个技能只用于 `cc-devflow` 维护和下游同步。默认 `.claude/skills/*` 是源，`.codex/skills/*` 是生成镜像；不要手改生成镜像来修漂移。

## 铁律

- 先确认当前 worktree、branch、dirty 状态。
- 修改技能契约时先改 `.claude/skills/*`。
- `.codex` 通过 `npm run adapt:codex` 生成。
- 公开发布面由 allowlist 控制；maintainer-only 技能不进 public CLI/npm。
- 发布前查 live npm truth；版本已存在就 bump。
- 下游同步按 repo-specific surface 执行：有的项目只更新 `.agents`，有的项目要 `.codex` drift proof。
- stage 只包含本次技能/生成/发布范围，保留无关 dirty work。

## 工作流

1. 预检
   - `git status --short --branch`
   - 读取 `package.json`、`config/distributable-skills.json`、相关 `.claude/skills/*/SKILL.md`。
   - 如果要发布，先跑 live registry/auth 预检。

2. 修改源技能
   - 编辑 `.claude/skills/<skill>/SKILL.md`。
   - 必要时同步模板、示例、docs、version、CHANGELOG。
   - 如果是公共技能，确认 allowlist；如果是维护技能，确认不进入 public distribution。

3. 生成镜像与校验
   - `npm run adapt:codex`
   - `npm run adapt:check`
   - `npm run verify:examples`
   - `npm run verify:publish`
   - `git diff --check`

4. 发布
   - 优先跑 repo 的 npm release audit。
   - `npm whoami` 必须成功。
   - `npm publish --dry-run --access public`
   - 真实 publish 后验证 `npm view cc-devflow version`、tarball、`npx --yes cc-devflow@<version> --help`。
   - auth 失败时停住，不继续伪发布。

5. 下游同步
   - 对 `explainer-comic`，如果用户要求只更新 `.agents`，不要碰 `.codex`。
   - 对 `refresh`，通常需要 `init --force` / `adapt --platform codex` / `adapt --check`，但每次都重新确认当前托管面。
   - 每个下游 repo 只提交托管输出，保留无关改动。

## 退出标准

- `.claude` 源和 `.codex` 镜像无 drift。
- 发布版本和 npm registry truth 一致，或明确停在 auth/blocker。
- 下游项目同步面正确，未污染无关文件。
- 给用户最短升级命令，例如 `npm install -g cc-devflow@latest` 或指定版本。
