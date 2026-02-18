---
name: flow-ideate
description: 'Intent-driven requirement development. Usage: /flow:ideate "我想做一个用户管理系统" or /flow:ideate "REQ-123|我想要一个数据分析的东西"'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  create_requirement: .claude/scripts/create-requirement.sh
  manage_constitution: .claude/scripts/manage-constitution.sh
agent_scripts:
  sh: .claude/scripts/update-agent-context.sh __AGENT__
  ps: scripts/powershell/update-agent-context.ps1 -AgentType __AGENT__
---

# Flow-Ideate - 意图驱动需求开发

## User Input
```text
$ARGUMENTS = "REQ_ID?|IDEA|LINKS?"
```
允许纯自然语言、半结构化、“REQ|标题|链接”三种形式。缺省 REQ_ID 时会生成新的 ID。

## 命令格式
```text
/flow:ideate "我想做一个用户管理系统"
/flow:ideate "REQ-123|我想要一个用户管理的东西"
/flow:ideate "|数据分析功能|一些想法和计划链接"
/flow:ideate "REQ-123|支持用户下单|https://plan.example.com/Q1"
```

## 执行流程

### 阶段 1: 输入解析
- 解析 `$ARGUMENTS`：
  - 如果匹配 `REQ|TITLE|LINKS` → 进入 `/flow:init`（随后执行 `/flow:spec`）。
  - 如果包含 `REQ-XXX` 且标题为空 → 视为已有需求再澄清。
  - 纯自然语言 → 进入意图澄清模式。
- 对于新需求生成候选 `REQ-${YYYYMMDD}-${seq}`。

### 阶段 2: 意图澄清（模糊/半结构化）
```
1. 调用 prd-writer agent:
   → 输入原始描述、链接、历史上下文
   → 输出澄清建议、初始理解、关键问题列表

2. 对话轮数最多 4 轮：
   → 每轮 3-5 个关键问题
   → 优先顺序：领域/目标 → 核心用户 → 功能范围 → 验收标准 → 约束
   → 识别安全/合规/性能需求时必须追问

3. 会话产物:
   → .claude/temp/intent-session-*.json (记录问答与提取信息)
   → 置信度 ≥ 80% 且关键信息完整时结束澄清
```

### 阶段 3: 结构化与初始化
```
1. 生成最终 `REQ_ID|TITLE|PLAN_URLS` 字符串
2. 调用 {SCRIPT:create_requirement} --title "${TITLE}"
   → 创建 devflow/requirements/${REQ_ID}/
3. 写入 README.md，附上原始描述与澄清纪要
4. 调用 {SCRIPT:prereq} --json --paths-only 校验结构
5. orchestration_status.json 初始化 status="initialized"
```

### 阶段 4: 标准流程对接
- 对于模糊输入：推荐自动触发 `/flow:spec` 或提示用户继续。
- 对于已有 REQ-ID：在 README 中记录追加需求并提示 `/flow:upgrade`。
- 将澄清会话摘要写入 `research/intent-log.md` 供后续引用。

## 错误处理
- 输入仅为链接或空字符串 → 提示提供最少“谁/做什么/目标”信息。
- 澄清达到上限仍不完整 → 输出未决事项并建议人工介入。
- 生成 REQ 目录失败 → 回滚已创建文件，提示用户检查权限/路径。

## 输出
```
✅ 新需求目录 (若生成 REQ)
✅ research/intent-log.md (记录澄清问题与回答)
✅ README.md 更新（含最终意图总结）
✅ orchestration_status.json 初始化
```

## 下一步
- 对新需求执行 `/flow:init "REQ_ID|TITLE"` 完成初始化。
- 若是已有需求的变更，使用 `/flow:upgrade` 创建版本升级。
- 通过 `/flow:status REQ_ID --detailed` 查看澄清结果与推荐动作。

### 3. 这是新系统还是现有系统的改进？
**Why this matters**: 影响技术方案和实施策略
**Examples**: 全新开发、现有系统增强、系统替换

## Next Steps:
Once you provide these answers, I'll generate more specific questions about功能细节和技术要求.
```

**用户回答**:
```text
主要是内部员工使用，需要权限管理、部门管理、角色分配这些功能。是现有系统的增强。
```

**系统澄清轮次2**:
```markdown
# Requirement Clarification for 内部员工权限管理系统

## Updated Understanding:
- **Domain**: 企业内部用户权限管理
- **Users**: 内部员工 + 管理员
- **Core Function**: 权限管理、部门管理、角色分配
- **Context**: 现有系统增强
- **Confidence**: 70%

## Additional Questions:

### 1. 现有系统是什么技术栈？
**Why this matters**: 确保技术兼容性
**Examples**: Java Spring, Node.js, Python Django

### 2. 权限管理需要多细粒度？
**Why this matters**: 影响权限模型设计复杂度
**Examples**: 页面级、功能级、数据级、字段级

### 3. 大概有多少员工会使用这个系统？
**Why this matters**: 影响性能设计和架构选择
**Examples**: <100人, 100-1000人, >1000人

## Next Steps:
基于您的回答，我将生成完整的PRD并启动开发流程。
```

### 示例2: 数据分析功能

**用户输入**:
```text
/flow:ideate "需要一个数据分析功能来帮助业务决策"
```

**系统澄清过程**:
- 识别数据来源和类型
- 明确分析维度和指标
- 确定目标用户和使用场景
- 了解数据可视化需求

## 输出产物

### 临时文件
```text
.claude/temp/
├── intent-session-${timestamp}.json    # 对话会话状态
├── clarification-${session_id}.md      # 澄清问题文档
└── extracted-requirements.json        # 提取的需求信息
```

### 最终需求结构
```text
devflow/requirements/${auto_generated_req_id}/
├── INTENT_ANALYSIS.md          # 意图分析和澄清过程
├── PRD.md                      # 标准产品需求文档
├── EPIC.md                     # Epic 规划
├── tasks/                      # 任务分解
└── [其他标准文档...]
```

## 配置选项

### 环境变量
```bash
# Intent-driven 特定配置
export FLOW_MAX_CLARIFICATION_ROUNDS=4
export FLOW_MIN_CONFIDENCE_THRESHOLD=80
export FLOW_AUTO_REQ_ID_FORMAT="REQ-%Y%m%d-%03d"
export FLOW_QUESTION_SELECTION_STRATEGY="adaptive"
```

### 设置文件扩展
```json
{
  "flow": {
    "intentDriven": {
      "enabled": true,
      "maxClarificationRounds": 4,
      "minConfidenceThreshold": 80,
      "autoReqIdGeneration": true,
      "questionSelectionStrategy": "adaptive"
    }
  }
}
```

## 智能特性

### 学习和优化
- **问题效果追踪**: 记录哪些问题类型最有效
- **域模型优化**: 基于历史数据优化业务域识别
- **用户习惯学习**: 适应不同用户的表达习惯

### 上下文感知
- **项目历史**: 参考项目历史需求，提供上下文相关的问题
- **技术栈感知**: 基于现有技术栈生成相关的技术约束问题
- **团队偏好**: 学习团队的开发偏好和标准

## 质量保证

### 澄清质量检查
- 问题覆盖度检查（确保涵盖所有PRD必需信息）
- 问题清晰度验证（避免模糊或容易误解的问题）
- 轮次效率监控（确保每轮都有实质性进展）

### 结果验证
- 生成需求的完整性验证
- 与原始意图的一致性检查
- 技术可行性初步评估

---

**核心价值**: /flow:ideate 将 cc-devflow 的能力边界从"明确需求的快速实现"扩展到"模糊想法的完整转化"，显著降低了使用门槛，支持更多探索性和创新性的开发场景。
