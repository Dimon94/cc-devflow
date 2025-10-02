---
name: flow-status
description: Query development progress status for cc-devflow requirements. Usage: /flow-status [REQ-ID]
---

# flow-status - 开发进度查询命令

## 命令格式
```text
/flow-status [REQ_ID]
```

### 参数说明
- **ID**: 需求编号(REQ-XXX)或BUG编号(BUG-XXX) (可选，不提供时显示所有活跃项目的状态)

### 示例
```text
/flow-status                    # 查看所有需求和BUG状态
/flow-status REQ-123           # 查看特定需求状态
/flow-status BUG-001           # 查看特定BUG状态
/flow-status --all             # 查看包括已完成项目的所有状态
/flow-status --branches        # 仅查看Git分支状态
/flow-status --detailed REQ-123 # 详细状态报告
/flow-status --bugs            # 仅查看BUG修复状态
```

## Rules Integration

本命令遵循以下规则体系：

1. **Standard Patterns** (.claude/rules/standard-patterns.md):
   - Fail Fast: 无效 ID 格式立即报错
   - Clear Errors: 明确的状态解释和建议
   - Minimal Output: 简洁的状态汇总（默认）
   - Structured Output: 结构化的状态报告

2. **Agent Coordination** (.claude/rules/agent-coordination.md):
   - 读取 orchestration_status.json 状态文件
   - 识别 .completed 完成标记
   - 只读命令，不修改任何状态

3. **DateTime Handling** (.claude/rules/datetime.md):
   - 显示 ISO 8601 UTC 时间戳
   - 计算准确的时间差（已用时间、预计剩余）
   - 支持时区感知的时间显示

4. **DevFlow Patterns** (.claude/rules/devflow-patterns.md):
   - 支持 REQ-ID 和 BUG-ID 格式
   - 使用标准化状态枚举
   - 提供清晰的进度百分比

## Constitution Compliance

**注意**: flow-status 是只读查询命令，不涉及代码修改，因此 Constitution 检查主要用于状态报告的完整性和准确性。

### 查询原则
- **Quality First**: 确保状态报告准确完整
- **无误导信息**: 状态展示必须真实反映当前进度
- **可追溯性**: 提供从状态到文档的链接

### 报告质量
- **文档完整度**: 准确计算各阶段文档完成度
- **时间估算**: 基于实际进度的合理时间预测
- **状态一致性**: Git 状态与文档状态一致性检查

## Prerequisites Validation

**注意**: flow-status 是只读查询命令，通常不需要严格的前置验证。

基本验证：
```bash
# 简单的环境检查（可选）
# - 确认在 cc-devflow 项目目录中
# - 验证 .claude/docs/ 目录存在
# - 如果提供 ID，验证格式正确性
```

## 执行流程

### 1. 参数解析和验证
- 解析命令参数: id (可选), 选项标志
- 如果提供 id，验证格式是否符合 REQ-\d+ 或 BUG-\d+ 模式
- 检查当前是否在 cc-devflow 项目目录中

### 2. 扫描项目目录
扫描项目目录，收集：
- `.claude/docs/requirements/` - 所有存在的需求目录
- `.claude/docs/bugs/` - 所有存在的BUG目录
- 每个需求的文档完成状态
- 最后更新时间
- 当前阶段标识

### 3. Git状态检查
检查Git仓库状态：
- 当前分支信息
- 是否存在相关的 feature 分支
- 分支的提交历史和状态
- 未推送的更改

### 4. 状态文件分析
分析每个需求的 `orchestration_status.json` (标准化状态文件)：
- 当前执行阶段 (研究型子代理输出 vs 主代理执行)
- 完成的子代理调用列表
- 完成的主代理工作项
- 遇到的错误或警告
- 预估剩余时间

同时读取 `EXECUTION_LOG.md` 提供详细的执行历史。

### 5. 状态汇总展示
根据参数显示不同级别的状态信息

## 状态分类

### 需求状态枚举
```yaml
status_types:
  NOT_STARTED: "未开始"
  RESEARCH: "研究阶段 (prd-writer工作中)"
  PRD_COMPLETED: "PRD完成 (planner工作中)"
  PLANNING_COMPLETED: "规划完成 (主代理准备开发)"
  DEVELOPMENT: "开发阶段 (主代理执行中)"
  DEV_COMPLETED: "开发完成 (qa-tester分析中)"
  TESTING: "测试阶段 (主代理执行测试)"
  SECURITY_REVIEW: "安全审查中"
  PR_REVIEW: "代码审查"
  COMPLETED: "已完成"
  FAILED: "执行失败"
  SUSPENDED: "已暂停"
```

### 文档完成度检查
```yaml
documents:
  research/:
    required: true
    weight: 5
    generator: "主代理 (WebFetch)"
  PRD.md:
    required: true
    weight: 15
    generator: "prd-writer 子代理"
  EPIC.md:
    required: true
    weight: 10
    generator: "planner 子代理"
  tasks/:
    required: true
    weight: 30
    generator: "planner 子代理 (包含详细实现指导)"
  TEST_REPORT.md:
    required: false
    weight: 15
    generator: "qa-tester 子代理"
  SECURITY_REPORT.md:
    required: false
    weight: 10
    generator: "security-reviewer 子代理"
  EXECUTION_LOG.md:
    required: true
    weight: 10
    generator: "主代理维护"
```

## 输出格式

### 简要状态 (默认)
```text
📊 cc-devflow 开发状态总览
================================

🔄 进行中的需求 (2个):
┌─────────┬─────────────────┬──────────┬─────────────────┬────────┐
│ REQ-ID  │ 标题             │ 状态     │ 当前阶段          │ 进度   │
├─────────┼─────────────────┼──────────┼─────────────────┼────────┤
│ REQ-123 │ 用户下单功能      │ 开发阶段   │ 主代理执行中      │ 65%    │
│ REQ-124 │ 权限管理系统      │ 测试分析   │ qa-tester研究    │ 85%    │
└─────────┴─────────────────┴──────────┴─────────────────┴────────┘

✅ 已完成需求 (1个):
- REQ-122: 数据导出功能 (2024-01-15 完成)

⚠️  异常状态:
- REQ-125: 支付集成 (执行失败 - 网络连接超时)

📈 总体统计:
- 总需求数: 4
- 进行中: 2 (50%)
- 已完成: 1 (25%)
- 异常: 1 (25%)
- 平均完成时间: 2.5天
```

### 详细状态
```yaml
📋 REQ-123: 用户下单功能 详细状态
==========================================

基本信息:
- 需求ID: REQ-123
- 标题: 用户下单功能
- 创建时间: 2024-01-14 09:30:00 UTC
- 分支: feature/REQ-123-user-order-support
- 当前状态: DEVELOPMENT (开发阶段)

文档完成度:
✅ research/ (100%) - 主代理抓取完成
✅ PRD.md (100%) - prd-writer 2024-01-14 10:15:00
✅ EPIC.md (100%) - planner 2024-01-14 11:20:00
✅ tasks/ (100%) - planner 3个详细任务已创建 (包含实现指导)
🔄 TEST_REPORT.md (0%) - 待qa-tester生成
❌ SECURITY_REPORT.md (0%) - 未开始

开发进度:
✅ TASK_001: 用户模型设计 (主代理已完成)
✅ TASK_002: 订单API开发 (主代理已完成)
🔄 TASK_003: 前端界面实现 (主代理进行中 - 65%)

Git状态:
- 当前分支: feature/REQ-123-user-order-support
- 领先main分支: 8 commits
- 最后提交: feat(REQ-123): implement order API endpoints
- 未推送更改: 有 (2个文件修改)

质量指标:
- 测试覆盖率: 72% (目标: ≥80%)
- 代码审查: 未开始
- 安全扫描: 未开始
- 构建状态: 通过

预估完成:
- 剩余工作量: ~4小时
- 预计完成时间: 2024-01-15 14:00:00 UTC
- 风险评估: 低风险

最近日志:
- 2024-01-15 10:30:00: 主代理根据详细 TASK 开始 TASK_003
- 2024-01-15 09:45:00: 主代理完成 TASK_002，通过质量检查
- 2024-01-15 08:20:00: 主代理开始前端组件开发
- 2024-01-14 12:30:00: planner 完成详细任务分解和实现指导
```

### 分支状态模式
```text
🌿 Git分支状态概览
===================

活跃的feature分支:
┌──────────────────────────────────┬─────────┬───────────────┬────────────┐
│ 分支名                           │ REQ-ID  │ 最后提交      │ 状态       │
├──────────────────────────────────┼─────────┼───────────────┼────────────┤
│ feature/REQ-123-user-order       │ REQ-123 │ 2小时前       │ 开发中     │
│ feature/REQ-124-permission-mgmt  │ REQ-124 │ 30分钟前      │ 测试中     │
│ feature/REQ-125-payment-gateway  │ REQ-125 │ 2天前         │ 已暂停     │
└──────────────────────────────────┴─────────┴───────────────┴────────────┘

孤立分支 (可能需要清理):
- feature/old-experiment (14天前)
- hotfix/urgent-fix (已合并但未删除)
```

## 错误处理

### 常见场景
1. **目录不存在**
   - 检查是否在正确的项目目录中
   - 提示运行 `/flow-new` 创建第一个需求

2. **权限问题**
   - 检查文件读取权限
   - 提供sudo权限提示

3. **Git仓库异常**
   - 处理detached HEAD状态
   - 处理损坏的Git仓库

4. **日志文件损坏**
   - 安全解析YAML frontmatter
   - 容错处理不完整的日志

### 错误日志格式
```yaml
---
error_type: git_repository_error
timestamp: 2024-01-15T10:30:00Z
command: flow-status
req_id: REQ-123
---

# 错误详情
Git仓库状态异常：分支 feature/REQ-123-user-order 不存在

## 可能原因
1. 分支已被删除
2. 远程仓库同步问题
3. 本地仓库损坏

## 建议解决方案
1. 运行 `git fetch --all` 同步远程分支
2. 使用 `/flow-restart REQ-123` 重新创建分支
3. 检查 EXECUTION_LOG.md 中的分支历史
```

## 性能优化

### 缓存策略
```python
import json
import os
from datetime import datetime, timedelta

class StatusCache:
    def __init__(self, cache_dir=".claude/cache/status"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def get_cache_file(self, req_id=None):
        if req_id:
            return f"{self.cache_dir}/status_{req_id}.json"
        return f"{self.cache_dir}/status_overview.json"

    def is_fresh(self, cache_file, ttl_minutes=5):
        """检查缓存是否新鲜（默认5分钟）"""
        if not os.path.exists(cache_file):
            return False

        modified_time = datetime.fromtimestamp(os.path.getmtime(cache_file))
        return datetime.now() - modified_time < timedelta(minutes=ttl_minutes)

    def invalidate_for_req(self, req_id):
        """使特定需求的缓存失效"""
        cache_file = self.get_cache_file(req_id)
        if os.path.exists(cache_file):
            os.remove(cache_file)

        # 同时使概览缓存失效
        overview_cache = self.get_cache_file()
        if os.path.exists(overview_cache):
            os.remove(overview_cache)
```

### 并发处理
```python
import concurrent.futures
import threading

def analyze_requirements_parallel(req_dirs):
    """并行分析多个需求的状态"""

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        future_to_req = {
            executor.submit(analyze_single_requirement, req_dir): req_dir
            for req_dir in req_dirs
        }

        results = {}
        for future in concurrent.futures.as_completed(future_to_req):
            req_dir = future_to_req[future]
            try:
                results[req_dir] = future.result()
            except Exception as e:
                results[req_dir] = {"error": str(e)}

        return results
```

## 配置选项

### 环境变量
```bash
# 状态查询配置
export FLOW_STATUS_CACHE_TTL=300          # 缓存生存时间(秒)
export FLOW_STATUS_MAX_CONCURRENT=4       # 最大并发分析数
export FLOW_STATUS_INCLUDE_ARCHIVED=false # 是否包含归档需求
export FLOW_STATUS_DEFAULT_FORMAT=simple  # 默认输出格式

# 显示配置
export FLOW_STATUS_SHOW_COLORS=true       # 是否使用彩色输出
export FLOW_STATUS_TABLE_WIDTH=120        # 表格宽度
export FLOW_STATUS_DATETIME_FORMAT=relative # 时间显示格式
```

### 设置文件
```json
{
  "flowStatus": {
    "defaultFormat": "simple",
    "cacheEnabled": true,
    "cacheTtlMinutes": 5,
    "maxConcurrentAnalysis": 4,
    "includeArchived": false,
    "progressEstimation": {
      "enabled": true,
      "weightFactors": {
        "documentation": 0.3,
        "development": 0.5,
        "testing": 0.15,
        "review": 0.05
      }
    },
    "display": {
      "useColors": true,
      "compactMode": false,
      "showTimestamps": true,
      "datetimeFormat": "relative"
    }
  }
}
```

## 集成点

### 与其他命令协作
```bash
# 与 flow:new 协作
/flow-new "REQ-126|新功能"  # 创建需求
/flow-status REQ-126        # 立即查看状态

# 与 flow-restart 协作
/flow-status --failed       # 查看失败的需求
/flow-restart REQ-125       # 重启失败的需求

# 与开发工具集成
/flow-status --json | jq '.requirements[] | select(.status == "DEVELOPMENT")'
```

### IDE集成
```javascript
// VS Code 扩展集成示例
const getFlowStatus = async (reqId) => {
  const { stdout } = await exec(`claude /flow-status ${reqId} --json`);
  return JSON.parse(stdout);
};
```

## 最佳实践

### 使用建议
1. **定期检查**: 每日开始工作前运行 `/flow-status`
2. **分阶段查看**: 使用 `--detailed` 深入了解问题
3. **团队协作**: 结合 `--json` 输出进行状态共享
4. **性能监控**: 关注平均完成时间趋势

### 故障排除
```bash
# 调试模式
export FLOW_DEBUG=1
/flow-status REQ-123

# 清除缓存
rm -rf .claude/cache/status

# 重建索引
/flow-status --rebuild-index

# 验证数据完整性
/flow-status --validate REQ-123
```

---

**注意**: flow-status 命令设计为只读操作，不会修改任何项目文件或Git状态。所有状态信息基于现有文档和Git历史分析得出。
