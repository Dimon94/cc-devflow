---
name: flow:new
description: One-shot requirement flow. Usage: /flow:new "REQ-123|支持用户下单|https://plan.example.com/Q1"
---

# Flow:New - 一键需求开发流

## 命令格式
```
/flow:new "REQ_ID|TITLE|PLAN_URLS"
```

### 参数说明
- **REQ_ID**: 需求编号 (例如: REQ-123)
- **TITLE**: 需求标题 (例如: 支持用户下单)
- **PLAN_URLS**: 计划文档URL，多个用逗号分隔 (可选)

### 示例
```
/flow:new "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow:new "REQ-124|用户权限管理|https://docs.company.com/auth-spec.md,https://confluence.company.com/security-requirements"
/flow:new "REQ-125|数据导出功能"
```

## 执行流程

### 1. 参数解析和验证
- 解析命令参数: reqId, title, planUrls
- 验证 reqId 格式和唯一性
- 检查当前是否已在 feature 分支上
- 确认 git 状态是否干净

### 2. 研究资料收集
如果提供了 planUrls:
- 使用 WebFetch 抓取每个 URL 内容
- 将内容保存到 `.claude/docs/research/${reqId}_*.md`
- 分析并提取关键信息

### 3. 启动总控子代理
调用 flow-orchestrator 子代理，传递参数:
```json
{
  "reqId": "REQ-123",
  "title": "支持用户下单",
  "planSources": [
    ".claude/docs/research/REQ-123_1.md",
    ".claude/docs/research/REQ-123_2.md",
    ".claude/docs/plan/project-roadmap.md"
  ],
  "baseBranch": "main"
}
```

### 4. 后台进程启动
启动开发和测试监控进程:
```bash
# 如果 package.json 存在且进程未运行
npm run dev &
npm run test:watch &
```

### 5. 进度展示
实时显示流程进度:
- ✅ 研究资料收集完成
- ✅ Git 分支创建: feature/REQ-123-支持用户下单
- 🔄 PRD 生成中...
- 🔄 Epic 和任务规划中...
- ⏳ 开发实施中...

### 6. 质量闸控制
在关键节点要求用户确认:
- 提交代码前确认
- 创建 PR 前确认
- 合并代码前确认

## 输出产物

### 文档结构
```
.claude/docs/requirements/${reqId}/
├── PRD.md                 # 产品需求文档
├── EPIC.md               # Epic 规划
├── tasks/                # 任务分解
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── ...
├── TEST_REPORT.md        # 测试报告
└── LOG.md               # 执行日志
```

### Git 分支
- 分支命名: `feature/${reqId}-${slug(title)}`
- 提交格式: `feat(${reqId}): ${taskTitle} - ${summary}`

### PR 创建
自动生成包含以下信息的 PR:
- 标题: `${reqId} ${title}`
- 描述: 链接到 PRD、Epic、Tasks、Test Reports
- 标签: 根据需求类型自动添加

## 错误处理

### 常见错误场景
1. **参数格式错误**
   - 提示正确的命令格式
   - 提供示例

2. **reqId 已存在**
   - 检查是否已有同名分支或文档
   - 提供继续或中止选项

3. **网络连接问题**
   - 记录失败的 URL
   - 提供手动补充选项

4. **质量闸失败**
   - 详细显示失败原因
   - 提供修复建议
   - 允许跳过或重试

5. **权限问题**
   - 检查 git/gh 权限
   - 提供手动操作指引

## 配置选项

### 环境变量
- `DEFAULT_BASE_BRANCH`: 默认基础分支 (默认: main)
- `FLOW_AUTO_APPROVE`: 自动通过所有确认 (默认: false)
- `FLOW_SKIP_BACKGROUND`: 跳过后台进程启动 (默认: false)

### 设置文件
在 `.claude/settings.json` 中可配置:
```json
{
  "flow": {
    "baseBranch": "develop",
    "autoApprove": false,
    "skipBackground": false,
    "mcpServer": "docs-web"
  }
}
```

## 依赖检查

### 必需依赖
- Git 仓库已初始化
- 具有提交权限
- 项目根目录包含必要配置

### 可选依赖
- GitHub CLI (gh) - 用于自动 PR 创建
- npm/yarn - 用于后台进程
- MCP 服务器 - 用于网页抓取

### 检查命令
```bash
# 检查 git 状态
git status

# 检查 GitHub CLI
gh auth status

# 检查 npm scripts
npm run --silent
```

## 故障排除

### 调试信息
设置环境变量启用详细日志:
```bash
export FLOW_DEBUG=1
/flow:new "REQ-123|测试需求"
```

### 日志位置
- 执行日志: `.claude/docs/requirements/${reqId}/LOG.md`
- 错误日志: `.claude/logs/flow-${reqId}.log`
- 调试信息: 控制台输出

### 恢复机制
如果流程中断，可以从特定步骤继续:
```
/flow:continue "REQ-123" --from=prd
/flow:continue "REQ-123" --from=development
```

## 最佳实践

### 命令使用
1. 确保当前在 main 分支且状态干净
2. 提供准确的需求标题
3. 包含详细的计划文档 URL
4. 在关键节点仔细检查输出

### 需求准备
1. 需求 ID 使用统一格式
2. 计划文档结构化且可访问
3. 提前准备相关背景资料
4. 明确验收标准

### 质量控制
1. 不跳过质量闸检查
2. 仔细审查生成的文档
3. 确保测试覆盖率达标
4. 验证安全扫描结果

---

**注意**: 这是一个存储的提示命令，执行时会调用 flow-orchestrator 子代理来完成整个流程。确保已正确配置所有必需的子代理和权限。