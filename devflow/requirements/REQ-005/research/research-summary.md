# Research Summary - REQ-005 (RM-007): Command Template Engine

## 核心洞察 (Core Insights)

1. **无需运行时模板引擎，优先“编译式适配”**:
   - `.claude/commands/*.md` 已具备结构化 frontmatter（scripts/agent_scripts）和可编译占位符（`{SCRIPT:*}`、`{AGENT_SCRIPT}`、`$ARGUMENTS`）。
   - 通过确定性展开即可生成多平台命令/工作流产物，避免引入 Handlebars runtime engine。

2. **多平台适配策略**:
   - 借鉴 `spec-kit` 的 `AGENT_CONFIG` / build-time 占位符替换思想。
   - cc-devflow 以 `.claude/` 为 SSOT，通过 Adapter Compiler 生成：`.codex/.cursor/.qwen/.agent`。
   - Skills 采用 Registry + Loader（渐进披露），Hooks 采用 workflow gates 降级。

3. **能力检测集成**:
   - 复用 RM-006 的 `AgentAdapter.detect()` 机制，作为编译器平台选择依据。
   - 通过平台 spec 描述输出目录/格式，不在业务逻辑里堆平台特判。

## 推荐用法 (Recommended Usage)

- **编译入口**: 提供 `npm run adapt`，按平台输出生成物目录（`.codex/.cursor/.qwen/.agent`）。
- **确定性展开**: 从 `.claude/commands` frontmatter 展开 `{SCRIPT:*}` / `{AGENT_SCRIPT}` / `$ARGUMENTS`。
- **渐进披露**: 在 rules/context 中只注入 Skills Registry，完整内容通过 `load_skill <name>` 按需加载。

## 待明确内容 (Pending Clarification)

- [ ] 生成物是否 commit（默认建议不 commit，作为 build artifacts）。
- [ ] Antigravity rules/workflows 的最佳拆分粒度（12k 限制下的拆分策略）。
