---
name: flow-ideate
description: Intent-driven requirement development. Usage: /flow-ideate "我想做一个用户管理系统" or /flow-ideate "REQ-123|我想要一个数据分析的东西"
---

# Flow-Ideate - 意图驱动需求开发

## 命令格式

### 模糊想法模式
```text
/flow-ideate "我想做一个用户管理系统"
/flow-ideate "需要一个数据分析功能来帮助业务决策"
/flow-ideate "希望优化当前的订单处理流程"
```

### 半结构化模式
```text
/flow-ideate "REQ-123|我想要一个用户管理的东西"
/flow-ideate "|数据分析功能|一些想法和计划链接"
```

### 传统精确模式 (向后兼容)
```text
/flow-ideate "REQ-123|支持用户下单|https://plan.example.com/Q1"
```

## 执行流程

### 1. 输入解析和模式识别

#### 模式检测算法
```yaml
解析步骤:
  1. 格式检测:
     - 检查管道符结构 (|)
     - 识别 REQ-ID 模式 (REQ-\d+)
     - 检测 URL 存在性

  2. 内容分析:
     - 自然语言处理
     - 关键词提取 (用户管理, 数据分析, 订单处理)
     - 意图识别 (新建功能, 优化流程, 系统集成)

  3. 模式判定:
     - 精确模式: 完整 REQ-ID|TITLE|PLAN_URLS
     - 半结构化: 部分结构 + 模糊描述
     - 模糊模式: 纯自然语言描述

  4. 路由处理:
     - 精确模式 → 直接调用现有 flow:new 流程
     - 半结构化 → 混合处理流程
     - 模糊模式 → Intent-driven 澄清流程
```

### 2. Intent-driven 澄清流程

#### 2.1 初始分析阶段
```bash
Task: prd-writer "Analyze intent and generate clarification questions for: ${user_input}"
```

**prd-writer 输出**: `.claude/temp/clarification-${session_id}.md`
- 当前理解的需求概要
- 识别的业务域和用户群体
- 3-5个关键澄清问题
- 置信度评估

#### 2.2 交互澄清阶段
```yaml
对话流程:
  最大轮次: 4轮
  每轮问题数: 3-5个
  问题优先级: 核心定位 → 功能范围 → 技术约束 → 验收标准

退出条件:
  - 置信度 ≥ 80%
  - 核心信息完整 (业务域 + 目标用户 + 核心功能)
  - 用户明确表示满意

状态持久化:
  文件: .claude/temp/intent-session-${timestamp}.json
  内容: 对话历史、提取信息、当前状态
```

#### 2.3 需求结构化阶段
根据澄清结果，自动生成：
- **REQ-ID**: 自动生成格式 `REQ-${YYYYMMDD}-${seq}`
- **标题**: 基于核心功能和业务域组合
- **描述**: 完整的需求描述文档

### 3. 统一流程执行

无论哪种输入模式，最终都会：
1. 生成标准化的 `REQ-ID|TITLE|DESCRIPTION`
2. 创建需求目录结构
3. 调用标准的 flow-orchestrator 流程
4. 执行完整的开发流程

### 4. 宪法约束验证

在每个关键节点进行 Constitution 合规检查：
```yaml
澄清阶段检查:
  - 质量要求: 澄清问题必须全面，不遗漏关键信息
  - 安全考虑: 识别并询问安全相关需求

结构化阶段检查:
  - 完整性: 生成的需求必须包含所有必要信息
  - 架构一致性: 需求必须与现有系统架构兼容
```

## 交互式澄清示例

### 示例1: 用户管理系统

**用户输入**:
```text
/flow-ideate "我想做一个用户管理系统"
```

**系统澄清轮次1**:
```markdown
# Requirement Clarification for 用户管理系统

## Current Understanding:
- **Domain**: 用户管理/身份认证
- **Users**: 待确认
- **Core Function**: 用户信息管理
- **Confidence**: 30%

## Critical Questions (Please answer to proceed):

### 1. 这个系统主要面向哪些用户？
**Why this matters**: 不同用户类型需要不同的功能设计
**Examples**: 内部员工、外部客户、管理员、普通用户

### 2. 用户管理的核心功能是什么？
**Why this matters**: 明确功能范围，避免范围蔓延
**Examples**: 用户注册、登录认证、权限控制、个人信息管理

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
/flow-ideate "需要一个数据分析功能来帮助业务决策"
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
.claude/docs/requirements/${auto_generated_req_id}/
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

**核心价值**: /flow-ideate 将 cc-devflow 的能力边界从"明确需求的快速实现"扩展到"模糊想法的完整转化"，显著降低了使用门槛，支持更多探索性和创新性的开发场景。
