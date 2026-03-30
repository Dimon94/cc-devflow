# CC-DevFlow 工作流约定

> **类型**: Workflow Conventions
> **适用**: CC-DevFlow 当前主链
> **前置**: 遵循 Constitution 与 `.claude/DRIFT_AUDIT.md`

---

## 🎯 核心约定

### REQ-ID 格式
- 使用 `REQ-\d+`，例如 `REQ-123`
- 在当前仓库范围内必须唯一

### 命令入口
```bash
# 模糊目标，先收敛
/flow:autopilot "REQ-123|支持用户下单"

# 已收敛需求，走手动主链
/flow:init "REQ-123|支持用户下单|https://plan.example.com/Q1"
/flow:spec "REQ-123"
/flow:dev "REQ-123"
/flow:verify "REQ-123" --strict
/flow:prepare-pr "REQ-123"
/flow:release "REQ-123"
```

---

## 📁 文件组织约定

### 主状态面
```text
devflow/intent/${reqId}/
├── summary.md
├── facts.md
├── decision-log.md
├── plan.md
├── resume-index.md
├── delegation-map.md
├── checkpoints/
└── artifacts/
    ├── results/
    └── pr-brief.md

devflow/requirements/${reqId}/
├── context-package.md         # bootstrap bridge artifact
├── harness-state.json
├── TASKS.md                   # 可选，planner 直接输入 / 人类镜像
├── task-manifest.json         # 执行真相源
├── report-card.json
└── RELEASE_NOTE.md
```

### 真相源约定
- 模糊目标与恢复入口：优先看 `devflow/intent/${reqId}/`
- requirement 生命周期：优先看 `harness-state.json`
- 执行状态：优先看 `task-manifest.json` 和 `.harness/runtime/`
- 验证结论：优先看 `report-card.json`
- `context-package.md` 只负责 bootstrap，不承载长期产品判断
- `TASKS.md` 不是必需真相源；若存在，只是 planner 输入或可读镜像

---

## 🤖 委派约定

### 默认执行梯
```text
direct -> delegate -> team
```

- `direct`: 默认路径，适合小任务和短上下文
- `delegate`: 任务边界清晰、可并行时使用本地 worker/subagent
- `team`: 仅在多角色判断明显有价值时升级，不是默认系统

### 状态同步
- worker handoff 与结果写入 `devflow/intent/${reqId}/artifacts/`
- 每个任务完成后必须回写 manifest 状态或 task result
- 所有恢复优先读 `resume-index.md`

---

## ⚠️ 错误处理约定

### 错误恢复
```bash
/flow:autopilot "REQ-123|继续当前自动驾驶" --resume
/flow:dev "REQ-123" --resume
/flow:restart "REQ-123" --from=dev
```

### 原则
- 不靠聊天历史猜状态
- 不跳过验证闸门
- 没有 artifact 证据，不算完成

---

## 🌿 Git 约定

> Git 分支、worktree、PR、合并由用户自行管理；DevFlow 只产出可审计工件与 PR-ready 材料。

---

## 🔧 工具集成约定

### 钩子脚本
- `.claude/hooks/inject-agent-context.ts`: 注入当前 agent 上下文
- `.claude/hooks/inject-skill-context.ts`: 注入当前 skill 上下文
- `.claude/hooks/ralph-loop.ts`: Team 协作循环与节奏控制

### 测试脚本
- `.claude/tests/run-all-tests.sh`: 运行所有测试
- `.claude/tests/scripts/test_*.sh`: 单个测试套件

---

## 🛠️ 故障排除约定

### 环境检查
```bash
# 检查 Git 状态
git status

# 检查 GitHub CLI
gh auth status

# 检查 npm 脚本
npm run --silent

# 检查权限
ls -la .claude/
```

### 日志查看
```bash
# 查看恢复入口
cat devflow/intent/REQ-123/resume-index.md

# 查看 task 结果工件
ls -la devflow/intent/REQ-123/artifacts/results/

# 查看 runtime 事件
ls -la .harness/runtime/REQ-123/
```

---

## 📋 最佳实践清单

### 开始新需求前
- [ ] 确认 REQ-ID 唯一性
- [ ] 准备完整的需求输入 (标题 + 可选URL)
- [ ] 确保 Git 工作目录干净
- [ ] 在 main 分支上启动

### 开发过程中
- [ ] 遵循 TDD 顺序 (Tests First → Implementation)
- [ ] 每个任务完成后立即提交
- [ ] 定期同步主分支
- [ ] 及时更新文档

### 发布前检查
- [ ] 所有测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] 安全扫描无高危问题
- [ ] 文档完整且格式正确

---

**重要提示**: 所有约定都是强制性的。这些约定确保 CC-DevFlow 工作流的一致性和可预测性。
