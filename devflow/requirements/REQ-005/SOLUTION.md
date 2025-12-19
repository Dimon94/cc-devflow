# SOLUTION: CC-DevFlow 多平台适配（Compile From `.claude/`）

**Req**: REQ-005
**Status**: Draft
**Last Updated**: 2025-12-18

---

## 0. 结论先行（TL;DR）

cc-devflow 的多平台适配，不该走 spec-kit 的“每个平台一份 zip 模板”路线。

我们要做的是：把 `.claude/` 当作 **Single Source of Truth（SSOT）**，实现一个 **Adapter Compiler（编译器）**，把 `.claude` 的 rich assets（commands/scripts/skills/hooks/rules/constitution/…）编译成各平台可直接消费的产物：

- Codex CLI：`.codex/prompts/*.md`
- Cursor：`.cursorrules` + `.cursor/commands/*.md` + `.vscode/tasks.json`
- Qwen Code：`.qwen/commands/*.toml`
- Antigravity IDE（谷歌体系仅适配它，不做 Gemini CLI）：`.agent/rules/*.md` + `.agent/workflows/*.md`

本质：**维护一套源资产（`.claude/`），生成多套目标资产（`.codex/.cursor/.qwen/.agent`）。**

---

## 1. 调研结论：spec-kit 如何做多平台（从源码验证）

spec-kit 的多平台适配核心是：**build-time 静态生成 + GitHub Releases 分发 zip**，不是运行时动态适配。

### 1.1 单一真相源：AGENT_CONFIG

`spec-kit/src/specify_cli/__init__.py` 的 `AGENT_CONFIG` 是单一真相源：定义 agent 名称、目标目录（如 `.codex/`）、是否需要 CLI、安装 URL 等。

### 1.2 Release 构建：create-release-packages.sh

`spec-kit/.github/workflows/scripts/create-release-packages.sh` 负责把 `templates/commands/*.md` 编译为各平台命令文件并打包：

1. 读取 command 模板（YAML frontmatter + body）
2. 从 frontmatter 提取：`description`、`scripts`、`agent_scripts`
3. 替换占位符（确定性转换）：
   - `{SCRIPT}` / `{AGENT_SCRIPT}` → frontmatter 中定义的命令串
   - `{ARGS}` → 不同格式使用不同 token（Markdown：`$ARGUMENTS`；TOML：`{{args}}`）
   - `__AGENT__` → 目标 agent id
4. 写入平台目录：
   - Claude：`.claude/commands/*.md`
   - Cursor：`.cursor/commands/*.md`
   - Codex：`.codex/prompts/*.md`
   - Qwen：`.qwen/commands/*.toml`
5. 打包成 `spec-kit-template-{agent}-{sh|ps}-{version}.zip`，由 `specify init` 下载并解压

### 1.3 update-agent-context 的职责

spec-kit 的 `update-agent-context` 只负责“更新入口上下文文件”（比如某些平台的规则文件），与 commands 的生成是独立链路。

> 对 cc-devflow 的启发：我们不需要复制 spec-kit 的“zip 模板发布”，但应该复用它最干净的部分：**PlatformSpec + frontmatter 驱动的占位符展开**。

---

## 2. 现状诊断：cc-devflow 的多平台缺口到底在哪

cc-devflow 的价值不仅是命令文案，而是 Claude Code 专属的“约束与降噪系统”。

### 2.1 Commands 已经具备“可编译结构”

`.claude/commands/*.md` 本身具有结构化 frontmatter，并在正文里大量使用“可编译占位符”：

- `$ARGUMENTS`
- `scripts:` + `{SCRIPT:<alias>}`（例如 `{SCRIPT:prereq}`）
- `agent_scripts:` + `{AGENT_SCRIPT}`（并且包含 `__AGENT__` 注入点）

这意味着：我们不需要 Handlebars runtime engine，也能用“确定性替换”把命令编译成其他平台可消费的 workflow/prompt。

### 2.2 Skills 的真实本质（不是 MCP server）

cc-devflow 的 Skills = **模块化 Prompt Playbook（`SKILL.md`） + 触发与强制规则（`skill-rules.json`） + hooks 执行器**。

- `SKILL.md` YAML frontmatter 提供 `name/description`（天然可做 registry）
- `skill-rules.json` 提供 triggers（keywords/intent/file/content）与 enforcement（suggest/block/warn）
- `pre-tool-use-guardrail` 等 hooks 在 Claude Code 中能实现“编辑前阻断”

### 2.3 Hooks 是跨平台最大差异点

绝大多数平台没有 Claude Code 等价的 lifecycle hooks。

因此跨平台的正确做法不是“移植 hooks”，而是：

- **能执行的门禁**（例如 checklist gate）→ 变成 workflow 的显式步骤（用脚本/Node 运行并根据 exit code 决策）
- **编辑前守卫**（TDD/Constitution 等）→ 降级为 rules 强约束 + workflow 的显式校验命令

---

## 3. 新方案：Adapter Compiler（编译式适配）

### 3.1 核心原则

1. **`.claude/` 为唯一源资产（SSOT）**：不在仓库里手写维护 `.cursor/.codex/.qwen/.agent` 的“模板副本”。
2. **生成物可删可重建**：目标平台目录视为 build artifacts，可覆盖生成。
3. **确定性变换优先**：用结构化数据驱动，避免平台特判与 if/else 炸裂。
4. **能力差异靠降级策略**：工具能做就工具化；不能做就用文件引用 + 可执行 gates。

### 3.2 编译管线（Pipeline）

1. 扫描 `.claude/` → 构建 Source IR
2. Commands：占位符展开（`{SCRIPT:*}` / `{AGENT_SCRIPT}` / `$ARGUMENTS`）
3. Skills：生成 Skills Registry + Loader（渐进披露）
4. 平台 emit：输出到 `.codex/.cursor/.qwen/.agent`
5. 生成 `devflow/.generated/manifest.json`（source/target/hash/时间），支持 `--check` 与增量更新

### 3.3 关键编译规则（消灭特殊情况）

1. `{SCRIPT:<alias>}` 必须匹配 frontmatter `scripts[alias]`
   - 编译器展开为可执行命令（默认 `bash <path>`）
   - 若正文引用了不存在的 alias：编译失败（避免隐性坏味道）

> 备注：现有命令里存在少量“直接写脚本路径”的用法（例如 `Run: {SCRIPT:.claude/scripts/mark-task-complete.sh}`）。
> 编译器应将其视为 **anti-pattern**：优先要求改为 `scripts:` + `{SCRIPT:mark_task}`；
> 在过渡期可做兼容（检测到包含 `/` 的 alias 时按“原样脚本路径”处理）。

2. `{AGENT_SCRIPT}` 来源于 frontmatter `agent_scripts`
   - 选择 `sh/ps` 变体（先实现 sh）
   - 把 `__AGENT__` 替换为目标平台 id

3. `$ARGUMENTS` 的 token 规则
   - Markdown targets：保持 `$ARGUMENTS`
   - TOML targets（Qwen）：替换为 `{{args}}`

4. 文件名保持原名
   - `flow-prd.md` → `flow-prd.md`（不强制 `devflow.*` 前缀）

> 这套规则本质上是在复用 spec-kit 的“frontmatter 驱动占位符替换”，但把编译入口从 release-packaging 移到本地 `adapt`。

---

## 4. 组件适配策略（按资产类型）

### 4.1 Commands（命令 → 工作流/Prompts）

**策略**：`.claude/commands/*.md` 作为源模板，做“占位符展开 + 格式封装”，输出到目标平台目录。

| 目标平台 | 输出目录 | 格式 |
|---|---|---|
| Codex CLI | `.codex/prompts/` | Markdown |
| Cursor | `.cursor/commands/` | Markdown |
| Qwen Code | `.qwen/commands/` | TOML（prompt 内嵌 Markdown） |
| Antigravity IDE | `.agent/workflows/` | Markdown workflow |

### 4.2 Scripts（脚本 → 可发现入口）

**策略**：脚本不改动（`.claude/scripts` 继续 SSOT），但为 IDE 平台提供“可点可跑”的入口。

- Cursor：生成 `.vscode/tasks.json`
  - 暴露关键 `/flow-*` 对应的 gate/validate 脚本
  - 提供 `load_skill`、`validate-*` 等常用命令

> 现实提醒：当前脚本以 Bash 为主；“PowerShell 对等实现”应作为独立工作项，而不是编译器顺手解决。

### 4.3 Skills（技能 → Registry + Loader + MCP 可选）

**策略**：保持 `.claude/skills` 不变，生成两类东西：

1. **Skills Registry（摘要索引）**
   - 从 `SKILL.md` frontmatter + `skill-rules.json` 聚合出：
     - `name/description`
     - `type/enforcement/priority`
     - triggers（keywords/intent/file/content）
     - `path`
   - 注入到各平台 rules/context 文件中（短摘要）

2. **Skill Loader（按需加载）**
   - 统一入口：`load_skill <name>`
   - 输出：对应 `SKILL.md` 原文

可选增强（里程碑 RM-013）：

- **Local MCP Skills Server**：提供 `list_skills/get_skill` 两个 tools，给支持 MCP 的客户端更干净的“工具化渐进加载”。

### 4.4 Hooks（生命周期钩子 → 跨平台降级）

**策略**：不指望其他平台支持 Claude hooks；把可执行门禁“写进 workflow”，把 edit-time guardrail 降级为“规则 + 显式校验命令”。

---

## 5. 平台落地方案（第一批 4 个）

### 5.1 Codex CLI

- 命令：生成到 `.codex/prompts/`
- 规则入口：生成 `.codex/prompts/devflow.context.md`
  - 硬规则（必须走 `/flow-*`）
  - Skills Registry（摘要）
  - `load_skill` 用法

### 5.2 Cursor

- 规则入口：生成 `.cursorrules`（短、硬规则 + Skills Registry + Loader 用法）
- 命令：生成 `.cursor/commands/{core-*,flow-*}.md`
- 脚本入口：生成 `.vscode/tasks.json`
- MCP（可选）：生成 Cursor MCP 配置指向本地 Skills Server

### 5.3 Qwen Code

- 命令：生成 `.qwen/commands/{core-*,flow-*}.toml`
- 规则入口：生成 `QWEN.md` 或 `.qwen/context.toml`（以 Qwen 实际支持为准）
- Skills：同样走 Registry + load_skill

### 5.4 Antigravity IDE（谷歌体系仅适配它，不做 Gemini CLI）

你提供的 Antigravity 目录结构：

- workspace rules：`.agent/rules/*.md`
- workflows：`.agent/workflows/*.md`（通过 `/workflow-name` 调用）

**落地策略**：

- workflows：将 `.claude/commands/{flow-*,core-*}.md` 编译为 `.agent/workflows/{flow-*,core-*}.md`
  - workflow frontmatter：`description: <from command.description>`
  - 保留正文作为 steps
- rules：生成 `.agent/rules/rules.md`
  - rule frontmatter：`trigger: always_on`
  - 内容：硬规则 + Skills Registry + load_skill 用法

**官方约束（必须固化到编译器）**：

- Rules/Workflows 都是 Markdown 文件
- 单文件大小限制：≤ 12,000 characters
- Rules 支持触发方式：Manual / Always On / Model Decision / Glob
- Rules 支持 `@filename` 引用其他文件（相对路径按 rules 文件位置解析）

当超出 12k：优先拆分为小文件，并使用相对路径引用（例如 `@../../.claude/constitution/project-constitution.md`）。

---

## 6. 执行路径：集成到 RM-008

新增统一入口命令：

```bash
npm run adapt -- --platform antigravity
npm run adapt -- --platform cursor
npm run adapt -- --platform codex
npm run adapt -- --all
```

---

### 6.1 `update-agent-context.sh` 作为运行时编译器

目前的 RM-008 运行时入口是 `.claude/scripts/update-agent-context.sh`。这个脚本把 `.claude/` 的上下文资产编译成各个平台的规则文件，并具备以下特性：

- 不依赖 spec-kit 的 `.specify` 目录，所有路径都由 `get_repo_root` 等本地工具派生，脚本可在任意仓库中自洽运行。
- 接受 `DEVFLOW_CONTEXT_SOURCE` / `DEVFLOW_PLAN_PATH` 环境变量来指定 plan 文件，未提供时自动回退到 `devflow/ROADMAP.md`。plan 解析失败只会产生警告，不影响生成。
- 分支信息由 `DEVFLOW_BRANCH` 或当前 Git 状态推导，找不到也不会立即退出，只会让日志中提示“unknown-branch”。
- 使用内置的占位符模板生成新 agent 文件，允许用户通过 `DEVFLOW_AGENT_CONTEXT_TEMPLATE` 覆盖；模板包含 `[PROJECT NAME]`、`[DATE]`、`[EXTRACTED FROM ALL PLAN.MD FILES]` 等 tag，和 `get_commands_for_language` / `format_technology_stack` 一起保证各平台版本保持一致。
- 支持 `./update-agent-context.sh <agent>` 指定仅更新某个平台，不传参数则扫描已有 agent 文件；在没有发现任何目标文件时仍会生成默认的 `CLAUDE.md` 以保证基础环境可用。

这个脚本就是 Adapter Compiler 的实际执行者，它将各类资产传递给 `CommandEmitter`、`SkillsBridge` 和目标平台文件，保持输出可重建且流量最小。

## 7. 验证计划

### 7.1 机械验证（可脚本化）

- `adapt --platform antigravity` 后：
  - `.agent/rules/rules.md` 存在
  - `.agent/workflows/flow-prd.md` 等核心 workflows 存在
- `adapt --platform cursor` 后：
  - `.cursorrules` 存在且包含 Skills Registry
  - `.vscode/tasks.json` 存在且任务可执行
- `adapt --platform codex` 后：
  - `.codex/prompts/devflow.context.md` 存在
  - 至少 1 个 `flow-*` prompt 成功生成

### 7.2 Agent 验证（行为验证）

- Cursor：触发一个 flow（如 `/flow-checklist`），验证能通过 tasks 运行对应脚本。
- Codex：调用 `load_skill cc-devflow-orchestrator`，验证输出 `SKILL.md`。

---

## 8. 需要你确认的决策点（否则 RM-008 会反复）

1. **生成物要不要 commit？**（建议：默认不 commit、加入 `.gitignore`；需要 repo 自带时再开启 `--emit-in-repo`）
2. **Skills 优先 MCP 还是优先脚本 loader？**（建议：先 loader 通吃，MCP 作为增强）
3. **目标平台第一批是否只做 4 个？**（Codex/Cursor/Qwen/Antigravity）
4. **脚本跨平台范围**：是否承诺 Windows 原生（PowerShell），还是先把“Agent 平台适配”与“OS 跨平台”解耦？
