# cc-devflow 开发流程规则

## 规则概述

cc-devflow 是一个基于 Claude Code 的一体化需求开发流程系统，通过单一命令实现从需求分析到代码交付的完整自动化流程。本文档定义了 cc-devflow 特有的规则和约定。

## 核心原则

### 1. 一键启动原则
所有开发流程必须通过 `/flow:new` 命令一键启动，不允许分步骤手动操作。

```bash
# 标准格式
/flow:new "REQ-123|支持用户下单|https://plan.example.com/Q1"

# 多文档格式
/flow:new "REQ-124|权限管理|https://spec.doc,https://api.doc"

# 无外部文档
/flow:new "REQ-125|数据导出"
```

### 2. 强制文档驱动
- 每个需求必须生成完整的文档链：PRD → EPIC → TASKS
- 所有文档存储在 `.claude/docs/requirements/${reqId}/` 下
- 使用 YAML frontmatter 进行结构化元数据管理

### 3. 质量闸强制检查
所有代码提交前必须通过质量闸：
- TypeScript 类型检查
- 单元测试覆盖率 ≥ 80%
- 代码风格检查
- 安全扫描
- 构建验证

## 命令规则

### 参数解析规则
```javascript
const parseFlowCommand = (input) => {
  const parts = input.split('|').map(p => p.trim());
  return {
    reqId: parts[0]?.match(/REQ-\d+/)?.[0] || throw new Error('Invalid REQ-ID format'),
    title: parts[1] || throw new Error('Title is required'),
    planUrls: parts[2]?.split(',').map(url => url.trim()).filter(Boolean) || []
  };
};
```

### REQ-ID 格式规范
- 必须匹配格式：`REQ-\d+` (例如: REQ-123, REQ-001)
- 在当前仓库范围内必须唯一
- 不允许重复使用已存在的 REQ-ID

## 文件组织规则

### 目录结构
```text
.claude/docs/requirements/${reqId}/
├── PRD.md                 # 产品需求文档
├── EPIC.md               # Epic 规划
├── tasks/                # 任务分解
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── TASK_003.md
├── research/             # 研究资料
│   ├── ${reqId}_plan_1.md
│   └── ${reqId}_plan_2.md
├── TEST_REPORT.md        # 测试报告
└── EXECUTION_LOG.md      # 执行日志
```

### 文档命名约定
- PRD 文件：`PRD.md`
- Epic 文件：`EPIC.md`
- Task 文件：`TASK_{序号:003d}.md`
- 研究文件：`${reqId}_plan_{序号}.md`
- 测试报告：`TEST_REPORT.md`
- 执行日志：`EXECUTION_LOG.md`

## 分支管理规则

### 分支命名
```bash
# 标准格式
feature/${reqId}-${slug(title)}

# 示例
feature/REQ-123-user-order-support
feature/REQ-124-permission-management
```

### 分支操作流程
1. 检查当前在 main 分支且状态干净
2. 创建特性分支
3. 实施开发
4. 质量闸检查
5. 创建 PR
6. 合并后清理分支

## 提交信息规则

### 提交格式
```yaml
feat(${reqId}): ${taskTitle}

${详细描述}

- 实现功能点1
- 实现功能点2
- 修复问题

Co-authored-by: Claude <claude@anthropic.com>
```

### 提交类型
- `feat(REQ-xxx)`: 新功能
- `fix(REQ-xxx)`: 错误修复
- `docs(REQ-xxx)`: 文档更新
- `test(REQ-xxx)`: 测试添加/修改
- `refactor(REQ-xxx)`: 重构

## 子代理协调规则

### 调用顺序
```text
flow-orchestrator
├── prd-writer (PRD生成)
├── planner (Epic和Task规划)
├── dev-implementer (代码实现)
├── qa-tester (质量测试)
├── security-reviewer (安全检查)
└── release-manager (发布管理)
```

### 状态同步机制
- 每个子代理完成后更新 `EXECUTION_LOG.md`
- 使用文件锁防止并发冲突
- 状态变更通知后续代理

## 错误处理规则

### 错误分类
1. **参数错误**: 命令格式、REQ-ID 格式等
2. **环境错误**: Git状态、权限、依赖等
3. **网络错误**: URL访问失败
4. **质量闸错误**: 代码质量不达标
5. **系统错误**: 子代理异常、文件操作失败

### 错误恢复策略
```bash
# 从特定步骤继续
/flow:continue "REQ-123" --from=prd
/flow:continue "REQ-123" --from=development
/flow:continue "REQ-123" --from=testing
```

### 错误日志格式
```yaml
---
error_type: parameter_error
timestamp: 2024-01-15T10:30:00Z
req_id: REQ-123
step: parameter_parsing
---

# 错误详情
参数格式不正确：缺少标题部分

## 解决方案
请使用正确格式：/flow:new "REQ-123|需求标题|计划URL"
```

## 质量标准

### 代码质量要求
- TypeScript 无 error 和 warning
- 测试覆盖率 ≥ 80%
- ESLint 零违规
- Prettier 格式化通过
- 安全扫描无高危漏洞

### 文档质量要求
- PRD 包含完整的需求分析
- Epic 包含详细的任务分解
- Task 包含具体的实现步骤
- 所有文档包含YAML frontmatter

### 性能要求
- 整个流程 90% 情况下在 15 分钟内完成
- 单个任务实施时间不超过 5 分钟
- 质量闸检查时间不超过 2 分钟

## 安全规则

### 敏感信息处理
- 不在文档中包含 API 密钥、密码等
- 不提交包含敏感数据的测试文件
- 所有外部API调用使用环境变量

### 权限控制
- 所有 GitHub 操作需要适当权限
- 文件操作限制在项目目录内
- 网络访问仅限白名单 URL

## 扩展规则

### 自定义配置
在 `.claude/settings.json` 中可配置：

```json
{
  "devflow": {
    "baseBranch": "main",
    "autoApprove": false,
    "qualityGate": {
      "minCoverage": 80,
      "strictMode": true
    },
    "templates": {
      "customPrdTemplate": ".claude/templates/custom-prd.md"
    }
  }
}
```

### 钩子集成
- `pre-push-guard.sh`: 推送前质量检查
- `markdown_formatter.py`: 文档格式化
- `progress_tracker.js`: 进度跟踪

## 故障排除

### 常见问题诊断
```bash
# 检查环境
git status
gh auth status
npm run --silent

# 检查权限
ls -la .claude/
cat .claude/settings.json

# 检查日志
tail -f .claude/logs/flow-*.log
```

### 调试模式
```bash
export FLOW_DEBUG=1
/flow:new "REQ-123|测试需求"
```

---

**重要提示**: 所有规则都是强制性的，不允许绕过。如需修改规则，必须更新此文档并获得团队确认。
