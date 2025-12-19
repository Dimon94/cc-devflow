# REQ-006 Data Model

**Purpose**: 定义 RM-008 Adapter Compiler 的核心数据结构

---

## 1. 实体概览

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  PlatformConfig │────▶│  SkillRegistry  │────▶│    Manifest     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   RulesEntry    │     │   SkillEntry    │     │  ManifestEntry  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 2. PlatformConfig

### 定义

```typescript
interface PlatformConfig {
  name: string;           // 平台显示名称
  folder: string;         // 输出目录 (e.g., ".cursor/")
  rulesEntry: {
    path: string;         // 规则入口文件相对路径
    format: 'mdc' | 'markdown' | 'toml';
  };
  commandsDir: string;    // 命令输出子目录
  commandExt: string;     // 命令文件扩展名
  argumentPattern: string; // 参数占位符 ("$ARGUMENTS" | "{{args}}")
  hasHooks: boolean;      // 是否支持原生 hooks
  limits: {
    maxFileChars?: number; // 文件大小限制 (Antigravity: 12000)
  };
}
```

### 实例

| Platform | folder | rulesEntry.path | format | limits |
|----------|--------|-----------------|--------|--------|
| cursor | .cursor/ | rules/devflow.mdc | mdc | - |
| codex | .codex/ | skills/cc-devflow/SKILL.md | markdown | - |
| qwen | .qwen/ | commands/devflow.toml | toml | - |
| antigravity | .agent/ | rules/rules.md | markdown | 12000 chars |

---

## 3. SkillEntry

### 定义

```typescript
interface SkillEntry {
  name: string;           // 技能名称
  description: string;    // 技能描述
  type: 'domain' | 'guardrail' | 'utility';
  enforcement: 'suggest' | 'block' | 'warn';
  priority: 'critical' | 'high' | 'medium' | 'low';
  skillPath: string;      // skill.md 文件路径
  triggers: {
    prompt: {
      keywords: string[];
      intentPatterns: string[];
    };
    file: {
      pathPatterns: string[];
      contentPatterns: string[];
    };
  };
}
```

### 字段说明

| 字段 | 必填 | 默认值 | 约束 |
|------|------|--------|------|
| name | ✓ | - | 唯一标识符 |
| description | ✓ | - | 最大 500 字符 |
| type | ✗ | utility | enum |
| enforcement | ✗ | suggest | enum |
| priority | ✗ | medium | enum |
| skillPath | ✓ | - | 相对路径 |
| triggers | ✗ | {} | 可选触发规则 |

### 状态机

```
N/A - SkillEntry 是静态配置，无状态转换
```

---

## 4. SkillRegistry

### 定义

```typescript
interface SkillRegistry {
  version: string;        // Schema 版本 "1.0"
  generatedAt: string;    // ISO8601 时间戳
  skills: SkillEntry[];   // 技能列表
}
```

### 文件位置

```
devflow/.generated/skills-registry.json
```

### 生成规则

1. 扫描 `.claude/skills/*/skill.md` 提取元数据
2. 读取 `.claude/skills/skill-rules.json` 提取触发规则
3. 按 `name` 合并两个数据源
4. 输出 JSON 文件

---

## 5. ManifestEntry

### 定义

```typescript
interface ManifestEntry {
  source: string;         // 源文件相对路径
  target: string;         // 目标文件路径
  hash: string;           // 源文件 SHA-256 hash
  platform: 'codex' | 'cursor' | 'qwen' | 'antigravity';
  timestamp: string;      // ISO8601 编译时间
}
```

### 约束

- `source` 必须存在于文件系统
- `hash` 为 64 字符十六进制字符串
- `platform` 限定为 4 个有效平台

---

## 6. Manifest v2.0

### 定义

```typescript
interface ManifestV2 {
  version: "2.0";
  generatedAt: string;    // ISO8601

  // 命令编译记录 (现有)
  entries: ManifestEntry[];

  // 技能编译记录 (新增)
  skills: {
    name: string;
    sourceHash: string;
    timestamp: string;
  }[];

  // 规则入口文件记录 (新增)
  rulesEntry: {
    [platform: string]: {
      path: string;
      hash: string;
      timestamp: string;
    };
  };
}
```

### 版本迁移

| v1.0 | v2.0 | 变更说明 |
|------|------|----------|
| entries | entries | 保持不变 |
| - | skills | 新增技能追踪 |
| - | rulesEntry | 新增规则入口追踪 |

### 文件位置

```
devflow/.generated/manifest.json
```

---

## 7. 关系图

```
skill-rules.json ─────┐
                      ├──▶ SkillRegistry ──▶ skills-registry.json
skill.md files ───────┘
                                    │
                                    ▼
                           ┌────────────────┐
                           │ RulesEmitters  │
                           └────────────────┘
                                    │
              ┌─────────┬───────────┼───────────┬──────────┐
              ▼         ▼           ▼           ▼          ▼
        .cursor/   .codex/     .qwen/     .agent/    manifest.json
        rules/     skills/     commands/  rules/     (v2.0)
        *.mdc      SKILL.md    *.toml     *.md
```

---

## 8. Zod Schemas

### PlatformConfigSchema

```javascript
const PlatformConfigSchema = z.object({
  name: z.string(),
  folder: z.string().regex(/^\.[a-z]+\/$/),
  rulesEntry: z.object({
    path: z.string(),
    format: z.enum(['mdc', 'markdown', 'toml'])
  }),
  commandsDir: z.string(),
  commandExt: z.string().regex(/^\.[a-z]+$/),
  argumentPattern: z.string(),
  hasHooks: z.boolean(),
  limits: z.object({
    maxFileChars: z.number().optional()
  })
});
```

### SkillEntrySchema

```javascript
const SkillEntrySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  type: z.enum(['domain', 'guardrail', 'utility']).default('utility'),
  enforcement: z.enum(['suggest', 'block', 'warn']).default('suggest'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
  skillPath: z.string(),
  triggers: z.object({
    prompt: z.object({
      keywords: z.array(z.string()),
      intentPatterns: z.array(z.string())
    }).optional(),
    file: z.object({
      pathPatterns: z.array(z.string()),
      contentPatterns: z.array(z.string())
    }).optional()
  }).default({})
});
```

### ManifestV2Schema

```javascript
const ManifestV2Schema = z.object({
  version: z.literal('2.0'),
  generatedAt: z.string().datetime(),
  entries: z.array(ManifestEntrySchema),
  skills: z.array(z.object({
    name: z.string(),
    sourceHash: z.string().length(64),
    timestamp: z.string().datetime()
  })),
  rulesEntry: z.record(z.object({
    path: z.string(),
    hash: z.string().length(64),
    timestamp: z.string().datetime()
  }))
});
```

---

## 9. 验证规则

| 规则 | 描述 | 实施位置 |
|------|------|----------|
| 唯一性 | skill.name 必须唯一 | skills-registry.js |
| 路径有效性 | skillPath 指向存在的文件 | skills-registry.js |
| Hash 格式 | 64 字符十六进制 | manifest.js |
| 平台有效性 | platform ∈ PLATFORMS | emitter factory |
| 大小限制 | Antigravity 文件 ≤ 12000 字符 | antigravity-emitter |

---

**Generated**: 2025-12-19
**Version**: 1.0.0
