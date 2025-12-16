# Claude Agent SDK Official Documentation

**Source**: Context7 - /anthropics/claude-agent-sdk-typescript
**Retrieved**: 2025-12-15
**Topic**: Agent Architecture, Tool Use, Multi-Agent Systems

---

## Core API: query() Function

### Basic Usage Pattern

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

const response = query({
  prompt: "Your task description",
  options: {
    model: "claude-sonnet-4-5",
    // ... configuration options
  }
});

for await (const message of response) {
  console.log(message);
}
```

---

## Tool Management

### 1. Strict Allowlist (Specific Tools Only)

```typescript
const response = query({
  prompt: "Analyze the codebase structure",
  options: {
    model: "claude-sonnet-4-5",
    tools: ["Read", "Grep", "Glob"],  // Only these tools available
    workingDirectory: "/path/to/project"
  }
});
```

### 2. Disable All Built-in Tools (Custom MCP Tools Only)

```typescript
const customToolsOnly = query({
  prompt: "Process data using custom tools",
  options: {
    model: "claude-sonnet-4-5",
    tools: [],  // No built-in tools
    mcpServers: {
      "custom": myCustomServer
    }
  }
});
```

### 3. Use All Default Tools (Preset)

```typescript
const allTools = query({
  prompt: "Full codebase analysis and modifications",
  options: {
    model: "claude-sonnet-4-5",
    tools: { type: "preset", preset: "claude_code" }
  }
});
```

### 4. Exclusion Pattern (Disallowed Tools)

```typescript
const mostTools = query({
  prompt: "Read-only analysis",
  options: {
    model: "claude-sonnet-4-5",
    disallowedTools: ["Write", "Edit", "Bash"]  // Exclude specific tools
  }
});
```

---

## Permission Management

### Permission Modes

1. **acceptEdits**: Automatically approve file edits
2. **default**: Standard permission checks
3. **bypassPermissions**: Skip all checks (use with caution)

### Custom Permission Callback

```typescript
const customPermissions = query({
  prompt: "Deploy the application to production",
  options: {
    permissionMode: "default",
    canUseTool: async (toolName, input) => {
      // Allow read-only operations
      if (['Read', 'Grep', 'Glob'].includes(toolName)) {
        return { behavior: "allow" };
      }

      // Deny destructive bash commands
      if (toolName === 'Bash' &&
          (input.command.includes('rm ') || input.command.includes('delete'))) {
        return {
          behavior: "deny",
          message: "Destructive operations require manual approval"
        };
      }

      // Ask for confirmation on file writes
      if (toolName === 'Write' || toolName === 'Edit') {
        return {
          behavior: "ask",
          message: `Allow modification of ${input.file_path}?`
        };
      }

      return { behavior: "allow" };
    },
    model: "claude-sonnet-4-5"
  }
});
```

---

## Multi-Agent Architecture

### Specialized Subagents Pattern

**Use Case**: Different expertise areas (security, performance, testing, code quality)

```typescript
const response = query({
  prompt: "Review the entire application for security vulnerabilities, performance issues, and test coverage",
  options: {
    model: "claude-sonnet-4-5",
    agents: {
      "security-reviewer": {
        description: "Expert in security auditing and vulnerability analysis. Use this agent for security reviews, penetration testing insights, and identifying security flaws.",
        prompt: `You are a security expert specializing in web application security.
Focus on:
- Authentication and authorization vulnerabilities
- SQL injection and XSS vulnerabilities
- Insecure dependencies
- Credential exposure
- API security issues

Provide detailed explanations with severity levels and remediation steps.`,
        tools: ["Read", "Grep", "Glob", "Bash"],
        model: "sonnet"
      },

      "performance-analyst": {
        description: "Performance optimization expert. Use for analyzing bottlenecks, memory leaks, and optimization opportunities.",
        prompt: `You are a performance optimization specialist.
Analyze:
- Algorithm complexity and bottlenecks
- Memory usage patterns
- Database query optimization
- Caching strategies
- Resource utilization

Provide specific metrics and actionable recommendations.`,
        tools: ["Read", "Grep", "Glob", "Bash"],
        model: "sonnet"
      },

      "test-analyst": {
        description: "Testing and quality assurance expert. Use for test coverage analysis, test recommendations, and QA improvements.",
        prompt: `You are a QA and testing expert.
Evaluate:
- Test coverage completeness
- Edge cases and boundary conditions
- Integration test scenarios
- Mock and stub usage
- Test maintainability

Suggest missing tests with code examples.`,
        tools: ["Read", "Grep", "Glob", "Bash", "Write"],
        model: "haiku"
      },

      "code-reviewer": {
        description: "Code quality and best practices expert. Use for code reviews, refactoring suggestions, and architecture analysis.",
        prompt: `You are a senior software architect focused on code quality.
Review:
- Code organization and modularity
- Design patterns and SOLID principles
- Error handling and edge cases
- Code duplication and technical debt
- Documentation quality

Provide refactoring suggestions with examples.`,
        tools: ["Read", "Grep", "Glob", "Edit", "Write"],
        model: "sonnet"
      }
    }
  }
});

// The main agent will automatically invoke appropriate subagents
// based on their descriptions and the task requirements
for await (const message of response) {
  if (message.type === 'assistant') {
    console.log(message.content);
  } else if (message.type === 'system' && message.subtype === 'subagent_start') {
    console.log(`Starting subagent: ${message.agent_name}`);
  } else if (message.type === 'system' && message.subtype === 'subagent_end') {
    console.log(`Subagent completed: ${message.agent_name}`);
  }
}
```

---

## Custom MCP Tools

### Creating Type-Safe MCP Servers

```typescript
import { createSdkMcpServer, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const appTools = createSdkMcpServer({
  name: "app-services",
  version: "1.0.0",
  tools: [
    tool(
      "send_notification",
      "Send a notification to users",
      {
        userId: z.string(),
        message: z.string(),
        priority: z.enum(["low", "medium", "high"]).default("medium")
      },
      async (args) => {
        await notificationService.send(args);
        return {
          content: [{ type: "text", text: "Notification sent successfully" }]
        };
      }
    ),
    tool(
      "log_event",
      "Log application events for monitoring",
      {
        event: z.string(),
        data: z.record(z.any()).optional(),
        severity: z.enum(["info", "warning", "error"]).default("info")
      },
      async (args) => {
        logger.log(args.severity, args.event, args.data);
        return {
          content: [{ type: "text", text: "Event logged" }]
        };
      }
    )
  ]
});
```

**Key Features**:
- Zod schema validation for input parameters
- Type-safe async handlers
- Structured responses compatible with Claude API
- Error handling support

---

## Multi-Turn Conversations

### Method 1: Async Generator Function

```typescript
async function* conversationFlow() {
  yield "Analyze the user authentication system";
  yield "Now add OAuth2 support";
  yield "Generate unit tests for the OAuth implementation";
}

const response = query({
  prompt: conversationFlow(),
  options: {
    model: "claude-sonnet-4-5",
    workingDirectory: "/path/to/project"
  }
});
```

### Method 2: Dynamic User Input Queue

```typescript
async function interactiveAgent() {
  const userInputs: string[] = [];

  async function* getUserInput() {
    for (const input of userInputs) {
      yield input;
    }
  }

  const response = query({
    prompt: getUserInput(),
    options: { model: "claude-sonnet-4-5" }
  });

  // Simulate user adding requests over time
  setTimeout(() => userInputs.push("Create a REST API server"), 1000);
  setTimeout(() => userInputs.push("Add authentication middleware"), 3000);
  setTimeout(() => userInputs.push("Write integration tests"), 5000);

  for await (const message of response) {
    console.log(message);
  }
}
```

---

## DevOps Agent Example

### Complete Configuration

```typescript
const response = query({
  prompt: task,
  options: {
    model: "claude-sonnet-4-5",
    workingDirectory: process.cwd(),
    systemPrompt: `You are a DevOps automation expert.
- Monitor system health
- Deploy applications safely
- Handle incidents and alerts
- Maintain infrastructure
Always log your actions and notify relevant stakeholders.`,
    mcpServers: {
      "app-services": appTools
    },
    agents: {
      "deployment-agent": {
        description: "Handles application deployments and rollbacks",
        prompt: "You manage deployments. Verify tests pass, deploy to staging first, then production. Always create rollback plans.",
        tools: ["Bash", "Read", "mcp__app-services__log_event", "mcp__app-services__send_notification"],
        model: "sonnet"
      },
      "incident-responder": {
        description: "Responds to production incidents and outages",
        prompt: "You handle incidents. Assess impact, identify root cause, implement fixes, and communicate status updates.",
        tools: ["Bash", "Read", "Grep", "mcp__app-services__log_event", "mcp__app-services__send_notification"],
        model: "sonnet"
      },
      "monitoring-agent": {
        description: "Monitors system metrics and health checks",
        prompt: "You monitor systems. Check metrics, analyze trends, detect anomalies, and alert on issues.",
        tools: ["Bash", "Read", "mcp__app-services__log_event", "mcp__app-services__send_notification"],
        model: "haiku"
      }
    }
  }
});
```

---

## Advanced Configuration

### Complete Options Example

```typescript
const response = query({
  prompt: "Review the authentication module for security issues",
  options: {
    model: "claude-sonnet-4-5",
    workingDirectory: "/path/to/project",
    systemPrompt: "You are a security-focused code reviewer. Analyze code for vulnerabilities and provide detailed recommendations.",
    permissionMode: "default",
    maxBudgetUsd: 5.0,  // Optional: Set maximum spending limit in USD
    canUseTool: async (toolName, input) => {
      // Custom permission logic
      if (toolName === 'Bash' && input.command.includes('rm -rf')) {
        return { behavior: "deny", message: "Destructive commands not allowed" };
      }
      return { behavior: "allow" };
    }
  }
});

for await (const message of response) {
  switch (message.type) {
    case 'assistant':
      console.log('Assistant:', message.content);
      break;
    case 'tool_call':
      console.log(`Tool called: ${message.tool_name}`);
      break;
    case 'tool_result':
      console.log(`Tool result: ${message.result}`);
      break;
    case 'error':
      console.error('Error:', message.error);
      break;
  }
}
```

---

## V2 Session API (Unstable)

```typescript
async function advancedV2Usage() {
  const session = await unstable_v2_createSession({
    model: "claude-sonnet-4-5",
    mcpServers: {
      "custom": myCustomMcpServer
    },
    agents: {
      "security-reviewer": {
        description: "Security expert for code review",
        prompt: "Review code for security vulnerabilities",
        tools: ["Read", "Grep"],
        model: "sonnet"
      }
    },
    tools: ["Read", "Write", "Edit", "Bash"]
  });

  const response = unstable_v2_prompt(session, {
    prompt: "Review the authentication system for security issues"
  });

  for await (const message of response) {
    console.log(message);
  }
}
```

---

## Key Design Patterns for /flow-clarify

### 1. Multi-Agent Orchestration
- Main clarify agent delegates to specialized dimension scanners
- Each dimension scanner has specific expertise (security, UX, data model, etc.)
- Model assignment: use "haiku" for simple scans, "sonnet" for complex analysis

### 2. Tool Access Control
- Read-only tools for analysis phase: ["Read", "Grep", "Glob"]
- Write tools for report generation: ["Write"]
- No Bash/Edit during scanning (safety first)

### 3. Permission Strategy
- Use "default" mode with custom `canUseTool` callback
- Ask for confirmation before writing clarification reports
- Deny any destructive operations

### 4. Custom MCP Tools
- `scan_dimension`: Zod-validated dimension scanner
- `generate_question`: Type-safe question generator
- `record_answer`: Structured answer recorder

### 5. Multi-Turn Conversations
- Use async generator for sequential questioning
- One question at a time (avoid overwhelming user)
- Dynamic queue for follow-up questions based on answers

---

**Implementation Blueprint for /flow-clarify**:

```typescript
// Pseudo-code for clarify-analyst agent
const clarifyResponse = query({
  prompt: getUserInputQueue(),  // Multi-turn conversation
  options: {
    model: "claude-sonnet-4-5",
    tools: ["Read", "Grep", "Glob"],  // Read-only during scan
    disallowedTools: ["Write", "Edit", "Bash"],
    permissionMode: "default",
    agents: {
      "ambiguity-scanner": {
        description: "Scans for ambiguities across 11 dimensions",
        prompt: "Identify Missing/Partial coverage in each dimension",
        tools: ["Read", "Grep"],
        model: "sonnet"
      },
      "question-generator": {
        description: "Generates smart clarification questions",
        prompt: "Create max 5 high-impact questions with recommended answers",
        tools: ["Read"],
        model: "sonnet"
      },
      "report-writer": {
        description: "Writes structured clarification reports",
        prompt: "Generate Markdown report with Q&A and updated sections",
        tools: ["Write"],
        model: "haiku"
      }
    }
  }
});
```
