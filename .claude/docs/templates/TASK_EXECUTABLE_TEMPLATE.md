---
task: "{{TASK_ID}}"
reqId: "{{REQ_ID}}"
epic: "{{EPIC_ID}}"
title: "{{TITLE}}"
priority: "{{PRIORITY}}"
estimate: "{{ESTIMATE}}"
dependsOn: [{{DEPENDENCIES}}]
owner: "{{OWNER}}"
created: "{{DATE}}"
status: "todo"
type: "{{TYPE}}"
dod:
  - "通过类型检查"
  - "单测通过且覆盖率≥80%"
  - "无高危安全问题"
  - "文档/CHANGELOG更新"
  - "代码审查通过"
---

# Task: {{TITLE}}

**Input**: EPIC.md, PRD.md from `devflow/requirements/{{REQ_ID}}/`
**Prerequisites**: 依赖任务 [{{DEPENDENCIES}}] 已完成

## Execution Flow (任务执行流程)
```
1. 加载任务上下文
   → 读取 PRD.md 了解需求背景
   → 读取 EPIC.md 了解整体架构
   → 检查依赖任务的完成状态和输出
   → 如果依赖未完成: ERROR "依赖任务 {task_id} 未完成"

2. 验证 Constitution 符合性
   → 检查是否违反质量原则 (NO PARTIAL IMPLEMENTATION)
   → 检查是否违反架构原则 (NO CODE DUPLICATION)
   → 检查是否违反安全原则 (NO HARDCODED SECRETS)
   → 如果发现违规: ERROR "违反宪法原则 {principle}"

3. 执行准备阶段
   → 扫描现有代码库了解相关模式
   → 识别需要修改的文件和新建的文件
   → 检查测试覆盖现状
   → 更新进度: Preparation Complete

4. 执行核心实现
   → 按实施步骤逐步完成
   → 每个步骤完成后验证功能
   → 确保代码符合项目规范
   → 更新进度: Core Implementation Complete

5. 执行测试验证
   → 编写/更新单元测试
   → 运行测试并确保通过
   → 检查测试覆盖率 ≥80%
   → 如果测试失败: 修复问题后重新验证
   → 更新进度: Testing Complete

6. 执行文档更新
   → 更新相关API文档
   → 更新CHANGELOG
   → 添加必要的代码注释
   → 更新进度: Documentation Complete

7. 执行最终验证
   → 运行完整的质量检查
   → 验证所有DoD条件满足
   → 如果验证失败: 返回相应阶段修复
   → 更新进度: Task Complete

8. 返回: SUCCESS (任务完成可以继续下一任务)
```

**重要提示**: 这是一个自执行任务模板。主代理应按照 Execution Flow 的步骤执行，确保每个步骤完成后再继续下一步。

## 任务概述

### 描述
{{DESCRIPTION}}

### 目标
{{GOAL}}

### 验收标准
[从Epic/PRD中提取的具体验收标准]
- [ ] {{ACCEPTANCE_CRITERION_1}}
- [ ] {{ACCEPTANCE_CRITERION_2}}
- [ ] {{ACCEPTANCE_CRITERION_3}}

## 技术背景

### 相关组件
- **前端组件**: {{FRONTEND_COMPONENTS}}
- **后端服务**: {{BACKEND_SERVICES}}
- **数据库表**: {{DATABASE_TABLES}}
- **外部接口**: {{EXTERNAL_APIS}}

### 现状分析
{{CURRENT_STATE_ANALYSIS}}

### 技术约束
- {{TECH_CONSTRAINT_1}}
- {{TECH_CONSTRAINT_2}}
- {{TECH_CONSTRAINT_3}}

### Constitution 检查
*GATE: 必须在实施前通过宪法符合性检查*

#### 质量原则检查
- [ ] NO PARTIAL IMPLEMENTATION - 是否完整实现所有功能？
- [ ] NO SIMPLIFICATION - 是否避免简化占位符？
- [ ] 是否所有边界情况都被考虑？

#### 架构原则检查
- [ ] NO CODE DUPLICATION - 是否复用现有函数和常量？
- [ ] NO INCONSISTENT NAMING - 是否遵循现有命名规范？
- [ ] NO OVER-ENGINEERING - 是否避免过度抽象？
- [ ] NO MIXED CONCERNS - 是否正确分离关注点？

#### 安全原则检查
- [ ] NO HARDCODED SECRETS - 是否使用环境变量？
- [ ] 输入验证和清理是否完善？
- [ ] 身份验证和授权是否正确？

#### 性能原则检查
- [ ] NO RESOURCE LEAKS - 是否正确关闭资源？
- [ ] 是否考虑性能优化？
- [ ] 内存使用是否合理？

#### 可维护性检查
- [ ] NO DEAD CODE - 是否删除无用代码？
- [ ] 代码是否易于理解和修改？
- [ ] 是否遵循单一职责原则？

## 实施方案

### 设计思路
{{DESIGN_RATIONALE}}

### 实施步骤

#### 1. 准备阶段
- [ ] {{PREP_STEP_1}}
- [ ] {{PREP_STEP_2}}
- [ ] 扫描现有代码库识别可复用组件
- [ ] 检查依赖任务的输出文件

#### 2. 核心实现
- [ ] {{CORE_STEP_1}}
- [ ] {{CORE_STEP_2}}
- [ ] {{CORE_STEP_3}}
- [ ] 确保每个功能点完整实现（NO PARTIAL）

#### 3. 测试验证
- [ ] 编写单元测试（覆盖率 ≥80%）
- [ ] 编写集成测试
- [ ] 运行测试并确保全部通过
- [ ] 验证边界条件和异常情况

#### 4. 文档更新
- [ ] 更新API文档
- [ ] 更新用户文档
- [ ] 更新CHANGELOG
- [ ] 添加必要的代码注释

### 关键文件修改
- **新增文件**:
  - `{{NEW_FILE_1}}` - {{NEW_FILE_1_PURPOSE}}
  - `{{NEW_FILE_2}}` - {{NEW_FILE_2_PURPOSE}}

- **修改文件**:
  - `{{MODIFIED_FILE_1}}` - {{MODIFIED_FILE_1_CHANGES}}
  - `{{MODIFIED_FILE_2}}` - {{MODIFIED_FILE_2_CHANGES}}

- **配置文件**:
  - `{{CONFIG_FILE_1}}` - {{CONFIG_FILE_1_CHANGES}}

### 数据库变更
```sql
{{DATABASE_MIGRATIONS}}
```

### API变更
```typescript
{{API_INTERFACE_DEFINITIONS}}
```

## 测试计划

### 单元测试
- **测试文件**: `{{UNIT_TEST_FILE}}`
- **覆盖范围**: {{TEST_COVERAGE_SCOPE}}
- **测试用例**:
  - [ ] 正常流程测试
  - [ ] 边界条件测试
  - [ ] 异常情况测试
  - [ ] 性能测试

### 集成测试
- **测试文件**: `{{INTEGRATION_TEST_FILE}}`
- **测试场景**:
  - [ ] {{INTEGRATION_SCENARIO_1}}
  - [ ] {{INTEGRATION_SCENARIO_2}}

### 端到端测试
- **测试文件**: `{{E2E_TEST_FILE}}`
- **用户路径**:
  - [ ] {{USER_PATH_1}}
  - [ ] {{USER_PATH_2}}

## 安全考虑

### 安全检查清单
- [ ] 输入验证和清理 - 所有用户输入都经过验证
- [ ] 身份验证和授权 - 正确的权限控制
- [ ] 数据加密和保护 - 敏感数据加密存储
- [ ] SQL注入防护 - 使用参数化查询
- [ ] XSS防护 - 输出转义
- [ ] CSRF防护 - 使用CSRF令牌
- [ ] 依赖漏洞 - 无已知漏洞依赖

### 安全测试
- [ ] 静态代码安全扫描
- [ ] 依赖漏洞扫描
- [ ] 安全最佳实践检查

## 部署说明

### 环境配置
- **开发环境**: {{DEV_ENV_CONFIG}}
- **测试环境**: {{TEST_ENV_CONFIG}}
- **生产环境**: {{PROD_ENV_CONFIG}}

### 部署步骤
1. [ ] {{DEPLOY_STEP_1}}
2. [ ] {{DEPLOY_STEP_2}}
3. [ ] {{DEPLOY_STEP_3}}

### 部署验证
- [ ] {{DEPLOY_VALIDATION_1}}
- [ ] {{DEPLOY_VALIDATION_2}}

## 回滚方案

### 回滚触发条件
{{ROLLBACK_CONDITIONS}}

### 回滚步骤
1. [ ] {{ROLLBACK_STEP_1}}
2. [ ] {{ROLLBACK_STEP_2}}
3. [ ] {{ROLLBACK_STEP_3}}

### 数据处理
{{DATA_ROLLBACK_STRATEGY}}

## 风险评估

### 技术风险
- **风险1**: {{TECH_RISK_1}} - {{TECH_RISK_1_MITIGATION}}
- **风险2**: {{TECH_RISK_2}} - {{TECH_RISK_2_MITIGATION}}

### 进度风险
- **风险1**: {{SCHEDULE_RISK_1}} - {{SCHEDULE_RISK_1_MITIGATION}}

### 依赖风险
- **外部依赖**: {{EXTERNAL_DEPENDENCY_RISK}}
- **内部依赖**: {{INTERNAL_DEPENDENCY_RISK}}

## Progress Tracking (进度跟踪)
*此检查清单在执行过程中更新*

**执行状态**:
- [ ] 1. 任务上下文加载完成
- [ ] 2. Constitution 符合性验证通过
- [ ] 3. 准备阶段完成
- [ ] 4. 核心实现完成
- [ ] 5. 测试验证完成
- [ ] 6. 文档更新完成
- [ ] 7. 最终验证通过

**闸门状态**:
- [ ] Constitution Check: PASS
- [ ] 依赖任务验证: PASS
- [ ] 单元测试: PASS (覆盖率 ≥80%)
- [ ] 集成测试: PASS
- [ ] 安全扫描: PASS (无高危问题)
- [ ] 代码审查: PASS

## 执行记录

### 开发日志
{{DEVELOPMENT_LOG}}

### 测试结果
{{TEST_RESULTS}}

### 代码审查
- **审查者**: {{REVIEWER}}
- **审查时间**: {{REVIEW_DATE}}
- **审查结果**: {{REVIEW_RESULT}}
- **修改建议**: {{REVIEW_FEEDBACK}}

## 完成检查清单 (Definition of Done)

### 功能完成度
- [ ] 核心功能实现完成（100%，NO PARTIAL）
- [ ] 异常处理实现完成
- [ ] 边界条件处理完成
- [ ] 用户体验优化完成

### 质量检查
- [ ] 代码符合团队规范（NO INCONSISTENT NAMING）
- [ ] 单元测试覆盖率达标 (≥80%)
- [ ] 集成测试通过
- [ ] 安全扫描通过
- [ ] 性能测试达标
- [ ] 无代码重复（NO CODE DUPLICATION）
- [ ] 无死代码（NO DEAD CODE）

### 文档完善
- [ ] 代码注释完整
- [ ] API文档更新
- [ ] 用户文档更新
- [ ] CHANGELOG更新

### 部署准备
- [ ] 环境配置验证
- [ ] 部署脚本测试
- [ ] 回滚方案验证
- [ ] 监控告警配置

## 相关链接

- **Epic**: `devflow/requirements/{{REQ_ID}}/EPIC.md`
- **PRD**: `devflow/requirements/{{REQ_ID}}/PRD.md`
- **依赖任务**: {{DEPENDENCY_TASK_LINKS}}

---
*基于 CC-DevFlow Constitution - 参见 `.claude/constitution/`*