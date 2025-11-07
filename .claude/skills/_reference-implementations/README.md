# Reference Implementations

**这些是参考实现，不会被 Claude Code 激活为 skills。**

## 用途

这些参考实现的作用是：

1. **为 `project-guidelines-generator` agent 提供学习样本**
   - Agent 会读取这些文件，学习结构和模式
   - 理解如何组织 SKILL.md 和 resources/
   - 提取最佳实践和代码示例

2. **展示特定技术栈的最佳实践**
   - `frontend-react-mui/`: React 18 + Material-UI v7 + TanStack Query/Router
   - `backend-express-prisma/`: Express + Prisma + TypeScript

3. **作为生成其他技术栈 guidelines 的模板**
   - Vue + Vuetify → 适配自 frontend-react-mui
   - Django + SQLAlchemy → 适配自 backend-express-prisma

## 生成的技能位置

实际激活的技能位于：
- `.claude/skills/frontend-guidelines/` - 根据项目技术栈生成的前端指南
- `.claude/skills/backend-guidelines/` - 根据项目技术栈生成的后端指南

## 如何使用

运行以下命令生成适配你项目的开发指南：

```bash
# 生成前端指南
/flow-guidelines --frontend

# 生成后端指南
/flow-guidelines --backend

# 自动检测并生成（可能生成 1 或 2 个）
/flow-guidelines
```

## 技术栈映射

### Frontend Reference (React + MUI)
- **Framework**: React 18
- **UI Library**: Material-UI v7
- **Data Fetching**: TanStack Query (useSuspenseQuery)
- **Routing**: TanStack Router
- **State Management**: React Context + Query Cache
- **Styling**: MUI sx prop + styled-components
- **TypeScript**: Strict mode

### Backend Reference (Express + Prisma)
- **Runtime**: Node.js
- **Framework**: Express
- **ORM**: Prisma
- **Database**: MySQL (but Prisma supports多种)
- **Architecture**: Layered (Routes → Controllers → Services → Repositories)
- **Validation**: Zod schemas
- **Error Tracking**: Sentry
- **TypeScript**: Strict mode

## 维护

这些参考实现来自 `claude-code-infrastructure-showcase` 项目。

如需更新：
```bash
# 从 showcase 复制最新版本
cp -r claude-code-infrastructure-showcase/.claude/skills/frontend-dev-guidelines \
      .claude/skills/_reference-implementations/frontend-react-mui

cp -r claude-code-infrastructure-showcase/.claude/skills/backend-dev-guidelines \
      .claude/skills/_reference-implementations/backend-express-prisma
```

## 架构哲学

**为什么不直接激活这些 skills？**

因为：
1. **技术栈特定性**：这些是 React+MUI 和 Express+Prisma 的最佳实践，不适用于所有项目
2. **职责分明**：前端和后端应该是独立的 skills，各自有清晰的激活边界
3. **动态适配**：每个项目应该有适合自己技术栈的 guidelines

**生成系统的优势**：
- ✅ 自动检测项目技术栈
- ✅ 获取官方最新文档（Context7 MCP）
- ✅ 适配不同框架（React/Vue/Angular, Express/Django/FastAPI）
- ✅ 职责分明（frontend-guidelines vs backend-guidelines）
- ✅ 保持最佳实践（从参考实现学习模式）

---

**Remember**: Template is code, generation is compilation.
