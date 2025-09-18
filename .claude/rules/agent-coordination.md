# Agent Coordination Rules

## 概述

cc-devflow 系统中的 7 个专业子代理需要严格的协调机制来避免冲突、确保数据一致性并优化工作效率。

## 核心原则

### 1. 编排器模式
- **flow-orchestrator**: 纯编排器，使用 Task 工具调用其他代理
- **专业代理**: 独立执行专业任务，报告状态给编排器
- **并行执行**: 支持多个 dev-implementer 并行工作

### 2. 并行执行原则
- **独立工作**: 每个子代理在自己的专业领域内独立工作
- **最小依赖**: 减少子代理之间的直接依赖关系
- **异步通信**: 通过文档和状态文件进行异步通信
- **状态同步**: 所有代理向编排器报告进度和完成状态

### 2. 工作流分配
每个子代理都有明确的职责边界和工作文件模式：

```yaml
agent_workstreams:
  flow-orchestrator:
    files: [".claude/docs/requirements/*/LOG.md"]
    responsibility: "总控协调和流程管理"

  prd-writer:
    files: [".claude/docs/requirements/*/PRD.md"]
    responsibility: "产品需求文档生成"

  planner:
    files:
      - ".claude/docs/requirements/*/EPIC.md"
      - ".claude/docs/requirements/*/tasks/TASK_*.md"
      - "SPRINT.md"
    responsibility: "需求规划和任务分解"

  dev-implementer:
    files: ["src/**/*", "*.ts", "*.js", "*.json", "package.json"]
    responsibility: "代码实现和开发"

  qa-tester:
    files:
      - "tests/**/*"
      - ".claude/docs/requirements/*/TEST_REPORT.md"
    responsibility: "测试生成和质量验证"

  security-reviewer:
    files: ["SECURITY.md", "*.security"]
    responsibility: "安全审查和漏洞修复"

  release-manager:
    files: ["CHANGELOG.md", ".github/**/*"]
    responsibility: "发布管理和PR操作"
```

### 3. 文件访问协调

#### 独占访问文件
每个子代理对其专属文件具有独占写入权限：
- 其他子代理不得直接修改
- 需要修改时必须通过协调机制

#### 共享访问文件
对于需要多个子代理访问的文件，遵循以下规则：

**读取优先**:
```bash
# 检查文件是否被其他进程使用
check_file_lock() {
    local file="$1"
    if [ -f "${file}.lock" ]; then
        echo "⚠️  文件被锁定: $file"
        return 1
    fi
    return 0
}
```

**写入锁定**:
```bash
# 获取文件写入锁
acquire_file_lock() {
    local file="$1"
    local agent="$2"

    echo "$agent:$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${file}.lock"
    echo "🔒 获取文件锁: $file ($agent)"
}

# 释放文件写入锁
release_file_lock() {
    local file="$1"
    rm -f "${file}.lock"
    echo "🔓 释放文件锁: $file"
}
```

### 4. 子代理间通信

#### 状态文件通信
使用状态文件进行子代理间的状态同步：

```yaml
# .claude/docs/requirements/REQ-123/status.yml
workflow_status:
  current_stage: "development"
  completed_stages: ["planning", "prd"]
  active_agents: ["dev-implementer", "qa-tester"]

agent_status:
  prd-writer:
    status: "completed"
    output_files: ["PRD.md"]
    completion_time: "2024-01-24T10:30:00Z"

  planner:
    status: "completed"
    output_files: ["EPIC.md", "tasks/TASK_001.md", "tasks/TASK_002.md"]
    completion_time: "2024-01-24T11:15:00Z"

  dev-implementer:
    status: "in_progress"
    current_task: "TASK_001"
    progress: "60%"

  qa-tester:
    status: "waiting"
    depends_on: ["dev-implementer"]
```

#### 进度报告
每个子代理完成工作后必须更新进度文件：

```bash
# 更新子代理状态
update_agent_status() {
    local req_id="$1"
    local agent="$2"
    local status="$3"
    local output_files="$4"

    local status_file=".claude/docs/requirements/${req_id}/status.yml"
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    # 更新状态文件
    yq eval ".agent_status.${agent}.status = \"${status}\"" -i "$status_file"
    yq eval ".agent_status.${agent}.completion_time = \"${timestamp}\"" -i "$status_file"
    yq eval ".agent_status.${agent}.output_files = [${output_files}]" -i "$status_file"

    echo "📊 状态已更新: $agent -> $status"
}
```

#### 依赖关系管理
定义子代理之间的依赖关系：

```yaml
# .claude/rules/agent-dependencies.yml
dependencies:
  prd-writer:
    depends_on: []
    blocks: ["planner"]

  planner:
    depends_on: ["prd-writer"]
    blocks: ["dev-implementer", "qa-tester"]

  dev-implementer:
    depends_on: ["planner"]
    blocks: ["security-reviewer", "release-manager"]

  qa-tester:
    depends_on: ["dev-implementer"]
    blocks: ["release-manager"]

  security-reviewer:
    depends_on: ["dev-implementer"]
    blocks: ["release-manager"]

  release-manager:
    depends_on: ["qa-tester", "security-reviewer"]
    blocks: []
```

### 5. 冲突处理

#### 文件冲突检测
```bash
# 检测文件冲突
detect_file_conflicts() {
    local req_id="$1"
    local conflicts=()

    # 检查是否有多个代理试图修改同一文件
    for file in .claude/docs/requirements/${req_id}/*.md; do
        local locks=$(find "${file%.*}*.lock" 2>/dev/null | wc -l)
        if [ "$locks" -gt 1 ]; then
            conflicts+=("$file")
        fi
    done

    if [ ${#conflicts[@]} -gt 0 ]; then
        echo "❌ 检测到文件冲突:"
        printf '  - %s\n' "${conflicts[@]}"
        return 1
    fi

    return 0
}
```

#### 冲突解决策略
1. **自动解决**: 简单冲突通过合并策略自动解决
2. **人工介入**: 复杂冲突总是由人工解决
3. **回滚机制**: 严重冲突时回滚到最后一个稳定状态

```bash
# 冲突解决
resolve_conflicts() {
    local req_id="$1"

    echo "🔧 开始冲突解决流程..."

    # 1. 停止所有相关子代理
    stop_agents_for_requirement "$req_id"

    # 2. 创建备份
    backup_requirement_files "$req_id"

    # 3. 标记需要人工干预
    echo "❌ 需要人工解决冲突，请检查并手动合并文件"
    echo "   备份位置: .claude/docs/requirements/${req_id}/.backup/"

    # 4. 生成冲突报告
    generate_conflict_report "$req_id"
}
```

### 6. 同步策略

#### 检查点同步
在关键节点进行同步检查：

```bash
# 检查点同步
checkpoint_sync() {
    local req_id="$1"
    local checkpoint="$2"

    echo "📍 检查点同步: $checkpoint"

    # 等待所有活跃代理完成当前任务
    wait_for_agents_completion "$req_id"

    # 验证输出文件完整性
    validate_output_files "$req_id" "$checkpoint"

    # 更新全局状态
    update_workflow_status "$req_id" "$checkpoint"

    echo "✅ 检查点 $checkpoint 同步完成"
}
```

#### 定期状态同步
```bash
# 定期状态同步 (每5分钟)
periodic_sync() {
    local req_id="$1"

    while [ -f ".claude/docs/requirements/${req_id}/.active" ]; do
        # 收集所有子代理状态
        collect_agent_states "$req_id"

        # 检测潜在冲突
        detect_potential_conflicts "$req_id"

        # 更新整体进度
        update_overall_progress "$req_id"

        sleep 300  # 5分钟
    done
}
```

## 最佳实践

### 1. 失败快速原则
- 一旦检测到冲突或错误，立即停止并报告
- 不要试图自动修复复杂问题
- 保留所有状态信息用于调试

### 2. 状态透明性
- 所有子代理状态都应该可见和可查询
- 提供实时进度反馈
- 记录所有重要决策和状态变化

### 3. 原子性操作
- 每个子代理的操作都应该是原子性的
- 要么完全成功，要么完全回滚
- 避免中间状态的不一致

### 4. 通信频率
- 在重要状态变化时立即通信
- 定期发送心跳信号
- 在完成任务时发送确认信号

## 示例工作流程

```bash
# 完整的协调流程示例
coordinate_requirement_flow() {
    local req_id="$1"

    echo "🚀 启动需求流程协调: $req_id"

    # 1. 初始化协调环境
    setup_coordination_environment "$req_id"

    # 2. 按依赖关系启动子代理
    start_agent "prd-writer" "$req_id"
    wait_for_agent_completion "prd-writer" "$req_id"

    checkpoint_sync "$req_id" "prd-completed"

    start_agent "planner" "$req_id"
    wait_for_agent_completion "planner" "$req_id"

    checkpoint_sync "$req_id" "planning-completed"

    # 3. 并行启动开发相关子代理
    start_agent "dev-implementer" "$req_id" &
    start_agent "qa-tester" "$req_id" &

    # 4. 监控和协调
    monitor_parallel_execution "$req_id" "dev-implementer" "qa-tester"

    # 5. 最终阶段
    start_agent "security-reviewer" "$req_id"
    start_agent "release-manager" "$req_id"

    echo "✅ 需求流程协调完成: $req_id"
}
```

## 监控和调试

### 状态查询
```bash
# 查询子代理状态
query_agent_status() {
    local req_id="$1"
    local agent="${2:-all}"

    if [ "$agent" = "all" ]; then
        yq eval '.agent_status' ".claude/docs/requirements/${req_id}/status.yml"
    else
        yq eval ".agent_status.${agent}" ".claude/docs/requirements/${req_id}/status.yml"
    fi
}
```

### 调试工具
```bash
# 生成协调报告
generate_coordination_report() {
    local req_id="$1"
    local report_file=".claude/docs/requirements/${req_id}/coordination-report.md"

    cat > "$report_file" << EOF
# 子代理协调报告

## 基本信息
- 需求ID: $req_id
- 生成时间: $(date -u +%Y-%m-%dT%H:%M:%SZ)

## 子代理状态
$(yq eval '.agent_status' ".claude/docs/requirements/${req_id}/status.yml")

## 文件锁状态
$(find ".claude/docs/requirements/${req_id}" -name "*.lock" -exec ls -la {} \;)

## 潜在问题
$(detect_potential_issues "$req_id")
EOF

    echo "📋 协调报告已生成: $report_file"
}
```

## 编排器模式状态协议

### 编排器状态管理
flow-orchestrator 维护整体编排状态：

```json
// .claude/docs/requirements/${reqId}/orchestration_status.json
{
  "reqId": "${reqId}",
  "currentPhase": "development",
  "startTime": "2024-01-15T10:30:00Z",
  "phaseStatus": {
    "research": "completed",
    "prd": "completed",
    "planning": "completed",
    "development": "in_progress",
    "testing": "pending",
    "security": "pending",
    "release": "pending"
  },
  "activeAgents": [
    {"agent": "dev-implementer", "taskId": "TASK_001", "status": "running", "startTime": "..."},
    {"agent": "dev-implementer", "taskId": "TASK_002", "status": "running", "startTime": "..."}
  ],
  "completedTasks": ["TASK_003"],
  "failedTasks": [],
  "nextActions": ["wait_for_TASK_001", "wait_for_TASK_002"]
}
```

### 任务级状态跟踪
每个 dev-implementer 维护任务状态：

```json
// .claude/docs/requirements/${reqId}/tasks/${taskId}_status.json
{
  "taskId": "${taskId}",
  "reqId": "${reqId}",
  "status": "completed",
  "startTime": "2024-01-15T10:30:00Z",
  "endTime": "2024-01-15T11:15:00Z",
  "agent": "dev-implementer",
  "phase": "completed",
  "filesChanged": ["src/components/UserOrder.tsx", "src/api/orders.ts"],
  "testsRun": true,
  "qualityGatePassed": true,
  "commitHash": "abc123..."
}
```

### 完成标记文件
成功完成的任务创建完成标记：

```bash
# .claude/docs/requirements/${reqId}/tasks/${taskId}.completed
2024-01-15T11:15:00Z
Summary: Implemented user order creation with validation
Files: src/components/UserOrder.tsx, src/api/orders.ts
Tests: 5 new tests added, all passing
Quality: TypeScript + ESLint + Security scan passed
```

### 并行监控协议
编排器监控并行执行：

1. **启动阶段**: 创建 orchestration_status.json
2. **并行启动**: 通过 Task 工具启动多个 dev-implementer
3. **监控循环**: 定期检查任务状态文件和完成标记
4. **同步等待**: 等待所有任务完成后进入下一阶段
5. **错误处理**: 任何任务失败时暂停并报告

### Agent 通信规范
- **输入**: 通过 Task 工具的 prompt 参数传递
- **输出**: 生成指定的文件和状态文件
- **状态**: 更新自己的状态文件，创建完成标记
- **错误**: 在状态文件中记录错误详情

---

**重要提醒**: 子代理协调是确保 cc-devflow 系统稳定运行的关键。所有子代理都必须严格遵循这些协调规则，特别是新的编排器模式下的状态同步协议。
