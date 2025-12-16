# pypinyin - Python 汉字拼音转换工具

**Source**: https://github.com/mozillazg/python-pinyin
**Fetched**: 2025-12-16

## 简介

将汉字转为拼音。可以用于汉字注音、排序、检索。

- Documentation: https://pypinyin.readthedocs.io/
- PyPI: https://pypi.org/project/pypinyin
- Python version: 2.7, pypy, pypy3, 3.4-3.13
- License: MIT

## 特性

- 根据词组智能匹配最正确的拼音
- 支持多音字
- 简单的繁体支持，注音支持，威妥玛拼音支持
- 支持多种不同拼音/注音风格

## 安装

```bash
pip install pypinyin
```

## 基本用法

```python
from pypinyin import pinyin, lazy_pinyin, Style

# 基本转换
pinyin('中心')  # [['zhōng'], ['xīn']]

# 启用多音字模式
pinyin('中心', heteronym=True)  # [['zhōng', 'zhòng'], ['xīn']]

# 首字母风格
pinyin('中心', style=Style.FIRST_LETTER)  # [['z'], ['x']]

# 不带声调
lazy_pinyin('中心')  # ['zhong', 'xin']

# 数字声调
pinyin('中心', style=Style.TONE3, heteronym=True)  # [['zhong1', 'zhong4'], ['xin1']]
```

## 拼音风格 (Style)

| Style | 输入 | 输出 |
|-------|------|------|
| TONE (默认) | '中心' | [['zhōng'], ['xīn']] |
| TONE2 | '中心' | [['zho1ng'], ['xi1n']] |
| TONE3 | '中心' | [['zhong1'], ['xin1']] |
| NORMAL | '中心' | [['zhong'], ['xin']] |
| FIRST_LETTER | '中心' | [['z'], ['x']] |
| INITIALS | '中心' | [['zh'], ['x']] |
| BOPOMOFO | '中心' | [['ㄓㄨㄥ'], ['ㄒㄧㄣ']] |

## 多音字处理

```python
# 自定义词组拼音库
from pypinyin import load_phrases_dict, load_single_dict

load_phrases_dict({'桔子': [['jú'], ['zǐ']]})  # 增加词组
load_single_dict({ord('还'): 'hái,huán'})  # 调整字的拼音顺序

# 使用 pypinyin-dict 扩展库
from pypinyin_dict.phrase_pinyin_data import cc_cedict
cc_cedict.load()
```

## 分词配合

```python
import jieba
words = list(jieba.cut('每股24.67美元的确定性协议'))
pinyin(words)
```

## 命令行工具

```bash
pypinyin 音乐  # yīn yuè
python -m pypinyin.tools.toneconvert to-tone 'zhong4 xin1'  # zhòng xīn
```

## 注意事项

1. 默认情况下无声调风格会使用 `v` 表示 `ü`（可通过 `v_to_u=True` 改变）
2. 默认原样输出没有拼音的字符
3. y, w, yu 不是声母（按《汉语拼音方案》），使用 `strict=False` 可改变此行为
