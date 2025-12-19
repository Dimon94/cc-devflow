# Clarification Report: REQ-006

## Metadata
- **Session ID**: 20251219-143000-REQ-006
- **Date**: 2025-12-19
- **Questions**: 5 / 5
- **Reference**: spec-kit (github/spec-kit)

---

## Scan Summary

| Dimension | Status | Issues |
|-----------|--------|--------|
| Functional Scope | resolved | Qwen 格式已明确 (TOML) |
| User Roles | clear | 开发者使用 npm run adapt |
| Data Flow | clear | Parse -> Transform -> Emit 管线 |
| Edge Cases | resolved | Antigravity 12K 分块已有实现 |
| Error Handling | resolved | 严格失败 exit code 1 |
| Integration Points | clear | 扩展现有 manifest.json |
| Performance | clear | 增量编译机制 |
| Security | clear | 无敏感数据处理 |
| Compatibility | resolved | 参考 spec-kit 实现 |
| Testing Strategy | resolved | 格式验证优先 |
| Rollout Strategy | clear | npm 脚本分发 |

---

## Clarification Session

### Q1: Qwen 平台支持策略
**Question**: 研究中 Qwen 平台格式标记为 "TBD"，应如何处理？

**Answer**: 参考 spec-kit 实现

**Rationale**:
spec-kit 已完整支持 16 个平台包括 Qwen，其规范如下：
- 目录: `.qwen/commands/`
- 格式: **TOML**（非 YAML）
- 参数占位符: `{{args}}`
- CLI 工具: `qwen`
- 安装: https://github.com/QwenLM/qwen-code

**Implementation Update**:
```javascript
// 更新 D01: Platform Rule Entry Files
Platform    | Entry File               | Format
------------|--------------------------|------------------
Qwen        | .qwen/commands/*.toml    | TOML  // 确认，非 YAML
```

---

### Q2: Cursor 兼容层默认行为
**Question**: `.cursorrules` 兼容层应如何配置？

**Answer**: 参考 spec-kit 实现

**Rationale**:
spec-kit 采用 `.cursor/commands/` 目录，使用 Markdown 格式。
- Cursor 0.47+ 推荐 `.cursor/rules/*.mdc`
- 兼容层可通过 `--legacy-cursorrules` 显式启用
- 默认仅生成 `.mdc` 格式

---

### Q3: Antigravity 智能分块策略
**Question**: 当内容超过 12K 字符时，分块策略应如何实现？

**Answer**: 参考现有源码实现

**Rationale**:
研究阶段已确认 Antigravity 12K 限制来源于官方文档：
> "Rules files are limited to 12,000 characters each."

智能分块算法应：
1. 按 `##` 标题拆分章节
2. 若单章节 > 12K，按段落拆分
3. 贪心合并小章节
4. 每个拆分文件带 Part 标记

---

### Q4: 漂移检测失败处理
**Question**: `npm run adapt -- --check` 检测到漂移时应如何处理？

**Answer**: B (严格失败)

**Rationale**:
- 输出 diff 并 exit code 1
- CI 门禁友好，明确失败信号
- 用户可通过 `npm run adapt` 手动修复

**Implementation**:
```bash
# npm run adapt -- --check
if (drift_detected) {
  console.error("Drift detected:");
  show_diff();
  process.exit(1);  // CI 失败
}
```

---

### Q5: 集成测试覆盖范围
**Question**: 集成测试应覆盖哪些场景？

**Answer**: A (格式验证)

**Rationale**:
MVP 范围内优先格式验证：
- MDC schema 验证 (Cursor)
- TOML lint (Qwen)
- Markdown 结构验证 (Codex/Antigravity)
- 真机验证可后续补充

---

## Key Decisions Updated

### D01: Platform Rule Entry Files (UPDATED)

| Platform | Entry File | Format | Status |
|----------|-----------|--------|--------|
| Cursor | `.cursor/rules/*.mdc` | MDC | Confirmed |
| Codex | `.codex/skills/*/SKILL.md` | Markdown | Confirmed |
| Antigravity | `.agent/rules/rules.md` | Markdown | Confirmed |
| **Qwen** | `.qwen/commands/*.toml` | **TOML** | **Updated from TBD** |

### D08: Multi-Platform Registry (UPDATED)

```javascript
const PLATFORM_CONFIG = {
  // ... existing platforms ...
  "qwen": {
    name: "Qwen Code",
    folder: ".qwen/",
    entryFile: "commands/devflow.toml",  // Updated: TOML format
    format: "toml",
    argumentPattern: "{{args}}",  // Qwen-specific
    hasHooks: false,
  },
};
```

---

## Research Sources Updated

### spec-kit Reference
- [spec-kit/__init__.py](spec-kit/src/specify_cli/__init__.py) - AGENT_CONFIG 定义
- [spec-kit/AGENTS.md](spec-kit/AGENTS.md) - 16 平台支持详情

---

## Next Command

✅ Run `/flow-prd` to generate PRD

---

**Document Status**: Complete
**Generated**: 2025-12-19T14:35:00+08:00
