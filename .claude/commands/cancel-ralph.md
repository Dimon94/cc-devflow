---
description: "Cancel active Ralph Wiggum loop"
allowed-tools: ["Bash(test -f .claude/ralph-loop.local.md:*)", "Bash(rm .claude/ralph-loop.local.md)", "Read(.claude/ralph-loop.local.md)"]
hide-from-slash-command-tool: "true"
---

# Cancel Ralph - 取消 Ralph 循环

## 用途

手动取消当前会话中正在运行的 Ralph 循环。

## 使用方法

```
/cancel-ralph
```

## 执行步骤

1. 检查 `.claude/ralph-loop.local.md` 是否存在
   ```bash
   test -f .claude/ralph-loop.local.md && echo "EXISTS" || echo "NOT_FOUND"
   ```

2. **如果 NOT_FOUND**:
   - 输出: "No active Ralph loop found."

3. **如果 EXISTS**:
   - 读取 `.claude/ralph-loop.local.md` 获取当前 iteration
   - 删除状态文件:
     ```bash
     rm .claude/ralph-loop.local.md
     ```
   - 输出: "Cancelled Ralph loop (was at iteration N)" 其中 N 是 iteration 值

## 何时使用

- Ralph 循环陷入死循环
- 需要手动干预修复问题
- 想要停止无限循环

## 示例

```
User: /cancel-ralph
Assistant: [检查状态文件]
Assistant: Cancelled Ralph loop (was at iteration 15)
```

## 注意事项

- 取消后需要手动清理未完成的工作
- 建议在取消前检查 ERROR_LOG.md 了解问题
- 可以重新运行 `/flow-ralph` 从当前状态继续

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
