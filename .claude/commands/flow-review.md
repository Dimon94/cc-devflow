---
name: flow-review
description: 'Two-Stage Code Review. Usage: /flow-review "REQ-123" or /flow-review'
agents:
  spec: .claude/agents/spec-reviewer.md
  quality: .claude/agents/code-reviewer.md
skills:
  verification: .claude/skills/verification-before-completion/SKILL.md
  receiving: .claude/skills/flow-receiving-review/SKILL.md
---

# Flow-Review - 两阶段代码审查

## User Input

```text
$ARGUMENTS = "REQ_ID" 或 空 (自动检测当前分支)
```

**示例**:
```
/flow-review "REQ-123"
/flow-review              # 自动从分支名提取 REQ-ID
```

---

## 核心理念

### Two-Stage Review

```
Stage 1: SPEC COMPLIANCE (先)
┌─────────────────────────────────────────┐
│ • 加载 PRD, EPIC, TASKS, BRAINSTORM    │
│ • 创建需求清单                         │
│ • 逐项验证（不信任实现者报告）         │
│ • 检查超范围（scope creep）            │
│ • 输出: SPEC_REVIEW.md                 │
└─────────────────────────────────────────┘
              ↓ Pass?
Stage 2: CODE QUALITY (后)
┌─────────────────────────────────────────┐
│ • 代码清晰度、结构、命名               │
│ • 测试质量和覆盖率                     │
│ • Constitution 合规                    │
│ • 性能和安全                           │
│ • 输出: CODE_QUALITY_REVIEW.md         │
└─────────────────────────────────────────┘
```

**关键**: Stage 2 只在 Stage 1 通过后执行。

---

## 执行流程

### Stage 0: Entry Gate

```yaml
1. 解析 REQ_ID
   → 从参数获取，或从分支名提取 (feature/REQ-123-xxx)

2. 验证需求目录存在
   → devflow/requirements/${REQ_ID}/

3. 加载必需文档
   → PRD.md, EPIC.md, TASKS.md, BRAINSTORM.md

4. 检查实现状态
   → TASKS.md 中所有任务标记为完成
```

---

### Stage 1: Spec Compliance Review

**调用**: `{AGENT:spec}` (spec-reviewer)

```yaml
执行:
  1. 构建需求清单
     → 从 PRD 提取验收标准
     → 从 TASKS 提取预期结果

  2. 代码验证 (不信任报告)
     → 读取实际代码
     → 逐项验证实现
     → 标记: ✅ 实现 | ❌ 缺失 | ⚠️ 部分 | 🚫 超范围

  3. Scope Creep 检测
     → 扫描未在规格中的功能
     → 每个额外功能 = 缺陷

  4. BRAINSTORM 对齐检查
     → 是否解决原始问题
     → 是否遵循选定方案

输出: devflow/requirements/${REQ_ID}/SPEC_REVIEW.md
```

**通过条件**:
- 所有需求项标记为 ✅
- 无 Scope Creep (🚫)
- BRAINSTORM 对齐

**失败处理**:
```yaml
如果 Stage 1 失败:
  → 输出 SPEC_REVIEW.md 包含失败项
  → 列出必需修复项
  → 停止，不进入 Stage 2
  → 返回给开发者修复
```

---

### Stage 2: Code Quality Review

**前置**: Stage 1 必须通过

**调用**: `{AGENT:quality}` (code-reviewer)

```yaml
执行:
  1. 代码清晰度
     → 命名是否清晰
     → 结构是否合理
     → 注释是否必要且有用

  2. 测试质量
     → 覆盖率 ≥ 80%
     → 测试是否有意义 (非 cheater tests)
     → 边界情况是否覆盖

  3. Constitution 合规
     → Article I: 完整实现
     → Article II: 无重复代码
     → Article III: 无硬编码密钥
     → Article IV: 无资源泄漏
     → Article V: 无死代码
     → Article VI: TDD 顺序

  4. 性能和安全
     → 无明显性能问题
     → 无安全漏洞

输出: devflow/requirements/${REQ_ID}/CODE_QUALITY_REVIEW.md
```

---

### Stage 3: Exit Gate

```yaml
验证:
  1. SPEC_REVIEW.md 状态 = PASS
  2. CODE_QUALITY_REVIEW.md 状态 = PASS
  3. 所有阻塞问题已解决

输出:
  → 更新 orchestration_status.json
  → 记录到 EXECUTION_LOG.md
```

---

## 输出产物

```
devflow/requirements/${REQ_ID}/
├── SPEC_REVIEW.md           # Stage 1 输出
├── CODE_QUALITY_REVIEW.md   # Stage 2 输出
└── EXECUTION_LOG.md         # 更新
```

---

## 收到审查反馈后

当收到审查反馈时，使用 `{SKILL:receiving}` 原则：

```yaml
处理反馈:
  1. 不盲目同意
     → 反馈可能有误
     → 技术上可疑？先验证

  2. 不清楚？提问澄清
     → "这个建议的具体原因是什么？"
     → "能否提供示例？"

  3. 验证后再实现
     → 确认建议正确
     → 然后实施修改
```

---

## Rationalization Prevention

| Excuse | Reality |
|--------|---------|
| "实现者说完成了" | 读代码验证。不信任报告。 |
| "测试通过了" | 测试可能不覆盖所有需求。 |
| "差不多就行" | 差不多 ≠ 正确。规格是契约。 |
| "额外功能是好事" | 额外 = scope creep = 缺陷。 |
| "Stage 1 太严格" | 严格是为了质量。不妥协。 |

---

## 错误处理

### Stage 1 失败

```yaml
输出:
  - SPEC_REVIEW.md (包含失败项)
  - 必需修复清单

下一步:
  - 开发者修复缺失/超范围项
  - 重新运行 /flow-review
```

### Stage 2 失败

```yaml
输出:
  - CODE_QUALITY_REVIEW.md (包含问题)
  - 改进建议

下一步:
  - 开发者修复质量问题
  - 重新运行 /flow-review
```

---

## Next Step

```
/flow-qa "${REQ_ID}"
```

进入 QA 测试阶段

---

**Related Documentation**:
- [spec-reviewer.md](../.claude/agents/spec-reviewer.md) - Stage 1 Agent
- [code-reviewer.md](../.claude/agents/code-reviewer.md) - Stage 2 Agent
- [verification-before-completion](../.claude/skills/verification-before-completion/SKILL.md) - 验证技能

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
