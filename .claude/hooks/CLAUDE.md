# hooks/ - Claude Code Hooks

> L2 | 父级: `.claude/CLAUDE.md`

## Purpose

Claude Code CLI 钩子脚本，在工具调用前后执行自定义逻辑。

## Members

| File | Purpose | Trigger |
|------|---------|---------|
| `inject-agent-context.ts` | Task 工具上下文注入 [v4.4] | PreToolUse(Task) |
| `inject-skill-context.ts` | Skill 上下文注入 | PreToolUse(Skill) |
| `pre-tool-use-guardrail.sh` | Edit/Write 前置检查 | PreToolUse(Edit\|Write) |
| `post-tool-use-tracker.sh` | 文件修改追踪 | PostToolUse(Edit\|Write) |
| `skill-activation-prompt.sh` | Skill 激活提示 | UserPromptSubmit |
| `error-handling-reminder.sh` | 错误处理提醒 | Stop |
| `ralph-loop.ts` | Ralph Loop 程序化验证 [v4.4] | SubagentStop |
| `checklist-gate.js` | Checklist 质量门 | Custom |

## Hook Registration (settings.json)

```json
{
  "hooks": {
    "PreToolUse": [
      {"matcher": "Edit|Write", "command": "pre-tool-use-guardrail.sh"},
      {"matcher": "Task", "command": "inject-agent-context.ts"}
    ],
    "PostToolUse": [
      {"matcher": "Edit|Write", "command": "post-tool-use-tracker.sh"}
    ],
    "SubagentStop": [
      {"command": "ralph-loop.ts"}
    ]
  }
}
```

## inject-agent-context.ts (v4.4)

借鉴 Trellis 的 `inject-subagent-context.py` 实现。

### 工作流程

```
Task(subagent_type="dev-implementer", prompt="...")
    ↓
Hook 检测到 Task 工具调用
    ↓
获取 REQ-ID (环境变量 > .current-task > 分支名)
    ↓
查找 JSONL 文件:
  1. devflow/requirements/{REQ}/context/dev-implementer.jsonl
  2. .claude/skills/workflow/flow-dev/dev-implementer.jsonl
  3. .claude/skills/workflow/flow-dev/context.jsonl
    ↓
解析 JSONL，读取文件内容
    ↓
注入到 prompt 参数中
```

### JSONL 格式 (Trellis 风格)

```jsonl
{"file": "devflow/requirements/{REQ}/TASKS.md", "reason": "Task list"}
{"file": "devflow/spec/frontend/index.md", "reason": "Frontend conventions", "optional": true}
{"file": "src/components/", "type": "directory", "reason": "Existing patterns"}
```

### Agent 映射

| subagent_type | Skill Directory | JSONL File |
|---------------|-----------------|------------|
| dev-implementer | flow-dev | dev-implementer.jsonl |
| prd-writer | flow-spec | prd-writer.jsonl |
| tech-architect | flow-spec | tech-architect.jsonl |
| planner | flow-spec | planner.jsonl |
| qa-tester | flow-quality | qa-tester.jsonl |

---

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
