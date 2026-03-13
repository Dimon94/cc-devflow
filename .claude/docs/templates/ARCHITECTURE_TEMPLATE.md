# Project Architecture: {{PROJECT_NAME}}

**Version**: {{VERSION}}
**Created**: {{CREATED_DATE}} 北京时间
**Updated**: {{UPDATED_DATE}} 北京时间
**Architecture Type**: {{ARCH_TYPE}}
**Deployment Model**: {{DEPLOYMENT_MODEL}}

**Input**:
- devflow/ROADMAP.md (路线图，包含所有 RM-IDs 和需求)
- devflow/requirements/REQ-*/TECH_DESIGN.md (已有需求的技术设计)
- devflow/project.md (技术栈信息)
- devflow/ARCHITECTURE.md (如果存在，用于更新模式)

**Prerequisites**: ROADMAP.md 已生成，至少有 1 个已完成的需求

## Execution Flow (Architecture 生成流程)
```
1. Load inputs
   → Read devflow/ROADMAP.md (extract RM-IDs, dependencies)
   → Read devflow/requirements/REQ-*/TECH_DESIGN.md (analyze tech stack, modules)
   → Read devflow/project.md (extract tech stack)
   → Check if devflow/ARCHITECTURE.md exists (update vs create mode)

2. Analyze architecture type
   → Extract from project.md or infer from requirements
   → Architecture Type: Monolith | Microservices | Frontend-Backend | Serverless
   → Deployment Model: Desktop | Web | Mobile | CLI | Hybrid

3. Analyze tech stack
   → From project.md: extract Frontend, Backend, Database, Integration technologies
   → From TECH_DESIGN.md: extract additional libraries, frameworks
   → Organize by layer (Presentation, Business, Data, Integration)

4. Generate Diagram 1: Feature Architecture (功能架构图)
   → From ROADMAP.md: extract all RM-IDs and REQ-IDs
   → Group related features into clusters (Core, Business, Support)
   → Identify dependencies from ROADMAP.md dependency graph
   → Generate Mermaid graph syntax

5. Generate Diagram 2: Technical Architecture (技术架构图)
   → Design layered architecture (Presentation → Business → Data → Integration)
   → Map technologies to layers from tech stack analysis
   → Show interactions between layers
   → Generate Mermaid graph syntax

6. Generate Diagram 3: Module Structure (模块划分图)
   → Scan actual codebase structure (src/, .claude/, devflow/, etc.)
   → Identify key directories and their relationships
   → Generate Mermaid graph syntax

7. Generate Diagram 4: Requirement Dependency (需求依赖图)
   → From ROADMAP.md: extract dependency relationships
   → Include both REQ-to-RM and RM-to-RM dependencies
   → Color-code by status:
      • Completed REQs: #90EE90 (green)
      • In-progress REQs: #FFD700 (gold)
      • Planned RMs: #D3D3D3 (gray)
   → Generate Mermaid graph syntax

8. Fill Architecture Decision Records (ADR)
   → For each major architectural decision:
      • What: Decision made
      • Why: Rationale
      • When: Date
      • Impact: Consequences
   → Include decisions from TECH_DESIGN.md

9. Validate completeness
   → All 4 diagrams generated
   → All Mermaid syntax valid
   → No {{PLACEHOLDER}} remaining
   → Architecture reflects ROADMAP.md content

10. Write devflow/ARCHITECTURE.md
    → Write complete file
    → Use UTF-8 encoding
```

**重要**: 这是一个自执行模板。architecture-designer agent 应该按照 Execution Flow 生成完整的 ARCHITECTURE.md 文件。

---

## 架构类型

- **应用类型**: {{ARCH_TYPE}}
  - 选项: Monolith | Microservices | Frontend-Backend | Serverless | Hybrid
- **部署模型**: {{DEPLOYMENT_MODEL}}
  - 选项: Desktop | Web | Mobile | CLI | Hybrid

---

## 技术栈

### 前端层（Presentation Layer）
{{FRONTEND_STACK}}

_从 project.md 和 TECH_DESIGN.md 提取_

### 业务层（Business Layer）
{{BACKEND_STACK}}

_从 project.md 和 TECH_DESIGN.md 提取_

### 数据层（Data Layer）
{{DATABASE_STACK}}

_从 project.md 和 TECH_DESIGN.md 提取_

### 集成层（Integration Layer）
{{INTEGRATION_STACK}}

_从 project.md 和 TECH_DESIGN.md 提取_

---

## 1. 功能架构图（Feature Architecture）

```mermaid
graph TB
    subgraph Core["核心功能"]
        {{CORE_FEATURES}}
    end

    subgraph Business["业务功能"]
        {{BUSINESS_FEATURES}}
    end

    subgraph Support["支撑功能"]
        {{SUPPORT_FEATURES}}
    end

    {{FEATURE_DEPENDENCIES}}
```

_填充规则:_
- 从 ROADMAP.md 提取所有 RM-IDs 和 REQ-IDs
- 按功能类型分组（核心/业务/支撑）
- 标注依赖关系（箭头）

---

## 2. 技术架构图（Technical Architecture）

```mermaid
graph TB
    subgraph Presentation["表现层"]
        {{PRESENTATION_COMPONENTS}}
    end

    subgraph Business["业务层"]
        {{BUSINESS_COMPONENTS}}
    end

    subgraph Data["数据层"]
        {{DATA_COMPONENTS}}
    end

    subgraph Integration["集成层"]
        {{INTEGRATION_COMPONENTS}}
    end

    {{LAYER_INTERACTIONS}}
```

_填充规则:_
- 基于技术栈分析结果
- 展示各层之间的交互关系
- 标注关键技术选型

---

## 3. 模块划分图（Module Structure）

```mermaid
graph TB
    subgraph Root["项目根目录"]
        {{ROOT_MODULES}}
    end

    {{MODULE_RELATIONSHIPS}}
```

_填充规则:_
- 扫描实际代码库结构
- 识别关键目录及其职责
- 展示模块间依赖关系

---

## 4. 需求依赖图（Requirement Dependency）

```mermaid
graph LR
    {{REQUIREMENT_NODES}}
    {{REQUIREMENT_DEPENDENCIES}}

    classDef completed fill:#90EE90
    classDef inProgress fill:#FFD700
    classDef planned fill:#D3D3D3

    {{REQUIREMENT_CLASSES}}
```

_填充规则:_
- 从 ROADMAP.md 提取依赖关系
- 按状态着色（完成/进行中/计划中）
- 展示 REQ-to-RM 和 RM-to-RM 依赖

---

## 架构决策记录（Architecture Decision Records）

### ADR 格式
每个 ADR 包含:
- Date: 决策日期
- Status: Accepted | Proposed | Deprecated
- Context: 背景和问题
- Decision: 决策内容
- Rationale: 为什么选择这个决策
- Consequences: 这个决策带来的影响
- Alternatives: 考虑过但未选择的其他方案

_示例:_

### ADR-001: 选择 Electron 作为桌面应用框架

- **日期**: 2024-12-01 北京时间
- **状态**: Accepted
- **决策者**: Tech Team

**背景**: 需要开发跨平台桌面应用，支持 macOS、Windows、Linux。

**决策**: 使用 Electron 框架构建桌面应用。

**理由**:
- 团队熟悉 Web 技术栈（React + TypeScript）
- Electron 拥有成熟的生态系统和社区支持
- 可复用 Web 开发经验和组件库

**影响**:
- **正面影响**:
  - 开发效率高，团队无需学习新技术栈
  - 跨平台支持开箱即用
  - 丰富的第三方库和工具

- **负面影响**:
  - 内存占用较高（Chromium 内核）
  - 应用包体积较大（100MB+）
  - 启动速度相对原生应用较慢

**替代方案**:
1. **Tauri (Rust + Web)**
   - 优势: 更小的包体积、更低的内存占用
   - 劣势: 团队不熟悉 Rust、生态系统相对不成熟
   - 为何未选择: 学习成本高，时间紧迫

2. **原生开发（Swift/Kotlin/C++）**
   - 优势: 性能最优、用户体验最佳
   - 劣势: 需要为每个平台单独开发，成本高
   - 为何未选择: 资源有限，无法支撑多平台原生开发

---

## 架构演进路径

### 当前状态（As-Is）
{{CURRENT_STATE}}

_描述当前架构的状态、已实现的功能模块、技术债务等_

### 目标状态（To-Be）
{{TARGET_STATE}}

_根据 ROADMAP.md 描述未来 3 个月的目标架构状态_

### 演进计划

| Phase | Timeline | Focus | Key Changes |
|-------|----------|-------|-------------|
| Phase 1 | {{PHASE_1_TIMELINE}} | {{PHASE_1_FOCUS}} | {{PHASE_1_CHANGES}} |
| Phase 2 | {{PHASE_2_TIMELINE}} | {{PHASE_2_FOCUS}} | {{PHASE_2_CHANGES}} |
| Phase 3 | {{PHASE_3_TIMELINE}} | {{PHASE_3_FOCUS}} | {{PHASE_3_CHANGES}} |

_填充规则:_
- 基于 ROADMAP.md 的季度规划
- 描述架构如何随路线图演进
- 标注关键变化点（新增模块、重构、技术升级）

---

## 非功能性需求（NFRs）

### 性能要求

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| 应用启动时间 | {{CURRENT_STARTUP}} | {{TARGET_STARTUP}} | {{STARTUP_TIMELINE}} |
| 内存占用 | {{CURRENT_MEMORY}} | {{TARGET_MEMORY}} | {{MEMORY_TIMELINE}} |
| API 响应时间 | {{CURRENT_API_LATENCY}} | {{TARGET_API_LATENCY}} | {{API_TIMELINE}} |

### 可扩展性要求
{{SCALABILITY_REQUIREMENTS}}

_描述如何支持用户增长、数据增长、功能扩展_

### 安全要求
{{SECURITY_REQUIREMENTS}}

_描述认证、授权、加密、审计等安全机制_

---

## Validation Checklist

在输出 ARCHITECTURE.md 前，确保:

- [x] 所有 4 个 Mermaid 图表已生成
- [x] 所有 Mermaid 语法有效（无语法错误）
- [x] 所有 {{PLACEHOLDER}} 已填充
- [x] 架构反映了 ROADMAP.md 的内容
- [x] 至少有 1 个 ADR 记录
- [x] 技术栈信息完整
- [x] 演进路径清晰

---

**Template Version**: 2.0.0 (Slimmed from 633 lines to ~350 lines, -45%)
**Last Updated**: 2026-03-12
**Maintainer**: CC-DevFlow Team

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
