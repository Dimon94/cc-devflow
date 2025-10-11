# CC DevFlow 插件

将本仓库作为 Claude Code 插件使用，提供 `/flow-*` 系列命令与研究型子代理（prd-writer、planner、qa-tester、security-reviewer、release-manager 等）。

## 安装与本地测试

1) 信任项目目录（Claude Code 会自动加载仓库级配置）

2) 在插件管理中添加本地市场并安装：

- 打开 `插件 → 管理插件`，选择“添加本地市场”并指向当前仓库
- 在“浏览插件”中找到 `CC DevFlow` 并安装/启用

或使用快速命令（如你的 Claude Code 版本支持）：

```text
plugin install cc-devflow@local
plugin enable cc-devflow@local
```

3) 验证安装：

- 运行 `/help` 查看新增命令是否可用
- 尝试 `/flow-init "REQ-001|测试功能|"` 验证工作流

## 插件内容结构

本插件直接复用仓库内的现有文件：

- 命令：`.claude/commands/flow-*.md`
- 子代理：`.claude/agents/*.md`
- 脚本与工具：`.claude/scripts/*.sh` 与 `.claude/tests/*`

## 团队集成建议

- 将该仓库添加到团队可信任目录后，成员打开项目即会统一加载配置
- 在 `.claude/settings.json` 中按需维护权限策略与工具白名单

## 参考

- Claude Code 插件系统与团队插件配置参考：官方文档（Plugins - Claude Docs）