---
name: flow:sprint
description: Manage sprint planning and progress tracking for cc-devflow. Usage: /flow:sprint [ACTION] [OPTIONS]
---

# Flow:Sprint - 冲刺管理命令

## 命令格式
```text
/flow:sprint [ACTION] [OPTIONS]
```

### 动作类型
- **new**: 创建新的冲刺计划
- **status**: 查看当前冲刺状态
- **add**: 添加需求到当前冲刺
- **remove**: 从冲刺中移除需求
- **close**: 结束当前冲刺
- **review**: 冲刺回顾和总结

### 示例
```text
/flow:sprint new "Sprint-2024-01" --duration=14     # 创建14天冲刺
/flow:sprint status                                  # 查看当前冲刺状态
/flow:sprint add REQ-123 REQ-124                   # 添加需求到冲刺
/flow:sprint remove REQ-125 --reason="优先级调整"    # 移除需求
/flow:sprint close --with-review                    # 结束冲刺并进行回顾
```

## 执行流程

### 1. 冲刺创建 (new)
```bash
/flow:sprint new "Sprint-2024-01" --duration=14 --goals="用户功能优化"
```

#### 1.1 参数验证
- 验证冲刺名称格式和唯一性
- 检查持续时间合理性 (1-30天)
- 确认当前无活跃冲刺

#### 1.2 创建冲刺目录
```bash
mkdir -p ".claude/docs/sprints/Sprint-2024-01"
```

#### 1.3 生成冲刺计划文档
使用 planner 子代理生成 `SPRINT.md`:
```json
{
  "sprintName": "Sprint-2024-01",
  "duration": 14,
  "goals": "用户功能优化",
  "availableRequirements": ["REQ-123", "REQ-124", "REQ-125"]
}
```

### 2. 需求管理

#### 2.1 添加需求到冲刺
```bash
/flow:sprint add REQ-123 REQ-124 --priority=high
```

主代理执行:
- 验证需求状态和可行性
- 更新冲刺容量计算
- 调整任务优先级
- 更新 SPRINT.md 文档

#### 2.2 移除需求
```bash
/flow:sprint remove REQ-125 --reason="技术依赖未就绪"
```

主代理执行:
- 记录移除原因
- 重新平衡冲刺负载
- 更新团队沟通记录

### 3. 进度跟踪

#### 3.1 每日状态更新
自动收集并更新:
- 每个需求的完成进度
- 燃尽图数据点
- 阻塞问题记录
- 团队速度指标

#### 3.2 实时仪表板
```yaml
sprint_dashboard:
  总进度: "65% (9/14天)"
  需求完成: "3/5 (60%)"
  代码提交: "24 commits"
  测试覆盖率: "82%"
  阻塞问题: 1
  预计完成: "2024-01-29"
```

## 输出格式

### 冲刺状态概览
```text
🏃‍♂️ Sprint-2024-01 状态概览
================================

📊 基本信息:
- 冲刺名称: Sprint-2024-01
- 开始时间: 2024-01-15
- 结束时间: 2024-01-29
- 剩余天数: 5天
- 目标: 用户功能优化

📈 进度统计:
┌──────────────┬────────┬────────┬────────┐
│ 指标         │ 计划   │ 实际   │ 百分比 │
├──────────────┼────────┼────────┼────────┤
│ 需求完成     │ 5      │ 3      │ 60%    │
│ 故事点       │ 34     │ 22     │ 65%    │
│ 工作小时     │ 120    │ 85     │ 71%    │
│ 测试用例     │ 45     │ 38     │ 84%    │
└──────────────┴────────┴────────┴────────┘

🎯 需求状态:
✅ REQ-123: 用户下单功能 (已完成)
✅ REQ-124: 权限管理系统 (已完成)
✅ REQ-126: 数据导出 (已完成)
🔄 REQ-127: 支付集成 (开发中 - 75%)
⏳ REQ-128: 通知系统 (计划中)

⚠️  风险和阻塞:
- REQ-127: 等待第三方支付API文档
- 测试环境不稳定影响集成测试

📊 燃尽图 (最近5天):
Day 10: ████████████████████░░░░ 80%
Day 11: ████████████████████░░░░ 75%
Day 12: ████████████████████░░░░ 70%
Day 13: ████████████████████░░░░ 65%
Day 14: ████████████████████░░░░ 60%

🎯 预测:
- 按当前速度: 可能延期2天
- 建议措施: 调整REQ-128范围或推迟到下个冲刺
```

### 详细需求分解
```yaml
📋 需求详细状态
==================

REQ-127: 支付集成 (开发中)
├── 文档状态:
│   ✅ PRD.md (prd-writer 完成)
│   ✅ EPIC.md (planner 完成)
│   ✅ IMPLEMENTATION_PLAN.md (dev-implementer 完成)
│   🔄 TEST_REPORT.md (qa-tester 分析中)
├── 开发进度:
│   ✅ TASK_001: 支付接口设计 (主代理完成)
│   ✅ TASK_002: 支付流程实现 (主代理完成)
│   🔄 TASK_003: 异常处理逻辑 (主代理进行中)
│   ⏳ TASK_004: 集成测试 (等待中)
├── 工作量:
│   ✅ 计划: 21小时 | 实际: 16小时 | 剩余: 5小时
├── 风险:
│   ⚠️  依赖第三方API文档 (高风险)
│   ⚠️  测试环境配置问题 (中风险)
└── 预计完成: 2024-01-27
```

## 冲刺模板和配置

### 冲刺配置文件
```json
{
  "sprintSettings": {
    "defaultDuration": 14,
    "workingDaysPerWeek": 5,
    "hoursPerDay": 8,
    "velocityCalculation": "story_points",
    "burndownUpdateFrequency": "daily",
    "autoStatusUpdate": true,
    "riskThresholds": {
      "schedule": 0.8,
      "scope": 0.9,
      "quality": 0.85
    }
  },
  "notifications": {
    "dailyStandup": true,
    "riskAlerts": true,
    "completionMilestones": true
  }
}
```

### 模板定制
```markdown
# Sprint 模板变量
- {{SPRINT_NAME}}: 冲刺名称
- {{START_DATE}}: 开始日期
- {{END_DATE}}: 结束日期
- {{GOALS}}: 冲刺目标
- {{TEAM_CAPACITY}}: 团队容量
- {{REQUIREMENTS}}: 需求列表
```

## 集成和自动化

### 与主工作流集成
```bash
# 冲刺需求开发流程
/flow:sprint add REQ-129                # 添加到当前冲刺
/flow:new "REQ-129|新功能|url"           # 启动开发流程
/flow:sprint status REQ-129             # 跟踪冲刺中的进度
```

### 自动化指标收集
```python
class SprintMetrics:
    def collect_daily_metrics(self, sprint_name):
        """每日自动收集冲刺指标"""
        return {
            'completed_requirements': self.count_completed_reqs(),
            'code_commits': self.get_commit_count(),
            'test_coverage': self.get_coverage_percentage(),
            'story_points_burned': self.calculate_story_points(),
            'blockers': self.identify_blockers(),
            'team_velocity': self.calculate_velocity()
        }

    def generate_burndown_data(self, sprint_name):
        """生成燃尽图数据"""
        # 实现燃尽图计算逻辑
        pass

    def predict_completion(self, sprint_name):
        """预测完成时间"""
        # 基于当前速度预测
        pass
```

### 报告生成
```bash
# 每日报告
/flow:sprint status --format=daily-report

# 周报
/flow:sprint status --format=weekly-summary

# 冲刺结束报告
/flow:sprint close --generate-report
```

## 风险管理

### 自动风险检测
```yaml
risk_indicators:
  schedule_risk:
    - 燃尽速度低于预期
    - 剩余时间vs剩余工作量不匹配
    - 关键路径任务延期

  scope_risk:
    - 需求变更频繁
    - 新增未计划工作
    - 技术债务积累

  quality_risk:
    - 测试覆盖率下降
    - 代码审查通过率低
    - 缺陷密度上升

  team_risk:
    - 团队成员请假
    - 关键技能瓶颈
    - 沟通协调问题
```

### 缓解策略建议
```python
def suggest_mitigation(risk_type, severity):
    """根据风险类型和严重程度建议缓解措施"""
    strategies = {
        'schedule_high': [
            "减少需求范围",
            "增加资源投入",
            "并行化开发任务",
            "推迟非关键功能"
        ],
        'quality_medium': [
            "增加代码审查频次",
            "强制测试覆盖率要求",
            "引入结对编程"
        ]
    }
    return strategies.get(f"{risk_type}_{severity}", [])
```

## 最佳实践

### 冲刺规划原则
1. **容量规划**: 团队容量不超过80%，留出缓冲时间
2. **需求粒度**: 单个需求不超过2-3天工作量
3. **依赖管理**: 识别和管理需求间依赖关系
4. **质量门禁**: 每个需求必须通过质量检查

### 日常管理
1. **每日更新**: 自动收集进度数据
2. **阻塞处理**: 及时识别和解决阻塞问题
3. **风险预警**: 主动监控和预警风险
4. **团队沟通**: 保持透明的进度可见性

### 回顾改进
1. **数据驱动**: 基于客观数据进行分析
2. **持续改进**: 每个冲刺都要有改进措施
3. **经验积累**: 建立组织级的最佳实践库
4. **工具优化**: 不断优化工具和流程

---

**注意**: flow:sprint 命令设计为项目级管理工具，配合 flow:new、flow:status 等命令形成完整的敏捷开发管理闭环。建议团队建立规范的冲刺管理流程和度量体系。
