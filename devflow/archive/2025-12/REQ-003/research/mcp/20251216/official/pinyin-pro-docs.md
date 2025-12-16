# pinyin-pro - JavaScript 汉字拼音转换工具

**Source**: https://github.com/zh-lx/pinyin-pro (Context7)
**Fetched**: 2025-12-16

## 简介

Pinyin Pro 是一个专业、准确的 JavaScript 库，用于将汉字转换为拼音。提供声调支持、姓名匹配、自定义拼音等丰富功能。

- GitHub: https://github.com/zh-lx/pinyin-pro
- Code Snippets: 161
- Source Reputation: High

## 安装

```bash
npm install pinyin-pro
# 或
pnpm add pinyin-pro
```

## 基本用法

```javascript
import { pinyin } from 'pinyin-pro';

// 带声调拼音
pinyin('汉语拼音'); // 'hàn yǔ pīn yīn'

// 数组形式
pinyin('汉语拼音', { type: 'array' }); // ["hàn", "yǔ", "pīn", "yīn"]

// 不带声调
pinyin('汉语拼音', { tone: false, type: 'array' }); // ["han", "yu", "pin", "yin"]

// 数字声调
pinyin('汉语拼音', { pattern: 'pinyinNum', type: 'array' }); // ["han4", "yu3", "pin1", "yin1"]

// 获取声母
pinyin('汉语拼音', { pattern: 'initial', type: 'array' }); // ["h", "y", "p", "y"]

// 获取韵母
pinyin('汉语拼音', { pattern: 'final', type: 'array' }); // ["àn", "ǔ", "īn", "īn"]

// 获取声调数字
pinyin('汉语拼音', { pattern: 'num', type: 'array' }); // ["4", "3", "1", "1"]
```

## 多音字处理

```javascript
// 获取所有读音（仅适用于单字）
pinyin('好', { multiple: true }); // 'hǎo hào'

// 数组形式
pinyin('好', { multiple: true, type: 'array' }); // ["hǎo", "hào"]
```

## 拼音匹配

```javascript
import { match } from 'pinyin-pro';

match('汉语拼音', 'hanyupinyin'); // [0, 1, 2, 3]
match('汉语拼音', 'hanpin');      // [0, 2]
match('汉语拼音', 'hyupy');       // [0, 1, 2, 3] 支持缩写
match('会计', 'kuaiji');          // [0, 1] 多音字匹配
match('会计', 'huiji');           // [0, 1] 任一读音匹配即可
```

## 浏览器使用

```html
<script src="https://cdn.jsdelivr.net/gh/zh-lx/pinyin-pro@latest/dist/pinyin-pro.js"></script>
<script>
  var { pinyin } = pinyinPro;
  pinyin('汉语拼音'); // 'hàn yǔ pīn yīn'
</script>
```

## 与 pypinyin 对比

| 特性 | pinyin-pro (JS) | pypinyin (Python) |
|------|-----------------|-------------------|
| 运行时 | Node.js/Browser | Python |
| 多音字 | 支持 | 支持 |
| 词组智能 | 支持 | 支持 |
| 拼音匹配 | 内置 match() | 无 |
| 包大小 | ~100KB | ~500KB |
