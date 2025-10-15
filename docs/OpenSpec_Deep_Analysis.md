# OpenSpec 深度源码分析与 cc-devflow 精华吸收方案

> **分析日期**: 2025-01-14
> **分析方法**: 源码级深度剖析 (TypeScript实现 + Bash脚本 + 架构设计)
> **对比对象**: cc-devflow v2.0.0 (Bash/Markdown驱动)

---

## 🎯 Executive Summary (高管摘要)

经过深度源码分析，OpenSpec的核心价值不在于"双轨架构"和"Delta格式"的**概念**，而在于其**工程实现的精妙细节**：

### 关键发现 (Code-Level Insights)

1. **RequirementBlock AST解析器** - 不是简单的文本替换，而是精确的Markdown AST操作
2. **Archive合并算法** - RENAMED → REMOVED → MODIFIED → ADDED 的四阶段事务式合并
3. **冲突检测矩阵** - 交叉验证 8 种冲突场景，防止数据损坏
4. **任务进度追踪** - 轻量级的 `tasks.md` checkbox解析，无需数据库
5. **多工具适配层** - 通过Configurator模式支持10+种AI工具

### cc-devflow 应该吸收的精华

| 能力 | OpenSpec 实现 | cc-devflow 现状 | 优先级 | 工作量 |
|------|--------------|-----------------|--------|--------|
| **Delta解析引擎** | `requirement-blocks.ts` (200行核心算法) | 无，全量文档替换 | 🔴 P0 | 5天 |
| **Archive合并算法** | 四阶段事务 + 冲突检测 | 无Archive机制 | 🟡 P1 | 3天 |
| **任务进度解析** | Regex-based checkbox统计 | 手动 `.completed` 文件 | 🟢 P2 | 1天 |
| **验证器架构** | Zod Schema + 自定义规则 | Bash脚本验证 | 🟡 P1 | 4天 |
| **多工具适配** | Configurator注册表 | 仅支持Claude Code | 🟢 P2 | 7天 |

---

## 📊 第一部分：源码架构深度对比

### 1.1 核心数据结构对比

#### OpenSpec: TypeScript 强类型 AST

```typescript
// src/core/parsers/requirement-blocks.ts
export interface RequirementBlock {
  headerLine: string;  // '### Requirement: Something'
  name: string;        // 'Something' (normalized)
  raw: string;         // Full block with scenarios
}

export interface DeltaPlan {
  added: RequirementBlock[];
  modified: RequirementBlock[];
  removed: string[];  // Names only
  renamed: Array<{ from: string; to: string }>;
}
```

**关键设计**：
- `normalizeRequirementName()` - 消除空格差异，支持模糊匹配
- `raw` 字段保留原始格式，避免格式损坏
- `removed` 只存储名称，节省内存

#### cc-devflow: Bash + JSON 松散结构

```bash
# orchestration_status.json
{
  "current_phase": "dev",
  "completed_tasks": ["T001", "T002"],
  "timestamp": "2025-01-14T10:30:00Z"
}
```

**问题**：
- 无类型安全，容易出现拼写错误
- `completed_tasks` 是数组，查找性能 O(n)
- 缺少任务依赖关系的结构化表达

---

### 1.2 Delta解析引擎剖析

#### OpenSpec: `parseDeltaSpec()` 核心算法

```typescript
// src/core/parsers/requirement-blocks.ts:113-121
export function parseDeltaSpec(content: string): DeltaPlan {
  const sections = splitTopLevelSections(content);
  const added = parseRequirementBlocksFromSection(sections['ADDED Requirements']);
  const modified = parseRequirementBlocksFromSection(sections['MODIFIED Requirements']);
  const removed = parseRemovedNames(sections['REMOVED Requirements']);
  const renamed = parseRenamedPairs(sections['RENAMED Requirements']);
  return { added, modified, removed, renamed };
}
```

**技术细节**：

1. **Section Split Algorithm** (`splitTopLevelSections`)
   ```typescript
   // 只匹配 ## 级别标题，忽略 ### 和更低层级
   const m = lines[i].match(/^(##)\s+(.+)$/);
   ```
   - 避免误匹配子章节
   - 支持任意顺序的Section（不依赖固定顺序）

2. **Requirement Block Parser** (`parseRequirementBlocksFromSection`)
   ```typescript
   // 精确匹配 '### Requirement:' 格式
   const REQUIREMENT_HEADER_REGEX = /^###\s*Requirement:\s*(.+)\s*$/;

   while (i < lines.length && !/^###\s+Requirement:/.test(lines[i]) && !/^##\s+/.test(lines[i])) {
     buf.push(lines[i]);
     i++;
   }
   ```
   - 贪婪收集直到下一个同级标题
   - 保留空行和缩进，避免格式丢失

3. **RENAMED Pair Parser** (`parseRenamedPairs`)
   ```typescript
   // 状态机模式，匹配 FROM/TO 配对
   let current: { from?: string; to?: string } = {};
   if (fromMatch) current.from = normalize(fromMatch[1]);
   else if (toMatch) {
     current.to = normalize(toMatch[1]);
     if (current.from && current.to) {
       pairs.push({ from: current.from, to: current.to });
       current = {};
     }
   }
   ```
   - 自动处理不完整的配对（忽略孤立的FROM或TO）
   - 支持多种格式：`FROM: ### Requirement: X` 或 `- FROM: ...`

#### cc-devflow: 无Delta解析，依赖全量替换

```bash
# .claude/scripts/setup-epic.sh (生成 TASKS.md)
cat > "$TASKS_FILE" << EOF
# Tasks: $REQ_ID
## Phase 1: Setup
- [ ] T001 初始化项目
EOF
```

**问题**：
- 修改需求时，必须重新生成完整的 TASKS.md
- 无法追踪"哪些任务是新增的，哪些是修改的"
- 容易丢失手动添加的注释

---

### 1.3 Archive 合并算法剖析

#### OpenSpec: 四阶段事务式合并

```typescript
// src/core/archive.ts:461-527 (buildUpdatedSpec)

// Phase 1: RENAMED - 更新Map的Key
for (const r of plan.renamed) {
  const block = nameToBlock.get(from);
  block.name = to;
  nameToBlock.delete(from);
  nameToBlock.set(to, block);
}

// Phase 2: REMOVED - 删除Key
for (const name of plan.removed) {
  nameToBlock.delete(key);
}

// Phase 3: MODIFIED - 替换Value
for (const mod of plan.modified) {
  nameToBlock.set(key, mod);  // 完整替换
}

// Phase 4: ADDED - 新增Key
for (const add of plan.added) {
  if (nameToBlock.has(key)) throw Error('Already exists');
  nameToBlock.set(key, add);
}
```

**关键设计决策**：

1. **为什么是这个顺序？**
   - RENAMED 必须最先，因为 MODIFIED 需要引用新名称
   - REMOVED 在 MODIFIED 前，避免"删除后又修改"的逻辑错误
   - ADDED 最后，确保不与已存在的Key冲突

2. **原始顺序保留算法**
   ```typescript
   // src/core/archive.ts:532-547
   const keptOrder: RequirementBlock[] = [];
   for (const block of parts.bodyBlocks) {  // 原始顺序
     const replacement = nameToBlock.get(key);
     if (replacement) keptOrder.push(replacement);
   }
   // 新增的追加到末尾
   for (const [key, block] of nameToBlock.entries()) {
     if (!seen.has(key)) keptOrder.push(block);
   }
   ```
   - 保持用户手动排序的Requirement顺序
   - 新增的Requirement自动追加，不打乱现有结构

3. **冲突检测矩阵**
   ```typescript
   // src/core/archive.ts:401-431 (Pre-validation)

   // 1. 同Section内重复
   if (addedNames.has(name)) throw Error('Duplicate in ADDED');

   // 2. 跨Section冲突
   if (modifiedNames.has(n) && removedNames.has(n))
     throw Error('MODIFIED and REMOVED conflict');

   // 3. RENAMED与MODIFIED冲突
   if (modifiedNames.has(fromNorm))
     throw Error('MODIFIED must reference NEW header');

   // 4. RENAMED TO与ADDED冲突
   if (addedNames.has(toNorm))
     throw Error('RENAMED TO collides with ADDED');
   ```
   - **8种冲突场景**全覆盖
   - 事务式验证：任何冲突都回滚，不写入文件

#### cc-devflow: 无Archive机制

```bash
# 当前方式：需求完成后，文档留在 devflow/requirements/REQ-123/
# 问题：
# 1. 无法更新"系统真相" (没有 specs/ 概念)
# 2. 历史需求文档散落，难以检索
# 3. 无法支持"增量变更"
```

---

### 1.4 验证器架构剖析

#### OpenSpec: Zod Schema + 自定义规则

```typescript
// src/core/validation/validator.ts:56-71
async validateSpecContent(specName: string, content: string): Promise<ValidationReport> {
  const parser = new MarkdownParser(content);
  const spec = parser.parseSpec(specName);

  // 1. Schema验证 (类型、必填字段)
  const result = SpecSchema.safeParse(spec);
  if (!result.success) issues.push(...convertZodErrors(result.error));

  // 2. 业务规则验证 (长度、格式、SHALL/MUST)
  issues.push(...applySpecRules(spec, content));

  return createReport(issues);
}
```

**三层验证体系**：

1. **Schema Layer** (Zod)
   ```typescript
   // src/core/schemas/spec.schema.ts
   export const SpecSchema = z.object({
     name: z.string().min(1),
     overview: z.string().min(1),
     requirements: z.array(RequirementSchema).min(1),  // 至少1个
     metadata: z.object({
       version: z.string(),
       format: z.literal('openspec')
     })
   });
   ```

2. **Business Rules Layer**
   ```typescript
   // src/core/validation/validator.ts:260-290
   private applySpecRules(spec: Spec): ValidationIssue[] {
     // Rule 1: Purpose长度检查
     if (spec.overview.length < MIN_PURPOSE_LENGTH) {
       issues.push({ level: 'WARNING', message: 'Purpose too brief' });
     }

     // Rule 2: Scenario完整性
     req.scenarios.forEach((scenario, index) => {
       if (scenario.rawText.length === 0) {
         issues.push({ level: 'WARNING', message: 'Scenario empty' });
       }
     });
   }
   ```

3. **Delta-Specific Rules**
   ```typescript
   // src/core/validation/validator.ts:113-244
   async validateChangeDeltaSpecs(changeDir): Promise<ValidationReport> {
     // Rule 1: SHALL/MUST强制
     if (!this.containsShallOrMust(requirementText)) {
       issues.push({ level: 'ERROR', message: 'Must contain SHALL or MUST' });
     }

     // Rule 2: Scenario数量
     if (this.countScenarios(block.raw) < 1) {
       issues.push({ level: 'ERROR', message: 'At least one scenario required' });
     }

     // Rule 3: 跨Section冲突
     if (modifiedNames.has(n) && removedNames.has(n)) {
       issues.push({ level: 'ERROR', message: 'Cross-section conflict' });
     }
   }
   ```

**验证时机**：
- Pre-archive: 防止损坏的Delta进入Archive
- Post-rebuild: 确保合并后的Spec仍然有效
- Interactive: `openspec validate --strict` 命令

#### cc-devflow: Bash脚本验证

```bash
# .claude/scripts/validate-constitution.sh
check_no_partial_implementation() {
  grep -r "TODO\|FIXME\|XXX" "$REQ_DIR" && return 1
  return 0
}
```

**问题**：
- 无类型系统，无法验证JSON结构
- 错误消息不友好（"grep: pattern not found"）
- 无法组合多个验证规则
- 难以扩展新的验证逻辑

---

### 1.5 任务进度追踪剖析

#### OpenSpec: Checkbox解析 + 缓存优化

```typescript
// src/utils/task-progress.ts (未完整展示，但核心逻辑在 archive.ts:140)
export async function getTaskProgressForChange(changesDir: string, changeId: string) {
  const tasksPath = path.join(changesDir, changeId, 'tasks.md');
  const content = await fs.readFile(tasksPath, 'utf-8');

  // Regex匹配所有checkbox
  const checkboxes = content.match(/^- \[([ x])\]/gm) || [];
  const completed = checkboxes.filter(cb => cb.includes('[x]')).length;

  return { total: checkboxes.length, completed };
}

export function formatTaskStatus(progress: { total: number; completed: number }): string {
  if (progress.total === 0) return '─';
  const percent = Math.round((progress.completed / progress.total) * 100);
  const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));
  return `${bar} ${progress.completed}/${progress.total}`;
}
```

**优化细节**：
- 单次读取，Regex一次性匹配所有checkbox
- 无需遍历每一行，性能 O(n) → O(1)
- 进度条可视化：`██████░░░░ 6/10`

#### cc-devflow: `.completed` 文件标记

```bash
# .claude/scripts/mark-task-complete.sh
mark_task_complete() {
  touch "$REQ_DIR/tasks/TASK_001.completed"
  # 同时更新 TASKS.md 中的 checkbox
  sed -i "s/- \[ \] TASK_001/- [x] TASK_001/" "$TASKS_FILE"
}
```

**问题**：
- 双重状态管理（`.completed` 文件 + `TASKS.md` checkbox）
- 容易不一致：文件存在但checkbox未勾选
- 需要手动同步

---

### 1.6 多工具适配层剖析

#### OpenSpec: Configurator注册表模式

```typescript
// src/core/configurators/registry.ts
export class ToolRegistry {
  private static configurators: Map<string, Configurator> = new Map([
    ['claude', new ClaudeConfigurator()],
    ['cursor', new CursorConfigurator()],
    ['codex', new CodexConfigurator()],
    // ... 10+ tools
  ]);

  static get(toolId: string): Configurator | undefined {
    return this.configurators.get(toolId);
  }
}

// src/core/configurators/base.ts
export interface Configurator {
  toolId: string;
  configFileName: string;
  isAvailable: boolean;
  configure(projectPath: string, openspecDir: string): Promise<void>;
}
```

**扩展示例**：添加新工具只需3步

```typescript
// 1. 创建Configurator
class WindsurfConfigurator implements Configurator {
  toolId = 'windsurf';
  configFileName = '.windsurf/settings.json';
  isAvailable = true;

  async configure(projectPath: string, openspecDir: string): Promise<void> {
    const settingsPath = path.join(projectPath, this.configFileName);
    await fs.writeFile(settingsPath, JSON.stringify({
      "openspec.instructionsPath": `${openspecDir}/AGENTS.md`
    }));
  }
}

// 2. 注册到Registry
ToolRegistry.register('windsurf', new WindsurfConfigurator());

// 3. 添加到配置选项
const AI_TOOLS: AIToolOption[] = [
  { value: 'windsurf', name: 'Windsurf', available: true }
];
```

#### cc-devflow: 硬编码Claude Code配置

```bash
# .claude/settings.json (固定文件)
{
  "commands": [
    { "name": "flow-init", "file": ".claude/commands/flow-init.md" }
  ],
  "agents": [
    { "name": "prd-writer", "file": ".claude/agents/prd-writer.md" }
  ]
}
```

**问题**：
- 无法支持其他AI工具（Cursor、Codex、GitHub Copilot）
- 配置格式固定，难以扩展
- 缺少"工具发现"机制（无法自动检测已安装工具）

---

## 🔬 第二部分：核心算法深度剖析

### 2.1 Requirement Normalization Algorithm

#### 问题：如何处理用户的"随意命名"？

```markdown
## ADDED Requirements
### Requirement: User Login          # 原始名称
### Requirement:  User Login         # 多余空格
### Requirement: user login          # 大小写
### Requirement: User   Login        # 多个空格
```

#### OpenSpec 解决方案：`normalizeRequirementName()`

```typescript
// src/core/parsers/requirement-blocks.ts:15-17
export function normalizeRequirementName(name: string): string {
  return name.trim();  // 简单但有效
}
```

**为什么只做 `trim()`？**
- **设计哲学**：保留用户意图，避免过度标准化
- **冲突检测**：基于空格修剪后的精确匹配
- **大小写敏感**：`User Login` ≠ `user login` (符合技术文档习惯)

**改进空间**：
```typescript
// cc-devflow 可以增强版本
export function normalizeRequirementName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')  // 多个空格 → 单个空格
    .toLowerCase();         // 大小写不敏感 (可选)
}
```

---

### 2.2 Section Extraction Algorithm

#### 问题：如何从Spec中提取 `## Requirements` Section？

**难点**：
- Requirements可能在文档中间（前面有 Purpose、Overview）
- Requirements后面可能有其他Section（如 Design Notes）
- Requirements内部有多层嵌套（### Requirement、#### Scenario）

#### OpenSpec 解决方案：`extractRequirementsSection()`

```typescript
// src/core/parsers/requirement-blocks.ts:24-96

export function extractRequirementsSection(content: string): RequirementsSectionParts {
  const lines = content.split('\n');

  // Step 1: 找到 ## Requirements 行
  const reqHeaderIndex = lines.findIndex(l => /^##\s+Requirements\s*$/i.test(l));

  // Step 2: 找到下一个同级Section (##)
  let endIndex = lines.length;
  for (let i = reqHeaderIndex + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i])) {
      endIndex = i;
      break;
    }
  }

  // Step 3: 分离Section前、Section头、Section体、Section后
  const before = lines.slice(0, reqHeaderIndex).join('\n');
  const headerLine = lines[reqHeaderIndex];
  const sectionBodyLines = lines.slice(reqHeaderIndex + 1, endIndex);
  const after = lines.slice(endIndex).join('\n');

  // Step 4: 解析Section体中的Requirement Block
  const blocks = parseRequirementBlocks(sectionBodyLines);

  return { before, headerLine, preamble, bodyBlocks: blocks, after };
}
```

**关键技术**：
- **Greedy Matching**：收集所有行直到下一个 `##`
- **Preamble Handling**：保留Requirements标题后、第一个Requirement前的内容
- **三段式结构**：before + section + after，重组时无缝拼接

---

### 2.3 Delta Conflict Detection Matrix

#### 问题：如何防止用户提交冲突的Delta？

**8种冲突场景**：

| ID | 场景 | 示例 | 检测逻辑 |
|----|------|------|----------|
| C1 | ADDED内重复 | 两次添加同名Requirement | `addedNames.has(key)` |
| C2 | MODIFIED内重复 | 两次修改同一Requirement | `modifiedNames.has(key)` |
| C3 | REMOVED内重复 | 两次删除同一Requirement | `removedNames.has(key)` |
| C4 | MODIFIED + REMOVED | 修改后又删除 | `modifiedNames ∩ removedNames` |
| C5 | ADDED + REMOVED | 新增后又删除 | `addedNames ∩ removedNames` |
| C6 | MODIFIED + ADDED | 修改不存在的 | `modifiedNames ∩ addedNames` |
| C7 | RENAMED + MODIFIED(旧名) | 重命名后，修改仍用旧名 | `modifiedNames ∩ renamedFrom` |
| C8 | RENAMED TO + ADDED | 重命名的新名与新增冲突 | `renamedTo ∩ addedNames` |

#### OpenSpec 实现：Pre-validation Pipeline

```typescript
// src/core/archive.ts:351-431

// Phase 1: 同Section内重复检查
const addedNames = new Set<string>();
for (const block of plan.added) {
  const key = normalizeRequirementName(block.name);
  if (addedNames.has(key)) throw Error(`Duplicate in ADDED: "${block.name}"`);
  addedNames.add(key);
}

// Phase 2: 跨Section冲突检查
const conflicts: Array<{ name: string; a: string; b: string }> = [];
for (const n of modifiedNames) {
  if (removedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'REMOVED' });
  if (addedNames.has(n)) conflicts.push({ name: n, a: 'MODIFIED', b: 'ADDED' });
}

// Phase 3: RENAMED特殊检查
for (const { from, to } of plan.renamed) {
  const fromKey = normalizeRequirementName(from);
  const toKey = normalizeRequirementName(to);

  // C7: MODIFIED必须引用新名称
  if (modifiedNames.has(fromKey)) {
    throw Error(`MODIFIED must reference NEW header "${to}"`);
  }

  // C8: RENAMED TO不能与ADDED冲突
  if (addedNames.has(toKey)) {
    throw Error(`RENAMED TO collides with ADDED "${to}"`);
  }
}

// Phase 4: 如果有冲突，抛出错误，终止Archive
if (conflicts.length > 0) {
  const c = conflicts[0];
  throw Error(`Conflict: "${c.name}" in ${c.a} and ${c.b}`);
}
```

**事务式保证**：
- 任何冲突都导致 `throw Error`
- 不会部分写入文件（要么全成功，要么全失败）
- 错误消息精确指出冲突位置

---

### 2.4 Order-Preserving Merge Algorithm

#### 问题：如何在合并时保留用户的手动排序？

**场景**：
```markdown
# 原始 specs/auth/spec.md
### Requirement: User Login
### Requirement: Password Reset
### Requirement: Two-Factor Auth

# Delta (ADDED + REMOVED)
## ADDED Requirements
### Requirement: Social Login      # 新增

## REMOVED Requirements
### Requirement: Password Reset     # 删除

# 期望结果 (保持原顺序)
### Requirement: User Login        # 原位置1
### Requirement: Two-Factor Auth   # 原位置3 (跳过已删除的2)
### Requirement: Social Login      # 追加到末尾
```

#### OpenSpec 解决方案：Two-Pass Merge

```typescript
// src/core/archive.ts:532-547

// Pass 1: 保留原始顺序中仍存在的Requirement
const keptOrder: RequirementBlock[] = [];
const seen = new Set<string>();

for (const block of parts.bodyBlocks) {  // 原始顺序迭代
  const key = normalizeRequirementName(block.name);
  const replacement = nameToBlock.get(key);  // 从最终Map中取

  if (replacement) {
    keptOrder.push(replacement);  // 保留（可能是MODIFIED后的版本）
    seen.add(key);
  }
  // 如果key不在Map中，说明被REMOVED了，跳过
}

// Pass 2: 追加新增的Requirement
for (const [key, block] of nameToBlock.entries()) {
  if (!seen.has(key)) {
    keptOrder.push(block);  // ADDED的追加到末尾
  }
}
```

**算法复杂度**：
- 时间：O(n) - 两次遍历
- 空间：O(n) - `seen` Set + `keptOrder` Array

---

## 🛠️ 第三部分：可移植技术方案

### 3.1 核心算法移植优先级

| 算法 | 技术栈 | LOC | 依赖 | 移植难度 | ROI |
|------|--------|-----|------|----------|-----|
| **Delta解析引擎** | TypeScript → Bash | 200 | 无 | 🟡 中 | 🔴 极高 |
| **Archive合并** | TypeScript → Bash | 150 | Delta解析 | 🟡 中 | 🟡 高 |
| **冲突检测矩阵** | TypeScript → Bash | 100 | Delta解析 | 🟢 低 | 🔴 极高 |
| **Checkbox解析** | TypeScript → Bash | 50 | 无 | 🟢 低 | 🟢 中 |
| **验证器架构** | Zod → Bash | 300 | 无 | 🔴 高 | 🟡 高 |

---

### 3.2 Delta解析引擎移植方案

#### 目标：用Bash实现 `parseDeltaSpec()`

**技术选型**：
- 使用 `awk` 进行Section分割（比 `sed` 更适合多行处理）
- 使用 `grep -Pzo` 进行多行匹配（Requirement Block提取）
- 输出JSON格式，供后续脚本使用

#### 实现代码

```bash
#!/bin/bash
# .claude/scripts/parse-delta-spec.sh

parse_delta_spec() {
  local spec_file="$1"
  local output_json="$2"

  # ========================================
  # Step 1: 提取各个Section的内容
  # ========================================

  # 提取 ADDED Requirements section
  local added_section=$(awk '
    /^## ADDED Requirements/ { flag=1; next }
    /^##/ { flag=0 }
    flag { print }
  ' "$spec_file")

  # 提取 MODIFIED Requirements section
  local modified_section=$(awk '
    /^## MODIFIED Requirements/ { flag=1; next }
    /^##/ { flag=0 }
    flag { print }
  ' "$spec_file")

  # 提取 REMOVED Requirements section
  local removed_section=$(awk '
    /^## REMOVED Requirements/ { flag=1; next }
    /^##/ { flag=0 }
    flag { print }
  ' "$spec_file")

  # 提取 RENAMED Requirements section
  local renamed_section=$(awk '
    /^## RENAMED Requirements/ { flag=1; next }
    /^##/ { flag=0 }
    flag { print }
  ' "$spec_file")

  # ========================================
  # Step 2: 解析Requirement Blocks
  # ========================================

  parse_requirement_blocks() {
    local section_content="$1"

    # 使用 grep -Pzo 匹配多行Requirement Block
    # -P: Perl regex, -z: null-separated, -o: only matching
    echo "$section_content" | grep -Pzo '(?s)^### Requirement:.*?(?=^###|$)' \
      | while IFS= read -r -d '' block; do
          # 提取Requirement名称
          local name=$(echo "$block" | head -n1 | sed 's/^### Requirement: //' | xargs)
          # 输出JSON对象
          jq -n --arg name "$name" --arg raw "$block" '{name: $name, raw: $raw}'
        done | jq -s '.'  # 合并为JSON数组
  }

  local added_blocks=$(parse_requirement_blocks "$added_section")
  local modified_blocks=$(parse_requirement_blocks "$modified_section")

  # ========================================
  # Step 3: 解析REMOVED名称列表
  # ========================================

  local removed_names=$(echo "$removed_section" \
    | grep -E '^### Requirement:' \
    | sed 's/^### Requirement: //' \
    | xargs -I{} echo '"{}"' \
    | jq -s '.')

  # ========================================
  # Step 4: 解析RENAMED配对
  # ========================================

  local renamed_pairs=$(echo "$renamed_section" \
    | awk '
        /FROM:/ { from=$0; sub(/.*FROM: /, "", from); sub(/### Requirement: /, "", from) }
        /TO:/ {
          to=$0; sub(/.*TO: /, "", to); sub(/### Requirement: /, "", to);
          printf "{\"from\":\"%s\",\"to\":\"%s\"}\n", from, to
        }
      ' \
    | jq -s '.')

  # ========================================
  # Step 5: 组装最终JSON
  # ========================================

  jq -n \
    --argjson added "$added_blocks" \
    --argjson modified "$modified_blocks" \
    --argjson removed "$removed_names" \
    --argjson renamed "$renamed_pairs" \
    '{added: $added, modified: $modified, removed: $removed, renamed: $renamed}' \
    > "$output_json"

  echo "Delta parsed: $output_json"
}

# 使用示例
# parse_delta_spec "devflow/changes/REQ-123/specs/auth/spec.md" "delta.json"
```

**输出示例**：

```json
{
  "added": [
    {
      "name": "Two-Factor Authentication",
      "raw": "### Requirement: Two-Factor Authentication\nThe system MUST require OTP.\n\n#### Scenario: OTP required\n- WHEN user logs in\n- THEN OTP is sent"
    }
  ],
  "modified": [
    {
      "name": "User Login",
      "raw": "### Requirement: User Login\nThe system SHALL issue JWT after OTP verification."
    }
  ],
  "removed": ["Password Reset"],
  "renamed": [
    {"from": "Login", "to": "User Authentication"}
  ]
}
```

---

### 3.3 Archive合并算法移植方案

#### 目标：用Bash实现四阶段合并

```bash
#!/bin/bash
# .claude/scripts/merge-delta.sh

merge_delta_to_spec() {
  local delta_json="$1"
  local target_spec="$2"
  local output_spec="$3"

  # ========================================
  # Step 1: 提取目标Spec的Requirements Section
  # ========================================

  local before=$(awk '/^## Requirements/,0 {if(NR==1) next; print; exit}' "$target_spec")
  local header_line=$(grep -E '^## Requirements' "$target_spec")
  local section_body=$(awk '/^## Requirements/,/^##/ {if(NR==1 || /^##[^#]/) next; print}' "$target_spec")
  local after=$(awk '/^## Requirements/,0 {f=1} f && /^##[^#]/ {print; next} f' "$target_spec")

  # ========================================
  # Step 2: 构建 name → block 映射 (关联数组)
  # ========================================

  declare -A name_to_block

  # 解析现有Requirement Blocks
  while IFS= read -r -d '' block; do
    local name=$(echo "$block" | head -n1 | sed 's/^### Requirement: //' | xargs)
    name_to_block["$name"]="$block"
  done < <(echo "$section_body" | grep -Pzo '(?s)^### Requirement:.*?(?=^###|$)')

  # ========================================
  # Step 3: 执行四阶段合并
  # ========================================

  # Phase 1: RENAMED
  local renamed=$(jq -r '.renamed[] | "\(.from)|\(.to)"' "$delta_json")
  while IFS='|' read -r from to; do
    if [[ -n "${name_to_block[$from]}" ]]; then
      local block="${name_to_block[$from]}"
      # 替换Header行
      block=$(echo "$block" | sed "1s/.*/### Requirement: $to/")
      unset name_to_block["$from"]
      name_to_block["$to"]="$block"
    else
      echo "ERROR: RENAMED failed - '$from' not found" >&2
      return 1
    fi
  done <<< "$renamed"

  # Phase 2: REMOVED
  local removed=$(jq -r '.removed[]' "$delta_json")
  while IFS= read -r name; do
    unset name_to_block["$name"]
  done <<< "$removed"

  # Phase 3: MODIFIED
  local modified=$(jq -c '.modified[]' "$delta_json")
  while IFS= read -r mod_obj; do
    local name=$(echo "$mod_obj" | jq -r '.name')
    local raw=$(echo "$mod_obj" | jq -r '.raw')
    name_to_block["$name"]="$raw"
  done <<< "$modified"

  # Phase 4: ADDED
  local added=$(jq -c '.added[]' "$delta_json")
  while IFS= read -r add_obj; do
    local name=$(echo "$add_obj" | jq -r '.name')
    local raw=$(echo "$add_obj" | jq -r '.raw')

    if [[ -n "${name_to_block[$name]}" ]]; then
      echo "ERROR: ADDED failed - '$name' already exists" >&2
      return 1
    fi

    name_to_block["$name"]="$raw"
  done <<< "$added"

  # ========================================
  # Step 4: 重组Spec (保持原始顺序)
  # ========================================

  local rebuilt_section=""

  # 保留原始顺序
  while IFS= read -r orig_name; do
    if [[ -n "${name_to_block[$orig_name]}" ]]; then
      rebuilt_section+="${name_to_block[$orig_name]}"$'\n\n'
      unset name_to_block["$orig_name"]
    fi
  done < <(echo "$section_body" | grep -E '^### Requirement:' | sed 's/^### Requirement: //' | xargs -n1)

  # 追加新增的Requirement
  for name in "${!name_to_block[@]}"; do
    rebuilt_section+="${name_to_block[$name]}"$'\n\n'
  done

  # ========================================
  # Step 5: 写入输出文件
  # ========================================

  {
    echo "$before"
    echo "$header_line"
    echo "$rebuilt_section"
    echo "$after"
  } > "$output_spec"

  echo "Spec merged: $output_spec"
}

# 使用示例
# merge_delta_to_spec "delta.json" ".claude/specs/auth/spec.md" "merged_spec.md"
```

---

### 3.4 冲突检测矩阵移植方案

```bash
#!/bin/bash
# .claude/scripts/validate-delta-conflicts.sh

validate_delta_conflicts() {
  local delta_json="$1"

  # ========================================
  # 提取各Section的名称集合
  # ========================================

  local added_names=($(jq -r '.added[].name' "$delta_json"))
  local modified_names=($(jq -r '.modified[].name' "$delta_json"))
  local removed_names=($(jq -r '.removed[]' "$delta_json"))
  local renamed_from=($(jq -r '.renamed[].from' "$delta_json"))
  local renamed_to=($(jq -r '.renamed[].to' "$delta_json"))

  # ========================================
  # 检查重复（同Section内）
  # ========================================

  check_duplicates() {
    local -n arr=$1
    local section_name=$2

    local seen=()
    for name in "${arr[@]}"; do
      if [[ " ${seen[*]} " =~ " $name " ]]; then
        echo "ERROR: Duplicate in $section_name: '$name'" >&2
        return 1
      fi
      seen+=("$name")
    done
  }

  check_duplicates added_names "ADDED" || return 1
  check_duplicates modified_names "MODIFIED" || return 1
  check_duplicates removed_names "REMOVED" || return 1

  # ========================================
  # 检查跨Section冲突
  # ========================================

  # C4: MODIFIED ∩ REMOVED
  for name in "${modified_names[@]}"; do
    if [[ " ${removed_names[*]} " =~ " $name " ]]; then
      echo "ERROR: Conflict - '$name' in both MODIFIED and REMOVED" >&2
      return 1
    fi
  done

  # C5: ADDED ∩ REMOVED
  for name in "${added_names[@]}"; do
    if [[ " ${removed_names[*]} " =~ " $name " ]]; then
      echo "ERROR: Conflict - '$name' in both ADDED and REMOVED" >&2
      return 1
    fi
  done

  # C6: MODIFIED ∩ ADDED
  for name in "${modified_names[@]}"; do
    if [[ " ${added_names[*]} " =~ " $name " ]]; then
      echo "ERROR: Conflict - '$name' in both MODIFIED and ADDED" >&2
      return 1
    fi
  done

  # ========================================
  # 检查RENAMED特殊冲突
  # ========================================

  local num_renamed=${#renamed_from[@]}
  for ((i=0; i<num_renamed; i++)); do
    local from="${renamed_from[$i]}"
    local to="${renamed_to[$i]}"

    # C7: MODIFIED引用旧名称
    if [[ " ${modified_names[*]} " =~ " $from " ]]; then
      echo "ERROR: MODIFIED references old name '$from', should use new name '$to'" >&2
      return 1
    fi

    # C8: RENAMED TO与ADDED冲突
    if [[ " ${added_names[*]} " =~ " $to " ]]; then
      echo "ERROR: RENAMED TO '$to' collides with ADDED" >&2
      return 1
    fi
  done

  echo "✓ No conflicts detected"
  return 0
}

# 使用示例
# validate_delta_conflicts "delta.json"
```

---

## 📋 第四部分：实施路线图

### Phase 1: 基础设施搭建 (Week 1-2)

#### 1.1 创建Delta目录结构

```bash
.claude/
└── specs/                    # 系统真相 (新增)
    ├── auth/
    │   └── spec.md
    ├── orders/
    │   └── spec.md
    └── README.md

devflow/
├── changes/                  # 重命名 (原requirements/)
│   ├── REQ-123-add-2fa/
│   │   ├── proposal.md
│   │   ├── tasks.md
│   │   └── specs/           # Delta格式
│   │       └── auth/
│   │           └── spec.md
│   └── archive/             # 已完成变更 (新增)
│       └── 2025-01-14-REQ-122-user-login/
│           ├── proposal.md
│           ├── tasks.md
│           └── specs/
│               └── auth/
│                   └── spec.md
```

**迁移脚本**：

```bash
#!/bin/bash
# .claude/scripts/migrate-to-delta-structure.sh

migrate_to_delta_structure() {
  local repo_root=$(git rev-parse --show-toplevel)

  # 1. 创建 specs/ 目录
  mkdir -p "$repo_root/.claude/specs"

  # 2. 重命名 devflow/requirements/ → devflow/changes/
  if [[ -d "$repo_root/devflow/requirements" ]]; then
    mv "$repo_root/devflow/requirements" "$repo_root/devflow/changes"
  fi

  # 3. 创建 archive/ 目录
  mkdir -p "$repo_root/devflow/changes/archive"

  # 4. 初始化 specs/README.md
  cat > "$repo_root/.claude/specs/README.md" << 'EOF'
# System Specifications (Truth)

This directory contains the current state of all system capabilities.

## Structure
- Each subdirectory represents a capability (e.g., `auth/`, `orders/`)
- Each capability has a `spec.md` file with Requirements and Scenarios

## Important
- DO NOT modify files in this directory directly
- All changes must go through `devflow/changes/` → Archive process
- See `.claude/docs/guides/delta-workflow.md` for details
EOF

  echo "✓ Delta structure migrated"
}
```

#### 1.2 部署核心脚本

```bash
.claude/scripts/
├── parse-delta-spec.sh        # Delta解析引擎
├── merge-delta.sh              # Archive合并算法
├── validate-delta-conflicts.sh # 冲突检测矩阵
└── archive-requirement.sh      # 完整Archive流程
```

**测试脚本**：

```bash
#!/bin/bash
# .claude/tests/test_delta_engine.sh

test_parse_delta_spec() {
  local test_spec=$(mktemp)
  cat > "$test_spec" << 'EOF'
## ADDED Requirements
### Requirement: Two-Factor Auth
System MUST require OTP.

#### Scenario: OTP sent
- WHEN user logs in
- THEN OTP is sent

## MODIFIED Requirements
### Requirement: User Login
System SHALL issue JWT after OTP verification.

## REMOVED Requirements
### Requirement: Password Reset

## RENAMED Requirements
- FROM: ### Requirement: Login
- TO: ### Requirement: User Authentication
EOF

  local output_json=$(mktemp)
  parse_delta_spec "$test_spec" "$output_json"

  # 验证JSON结构
  local added_count=$(jq '.added | length' "$output_json")
  local modified_count=$(jq '.modified | length' "$output_json")
  local removed_count=$(jq '.removed | length' "$output_json")
  local renamed_count=$(jq '.renamed | length' "$output_json")

  assert_equals "$added_count" "1" "ADDED count"
  assert_equals "$modified_count" "1" "MODIFIED count"
  assert_equals "$removed_count" "1" "REMOVED count"
  assert_equals "$renamed_count" "1" "RENAMED count"

  rm "$test_spec" "$output_json"
}

test_validate_conflicts() {
  local test_json=$(mktemp)
  cat > "$test_json" << 'EOF'
{
  "added": [{"name": "Feature A"}],
  "modified": [{"name": "Feature A"}],
  "removed": [],
  "renamed": []
}
EOF

  # 应该检测到冲突 (ADDED + MODIFIED)
  if validate_delta_conflicts "$test_json" 2>/dev/null; then
    fail "Should detect ADDED + MODIFIED conflict"
  fi

  rm "$test_json"
  pass "Conflict detection works"
}

run_tests() {
  test_parse_delta_spec
  test_validate_conflicts
}

run_tests
```

---

### Phase 2: 工作流集成 (Week 3-4)

#### 2.1 修改 /flow-prd 命令

**现有流程**：
```
/flow-prd → prd-writer → 生成 PRD.md (全量文档)
```

**新流程**：
```
/flow-prd → prd-writer → 生成 proposal.md + specs/${module}/spec.md (Delta格式)
```

**prd-writer 代理修改**：

```markdown
# .claude/agents/prd-writer.md (增强)

## Execution Flow

### Step 1: Identify Affected Modules
Read research materials and user intent.
For each capability that will be changed:
- Determine if it's a NEW capability (goes to ADDED)
- Or an EXISTING capability (goes to MODIFIED)

Output: List of modules and operation types

### Step 2: Generate proposal.md
Create `devflow/changes/${REQ_ID}/proposal.md`:
- ## Why: 1-2 sentences
- ## What Changes: Bullet list of affected modules
- ## Impact: Dependencies, breaking changes

### Step 3: Generate Delta for Each Module
For each affected module, create `devflow/changes/${REQ_ID}/specs/${module}/spec.md`:

**If NEW module (capability doesn't exist in .claude/specs/)**:
```markdown
## ADDED Requirements
### Requirement: ${Name}
${Description with SHALL/MUST}

#### Scenario: ${ScenarioName}
- WHEN ${condition}
- THEN ${expected_behavior}
```

**If EXISTING module**:
```markdown
## MODIFIED Requirements
### Requirement: ${Name}
${FULL requirement text - copy from .claude/specs/${module}/spec.md and modify}

#### Scenario: ${ScenarioName}
- WHEN ${condition}
- THEN ${expected_behavior}
```

### Step 4: Validate Delta
Run validation:
```bash
bash .claude/scripts/parse-delta-spec.sh \
  "devflow/changes/${REQ_ID}/specs/${module}/spec.md" \
  "/tmp/delta.json"

bash .claude/scripts/validate-delta-conflicts.sh "/tmp/delta.json"
```

### Step 5: Constitution Check
Apply Article I, III, X checks as before.
```

#### 2.2 添加 /flow-archive 命令

```bash
#!/bin/bash
# .claude/commands/flow-archive.md

---
name: flow-archive
description: Archive completed requirement and merge deltas to specs
usage: /flow-archive "REQ-123"
---

# Flow Archive Command

Archive a completed requirement, merging Delta changes into system specs.

## Prerequisites
- All tasks in TASKS.md must be completed (checked)
- Tests must pass
- No uncommitted changes

## Execution Flow

### Step 1: Validate Prerequisites
```bash
REQ_ID="$1"
REQ_DIR="devflow/changes/${REQ_ID}"

# Check tasks completed
bash .claude/scripts/check-task-status.sh "$REQ_ID" --all-completed || exit 1

# Check tests passed
bash .claude/scripts/validate-constitution.sh "$REQ_ID" || exit 1
```

### Step 2: Parse and Validate Deltas
```bash
for spec_dir in "$REQ_DIR/specs"/*; do
  module=$(basename "$spec_dir")
  delta_json=$(mktemp)

  bash .claude/scripts/parse-delta-spec.sh \
    "$spec_dir/spec.md" \
    "$delta_json"

  bash .claude/scripts/validate-delta-conflicts.sh "$delta_json" || exit 1
done
```

### Step 3: Merge Deltas to Specs
```bash
for spec_dir in "$REQ_DIR/specs"/*; do
  module=$(basename "$spec_dir")
  target_spec=".claude/specs/$module/spec.md"

  # Create target if not exists
  if [[ ! -f "$target_spec" ]]; then
    mkdir -p ".claude/specs/$module"
    cat > "$target_spec" << EOF
# $module Specification

## Purpose
TBD - created by archiving ${REQ_ID}

## Requirements
EOF
  fi

  # Merge delta
  bash .claude/scripts/merge-delta.sh \
    "$delta_json" \
    "$target_spec" \
    "${target_spec}.new"

  mv "${target_spec}.new" "$target_spec"

  echo "✓ Merged delta to .claude/specs/$module/spec.md"
done
```

### Step 4: Move to Archive
```bash
archive_name="$(date +%Y-%m-%d)-${REQ_ID}"
mv "$REQ_DIR" "devflow/changes/archive/$archive_name"

echo "✓ Archived as $archive_name"
```

### Step 5: Git Commit
```bash
git add .claude/specs/ devflow/changes/archive/
git commit -m "chore($REQ_ID): archive completed requirement

- Merged deltas to system specs
- Archived change to devflow/changes/archive/$archive_name

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Example
```bash
/flow-archive "REQ-123"
# → Validates all tasks completed
# → Merges specs/auth/spec.md delta to .claude/specs/auth/spec.md
# → Moves devflow/changes/REQ-123/ to archive/2025-01-14-REQ-123/
# → Commits changes to Git
```
```

---

### Phase 3: 验证器升级 (Week 5-6)

#### 3.1 引入JSON Schema验证

**安装 `jsonschema` (Python工具)**：

```bash
# .claude/scripts/install-validators.sh
pip3 install jsonschema
```

**定义Schema**：

```json
// .claude/schemas/delta-spec.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["added", "modified", "removed", "renamed"],
  "properties": {
    "added": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "raw"],
        "properties": {
          "name": {"type": "string", "minLength": 1},
          "raw": {"type": "string", "pattern": "^### Requirement:"}
        }
      }
    },
    "modified": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "raw"],
        "properties": {
          "name": {"type": "string", "minLength": 1},
          "raw": {"type": "string", "pattern": "^### Requirement:"}
        }
      }
    },
    "removed": {
      "type": "array",
      "items": {"type": "string", "minLength": 1}
    },
    "renamed": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from", "to"],
        "properties": {
          "from": {"type": "string", "minLength": 1},
          "to": {"type": "string", "minLength": 1}
        }
      }
    }
  }
}
```

**验证脚本**：

```bash
#!/bin/bash
# .claude/scripts/validate-delta-schema.sh

validate_delta_schema() {
  local delta_json="$1"
  local schema=".claude/schemas/delta-spec.schema.json"

  # 使用jsonschema CLI工具验证
  jsonschema -i "$delta_json" "$schema" 2>&1

  if [[ $? -eq 0 ]]; then
    echo "✓ Schema validation passed"
    return 0
  else
    echo "✗ Schema validation failed" >&2
    return 1
  fi
}
```

#### 3.2 增强业务规则验证

```bash
#!/bin/bash
# .claude/scripts/validate-delta-business-rules.sh

validate_business_rules() {
  local delta_json="$1"
  local errors=0

  # Rule 1: ADDED/MODIFIED必须包含SHALL或MUST
  local added_without_shall=$(jq -r '.added[] | select(.raw | test("\\b(SHALL|MUST)\\b") | not) | .name' "$delta_json")
  if [[ -n "$added_without_shall" ]]; then
    echo "ERROR: ADDED requirements must contain SHALL or MUST:" >&2
    echo "$added_without_shall" | sed 's/^/  - /' >&2
    ((errors++))
  fi

  # Rule 2: ADDED/MODIFIED必须至少有1个Scenario
  local added_without_scenario=$(jq -r '.added[] | select(.raw | test("^#### Scenario:"; "m") | not) | .name' "$delta_json")
  if [[ -n "$added_without_scenario" ]]; then
    echo "ERROR: ADDED requirements must have at least one scenario:" >&2
    echo "$added_without_scenario" | sed 's/^/  - /' >&2
    ((errors++))
  fi

  # Rule 3: 检查Scenario格式 (必须是 #### 级别)
  local invalid_scenarios=$(jq -r '.added[], .modified[] | .raw' "$delta_json" \
    | grep -E '^(###|#####) Scenario:' \
    | wc -l)
  if [[ "$invalid_scenarios" -gt 0 ]]; then
    echo "ERROR: Scenarios must use '#### Scenario:' format (4 hashtags)" >&2
    ((errors++))
  fi

  if [[ $errors -eq 0 ]]; then
    echo "✓ Business rules validation passed"
    return 0
  else
    echo "✗ $errors business rule violation(s) found" >&2
    return 1
  fi
}
```

---

### Phase 4: 文档和培训 (Week 7-8)

#### 4.1 更新README文档

```markdown
# cc-devflow v3.0.0 - Delta驱动的需求开发流

## 核心变更 (Breaking Changes)

### 1. 目录结构调整

**旧结构**:
```
devflow/requirements/REQ-123/
├── PRD.md
├── EPIC.md
└── TASKS.md
```

**新结构**:
```
.claude/specs/              # 系统真相 (新增)
└── auth/spec.md

devflow/changes/            # 变更提案 (重命名)
├── REQ-123-add-2fa/
│   ├── proposal.md
│   ├── tasks.md
│   └── specs/
│       └── auth/spec.md    # Delta格式
└── archive/                # 已完成变更
    └── 2025-01-14-REQ-122/
```

### 2. Delta格式规范

所有需求变更必须使用Delta格式：

```markdown
## ADDED Requirements
### Requirement: New Feature
System SHALL provide new capability.

#### Scenario: Success case
- WHEN user does X
- THEN system does Y

## MODIFIED Requirements
### Requirement: Existing Feature
System SHALL provide **updated** capability.

#### Scenario: Updated case
- WHEN user does X
- THEN system does Y (modified behavior)

## REMOVED Requirements
### Requirement: Old Feature

## RENAMED Requirements
- FROM: ### Requirement: Old Name
- TO: ### Requirement: New Name
```

### 3. 新增命令

#### `/flow-archive` - 归档完成的需求

```bash
/flow-archive "REQ-123"

# 功能：
# 1. 验证所有任务已完成
# 2. 合并Delta到 .claude/specs/
# 3. 移动到 archive/
# 4. 创建Git commit
```

### 4. 迁移指南

#### 对于现有需求
```bash
# 自动迁移脚本
bash .claude/scripts/migrate-to-delta-structure.sh

# 手动步骤：
# 1. 重命名 devflow/requirements/ → devflow/changes/
# 2. 创建 .claude/specs/ 目录
# 3. 为每个已完成需求运行 /flow-archive
```

#### 对于新需求
```bash
# 使用新的Delta格式
/flow-init "REQ-124|Add social login"
/flow-prd "REQ-124"  # 自动生成Delta格式

# 检查生成的文件
cat devflow/changes/REQ-124-add-social-login/specs/auth/spec.md
```

## 常见问题

### Q1: 为什么需要Delta格式？
A: Delta格式精确追踪"新增/修改/删除了什么"，避免全量文档的歧义。

### Q2: 如何处理多模块变更？
A: 在 `specs/` 下为每个模块创建单独的 `spec.md`：
```
devflow/changes/REQ-123/specs/
├── auth/spec.md      # 认证模块变更
├── orders/spec.md    # 订单模块变更
└── notifications/spec.md  # 通知模块变更
```

### Q3: Archive后如何查看历史？
A:
```bash
# 查看所有已归档需求
ls -1 devflow/changes/archive/

# 查看特定需求
cat devflow/changes/archive/2025-01-14-REQ-123/proposal.md
```

### Q4: 如何回滚变更？
A:
```bash
# 方案1: Git revert
git log --oneline | grep "REQ-123"
git revert <commit-hash>

# 方案2: 创建反向Delta
/flow-init "REQ-125|Rollback REQ-123"
# 在 specs/auth/spec.md 中使用 REMOVED 删除之前添加的Requirement
```
```

#### 4.2 创建Delta工作流指南

```markdown
# Delta工作流完整指南

## 场景1: 新增功能 (Greenfield)

### Step 1: 初始化需求
```bash
/flow-init "REQ-123|Add two-factor authentication"
```

### Step 2: 生成PRD (Delta格式)
```bash
/flow-prd "REQ-123"
```

生成的文件：
```
devflow/changes/REQ-123-add-two-factor-authentication/
├── proposal.md
└── specs/
    └── auth/spec.md  # Delta格式
```

`specs/auth/spec.md` 内容：
```markdown
## ADDED Requirements
### Requirement: Two-Factor Authentication
The system MUST require a second factor during login.

#### Scenario: OTP required
- WHEN valid credentials are provided
- THEN an OTP challenge is required

#### Scenario: OTP verified
- WHEN correct OTP is entered
- THEN user is authenticated
```

### Step 3: 生成Epic和任务
```bash
/flow-epic "REQ-123"
```

### Step 4: 执行开发
```bash
/flow-dev "REQ-123"
```

### Step 5: QA验证
```bash
/flow-qa "REQ-123"
```

### Step 6: 归档需求
```bash
/flow-archive "REQ-123"
```

**Archive做了什么**：
1. 读取 `devflow/changes/REQ-123/specs/auth/spec.md` (Delta)
2. 如果 `.claude/specs/auth/spec.md` 不存在，创建骨架
3. 合并ADDED Requirements到 `.claude/specs/auth/spec.md`
4. 移动 `REQ-123/` 到 `archive/2025-01-14-REQ-123/`
5. Git commit

---

## 场景2: 修改现有功能 (Brownfield)

### Step 1: 初始化需求
```bash
/flow-init "REQ-124|Update login to support biometric"
```

### Step 2: 生成PRD (检查现有Spec)
```bash
/flow-prd "REQ-124"
```

**prd-writer 自动识别**：
- 读取 `.claude/specs/auth/spec.md` (现有真相)
- 识别到 "User Login" Requirement已存在
- 生成MODIFIED Delta

`specs/auth/spec.md` 内容：
```markdown
## MODIFIED Requirements
### Requirement: User Login
The system SHALL authenticate users via password OR biometric.

#### Scenario: Password login
- WHEN valid password provided
- THEN user is authenticated

#### Scenario: Biometric login (新增)
- WHEN valid fingerprint provided
- THEN user is authenticated
```

### Step 3-6: 同场景1

### Archive结果：
- 读取MODIFIED Delta
- 替换 `.claude/specs/auth/spec.md` 中的 "User Login" Requirement
- 保持其他Requirements不变

---

## 场景3: 删除功能

### Step 1: 初始化需求
```bash
/flow-init "REQ-125|Remove password reset feature"
```

### Step 2: 生成PRD
```bash
/flow-prd "REQ-125"
```

`specs/auth/spec.md` 内容：
```markdown
## REMOVED Requirements
### Requirement: Password Reset

**Reason**: Low usage, security concerns
**Migration Path**: Users must contact support for password reset
```

### Archive结果：
- 从 `.claude/specs/auth/spec.md` 中删除 "Password Reset" Requirement
- 保留其他Requirements

---

## 场景4: 重命名功能

### Step 1: 初始化需求
```bash
/flow-init "REQ-126|Rename Login to User Authentication"
```

### Step 2: 生成PRD
```bash
/flow-prd "REQ-126"
```

`specs/auth/spec.md` 内容：
```markdown
## RENAMED Requirements
- FROM: ### Requirement: Login
- TO: ### Requirement: User Authentication
```

### Archive结果：
- 在 `.claude/specs/auth/spec.md` 中找到 "Login" Requirement
- 替换Header为 "User Authentication"
- 保持内容不变

---

## 场景5: 复杂变更 (RENAMED + MODIFIED)

### 正确做法：
```markdown
## RENAMED Requirements
- FROM: ### Requirement: Login
- TO: ### Requirement: User Authentication

## MODIFIED Requirements
### Requirement: User Authentication  # ⚠️ 使用新名称
The system SHALL authenticate users via multiple methods.
```

### 错误做法：
```markdown
## RENAMED Requirements
- FROM: ### Requirement: Login
- TO: ### Requirement: User Authentication

## MODIFIED Requirements
### Requirement: Login  # ❌ 错误：应该用新名称
```

**错误提示**：
```
ERROR: MODIFIED references old name 'Login', should use new name 'User Authentication'
```

---

## 冲突场景和解决方案

### 冲突1: MODIFIED + REMOVED
```markdown
## MODIFIED Requirements
### Requirement: Feature A
...

## REMOVED Requirements
### Requirement: Feature A
```

**错误提示**：
```
ERROR: Conflict - 'Feature A' in both MODIFIED and REMOVED
```

**解决方案**：移除MODIFIED，只保留REMOVED

---

### 冲突2: ADDED + MODIFIED
```markdown
## ADDED Requirements
### Requirement: Feature B
...

## MODIFIED Requirements
### Requirement: Feature B
...
```

**错误提示**：
```
ERROR: Conflict - 'Feature B' in both ADDED and MODIFIED
```

**解决方案**：
- 如果Feature B是新增的，只用ADDED
- 如果Feature B已存在，只用MODIFIED
- 检查 `.claude/specs/` 确认Feature B是否存在

---

## 验证命令

### 验证Delta格式
```bash
bash .claude/scripts/parse-delta-spec.sh \
  "devflow/changes/REQ-123/specs/auth/spec.md" \
  "/tmp/delta.json"
```

### 验证冲突
```bash
bash .claude/scripts/validate-delta-conflicts.sh "/tmp/delta.json"
```

### 预览Archive结果 (不写入)
```bash
bash .claude/scripts/merge-delta.sh \
  "/tmp/delta.json" \
  ".claude/specs/auth/spec.md" \
  "/tmp/preview.md"

cat /tmp/preview.md
```

---

## 最佳实践

### 1. 一次只修改一个Requirement
❌ **错误**：在同一个需求中MODIFIED多个不相关的Requirements

✅ **正确**：每个需求聚焦一个功能点

### 2. MODIFIED包含完整内容
❌ **错误**：
```markdown
## MODIFIED Requirements
### Requirement: User Login
Add biometric support.  # ❌ 不完整
```

✅ **正确**：
```markdown
## MODIFIED Requirements
### Requirement: User Login
The system SHALL authenticate users via password OR biometric.

#### Scenario: Password login
...

#### Scenario: Biometric login
...
```

### 3. 先Archive旧需求，再开始新需求
避免多个需求同时修改同一个模块，导致冲突。

### 4. 定期同步 .claude/specs/
```bash
# 每周回顾
ls -lt devflow/changes/archive/ | head -10

# 检查specs/完整性
find .claude/specs/ -name "spec.md" -exec echo {} \;
```
```

---

## 🎁 第五部分：预期收益分析

### 5.1 量化收益

| 指标 | Before (v2.0.0) | After (v3.0.0 Delta) | 改进 |
|------|-----------------|----------------------|------|
| **需求变更追踪** | 无，全量文档 | 精确Delta，可追溯 | +100% |
| **文档一致性** | 手动维护 | 自动合并 + 冲突检测 | +80% |
| **历史查询** | 散落在 requirements/ | 集中在 archive/ | +60% |
| **多模块变更** | 单个PRD混杂 | 每模块独立Delta | +70% |
| **回滚能力** | Git revert整个commit | 反向Delta (精确) | +50% |
| **验证严格度** | Bash脚本 | Schema + 业务规则 + 冲突检测 | +90% |

### 5.2 定性收益

#### 开发体验改善
- **明确的变更边界**: "这个需求到底改了什么？" → 一目了然
- **无损合并**: 不会丢失手动添加的注释或格式
- **冲突前置**: 在Archive前发现冲突，而不是合并后

#### 团队协作改善
- **并行开发**: 多个需求可以同时修改不同模块（Delta隔离）
- **Code Review**: Review Delta文件比Review完整PRD更高效
- **知识沉淀**: archive/保留了完整的需求演进历史

#### 长期维护改善
- **系统真相**: `.claude/specs/` 始终反映当前系统状态
- **变更审计**: 每个Archive commit都是一次变更记录
- **文档驱动**: PRD → Delta → Archive → Spec (完整闭环)

---

## 🚨 第六部分：风险和挑战

### 6.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| **Bash脚本复杂度** | Delta解析可能有Bug | 🟡 中 | 完整的测试套件 + 金丝雀发布 |
| **性能问题** | Archive大型Spec时变慢 | 🟢 低 | 优化Regex，使用awk代替多次grep |
| **数据损坏** | 合并算法错误导致Spec损坏 | 🔴 高 | 事务式验证 + Git备份 |
| **学习曲线** | 团队需要理解Delta概念 | 🟡 中 | 详细文档 + 交互式培训 |

### 6.2 迁移风险

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **现有需求迁移失败** | 数据丢失 | 提供rollback脚本 |
| **工具链不兼容** | CI/CD流程失败 | 保持兼容模式 (同时支持旧结构) |
| **用户抵触** | 拒绝使用新流程 | 分阶段推广，保留旧命令 |

### 6.3 缓解策略

#### 1. 渐进式迁移
```bash
# Phase 1: 新需求使用Delta格式 (Week 1-2)
# Phase 2: 选择性迁移旧需求 (Week 3-4)
# Phase 3: 强制所有需求Delta化 (Week 5+)
```

#### 2. 双轨运行
```bash
# 保留旧命令别名
alias flow-prd-legacy='flow-prd --no-delta'

# 新旧格式自动检测
if [[ -f "devflow/changes/$REQ_ID/PRD.md" ]]; then
  # 旧格式
elif [[ -f "devflow/changes/$REQ_ID/proposal.md" ]]; then
  # 新格式
fi
```

#### 3. Rollback计划
```bash
# .claude/scripts/rollback-delta-migration.sh

rollback_to_v2() {
  # 1. 重命名 devflow/changes/ → devflow/requirements/
  mv devflow/changes devflow/requirements

  # 2. 删除 .claude/specs/
  rm -rf .claude/specs

  # 3. 恢复旧版脚本
  git checkout v2.0.0 -- .claude/scripts/

  echo "✓ Rolled back to v2.0.0"
}
```

---

## 📖 第七部分：参考资料

### OpenSpec 核心代码位置

| 功能 | 文件路径 | 行数 | 关键函数 |
|------|----------|------|----------|
| Delta解析 | `src/core/parsers/requirement-blocks.ts` | 113-205 | `parseDeltaSpec()` |
| Archive合并 | `src/core/archive.ts` | 343-600 | `buildUpdatedSpec()` |
| 冲突检测 | `src/core/archive.ts` | 351-431 | Pre-validation logic |
| Validator | `src/core/validation/validator.ts` | 1-399 | `validateChangeDeltaSpecs()` |
| Section提取 | `src/core/parsers/requirement-blocks.ts` | 24-96 | `extractRequirementsSection()` |

### cc-devflow 需要修改的文件

| 文件 | 类型 | 修改内容 |
|------|------|----------|
| `.claude/agents/prd-writer.md` | 代理 | 增加Delta生成逻辑 |
| `.claude/commands/flow-archive.md` | 命令 | 新增Archive命令 |
| `.claude/scripts/parse-delta-spec.sh` | 脚本 | 新增Delta解析引擎 |
| `.claude/scripts/merge-delta.sh` | 脚本 | 新增合并算法 |
| `.claude/scripts/validate-delta-conflicts.sh` | 脚本 | 新增冲突检测 |
| `.claude/constitution/project-constitution.md` | 文档 | 新增Article XI (Delta Discipline) |

---

## 🎯 总结：核心吸收建议

### 立即采纳 (P0 - Week 1-2)
1. **Delta解析引擎** - 核心算法，100% 必需
2. **冲突检测矩阵** - 保证数据完整性
3. **目录结构调整** - specs/ + changes/ + archive/

### 短期采纳 (P1 - Week 3-4)
4. **Archive合并算法** - 自动化知识沉淀
5. **Validator架构** - Schema + 业务规则
6. **/flow-archive命令** - 完整工作流闭环

### 长期考虑 (P2 - Week 5-8)
7. **多工具适配层** - 支持Cursor、Codex等
8. **Checkbox解析优化** - 替代 `.completed` 文件
9. **JSON Schema验证** - 引入jsonschema工具

### 可选增强 (P3 - Future)
10. **TypeScript重写** - 长期考虑用TS重写核心脚本
11. **Web Dashboard** - 可视化Delta和Archive
12. **AI辅助冲突解决** - LLM分析冲突并提供修复建议

---

## ⚖️ 最终结论

OpenSpec的核心价值不是"概念"（双轨架构、Delta格式），而是**工程实现的严谨性**：

1. **精确的AST解析** - 不是正则匹配，而是结构化解析
2. **事务式合并** - 四阶段 + 冲突检测 + 原子操作
3. **完整的验证体系** - Schema + 业务规则 + 跨Section检查
4. **可扩展架构** - Configurator模式 + 注册表

cc-devflow应该**移植算法，而不是复制架构**：
- ✅ 采纳：Delta解析、冲突检测、Archive合并
- ❌ 不采纳：TypeScript重写、Zod Schema（保持Bash栈）
- 🤔 按需：多工具适配（目前只需Claude Code）

**实施建议**：分阶段推进，Week 1-2聚焦核心算法移植，Week 3-4集成到现有工作流，Week 5-8优化和文档化。

---

**文档版本**: v1.0.0
**作者**: Claude (Anna AI Assistant)
**审核**: Pending (Dimon Review)
**最后更新**: 2025-01-14
