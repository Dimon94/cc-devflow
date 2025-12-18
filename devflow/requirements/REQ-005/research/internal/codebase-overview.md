# Codebase Overview - REQ-005 (RM-007)

## 现有适配器架构 (Existing Adapter Architecture)

### 核心接口 (Core Interface)
- [adapter-interface.js](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/lib/adapters/adapter-interface.js): 定义了 `AgentAdapter` 基类，包含：
  - `name`: 适配器名称 (如 'claude', 'codex')
  - `folder`: 代理配置文件夹 (如 '.claude', '.codex')
  - `detect()`: 环境检测逻辑
  - `execute()`: 命令执行核心
  - `capabilities`: 能力列表

### 已实现适配器 (Implemented Adapters)
- [claude-adapter.js](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/lib/adapters/claude-adapter.js): Claude Code 官方适配。
- [codex-adapter.js](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/lib/adapters/codex-adapter.js): Codex CLI 适配。

### 配置与元数据 (Config & Metadata)
- [config/adapters.yml](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/config/adapters.yml): 处理首选适配器和安全策略。
- [config/schema/adapters.schema.json](file:///Users/dimon/001Area/80-CodeWorld/002-devflow/cc-devflow/config/schema/adapters.schema.json): 适配器配置校验。

## 模板引擎集成点 (Template Engine Integration Points)

### 潜在入口
- 目前尚未在 `lib/` 中发现统一的模板渲染模块。
- 计划新建 `lib/template-engine.js` 作为核心组件。
- 模板文件预留路径：`templates/adapters/[platform]/[command].hbs`。

## 依赖分析 (Dependency Analysis)
- `package.json` 当前未包含 `handlebars`，需在后续步骤中引入。
- 现有依赖：`js-yaml`, `zod`, `jest`。

## 内部调研结论
1. 已有完善的适配器接口定义 (`AgentAdapter`)，为模板引擎的多平台支持奠定了基础。
2. `detect()` 机制可以被模板引擎直接复用，用于选择对应的渲染模板。
3. 现有的适配器实现多为模拟或专用逻辑，模板引擎将帮助统一命令生成的逻辑。
