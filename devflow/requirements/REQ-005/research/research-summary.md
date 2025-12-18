# Research Summary - REQ-005 (RM-007): Command Emitter

## 核心洞察 (Core Insights)

1. **无需运行时模板引擎，优先"编译式适配"**:
   - `.claude/commands/*.md` 已具备结构化 frontmatter（scripts/agent_scripts）和可编译占位符（`{SCRIPT:*}`、`{AGENT_SCRIPT}`、`$ARGUMENTS`）。
   - 通过确定性展开即可生成多平台命令/工作流产物，避免引入 Handlebars runtime engine。

2. **四大目标平台格式差异**:
   | 平台 | 目录 | 格式 | 参数语法 |
   |-----|------|-----|---------|
   | OpenAI Codex | `.codex/prompts/` | Markdown | `$ARGUMENTS` |
   | Cursor | `.cursor/commands/` | Markdown | 无原生占位符 |
   | Qwen Code | `.qwen/commands/` | **TOML** | `{{args}}` |
   | Antigravity | `.agent/workflows/` | Markdown | `[bracket]` |

3. **关键约束**:
   - Antigravity: **12,000 字符上限**，需要拆分大型命令
   - Qwen: **TOML 格式**，需要格式转换
   - Cursor: **无原生占位符**，参数需内联到指令文本

4. **能力检测集成**:
   - 复用 RM-006 的 `AgentAdapter.detect()` 机制，作为编译器平台选择依据。
   - 通过平台 spec 描述输出目录/格式，不在业务逻辑里堆平台特判。

## 推荐用法 (Recommended Usage)

- **编译入口**: 提供 `npm run adapt`，按平台输出生成物目录（`.codex/.cursor/.qwen/.agent`）。
- **确定性展开**: 从 `.claude/commands` frontmatter 展开 `{SCRIPT:*}` / `{AGENT_SCRIPT}` / `$ARGUMENTS`。
- **Manifest 追踪**: 生成 `devflow/.generated/manifest.json` 记录源文件、目标文件、哈希值、时间戳。

## 技术选型 (Technology Selection)

| 库 | 用途 | 说明 |
|---|-----|-----|
| `gray-matter` | Frontmatter 解析 | 97 code snippets, High reputation |
| `js-yaml` | YAML 序列化 | Node.js 标准库 |
| `@iarna/toml` | TOML 输出 | 用于 Qwen 格式 |
| Node.js `crypto` | 哈希生成 | Manifest 完整性校验 |

## 待明确内容 (Pending Clarification)

- [x] ~~生成物是否 commit（默认建议不 commit，作为 build artifacts）~~
  → **决策**: 不 commit，添加到 `.gitignore`，仅作为 build artifacts
- [x] ~~Antigravity rules/workflows 的最佳拆分粒度（12k 限制下的拆分策略）~~
  → **决策**: 超过 10K 的命令自动拆分为多个 workflow 文件，通过命名约定关联

## 参考资料 (References)

- [Platform Format Comparison](./mcp/platform-format-comparison.md) - 完整平台对比
- [Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [Qwen Code CLI Commands](https://www.zdoc.app/en/QwenLM/qwen-code/blob/main/docs/cli/commands.md)
- [Antigravity Workflows Guide](https://antigravity.codes/blog/workflows)
