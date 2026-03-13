# devflow/specs/
> L2 | 父级: /Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/CLAUDE.md

## Purpose
项目级单一真相源 (SSOT)，描述当前系统的完整状态。所有模块的规格在此汇总，需求级 Delta 归档时自动合并到这里。

## Structure
```
specs/
├── README.md           # 目录说明
├── CLAUDE.md           # 本文件
├── auth/               # 认证模块
│   └── spec.md
├── payments/           # 支付模块
│   └── spec.md
├── ui/                 # UI 组件
│   └── spec.md
└── api/                # API 规格
    └── openapi.yaml
```

## Workflow
1. **需求开发中**: 变更记录在 `requirements/{REQ}/specs/` (Delta)
2. **归档时**: `/flow:release` 自动合并 Delta 到此目录
3. **新需求开始前**: `/flow:init` 读取此目录了解当前系统状态

## Integration
- **Context Injection**: 各阶段 Agent 引用此目录的 spec.md
- **Delta Merge**: `delta-parser.ts` 负责合并逻辑
- **Version Control**: 每次合并更新模块的 version 字段

## Key Files
- `auth/spec.md` - 认证与会话管理规格
- `payments/spec.md` - 支付流程规格
- `ui/spec.md` - UI 组件库规格
- `api/openapi.yaml` - API 契约定义

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
