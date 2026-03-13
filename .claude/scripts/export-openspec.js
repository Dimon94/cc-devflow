#!/usr/bin/env node
/**
 * [INPUT]: 依赖 CC-DevFlow spec.md 文件路径
 * [OUTPUT]: 生成 OpenSpec 格式的 spec.md (纯 Requirements，无 CC-DevFlow 元数据)
 * [POS]: OpenSpec 互操作层，被 /flow:export-openspec 命令调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

const fs = require('fs');
const path = require('path');

/**
 * 解析 CC-DevFlow spec.md 格式
 */
function parseDevFlowSpec(content) {
  const lines = content.split('\n');
  const result = {
    moduleName: '',
    purpose: '',
    requirements: []
  };

  let inFrontmatter = false;
  let currentSection = null;
  let currentRequirement = null;
  let currentScenario = null;
  let buffer = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 跳过 YAML frontmatter
    if (line === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) {
      continue;
    }

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

    // ## Design (停止解析，OpenSpec 不需要)
    if (line.startsWith('## Design') || line.startsWith('## Tasks') || line.startsWith('## Verification')) {
      if (currentRequirement) {
        result.requirements.push(currentRequirement);
        currentRequirement = null;
      }
      break;
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

    // BDD steps
    if (currentScenario && (line.startsWith('- GIVEN') || line.startsWith('- WHEN') || line.startsWith('- THEN') || line.startsWith('- AND'))) {
      currentScenario.steps.push(line.substring(2).trim());
      continue;
    }

    // 收集内容
    if (currentSection === 'purpose' && line.trim()) {
      buffer.push(line);
    } else if (currentRequirement && !currentScenario && line.trim() && !line.startsWith('[NEEDS CLARIFICATION')) {
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
    if (buffer.length > 0) {
      currentRequirement.description = buffer.join('\n').trim();
    }
    result.requirements.push(currentRequirement);
  }

  return result;
}

/**
 * 转换为 OpenSpec 格式
 */
function convertToOpenSpec(devflowData) {
  let output = `# ${devflowData.moduleName}

## Purpose

${devflowData.purpose}

## Requirements

`;

  // 转换 Requirements
  for (const req of devflowData.requirements) {
    output += `### Requirement: ${req.name}\n`;

    if (req.description) {
      output += `${req.description}\n\n`;
    }

    // 转换 Scenarios
    for (const scenario of req.scenarios) {
      output += `#### Scenario: ${scenario.name}\n`;
      for (const step of scenario.steps) {
        output += `- ${step}\n`;
      }
      output += '\n';
    }
  }

  return output;
}

/**
 * 主函数
 */
function exportOpenSpec(devflowSpecPath, outputPath) {
  // 读取 CC-DevFlow spec.md
  if (!fs.existsSync(devflowSpecPath)) {
    throw new Error(`DevFlow spec.md not found: ${devflowSpecPath}`);
  }

  const content = fs.readFileSync(devflowSpecPath, 'utf-8');

  // 解析 CC-DevFlow spec
  const devflowData = parseDevFlowSpec(content);

  // 转换为 OpenSpec 格式
  const openspecContent = convertToOpenSpec(devflowData);

  // 写入输出文件
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, openspecContent, 'utf-8');

  return {
    success: true,
    outputPath,
    requirementsCount: devflowData.requirements.length
  };
}

// CLI 接口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: export-openspec.js <devflow-spec-path> <output-path>');
    process.exit(1);
  }

  const [devflowSpecPath, outputPath] = args;

  try {
    const result = exportOpenSpec(devflowSpecPath, outputPath);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { exportOpenSpec, parseDevFlowSpec, convertToOpenSpec };
