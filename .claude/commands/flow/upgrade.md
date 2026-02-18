---
name: flow-upgrade
description: 'PRD version management, analysis, and application workflow. Usage: /flow:upgrade "REQ-123" --analyze or --version="2.0.0" --reason="..."'
scripts:
  prereq: .claude/scripts/check-prerequisites.sh
  manage_constitution: .claude/scripts/manage-constitution.sh
  validate_constitution: .claude/scripts/validate-constitution.sh
  impact_analyzer: .claude/scripts/analyze-upgrade-impact.sh
---

# Flow-Upgrade - PRD 版本管理工作流

## User Input
```text
$ARGUMENTS = "REQ_ID [--analyze] [--version=SEMVER] [--reason='...'] [--rollback=SEMVER] [--compatibility --target=SEMVER]"
```

## 模式
- `--analyze [--format=json] [--compare=version]`
- `--version=SEMVER --reason="text" [--force]`
- `--rollback=SEMVER [--confirm]`
- `--compatibility [--target=SEMVER] [--baseline=SEMVER]`

## 执行流程

### 阶段 1: Entry Gate
```
1. 参数解析
   → 校验 REQ_ID、版本字符串 (SemVer)、必需理由 (--reason) 等。

2. 前置检查
   → Run: {SCRIPT:prereq} --json --require-prd
   → 确认 PRD.md、versions/ 历史目录存在。
   → Git 工作区需干净（除非只做 analyze）。

3. 状态确认
   → orchestration_status.status 至少为 "initialized"。
   → 若后续流程在开发阶段进行，提示可能影响当前迭代。
```

### 阶段 2A: 分析模式 (--analyze)
```
1. 调用 {SCRIPT:impact_analyzer} --req "${REQ_ID}" --compare "${VERSION?}" --format "${FORMAT}"
2. 输出:
   → change_detection_*.md
   → impact_assessment_*.md
   → upgrade_recommendation_*.md （建议版本 bump: major/minor/patch）
3. 若 --format=json，打印 JSON 摘要供 CLI 解析。
```

### 阶段 2B: 升级模式 (--version)
```
1. 版本验证
   → SemVer 合法、未占用。
   → 提供 --reason。
   → 若存在 breaking changes 且版本 bump 不够大 → 拒绝或要求 --force。

2. 自动分析
   → 执行分析模式，生成影响报告。
   → {SCRIPT:validate_constitution} --type prd --severity warning

3. 版本快照
   → 创建 devflow/requirements/${REQ}/versions/vX.Y.Z/
   → 拷贝 PRD.md、TECH_DESIGN.md 等相关文档。
   → 生成 CHANGELOG 位于 versions/。

4. 元数据更新
   → 更新 PRD.md 头部版本号、修订日期。
   → orchestration_status.version = "vX.Y.Z"、lastUpgradeReason。
   → EXECUTION_LOG.md 记录升级摘要。

5. 触发后续动作
   → 提示重新运行 `/flow:spec`、`/flow:dev`、`/flow:verify` 等受影响阶段。
```

### 阶段 2C: 回滚 (--rollback)
```
1. 确认目标版本存在。
2. 如未指定 --confirm，提示用户确认。
3. 将版本目录内容恢复至当前 PRD。
4. 更新版本号、记录回滚原因。
```

### 阶段 2D: 兼容性检查 (--compatibility)
```
1. 比对基线与目标版本的差异。
2. 输出兼容性矩阵（API、数据模型、非功能需求）。
3. 标记潜在迁移任务。
```

### 阶段 3: Exit Gate
```
1. 核验版本快照目录、CHANGELOG、影响报告是否生成。
2. 若版本号更新成功，提示下一步（重新跑 `/flow:spec` / `/flow:dev` / `/flow:verify`）。
3. 失败时保持原状态，给出恢复指引。
```

## 输出
```
✅ versions/vX.Y.Z/ (含 PRD/TECH_DESIGN 快照、CHANGELOG)
✅ impact_assessment_*.md / upgrade_recommendation_*.md
✅ orchestration_status.json 更新 (version, lastUpgradeAt, reason)
✅ EXECUTION_LOG.md 记录
```

## 错误处理
- 版本号不合法或已存在 → 终止并提示示例。
- breaking change 但版本 bump 不够 → 要求确认或提升版本级别。
- Git 不干净 → 拒绝升级，要求先提交/清理。
- 影响分析脚本失败 → 续写日志并保持现状。

## 下一步
- 若版本包含重大变更：立即通知团队重新生成技术方案和规划。
- 使用 `/flow:status` 检查其他需求是否依赖该版本。
- 需要宪法变更时调用 `/flow:constitution --amend`。
