# /flow-constitution - Constitution 管理命令

## Execution Instructions

**Backend Script**: `.claude/scripts/manage-constitution.sh`

When user runs `/flow-constitution` with arguments, execute the corresponding backend script command:

```bash
# Map user commands to script actions:
/flow-constitution                              → bash .claude/scripts/manage-constitution.sh show
/flow-constitution --article I                  → bash .claude/scripts/manage-constitution.sh show I
/flow-constitution --verify                     → bash .claude/scripts/manage-constitution.sh verify
/flow-constitution --impact-report              → bash .claude/scripts/manage-constitution.sh impact
/flow-constitution --history                    → bash .claude/scripts/manage-constitution.sh history
/flow-constitution --amend --proposal FILE      → bash .claude/scripts/manage-constitution.sh amend FILE
/flow-constitution --apply --version TYPE       → bash .claude/scripts/manage-constitution.sh apply TYPE
```

**Important**: Always use the backend script. Do not implement logic directly in this command.

## 命令描述

管理和传播 CC-DevFlow 项目宪法 (Constitution) 的修订和更新。

**核心功能**:
- 显示当前 Constitution 版本和内容
- 提议和应用 Constitution 修正案 (Amendments)
- 自动传播修订到所有模板、代理和脚本
- 生成修订影响报告 (Amendment Impact Report)
- 验证 Constitution 一致性

**灵感来源**: 基于 GitHub spec-kit 的 `/speckit.constitution` 命令

## 使用方法

```bash
# 查看当前 Constitution
/flow-constitution

# 显示特定 Article
/flow-constitution --article I
/flow-constitution --article X

# 提议修正案
/flow-constitution --amend --proposal "修正案描述.md"

# 应用修正案 (更新版本号)
/flow-constitution --apply --version MAJOR|MINOR|PATCH

# 生成影响报告
/flow-constitution --impact-report

# 验证一致性
/flow-constitution --verify

# 显示历史
/flow-constitution --history
```

## 参数说明

- `--article ARTICLE_NUM`: 显示特定 Article (I-X)
- `--amend`: 修正案模式
- `--proposal FILE`: 修正案提案文件路径
- `--apply`: 应用修正案
- `--version TYPE`: 版本更新类型 (MAJOR/MINOR/PATCH)
- `--impact-report`: 生成影响报告
- `--verify`: 验证所有文件引用的 Constitution 版本一致性
- `--history`: 显示 Constitution 版本历史
- `--help, -h`: 显示帮助信息

## 工作流程

### 1. 查看当前 Constitution

```bash
/flow-constitution
```

**输出**:
- Constitution 版本号 (v2.0.0)
- 所有 10 个 Articles 概览
- 最后修订日期
- 当前状态 (Active/Draft)

### 2. 提议修正案

```bash
/flow-constitution --amend --proposal amendments/add-observability-article.md
```

**修正案提案格式** (`amendments/YYYY-MM-DD-description.md`):

```markdown
# Amendment Proposal: Add Observability Article

**Proposed Version**: v2.1.0 (MINOR)
**Date**: 2025-01-10
**Proposer**: Tech Lead

## Motivation

需要将 Observability (可观测性) 作为独立的宪法条款，确保所有项目都有完善的监控、日志和追踪。

## Proposed Article XI: Observability (可观测性)

**Principle**: Systems must be observable in production.

### XI.1 Logging Mandate
- Structured logging (JSON format)
- Log levels properly used (DEBUG, INFO, WARN, ERROR)
- Sensitive data redacted

### XI.2 Metrics Collection
- Key business metrics tracked
- Performance metrics (latency, throughput)
- Error rates monitored

### XI.3 Distributed Tracing
- Request correlation IDs
- Trace context propagation
- APM integration

## Impact Analysis

### Files to Update
- `.claude/constitution/project-constitution.md` (add Article XI)
- `.claude/docs/templates/EPIC_TEMPLATE.md` (add Observability check)
- `.claude/agents/planner.md` (reference Article XI)
- `.claude/scripts/validate-constitution.sh` (add Article XI checks)

### Affected Requirements
- All REQ-* in development stage must add observability tasks
- Existing REQ-* in production should add monitoring in next iteration

## Migration Strategy

1. **Immediate**: Update Constitution document
2. **Phase 1 (Day 1-7)**: Update all templates and agent instructions
3. **Phase 2 (Day 8-14)**: Update validation scripts
4. **Phase 3 (Day 15+)**: Retroactive compliance for active requirements
```

**执行流程**:

1. **Read Proposal**: 读取修正案提案文件
2. **Validate Format**: 验证提案格式完整性
3. **Impact Analysis**: 使用 impact-analyzer 分析影响范围
4. **Compatibility Check**: 使用 compatibility-checker 检查向后兼容性
5. **Generate Preview**: 生成修订预览文档
6. **User Confirmation**: 询问用户是否继续

### 3. 应用修正案

```bash
/flow-constitution --apply --version MINOR
```

**执行流程**:

1. **Version Bump**: 更新 Constitution 版本号
   - MAJOR: 1.0.0 → 2.0.0 (破坏性变更)
   - MINOR: 2.0.0 → 2.1.0 (新增 Article)
   - PATCH: 2.1.0 → 2.1.1 (修正错误、澄清描述)

2. **Update Constitution**: 修改 `project-constitution.md`
   - 插入新 Article 或更新现有 Article
   - 更新版本号和修订日期
   - 添加到 Version History 部分

3. **Propagate Changes** (一致性传播):
   ```bash
   # 自动更新所有引用 Constitution 的文件

   # 模板文件
   - .claude/docs/templates/PRD_TEMPLATE.md
   - .claude/docs/templates/EPIC_TEMPLATE.md
   - .claude/docs/templates/TASKS_TEMPLATE.md

   # 代理指令
   - .claude/agents/prd-writer.md
   - .claude/agents/planner.md
   - .claude/agents/qa-tester.md
   - .claude/agents/security-reviewer.md

   # 验证脚本
   - .claude/scripts/validate-constitution.sh
   - .claude/scripts/validate-scope-boundary.sh

   # 钩子脚本
   - .claude/hooks/pre-push-guard.sh

   # 主文档
   - CLAUDE.md
   ```

4. **Generate Sync Report**: 生成同步影响报告
   ```markdown
   # Constitution Amendment Sync Report

   **Amendment**: Add Article XI - Observability
   **Version**: v2.0.0 → v2.1.0
   **Date**: 2025-01-10

   ## Files Updated (Auto-sync)
   - ✅ project-constitution.md (v2.1.0)
   - ✅ PRD_TEMPLATE.md (references Article XI)
   - ✅ EPIC_TEMPLATE.md (Observability check added)
   - ✅ planner.md (Article XI enforcement)
   - ✅ validate-constitution.sh (Article XI validation)

   ## Manual Actions Required
   - [ ] Review all active REQ-* for observability compliance
   - [ ] Update monitoring infrastructure
   - [ ] Train team on new observability requirements

   ## Retroactive Compliance
   - REQ-001: Add observability tasks (Priority: P2)
   - REQ-005: Add monitoring setup (Priority: P1)
   ```

5. **Git Commit**: 创建专门的 Amendment commit
   ```bash
   git add .claude/constitution/ .claude/docs/templates/ .claude/agents/ .claude/scripts/
   git commit -m "feat(constitution): Amendment v2.1.0 - Add Article XI Observability

   - Add Article XI: Observability (Logging, Metrics, Tracing)
   - Update all templates to reference Article XI
   - Update agent instructions with observability enforcement
   - Update validation scripts for Article XI compliance

   BREAKING CHANGE: All new requirements must include observability tasks

   🤖 Generated with Claude Code

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

### 4. 生成影响报告

```bash
/flow-constitution --impact-report
```

**输出示例**:

```markdown
# Constitution Impact Report

**Current Version**: v2.0.0
**Generated**: 2025-01-10 10:30:00 UTC

## Active References

### Templates (3 files)
- PRD_TEMPLATE.md: References Articles I, II, III, IV, V, X
- EPIC_TEMPLATE.md: References Articles I-X (all)
- TASKS_TEMPLATE.md: References Articles I-VI, X

### Agents (4 files)
- prd-writer.md: Enforces Articles I, III, X
- planner.md: Enforces Articles VII, VIII, IX
- qa-tester.md: Enforces Articles I, VI
- security-reviewer.md: Enforces Article III

### Scripts (2 files)
- validate-constitution.sh: Validates all Articles
- validate-scope-boundary.sh: Validates Article X

## Consistency Check
✅ All files reference Constitution v2.0.0
✅ No orphaned Article references found
✅ All 10 Articles have enforcement points

## Potential Issues
⚠️ Article IV (Performance) has minimal enforcement in agents
   Suggestion: Add performance checks to qa-tester agent

⚠️ Article V.4 (File Size Limits) not validated automatically
   Suggestion: Add file size check to validate-constitution.sh
```

### 5. 验证一致性

```bash
/flow-constitution --verify
```

**验证项**:
1. **Version Consistency**: 所有文件引用相同版本
2. **Article Coverage**: 所有 Articles 都有执行点
3. **Template Completeness**: 所有模板都包含 Constitution Check 部分
4. **Agent Enforcement**: 每个 Article 至少有一个 agent 负责执行
5. **Validation Coverage**: validate-constitution.sh 覆盖所有 Articles

**输出**:
```text
Constitution Consistency Verification Report
============================================

Version Consistency: ✅ PASS
  - Constitution: v2.0.0
  - Templates: v2.0.0 (3/3)
  - Agents: v2.0.0 (4/4)
  - Scripts: v2.0.0 (2/2)

Article Coverage: ✅ PASS
  - Article I: 4 enforcement points
  - Article II: 3 enforcement points
  - Article III: 2 enforcement points
  - Article IV: 1 enforcement point ⚠️ (below threshold)
  - Article V: 2 enforcement points
  - Article VI: 3 enforcement points
  - Article VII: 2 enforcement points
  - Article VIII: 2 enforcement points
  - Article IX: 2 enforcement points
  - Article X: 3 enforcement points

Template Completeness: ✅ PASS
  - PRD_TEMPLATE.md: Constitution Check section present
  - EPIC_TEMPLATE.md: Constitution Check section present
  - TASKS_TEMPLATE.md: Constitution Alignment section present

Overall Status: ✅ PASS (1 warning)

Recommendations:
  - Consider adding Article IV enforcement to qa-tester.md
  - Add automated file size validation for Article V.4
```

### 6. 显示历史

```bash
/flow-constitution --history
```

**输出**:

```markdown
# Constitution Version History

## v2.0.0 (2025-01-10) - Active
**Type**: MAJOR
**Changes**:
- Complete restructure to Article-based system (Article I-X)
- Added Phase -1 Gates (Articles VII, VIII, IX)
- Added Requirement Boundary controls (Article X)
- Enhanced Amendment Process with versioning
- Added Four-Layer Enforcement System

**Migration**: All templates and agents updated to reference Articles

## v1.0.0 (2025-01-20) - Superseded
**Type**: Initial Release
**Changes**:
- Five core principles (Quality, Architecture, Security, Performance, Maintainability)
- Basic Constitution Check in templates

**Superseded By**: v2.0.0
```

## 实现细节

### 核心脚本: `.claude/scripts/manage-constitution.sh`

```bash
#!/usr/bin/env bash
# Constitution management backend script

manage_constitution() {
    local action="$1"

    case "$action" in
        show)
            show_constitution "$2"
            ;;
        amend)
            propose_amendment "$2"
            ;;
        apply)
            apply_amendment "$2" "$3"
            ;;
        impact)
            generate_impact_report
            ;;
        verify)
            verify_consistency
            ;;
        history)
            show_version_history
            ;;
        *)
            echo "Error: Unknown action $action"
            exit 1
            ;;
    esac
}

# 显示 Constitution
show_constitution() {
    local article="$1"
    local constitution_file=".claude/constitution/project-constitution.md"

    if [[ -z "$article" ]]; then
        # 显示完整 Constitution
        cat "$constitution_file"
    else
        # 显示特定 Article
        sed -n "/^## Article $article:/,/^## /p" "$constitution_file" | head -n -1
    fi
}

# 提议修正案
propose_amendment() {
    local proposal_file="$1"

    echo "📋 Analyzing amendment proposal..."

    # 读取提案
    if [[ ! -f "$proposal_file" ]]; then
        echo "❌ Error: Proposal file not found: $proposal_file"
        exit 1
    fi

    # 提取版本类型
    local version_type=$(grep "Proposed Version" "$proposal_file" | sed 's/.*(\(.*\)).*/\1/')

    # 影响分析
    echo "🔍 Running impact analysis..."
    # 调用 impact-analyzer agent

    # 兼容性检查
    echo "🔒 Running compatibility check..."
    # 调用 compatibility-checker agent

    # 生成预览
    echo "📄 Generating amendment preview..."

    # 用户确认
    read -p "Apply this amendment? (y/N): " confirm
    if [[ "$confirm" != "y" ]]; then
        echo "❌ Amendment cancelled"
        exit 0
    fi
}

# 应用修正案
apply_amendment() {
    local proposal_file="$1"
    local version_type="$2"

    # 1. 版本号更新
    local current_version=$(grep "Version" .claude/constitution/project-constitution.md | head -1 | sed 's/.*v\(.*\)/\1/')
    local new_version=$(bump_version "$current_version" "$version_type")

    echo "📈 Bumping version: v$current_version → v$new_version"

    # 2. 更新 Constitution
    # ...

    # 3. 传播变更
    echo "🔄 Propagating changes to all files..."
    propagate_constitution_changes "$new_version"

    # 4. 生成 Sync Report
    generate_sync_report "$new_version"

    # 5. Git Commit
    create_amendment_commit "$new_version"

    echo "✅ Amendment v$new_version applied successfully"
}

# 传播 Constitution 变更
propagate_constitution_changes() {
    local new_version="$1"

    # 更新模板
    for template in .claude/docs/templates/*.md; do
        sed -i '' "s/Constitution.*v[0-9.]\+/Constitution v$new_version/g" "$template"
    done

    # 更新代理
    for agent in .claude/agents/*.md; do
        sed -i '' "s/Constitution.*v[0-9.]\+/Constitution v$new_version/g" "$agent"
    done

    # 更新脚本
    # ...
}

# 验证一致性
verify_consistency() {
    echo "🔍 Verifying Constitution consistency..."

    local constitution_version=$(grep "Version" .claude/constitution/project-constitution.md | head -1 | sed 's/.*v\(.*\)/\1/')

    # 检查所有文件的版本引用
    local inconsistent_files=()

    for file in .claude/docs/templates/*.md .claude/agents/*.md; do
        if grep -q "Constitution.*v" "$file"; then
            local file_version=$(grep "Constitution.*v" "$file" | head -1 | sed 's/.*v\([0-9.]\+\).*/\1/')
            if [[ "$file_version" != "$constitution_version" ]]; then
                inconsistent_files+=("$file: v$file_version (expected v$constitution_version)")
            fi
        fi
    done

    if [[ ${#inconsistent_files[@]} -eq 0 ]]; then
        echo "✅ All files consistent with Constitution v$constitution_version"
    else
        echo "❌ Inconsistent version references found:"
        printf '%s\n' "${inconsistent_files[@]}"
        exit 1
    fi
}
```

## 输出示例

### 查看当前 Constitution

```bash
$ /flow-constitution

CC-DevFlow Project Constitution v2.0.0
======================================

Status: Active
Last Amended: 2025-01-10
Effective Date: 2025-01-10

Constitutional Articles:
------------------------

Article I: Quality First (质量至上)
  - Complete Implementation Mandate
  - Testing Mandate (≥80% coverage)
  - No Simplification Clause

Article II: Architectural Consistency (架构一致性)
  - No Code Duplication
  - Consistent Naming
  - Anti-Over-Engineering

Article III: Security First (安全优先)
  - No Hardcoded Secrets
  - Input Validation
  - Principle of Least Privilege

Article IV: Performance Accountability (性能责任)
  - No Resource Leaks
  - Algorithm Efficiency
  - Lazy Loading

Article V: Maintainability (可维护性)
  - No Dead Code
  - Separation of Concerns
  - Documentation Mandate

Article VI: Test-First Development (测试优先开发)
  - TDD Mandate (NON-NEGOTIABLE)
  - Test Independence
  - Meaningful Tests

Article VII: Simplicity Gate (简单性闸门)
  - Project Count Limit (≤3)
  - No Future-Proofing

Article VIII: Anti-Abstraction (反抽象)
  - Direct Framework Usage
  - Single Model Representation

Article IX: Integration-First Testing (集成优先测试)
  - Contract-First
  - Real Environment Testing

Article X: Requirement Boundary (需求边界)
  - Forced Clarification
  - No Speculative Features
  - User Story Independence

Use '/flow-constitution --article I' to view specific Article details.
Use '/flow-constitution --help' for more options.
```

## 最佳实践

### 1. 修正案提议流程

1. **创建提案文件**: `amendments/YYYY-MM-DD-description.md`
2. **详细影响分析**: 列出所有受影响的文件和需求
3. **社区讨论**: 至少 7 天讨论期
4. **测试修正案**: 在隔离分支测试
5. **正式应用**: 使用 `/flow-constitution --apply`

### 2. 版本选择指南

- **MAJOR (1.0 → 2.0)**:
  - 破坏性变更（删除或重命名 Article）
  - 根本性原则变更
  - 需要全代码库审计

- **MINOR (2.0 → 2.1)**:
  - 新增 Article
  - 非破坏性澄清
  - 增强执行机制

- **PATCH (2.1.0 → 2.1.1)**:
  - 修正错误
  - 更新示例
  - 文档改进

### 3. 一致性维护

- **每周运行**: `/flow-constitution --verify`
- **PR 前检查**: 确保引用最新 Constitution 版本
- **定期审计**: 每月检查 Article 执行覆盖率

## 错误处理

```bash
# 版本不一致
$ /flow-constitution --verify
❌ Error: Inconsistent Constitution versions detected
  - Constitution: v2.1.0
  - PRD_TEMPLATE.md: v2.0.0
  - planner.md: v2.0.0

Fix: Run '/flow-constitution --apply --version MINOR' to sync all files

# 缺少修正案文件
$ /flow-constitution --amend --proposal missing.md
❌ Error: Proposal file not found: missing.md

# 无效的版本类型
$ /flow-constitution --apply --version INVALID
❌ Error: Invalid version type 'INVALID'
Valid types: MAJOR, MINOR, PATCH
```

## 相关文档

- **Constitution 文档**: `.claude/constitution/project-constitution.md`
- **Amendment Process**: Constitution Section IX
- **Impact Analyzer Agent**: `.claude/agents/impact-analyzer.md`
- **Compatibility Checker Agent**: `.claude/agents/compatibility-checker.md`
- **Consistency Checker Agent**: `.claude/agents/consistency-checker.md`

## 开发状态

**Status**: 🚧 Planned (未实现)

**优先级**: P1 (High)

**依赖**:
- Constitution v2.0.0 已完成 ✅
- impact-analyzer agent 已存在 ✅
- compatibility-checker agent 已存在 ✅
- manage-constitution.sh 脚本需要创建 ⏳

**下一步**:
1. 创建 `.claude/scripts/manage-constitution.sh` 脚本
2. 实现版本号管理逻辑
3. 实现一致性传播机制
4. 添加到 `.claude/settings.json` 的 commands 部分
5. 编写集成测试
