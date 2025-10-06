# 🚀 cc-devflow

> Claude Code 一键需求开发流系统

基于 Claude Code 官方子代理、钩子和设置机制构建的完整开发工作流系统。通过单一命令将需求从规划转变为代码交付。

[中文文档](./README.zh-CN.md) | [English](./README.md)

## ✨ 核心特性

- **🎯 一键启动流程**: 使用 `/flow-new "REQ-123|功能标题|计划URLs"` 启动完整的需求开发
- **🔄 阶段化命令**: 6个独立阶段命令 (init/prd/epic/dev/qa/release)，精细化控制
- **📋 文档驱动**: 自动化 PRD → EPIC → TASKS → 实现链条
- **📝 模板驱动**: 自执行模板 (PRD_TEMPLATE, EPIC_TEMPLATE, TASKS_TEMPLATE) 内置生成流程
- **🔄 智能恢复**: 使用 `/flow-restart` 恢复中断的开发，用 `/flow-status` 监控进度
- **🛡️ 质量闸**: 自动化 TypeScript 检查、测试、代码检查和安全扫描
- **🤖 子代理编排**: 10 个专业研究型代理负责不同开发阶段
- **🔗 GitHub 集成**: 自动化 PR 创建、分支管理和规范化提交
- **📊 进度跟踪**: 实时状态监控和智能重启点
- **🌐 MCP 集成**: 无缝外部内容获取和 API 集成
- **⚡ 自动进度更新**: 基于代码变更和Git提交的智能进度检测
- **🔍 一致性验证**: 企业级一致性检查，智能冲突检测和自动修复建议
- **🧪 TDD 强制执行**: 严格的测试驱动开发，TEST VERIFICATION CHECKPOINT
- **📜 Constitution 合规**: 所有阶段强制执行宪法原则 (NO PARTIAL IMPLEMENTATION, NO CODE DUPLICATION 等)
- **🛠️ 统一脚本基础设施**: 所有代理和命令使用标准化 `.claude/scripts/` 接口

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

### 执行模型 (2025-01-10 更新)

**研究型代理 + 主代理**:
- **研究型代理 (10个)**: 只读分析，生成 Markdown 计划和报告
- **主代理 (Claude)**: 执行所有代码操作，拥有完整上下文
- **工作流程**: 代理研究 → 输出计划 → 主代理执行 → 迭代

**工具分配**:
- **研究型代理**: 仅 Read, Grep, Glob (分析)
- **主代理**: Edit, Write, Bash, Git (执行)

### 子代理工作流
```text
工作流指导 (标准操作程序)
├── prd-writer          → 研究需求，生成 PRD.md (必须使用 PRD_TEMPLATE)
├── planner             → 分析 PRD，生成 EPIC.md + TASKS.md (必须使用 EPIC_TEMPLATE, TASKS_TEMPLATE)
├── dev-implementer     → 研究代码库，生成 IMPLEMENTATION_PLAN.md (仅研究)
├── qa-tester           → 分析代码，生成 TEST_PLAN.md + TEST_REPORT.md
├── security-reviewer   → 安全分析，生成 SECURITY_PLAN.md + SECURITY_REPORT.md
├── release-manager     → 发布分析，生成 RELEASE_PLAN.md
├── impact-analyzer     → PRD 变更影响分析
├── compatibility-checker → 版本兼容性分析
├── consistency-checker → 企业级一致性验证
└── bug-analyzer        → BUG 根因分析 (支持 JSON)
```

### 统一脚本基础设施 (新增)
所有代理和命令使用标准化脚本:

```text
.claude/scripts/
├── common.sh                    # 核心函数 (log_event, get_repo_root)
├── check-prerequisites.sh       # 前置条件验证，路径获取
├── setup-epic.sh                # Epic/Tasks 结构初始化
├── check-task-status.sh         # 任务状态和进度追踪
├── mark-task-complete.sh        # 任务完成标记
├── generate-status-report.sh    # 状态报告生成
├── validate-constitution.sh     # Constitution 合规性检查
└── recover-workflow.sh          # 工作流恢复逻辑
```

**优势**:
- **一致性**: 所有操作使用相同代码路径
- **可测试性**: 脚本有全面的测试覆盖 (100% 通过率)
- **可维护性**: 集中化逻辑，更易更新
- **JSON 支持**: `--json` 标志用于程序化解析

### 模板驱动开发 (新增)

**自执行模板**: 每个模板包含自己的执行流程

```text
.claude/docs/templates/
├── PRD_TEMPLATE.md              # 产品需求 (10步执行流程)
├── EPIC_TEMPLATE.md             # Epic 规划 (10步执行流程)
├── TASKS_TEMPLATE.md            # 任务分解 (TDD 顺序阶段)
├── TASK_EXECUTABLE_TEMPLATE.md  # 任务执行 (5阶段 TDD 流程)
└── BUG_TEMPLATE.md              # BUG 分析和修复
```

**模板使用**:
1. 代理读取模板
2. 遵循执行流程步骤
3. 生成完整文档
4. 无占位符未填充
5. 通过验证清单

### 质量闸
- **推送前保护**: TypeScript、测试、代码检查、安全、构建验证
- **Markdown 格式化器**: 自动文档格式化和语言检测
- **规范化提交**: 标准化提交消息格式强制执行
- **一致性验证**: 跨文档一致性检查和冲突检测
- **Constitution 合规**: 每个阶段强制执行 (NO PARTIAL IMPLEMENTATION, NO CODE DUPLICATION 等)
- **TDD 检查点**: 实现前的 TEST VERIFICATION CHECKPOINT

### 文档结构
```text
devflow/requirements/${REQ-ID}/
├── orchestration_status.json  # 状态管理 (阶段、进度、时间戳)
├── EXECUTION_LOG.md           # 完整审计轨迹
├── PRD.md                     # 产品需求文档 (来自 PRD_TEMPLATE)
├── EPIC.md                    # Epic 规划和分解 (来自 EPIC_TEMPLATE)
├── TASKS.md                   # 单一统一任务列表 (来自 TASKS_TEMPLATE)
│                              # - 所有任务按 TDD 顺序 (Phase 1-5)
│                              # - 依赖关系清晰标记
│                              # - [P] 标签表示并行任务
│                              # - 包含 TEST VERIFICATION CHECKPOINT
├── tasks/                     # 任务执行产物
│   ├── TASK_001.completed     # 空标记文件
│   ├── TASK_002.completed
│   └── IMPLEMENTATION_PLAN.md # dev-implementer 的技术计划
├── research/                  # 外部研究材料 (MCP 抓取)
├── TEST_PLAN.md               # QA 测试策略
├── TEST_REPORT.md             # QA 测试结果
├── SECURITY_PLAN.md           # 安全审查计划
└── SECURITY_REPORT.md         # 安全扫描结果
```

**关键变更**:
- **orchestration_status.json**: 统一状态文件 (替代分散的状态文件)
- **TASKS.md**: 所有任务的单一文件 (替代多个 TASK_*.md)
- **tasks/*.completed**: 简单完成标记 (替代复杂任务状态)
- **IMPLEMENTATION_PLAN.md**: dev-implementer 代理的技术计划

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

## 🧪 测试框架

cc-devflow 包含完整的测试框架，所有核心脚本均达到 **100% 测试覆盖率**。

### 测试套件 (8/8 全部通过)

| 测试套件 | 测试用例数 | 覆盖范围 | 状态 |
|----------|-----------|---------|------|
| `test_check_prerequisites` | 18 | 前置条件验证 | ✅ 100% |
| `test_check_task_status` | 18 | 任务状态跟踪 | ✅ 100% |
| `test_common` | 15 | 通用工具库 | ✅ 100% |
| `test_generate_status_report` | - | 状态报告生成 | ✅ 100% |
| `test_mark_task_complete` | 15 | 任务完成标记 | ✅ 100% |
| `test_recover_workflow` | - | 工作流恢复 | ✅ 100% |
| `test_setup_epic` | 13 | Epic 初始化 | ✅ 100% |
| `test_validate_constitution` | 4 | Constitution 检查 | ✅ 100% |

### 运行测试

```bash
# 运行所有测试套件
bash .claude/tests/run-all-tests.sh --scripts

# 运行特定测试套件
bash .claude/tests/scripts/test_check_prerequisites.sh

# 详细输出模式
VERBOSE=true bash .claude/tests/run-all-tests.sh --scripts
```

### 测试框架特性

- **隔离测试环境**: 每个测试在干净的临时目录中运行
- **Mock 系统**: 完整的 Git mock 和函数 stub 支持
- **Exit Code 捕获**: 通过 temp file 模式可靠捕获退出码
- **断言库**: 丰富的断言集合（equals、contains、JSON 验证等）
- **自动清理**: 自动清理测试资源
- **彩色输出**: 清晰的可视化测试结果反馈

### 关键测试模式

**Exit Code 捕获模式**:
```bash
local output_file="$TEST_TMP_DIR/output.txt"
local exit_code_file="$TEST_TMP_DIR/exitcode.txt"

(
    command_to_test > "$output_file" 2>&1
    echo $? > "$exit_code_file"
)

local output=$(cat "$output_file")
local exit_code=$(cat "$exit_code_file")
```

**Git Mock**:
```bash
# Mock git 命令
mock_git "rev-parse --show-toplevel" "/fake/repo/path"

# Git 命令现在返回 mock 值
git rev-parse --show-toplevel  # 返回: /fake/repo/path
```

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
