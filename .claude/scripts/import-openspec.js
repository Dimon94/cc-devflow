#!/usr/bin/env node
/**
 * [INPUT]: 依赖 OpenSpec spec.md 文件路径，依赖 REQ-ID
 * [OUTPUT]: 生成 CC-DevFlow 格式的 spec.md，自动补充 TDD 任务
 * [POS]: OpenSpec 互操作层，被 /flow:import-openspec 命令调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析 OpenSpec spec.md 格式
 *
 * OpenSpec 格式:
 * # Module Name
 * ## Purpose
 * ## Requirements
 * ### Requirement: Name
 * #### Scenario: Case
 * - GIVEN ...
 * - WHEN ...
 * - THEN ...
 */
function parseOpenSpecMarkdown(content) {
  const lines = content.split('\n');
  const result = {
    moduleName: '',
    purpose: '',
    requirements: []
  };

  let currentSection = null;
  let currentRequirement = null;
  let currentScenario = null;
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // # Module Name
    if (line.startsWith('# ') && !result.moduleName) {
      result.moduleName = line.substring(2).trim();
      continue;
    }

    // ## Purpose
    if (line.startsWith('## Purpose')) {
      currentSection = 'purpose';
      buffer = [];
      continue;
    }

    // ## Requirements
    if (line.startsWith('## Requirements')) {
      if (currentSection === 'purpose') {
        result.purpose = buffer.join('\n').trim();
      }
      currentSection = 'requirements';
      buffer = [];
      continue;
    }

    // ### Requirement: Name
    if (line.startsWith('### Requirement:')) {
      if (currentRequirement) {
        result.requirements.push(currentRequirement);
      }
      currentRequirement = {
        name: line.substring(16).trim(),
        description: '',
        scenarios: []
      };
      currentScenario = null;
      buffer = [];
      continue;
    }

    // #### Scenario: Case
    if (line.startsWith('#### Scenario:')) {
      if (currentRequirement && buffer.length > 0) {
        currentRequirement.description = buffer.join('\n').trim();
        buffer = [];
      }
      currentScenario = {
        name: line.substring(14).trim(),
        steps: []
      };
      continue;
    }

    // BDD steps (GIVEN/WHEN/THEN)
    if (currentScenario && (line.startsWith('- GIVEN') || line.startsWith('- WHEN') || line.startsWith('- THEN') || line.startsWith('- AND'))) {
      currentScenario.steps.push(line.substring(2).trim());
      continue;
    }

    // 收集内容
    if (currentSection === 'purpose' && line.trim()) {
      buffer.push(line);
    } else if (currentRequirement && !currentScenario && line.trim()) {
      buffer.push(line);
    }

    // 场景结束
    if (currentScenario && line.trim() === '' && currentScenario.steps.length > 0) {
      currentRequirement.scenarios.push(currentScenario);
      currentScenario = null;
    }
  }

  // 处理最后的 requirement
  if (currentRequirement) {
    if (currentScenario && currentScenario.steps.length > 0) {
      currentRequirement.scenarios.push(currentScenario);
    }
    result.requirements.push(currentRequirement);
  }

  return result;
}

/**
 * 转换为 CC-DevFlow spec.md 格式
 */
function convertToDevFlowSpec(openspecData, reqId, title) {
  const now = new Date().toISOString();

  let output = `---
req_id: "${reqId}"
title: "${title}"
created_at: "${now}"
updated_at: "${now}"
version: "1.0.0"
status: "draft"
source: "openspec"
---

# ${openspecData.moduleName}

## Purpose

${openspecData.purpose}

## Requirements

`;

  // 转换 Requirements
  for (const req of openspecData.requirements) {
    output += `### Requirement: ${req.name}\n\n`;

    if (req.description) {
      output += `${req.description}\n\n`;
    }

    // 转换 Scenarios (BDD 格式)
    for (const scenario of req.scenarios) {
      output += `#### Scenario: ${scenario.name}\n\n`;
      for (const step of scenario.steps) {
        output += `- ${step}\n`;
      }
      output += '\n';
    }
  }

  // 添加 Design 部分 (空白，待填充)
  output += `## Design

[NEEDS CLARIFICATION: 技术实现方案]

### Architecture

[NEEDS CLARIFICATION: 架构设计]

### Data Model

[NEEDS CLARIFICATION: 数据模型]

### API Design

[NEEDS CLARIFICATION: API 设计]

## Tasks

`;

  // 自动生成 TDD 任务
  let taskId = 1;
  for (const req of openspecData.requirements) {
    const featureName = req.name;

    // TEST 任务
    output += `- [ ] T${String(taskId).padStart(3, '0')} [TEST] ${featureName} - 测试\n`;
    const testTaskId = taskId;
    taskId++;

    // IMPL 任务
    output += `- [ ] T${String(taskId).padStart(3, '0')} [IMPL] ${featureName} - 实现 (dependsOn:T${String(testTaskId).padStart(3, '0')})\n`;
    taskId++;
  }

  output += `
## Verification

`;

  // 生成验收标准
  for (const req of openspecData.requirements) {
    output += `- [ ] ${req.name}\n`;
    for (const scenario of req.scenarios) {
      output += `  - [ ] ${scenario.name}\n`;
    }
  }

  return output;
}

/**
 * 主函数
 */
function importOpenSpec(openspecPath, reqId, title, outputPath) {
  // 读取 OpenSpec 文件
  if (!fs.existsSync(openspecPath)) {
    throw new Error(`OpenSpec file not found: ${openspecPath}`);
  }

  const content = fs.readFileSync(openspecPath, 'utf-8');

  // 解析 OpenSpec
  const openspecData = parseOpenSpecMarkdown(content);

  // 转换为 CC-DevFlow 格式
  const devflowSpec = convertToDevFlowSpec(openspecData, reqId, title);

  // 写入输出文件
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, devflowSpec, 'utf-8');

  return {
    success: true,
    outputPath,
    requirementsCount: openspecData.requirements.length,
    tasksCount: openspecData.requirements.length * 2 // TEST + IMPL
  };
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error('Usage: import-openspec.js <openspec-path> <req-id> <title> <output-path>');
    process.exit(1);
  }

  const [openspecPath, reqId, title, outputPath] = args;

  try {
    const result = importOpenSpec(openspecPath, reqId, title, outputPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { importOpenSpec, parseOpenSpecMarkdown, convertToDevFlowSpec };
