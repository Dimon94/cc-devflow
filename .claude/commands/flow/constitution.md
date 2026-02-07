---
name: flow-constitution
description: 'Manage CC-DevFlow Constitution. Usage: /flow-constitution [--article I] [--amend --proposal file] [--apply --version TYPE]'
scripts:
  manage: .claude/scripts/manage-constitution.sh
---

# Flow-Constitution - 宪法管理命令

## User Input
```text
$ARGUMENTS = "[--article I] [--verify] [--impact-report] [--amend --proposal path] [--apply --version TYPE] [--history]"
```

## 执行原则
- 所有功能均由 `{SCRIPT:manage}` 执行；此文档仅说明入口与参数。
- Article 编号遵循罗马数字 I-X。
- 版本类型：MAJOR / MINOR / PATCH（SemVer 语义）。

## 常用命令
```text
/flow-constitution                      → show 当前版本
/flow-constitution --article IV         → show 指定 Article
/flow-constitution --verify             → verify 全局一致性
/flow-constitution --impact-report      → impact 分析
/flow-constitution --history            → 历史
/flow-constitution --amend --proposal amendments/2025-01-10-observability.md
/flow-constitution --apply --version MINOR
/flow-constitution --apply --version PATCH --force
```

## 执行流程（由脚本实现）

### 1. Show / Article
```
→ {SCRIPT:manage} show [ARTICLE]
→ 输出当前版本、修订日期、指定 Article 内容
```

### 2. Verify
```
→ {SCRIPT:manage} verify
→ 检查所有模板/代理/脚本的 Constitution 版本号一致
→ 调用 validate-constitution hooks，如有违规列出文件
```

### 3. Impact Report
```
→ {SCRIPT:manage} impact
→ 汇总即将应用的修正案对模板/代理/脚本的影响
→ 生成报告 (amendments/impact_*.md)
```

### 4. Amend
```
→ {SCRIPT:manage} amend <proposal>
→ 校验提案格式（版本建议、动机、影响、迁移策略）
→ 输出预览并提示下一步（apply 之前需人工 review）
```

### 5. Apply
```
→ {SCRIPT:manage} apply <TYPE>
→ 更新 .claude/rules/project-constitution.md 版本号
→ 触发模板/代理/脚本同步
→ 生成 Sync Report
```

### 6. History
```
→ {SCRIPT:manage} history
→ 列出版本历史与修订摘要
```

## 错误处理
- 未提供必要参数（如 --proposal）→ 脚本返回错误提示。
- Invalid version bump → 阻断，要求遵循 MAJOR/MINOR/PATCH。
- 验证失败（如模板未同步）→ 返回违规清单，用户需手动修复。

## 下一步
- 需要向项目传播修订时，先运行 `--impact-report`，与团队确认后再 `--apply`。
- 应用后建议运行 `/flow-verify --all` 确认所有需求遵循最新宪法。
