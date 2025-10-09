---
name: flow-update
description: Update task development progress for cc-devflow requirements. Usage: /flow-update "REQ-ID" "TASK-ID" [OPTIONS]
---

# flow-update - 任务进度更新命令

## 命令格式
```text
/flow-update "REQ_ID" "TASK_ID" [OPTIONS]
```

### 参数说明
- **REQ_ID**: 需求编号 (格式: REQ-\d+)
- **TASK_ID**: 任务编号 (格式: TASK_\d+)
- **OPTIONS**: 可选参数，控制更新行为

### 选项标志
- `--status=STATUS`: 设置任务状态 (planning|in_progress|review|completed|blocked)
- `--progress=N`: 设置完成进度百分比 (0-100)
- `--estimate=N`: 更新剩余工作量估算 (小时)
- `--comment="TEXT"`: 添加进度注释
- `--auto`: 自动检测和更新进度
- `--commit`: 提交当前进度到Git
- `--test`: 运行相关测试并更新测试状态

### 示例
```text
/flow-update "REQ-123" "TASK_001" --status=completed       # 标记任务完成
/flow-update "REQ-123" "TASK_002" --progress=75             # 更新进度到75%
/flow-update "REQ-123" "TASK_003" --status=blocked --comment="等待API文档"
/flow-update "REQ-124" "TASK_001" --auto --commit          # 自动检测并提交
/flow-update "REQ-123" "TASK_002" --test --progress=90     # 运行测试并更新进度
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/core-patterns.md):
   - Fail Fast: 参数验证和前置条件检查失败立即停止
   - Clear Errors: 明确的错误提示和修复建议
   - Minimal Output: 简洁的进度更新确认
   - Structured Output: 结构化的进度报告和分析

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 更新 orchestration_status.json 状态文件
   - 创建任务 .completed 标记
   - 与 qa-tester 协调测试状态更新

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 使用 ISO 8601 UTC 时间戳
   - 记录任务开始、更新、完成时间
   - 支持时区感知的时间跟踪

4. **DevFlow Patterns** (.claude/rules/devflow-conventions.md):
   - 强制 REQ-ID 和 TASK-ID 格式验证
   - 使用标准化进度跟踪模板
   - 一致的进度评分方法
   - 可追溯性链接（Task → Code → Test）

## Constitution Compliance

本命令强制执行 CC-DevFlow Constitution (.claude/constitution/project-constitution.md) 原则：

### 执行前验证
- **Quality First**: 进度更新必须基于真实完成度
- **NO PARTIAL IMPLEMENTATION**: 检测部分实现并明确标记

### 更新过程检查
1. **代码质量验证**: 已完成代码通过质量检查
2. **测试覆盖检查**: 完成度 ≥ 80% 时必须有测试覆盖
3. **NO CODE DUPLICATION**: 代码变更遵循现有模式
4. **NO HARDCODED SECRETS**: 检测并阻止硬编码机密
5. **NO RESOURCE LEAKS**: 资源正确管理和释放
6. **NO DEAD CODE**: 检测调试代码和无用注释

### 更新后验证
- **质量门禁**: 100% 完成时必须通过所有质量检查
- **文档一致性**: 确保文档与代码同步更新
- **可追溯性**: 保持任务和代码的双向可追溯

## Prerequisites Validation

进度更新前，必须验证前置条件（Fail Fast 原则）：

```bash
# 设置需求 ID 环境变量
export DEVFLOW_REQ_ID="${reqId}"

# 运行前置条件检查
bash .claude/scripts/check-prerequisites.sh --json

# 验证项:
# - REQ-ID 格式验证 (REQ-\d+)
# - TASK-ID 格式验证 (TASK_\d+)
# - 需求目录结构检查
# - 任务文件存在性验证
# - Git 仓库状态验证
# - 开发分支检查 (feature/REQ-*)
```

**如果前置检查失败，立即停止（Fail Fast），不进行后续更新。**

## 执行流程

### 1. 参数验证和环境检查
```bash
# 1.1 执行前置条件验证（见 Prerequisites Validation 章节）
run_prerequisites_validation()

# 1.2 验证参数格式
validate_req_id_format()
validate_task_id_format()
validate_status_enum()
validate_progress_range()

# 1.3 检查文件存在性
check_requirement_exists()
check_task_file_exists()
check_implementation_plan()

# 1.4 Git状态检查
verify_feature_branch()
check_working_directory_clean()
```

### 2. 任务状态检测和分析

#### 2.1 自动进度检测 (--auto)
```python
def auto_detect_progress(req_id, task_id):
    """自动检测任务进度"""

    # 分析代码变更
    code_analysis = analyze_code_changes(req_id, task_id)

    # 检查测试覆盖
    test_coverage = check_test_coverage(req_id, task_id)

    # 分析实现计划完成度
    plan_completion = check_implementation_plan_progress(req_id, task_id)

    # 综合计算进度
    progress = calculate_weighted_progress({
        'code_implementation': code_analysis['completion'] * 0.6,
        'test_coverage': test_coverage['percentage'] * 0.3,
        'plan_adherence': plan_completion['score'] * 0.1
    })

    return {
        'progress': progress,
        'status': infer_status_from_progress(progress),
        'details': {
            'code': code_analysis,
            'tests': test_coverage,
            'plan': plan_completion
        }
    }
```

#### 2.2 代码变更分析
```python
def analyze_code_changes(req_id, task_id):
    """分析与任务相关的代码变更"""

    # 读取实现计划
    impl_plan = read_implementation_plan(req_id)
    task_files = extract_task_files(impl_plan, task_id)

    changes = {
        'files_modified': 0,
        'lines_added': 0,
        'lines_deleted': 0,
        'functions_implemented': 0,
        'completion_percentage': 0
    }

    for file_path in task_files:
        if file_exists(file_path):
            changes['files_modified'] += 1
            git_stats = get_file_git_stats(file_path)
            changes['lines_added'] += git_stats['additions']
            changes['lines_deleted'] += git_stats['deletions']

            # 分析函数实现度
            planned_functions = extract_planned_functions(impl_plan, task_id, file_path)
            implemented_functions = analyze_implemented_functions(file_path)

            completion = calculate_function_completion(planned_functions, implemented_functions)
            changes['functions_implemented'] += completion['completed']

    # 计算整体完成度
    changes['completion_percentage'] = calculate_task_completion(changes, task_files)

    return changes
```

### 3. 状态更新机制

#### 3.1 任务状态文件更新
```yaml
# devflow/requirements/${reqId}/orchestration_status.json (标准化状态文件)
{
  "reqId": "REQ-123",
  "overallProgress": 75,
  "tasks": {
    "TASK_001": {
      "taskId": "TASK_001",
      "title": "用户模型设计",
      "status": "in_progress",
      "progress": 75,
      "estimatedHours": 8,
      "actualHours": 6,
      "remainingHours": 2,
      "lastUpdated": "2024-01-15T14:30:00Z",
      "updatedBy": "main_agent",
      "updateMethod": "auto_detection",
      "milestones": [
        {
          "timestamp": "2024-01-15T10:00:00Z",
          "status": "planning",
          "progress": 0,
          "comment": "任务开始"
        },
        {
          "timestamp": "2024-01-15T12:30:00Z",
          "status": "in_progress",
          "progress": 40,
          "comment": "完成数据模型设计"
        },
        {
          "timestamp": "2024-01-15T14:30:00Z",
          "status": "in_progress",
          "progress": 75,
          "comment": "API接口实现完成"
        }
      ],
      "codeMetrics": {
        "filesModified": 3,
        "linesAdded": 156,
        "functionsImplemented": 5,
        "testCoverage": 85
      },
      "blockers": [],
      "nextSteps": ["完成单元测试", "更新文档"]
    }
  }
}
```

#### 3.2 需求级别状态聚合
```python
def update_requirement_status(req_id):
    """根据任务状态更新需求级别状态"""

    tasks = load_all_task_status(req_id)

    # 计算需求整体进度
    total_progress = sum(task['progress'] for task in tasks) / len(tasks)

    # 确定需求状态
    req_status = determine_requirement_status(tasks)

    # 更新需求状态文件
    update_requirement_status_file(req_id, {
        'overallProgress': total_progress,
        'status': req_status,
        'completedTasks': len([t for t in tasks if t['status'] == 'completed']),
        'totalTasks': len(tasks),
        'lastUpdated': datetime.now().isoformat(),
        'nextMilestone': calculate_next_milestone(tasks)
    })
```

### 4. 测试集成和质量检查

#### 4.1 自动测试执行 (--test)
```python
def run_task_tests(req_id, task_id):
    """运行与任务相关的测试"""

    # 读取测试计划 (qa-tester 子代理输出)
    test_plan = read_test_plan(req_id)
    task_tests = extract_task_tests(test_plan, task_id)

    results = {
        'total_tests': 0,
        'passed_tests': 0,
        'failed_tests': 0,
        'coverage_percentage': 0,
        'test_details': []
    }

    for test_spec in task_tests:
        # 主代理执行测试
        test_result = execute_test(test_spec)
        results['test_details'].append(test_result)

        if test_result['status'] == 'passed':
            results['passed_tests'] += 1
        else:
            results['failed_tests'] += 1

        results['total_tests'] += 1

    # 计算覆盖率
    results['coverage_percentage'] = calculate_test_coverage(req_id, task_id)

    return results
```

#### 4.2 质量门禁检查
```python
def check_quality_gates(req_id, task_id):
    """检查任务是否满足质量要求"""

    gates = {
        'code_quality': check_code_quality(req_id, task_id),
        'test_coverage': check_test_coverage_threshold(req_id, task_id),
        'security_scan': run_security_scan(req_id, task_id),
        'performance': check_performance_requirements(req_id, task_id)
    }

    all_passed = all(gate['passed'] for gate in gates.values())

    return {
        'all_gates_passed': all_passed,
        'gate_results': gates,
        'blocking_issues': [
            gate_name for gate_name, gate_result in gates.items()
            if not gate_result['passed']
        ]
    }
```

### 5. Git集成和提交管理

#### 5.1 智能提交 (--commit)
```bash
# 自动生成提交信息
generate_commit_message() {
    local req_id=$1
    local task_id=$2
    local progress=$3
    local status=$4

    # 分析代码变更
    local files_changed=$(git diff --name-only | wc -l)
    local lines_changed=$(git diff --shortstat | grep -o '[0-9]\+ insertions\|[0-9]\+ deletions')

    # 生成标准提交信息
    case $status in
        "completed")
            echo "feat(${req_id}): complete ${task_id} - $(get_task_title $req_id $task_id)"
            ;;
        "in_progress")
            echo "feat(${req_id}): progress ${task_id} to ${progress}% - $(get_current_milestone $req_id $task_id)"
            ;;
        "blocked")
            echo "wip(${req_id}): block ${task_id} - $(get_blocking_reason $req_id $task_id)"
            ;;
    esac
}

# 执行提交
smart_commit() {
    local req_id=$1
    local task_id=$2

    # 检查是否有变更
    if ! git diff --quiet; then
        # 暂存相关文件
        git add $(get_task_related_files $req_id $task_id)

        # 生成提交信息
        local commit_msg=$(generate_commit_message $req_id $task_id)

        # 执行提交
        git commit -m "$commit_msg

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

        echo "✅ 已提交任务进度: $commit_msg"
    else
        echo "ℹ️  没有检测到代码变更"
    fi
}
```

## 输出格式

### 简要更新确认
```text
✅ 任务进度已更新

📋 REQ-123 > TASK_002: 订单API开发
┌─────────────┬─────────────┬─────────────┐
│ 属性        │ 更新前      │ 更新后      │
├─────────────┼─────────────┼─────────────┤
│ 状态        │ in_progress │ completed   │
│ 进度        │ 75%         │ 100%        │
│ 剩余工时    │ 2小时       │ 0小时       │
│ 测试覆盖率  │ 80%         │ 95%         │
└─────────────┴─────────────┴─────────────┘

📊 需求整体进度: REQ-123
- 已完成任务: 2/3 (67%)
- 整体进度: 78% → 89%
- 预计完成: 2024-01-16 15:00

🔄 下一步: TASK_003 前端界面实现 (33%完成)
```

### 详细分析报告 (--auto)
```yaml
📊 REQ-123 > TASK_002 自动进度分析报告
=============================================

🔍 代码变更分析:
- 修改文件: 4个
- 新增代码: 134行
- 删除代码: 23行
- 实现函数: 6/7 (86%)
- 代码质量: A级 (无重大问题)

🧪 测试状态:
- 单元测试: 12/12 通过 ✅
- 集成测试: 3/4 通过 ⚠️
- 覆盖率: 95% (目标: ≥80%) ✅
- 性能测试: 通过 ✅

📋 实现计划对比:
✅ API接口设计 (100%)
✅ 数据模型实现 (100%)
✅ 业务逻辑开发 (100%)
⚠️  错误处理逻辑 (90%)
⏳ 文档更新 (50%)

🚧 质量门禁:
✅ 代码质量检查
✅ 安全扫描
⚠️  性能基准测试 (响应时间: 150ms, 目标: <100ms)
✅ 兼容性测试

💡 建议:
1. 优化订单查询接口性能
2. 完成集成测试中的支付流程测试
3. 更新API文档和使用示例

🎯 自动更新结果:
- 状态: in_progress → review (建议)
- 进度: 75% → 90%
- 剩余工时: 2h → 1h
```

### 阻塞问题管理
```text
⚠️  检测到阻塞问题

🚫 REQ-123 > TASK_003: 前端界面实现
阻塞原因: 依赖的后端API接口尚未完成
阻塞时长: 2天
影响评估: 高 (关键路径)

📋 阻塞详情:
- 依赖任务: REQ-123 > TASK_002 (订单API开发)
- 期望完成: 2024-01-16
- 当前状态: 90%完成，需要性能优化
- 预计解除: 2024-01-16 15:00

🔧 建议措施:
1. 优先完成TASK_002的性能优化
2. 使用模拟数据并行开发前端界面
3. 调整TASK_003的开发计划，先实现静态界面

📞 需要沟通:
- 与后端开发确认API完成时间
- 与产品经理讨论功能范围调整
```

## 自动化和集成

### 工作流集成
```python
class TaskProgressAutomation:
    """任务进度自动化管理"""

    def __init__(self, req_id):
        self.req_id = req_id
        self.watch_enabled = False

    def start_progress_monitoring(self):
        """启动进度监控"""
        self.watch_enabled = True

        # 监控文件变更
        self.setup_file_watcher()

        # 定时进度检查
        self.schedule_progress_checks()

        # Git钩子集成
        self.setup_git_hooks()

    def on_file_change(self, file_path):
        """文件变更时触发"""
        task_id = self.identify_related_task(file_path)
        if task_id:
            self.auto_update_progress(task_id)

    def schedule_progress_checks(self):
        """定时进度检查 (每30分钟)"""
        schedule.every(30).minutes.do(self.check_all_tasks_progress)

    def auto_update_progress(self, task_id):
        """自动更新任务进度"""
        detection_result = auto_detect_progress(self.req_id, task_id)

        if detection_result['confidence'] > 0.8:
            update_task_status(
                self.req_id,
                task_id,
                detection_result['status'],
                detection_result['progress']
            )

            self.notify_progress_update(task_id, detection_result)
```

### IDE集成
```javascript
// VS Code 扩展集成
const FlowUpdateExtension = {

    // 自动保存时更新进度
    onFileSave: async (document) => {
        const reqId = detectRequirementId(document.fileName);
        const taskId = detectTaskId(document.fileName);

        if (reqId && taskId) {
            await exec(`claude /flow-update "${reqId}" "${taskId}" --auto`);
            showProgressNotification(reqId, taskId);
        }
    },

    // 状态栏显示进度
    updateStatusBar: (reqId, taskId, progress) => {
        vscode.window.setStatusBarMessage(
            `${reqId}>${taskId}: ${progress}%`,
            5000
        );
    }
};
```

### 团队协作通知
```python
def notify_team_progress(req_id, task_id, update_info):
    """团队进度通知"""

    notification = {
        'type': 'task_progress_update',
        'req_id': req_id,
        'task_id': task_id,
        'update_info': update_info,
        'timestamp': datetime.now().isoformat(),
        'team_members': get_team_members(req_id)
    }

    # Slack/Teams 通知
    send_team_notification(notification)

    # 更新项目仪表板
    update_project_dashboard(notification)

    # 生成每日报告数据
    add_to_daily_report(notification)
```

## 配置和自定义

### 配置文件
```json
{
  "flowUpdate": {
    "autoDetection": {
      "enabled": true,
      "confidenceThreshold": 0.8,
      "checkInterval": 1800,
      "excludePatterns": ["*.test.js", "*.spec.ts"]
    },
    "progressCalculation": {
      "codeWeight": 0.6,
      "testWeight": 0.3,
      "docWeight": 0.1
    },
    "qualityGates": {
      "testCoverageThreshold": 80,
      "codeQualityGrade": "B",
      "performanceThreshold": 100
    },
    "notifications": {
      "teamUpdates": true,
      "milestoneAlerts": true,
      "blockingIssues": true
    },
    "gitIntegration": {
      "autoCommit": false,
      "commitMessageTemplate": "feat(${reqId}): ${action} ${taskId} - ${description}",
      "requireCleanWorkingDirectory": true
    }
  }
}
```

### 环境变量
```bash
# 进度更新配置
export FLOW_UPDATE_AUTO_DETECT=true
export FLOW_UPDATE_CONFIDENCE_THRESHOLD=0.8
export FLOW_UPDATE_CHECK_INTERVAL=1800

# Git集成
export FLOW_UPDATE_AUTO_COMMIT=false
export FLOW_UPDATE_REQUIRE_CLEAN=true

# 通知设置
export FLOW_UPDATE_TEAM_NOTIFY=true
export FLOW_UPDATE_SLACK_WEBHOOK="https://..."
```

## 最佳实践

### 使用建议
1. **定期更新**: 建议每完成一个小的功能点就更新一次进度
2. **自动检测**: 启用自动检测减少手动更新负担
3. **质量先行**: 不要为了进度而跳过质量检查
4. **及时沟通**: 遇到阻塞问题及时更新状态并寻求帮助

### 团队协作
1. **状态透明**: 保持任务状态的实时透明
2. **阻塞管理**: 快速识别和解决阻塞问题
3. **经验分享**: 记录和分享解决问题的经验
4. **持续改进**: 基于数据优化估算和计划能力

---

**注意**: flow-update 命令是 cc-devflow 系统的核心进度管理工具，与其他命令紧密集成，确保项目进度的可见性和可控性。建议结合自动化工具使用以提高效率。
