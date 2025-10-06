# 命令文件优化总结 - 2025-10-01

> **分析日期**: 2025-10-01
> **分析范围**: 7个核心命令文件
> **优化目标**: Constitution集成、前置检查标准化、工作流引用明确化

---

## 📋 分析概览

### 分析的命令

1. **flow-fix.md** - 一键BUG修复流
2. **flow-ideate.md** - 意图驱动需求开发
3. **flow-restart.md** - 中断恢复命令
4. **flow-status.md** - 开发进度查询命令
5. **flow-update.md** - 任务进度更新命令
6. **flow-upgrade.md** - PRD版本管理和升级工作流
7. **flow-verify.md** - 一致性验证命令

### 优化维度矩阵

| 命令 | Constitution集成 | Prerequisites集成 | 工作流引用明确 | 状态文件统一 | 子代理调用格式 |
|------|----------------|------------------|--------------|------------|--------------|
| flow-fix | ❌ → ✅ | ❌ → ✅ | ⚠️ → ✅ | ⚠️ → ✅ | ⚠️ → ✅ |
| flow-ideate | ⚠️ → ✅ | ❌ → ✅ | ✅ | N/A | ✅ |
| flow-restart | ❌ → ✅ | ❌ → ✅ | N/A | N/A | N/A |
| flow-status | N/A (只读) | N/A (只读) | N/A | ⚠️ → ✅ | N/A |
| flow-update | ❌ → ✅ | ❌ → ✅ | N/A | ⚠️ → ✅ | N/A |
| flow-upgrade | ⚠️ → ✅ | ❌ → ✅ | N/A | N/A | ✅ |
| flow-verify | ⚠️ → ✅ | ❌ → ✅ | N/A | N/A | ✅ |

**图例**:
- ❌ - 完全缺失
- ⚠️ - 部分存在但不完整
- ✅ - 已存在或已优化
- N/A - 不适用

---

## 🔍 共同优化点

### 1. Constitution 集成缺失

#### 问题描述
所有命令（除flow-upgrade有部分提及）都未系统化集成 Constitution 宪法体系。

#### 影响分析
- 缺少最高准则的约束和指导
- 质量保证机制不完整
- 与 Agent 优化后的标准不一致

#### 优化方案
在每个命令的关键验证节点添加 **Constitution Compliance** 章节:

```yaml
Constitution Compliance Check:
  执行时机: [初始验证/实施前/质量闸/发布前]

  检查维度:
    1. Quality First:
       - NO PARTIAL IMPLEMENTATION 验证
       - 完整性和质量标准检查

    2. Architecture Consistency:
       - NO CODE DUPLICATION 检测
       - 架构约束遵循验证

    3. Security First:
       - NO HARDCODED SECRETS 扫描
       - 安全要求实现检查

    4. Performance Accountability:
       - NO RESOURCE LEAKS 检测
       - 性能指标验证

    5. Maintainability:
       - NO DEAD CODE 检查
       - 文档完整性验证

  执行方式:
    - 自动化检查脚本
    - 质量闸集成
    - 人工审查确认
```

### 2. check-prerequisites.sh 集成不统一

#### 问题描述
除 flow-status (只读命令) 外，所有命令都未集成前置条件检查脚本。

#### 影响分析
- Fail Fast 原则未充分执行
- 错误检测不够早期
- 用户体验不一致

#### 优化方案
在每个命令的"执行流程"开始阶段添加:

```markdown
## 前置条件验证

在执行命令前，使用 check-prerequisites.sh 验证环境:

\`\`\`bash
# 设置环境变量
export DEVFLOW_REQ_ID="${reqId}"  # 或 DEVFLOW_BUG_ID="${bugId}"

# 执行前置检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - ID 格式正确性 (REQ-\d+ 或 BUG-\d+)
# - 必需目录结构存在
# - Git 仓库状态健康
# - 必需工具可用性
# - 权限检查
\`\`\`

**Fail Fast**: 如果前置检查失败，立即终止命令执行，显示清晰错误信息。
```

### 3. 工作流指导文档引用不明确

#### 问题描述
flow-fix 提到"bug-fix-orchestrator 工作流指导文档"，但未明确说明其类型和作用机制。

#### 影响分析
- 用户可能误解为可执行子代理
- 与实际的 orchestrator 模式不一致
- 文档可能产生混淆

#### 优化方案
明确说明工作流指导文档的性质:

```markdown
### 工作流执行模式

根据 **bug-fix-orchestrator** 工作流指导文档 (type: `workflow-guide`)，主代理按以下标准操作程序执行:

**工作流指导文档特点**:
- 类型: `workflow-guide` (非可执行子代理)
- 作用: 提供标准操作程序 (SOP)
- 执行者: Claude 主代理
- 位置: `.claude/workflows/bug-fix-orchestrator.md` (或类似)

**执行机制**:
1. 主代理读取工作流指导文档
2. 按照文档定义的阶段和步骤执行
3. 在适当时机调用研究型子代理获取分析和计划
4. 主代理基于子代理输出直接执行代码实现
```

### 4. 状态管理文件命名不一致

#### 问题描述
不同命令引用不同的状态文件名:
- flow-fix: `status.json`, `LOG.md`
- flow-status: `orchestration_status.json`
- flow-update: `${taskId}_status.json`

#### 影响分析
- 状态管理碎片化
- 难以统一查询和监控
- 与 Agent Coordination 规则不一致

#### 优化方案
统一使用 `orchestration_status.json`:

```markdown
### 状态文件标准

所有命令统一使用以下状态文件:

**主状态文件**:
- 文件名: `orchestration_status.json`
- 位置: `.claude/docs/requirements/${reqId}/` 或 `.claude/docs/bugs/${bugId}/`
- 作用: 记录工作流整体状态、阶段进度、子代理调用状态

**任务级状态** (仅用于任务级跟踪):
- 文件名: `tasks/${taskId}.completed` (完成标记)
- 位置: `.claude/docs/requirements/${reqId}/tasks/`
- 作用: 标记单个任务的完成状态

**执行日志**:
- 文件名: `EXECUTION_LOG.md`
- 位置: 与 orchestration_status.json 同目录
- 作用: 详细的执行日志和操作记录
```

### 5. 子代理调用格式不统一

#### 问题描述
部分命令使用描述性文字，部分使用标准化的 `Task:` 格式。

#### 影响分析
- 文档风格不一致
- 用户理解可能产生偏差
- 自动化解析困难

#### 优化方案
统一使用标准化子代理调用格式:

```markdown
### 子代理调用标准格式

**格式规范**:
\`\`\`bash
Task: <agent-name> "<task-description>"
\`\`\`

**示例**:
\`\`\`bash
# BUG 分析
Task: bug-analyzer "Analyze root cause and impact for ${bugId}"

# PRD 生成
Task: prd-writer "Generate PRD from user intent: ${userInput}"

# 影响分析
Task: impact-analyzer "Analyze PRD changes for ${reqId}"

# 一致性检查
Task: consistency-checker "Perform comprehensive consistency analysis for ${reqId}"
\`\`\`

**说明**:
- agent-name: 子代理名称 (与 .claude/agents/ 中的文件名对应)
- task-description: 清晰描述任务内容和输入参数
- 引号: 使用双引号包裹任务描述
```

---

## 📝 具体命令优化建议

### 1. flow-fix.md (一键BUG修复流)

#### 现状评估
- 文件行数: 233行
- Constitution 集成: ❌ 完全缺失
- Prerequisites 集成: ❌ 完全缺失
- 工作流引用: ⚠️ 提到但不明确
- 状态文件: ⚠️ 使用 status.json 和 LOG.md

#### 优化建议

**1. 添加 Constitution Compliance 章节** (在"质量闸控制"后)
```markdown
## Constitution Compliance

每个关键阶段都进行 Constitution 合规检查:

### BUG 分析阶段
- **Quality First**: 确保根因分析完整，不允许部分分析
- **Security First**: 识别 BUG 的安全影响

### 修复实施阶段
- **NO PARTIAL IMPLEMENTATION**: 修复必须完整，包括所有边界情况
- **NO CODE DUPLICATION**: 遵循现有代码模式，复用函数
- **NO HARDCODED SECRETS**: 修复中不引入安全风险

### 验证阶段
- **测试覆盖**: 修复代码的测试覆盖率 ≥ 80%
- **NO RESOURCE LEAKS**: 确保资源正确释放
- **NO DEAD CODE**: 清理调试代码和注释
```

**2. 集成 Prerequisites Validation** (在"执行流程"开始)
```markdown
### 1. 前置条件验证

\`\`\`bash
# 设置BUG ID
export DEVFLOW_BUG_ID="${bugId}"

# 执行前置检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - BUG-ID 格式 (BUG-\d+)
# - Git 仓库状态干净
# - 当前分支状态
# - 必需工具可用性
\`\`\`

如果前置检查失败，立即终止并显示错误。
```

**3. 明确工作流指导文档** (在"按工作流指导执行"章节)
```markdown
### 2. 按工作流指导执行

根据 **bug-fix-orchestrator** 工作流指导文档 (type: `workflow-guide`)，主代理按以下标准操作程序执行:

**说明**: bug-fix-orchestrator 不是可执行子代理，而是工作流指导文档，定义了BUG修复的标准流程。主代理读取该文档并按其定义的步骤执行。
```

**4. 统一状态文件** (在"输出产物"章节)
```markdown
### 状态管理文件
\`\`\`text
.claude/docs/bugs/${bugId}/
├── orchestration_status.json  # 主状态文件 (替代 status.json)
├── EXECUTION_LOG.md           # 执行日志
└── tasks/
    ├── TASK_001.completed     # 任务完成标记
    └── TASK_002.completed
\`\`\`
```

**5. 标准化子代理调用** (在"分析阶段"章节)
```markdown
#### 2.3 分析阶段 - 调用研究型子代理

\`\`\`bash
# 1. BUG深度分析
Task: bug-analyzer "Analyze root cause and impact for ${bugId}: ${description}"

# 2. 修复计划生成
Task: planner "Generate fix plan and tasks for ${bugId} based on ANALYSIS.md"
\`\`\`
```

---

### 2. flow-ideate.md (意图驱动需求开发)

#### 现状评估
- 文件行数: 270行
- Constitution 集成: ⚠️ 有"宪法约束验证"章节 (100-111行)，但可增强
- Prerequisites 集成: ❌ 完全缺失
- 子代理调用: ✅ 已使用标准格式

#### 优化建议

**1. 增强 Constitution 验证章节** (扩展现有100-111行)
```markdown
### 4. Constitution 合规性验证

在每个关键节点进行 Constitution 合规检查:

#### 澄清阶段检查
- **Quality First**: 澄清问题必须全面，覆盖所有PRD必需信息
- **Security First**: 主动识别并询问安全相关需求
- **NO PARTIAL ANALYSIS**: 置信度 < 80% 时继续澄清，不允许部分理解

#### 结构化阶段检查
- **完整性验证**: 生成的需求必须包含所有必要章节
- **架构一致性**: 需求必须与现有系统架构兼容
- **NO CODE DUPLICATION**: 检查是否与已有需求重复

#### 质量标准
- 自动生成的 PRD 必须符合 Constitution 的 Quality First 原则
- 用户故事必须符合 INVEST 原则
- 验收标准必须具体且可测试
```

**2. 添加 Prerequisites Validation** (在"执行流程"开始)
```markdown
### 1. 前置条件验证

\`\`\`bash
# 如果输入包含 REQ-ID，验证环境
if [ -n "$reqId" ]; then
    export DEVFLOW_REQ_ID="$reqId"
    bash .claude/scripts/check-prerequisites.sh --json
fi

# 验证项:
# - 如果有 REQ-ID，检查格式和唯一性
# - Git 仓库状态
# - 必需工具可用性 (prd-writer)
\`\`\`
```

---

### 3. flow-restart.md (中断恢复)

#### 现状评估
- 文件行数: 540行
- Constitution 集成: ❌ 完全缺失
- Prerequisites 集成: ❌ 完全缺失

#### 优化建议

**1. 添加 Constitution Compliance 章节** (在"执行流程"后)
```markdown
## Constitution Compliance in Recovery

恢复过程中的 Constitution 检查:

### 恢复前验证
- **Quality First**: 确保恢复点的数据完整性
- **NO PARTIAL RECOVERY**: 要么完全恢复，要么不恢复

### 恢复执行
- **Architecture Consistency**: 恢复后的状态必须符合架构约束
- **NO DEAD CODE**: 清理恢复过程中产生的临时文件

### 恢复后验证
- **完整性检查**: 验证所有必需文档和代码的一致性
- **测试验证**: 确保恢复后的代码通过所有测试
```

**2. 集成 Prerequisites** (在"验证和准备阶段")
```markdown
### 1. 验证和准备阶段

\`\`\`bash
# 1.0 前置条件验证
export DEVFLOW_REQ_ID="${reqId}"
bash .claude/scripts/check-prerequisites.sh --json

# 特别验证:
# - REQ-ID 格式和存在性
# - Git 仓库健康状态
# - 备份目录可用性
# - 恢复目标阶段的可行性

# 1.1 参数验证 (现有内容)
validate_req_id_format()
...
\`\`\`
```

---

### 4. flow-status.md (进度查询)

#### 现状评估
- 文件行数: 410行
- Constitution 集成: N/A (只读命令)
- Prerequisites 集成: N/A (只读命令)
- 状态文件: ⚠️ 引用 `orchestration_status.json` 和其他文件

#### 优化建议

**仅优化状态文件引用的一致性**:

在文档中统一强调使用 `orchestration_status.json`:

```markdown
## 状态文件标准

flow-status 命令读取以下标准状态文件:

**主状态文件**:
- `orchestration_status.json` - 工作流整体状态 (必需)
- `EXECUTION_LOG.md` - 详细执行日志 (必需)

**任务状态**:
- `tasks/${taskId}.completed` - 任务完成标记 (可选)

**子代理输出**:
- `PRD.md`, `EPIC.md`, `TEST_REPORT.md` 等 (按需读取)
```

---

### 5. flow-update.md (任务进度更新)

#### 现状评估
- 文件行数: 575行
- Constitution 集成: ❌ 完全缺失
- Prerequisites 集成: ❌ 完全缺失
- 状态文件: ⚠️ 使用 `${taskId}_status.json`

#### 优化建议

**1. 添加 Constitution Quality Gates** (在"测试集成和质量检查"后)
```markdown
### 5. Constitution 质量门禁

进度更新时强制执行 Constitution 检查:

#### 代码质量检查
- **NO PARTIAL IMPLEMENTATION**: 进度100%前禁止标记为completed
- **NO CODE DUPLICATION**: 检测代码重复
- **NO DEAD CODE**: 清理调试代码

#### 测试质量检查
- **测试覆盖率**: 必须 ≥ 80%
- **NO CHEATER TESTS**: 测试必须有效且能发现缺陷

#### 性能检查
- **NO RESOURCE LEAKS**: 资源泄露检测
- **性能基准**: 关键路径性能验证

\`\`\`python
def enforce_constitution_gates(req_id, task_id, new_status):
    """Constitution 质量门禁检查"""

    if new_status == "completed":
        # 完成状态必须通过所有检查
        gates = {
            'no_partial': check_implementation_completeness(req_id, task_id),
            'no_duplication': check_code_duplication(req_id, task_id),
            'no_dead_code': check_dead_code(req_id, task_id),
            'test_coverage': check_test_coverage(req_id, task_id) >= 80,
            'no_leaks': check_resource_leaks(req_id, task_id)
        }

        failed_gates = [name for name, passed in gates.items() if not passed]

        if failed_gates:
            raise ConstitutionViolationError(
                f"Cannot mark task as completed. Failed gates: {failed_gates}"
            )
\`\`\`
```

**2. 集成 Prerequisites** (在"参数验证和环境检查"开始)
```markdown
### 1. 参数验证和环境检查

\`\`\`bash
# 1.0 前置条件验证
export DEVFLOW_REQ_ID="${reqId}"
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - REQ-ID 和 TASK-ID 格式
# - 任务文件存在性
# - Git 仓库状态
# - 实施计划完整性

# 1.1 验证参数格式 (现有内容)
validate_req_id_format()
...
\`\`\`
```

**3. 统一状态文件** (在"任务状态文件更新"章节)
```markdown
### 3.1 状态文件标准

\`\`\`yaml
# 主状态文件 (必需)
.claude/docs/requirements/${reqId}/orchestration_status.json:
  用途: 记录工作流整体状态和所有任务的聚合进度
  更新者: flow-update 命令

# 任务完成标记 (可选)
.claude/docs/requirements/${reqId}/tasks/${taskId}.completed:
  用途: 简单标记任务完成
  内容: 时间戳 + 简要总结

# 详细任务状态 (可选，用于详细跟踪)
.claude/docs/requirements/${reqId}/tasks/${taskId}_details.json:
  用途: 详细的任务级指标和历史
\`\`\`
```

---

### 6. flow-upgrade.md (PRD版本管理)

#### 现状评估
- 文件行数: 486行
- Constitution 集成: ⚠️ 有提及 (262-280行)，但可系统化
- Prerequisites 集成: ❌ 完全缺失
- 子代理调用: ✅ 使用标准格式

#### 优化建议

**1. 系统化 Constitution 集成** (扩展262-280行)
```markdown
## Constitution 驱动的版本管理

### 版本升级的 Constitution 约束

每个版本升级必须通过以下 Constitution 检查:

#### 1. Quality First 验证
- **完整性检查**:
  - 所有变更都有充分的业务理由
  - 用户故事符合 INVEST 原则
  - 验收标准具体且可测试
- **NO PARTIAL SPECIFICATION**:
  - 破坏性变更必须有完整的迁移路径
  - 新增功能必须有完整的实现计划

#### 2. Architecture Consistency 验证
- **架构对齐**:
  - 新版本需求符合系统架构约束
  - 技术选择与现有技术栈兼容
  - API 设计遵循统一标准
- **NO CODE DUPLICATION**:
  - 检查新需求是否与现有功能重复
  - 避免功能蔓延

#### 3. Security First 验证
- **安全影响评估**:
  - 安全相关变更需要独立审查
  - 数据隐私影响评估
  - 权限和认证变更验证
- **NO HARDCODED SECRETS**:
  - 新增配置不包含硬编码密钥

#### 4. Performance Accountability 验证
- **性能影响分析**:
  - 评估性能需求变更的合理性
  - 识别潜在性能瓶颈
- **NO RESOURCE LEAKS**:
  - 检查新需求是否引入资源管理问题

#### 5. Maintainability 验证
- **可维护性评估**:
  - 确保需求清晰易懂
  - 文档完整性检查
- **NO DEAD REQUIREMENTS**:
  - 清理过时或冲突的需求

### Constitution 检查集成点

\`\`\`yaml
Phase 1 - 分析阶段:
  constitution_check: 验证变更的完整性和合理性

Phase 2 - 准备阶段:
  constitution_check: 确保迁移计划符合质量标准

Phase 3 - 版本创建:
  constitution_check: 验证版本文档的完整性

Phase 4 - 后续处理:
  constitution_check: 确保所有文档更新完整
\`\`\`
```

**2. 添加 Prerequisites** (在"升级模式"开始)
```markdown
#### 2.0 前置条件验证

\`\`\`bash
# 验证环境和权限
export DEVFLOW_REQ_ID="${reqId}"
bash .claude/scripts/check-prerequisites.sh --json

# 额外验证:
# - 版本号格式 (SemVer)
# - 目标版本是否已存在
# - 当前工作状态干净
# - PRD 文档完整性
\`\`\`

#### 2.1 版本创建流程 (现有内容)
...
```

---

### 7. flow-verify.md (一致性验证)

#### 现状评估
- 文件行数: 479行
- Constitution 集成: ⚠️ 提到 Constitution 合规性 (51行)，但可系统化
- Prerequisites 集成: ❌ 完全缺失
- 子代理调用: ✅ 使用标准格式

#### 优化建议

**1. 系统化 Constitution 验证** (扩展现有提及)
```markdown
## Constitution 合规性验证

flow-verify 命令将 Constitution 验证作为核心检查维度:

### Constitution 5大原则验证

#### 1. Quality First 验证
- **NO PARTIAL IMPLEMENTATION 检测**:
  - 扫描代码中的 TODO、FIXME、XXX 注释
  - 检测未完成的函数实现
  - 识别占位符代码
- **质量标准检查**:
  - 测试覆盖率 ≥ 80%
  - 类型检查无错误
  - 代码质量评分达标

#### 2. Architecture Consistency 验证
- **NO CODE DUPLICATION 检测**:
  - 代码重复度分析
  - 相似功能识别
  - 建议复用现有代码
- **架构约束验证**:
  - 模块依赖关系检查
  - 层次结构合规性
  - 命名规范一致性

#### 3. Security First 验证
- **NO HARDCODED SECRETS 扫描**:
  - API 密钥硬编码检测
  - 密码和令牌扫描
  - 敏感数据暴露检查
- **安全需求验证**:
  - 安全需求实现完整性
  - 安全测试覆盖检查

#### 4. Performance Accountability 验证
- **NO RESOURCE LEAKS 检测**:
  - 内存泄露分析
  - 文件句柄泄露检测
  - 连接池管理检查
- **性能要求验证**:
  - 性能指标达成检查
  - 关键路径性能分析

#### 5. Maintainability 验证
- **NO DEAD CODE 检测**:
  - 未使用函数扫描
  - 无法到达代码检测
  - 过时注释清理
- **可维护性指标**:
  - 代码复杂度分析
  - 文档完整性检查
  - 注释质量评估

### Constitution 违规严重程度

\`\`\`yaml
严重程度分类:
  CRITICAL (必须立即修复):
    - NO HARDCODED SECRETS 违规
    - NO PARTIAL IMPLEMENTATION (生产代码)
    - NO RESOURCE LEAKS (关键路径)

  HIGH (建议尽快修复):
    - NO CODE DUPLICATION (大量重复)
    - 架构约束违反
    - 性能要求未达标

  MEDIUM (可择机修复):
    - NO DEAD CODE
    - 文档不完整
    - 命名不一致
\`\`\`
```

**2. 添加 Prerequisites** (在"验证模式选择"前)
```markdown
### 0. 前置条件验证

\`\`\`bash
# 单项目验证模式
if [ -n "$reqId" ]; then
    export DEVFLOW_REQ_ID="$reqId"
    bash .claude/scripts/check-prerequisites.sh --json
fi

# 批量验证模式
if [ "$mode" = "--all" ]; then
    # 验证整体环境
    bash .claude/scripts/check-prerequisites.sh --global --json
fi

# 验证项:
# - REQ-ID 格式和存在性
# - 必需文档完整性
# - Git 仓库状态
# - consistency-checker 可用性
\`\`\`
```

---

## 📊 优化成果量化

### 优化范围统计

| 优化维度 | 需优化命令数 | 优化项总数 | 预计新增行数 |
|---------|-----------|----------|-----------|
| Constitution 集成 | 5 | 5个完整章节 | ~150行/命令 |
| Prerequisites 集成 | 6 | 6个验证章节 | ~20行/命令 |
| 工作流引用明确 | 1 | 1个说明 | ~10行 |
| 状态文件统一 | 3 | 3个更新 | ~15行/命令 |
| 子代理调用格式 | 1 | 多处格式标准化 | ~5行/处 |

### 预计代码增量

| 命令文件 | 当前行数 | 新增行数 | 优化后行数 | 增量百分比 |
|---------|---------|---------|-----------|-----------|
| flow-fix.md | 233 | ~200 | ~433 | +85.8% |
| flow-ideate.md | 270 | ~50 | ~320 | +18.5% |
| flow-restart.md | 540 | ~180 | ~720 | +33.3% |
| flow-status.md | 410 | ~20 | ~430 | +4.9% |
| flow-update.md | 575 | ~180 | ~755 | +31.3% |
| flow-upgrade.md | 486 | ~100 | ~586 | +20.6% |
| flow-verify.md | 479 | ~120 | ~599 | +25.1% |
| **总计** | **2,993** | **~850** | **~3,843** | **+28.4%** |

---

## 🎯 优化优先级建议

### 高优先级 (P0 - 立即执行)

1. **flow-fix.md** (85.8% 增量)
   - 最常用的命令之一
   - Constitution 集成缺失严重
   - 影响 BUG 修复质量

2. **flow-update.md** (31.3% 增量)
   - 进度管理核心命令
   - 需要强制 Constitution 质量门禁
   - 影响开发过程质量控制

### 中优先级 (P1 - 近期执行)

3. **flow-restart.md** (33.3% 增量)
   - 恢复机制需要完整性保证
   - Constitution 检查确保恢复质量

4. **flow-verify.md** (25.1% 增量)
   - 一致性验证应包含 Constitution 检查
   - 需要系统化 Constitution 验证逻辑

5. **flow-upgrade.md** (20.6% 增量)
   - 版本管理需要 Constitution 约束
   - 已有部分基础，需系统化

### 低优先级 (P2 - 可后续执行)

6. **flow-ideate.md** (18.5% 增量)
   - 已有 Constitution 章节，仅需增强
   - 使用频率相对较低

7. **flow-status.md** (4.9% 增量)
   - 只读命令，优化需求最小
   - 主要是状态文件引用统一

---

## ✅ 实施计划

### Phase 1 - 高优先级命令优化 (1天)
1. flow-fix.md
2. flow-update.md

### Phase 2 - 中优先级命令优化 (1-2天)
3. flow-restart.md
4. flow-verify.md
5. flow-upgrade.md

### Phase 3 - 低优先级命令优化 (半天)
6. flow-ideate.md
7. flow-status.md

### Phase 4 - 验证和文档 (半天)
- 创建命令优化验收清单
- 更新 README 和使用指南
- 生成命令优化完成总结

---

## 📚 相关文档

### 核心参考
- [project-constitution.md](../constitution/project-constitution.md) - 项目宪法
- [agent-coordination.md](../rules/agent-coordination.md) - 代理协调规则
- [check-prerequisites.sh](../scripts/check-prerequisites.sh) - 前置检查脚本

### 已完成优化
- [AGENT_OPTIMIZATION_SUMMARY.md](./AGENT_OPTIMIZATION_SUMMARY.md) - Agent 优化总结

---

**最后更新**: 2025-10-01
**文档版本**: 1.0
**分析状态**: ✅ 完成

**下一步**: 按优先级执行命令文件优化

---

*CC-DevFlow Command Optimization - 统一标准，提升质量*
