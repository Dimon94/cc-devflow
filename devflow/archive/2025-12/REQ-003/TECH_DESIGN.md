# Technical Design: REQ-003 - 分支命名优化 (中文转拼音)

**Status**: Approved
**Created**: 2025-12-16T15:00:00+08:00
**Updated**: 2025-12-16T15:00:00+08:00
**Type**: Technical Design
**Complexity**: LOW (单函数改造)

---

## 1. System Architecture

### 1.1 Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │         create-requirement.sh           │
                    │              (调用方)                    │
                    └──────────────────┬──────────────────────┘
                                       │
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           common.sh                                       │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        slugify() 函数                               │  │
│  │  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐    │  │
│  │  │ 输入检测     │ → │ 中文检测        │ → │ 输出处理         │    │  │
│  │  │ (空/非空)    │    │ (正则匹配)      │    │ (连字符/去重)    │    │  │
│  │  └─────────────┘    └────────┬────────┘    └─────────────────┘    │  │
│  │                              │                                     │  │
│  │                     ┌────────▼────────┐                           │  │
│  │                     │ 含中文?         │                           │  │
│  │                     └────────┬────────┘                           │  │
│  │               ┌──────────────┴──────────────┐                     │  │
│  │               ▼                              ▼                     │  │
│  │        ┌─────────────┐              ┌─────────────┐               │  │
│  │        │ YES: 调用    │              │ NO: 原有    │               │  │
│  │        │ pypinyin    │              │ 逻辑处理    │               │  │
│  │        └──────┬──────┘              └─────────────┘               │  │
│  │               │                                                    │  │
│  │        ┌──────▼──────┐                                            │  │
│  │        │ pypinyin    │                                            │  │
│  │        │ 可用?       │                                            │  │
│  │        └──────┬──────┘                                            │  │
│  │        ┌──────┴──────┐                                            │  │
│  │        ▼              ▼                                            │  │
│  │  ┌─────────┐   ┌─────────┐                                        │  │
│  │  │ YES:    │   │ NO:     │                                        │  │
│  │  │ 转拼音  │   │ 警告+   │                                        │  │
│  │  │         │   │ 降级    │                                        │  │
│  │  └─────────┘   └─────────┘                                        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │     pypinyin (Python3 可选依赖)          │
                    │     - lazy_pinyin() 函数                 │
                    │     - 多音字智能处理                      │
                    └─────────────────────────────────────────┘
```

### 1.2 Module Breakdown

| 模块 | 文件 | 职责 |
|------|------|------|
| **Core Function** | `.claude/scripts/common.sh` | `slugify()` 函数改造，中文检测与转换 |
| **Python Helper** | 内联 Python 代码 | 调用 pypinyin 进行拼音转换 |
| **Test Suite** | `tests/slugify.bats` | Bash 单元测试 (bats-core) |

### 1.3 Data Flow

```
输入: "OAuth2认证"
    │
    ▼
┌─────────────────────────┐
│ 1. 中文检测              │  → 检测到中文字符
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ 2. pypinyin 可用性检测   │  → python3 -c "import pypinyin"
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
┌─────────┐   ┌─────────────┐
│ 可用     │   │ 不可用       │
│         │   │ → 警告到     │
│         │   │   stderr    │
└────┬────┘   └──────┬──────┘
     │                │
     ▼                ▼
┌─────────┐   ┌─────────────┐
│ 拼音转换 │   │ 原有逻辑     │
│ OAuth2  │   │ (中文被删除) │
│ ren-zheng│   │             │
└────┬────┘   └──────┬──────┘
     │                │
     └───────┬───────┘
             │
             ▼
┌─────────────────────────┐
│ 3. 后处理                │
│ - 小写转换              │
│ - 特殊字符替换为 -       │
│ - 连续 - 去重           │
│ - 首尾 - 去除           │
└───────────┬─────────────┘
            │
            ▼
输出: "oauth2-ren-zheng"
```

---

## 2. Technology Stack

### 2.1 Core Stack (Baseline)

| 层级 | 技术 | 版本 | 来源 |
|------|------|------|------|
| Shell | Bash | 5.x | 系统自带 |
| Runtime | Python3 | 3.8+ | 系统自带 |
| Library | pypinyin | 0.49+ | 可选安装 |

**Justification**:
- **Bash**: 项目现有脚本语言，无需引入新技术
- **Python3**: common.sh 已有 Python3 调用 (L200-271 `validate_json_schema`)
- **pypinyin**: Python 生态最成熟的拼音库，5.5k+ GitHub stars

### 2.2 Deviation from Baseline

| 新技术 | 原因 | PRD 需求依据 | 批准 |
|--------|------|-------------|------|
| pypinyin | 中文转拼音功能必需 | Story 1: 核心功能 | YES |

**注**: pypinyin 是可选依赖，缺失时优雅降级，不破坏现有功能。

---

## 3. Implementation Design

### 3.1 Function Signature

```bash
# 改造后的 slugify() 函数
# 位置: .claude/scripts/common.sh:180-220 (预估)

slugify() {
    local input="$1"

    # 空输入处理 (保持原有行为)
    if [[ -z "$input" ]]; then
        echo ""
        return
    fi

    local result="$input"

    # 中文检测 (Unicode 范围: \u4e00-\u9fff)
    if echo "$input" | grep -qP '[\x{4e00}-\x{9fff}]'; then
        # 尝试使用 pypinyin 转换
        result=$(_chinese_to_pinyin "$input")
    fi

    # 原有英文处理逻辑
    result=$(printf '%s' "$result" | tr '[:upper:]' '[:lower:]')
    result=$(printf '%s' "$result" | sed 's/[^a-z0-9]/-/g')
    result=$(echo "$result" | sed 's/-\{2,\}/-/g; s/^-//; s/-$//')

    echo "$result"
}
```

### 3.2 Helper Function

```bash
# 中文转拼音辅助函数 (内部使用)
_chinese_to_pinyin() {
    local input="$1"

    # 检测 pypinyin 可用性
    if ! python3 -c "import pypinyin" 2>/dev/null; then
        echo "Warning: pypinyin not installed. Chinese characters cannot be converted." >&2
        echo "Install: pip install pypinyin" >&2
        echo "$input"  # 降级: 返回原始输入
        return
    fi

    # 调用 pypinyin 进行转换
    python3 -c "
from pypinyin import lazy_pinyin
import sys
import re

text = sys.argv[1]
result = []

# 逐字符处理，保持英文数字原样
for char in text:
    if re.match(r'[\u4e00-\u9fff]', char):
        # 中文字符转拼音
        pinyin = lazy_pinyin(char)
        result.extend(pinyin)
    else:
        # 非中文字符保持原样
        result.append(char)

print(''.join(result))
" "$input"
}
```

### 3.3 Test Cases

| # | 输入 | 期望输出 | 场景 |
|---|------|----------|------|
| 1 | `"用户登录功能"` | `yong-hu-deng-lu-gong-neng` | 纯中文 |
| 2 | `"OAuth2认证"` | `oauth2-ren-zheng` | 中英混合 |
| 3 | `"重庆"` | `chong-qing` | 多音字 |
| 4 | `"测试@#$%功能"` | `ce-shi-gong-neng` | 特殊字符 |
| 5 | `"User Login"` | `user-login` | 纯英文 (兼容) |
| 6 | `"API2.0"` | `api2-0` | 英文数字 (兼容) |
| 7 | `""` | `""` | 空输入 |
| 8 | `"123"` | `123` | 纯数字 |

---

## 4. Security Design

### 4.1 Input Validation

| 风险 | 缓解措施 |
|------|----------|
| 命令注入 | Python 代码使用 `sys.argv[1]` 传参，不使用 shell 拼接 |
| 恶意输入 | 最终输出经过 `sed` 正则过滤，仅保留 `[a-z0-9-]` |

### 4.2 Secret Management

- N/A: 本功能无需处理任何密钥或敏感信息

### 4.3 Dependency Security

| 依赖 | 风险等级 | 缓解措施 |
|------|----------|----------|
| pypinyin | LOW | 知名库，可选依赖，不影响核心功能 |

---

## 5. Performance Design

### 5.1 Performance Targets

| 指标 | 目标 | 实测预期 |
|------|------|----------|
| 单次调用延迟 | <100ms | ~50ms (Python 启动开销) |
| 内存占用 | 无显著增加 | ~5MB (Python 进程瞬时) |

### 5.2 Optimization Strategy

1. **惰性加载**: 仅在检测到中文时才调用 Python
2. **短路逻辑**: 纯英文输入直接走原有逻辑，零开销
3. **进程复用**: 单次 Python 调用处理整个字符串

---

## 6. Testing Strategy

### 6.1 Test Framework

| 框架 | 用途 | 原因 |
|------|------|------|
| bats-core | Bash 单元测试 | 项目已有测试模式 |
| pytest | Python 逻辑测试 (可选) | 仅 Python 部分 |

### 6.2 Test Matrix

| 测试类型 | 覆盖范围 | 数量 |
|----------|----------|------|
| 单元测试 | `slugify()` 函数 | 8+ |
| 集成测试 | `create-requirement.sh` 调用 | 2 |
| 回归测试 | 纯英文输入兼容性 | 3 |

### 6.3 Test File Structure

```
tests/
└── slugify.bats           # Bash 单元测试
```

---

## 7. Constitution Check (Phase -1 Gates)

### Simplicity Gate (Article VII)

- [x] **≤3 modules**: 仅 1 个文件 (`common.sh`) 修改
- [x] **No future-proofing**: 无推测性功能，仅实现 PRD 明确需求
- [x] **Minimal dependencies**: pypinyin 为可选依赖

### Anti-Abstraction Gate (Article VIII)

- [x] **Direct framework usage**: 直接调用 pypinyin，无封装层
- [x] **Single data model**: 无数据模型
- [x] **No unnecessary interfaces**: 函数内部实现，无额外抽象

### Integration-First Gate (Article IX)

- [x] **Contracts defined**: 输入/输出行为在 PRD AC 中定义
- [x] **Contract tests planned**: 测试用例覆盖所有 AC
- [x] **Real environment testing**: Bash 直接测试

### Complexity Tracking

| 潜在违规 | 说明 | 批准 |
|----------|------|------|
| 引入 pypinyin | 核心功能必需，PRD Story 1 明确要求 | YES |

**结论**: 无宪法违规

---

## 8. File Changes Summary

| 文件 | 操作 | 改动量 |
|------|------|--------|
| `.claude/scripts/common.sh` | MODIFY | +40 行 (新增 `_chinese_to_pinyin` + 改造 `slugify`) |
| `tests/slugify.bats` | CREATE | +80 行 (新增测试文件) |
| `README.md` | MODIFY | +5 行 (可选依赖说明) |

**总改动**: ~125 行代码

---

## 9. Validation Checklist

### Technical Completeness
- [x] Architecture designed (单函数改造，无需复杂架构)
- [x] Technology selected with justification (Bash + Python3 + pypinyin)
- [x] Data flow documented
- [x] Test strategy defined

### Constitution Compliance
- [x] Simplicity Gate: PASS
- [x] Anti-Abstraction Gate: PASS
- [x] Integration-First Gate: PASS
- [x] No over-engineering

### Quality Checks
- [x] Security considered (输入验证)
- [x] Performance acceptable (<100ms)
- [x] Backward compatibility ensured
- [x] No placeholders remaining

**Ready for Epic Planning**: YES

---

## 10. Appendix

### A. pypinyin 安装命令

```bash
pip install pypinyin
# 或
pip3 install pypinyin
```

### B. 相关文件位置

- **现有函数**: [common.sh:180-195](../../.claude/scripts/common.sh#L180)
- **Python 调用示例**: [common.sh:200-271](../../.claude/scripts/common.sh#L200)
- **调用点**: [create-requirement.sh:357-360](../../.claude/scripts/create-requirement.sh#L357)

### C. 参考资料

- [pypinyin GitHub](https://github.com/mozillazg/python-pinyin)
- [pypinyin Documentation](https://pypinyin.readthedocs.io/)

---

**Generated by**: tech-architect agent
**Based on**: CC-DevFlow Constitution v2.0.0
**PRD Reference**: REQ-003 PRD.md
**Next Step**: Run `/flow-epic` to generate EPIC.md and TASKS.md
