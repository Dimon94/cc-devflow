# REQ-003 Research Summary

## 调研概述

**需求**: 分支命名优化 (中文转拼音)
**调研日期**: 2025-12-16
**调研范围**: 现有代码分析 + 外部库对比

---

## 核心洞察

### 1. 现有问题

当前 `slugify()` 函数 ([common.sh:180-195](../../.claude/scripts/common.sh#L180)) 使用 `sed 's/[^a-z0-9]/-/g'` 处理字符串，导致：

- 中文字符被全部替换为 `-`
- 输入 "用户登录功能" → 输出 "" (空字符串)
- 分支名无法有效标识需求内容

### 2. 技术方案对比

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| **Python + pypinyin** | 项目已使用 Python3；成熟稳定；多音字支持好 | 需要安装依赖 | ⭐⭐⭐⭐⭐ |
| Node.js + pinyin-pro | 功能丰富；包小 | 需要 Node.js 运行时；项目未使用 | ⭐⭐⭐ |
| 纯 Bash + 映射表 | 无外部依赖 | 维护困难；不支持多音字 | ⭐⭐ |

### 3. 推荐方案

**选择**: Python + pypinyin

**理由**:
1. 项目 `common.sh` 已有 Python3 调用 (L200-271 `validate_json_schema`)
2. pypinyin 是 Python 生态中最成熟的拼音库 (5.5k+ stars)
3. 支持 `lazy_pinyin` 直接返回无声调拼音列表
4. 内置多音字智能处理

### 4. 实现方案

```bash
# 新增函数到 common.sh
chinese_to_pinyin() {
    local input="$1"
    python3 -c "
from pypinyin import lazy_pinyin
import sys
text = sys.argv[1]
print('-'.join(lazy_pinyin(text)))
" "$input"
}

# 改造 slugify() 函数
slugify() {
    local input="$1"
    # 检测是否包含中文
    if [[ "$input" =~ [\x{4e00}-\x{9fff}] ]]; then
        input=$(chinese_to_pinyin "$input")
    fi
    # 原有英文处理逻辑
    ...
}
```

---

## 调研材料索引

### 内部调研
- [codebase-overview.md](internal/codebase-overview.md) - 现有代码分析

### 外部调研 (MCP)
- [pypinyin-docs.md](mcp/20251216/official/pypinyin-docs.md) - Python pypinyin 官方文档
- [pinyin-pro-docs.md](mcp/20251216/official/pinyin-pro-docs.md) - JavaScript pinyin-pro 文档

### 参考来源
- [GitHub pypinyin](https://github.com/mozillazg/python-pinyin)
- [pypinyin PyPI](https://pypi.org/project/pypinyin/)
- [pinyin-pro Context7](https://github.com/zh-lx/pinyin-pro)

---

## 待确认问题

| ID | 问题 | 建议 | 状态 |
|----|------|------|------|
| R001 | 是否需要处理繁体中文? | 暂不处理，pypinyin 默认支持 | RESOLVED |
| R002 | 多音字词典是否需要自定义? | 使用默认词典，后续按需扩展 | RESOLVED |
| R003 | 分支名长度限制? | Git 支持 250 字符，足够使用 | RESOLVED |
| R004 | pypinyin 安装方式? | 使用 pip install，首次运行时检测 | OPEN |

---

## 下一步行动

1. **PRD 阶段**: 细化用户故事和验收标准
2. **技术设计**: 确定 pypinyin 集成方式
3. **实现**: 改造 `slugify()` 函数
4. **测试**: 覆盖中英混合、多音字、特殊字符等边界场景
