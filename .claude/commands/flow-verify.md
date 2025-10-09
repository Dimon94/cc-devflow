---
name: flow-verify
description: Comprehensive consistency verification across documents and implementation. Usage: /flow-verify "REQ-123" or /flow-verify --all
---

# Flow-Verify - 一致性验证命令

## 命令格式

### 单项目验证
```text
/flow-verify "REQ-123"
/flow-verify "REQ-123" --detailed
/flow-verify "REQ-123" --fix-auto
```

### 批量验证
```text
/flow-verify --all
/flow-verify --all --summary
/flow-verify --all --critical-only
```

### 增量验证
```text
/flow-verify "REQ-123" --since="2025-01-20"
/flow-verify "REQ-123" --diff="v1.0..v1.1"
/flow-verify --changed
```

### 特定维度验证
```text
/flow-verify "REQ-123" --documents-only
/flow-verify "REQ-123" --implementation-only
/flow-verify "REQ-123" --tests-only
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/core-patterns.md):
   - Fail Fast: 前置条件验证失败立即停止
   - Clear Errors: 明确的不一致问题和修复建议
   - Minimal Output: 简洁的验证结果汇总
   - Structured Output: 结构化的一致性报告

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 调用 consistency-checker 子代理执行分析
   - 创建 .verified 验证标记
   - 与 qa-tester 协调测试覆盖验证

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 使用 ISO 8601 UTC 时间戳
   - 记录验证时间、文档修改时间
   - 支持时区感知的增量验证

4. **DevFlow Patterns** (.claude/rules/devflow-conventions.md):
   - 强制 REQ-ID 格式验证
   - 使用标准化一致性报告模板
   - 一致的评分方法论
   - 完整的双向可追溯性

## Constitution Compliance

本命令强制执行 CC-DevFlow Constitution (.claude/constitution/project-constitution.md) 原则：

### 验证前检查
- **Quality First**: 确保验证覆盖所有质量维度
- **NO PARTIAL VERIFICATION**: 完整验证或明确标记部分验证

### 验证过程原则
1. **质量至上**: 100% 可追溯性覆盖，证据化不一致发现
2. **架构一致性**: 验证架构决策一致性，检测 CODE DUPLICATION
3. **安全优先**: 验证安全需求传播，检测 HARDCODED SECRETS
4. **性能责任**: 验证性能需求一致性，检测 RESOURCE LEAKS
5. **可维护性**: 检测 DEAD CODE，验证关注点分离

### 验证后行动
- **问题优先级**: 按严重程度排序不一致问题
- **修复建议**: 提供可操作的修复步骤
- **质量报告**: 生成完整的一致性分析报告

## Prerequisites Validation

验证前，必须验证前置条件（Fail Fast 原则）：

```bash
# 设置需求 ID 环境变量
export DEVFLOW_REQ_ID="${reqId}"

# 运行前置条件检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - REQ-ID 格式验证 (REQ-\d+)
# - 所有必需文档存在性（PRD, EPIC, TASKS）
# - 文档格式合规性
# - Git 仓库状态验证
# - 实现代码存在性检查
```

**如果前置检查失败，立即停止（Fail Fast），不进行后续验证。**

## 执行流程

### 1. 验证模式选择

#### 1.1 完整验证模式 (默认)
```bash
# 执行前置条件验证
run_prerequisites_validation()

# 调用 consistency-checker 子代理
Task: consistency-checker "Perform comprehensive consistency analysis for ${reqId}"
```

**验证范围**:
- 文档结构和格式验证
- 需求可追溯性检查（正向+反向）
- 实现一致性验证
- 测试覆盖率分析
- Constitution 合规性检查（5大原则）

#### 1.2 快速验证模式 (`--summary`)
```yaml
快速检查项目:
  critical_issues_only: true
  document_structure: basic_check
  traceability: essential_links_only
  implementation: api_consistency
  tests: coverage_thresholds

输出格式: 简化报告，突出关键问题
```

#### 1.3 详细验证模式 (`--detailed`)
```yaml
详细分析包括:
  deep_traceability: 完整追溯矩阵
  code_analysis: 深度代码一致性检查
  dependency_analysis: 跨组件依赖验证
  performance_impact: 一致性问题的性能影响
  historical_analysis: 版本间一致性演进

输出格式: 完整报告，包含所有细节和建议
```

### 2. 多维度一致性分析

#### 2.1 文档层级一致性
```yaml
Level 1 - 需求文档:
  检查项目:
    - PRD.md 结构完整性
    - 用户故事格式规范
    - 验收标准明确性
    - 非功能需求完整性

  一致性验证:
    - 业务规则一致性
    - 用户角色定义一致
    - 功能优先级对齐

Level 2 - 规划文档:
  检查项目:
    - EPIC.md 与 PRD 对齐
    - 任务分解完整性
    - 技术方案一致性
    - 实施计划可行性

  一致性验证:
    - 功能分解正确映射
    - 技术决策无冲突
    - 时间估算合理性

Level 3 - 实施文档:
  检查项目:
    - 代码结构与设计对齐
    - API 规范与实现一致
    - 配置与需求匹配
    - 文档更新及时性

  一致性验证:
    - 架构约束遵循
    - 安全要求实现
    - 性能指标达成
```

#### 2.2 需求可追溯性验证
```yaml
正向追溯 (需求 → 实现):
  PRD用户故事 → EPIC功能 → TASK任务 → 代码实现 → 测试验证

  验证点:
    - 每个用户故事都有对应的EPIC功能
    - 每个EPIC功能都分解为具体任务
    - 每个任务都有相应的代码实现
    - 每个实现都有对应的测试验证

反向追溯 (实现 → 需求):
  代码功能 → 设计任务 → EPIC功能 → PRD故事 → 业务价值

  验证点:
    - 没有孤立的代码功能
    - 所有实现都有明确的需求来源
    - 技术决策都有业务理由
    - 代码变更都有需求驱动

横向关联验证:
  - 相关功能间的依赖关系正确
  - 跨模块接口定义一致
  - 数据流和控制流逻辑合理
  - 错误处理策略统一
```

### 3. 自动修复和建议

#### 3.1 自动修复模式 (`--fix-auto`)
```yaml
可自动修复的问题:
  format_issues:
    - 文档格式标准化
    - 引用链接修复
    - 版本号同步更新

  minor_inconsistencies:
    - 术语统一化
    - 命名规范对齐
    - 简单的交叉引用修复

  documentation_updates:
    - API 文档自动生成
    - 配置文档同步
    - 变更日志更新

执行流程:
  1. 识别可自动修复的问题
  2. 生成修复方案预览
  3. 用户确认后执行修复
  4. 记录修复操作日志
  5. 重新验证修复效果
```

#### 3.2 修复建议生成
```yaml
建议分类:
  immediate_actions:
    - 阻塞性问题的紧急修复
    - 安全漏洞的即时处理
    - 关键功能缺陷的修复

  planned_improvements:
    - 架构优化建议
    - 性能提升方案
    - 可维护性改进

  process_enhancements:
    - 开发流程优化
    - 质量检查改进
    - 文档管理提升

建议格式:
  每个建议包含:
    - 问题描述和影响分析
    - 具体的修复步骤
    - 预期的改进效果
    - 实施的优先级和时间估算
```

### 4. 报告生成和展示

#### 4.1 标准一致性报告
```markdown
# 一致性验证报告 - ${REQ_ID}

> **验证时间**: ${timestamp}
> **验证范围**: ${verification_scope}
> **整体评分**: ${overall_score}/100

## 📊 评分概览

### 维度评分
| 维度 | 评分 | 状态 | 关键问题数 |
|------|------|------|-----------|
| 文档一致性 | ${doc_score}/100 | ${doc_status} | ${doc_issues} |
| 需求可追溯性 | ${trace_score}/100 | ${trace_status} | ${trace_issues} |
| 实现一致性 | ${impl_score}/100 | ${impl_status} | ${impl_issues} |
| 测试覆盖率 | ${test_score}/100 | ${test_status} | ${test_issues} |

### 问题统计
- 🔴 **关键问题**: ${critical_count} (必须立即解决)
- 🟡 **重要问题**: ${major_count} (建议尽快解决)
- 🟢 **一般问题**: ${minor_count} (可择机解决)

## 🔍 详细分析

### 关键问题列表
${critical_issues_detail}

### 可追溯性矩阵
${traceability_matrix}

### 实现偏差分析
${implementation_deviations}

### 测试覆盖缺口
${test_coverage_gaps}

## 🔧 修复建议

### 立即行动项
${immediate_actions}

### 规划改进项
${planned_improvements}

### 流程优化建议
${process_optimizations}

## 📈 趋势分析
${trend_analysis}

---
**生成时间**: ${generation_time}
**下次验证建议**: ${next_verification_date}
```

#### 4.2 交互式验证界面
```yaml
命令行交互:
  问题浏览:
    - 按严重程度筛选问题
    - 按类型查看详细信息
    - 跳转到相关文件位置

  修复操作:
    - 预览自动修复方案
    - 逐项确认修复操作
    - 实时查看修复进度

  报告导出:
    - 生成 HTML 格式报告
    - 导出 JSON 格式数据
    - 创建 PDF 摘要报告

集成支持:
  IDE 集成:
    - VS Code 插件支持
    - 问题标注和跳转
    - 实时一致性提示

  CI/CD 集成:
    - 自动验证触发
    - 质量门禁集成
    - 报告自动发布
```

### 5. 验证策略配置

#### 5.1 验证严格度设置
```yaml
严格度级别:
  strict_mode:
    - 所有一致性要求必须满足
    - 容错率：0%
    - 适用场景：生产发布前

  standard_mode:
    - 关键一致性要求必须满足
    - 容错率：5%
    - 适用场景：常规开发过程

  relaxed_mode:
    - 基本一致性要求满足
    - 容错率：15%
    - 适用场景：早期开发阶段

配置方式:
  全局配置: .claude/settings.json
  项目配置: .claude/verification-config.json
  临时设置: 命令行参数
```

#### 5.2 自定义验证规则
```yaml
规则类型:
  business_rules:
    - 业务领域特定的一致性要求
    - 行业规范和标准
    - 公司内部规范

  technical_rules:
    - 技术架构约束
    - 编码标准和规范
    - API 设计原则

  quality_rules:
    - 测试覆盖率要求
    - 文档质量标准
    - 性能指标要求

规则配置:
  文件位置: .claude/verification-rules/
  格式: YAML 配置文件
  版本控制: 与项目代码一起管理
```

## 高级特性

### 1. 智能问题诊断
```yaml
诊断能力:
  root_cause_analysis:
    - 分析问题的根本原因
    - 识别问题传播路径
    - 评估修复影响范围

  pattern_recognition:
    - 识别常见的一致性问题模式
    - 预测潜在的一致性风险
    - 建议预防性措施

  impact_assessment:
    - 评估一致性问题的业务影响
    - 分析修复的技术复杂度
    - 估算修复的时间和资源需求
```

### 2. 持续监控
```yaml
监控机制:
  real_time_monitoring:
    - 文档变更实时检测
    - 代码提交一致性检查
    - 配置变更影响分析

  scheduled_checks:
    - 每日基础一致性检查
    - 每周深度分析
    - 每月趋势报告

  threshold_alerts:
    - 一致性评分下降告警
    - 关键问题新增通知
    - 修复进度跟踪提醒
```

### 3. 学习和优化
```yaml
机器学习能力:
  pattern_learning:
    - 从历史数据学习常见问题模式
    - 改进问题检测算法
    - 优化修复建议质量

  process_optimization:
    - 分析验证效率瓶颈
    - 优化检查项目优先级
    - 改进报告展示效果

  team_adaptation:
    - 学习团队的工作习惯
    - 适应项目特定的约定
    - 个性化验证策略
```

## 配置选项

### 环境变量
```bash
# 一致性验证配置
export FLOW_VERIFY_MODE="standard"        # strict|standard|relaxed
export FLOW_VERIFY_AUTO_FIX="false"       # 自动修复开关
export FLOW_VERIFY_REPORT_FORMAT="markdown" # markdown|json|html
export FLOW_VERIFY_THRESHOLD_CRITICAL="90"  # 关键问题阈值

# 性能和并发配置
export FLOW_VERIFY_PARALLEL_CHECKS="true"   # 并行检查
export FLOW_VERIFY_CACHE_ENABLED="true"     # 结果缓存
export FLOW_VERIFY_TIMEOUT="300"            # 超时设置(秒)
```

### 设置文件配置
```json
{
  "flow": {
    "verify": {
      "mode": "standard",
      "autoFix": false,
      "reportFormat": "markdown",
      "thresholds": {
        "critical": 90,
        "major": 75,
        "minor": 60
      },
      "rules": {
        "documentConsistency": true,
        "requirementTraceability": true,
        "implementationAlignment": true,
        "testCoverage": true,
        "constitutionCompliance": true
      },
      "notifications": {
        "slack": true,
        "email": false,
        "webhooks": []
      }
    }
  }
}
```

## 错误处理和故障排除

### 常见问题场景
1. **大型项目性能问题**
   - 启用并行检查模式
   - 配置结果缓存
   - 使用增量验证

2. **复杂依赖关系**
   - 启用详细追溯分析
   - 查看依赖关系图
   - 逐步解决循环依赖

3. **验证规则冲突**
   - 检查规则配置文件
   - 调整验证严格度
   - 自定义规则优先级

### 调试支持
```bash
# 启用详细日志
export FLOW_VERIFY_DEBUG="true"

# 查看验证历史
/flow-verify "REQ-123" --history

# 验证特定文件
/flow-verify "REQ-123" --file="PRD.md"

# 导出诊断信息
/flow-verify "REQ-123" --export-diagnostics
```

---

**核心价值**: /flow-verify 命令为 cc-devflow 提供了企业级的一致性保证机制，确保从需求到实现的全链路质量，这是实现高质量软件交付的关键基础设施。
