# 为 cc-devflow 做贡献

[中文版](./CONTRIBUTING.zh-CN.md) | [English](./CONTRIBUTING.md)

---

## 概览

cc-devflow 现在是一个 skills-first 仓库，并且重新带回了可分发的 CLI。

对外可见面只有这些：

- `cc-roadmap`
- `cc-plan`
- `cc-investigate`
- `cc-do`
- `cc-check`
- `cc-act`
- `cc-devflow init`
- `cc-devflow adapt`

`lib/skill-runtime/` 可以保留共享运行时支撑，但它已经不是用户要直接理解或运行的工作流入口。

仓库里也可以存在维护类 Skill，例如 `docs-sync`，但它们不改变公开的 `cc-roadmap + PDCA/IDCA` 叙事。

---

## 开发环境

### 前置条件

- Node.js 18+
- npm
- Git

### 安装

```bash
git clone https://github.com/YOUR_USERNAME/cc-devflow.git
cd cc-devflow
npm install
```

### 本地 CLI 冒烟验证

如果你在源码仓库里开发，请使用仓库内入口：

```bash
node bin/cc-devflow-cli.js --help
tmpdir=$(mktemp -d)
node bin/cc-devflow-cli.js init --dir "$tmpdir"
node bin/cc-devflow-cli.js adapt --cwd "$tmpdir" --platform codex
rm -rf "$tmpdir"
```

如果要验证打包后的行为，运行：

```bash
npm pack
node scripts/validate-publish.js
```

---

## 项目结构

```text
cc-devflow/
├── .claude/skills/            # 对外分发的 Skill
├── bin/                       # CLI 入口
├── config/                    # Adapter 配置
├── docs/                      # 公开文档
├── lib/adapters/              # 平台适配层
├── lib/compiler/              # 多平台编译器
├── lib/skill-runtime/         # 供 Skill 脚本复用的共享运行时
├── test/skill-runtime/        # CLI 与运行时回归测试
├── README.md
├── README.zh-CN.md
└── package.json
```

### 常见贡献区域

- `.claude/skills/`：Skill 行为、资源、引用、脚本
- `bin/`：可分发 CLI 行为
- `lib/compiler/`：skills/prompts 解析、转换、emitters、rules 生成
- `lib/adapters/`：平台 adapter 配置与校验
- `lib/skill-runtime/`：Skill 脚本复用的共享运行时支撑
- `docs/`：对外文档

---

## 贡献规则

### 1. 保持对外入口极简

不要再把旧 `/flow:*` 或 `harness:*` CLI 写回新的用户文档。

对外故事应该始终保持为：

- 整包安装：`cc-devflow init`
- 平台产物：`cc-devflow adapt`
- 工作流执行：`cc-roadmap + PDCA/IDCA` 可见 Skill

### 2. 保持 Skills-First 结构

每个已发布 Skill 都应保持独立目录：

```text
.claude/skills/<skill>/
├── SKILL.md
├── PLAYBOOK.md
├── assets/
├── references/
└── scripts/
```

如果你改了一个已发布 Skill，要把这些文件当成同一个契约：

- `SKILL.md`
- 本地 `CHANGELOG.md`
- 被引用的 `PLAYBOOK.md`、`assets/`、`references/`、`scripts/`

不要只改其中一部分，让其余说明继续过期。

### 3. 保持分发包干净

不要把瞬态文件放进模板或 tarball。

典型脏文件包括：

- `.claude/tsc-cache/`
- `.DS_Store`
- 本地编辑器和操作系统产生的垃圾文件

### 4. 让运行时辅助层保持次要

如果你改了 `lib/skill-runtime/`，请保持可测试，但不要再把它写成用户主入口。真正的公开 workflow 仍然属于已发布 Skill。

---

## 测试

### 主测试命令

```bash
npm test
```

### CLI 回归测试

```bash
npm test -- --runInBand test/skill-runtime/cli-bootstrap.test.js
```

### 发布校验

```bash
node scripts/validate-publish.js
```

它应该保证：

- CLI 必需文件存在
- 关键 Skill 存在
- 打包 tarball 干净
- 瞬态缓存不会被分发

---

## 文档规则

- README 和快速开始默认写打包后 CLI 的用法
- 贡献者文档才写 `node bin/cc-devflow-cli.js ...`
- `skills.sh` 只作为单 Skill 分发路径来写
- 不要把 `.claude/commands/` 写成必需结构
- 不要把内部运行时辅助层写成受支持的公开工作流
- 如果改了已发布 Skill，在同一个 PR 里同步该 Skill 的 `version`、本地 `CHANGELOG.md` 和受影响的公开文档
- 主 workflow 仍然只讲 `cc-roadmap + PDCA/IDCA`；维护类 Skill 单独说明

---

## Pull Request

这个仓库比较好的 PR，通常会干净地只做一类事：

- 改进某个 Skill
- 修复 CLI 分发行为
- 修复编译器 / 适配行为
- 清理陈旧文档
- 增加有针对性的回归测试

如果改动触碰了公开入口，记得在同一个 PR 里同步文档。
