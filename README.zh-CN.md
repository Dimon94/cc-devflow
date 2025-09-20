# 🚀 cc-devflow

> Claude Code 一键需求开发流系统

基于 Claude Code 官方子代理、钩子和设置机制构建的完整开发工作流系统。通过单一命令将需求从规划转变为代码交付。

[中文文档](./README.zh-CN.md) | [English](./README.md)

## ✨ 核心特性

- **🎯 一键启动流程**: 使用 `/flow-new "REQ-123|功能标题|计划URLs"` 启动完整的需求开发
- **📋 文档驱动**: 自动化 PRD → EPIC → TASKS → 实现链条
- **🔄 智能恢复**: 使用 `/flow-restart` 恢复中断的开发，用 `/flow-status` 监控进度
- **🛡️ 质量闸**: 自动化 TypeScript 检查、测试、代码检查和安全扫描
- **🤖 子代理编排**: 10 个专业代理负责不同开发阶段
- **🔗 GitHub 集成**: 自动化 PR 创建、分支管理和规范化提交
- **📊 进度跟踪**: 实时状态监控和智能重启点
- **🌐 MCP 集成**: 无缝外部内容获取和 API 集成
- **⚡ 自动进度更新**: 基于代码变更和Git提交的智能进度检测
- **🔍 一致性验证**: 企业级一致性检查，智能冲突检测和自动修复建议

## 🚀 快速开始

### 先决条件

- 已安装并配置 [Claude Code](https://claude.ai/code)
- 已初始化 Git 仓库
- Node.js 项目（可选，用于附加质量检查）

### 安装

```bash
# 将 .claude 配置克隆到您的项目
npx tiged Dimon94/cc-devflow/.claude .claude

# 或手动下载并解压
curl -L https://github.com/Dimon94/cc-devflow/archive/main.zip -o cc-devflow.zip
unzip cc-devflow.zip
cp -r cc-devflow-main/.claude .claude
rm -rf cc-devflow.zip cc-devflow-main
```

### 验证安装

**检查安装是否成功:**
```bash
.claude/scripts/verify-setup.sh
```
这个脚本会验证所有必需的文件和配置。

### 快速体验

**运行交互式演示:**
```bash
python3 .claude/scripts/demo.py
```
这个演示将引导您体验完整的开发流程，包括自动进度更新。

### 使用方法

1. **启动新的需求流程:**
   ```bash
   /flow-new "REQ-123|用户下单支持|https://docs.example.com/orders-spec"
   ```

2. **检查开发进度:**
   ```bash
   /flow-status                 # 所有需求
   /flow-status REQ-123        # 特定需求
   /flow-status --detailed REQ-123  # 详细报告
   ```

3. **恢复中断的开发:**
   ```bash
   /flow-restart "REQ-123"                    # 自动检测重启点
   /flow-restart "REQ-123" --from=development # 从特定阶段重启
   ```

4. **验证文档一致性:**
   ```bash
   /flow-verify "REQ-123"                     # 全面一致性检查
   /flow-verify "REQ-123" --detailed          # 详细分析报告
   /flow-verify "REQ-123" --fix-auto          # 自动修复可解决问题
   /flow-verify --all                         # 批量验证所有需求
   ```

5. **启动自动监控:**
   ```bash
   .claude/scripts/start-monitor.sh start     # 启动后台监控
   .claude/scripts/start-monitor.sh status   # 查看监控状态
   ```

## 🏗️ 系统架构

### 子代理工作流
```text
flow-orchestrator (主控制器)
├── prd-writer          → 生成产品需求文档
├── planner             → 创建 Epic 和任务分解
├── dev-implementer     → 代码实现
├── qa-tester           → 质量保证和测试
├── security-reviewer   → 安全扫描和修复
├── release-manager     → PR 创建和合并管理
├── impact-analyzer     → PRD 变更影响分析
├── compatibility-checker → 版本兼容性分析
└── consistency-checker → 企业级一致性验证
```

### 质量闸
- **推送前保护**: TypeScript、测试、代码检查、安全、构建验证
- **Markdown 格式化器**: 自动文档格式化和语言检测
- **规范化提交**: 标准化提交消息格式强制执行
- **一致性验证**: 跨文档一致性检查和冲突检测

### 文档结构
```text
.claude/docs/requirements/${REQ-ID}/
├── PRD.md                 # 产品需求文档
├── EPIC.md               # Epic 规划和分解
├── tasks/                # 单个任务规格
│   ├── TASK_001.md
│   ├── TASK_002.md
│   └── TASK_003.md
├── research/             # 外部研究材料
├── TEST_REPORT.md        # QA 测试结果
└── EXECUTION_LOG.md      # 完整审计轨迹
```

## 📋 命令参考

### 主要命令

| 命令 | 描述 | 用法 |
|---------|-------------|-------|
| `/flow-new` | 启动新需求开发 | `/flow-new "REQ-123\|标题\|URLs"` |
| `/flow-status` | 查询开发进度 | `/flow-status [REQ-ID] [--detailed]` |
| `/flow-restart` | 恢复中断的开发 | `/flow-restart "REQ-ID" [--from=STAGE]` |
| `/flow-verify` | 验证文档一致性 | `/flow-verify "REQ-ID" [--detailed] [--fix-auto]` |
| `/flow-update` | 更新任务进度 | `/flow-update "REQ-ID" "TASK-ID" [OPTIONS]` |
| `/flow:sprint` | 冲刺管理 | `/flow:sprint [ACTION] [OPTIONS]` |

### 状态查询选项
```bash
/flow-status                    # 所有需求概览
/flow-status REQ-123           # 特定需求状态
/flow-status --all             # 包括已完成需求
/flow-status --branches        # 仅 Git 分支状态
/flow-status --detailed REQ-123 # 综合状态报告
```

### 重启选项
```bash
/flow-restart "REQ-123"                    # 自动检测重启点
/flow-restart "REQ-123" --from=prd         # 从 PRD 阶段重启
/flow-restart "REQ-123" --from=development # 从开发阶段重启
/flow-restart "REQ-123" --force --backup   # 强制重启并备份
```

## ⚙️ 配置

### 设置 (.claude/settings.json)
```json
{
  "permissions": {
    "allowGitOperations": true,
    "allowNetworkRequests": true,
    "allowSubprocesses": true
  },
  "hooks": {
    "pre-push": ".claude/hooks/pre-push-guard.sh",
    "post-tool-use": ".claude/hooks/markdown_formatter.py"
  },
  "mcpServers": {
    "web-scraper": {
      "command": "npx",
      "args": ["-y", "@anthropic/web-scraper-mcp@latest"]
    }
  },
  "progressMonitor": {
    "enabled": true,
    "autoUpdateThreshold": 0.05,
    "confidenceThreshold": 0.7
  }
}
```

### 环境变量
```bash
# 流程行为
export FLOW_AUTO_APPROVE=false          # 在质量闸要求手动批准
export FLOW_SKIP_BACKGROUND=false       # 启动后台开发/测试进程
export DEFAULT_BASE_BRANCH=main         # PR 的默认基础分支

# 质量闸
export MIN_TEST_COVERAGE=80             # 最小测试覆盖率阈值
export STRICT_TYPE_CHECKING=true       # 强制严格 TypeScript 检查

# MCP 集成
export WEBFETCH_TIMEOUT=30              # 网络请求超时
export ALLOWED_DOMAINS=""               # 逗号分隔的允许域名
```

## 🔧 自定义

### 添加自定义子代理
在 `.claude/agents/` 中创建新代理：

```markdown
---
name: custom-agent
description: 您的自定义开发阶段代理
tools: Task, Read, Write, Edit
---

您的代理实现在这里...
```

### 自定义质量闸
扩展 `.claude/hooks/pre-push-guard.sh`：

```bash
# 添加您的自定义检查
if command -v your-custom-tool >/dev/null 2>&1; then
    echo "🔍 运行自定义检查..."
    if ! your-custom-tool --validate; then
        add_error "自定义验证失败"
    fi
fi
```

### 文档模板
在 `.claude/docs/templates/` 中自定义模板：
- `PRD_TEMPLATE.md` - 产品需求文档结构
- `EPIC_TEMPLATE.md` - Epic 规划格式
- `TASK_TEMPLATE.md` - 单个任务规格

## 🏛️ 规则系统

cc-devflow 遵循全面的规则系统，确保一致性和质量：

- **标准模式**: 快速失败、清晰错误、最少输出、信任系统
- **代理协调**: 代理间通信协议和文件锁定
- **分支操作**: Git 工作流管理和规范化提交
- **GitHub 操作**: 仓库保护和自动化 PR 处理
- **测试执行**: 质量保证标准和覆盖率要求
- **日期时间处理**: 跨平台时间操作和 ISO 8601 合规
- **DevFlow 模式**: cc-devflow 特定约定和错误处理
- **MCP 集成**: 外部内容获取和安全验证

## 🔍 监控和调试

### 自动进度更新
系统会自动检测代码变更并更新任务进度：

```bash
# 启动后台监控服务
.claude/scripts/start-monitor.sh start

# 查看监控状态
.claude/scripts/start-monitor.sh status

# 手动更新任务进度
/flow-update "REQ-123" "TASK_001" --auto

# 测试自动更新机制
python3 .claude/scripts/test-auto-update.py
```

**自动触发条件**:
- 编辑代码文件 (Edit, Write, MultiEdit)
- Git 提交操作
- 测试运行完成
- 文件系统变更检测

### 状态监控
```bash
# 实时进度跟踪
/flow-status --detailed REQ-123

# Git 分支概览
/flow-status --branches

# 自动化的 JSON 输出
/flow-status REQ-123 --json | jq '.progress'
```

### 调试模式
```bash
# 启用详细日志
export FLOW_DEBUG=1
/flow-new "REQ-123|调试测试"

# 检查执行日志
tail -f .claude/logs/flow-*.log

# 验证系统健康状态
.claude/scripts/check-mcp-health.sh
```

## 📈 性能

- **并行处理**: 在可能的情况下并发执行子代理
- **增量备份**: 在重启操作期间仅备份更改的文件
- **智能缓存**: 具有可配置 TTL 的 WebFetch 内容缓存
- **后台进程**: 可选的 `npm run dev` 和 `npm run test:watch` 自动化

## 🤝 贡献

我们欢迎贡献！请：

1. Fork 仓库
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 遵循我们的编码标准并运行质量闸
4. 提交带有详细描述的 pull request

### 开发设置
```bash
# 克隆仓库
git clone https://github.com/Dimon94/cc-devflow.git
cd cc-devflow

# 复制到您的测试项目
cp -r .claude /path/to/your/test/project/

# 测试安装
cd /path/to/your/test/project
/flow-new "REQ-001|测试功能|"
```

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 基于 [Claude Code](https://claude.ai/code) 官方架构构建
- 受现代 DevOps 和 CI/CD 最佳实践启发
- 感谢 Claude AI 团队提供强大的开发平台

## 📞 支持

- **问题**: [GitHub Issues](https://github.com/Dimon94/cc-devflow/issues)
- **文档**: 查看 `.claude/docs/` 获取详细规格
- **社区**: 分享您的体验并从其他用户那里获得帮助

---

**🌟 如果 cc-devflow 帮助简化了您的开发工作流，请为此仓库点星！**
