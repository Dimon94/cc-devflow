# PRD: REQ-003 - 分支命名优化 (中文转拼音)

**Status**: Final
**Created**: 2025-12-16
**Owner**: cc-devflow Team
**Type**: Enhancement
**Version**: 1.0.0

---

## 背景与目标

### 业务背景

cc-devflow 工作流系统使用 `/flow-init` 命令创建需求分支，分支命名格式为 `feature/REQ-XXX-{slug}`。当前 `slugify()` 函数 ([common.sh:180-195](../../.claude/scripts/common.sh#L180)) 使用正则表达式 `sed 's/[^a-z0-9]/-/g'` 处理标题，导致中文字符被完全移除。

**现状问题**:
- 输入 "用户登录功能" → 输出 "" (空字符串)
- 分支名变成 `feature/REQ-003-` (无有效标识)
- 无法从分支名识别需求内容

### 问题陈述

当用户使用中文特性名称时，生成的分支名无法有效标识需求内容，降低了分支管理的可读性和效率。

### 目标

- **主要目标**: 支持中文特性名自动转换为拼音，生成可读的分支名
- **成功指标**: 中文输入能生成有意义的分支名 (如 "用户登录" → `yong-hu-deng-lu`)
- **影响范围**: `.claude/scripts/common.sh` 中的 `slugify()` 函数

---

## 技术约束

| 约束类型 | 具体要求 | 优先级 |
|----------|----------|--------|
| 运行时依赖 | 不强制依赖，pypinyin 为可选增强 | HIGH |
| 兼容性 | 纯英文输入行为 100% 不变 | HIGH |
| 技术栈 | 使用 Python3 + pypinyin (项目已有 Python3 调用) | MEDIUM |

---

## 用户故事与验收标准

### Story 1: 中文特性名转拼音 (Priority: P1) MVP

**As a** cc-devflow 开发者
**I want** 在创建需求时使用中文特性名，系统自动转为拼音分支名
**So that** 分支名既保持可读性，又符合 Git 命名规范

**Why this priority**: 核心功能，直接解决用户痛点，无此功能则需求无意义

**Independent Test**: 调用 `slugify "用户登录"` 返回 `yong-hu-deng-lu`，可独立验证

**Acceptance Criteria**:
```gherkin
AC1: Given pypinyin 已安装
     When 调用 slugify("用户登录功能")
     Then 返回 "yong-hu-deng-lu-gong-neng"

AC2: Given pypinyin 已安装
     When 调用 slugify("OAuth2认证")
     Then 返回 "oauth2-ren-zheng" (英文小写保留，中文转拼音)

AC3: Given pypinyin 已安装
     When 调用 slugify("测试@#$%功能")
     Then 返回 "ce-shi-gong-neng" (特殊字符移除)

AC4: Given pypinyin 已安装
     When 调用 slugify("重庆")
     Then 返回 "chong-qing" (多音字正确处理)
```

**Priority**: P1 (MVP Critical)
**Complexity**: LOW

---

### Story 2: 纯英文输入兼容 (Priority: P1) MVP

**As a** cc-devflow 开发者
**I want** 纯英文特性名保持原有行为不变
**So that** 现有使用习惯不受影响，零回归风险

**Why this priority**: 兼容性保证，与 Story 1 共同构成完整 MVP

**Independent Test**: 调用 `slugify "User Login"` 返回 `user-login`，与改动前完全一致

**Acceptance Criteria**:
```gherkin
AC1: Given 任何环境
     When 调用 slugify("User Login Feature")
     Then 返回 "user-login-feature" (与原有行为一致)

AC2: Given 任何环境
     When 调用 slugify("API2.0")
     Then 返回 "api2-0" (与原有行为一致)

AC3: Given 任何环境
     When 调用 slugify("")
     Then 返回 "" (空字符串处理不变)
```

**Priority**: P1 (MVP Critical)
**Complexity**: LOW

---

### Story 3: 依赖缺失警告 (Priority: P2)

**As a** cc-devflow 开发者
**I want** 在 pypinyin 未安装时收到明确警告
**So that** 我知道需要安装依赖才能使用中文转拼音功能

**Why this priority**: 用户体验优化，非核心功能但提升透明度

**Independent Test**: 在无 pypinyin 环境调用 `slugify "中文"` 输出警告信息

**Acceptance Criteria**:
```gherkin
AC1: Given pypinyin 未安装
     When 调用 slugify("用户登录")
     Then 输出警告 "Warning: pypinyin not installed. Chinese characters cannot be converted."
     And 返回原有行为结果 (中文被移除)

AC2: Given pypinyin 未安装
     When 调用 slugify("User Login")
     Then 不输出任何警告
     And 返回 "user-login" (纯英文正常处理)
```

**Priority**: P2 (High)
**Complexity**: LOW

---

### 边界案例处理

- **错误处理**: pypinyin 缺失时输出警告到 stderr，不中断执行
- **数据验证**: 输入为空时直接返回空字符串
- **边界条件**:
  - 超长中文 (>50 字符): 正常处理，Git 支持 250 字符分支名
  - 纯数字: 保持原样 (`123` → `123`)
  - 混合多音字: 依赖 pypinyin 默认词典

---

## 非功能性要求

### 性能要求

| 指标 | 目标值 | 关键性 |
|------|--------|--------|
| 响应时间 | <100ms (单次调用) | LOW |
| 内存占用 | 无显著增加 | LOW |

**注**: 分支创建是低频操作，性能非关键因素

### 安全要求

- [x] **身份验证**: N/A (本地函数)
- [x] **授权机制**: N/A (本地函数)
- [x] **数据加密**: N/A (无敏感数据)
- [x] **输入验证**: 通过正则过滤非法 Git 分支字符
- [x] **审计日志**: N/A
- [x] **密钥管理**: N/A

### 可靠性要求

- **降级策略**: pypinyin 缺失时警告并回退原有行为
- **错误处理**: Python 调用失败时捕获异常，回退原有行为

### 可观测性要求

- **日志记录**: 仅在警告场景输出到 stderr
- **监控指标**: N/A

---

## 成功指标

### 主要指标

| 指标 | 基线 | 目标 | 测量方法 |
|------|------|------|----------|
| 中文分支名可读性 | 0% (中文被删除) | 100% (转为拼音) | 人工验证 |
| 英文分支名兼容性 | 100% | 100% (无回归) | 自动化测试 |
| 测试覆盖率 | 0% (无测试) | 100% (核心路径) | 单元测试 |

---

## Constitution Check (宪法符合性检查)

**Reference**: `.claude/constitution/project-constitution.md` (v2.0.0)

### Article I: Quality First (质量至上)
- [x] **I.1 - NO PARTIAL IMPLEMENTATION**: 需求定义完整，无占位符
- [x] **I.3 - No Simplification**: 无"暂时简化"描述
- [x] 用户故事遵循 INVEST 准则
- [x] 验收标准具体、可测试

### Article X: Requirement Boundary (需求边界)
- [x] **X.1 - Forced Clarification**: 所有歧义已通过 /flow-clarify 解决
- [x] **X.2 - No Speculative Features**: 无推测性功能
- [x] **X.3 - User Story Independence**: 每个故事有明确优先级
- [x] **X.3 - Independent Test**: 每个故事有独立测试标准

### Article II: Architectural Consistency (架构一致性)
- [x] **II.1 - NO CODE DUPLICATION**: 复用现有 `slugify()` 函数
- [x] **II.3 - Anti-Over-Engineering**: 最小改动原则
- [x] **II.4 - Single Responsibility**: 仅增强中文处理能力

### Article III: Security First (安全优先)
- [x] **III.1 - NO HARDCODED SECRETS**: 无密钥相关
- [x] **III.2 - Input Validation**: 输入经过正则过滤

### Constitutional Violations (宪法违规记录)

无违规

---

## 依赖关系

### 上游依赖
- 无 (独立功能)

### 下游依赖
- `create-requirement.sh`: 调用 `slugify()` 生成分支名

### 外部依赖
- **pypinyin** (可选): Python 拼音转换库，缺失时降级处理

---

## 风险评估与缓解

### 技术风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| pypinyin 安装失败 | L | L | 降级到原有行为，输出警告 |
| 多音字转换错误 | M | L | 依赖 pypinyin 默认词典，分支名仅需"可识别"而非"完美" |

### 业务风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 用户不安装 pypinyin | M | L | 警告提示引导安装 |

### 进度风险

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 无 | - | - | 功能简单，风险可控 |

---

## 范围界定

### 包含内容
- `slugify()` 函数增强，支持中文转拼音
- pypinyin 依赖检测与警告机制
- 单元测试覆盖核心场景

### 明确不包含
- pypinyin 自动安装功能
- 繁体中文显式支持 (依赖 pypinyin 默认能力)
- 自定义多音字词典
- 英文智能分词 (如 CamelCase 拆分)

---

## 假设条件

- 用户环境已安装 Python3 (macOS/Linux 默认)
- 项目已使用 Python3 (common.sh 中有 `validate_json_schema` 调用)
- Git 支持 UTF-8 字符的分支名 (但本需求转为 ASCII)

---

## 未决问题

无 (所有问题已通过 /flow-clarify 解决)

---

## 发布计划

### 里程碑
- **Phase 1**: MVP (Story 1 + Story 2) - 核心功能
- **Phase 2**: Story 3 - 警告提示优化

### 回滚计划
- **回滚触发条件**: 英文分支名行为回归
- **回滚步骤**: 还原 `common.sh` 中的 `slugify()` 函数
- **数据处理**: 无数据影响

---

## Progress Tracking (进度跟踪)

### 完成状态
- [x] 背景与目标明确
- [x] 用户故事定义 (INVEST 合规)
- [x] 验收标准编写 (Given-When-Then)
- [x] 功能需求文档化
- [x] 非功能需求规定
- [x] 技术约束识别
- [x] 成功指标定义
- [x] Constitution Check 通过
- [x] 依赖关系映射
- [x] 风险评估完成
- [x] 范围明确界定
- [x] 未决问题跟踪

### 质量检查
- [x] 所有用户故事有验收标准
- [x] 所有 NFR 有量化目标
- [x] 性能目标可测量
- [x] 安全要求完整
- [x] 无模糊需求
- [x] 所有缩写已定义

### 闸门状态
- [x] Constitution Check: PASS
- [x] 完整性验证: PASS
- [x] 质量检查: PASS

**准备好进行 Epic 规划**: YES

---

## 附录

### 研究材料
- [research.md](research/research.md) - 技术决策记录
- [research-summary.md](research/research-summary.md) - 调研摘要
- [codebase-overview.md](research/internal/codebase-overview.md) - 代码分析
- [clarifications](research/clarifications/20251216-flow-clarify.md) - 需求澄清记录

### 参考资料
- [pypinyin GitHub](https://github.com/mozillazg/python-pinyin)
- [pypinyin PyPI](https://pypi.org/project/pypinyin/)

### 术语表
- **slugify**: 将字符串转换为 URL/分支名友好格式的函数
- **pypinyin**: Python 汉字拼音转换库
- **lazy_pinyin**: pypinyin 提供的无声调拼音转换函数

---

**Generated by**: prd-writer agent
**Based on**: CC-DevFlow Constitution v2.0.0
**Clarification Session**: 20251216-143000-REQ-003
**Next Step**: Run `/flow-epic` to generate EPIC.md and TASKS.md
