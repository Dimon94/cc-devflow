# 🚀 快速开始指南

## 📦 安装

### 方式 1: 使用 npx（推荐）

```bash
npx tiged Dimon94/cc-devflow/.claude .claude
```

### 方式 2: 手动下载

```bash
curl -L https://github.com/Dimon94/cc-devflow/archive/main.zip -o cc-devflow.zip
unzip cc-devflow.zip
cp -r cc-devflow-main/.claude .claude
rm -rf cc-devflow.zip cc-devflow-main
```

## ✅ 验证安装

```bash
.claude/scripts/verify-setup.sh
```

**预期输出**:
```
✅ All checks passed!
cc-devflow is ready to use.
```

## 🎮 交互式演示

运行完整演示了解工作流：

```bash
python3 .claude/scripts/demo.py
```

## 🎯 第一个需求

### 1. 启动需求开发

```bash
/flow-new "REQ-001|用户认证功能|https://docs.example.com/auth"
```

### 2. 查看进度

```bash
/flow-status REQ-001
```

### 3. 如果中断，恢复开发

```bash
/flow-restart "REQ-001"
```

### 4. 验证一致性

```bash
/flow-verify "REQ-001"
```

### 5. 执行 QA

```bash
/flow-qa "REQ-001"
```

### 6. 创建发布

```bash
/flow-release "REQ-001"
```

## 📋 核心脚本

```bash
# 快速环境检查
bash .claude/scripts/check-prerequisites.sh

# 查看任务状态
bash .claude/scripts/check-task-status.sh --verbose

# 标记任务完成
bash .claude/scripts/mark-task-complete.sh T001

# 生成状态报告
bash .claude/scripts/generate-status-report.sh --format markdown

# 验证 Constitution 合规
bash .claude/scripts/manage-constitution.sh verify
```

## 🧪 运行测试

```bash
# 运行所有脚本测试
bash .claude/tests/run-all-tests.sh --scripts

# 运行 Constitution 测试
bash .claude/tests/constitution/run_all_constitution_tests.sh

# 运行特定测试
bash .claude/tests/scripts/test_check_prerequisites.sh
```

## ⚙️ 基础配置

最小配置 (`.claude/settings.json`):

```json
{
  "permissions": {
    "allowGitOperations": true,
    "allowNetworkRequests": true,
    "allowSubprocesses": true
  }
}
```

## 🚨 常见问题

### Q: 安装后命令无法识别？

**A**: 确保在项目根目录执行命令，且 `.claude/` 目录存在。

### Q: Git 仓库未初始化？

**A**: 先初始化 Git 仓库：
```bash
git init
git add .
git commit -m "Initial commit"
```

### Q: 权限不足？

**A**: 给脚本添加执行权限：
```bash
chmod +x .claude/scripts/*.sh
chmod +x .claude/hooks/*.sh
```

## 📚 下一步

- [完整命令参考](../commands/README.md)
- [工作流详解](./workflow-guide.md)
- [最佳实践](./best-practices.md)
- [故障排查](./troubleshooting.md)
