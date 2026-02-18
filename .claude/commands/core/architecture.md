---
name: core-architecture
description: 'Generate or update ARCHITECTURE.md with 4 architecture diagrams. Usage: /core-architecture'
scripts:
  sync_progress: .claude/scripts/sync-roadmap-progress.sh
---

# Flow-Architecture - 架构文档生成命令

## 命令格式
```text
/core-architecture              # Generate or update architecture documentation
/core-architecture --force      # Force regenerate even if ARCHITECTURE.md exists
```

## 核心原则

**这是一个简化的命令，专注于架构文档生成。**
**适用场景**: ROADMAP.md 已存在，需要生成或更新架构图。

### 架构模式
```
用户
  ↓
core-architecture (minimal interaction)
  ↓
architecture-designer (research, no dialogue)
  ↓
ARCHITECTURE.md (4 diagrams)
```

## 执行流程

### Phase 1: Prerequisites Check

**目标**: 确保有足够的上下文生成架构文档

```
1. 检查 devflow/ROADMAP.md 是否存在
   → 不存在:
      ERROR: "ROADMAP.md not found at: devflow/ROADMAP.md"
      ""
      "Architecture generation requires a roadmap first."
      "Please run /core-roadmap to create a roadmap."
      ""
      EXIT

   → 存在:
      ✓ 继续

2. 检查 devflow/ARCHITECTURE.md 是否存在
   → 存在且未使用 --force:
      PROMPT: "ARCHITECTURE.md already exists."
      "Do you want to regenerate it? (yes/no)"
      "This will overwrite the existing file."
      ""
      用户输入 'no' → EXIT
      用户输入 'yes' → 继续

   → 不存在或使用 --force:
      ✓ 继续

3. 扫描项目结构
   → 检查 devflow/requirements/ 目录
   → 至少有 1 个需求目录推荐（不强制）
   → 如果没有: WARN "No requirements found. Architecture will be basic."

4. 检查 devflow/project.md
   → 存在: ✓ 将用于提取项目信息
   → 不存在: WARN "project.md not found. Will infer from requirements."
```

### Phase 2: Context Summary

**目标**: 向用户展示将要使用的上下文

```
展示上下文摘要:

"==================================================================="
"Architecture Documentation Generation"
"==================================================================="
""
"📊 Context Analysis:"
""
"✓ ROADMAP.md found"
"  - Roadmap Items: {rm_count} (RM-IDs)"
"  - Milestones: {milestone_count}"
"  - Dependencies: {dependency_count}"
""
If project.md exists:
  "✓ project.md found"
  "  - Project: {project_name}"
  "  - Tech Stack: {tech_stack_summary}"
Else:
  "⚠ project.md not found (will infer from requirements)"
""
If requirements exist:
  "✓ Requirements found: {req_count}"
  "  - Completed: {completed_count}"
  "  - In Progress: {in_progress_count}"
  "  - Planned: {planned_count}"
Else:
  "⚠ No requirements found"
""
"📐 Diagrams to Generate:"
"  1. Feature Architecture (功能架构图)"
"  2. Technical Architecture (技术架构图)"
"  3. Module Structure (模块划分图)"
"  4. Requirement Dependency (需求依赖图)"
""
"Ready to generate? (yes/no)"

用户输入 'yes' → Phase 3
用户输入 'no' → EXIT
```

### Phase 3: Call architecture-designer Agent

**目标**: 调用 Agent 生成架构文档

```
🤖 Agent 调用:

1. 提示:
   "Generating architecture documentation..."
   ""
   "This may take a moment as we analyze:"
   "  - ROADMAP.md content"
   "  - Requirements and tech designs"
   "  - Codebase structure"
   ""

2. 使用 Task tool 调用 architecture-designer:
   description: "Generate ARCHITECTURE.md with 4 diagrams"
   subagent_type: "architecture-designer"
   model: "sonnet" (或 inherit)
   prompt: "生成完整的项目架构文档。

   数据源:
   - devflow/ROADMAP.md (必须)
   - devflow/requirements/REQ-*/TECH_DESIGN.md (如果存在)
   - devflow/project.md (如果存在)
   - src/, .claude/, devflow/ 目录结构

   请按照 .claude/docs/templates/ARCHITECTURE_TEMPLATE.md 的 Execution Flow 执行。

   生成完整的 devflow/ARCHITECTURE.md 文件，包含:
   1. Feature Architecture (功能架构图) - 基于 ROADMAP.md 的 RM-IDs
   2. Technical Architecture (技术架构图) - 基于技术栈分析
   3. Module Structure (模块划分图) - 基于实际目录结构
   4. Requirement Dependency (需求依赖图) - 基于依赖关系

   所有 Mermaid 图表必须语法正确，node IDs 不能包含空格或破折号。

   至少提供 1 条 Architecture Decision Record (ADR)。"

3. 等待 Agent 完成
   → 显示进度提示 (可选):
      "Analyzing project structure..."
      "Extracting tech stack..."
      "Generating diagrams..."
      "Validating Mermaid syntax..."

4. Agent 返回后，检查结果
```

### Phase 4: Validation

**目标**: 验证生成的架构文档质量

```
📋 文件验证:

1. 检查文件存在
   → devflow/ARCHITECTURE.md 必须存在
   → 否则: ERROR "Architecture file was not generated"

2. 检查文件大小
   → 文件大小 > 1000 bytes (合理的最小值)
   → 否则: WARN "Generated file seems too small, may be incomplete"

3. 检查占位符
   → 搜索 {{PLACEHOLDER}} 或 {{...}}
   → 如果找到: ERROR "Generated file contains placeholders: {list}"

4. 检查 Mermaid 图表
   → 搜索 ```mermaid 代码块
   → 应该有 4 个 Mermaid 代码块
   → 如果少于 4: WARN "Expected 4 diagrams, found {count}"

5. 基本语法检查 (可选，简单验证)
   → 检查每个 Mermaid 块:
      • 是否包含 graph 或 flowchart 声明
      • 是否有明显的语法错误 (未闭合括号等)
   → 如果发现问题: WARN "Potential syntax issues in diagrams"

验证通过 → Phase 5
验证失败 → 显示错误并建议手动检查
```

### Phase 5: Success Report

**目标**: 向用户报告成功并提供后续步骤

```
🎉 成功报告:

"==================================================================="
"Architecture Documentation Generated Successfully!"
"==================================================================="
""
"📁 Output File:"
"  ✓ devflow/ARCHITECTURE.md ({file_size} bytes)"
""
"📐 Diagrams Generated:"
"  ✓ 1. Feature Architecture (功能架构图)"
"     - Core modules: {core_count}"
"     - Business modules: {business_count}"
"     - Support modules: {support_count}"
""
"  ✓ 2. Technical Architecture (技术架构图)"
"     - Layers: {layer_count}"
"     - Technologies: {tech_count}"
""
"  ✓ 3. Module Structure (模块划分图)"
"     - Directories: {dir_count}"
"     - Key modules: {module_list}"
""
"  ✓ 4. Requirement Dependency (需求依赖图)"
"     - Total nodes: {node_count}"
"     - Completed REQs: {completed_count}"
"     - Planned RMs: {planned_count}"
""
"📊 Additional Content:"
"  ✓ Architecture Decision Records: {adr_count}"
"  ✓ Non-Functional Requirements: {nfr_sections}"
"  ✓ Architecture Evolution Path: {evolution_phases}"
""
"🎯 Next Steps:"
"  1. Open devflow/ARCHITECTURE.md in your editor"
"  2. Verify all Mermaid diagrams render correctly"
"  3. Review Architecture Decision Records (ADRs)"
"  4. Update ADRs when making architectural changes"
""
"💡 Tips:"
"  - Use a Markdown viewer with Mermaid support to preview diagrams"
"  - Regenerate architecture when:"
"    • New requirements are added to roadmap"
"    • Major tech stack changes occur"
"    • Module structure changes significantly"
"  - Keep ADRs up-to-date for team alignment"
""
"To regenerate: /core-architecture --force"
""
"==================================================================="
```

## 错误处理

### 常见错误及处理

1. **ROADMAP.md 不存在**:
   ```
   ERROR: "ROADMAP.md not found at: devflow/ROADMAP.md"
   ""
   "Architecture generation requires a roadmap first."
   "Please run /core-roadmap to create a roadmap."
   ""
   "If you want to create a basic architecture without a roadmap,"
   "consider creating a minimal ROADMAP.md manually or using /core-roadmap."
   ```

2. **Agent 调用失败**:
   ```
   ERROR: "Architecture generation failed: {error_message}"
   ""
   "Possible causes:"
   "  - Insufficient context (no requirements or tech designs)"
   "  - Invalid ROADMAP.md format"
   "  - File system permissions"
   ""
   "Please check the error message above and:"
   "  1. Verify ROADMAP.md is valid"
   "  2. Ensure at least 1 requirement exists (recommended)"
   "  3. Check file permissions"
   ""
   "Retry with: /core-architecture --force"
   ```

3. **生成文件包含占位符**:
   ```
   ERROR: "Generated ARCHITECTURE.md contains placeholders"
   ""
   "Found: {list_of_placeholders}"
   ""
   "This indicates incomplete generation. Possible causes:"
   "  - Missing required context"
   "  - Agent execution error"
   ""
   "Please report this issue and include:"
   "  - Contents of devflow/ROADMAP.md"
   "  - Number of requirements in devflow/requirements/"
   "  - Whether project.md exists"
   ```

4. **Mermaid 语法错误** (如果能检测到):
   ```
   WARN: "Potential Mermaid syntax errors detected"
   ""
   "Diagram: {diagram_name}"
   "Issue: {description}"
   ""
   "The file has been generated, but please manually review:"
   "  {line_number}: {problematic_line}"
   ""
   "Common fixes:"
   "  - Ensure node IDs have no spaces (use camelCase)"
   "  - Check all brackets are closed"
   "  - Verify arrow syntax (use --> not ->)"
   ```

## 与其他命令的集成

### 在 /core-roadmap 中的调用
```
/core-roadmap 在 Stage 7 会自动调用 architecture-designer
无需单独运行 /core-architecture
```

### 在 /flow:init 中的使用
```
/flow:init 可以读取 ARCHITECTURE.md 获取上下文:
  - 查看需求在架构中的位置
  - 了解相关模块和依赖
  - 参考 ADR 做技术决策
```

### 手动更新架构
```
When to run /core-architecture manually:
  - ROADMAP.md 更新后
  - 新增重要需求后
  - 技术栈变化后
  - 模块结构调整后
```

## 输出

### 文件输出
- `devflow/ARCHITECTURE.md`: 完整架构文档（含 4 种架构图和 ADRs）

### 不更新的文件
- `devflow/ROADMAP.md`: 不变
- `devflow/BACKLOG.md`: 不变
- 需求目录: 不变

## 性能考虑

- **执行时间**: 通常 30-60 秒（取决于项目规模）
- **Agent 使用**: architecture-designer（研究型，sonnet 模型）
- **文件读取**: ROADMAP.md, project.md, TECH_DESIGN.md 文件, 目录结构
- **文件写入**: 仅 ARCHITECTURE.md

## 高级功能

### --force 模式
```
/core-architecture --force

行为:
  - 跳过 "文件已存在" 确认
  - 直接覆盖现有 ARCHITECTURE.md
  - 适用于 CI/CD 或自动化场景
```

### 可能的未来扩展
```
1. --diagrams-only: 只更新图表部分，保留 ADRs
2. --validate-only: 只验证现有 ARCHITECTURE.md，不生成
3. --export-diagrams: 导出 Mermaid 图表为独立文件
```

## 使用场景

### 场景 1: 首次生成架构文档
```
前提: 已完成 /core-roadmap
操作: /core-architecture
结果: 生成包含 4 种架构图的完整文档
```

### 场景 2: 更新现有架构文档
```
前提: ARCHITECTURE.md 已存在，ROADMAP 有更新
操作: /core-architecture
提示: 确认覆盖
结果: 重新生成架构文档，反映最新状态
```

### 场景 3: 自动化/CI 场景
```
前提: 在 CI pipeline 中
操作: /core-architecture --force
结果: 无交互，直接生成/覆盖
```

## 最佳实践

1. **何时生成架构文档**:
   - 创建路线图后立即生成（/core-roadmap 会自动调用）
   - 每个季度开始时更新
   - 重大架构决策后更新

2. **如何维护架构文档**:
   - 保持 ADRs 更新
   - 新增重要技术决策时补充 ADR
   - 定期验证图表与实际代码一致性

3. **如何审查架构文档**:
   - 用 Markdown 预览器查看
   - 确认 4 种图表都能正确渲染
   - 检查依赖关系是否准确
   - 验证技术栈描述与实际一致

4. **团队协作**:
   - 架构文档入版本库
   - 架构变更需要团队 review
   - ADRs 作为技术决策的记录和沟通工具
