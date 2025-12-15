# CC-DevFlow Spec-Kit 借鉴升级方案 v1.0

> **文档状态**: 最终方案（已澄清）
> **生成日期**: 2025-12-15
> **实施范围**: 完整版（P0 + P1 全部特性）
> **澄清选择**: 1:B, 2:B, 3:B, 4:B, 5:C

---

## 一、方案总览

### 1.1 升级目标

引入 spec-kit 的 **"质量左移 (Shift Left)"** 理念，在编码前通过结构化澄清与需求质量检查消除歧义，显著减少下游返工。

### 1.2 核心交付物

| 优先级 | 模块 | 交付物 | 价值 |
|--------|------|--------|------|
| **P0** | 需求澄清 | `/flow-clarify` 命令 + clarify agent | 消除 PRD 输入歧义 |
| **P0** | 需求质量检查 | `/flow-checklist` 命令 + checklist agent | 需求的单元测试 |
| **P1** | 分支命名优化 | `create-requirement.sh` 升级 | 工程体验提升 |
| **P1** | GitHub API 限流 | `common.sh` + `gh_api_safe()` | 运维可靠性 |
| **P1** | Coverage Summary | `/flow-verify` 增强 | 一致性可视化 |

### 1.3 升级后工作流

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CC-DEVFLOW 升级后工作流                               │
└─────────────────────────────────────────────────────────────────────────────┘

/flow-init
    │
    ▼
┌─────────────┐   建议执行    ┌─────────────┐
│  research/  │ ───────────▶ │/flow-clarify│ ◀─── 🆕 NEW
│   初始需求   │   (Hook提示)  │  11维度澄清  │
└─────────────┘              └─────────────┘
                                    │
                                    ▼
                             research/clarifications.md
                                    │
    ┌───────────────────────────────┘
    ▼
┌─────────────┐              ┌─────────────┐
│ /flow-prd   │ ───────────▶ │   PRD.md    │
│  PRD 生成   │   读取澄清    │  (质量更高)  │
└─────────────┘              └─────────────┘
                                    │
    ┌───────────────────────────────┘
    ▼
┌─────────────┐              ┌─────────────┐
│/flow-tech   │              │/flow-checklist│ ◀─── 🆕 NEW
│ 技术设计    │              │  需求质量检查  │
└─────────────┘              └─────────────┘
                                    │
                                    ▼
                             checklists/*.md
                                    │
    ┌───────────────────────────────┘
    ▼
┌─────────────┐   入口门检查
│ /flow-epic  │ ◀─── Checklist 必须存在 ◀─── 🆕 GATE
│  任务分解   │
└─────────────┘
    │
    ▼
  (后续流程不变)
```

### 1.4 澄清决策记录

| # | 问题 | 用户选择 | 说明 |
|---|------|---------|------|
| 1 | `/flow-clarify` 定位 | **B: 推荐** | 在 /flow-prd 前提示建议执行，可跳过 |
| 2 | CLARIFICATIONS.md 位置 | **B: research目录** | `research/clarifications.md` |
| 3 | Checklist 集成点 | **B: Epic入口门** | /flow-epic 前必须有 checklist |
| 4 | 分支命名中文处理 | **B: 转拼音** | 使用 pinyin 库 |
| 5 | 实施范围 | **C: 完整** | 所有 P0 + P1 特性 |

---

## 二、模块详细设计

### 2.1 模块 A: `/flow-clarify` 命令

#### 2.1.1 定位与触发

| 属性 | 决策 |
|------|------|
| **定位** | **推荐执行**（非强制） |
| **触发点** | `/flow-prd` 执行前，Hook 提示建议执行 |
| **可跳过** | 用户可选择跳过，直接执行 `/flow-prd` |

#### 2.1.2 命令接口

```bash
# 基本用法
/flow-clarify "REQ-123"

# 指定会话问题数（默认5）
/flow-clarify "REQ-123" --max-questions 3

# 从特定维度开始
/flow-clarify "REQ-123" --focus security,performance
```

#### 2.1.3 11 维度歧义扫描分类法

```yaml
dimensions:
  1_functional_scope:
    name: "Functional Scope & Behavior"
    description: "核心目标、边界、主要功能"
    example_questions:
      - "系统是否需要支持离线模式？"
      - "批量操作的上限是多少条记录？"

  2_domain_data_model:
    name: "Domain & Data Model"
    description: "实体、属性、生命周期、关系"
    example_questions:
      - "订单状态有哪些？状态转换规则是什么？"
      - "用户删除后关联数据如何处理？"

  3_interaction_ux:
    name: "Interaction & UX Flow"
    description: "关键用户旅程、异常状态、交互模式"
    example_questions:
      - "表单提交失败后用户看到什么？"
      - "长列表是分页还是无限滚动？"

  4_non_functional:
    name: "Non-Functional Quality Attributes"
    description: "性能、安全、可观测性、可用性"
    example_questions:
      - "API 响应时间目标是多少？(P95)"
      - "需要支持多少并发用户？"

  5_integration:
    name: "Integration & External Dependencies"
    description: "外部服务、API、故障模式"
    example_questions:
      - "第三方支付失败时的降级策略？"
      - "外部 API 超时阈值是多少？"

  6_edge_cases:
    name: "Edge Cases & Failure Handling"
    description: "负向场景、冲突解决、边界条件"
    example_questions:
      - "两个用户同时编辑同一记录怎么处理？"
      - "输入超过最大长度时截断还是拒绝？"

  7_constraints:
    name: "Constraints & Tradeoffs"
    description: "技术约束、业务约束、取舍决策"
    example_questions:
      - "是否有必须使用的现有技术栈？"
      - "一致性 vs 可用性，优先哪个？"

  8_terminology:
    name: "Terminology & Consistency"
    description: "术语一致性、命名规范"
    example_questions:
      - "'用户' 和 '账户' 是同一概念吗？"
      - "API 中的 'status' 和 UI 中的 '状态' 对应吗？"

  9_completion_signals:
    name: "Completion Signals"
    description: "可测量的完成标准、验收条件"
    example_questions:
      - "如何判断该功能'完成'了？"
      - "有哪些可量化的成功指标？"

  10_placeholders:
    name: "Misc / Placeholders"
    description: "TODOs、模糊形容词、待定内容"
    example_questions:
      - "文档中的 'TBD' 需要什么具体值？"
      - "'用户友好的错误提示' 具体是什么？"

  11_security_privacy:
    name: "Security & Privacy"
    description: "权限模型、数据保护、合规要求"
    example_questions:
      - "哪些字段需要加密存储？"
      - "是否需要符合 GDPR/等保要求？"
```

#### 2.1.4 推荐选项交互模式

**Prompt 模板核心逻辑**:

```markdown
## Question Generation Rules

For each ambiguity found:
1. Explain WHY this ambiguity will cause rework downstream
2. Provide **Recommended Option** with reasoning
3. Format as:

---
**Q1: [Dimension: Integration]**

🔍 **歧义点**: 第三方支付服务超时时的处理策略未定义

⚠️ **返工风险**: 如果不明确，开发时会做假设，上线后可能需要重写错误处理逻辑

**Recommended:** Option B - 队列重试 (更可靠，符合支付行业最佳实践)

| Option | Description |
|--------|-------------|
| A | 直接返回失败，用户手动重试 |
| B | 后台队列重试 3 次，间隔递增 (recommended) |
| C | 同步重试 2 次后返回失败 |

Reply "B", "recommended", or your own answer.
---
```

#### 2.1.5 输出规格

**文件路径**: `devflow/requirements/REQ-XXX/research/clarifications.md`

**文件格式**:

```markdown
# Clarifications: REQ-XXX

> Generated by: /flow-clarify
> Date: 2025-12-15
> Session: 1 of N

## Summary

| Dimension | Status | Questions Asked |
|-----------|--------|-----------------|
| Functional Scope | ✅ Clear | 0 |
| Domain & Data Model | ⚠️ Partial | 2 |
| Integration | ❌ Missing | 1 |
| ... | ... | ... |

**Overall Clarity Score**: 78% (7/9 dimensions clear)

---

## Clarification Log

### Q1: [Domain & Data Model]

**歧义点**: 订单状态机未完整定义

**用户回答**: 选择 B - 标准电商状态机 (待支付→已支付→发货中→已完成→已取消)

**更新内容**:
- 新增状态: `refunding`, `refunded`
- 取消规则: 发货前可取消，发货后需走退款流程

---

### Q2: [Integration]

**歧义点**: 支付超时处理

**用户回答**: B (recommended) - 队列重试

**更新内容**:
- 超时阈值: 30s
- 重试策略: 最多3次，间隔 [5s, 30s, 120s]
- 最终失败: 通知用户手动处理

---

## Pending Clarifications (Next Session)

- [ ] Security: 敏感字段加密方案待定
- [ ] Performance: 并发用户数目标待确认
```

#### 2.1.6 Hook 集成

**文件**: `.claude/hooks/clarify-reminder.js`

```javascript
// PreToolUse hook for /flow-prd
module.exports = {
  event: "PreToolUse",
  trigger: "SlashCommand:/flow-prd",
  action: async (context) => {
    const reqId = context.args[0];
    const clarifyPath = `devflow/requirements/${reqId}/research/clarifications.md`;

    if (!fs.existsSync(clarifyPath)) {
      return {
        type: "suggest",
        message: `💡 建议先执行 /flow-clarify "${reqId}" 消除需求歧义，可显著减少返工。\n\n输入 "skip" 跳过，或按 Enter 继续执行澄清。`
      };
    }
    return { type: "pass" };
  }
};
```

---

### 2.2 模块 B: `/flow-checklist` 命令

#### 2.2.1 定位与触发

| 属性 | 决策 |
|------|------|
| **定位** | `/flow-epic` 入口门 |
| **触发点** | PRD 完成后，Epic 生成前 |
| **强制性** | Checklist 必须存在才能执行 `/flow-epic` |

#### 2.2.2 命令接口

```bash
# 生成默认 checklist (综合)
/flow-checklist "REQ-123"

# 生成特定类型
/flow-checklist "REQ-123" --type ux
/flow-checklist "REQ-123" --type api
/flow-checklist "REQ-123" --type security
/flow-checklist "REQ-123" --type performance
/flow-checklist "REQ-123" --type data

# 生成多个类型
/flow-checklist "REQ-123" --type ux,api,security
```

#### 2.2.3 核心理念: Unit Tests for English

**Anti-Examples (必须包含在 Prompt 中)**:

```markdown
## CRITICAL: Test Requirements, NOT Implementation

You are generating a checklist that tests the QUALITY of REQUIREMENTS,
not a test plan for the implementation.

### ❌ WRONG Examples (Testing Implementation):
- "Verify the login page displays a username field"
- "Test that clicking submit sends the form"
- "Check that the API returns 200 OK"
- "Validate that 3 cards are displayed"

### ✅ RIGHT Examples (Testing Requirement Quality):
- "Is the exact layout of the login form specified? [Completeness]"
- "Are all form validation rules explicitly defined? [Completeness]"
- "Is 'user-friendly error message' quantified with specific text? [Clarity]"
- "Do the mobile and desktop specs use consistent terminology? [Consistency]"
- "Is the success criteria measurable (e.g., '< 2s load time')? [Measurability]"
- "Are edge cases like empty state and error state covered? [Coverage]"
```

#### 2.2.4 检查维度标签

```yaml
quality_dimensions:
  completeness:
    tag: "[Completeness]"
    question_pattern: "是否定义了 X？"
    examples:
      - "是否定义了所有 API 端点的请求/响应格式？[Completeness]"
      - "是否明确了所有用户角色的权限范围？[Completeness]"

  clarity:
    tag: "[Clarity]"
    question_pattern: "X 是否有明确/可量化的定义？"
    examples:
      - "'快速响应' 是否有具体的时间指标？[Clarity]"
      - "'大量数据' 的具体数量级是多少？[Clarity]"

  consistency:
    tag: "[Consistency]"
    question_pattern: "X 和 Y 之间是否一致？"
    examples:
      - "API 文档和 UI 原型中的字段命名是否一致？[Consistency]"
      - "不同用户故事中对同一实体的描述是否一致？[Consistency]"

  measurability:
    tag: "[Measurability]"
    question_pattern: "如何验证 X 是否满足？"
    examples:
      - "如何验证'用户体验流畅'？[Measurability]"
      - "性能指标是否有具体的测试方法？[Measurability]"

  coverage:
    tag: "[Coverage]"
    question_pattern: "是否覆盖了 X 场景？"
    examples:
      - "是否覆盖了网络断开的场景？[Coverage]"
      - "是否覆盖了用户取消操作的场景？[Coverage]"
```

#### 2.2.5 输出规格

**文件路径**: `devflow/requirements/REQ-XXX/checklists/[type].md`

**文件格式**:

```markdown
# Requirements Checklist: REQ-XXX
## Type: API

> Generated by: /flow-checklist
> Date: 2025-12-15
> PRD Version: 1.0.0

---

## Checklist Items

### Completeness

- [ ] 是否定义了所有 API 端点的 HTTP 方法？[Completeness]
- [ ] 是否定义了所有端点的认证要求？[Completeness]
- [ ] 是否定义了所有错误响应的格式和状态码？[Completeness]
- [ ] 是否定义了分页参数（page, limit, offset）？[Completeness]

### Clarity

- [ ] "批量操作" 的最大数量是否有明确数值？[Clarity]
- [ ] "合理的响应时间" 是否有具体 SLA？[Clarity]
- [ ] 日期时间格式是否明确（ISO 8601？时区？）？[Clarity]

### Consistency

- [ ] 所有端点的命名风格是否一致（kebab-case/camelCase）？[Consistency]
- [ ] 错误响应结构是否在所有端点保持一致？[Consistency]
- [ ] 分页响应格式是否统一？[Consistency]

### Measurability

- [ ] API 性能指标（P95 延迟）如何测量？[Measurability]
- [ ] 并发处理能力如何验证？[Measurability]

### Coverage

- [ ] 是否覆盖了认证失败场景？[Coverage]
- [ ] 是否覆盖了资源不存在场景（404）？[Coverage]
- [ ] 是否覆盖了请求体验证失败场景？[Coverage]
- [ ] 是否覆盖了并发冲突场景（409）？[Coverage]

---

## Summary

| Dimension | Total | Checked | Percentage |
|-----------|-------|---------|------------|
| Completeness | 4 | 0 | 0% |
| Clarity | 3 | 0 | 0% |
| Consistency | 3 | 0 | 0% |
| Measurability | 2 | 0 | 0% |
| Coverage | 4 | 0 | 0% |
| **Total** | **16** | **0** | **0%** |

---

## Gate Status

**Minimum Pass Threshold**: 80%
**Current Status**: ❌ NOT PASSED (0%)

> ⚠️ /flow-epic 入口门要求 Checklist 完成度 ≥ 80%
```

#### 2.2.6 入口门集成

**文件**: `.claude/hooks/checklist-gate.js`

```javascript
// PreToolUse hook for /flow-epic
module.exports = {
  event: "PreToolUse",
  trigger: "SlashCommand:/flow-epic",
  action: async (context) => {
    const reqId = context.args[0];
    const checklistDir = `devflow/requirements/${reqId}/checklists`;

    if (!fs.existsSync(checklistDir) || fs.readdirSync(checklistDir).length === 0) {
      return {
        type: "block",
        message: `❌ /flow-epic 入口门失败: 未找到 Checklist\n\n请先执行: /flow-checklist "${reqId}"\n\n这确保需求质量在任务分解前得到验证。`
      };
    }

    // 检查完成度
    const completion = calculateChecklistCompletion(checklistDir);
    if (completion < 0.8) {
      return {
        type: "block",
        message: `❌ /flow-epic 入口门失败: Checklist 完成度 ${(completion*100).toFixed(0)}% < 80%\n\n请先完成 Checklist 检查项。`
      };
    }

    return { type: "pass" };
  }
};
```

---

### 2.3 模块 C: 分支命名优化

#### 2.3.1 升级规格

**文件**: `.claude/scripts/create-requirement.sh`

**新增能力**:

```bash
# 新增参数
--short-name <name>    # 可选：手动指定短名
--max-length <bytes>   # 可选：最大长度（默认 244）
--no-pinyin           # 禁用拼音转换

# 自动处理逻辑
1. 停用词过滤
   - English: the, a, an, is, are, for, with, and, or, to, of, in, on, at, by
   - Chinese: 的, 了, 是, 在, 和, 与, 或

2. 中文转拼音
   - 使用 pinyin 库
   - 保留首字母大写
   - 示例: "用户登录功能" → "yong-hu-deng-lu-gong-neng"

3. 长度限制
   - GitHub 分支名限制: 244 bytes
   - 超长处理: 截断 + 警告
   - 保留 REQ-ID 前缀: feature/REQ-XXX-<truncated-name>

4. 特殊字符处理
   - 空格 → 连字符
   - 移除: !@#$%^&*()+=[]{}|;:'",.<>?/\
   - 连续连字符合并
```

#### 2.3.2 示例

```bash
# 输入
/flow-init "REQ-001|用户可以通过邮箱和密码进行登录认证"

# 自动生成分支名
feature/REQ-001-yong-hu-you-xiang-mi-ma-deng-lu-ren-zheng

# 使用短名
/flow-init "REQ-001|用户登录" --short-name user-login

# 生成分支名
feature/REQ-001-user-login
```

#### 2.3.3 依赖

```json
{
  "dependencies": {
    "pinyin": "^3.0.0"
  }
}
```

---

### 2.4 模块 D: GitHub API 限流处理

#### 2.4.1 新增函数

**文件**: `.claude/scripts/common.sh`

```bash
#!/bin/bash

# GitHub API 安全调用包装器
# 处理限流、认证错误、网络超时
gh_api_safe() {
    local cmd="$1"
    local max_retries="${2:-3}"
    local retry_count=0

    while [ $retry_count -lt $max_retries ]; do
        # 执行命令，捕获输出和错误
        local output
        local exit_code
        output=$(eval "$cmd" 2>&1)
        exit_code=$?

        if [ $exit_code -eq 0 ]; then
            echo "$output"
            return 0
        fi

        # 检查是否是限流错误
        if echo "$output" | grep -q "rate limit\|API rate limit exceeded"; then
            local reset_time=$(gh api rate_limit --jq '.rate.reset')
            local wait_seconds=$((reset_time - $(date +%s)))

            if [ $wait_seconds -gt 0 ] && [ $wait_seconds -lt 3600 ]; then
                echo "⏳ GitHub API 限流，等待 ${wait_seconds} 秒后重试..." >&2
                echo "💡 建议: 设置 GITHUB_TOKEN 环境变量可提升限额" >&2
                sleep $wait_seconds
                ((retry_count++))
                continue
            fi
        fi

        # 检查认证错误
        if echo "$output" | grep -q "401\|authentication\|Bad credentials"; then
            echo "❌ GitHub 认证失败" >&2
            echo "💡 解决方案:" >&2
            echo "   1. 运行: gh auth login" >&2
            echo "   2. 或设置: export GITHUB_TOKEN=<your-token>" >&2
            return 1
        fi

        # 其他错误，直接返回
        echo "$output" >&2
        return $exit_code
    done

    echo "❌ 重试 $max_retries 次后仍然失败" >&2
    return 1
}

# 使用示例
# gh_api_safe "gh api repos/owner/repo/pulls"
# gh_api_safe "gh pr create --title 'feat: xxx'" 5
```

#### 2.4.2 集成点

需要更新以下脚本使用 `gh_api_safe`:

- `.claude/scripts/create-requirement.sh`
- `.claude/agents/release-manager.md` 相关脚本调用

---

### 2.5 模块 E: Coverage Summary Table

#### 2.5.1 增强 `/flow-verify`

**输出格式增强**:

```markdown
## Coverage Summary

### Requirements → Tasks Mapping

| Requirement Key | PRD Section | Has Task? | Task IDs | Status |
|-----------------|-------------|-----------|----------|--------|
| user-login | US1 | ✅ | T012, T015 | Complete |
| password-reset | US1 | ✅ | T018 | Complete |
| oauth-google | US2 | ⚠️ | T025 | Partial |
| admin-dashboard | US3 | ❌ | - | Gap |

### Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total Requirements | 15 | - |
| Covered | 12 | 80% |
| Partial | 2 | 13% |
| Gaps | 1 | 7% |
| **Overall Coverage** | **87%** | ✅ Pass |

### Critical Issues

| Severity | Location | Issue | Recommendation |
|----------|----------|-------|----------------|
| 🔴 High | US3 | admin-dashboard 无对应任务 | 添加 T030-T032 |
| 🟡 Medium | T025 | oauth-google 缺少错误处理任务 | 补充边界测试 |
```

---

## 三、文件清单

### 3.1 新增文件

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `.claude/commands/flow-clarify.md` | Command | 需求澄清命令 |
| `.claude/commands/flow-checklist.md` | Command | 需求质量检查命令 |
| `.claude/agents/clarify-agent.md` | Agent | 澄清代理 (~300 lines) |
| `.claude/agents/checklist-agent.md` | Agent | Checklist 代理 (~250 lines) |
| `.claude/hooks/clarify-reminder.js` | Hook | PRD 前澄清提示 |
| `.claude/hooks/checklist-gate.js` | Hook | Epic 入口门检查 |
| `.claude/docs/templates/CLARIFICATIONS_TEMPLATE.md` | Template | 澄清文档模板 |
| `.claude/docs/templates/CHECKLIST_TEMPLATE.md` | Template | Checklist 模板 |

### 3.2 修改文件

| 文件路径 | 修改内容 |
|---------|---------|
| `.claude/scripts/create-requirement.sh` | 分支命名优化 |
| `.claude/scripts/common.sh` | 新增 `gh_api_safe()` |
| `.claude/agents/prd-writer.md` | 读取 clarifications.md |
| `.claude/agents/consistency-checker.md` | Coverage Summary Table |
| `.claude/commands/flow-verify.md` | 输出格式增强 |
| `.claude/skills/cc-devflow-orchestrator/skill.md` | 更新工作流图 |

### 3.3 依赖更新

| 文件 | 变更 |
|------|------|
| `package.json` | 新增 `pinyin: ^3.0.0` |

---

## 四、集成矩阵

### 4.1 命令依赖关系

```
/flow-init
    │
    ├──▶ /flow-clarify (推荐，可跳过)
    │         │
    │         ▼
    │    clarifications.md
    │         │
    ▼         │
/flow-prd ◀──┘ (读取澄清结果)
    │
    ▼
/flow-checklist (PRD 后执行)
    │
    ▼
checklists/*.md
    │
    ▼
/flow-epic (入口门: checklist ≥ 80%)
    │
    ▼
(后续流程不变)
```

### 4.2 Agent 数据流

```
┌─────────────────┐
│ clarify-agent   │
│ (NEW)           │
└────────┬────────┘
         │ writes
         ▼
┌─────────────────┐     reads      ┌─────────────────┐
│ clarifications  │ ──────────────▶│ prd-writer      │
│ .md             │                │ (MODIFIED)      │
└─────────────────┘                └────────┬────────┘
                                            │ writes
                                            ▼
                                   ┌─────────────────┐
                                   │ PRD.md          │
                                   └────────┬────────┘
                                            │ reads
                                            ▼
                                   ┌─────────────────┐
                                   │ checklist-agent │
                                   │ (NEW)           │
                                   └────────┬────────┘
                                            │ writes
                                            ▼
                                   ┌─────────────────┐
                                   │ checklists/     │
                                   │ *.md            │
                                   └─────────────────┘
```

---

## 五、验收标准

### 5.1 功能验收

| ID | 验收项 | 验收方法 |
|----|--------|---------|
| A1 | `/flow-clarify` 可正常执行 | 手动测试 |
| A2 | 11 维度扫描输出完整 | 检查输出格式 |
| A3 | 推荐选项机制工作正常 | 交互测试 |
| A4 | clarifications.md 正确生成 | 文件检查 |
| A5 | `/flow-prd` 读取澄清结果 | 集成测试 |
| A6 | `/flow-checklist` 可正常执行 | 手动测试 |
| A7 | Anti-Example 逻辑有效 | 输出检查 |
| A8 | Checklist 入口门工作正常 | 阻断测试 |
| A9 | 分支命名优化有效 | 各种输入测试 |
| A10 | `gh_api_safe` 限流处理正确 | 模拟测试 |
| A11 | Coverage Summary 格式正确 | 输出检查 |

### 5.2 非功能验收

| ID | 验收项 | 标准 |
|----|--------|------|
| N1 | Agent 文件大小 | ≤ 500 lines |
| N2 | 命令响应时间 | < 30s (非 AI 调用部分) |
| N3 | 文档完整性 | 所有新命令有对应文档 |
| N4 | 向后兼容 | 现有流程不受影响 |

---

## 六、风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| 11 维度扫描过于繁琐 | 中 | 用户体验下降 | 支持 `--focus` 参数聚焦特定维度 |
| Checklist 入口门过严 | 低 | 流程阻塞 | 提供 `--skip-gate` 紧急跳过选项 |
| 拼音转换不准确 | 中 | 分支名可读性差 | 优先使用 `--short-name` 手动指定 |
| Hook 性能影响 | 低 | 命令变慢 | Hook 逻辑保持轻量 |

---

## 七、参考来源

本方案综合分析了以下三份文档：

1. **SPEC_KIT_IMPLEMENTATION_RECOMMENDATION_GEMINI3.md** - Gemini 的实施建议
   - 核心贡献: 11 维度歧义分类法、推荐选项交互模式

2. **SPEC_KIT_ITERATION_BORROWING_CODEX.md** - Codex 的迭代差异报告
   - 核心贡献: 分支命名优化、GitHub API 限流处理、优先级矩阵

3. **SPEC_KIT_REFERENCE_ANALYSIS_CLAUDE.md** - Claude 的借鉴分析报告
   - 核心贡献: 架构对比、Coverage Summary Table、集成建议

---

**文档版本**: 1.0.0
**生成工具**: Claude Opus 4.5
**关联任务**: [SPEC_KIT_UPGRADE_TASKS.md](./SPEC_KIT_UPGRADE_TASKS.md)
