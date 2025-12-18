# Research Summary - REQ-005 (RM-007): Command Template Engine

## 核心洞察 (Core Insights)

1. **Handlebars.js 是最佳选择**:
   - 语法简单且强大，支持变量、条件、循环。
   - 易于扩展自定义 Helpers (如 `{{platform 'codex'}}`)。
   - 社区生态丰富，Node.js 集成成熟。
   - **更新 (Source Analysis)**: `spec-kit` 使用 Shell 脚本在构建时静态生成模板。相比之下，`cc-devflow` 选择 Runtime Handlebars 渲染是更现代、更灵活的方案，避免了维护大量静态 ZIP 包的负担。

2. **多平台适配策略**:
   - 借鉴 `spec-kit` 的 `AGENT_CONFIG` 设计模式。
   - 模板存储按平台隔离：`templates/adapters/[platform]/[command].hbs`。
   - 降级机制：如果找不到特定平台的模板，回退到 `templates/adapters/generic/` 或 `default`。

3. **能力检测集成**:
   - 复用 RM-006 中定义的 `AgentAdapter.detect()` 机制。
   - 加强探测逻辑：检查环境变量、特定配置文件 (如 `.claude`, `.codex`) 或 CLI 工具是否存在 (参考 `spec-kit` 的 `check_tool` 实现)。

## 推荐用法 (Recommended Usage)

- **模板注册**: 启动时扫描 `templates/adapters/` 并根据 `AgentAdapter` 的名称注册 Partial 或模板。
- **上下文注入**: 在渲染时注入全局上下文（如 `reqId`, `title`, `platform`）和命令特定参数。
- **动态 Helpers**: 实现 `{{agent_script}}` 和 `{{agent_args}}` helper，模拟 `spec-kit` 的构建转换逻辑。

## 待明确内容 (Pending Clarification)

- [ ] 是否需要支持模板继承 (Template Inheritance)？
- [ ] 模板版本控制的具体实现方式。
