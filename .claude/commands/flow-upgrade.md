---
name: flow-upgrade
description: PRD version management and upgrade workflow. Usage: /flow-upgrade "REQ-123" --analyze or /flow-upgrade "REQ-123" --version="2.0" --reason="添加移动端支持"
---

# Flow-Upgrade - PRD 版本管理和升级工作流

## 命令格式

### 分析模式
```text
/flow-upgrade "REQ-123" --analyze
/flow-upgrade "REQ-123" --analyze --format=json
/flow-upgrade "REQ-123" --analyze --compare="v1.2"
```

### 升级模式
```text
/flow-upgrade "REQ-123" --version="2.0" --reason="添加移动端支持"
/flow-upgrade "REQ-123" --version="1.3" --reason="修复用户权限问题" --force
```

### 回滚模式
```text
/flow-upgrade "REQ-123" --rollback="v1.2"
/flow-upgrade "REQ-123" --rollback="v1.2" --confirm
```

### 兼容性检查模式
```text
/flow-upgrade "REQ-123" --compatibility --target="v2.0"
/flow-upgrade "REQ-123" --compatibility --baseline="v1.0"
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/standard-patterns.md):
   - Fail Fast: 版本格式验证失败立即停止
   - Clear Errors: 明确的版本冲突和变更问题
   - Minimal Output: 简洁的版本操作确认
   - Structured Output: 结构化的变更日志和影响报告

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 调用 impact-analyzer 分析变更影响
   - 调用 compatibility-checker 检查兼容性
   - 创建版本 .completed 标记

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 使用 ISO 8601 UTC 时间戳
   - 记录版本创建时间、升级时间
   - 支持时区感知的版本历史

4. **DevFlow Patterns** (.claude/rules/devflow-patterns.md):
   - 强制 REQ-ID 和版本号格式验证
   - 使用标准化版本管理模板
   - 一致的 SemVer 语义版本规范
   - 完整的版本可追溯性

## Constitution Compliance

本命令强制执行 CC-DevFlow Constitution (.claude/constitution/project-constitution.md) 原则：

### 升级前验证
- **Quality First**: 确保变更有充分理由和完整描述
- **Security First**: 识别版本变更的安全影响

### 升级过程检查
1. **NO PARTIAL UPGRADE**: 完整版本升级或明确标记部分升级
2. **向后兼容性**: 评估破坏性变更的影响和迁移路径
3. **NO DATA LOSS**: 保存所有历史版本快照
4. **架构一致性**: 新版本需求符合架构约束
5. **性能影响**: 评估版本变更的性能影响

### 升级后验证
- **版本完整性**: 确保版本快照和元数据完整
- **迁移指南**: 提供清晰的版本迁移说明
- **兼容性矩阵**: 更新版本兼容性记录

## Prerequisites Validation

升级前，必须验证前置条件（Fail Fast 原则）：

```bash
# 设置需求 ID 环境变量
export DEVFLOW_REQ_ID="${reqId}"

# 运行前置条件检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - REQ-ID 格式验证 (REQ-\d+)
# - 版本号格式验证 (SemVer)
# - PRD 文档存在性和有效性
# - Git 仓库状态验证（无未提交变更）
# - 版本冲突检查（新版本号未被占用）
```

**如果前置检查失败，立即停止（Fail Fast），不进行后续升级。**

## 执行流程

### 1. 分析模式 (`--analyze`)

#### 1.1 版本检测和变更分析
```bash
# 执行前置条件验证
run_prerequisites_validation()

# 调用 impact-analyzer 子代理
Task: impact-analyzer "Analyze PRD changes for ${reqId}"
```

**执行步骤**:
1. **读取 PRD 版本**
   - 当前版本: `devflow/requirements/${reqId}/PRD.md`
   - 历史版本: `devflow/requirements/${reqId}/versions/`

2. **变更检测**
   - 用户故事变更 (新增/修改/删除)
   - 验收标准变更 (破坏性/增强性/澄清性)
   - 非功能需求变更 (性能/安全/集成)

3. **影响评估**
   - 代码库影响范围分析
   - 测试用例影响评估
   - 部署和配置影响

4. **输出分析报告**
   ```text
   devflow/requirements/${reqId}/analysis/
   ├── change_detection_${timestamp}.md
   ├── impact_assessment_${timestamp}.md
   └── upgrade_recommendation_${timestamp}.md
   ```

#### 1.2 版本建议算法
```yaml
分析维度:
  breaking_changes:
    - removed_user_stories: count
    - modified_acceptance_criteria: count
    - api_contract_changes: count
    权重: 0.4

  additive_changes:
    - new_user_stories: count
    - enhanced_features: count
    - extended_apis: count
    权重: 0.3

  clarification_changes:
    - improved_descriptions: count
    - added_examples: count
    - documentation_updates: count
    权重: 0.2

  scope_expansion:
    - new_business_domains: count
    - additional_integrations: count
    权重: 0.1

版本判定逻辑:
  if breaking_changes_score > 0.3:
    recommended_version: MAJOR (v${current.major + 1}.0.0)
  elif additive_changes_score > 0.2:
    recommended_version: MINOR (v${current.major}.${current.minor + 1}.0)
  else:
    recommended_version: PATCH (v${current.major}.${current.minor}.${current.patch + 1})
```

### 2. 升级模式 (`--version`)

#### 2.1 版本创建流程
```yaml
Phase 1 - 验证和准备:
  1. 验证版本号格式 (SemVer)
  2. 检查版本号是否已存在
  3. 验证变更原因是否充分
  4. 确认当前工作状态干净

Phase 2 - 影响分析:
  1. 自动执行分析模式
  2. 生成详细影响报告
  3. 估算实施工作量
  4. 识别风险点和依赖

Phase 3 - 版本快照:
  1. 创建版本目录结构
  2. 保存当前 PRD 快照
  3. 生成变更日志
  4. 更新版本历史记录

Phase 4 - 后续处理:
  1. 触发相关文档更新
  2. 通知相关开发流程
  3. 创建迁移指南
  4. 更新兼容性矩阵
```

#### 2.2 版本目录结构创建
```bash
mkdir -p "devflow/requirements/${reqId}/versions/v${version}"
mkdir -p "devflow/requirements/${reqId}/analysis"
mkdir -p "devflow/requirements/${reqId}/upgrade"
```

**创建文件**:
```text
devflow/requirements/${reqId}/versions/v${version}/
├── PRD.md                    # PRD 快照
├── CHANGELOG.md             # 变更日志
├── IMPACT_ANALYSIS.md       # 影响分析报告
├── METADATA.json           # 版本元数据
└── VALIDATION_CHECKLIST.md # 验收检查清单
```

#### 2.3 自动化集成触发
```yaml
Git 集成:
  - 创建版本标签: git tag v${version}-prd-${reqId}
  - 提交版本变更: git commit -m "feat(${reqId}): PRD升级到v${version}"

工作流触发:
  - 检查是否需要代码实现更新
  - 触发测试用例更新流程
  - 启动文档同步更新

通知机制:
  - 项目团队通知
  - 依赖项目影响通知
  - QA 团队测试计划更新
```

### 3. 回滚模式 (`--rollback`)

#### 3.1 回滚安全检查
```yaml
回滚前验证:
  - 目标版本存在性检查
  - 当前实现状态评估
  - 数据兼容性验证
  - 依赖关系影响分析

安全确认机制:
  - 显示回滚影响摘要
  - 要求明确确认操作
  - 创建回滚前备份
  - 记录回滚操作日志
```

#### 3.2 回滚执行流程
```bash
# 1. 备份当前状态
cp PRD.md "versions/backup_$(date +%Y%m%d_%H%M%S)/PRD.md"

# 2. 恢复目标版本
cp "versions/${target_version}/PRD.md" PRD.md

# 3. 更新版本记录
echo "ROLLBACK to ${target_version} at $(date)" >> VERSION_HISTORY.md

# 4. 触发影响分析
Task: impact-analyzer "Analyze rollback impact for ${reqId} to ${target_version}"
```

### 4. 兼容性检查模式 (`--compatibility`)

#### 4.1 兼容性分析执行
```bash
# 调用 compatibility-checker 子代理
Task: compatibility-checker "Analyze compatibility between versions for ${reqId}"
```

#### 4.2 兼容性分析框架
```yaml
检查维度:
  api_compatibility:
    - 接口签名变更
    - 响应格式变更
    - 错误码变更
    权重: 0.35

  data_compatibility:
    - 数据模型变更
    - 数据库 schema 变更
    - 数据迁移需求
    权重: 0.25

  functional_compatibility:
    - 核心用户流程保持
    - 业务规则变更
    - 用户体验影响
    权重: 0.25

  integration_compatibility:
    - 第三方集成影响
    - 内部服务依赖
    - 消息格式变更
    权重: 0.15

兼容性级别:
  FULLY_COMPATIBLE (90-100%): 完全兼容，无需变更
  BACKWARD_COMPATIBLE (70-89%): 向后兼容，旧版本客户端正常工作
  MIGRATION_REQUIRED (40-69%): 需要迁移，提供自动化工具
  BREAKING_CHANGE (0-39%): 破坏性变更，需要手动处理
```

#### 4.2 兼容性报告生成
```markdown
# 兼容性检查报告

> **检查日期**: ${timestamp}
> **源版本**: v${source_version}
> **目标版本**: v${target_version}
> **兼容性级别**: ${compatibility_level}

## 兼容性评分
- **总体评分**: ${overall_score}/100
- **API 兼容性**: ${api_score}/100
- **数据兼容性**: ${data_score}/100
- **功能兼容性**: ${functional_score}/100
- **集成兼容性**: ${integration_score}/100

## 不兼容项目
${incompatibility_list}

## 迁移要求
${migration_requirements}

## 风险评估
${risk_assessment}

## 建议操作
${recommended_actions}
```

## 融入 spec-kit 最佳实践

### 1. Constitution 驱动的版本管理
```yaml
Constitution 检查:
  质量门禁:
    - 版本变更必须通过完整性检查
    - 破坏性变更需要明确的迁移路径
    - 所有变更必须有充分的测试覆盖

  架构一致性:
    - 新版本需求必须符合系统架构约束
    - 技术选择需要与现有技术栈兼容
    - API 设计需要遵循统一标准

  安全优先:
    - 安全相关变更需要独立审查
    - 数据隐私影响评估
    - 权限和认证变更验证
```

### 2. 结构化验收检查清单
```markdown
# PRD 版本升级验收检查清单

## 📋 变更验证
- [ ] 所有变更都有明确的业务理由
- [ ] 用户故事符合 INVEST 原则
- [ ] 验收标准具体且可测试
- [ ] 非功能需求有明确指标

## 🔍 影响分析完整性
- [ ] 代码影响范围已识别
- [ ] 测试影响已评估
- [ ] 部署影响已分析
- [ ] 性能影响已考虑

## 🛡 风险管控
- [ ] 高风险变更有缓解措施
- [ ] 回滚策略已准备
- [ ] 监控和告警已规划
- [ ] 团队培训需求已识别

## 📚 文档完整性
- [ ] 变更日志详细且准确
- [ ] API 文档已更新
- [ ] 用户文档已准备
- [ ] 操作手册已修订

## 🔄 流程合规性
- [ ] Constitution 原则已遵循
- [ ] 代码审查标准已满足
- [ ] 测试覆盖要求已达成
- [ ] 安全审查已完成
```

### 3. 多阶段渐进式实施
```yaml
阶段化升级:
  Phase 1 - 分析和规划:
    duration: 1-2 天
    deliverables:
      - 详细影响分析报告
      - 工作量估算
      - 风险评估和缓解计划

  Phase 2 - 准备和验证:
    duration: 2-3 天
    deliverables:
      - 迁移脚本准备
      - 测试用例更新
      - 文档修订

  Phase 3 - 实施和验证:
    duration: 3-5 天
    deliverables:
      - 代码实现更新
      - 完整测试执行
      - 部署和验证

  Phase 4 - 监控和优化:
    duration: 1-2 天
    deliverables:
      - 性能监控设置
      - 问题快速响应
      - 用户反馈收集
```

## 高级特性

### 1. 自动化CI/CD集成
```yaml
GitHub Actions 集成:
  '.github/workflows/prd-upgrade.yml':
    triggers:
      - PRD.md 文件变更
      - /flow-upgrade 命令执行

    actions:
      - 自动影响分析
      - 兼容性检查
      - PR 评论生成
      - 团队通知发送

Git 钩子:
  'pre-commit':
    - PRD 变更检测
    - 自动版本分析建议

  'post-commit':
    - 版本标签创建
    - 影响分析触发
```

### 2. 智能推荐系统
```yaml
基于历史数据的推荐:
  版本策略推荐:
    - 分析历史升级模式
    - 推荐最佳版本号
    - 预测潜在问题

  测试策略推荐:
    - 基于变更类型推荐测试重点
    - 自动生成测试用例模板
    - 推荐性能测试场景

  部署策略推荐:
    - 推荐最佳部署时机
    - 建议灰度发布策略
    - 预测资源使用变化
```

### 3. 协作和通知机制
```yaml
团队协作:
  通知渠道:
    - Slack/Teams 集成
    - 邮件通知
    - 项目管理工具同步

  协作工作流:
    - 版本升级审批流程
    - 多人协作冲突解决
    - 变更影响的跨团队沟通

  文档协作:
    - 版本注释和评论
    - 协作编辑历史
    - 变更建议和讨论
```

## 配置选项

### 环境变量
```bash
# 版本管理配置
export FLOW_VERSION_FORMAT="semantic"  # semantic|timestamp|custom
export FLOW_AUTO_BACKUP="true"         # 自动备份
export FLOW_REQUIRE_REASON="true"      # 强制要求变更原因
export FLOW_COMPATIBILITY_THRESHOLD="70" # 兼容性阈值

# 通知配置
export FLOW_NOTIFY_SLACK_WEBHOOK="https://hooks.slack.com/..."
export FLOW_NOTIFY_EMAIL_LIST="team@company.com"
export FLOW_NOTIFY_GITHUB_TEAMS="@team-leads"
```

### 设置文件扩展
```json
{
  "flow": {
    "upgrade": {
      "versionFormat": "semantic",
      "autoBackup": true,
      "requireReason": true,
      "compatibilityThreshold": 70,
      "notifications": {
        "slack": true,
        "email": true,
        "github": true
      },
      "phases": {
        "autoAdvance": false,
        "requireApproval": ["MAJOR"]
      }
    }
  }
}
```

## 错误处理和故障排除

### 常见问题场景
1. **版本冲突**
   - 检测并报告冲突
   - 提供解决方案建议
   - 支持手动合并流程

2. **兼容性问题**
   - 详细的不兼容分析
   - 自动化迁移工具推荐
   - 手动修复指导

3. **回滚失败**
   - 安全的回滚恢复机制
   - 数据一致性检查
   - 紧急修复流程

### 调试支持
```bash
# 启用详细日志
export FLOW_DEBUG_UPGRADE="true"

# 查看操作历史
/flow-upgrade "REQ-123" --history

# 验证环境配置
/flow-upgrade --check-config
```

---

**核心价值**: /flow-upgrade 命令将 spec-kit 的规范化版本管理理念引入 cc-devflow，提供了完整的 PRD 生命周期管理能力，确保需求演进的可控性、可追溯性和团队协作的高效性。
