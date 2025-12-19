/**
 * QwenRulesEmitter - Qwen 规则入口文件生成
 *
 * 输出格式: TOML
 * 输出路径: .qwen/commands/devflow.toml
 *
 * Reference: REQ-006/TECH_DESIGN.md#QwenTOML
 */
const BaseRulesEmitter = require('./base-rules-emitter');
const TOML = require('@iarna/toml');

class QwenRulesEmitter extends BaseRulesEmitter {
  // ----------------------------------------------------------
  // Platform properties
  // ----------------------------------------------------------
  get platform() {
    return 'qwen';
  }

  get outputPath() {
    return '.qwen/commands/devflow.toml';
  }

  // ----------------------------------------------------------
  // format() - 生成 TOML 格式内容
  // ----------------------------------------------------------
  format(registry, commands) {
    const tomlObj = this.buildTomlObject(registry, commands);
    return TOML.stringify(tomlObj);
  }

  // ----------------------------------------------------------
  // buildTomlObject() - 构建 TOML 对象
  // ----------------------------------------------------------
  buildTomlObject(registry, commands) {
    const obj = {
      skill: {
        name: 'cc-devflow',
        description: 'CC-DevFlow development workflow system',
        version: '1.0.0'
      },
      skills: {},
      commands: {}
    };

    // 添加技能
    if (registry && registry.skills && registry.skills.length > 0) {
      for (const skill of registry.skills) {
        obj.skills[skill.name] = {
          description: skill.description || '',
          type: skill.type || 'utility',
          priority: skill.priority || 'medium'
        };
      }
    }

    // 添加命令
    if (commands && commands.length > 0) {
      for (const cmd of commands) {
        obj.commands[cmd.name] = {
          description: cmd.description || ''
        };
      }
    }

    return obj;
  }
}

module.exports = { QwenRulesEmitter };
