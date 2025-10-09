---
name: flow-restart
description: Restart interrupted cc-devflow requirement development. Usage: /flow-restart "REQ-ID" [--from=STAGE]
---

# flow-restart - 中断恢复命令

## 命令格式
```text
/flow-restart "REQ_ID" [OPTIONS]
```

### 参数说明
- **REQ_ID**: 需求编号 (必填，格式: REQ-\d+)
- **--from=STAGE**: 从指定阶段重新开始 (可选)
- **--force**: 强制重启，忽略状态检查 (可选)
- **--backup**: 在重启前备份当前状态 (可选)

### 示例
```text
/flow-restart "REQ-123"                    # 从中断点自动恢复
/flow-restart "REQ-123" --from=prd         # 从PRD阶段重新开始
/flow-restart "REQ-123" --from=development # 从开发阶段重新开始
/flow-restart "REQ-123" --force --backup   # 强制重启并备份
/flow-restart "REQ-124" --from=testing     # 从测试阶段重新开始
```

## 可重启阶段

### 阶段标识符
```yaml
restart_stages:
  research: "研究阶段 - 重新获取计划文档"
  prd: "PRD阶段 - 重新生成产品需求文档"
  planning: "规划阶段 - 重新创建Epic和Tasks"
  development: "开发阶段 - 重新开始代码实现"
  testing: "测试阶段 - 重新执行测试流程"
  security: "安全审查阶段 - 重新进行安全扫描"
  review: "代码审查阶段 - 重新创建PR"
  merge: "合并阶段 - 重新执行合并流程"
```

### 自动检测逻辑
```python
def detect_restart_stage(req_id):
    """自动检测适合的重启阶段"""
    req_dir = f"devflow/requirements/{req_id}"

    # 检查文档完成状态
    if not os.path.exists(f"{req_dir}/PRD.md"):
        return "prd"
    elif not os.path.exists(f"{req_dir}/EPIC.md"):
        return "planning"
    elif not os.path.exists(f"{req_dir}/tasks"):
        return "planning"
    elif has_incomplete_tasks(req_dir):
        return "development"
    elif not has_test_coverage(req_id):
        return "testing"
    elif has_security_issues(req_id):
        return "security"
    elif not has_active_pr(req_id):
        return "review"
    else:
        return "merge"
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/core-patterns.md):
   - Fail Fast: 前置条件验证失败立即停止
   - Clear Errors: 明确的中断原因和恢复建议
   - Minimal Output: 简洁的恢复进度输出
   - Structured Output: 结构化的恢复日志

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 更新 orchestration_status.json 恢复状态
   - 创建 .restart 恢复标记
   - 协调多个子代理重新执行

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 使用 ISO 8601 UTC 时间戳
   - 记录中断时间、恢复时间
   - 支持时区感知的恢复跟踪

4. **DevFlow Patterns** (.claude/rules/devflow-conventions.md):
   - 强制 REQ-ID 格式验证
   - 使用标准化恢复模板
   - 一致的状态恢复方法
   - 可追溯性链接（中断 → 恢复 → 完成）

## Constitution Compliance

本命令强制执行 CC-DevFlow Constitution (.claude/constitution/project-constitution.md) 原则：

### 恢复前验证
- **Quality First**: 确保恢复不丢失已完成的工作
- **Security First**: 验证备份数据的安全性

### 恢复过程检查
1. **NO PARTIAL RECOVERY**: 完整恢复或明确标记部分恢复
2. **NO DATA LOSS**: 备份所有现有数据再清理
3. **NO CODE DUPLICATION**: 恢复代码遵循现有模式
4. **NO HARDCODED SECRETS**: 不在恢复日志中暴露机密
5. **NO RESOURCE LEAKS**: 清理中断遗留的资源

### 恢复后验证
- **状态一致性**: 确保恢复后状态与预期一致
- **文档完整性**: 验证所有文档正确恢复
- **Git 状态**: 确保 Git 仓库状态干净

## Prerequisites Validation

恢复前，必须验证前置条件（Fail Fast 原则）：

```bash
# 设置需求 ID 环境变量
export DEVFLOW_REQ_ID="${reqId}"

# 运行前置条件检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - REQ-ID 格式验证 (REQ-\d+)
# - 需求目录存在性检查
# - Git 仓库状态验证
# - 中断点文档完整性验证
# - 备份数据有效性检查（如果 --backup）
```

**如果前置检查失败，立即停止（Fail Fast），不进行后续恢复。**

## 执行流程

### 1. 验证和准备阶段
```bash
# 1.1 执行前置条件验证（见 Prerequisites Validation 章节）
run_prerequisites_validation()

# 1.2 参数验证
validate_req_id_format()
check_project_directory()
verify_git_repository()

# 1.3 状态检查
check_existing_requirement()
analyze_current_state()
detect_restart_point()

# 1.4 备份处理
if [ "$BACKUP" = true ]; then
    create_state_backup()
fi
```

### 2. 状态分析
分析需求当前状态：
- 读取 `EXECUTION_LOG.md` 确定上次中断点
- 检查Git分支状态和提交历史
- 验证文档完整性
- 评估代码实现进度

### 3. 清理和重置
根据重启阶段清理相关文件：
```yaml
cleanup_actions:
  research:
    - 删除 devflow/requirements/${reqId}/research/ 目录下的临时文件
    - 清理过期的网络抓取缓存

  prd:
    - 备份现有 PRD.md (如果存在)
    - 重置PRD相关状态标记

  planning:
    - 备份现有 EPIC.md 和 tasks/
    - 清理任务规划缓存

  development:
    - 检查未提交的代码更改
    - 创建代码状态快照
    - 重置开发进度标记

  testing:
    - 清理测试报告和覆盖率数据
    - 重置测试状态标记

  security:
    - 清理安全扫描结果
    - 重置安全审查状态

  review:
    - 关闭现有PR (如果存在)
    - 清理代码审查状态

  merge:
    - 检查合并冲突
    - 准备重新合并流程
```

### 4. 状态恢复
根据重启阶段恢复到指定状态：
- 更新 `EXECUTION_LOG.md` 记录重启操作
- 设置适当的状态标记
- 准备后续阶段的输入数据

### 5. 流程重启
根据 flow-orchestrator 工作流指导文档，主代理从指定阶段继续执行：

#### 5.1 阶段重启策略
```yaml
restart_strategies:
  research:
    - 清理research目录
    - 重新抓取计划文档
    - 调用 prd-writer 重新开始

  prd:
    - 备份现有PRD.md
    - Task: prd-writer "重新生成产品需求文档"
    - 继续后续流程

  planning:
    - 保留PRD.md
    - Task: planner "重新生成EPIC和任务分解"
    - 继续后续流程

  development:
    - 保留所有计划文档（PRD.md, EPIC.md, tasks/）
    - 主代理直接基于详细的 TASK 文档重新执行代码实现

  testing:
    - 保留代码和实现
    - Task: qa-tester "重新生成测试计划和执行测试"
    - 主代理重新执行测试
```

#### 5.2 执行序列
根据重启阶段，主代理按工作流指导执行相应的子代理调用和实际工作。

## 错误处理和恢复

### 常见中断场景
1. **网络连接中断**
   - 重新获取外部文档
   - 验证已缓存内容的完整性
   - 恢复WebFetch操作

2. **工具依赖问题**
   - 检查npm/yarn环境
   - 验证TypeScript配置
   - 重新安装缺失依赖

3. **Git操作冲突**
   - 解决合并冲突
   - 清理损坏的分支状态
   - 重建工作树

4. **子代理异常**
   - 分析代理执行日志
   - 清理损坏的中间状态
   - 重新初始化代理上下文

5. **权限和配置问题**
   - 验证GitHub认证状态
   - 检查文件系统权限
   - 重新配置MCP服务器

### 状态验证机制
```python
def validate_restart_prerequisites(req_id, restart_stage):
    """验证重启前提条件"""

    validations = {
        'git_status': check_git_clean_state,
        'branch_exists': lambda: check_feature_branch_exists(req_id),
        'docs_integrity': lambda: validate_document_structure(req_id),
        'dependencies': check_project_dependencies,
        'permissions': check_file_permissions,
        'mcp_servers': check_mcp_server_health
    }

    failures = []
    for check_name, check_func in validations.items():
        try:
            if not check_func():
                failures.append(check_name)
        except Exception as e:
            failures.append(f"{check_name}: {e}")

    return failures
```

## 数据保护和备份

### 自动备份策略
```bash
create_restart_backup() {
    local req_id=$1
    local timestamp=$(date -u +"%Y%m%d_%H%M%S")
    local backup_dir=".claude/backups/restart_${req_id}_${timestamp}"

    mkdir -p "$backup_dir"

    # 备份需求文档
    if [ -d "devflow/requirements/$req_id" ]; then
        cp -r "devflow/requirements/$req_id" "$backup_dir/documents/"
    fi

    # 备份Git状态
    git stash push -m "restart-backup-$req_id-$timestamp" --include-untracked || true
    echo "stash:$(git stash list | head -1 | cut -d: -f1)" > "$backup_dir/git_state.txt"
    git log --oneline -10 > "$backup_dir/git_history.txt"

    # 备份配置和缓存
    [ -d ".claude/cache" ] && cp -r ".claude/cache" "$backup_dir/"

    # 创建恢复脚本
    cat > "$backup_dir/restore.sh" << EOF
#!/bin/bash
# 恢复脚本 - 生成于 $timestamp

echo "恢复 $req_id 的备份状态..."

# 恢复文档
cp -r "$backup_dir/documents/$req_id" "devflow/requirements/"

# 恢复Git状态
if [ -f "$backup_dir/git_state.txt" ]; then
    stash_ref=\$(cat "$backup_dir/git_state.txt" | cut -d: -f2)
    git stash apply "\$stash_ref" || echo "警告: Git stash 恢复失败"
fi

echo "备份恢复完成"
EOF

    chmod +x "$backup_dir/restore.sh"
    echo "备份创建完成: $backup_dir"
}
```

### 增量备份
```python
def create_incremental_backup(req_id, stage):
    """创建增量备份，只备份变更的文件"""

    backup_manifest = load_backup_manifest(req_id)
    current_files = scan_requirement_files(req_id)

    changed_files = []
    for file_path, file_hash in current_files.items():
        if file_path not in backup_manifest or backup_manifest[file_path] != file_hash:
            changed_files.append(file_path)

    if changed_files:
        backup_dir = create_backup_directory(req_id, stage)
        for file_path in changed_files:
            backup_file(file_path, backup_dir)

        update_backup_manifest(req_id, current_files)
        log_backup_operation(req_id, stage, changed_files)
```

## 进度恢复算法

### 智能恢复点检测
```python
def determine_optimal_restart_point(req_id):
    """确定最优的重启点"""

    log_analysis = analyze_execution_log(req_id)
    git_analysis = analyze_git_history(req_id)
    docs_analysis = analyze_document_state(req_id)

    # 综合分析确定重启点
    if log_analysis['last_successful_stage']:
        restart_stage = log_analysis['last_successful_stage']
    elif git_analysis['last_commit_stage']:
        restart_stage = git_analysis['last_commit_stage']
    elif docs_analysis['completed_documents']:
        restart_stage = infer_stage_from_documents(docs_analysis['completed_documents'])
    else:
        restart_stage = 'research'  # 默认从头开始

    # 验证重启点的可行性
    if not validate_restart_feasibility(req_id, restart_stage):
        restart_stage = find_fallback_stage(req_id, restart_stage)

    return restart_stage

def calculate_recovery_effort(req_id, from_stage, to_stage):
    """计算恢复所需的工作量"""

    stage_weights = {
        'research': 10,
        'prd': 20,
        'planning': 15,
        'development': 40,
        'testing': 10,
        'security': 3,
        'review': 2
    }

    stage_order = list(stage_weights.keys())
    from_index = stage_order.index(from_stage)
    to_index = stage_order.index(to_stage)

    if to_index <= from_index:
        return 0  # 无需恢复

    recovery_weight = sum(stage_weights[stage]
                         for stage in stage_order[from_index:to_index])

    return recovery_weight
```

### 依赖关系处理
```yaml
stage_dependencies:
  prd:
    requires: [research]
    invalidates: [planning, development, testing, security, review]

  planning:
    requires: [prd]
    invalidates: [development, testing, security, review]

  development:
    requires: [planning]
    invalidates: [testing, security, review]

  testing:
    requires: [development]
    invalidates: [security, review]

  security:
    requires: [testing]
    invalidates: [review]

  review:
    requires: [security]
    invalidates: []
```

## 监控和日志

### 重启操作审计
```yaml
---
operation: flow_restart
req_id: REQ-123
timestamp: 2024-01-15T10:30:00Z
user: developer
restart_from: development
restart_reason: network_interruption
backup_created: true
backup_location: .claude/backups/restart_REQ-123_20240115_103000
---

# 重启操作记录

## 中断分析
- 中断时间: 2024-01-15 08:45:00 UTC
- 中断阶段: development (TASK_003 执行中)
- 中断原因: 网络连接超时导致依赖安装失败
- 完成进度: 65%

## 恢复操作
- 重启时间: 2024-01-15 10:30:00 UTC
- 重启阶段: development
- 备份状态: 已创建 (18 个文件)
- 清理操作: 删除损坏的node_modules，重置npm缓存

## 数据保护
- 未提交代码: 已保存到Git stash
- 文档状态: 无变更
- 配置文件: 无变更

## 预期影响
- 丢失进度: 约1小时工作量
- 重复操作: npm install, 部分代码实现
- 预计延迟: 30分钟
```

### 性能监控
```python
class RestartMetrics:
    def __init__(self):
        self.start_time = None
        self.stage_times = {}
        self.errors = []
        self.recovery_success_rate = 0.0

    def start_restart(self, req_id, stage):
        self.start_time = datetime.now()
        self.req_id = req_id
        self.restart_stage = stage

    def record_stage_completion(self, stage):
        if stage not in self.stage_times:
            self.stage_times[stage] = datetime.now()

    def record_error(self, error_type, error_message):
        self.errors.append({
            'timestamp': datetime.now().isoformat(),
            'type': error_type,
            'message': error_message
        })

    def calculate_metrics(self):
        total_time = datetime.now() - self.start_time
        return {
            'total_restart_time': total_time.total_seconds(),
            'stage_breakdown': self.stage_times,
            'error_count': len(self.errors),
            'success_rate': self.recovery_success_rate
        }
```

## 配置和自定义

### 重启策略配置
```json
{
  "flowRestart": {
    "autoBackup": true,
    "backupRetentionDays": 30,
    "maxBackupSize": "100MB",
    "restartStrategies": {
      "network_failure": {
        "defaultStage": "auto_detect",
        "retryAttempts": 3,
        "clearCache": true
      },
      "dependency_error": {
        "defaultStage": "development",
        "cleanNodeModules": true,
        "reinstallDeps": true
      },
      "git_conflict": {
        "defaultStage": "auto_detect",
        "createConflictBranch": true,
        "preserveChanges": true
      }
    },
    "validation": {
      "strictMode": false,
      "skipChecks": [],
      "customValidators": []
    }
  }
}
```

### 环境变量
```bash
# 重启行为配置
export FLOW_RESTART_AUTO_BACKUP=true
export FLOW_RESTART_BACKUP_DIR=".claude/backups"
export FLOW_RESTART_MAX_RETRIES=3
export FLOW_RESTART_CLEANUP_STRATEGY="conservative"

# 验证和安全
export FLOW_RESTART_STRICT_VALIDATION=false
export FLOW_RESTART_REQUIRE_CONFIRMATION=true
export FLOW_RESTART_PRESERVE_STASH=true

# 性能调优
export FLOW_RESTART_PARALLEL_CLEANUP=true
export FLOW_RESTART_INCREMENTAL_BACKUP=true
export FLOW_RESTART_CACHE_VALIDATION=true
```

## 最佳实践

### 重启前检查清单
```markdown
## 重启前检查清单

- [ ] 确认中断原因已解决
- [ ] 检查网络连接稳定性
- [ ] 验证工具依赖完整性
- [ ] 确保有足够磁盘空间
- [ ] 检查Git仓库状态健康
- [ ] 确认备份策略适当
- [ ] 评估重启影响范围
- [ ] 通知相关团队成员
```

### 故障排除指南
```bash
# 常见问题诊断
/flow-restart "REQ-123" --validate        # 验证重启条件
/flow-restart "REQ-123" --dry-run         # 模拟重启过程
/flow-restart "REQ-123" --debug           # 启用调试输出

# 强制重启（谨慎使用）
/flow-restart "REQ-123" --force --from=research

# 恢复备份
cd .claude/backups/restart_REQ-123_[timestamp]
./restore.sh
```

---

**重要提示**: flow-restart 是一个有破坏性的操作，会重置部分开发进度。使用前请确保理解其影响，并在必要时创建备份。对于简单的问题，建议先尝试手动修复而不是完全重启。
