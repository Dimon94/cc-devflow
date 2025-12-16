# REQ-003 Internal Codebase Overview

## 调研时间
2025-12-16

## 关键发现

### 1. 现有分支命名逻辑

**位置**: `.claude/scripts/common.sh:180-195`

```bash
# 当前 slugify() 函数
slugify() {
    local input="$1"
    if [[ -z "$input" ]]; then
        echo ""
        return
    fi

    # Convert to lowercase and replace non-alphanumeric characters with hyphen
    local slug
    slug=$(printf '%s' "$input" | tr '[:upper:]' '[:lower:]')
    slug=$(printf '%s' "$slug" | sed 's/[^a-z0-9]/-/g')  # <-- 问题所在：中文被直接替换
    # Collapse repeated hyphens and trim edges
    slug=$(echo "$slug" | sed 's/-\{2,\}/-/g; s/^-//; s/-$//')

    echo "$slug"
}
```

**问题**:
- 中文字符被 `sed 's/[^a-z0-9]/-/g'` 全部替换为 `-`
- 输入 "用户登录功能" → 输出 "----" (多个连字符被折叠为空)
- Git 分支名变成 `feature/REQ-003-` (无有效标识)

### 2. 调用点

**位置**: `.claude/scripts/create-requirement.sh:357-360`

```bash
if [[ -n "$TITLE" ]]; then
    BRANCH_SUFFIX=$(slugify "$TITLE")
    if [[ -z "$BRANCH_SUFFIX" ]]; then
        BRANCH_SUFFIX="new-requirement"
    fi
fi
```

**分支生成逻辑**:
- `feature/REQ-XXX-${BRANCH_SUFFIX}` (需求)
- `bugfix/BUG-XXX-${BRANCH_SUFFIX}` (缺陷)

### 3. 技术栈分析

**当前项目**:
- 纯 Bash 脚本，无 Node.js 运行时依赖
- 没有 `package.json`
- 可选方案:
  1. **方案 A**: 集成 Node.js + pinyin-pro (需要安装依赖)
  2. **方案 B**: 纯 Bash + 内置拼音映射表 (无外部依赖)
  3. **方案 C**: Python + pypinyin (系统已安装 Python3)

### 4. 相关文件清单

| 文件 | 用途 | 修改范围 |
|------|------|----------|
| `.claude/scripts/common.sh` | 核心工具函数 | `slugify()` 函数改造 |
| `.claude/scripts/create-requirement.sh` | 需求创建脚本 | 调用方无需修改 |
| `lib/git-utils.js` | 待创建 (ROADMAP 中提到) | 可选，如果采用 Node.js 方案 |
| `tests/git-utils.test.js` | 待创建 | 单元测试 |

### 5. 测试覆盖情况

**现有测试**: 无专门针对 `slugify()` 的单元测试

**需要添加的测试用例**:
- 纯中文: "用户登录功能" → "yong-hu-deng-lu-gong-neng"
- 混合: "OAuth2认证" → "oauth2-ren-zheng"
- 多音字: "重庆" → "chong-qing" (非 "zhong-qing")
- 特殊字符: "测试@#$%功能" → "ce-shi-gong-neng"
- 数字保留: "API2.0接口" → "api2-0-jie-kou"

### 6. 兼容性考虑

**向后兼容**:
- 现有英文分支命名逻辑不变
- 只增强中文处理能力

**Git 限制**:
- 分支名不能包含空格、`~`, `^`, `:`, `?`, `*`, `[`, `\`
- 不能以 `.` 或 `-` 开头
- 不能包含连续 `..`

## 待调研问题

| ID | 问题 | 状态 |
|----|------|------|
| R001 | pinyin-pro vs pypinyin 性能和准确性对比? | OPEN |
| R002 | 多音字词典大小和维护成本? | OPEN |
| R003 | 是否需要处理繁体中文? | OPEN |
| R004 | 分支名长度限制? (Git 通常 250 字符) | OPEN |

## 建议方案

优先推荐 **方案 C (Python + pypinyin)**:
1. 项目已使用 Python3 (common.sh 中有 python3 调用)
2. pypinyin 是成熟库，支持多音字
3. 不引入新的运行时依赖
4. 可嵌入 Bash 脚本中作为辅助函数
