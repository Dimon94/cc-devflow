/**
 * Compiler Entry Point (v3.0)
 *
 * [INPUT]: .claude/commands/, .claude/skills/, .claude/agents/, .claude/rules/, .claude/hooks/
 * [OUTPUT]: 各平台目录 (.codex/, .cursor/, .qwen/, .agent/)
 * [POS]: 编译器主入口，协调多模块编译流程
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 *
 * 编译器主入口:
 * - compile(options): 编译命令文件到目标平台
 * - compileMultiModule(options): 编译所有模块到目标平台 (v3.0)
 * - 协调 parser, transformer, emitters, manifest
 * - 复制资源文件并重写路径
 * - 生成 skills-registry.json 和规则入口文件
 *
 * v2.0 (REQ-006): 支持 --rules, --skills 参数
 * v3.0: 支持多模块编译 (skills, commands, agents, rules, hooks)
 */
const path = require('path');
const fs = require('fs');

const { parseAllCommands } = require('./parser.js');
const { transformForPlatform } = require('./transformer.js');
const { getEmitter, getAllEmitters, PLATFORMS } = require('./emitters/index.js');
const {
  loadManifest,
  saveManifest,
  needsRecompile,
  addEntry,
  createEntry,
  createManifest,
  hashContent,
  migrateToV2,
  addSkillEntry,
  addRulesEntry,
  needsSkillRecompile,
  needsRulesRecompile,
  MANIFEST_PATH
} = require('./manifest.js');
const {
  collectReferencedResources,
  copyResourcesForAllPlatforms,
  mapPathToPlatform
} = require('./resource-copier.js');
const { generateSkillsRegistryV2, writeSkillsRegistry } = require('./skills-registry.js');
const { getRulesEmitter, emitAllRules } = require('./rules-emitters/index.js');
const { getPlatformConfig, MODULE_TYPES, isModuleSupported } = require('./platforms.js');

// ============================================================
// DEFAULT_MODULES - 默认编译的模块
// ============================================================
const DEFAULT_MODULES = ['skills', 'commands', 'agents', 'rules'];

// ============================================================
// compileMultiModule - 多模块编译主函数 (v3.0)
// ============================================================
async function compileMultiModule(options = {}) {
  const {
    sourceBaseDir = '.claude/',
    outputBaseDir = '.',
    platforms = PLATFORMS,
    modules = DEFAULT_MODULES,
    verbose = false,
    check = false
  } = options;

  // 验证平台参数
  for (const platform of platforms) {
    if (!PLATFORMS.includes(platform)) {
      throw new Error(`Unknown platform: ${platform}`);
    }
  }

  const result = {
    success: true,
    platforms: platforms,
    modules: modules,
    skillsEmitted: 0,
    commandsEmitted: 0,
    agentsEmitted: 0,
    rulesEmitted: 0,
    hooksEmitted: 0,
    errors: []
  };

  // 加载 manifest
  const manifestPath = path.join(outputBaseDir, MANIFEST_PATH);
  let manifest = await loadManifest(manifestPath);
  manifest = migrateToV2(manifest);

  // 如果是 check 模式，只做漂移检测
  if (check) {
    const { checkDrift } = require('./manifest.js');
    const drift = await checkDrift(manifest);
    return {
      ...result,
      check: true,
      drift,
      success: drift.length === 0
    };
  }

  // 为每个平台编译每个模块
  for (const platform of platforms) {
    const emitter = getEmitter(platform);
    const platformConfig = getPlatformConfig(platform);

    if (verbose) {
      console.log(`\nCompiling for ${platformConfig.name}...`);
    }

    // 编译 Skills
    if (modules.includes('skills')) {
      try {
        const skillsSourceDir = path.join(sourceBaseDir, 'skills');
        const skillsTargetDir = getSkillsTargetDir(platform, platformConfig);

        if (fs.existsSync(skillsSourceDir)) {
          const skillResults = await emitter.emitSkills(skillsSourceDir, skillsTargetDir);
          result.skillsEmitted += skillResults.length;

          if (verbose && skillResults.length > 0) {
            console.log(`  Skills: ${skillResults.length} emitted to ${skillsTargetDir}`);
          }
        }
      } catch (error) {
        result.errors.push(`${platform}/skills: ${error.message}`);
      }
    }

    // 编译 Agents
    if (modules.includes('agents')) {
      try {
        const agentsSourceDir = path.join(sourceBaseDir, 'agents');
        const agentsTargetPath = getAgentsTargetPath(platform, platformConfig);

        if (fs.existsSync(agentsSourceDir)) {
          const agentResults = await emitter.emitAgents(agentsSourceDir, agentsTargetPath);
          result.agentsEmitted += agentResults.length;

          if (verbose && agentResults.length > 0) {
            console.log(`  Agents: ${agentResults.length} emitted to ${agentsTargetPath}`);
          }
        }
      } catch (error) {
        result.errors.push(`${platform}/agents: ${error.message}`);
      }
    }

    // 编译 Rules
    if (modules.includes('rules')) {
      try {
        const rulesSourceDir = path.join(sourceBaseDir, 'rules');
        const rulesTargetPath = getRulesTargetPath(platform, platformConfig);

        if (fs.existsSync(rulesSourceDir)) {
          const ruleResults = await emitter.emitRules(rulesSourceDir, rulesTargetPath);
          result.rulesEmitted += ruleResults.length;

          if (verbose && ruleResults.length > 0) {
            console.log(`  Rules: ${ruleResults.length} emitted to ${rulesTargetPath}`);
          }
        }
      } catch (error) {
        result.errors.push(`${platform}/rules: ${error.message}`);
      }
    }

    // 编译 Hooks (仅 Cursor 支持)
    if (modules.includes('hooks') && isModuleSupported(platform, 'hooks')) {
      try {
        const hooksSourceDir = path.join(sourceBaseDir, 'hooks');
        const hooksTargetDir = platformConfig.folder;

        if (fs.existsSync(hooksSourceDir)) {
          const hookResults = await emitter.emitHooks(hooksSourceDir, hooksTargetDir);
          result.hooksEmitted += hookResults.length;

          if (verbose && hookResults.length > 0) {
            console.log(`  Hooks: ${hookResults.length} emitted to ${hooksTargetDir}`);
          }
        }
      } catch (error) {
        result.errors.push(`${platform}/hooks: ${error.message}`);
      }
    }
  }

  // 保存 manifest
  manifest.generatedAt = new Date().toISOString();
  await saveManifest(manifest, manifestPath);

  // 设置成功状态
  result.success = result.errors.length === 0;

  return result;
}

// ============================================================
// Helper Functions - 获取目标路径
// ============================================================

function getSkillsTargetDir(platform, config) {
  const skillsConfig = config.skills;
  if (!skillsConfig) {
    return path.join(config.folder, 'skills');
  }
  return path.join(config.folder, skillsConfig.dir || 'skills');
}

function getAgentsTargetPath(platform, config) {
  const agentsConfig = config.agents;
  if (!agentsConfig) {
    return 'AGENTS.md';
  }
  if (agentsConfig.outputFile) {
    return agentsConfig.outputFile;
  }
  return path.join(config.folder, agentsConfig.dir || 'agents');
}

function getRulesTargetPath(platform, config) {
  const rulesConfig = config.rules;
  if (!rulesConfig) {
    return path.join(config.folder, 'rules');
  }
  if (rulesConfig.outputFile) {
    return rulesConfig.outputFile;
  }
  return path.join(config.folder, rulesConfig.dir || 'rules');
}

function getHooksTargetDir(config) {
  return config.folder;
}

// ============================================================
// emitPlatformModules - 编译 Skills/Agents/Rules/Hooks 模块
// ============================================================
async function emitPlatformModules(sourceBaseDir, platforms, options = {}) {
  const {
    includeSkills = true,
    includeAgents = true,
    includeRules = true,
    includeHooks = true,
    verbose = false
  } = options;

  const summary = {
    skillsEmitted: 0,
    agentsEmitted: 0,
    moduleRulesEmitted: 0,
    hooksEmitted: 0,
    errors: []
  };

  for (const platform of platforms) {
    const emitter = getEmitter(platform);
    const platformConfig = getPlatformConfig(platform);

    if (includeSkills) {
      try {
        const skillsSourceDir = path.join(sourceBaseDir, 'skills');
        const skillsTargetDir = getSkillsTargetDir(platform, platformConfig);

        if (fs.existsSync(skillsSourceDir)) {
          const skillResults = await emitter.emitSkills(skillsSourceDir, skillsTargetDir);
          summary.skillsEmitted += skillResults.length;

          if (verbose && skillResults.length > 0) {
            console.log(`Emitted skills: ${platform} (${skillResults.length})`);
          }
        }
      } catch (error) {
        summary.errors.push(`${platform}/skills: ${error.message}`);
      }
    }

    if (includeAgents) {
      try {
        const agentsSourceDir = path.join(sourceBaseDir, 'agents');
        const agentsTargetPath = getAgentsTargetPath(platform, platformConfig);

        if (fs.existsSync(agentsSourceDir)) {
          const agentResults = await emitter.emitAgents(agentsSourceDir, agentsTargetPath);
          summary.agentsEmitted += agentResults.length;

          if (verbose && agentResults.length > 0) {
            console.log(`Emitted agents: ${platform} (${agentResults.length})`);
          }
        }
      } catch (error) {
        summary.errors.push(`${platform}/agents: ${error.message}`);
      }
    }

    if (includeRules) {
      try {
        const rulesSourceDir = path.join(sourceBaseDir, 'rules');
        const rulesTargetPath = getRulesTargetPath(platform, platformConfig);

        if (fs.existsSync(rulesSourceDir)) {
          const ruleResults = await emitter.emitRules(rulesSourceDir, rulesTargetPath);
          summary.moduleRulesEmitted += ruleResults.length;

          if (verbose && ruleResults.length > 0) {
            console.log(`Emitted module rules: ${platform} (${ruleResults.length})`);
          }
        }
      } catch (error) {
        summary.errors.push(`${platform}/rules: ${error.message}`);
      }
    }

    if (includeHooks && isModuleSupported(platform, 'hooks')) {
      try {
        const hooksSourceDir = path.join(sourceBaseDir, 'hooks');
        const hooksTargetDir = getHooksTargetDir(platformConfig);

        if (fs.existsSync(hooksSourceDir)) {
          const hookResults = await emitter.emitHooks(hooksSourceDir, hooksTargetDir);
          summary.hooksEmitted += hookResults.length;

          if (verbose && hookResults.length > 0) {
            console.log(`Emitted hooks: ${platform} (${hookResults.length})`);
          }
        }
      } catch (error) {
        summary.errors.push(`${platform}/hooks: ${error.message}`);
      }
    }
  }

  return summary;
}

// ============================================================
// compile - 编译主函数
// ============================================================
async function compile(options = {}) {
  const {
    sourceDir = '.claude/commands/',
    skillsDir = '.claude/skills/',
    outputBaseDir = '.',
    platforms = PLATFORMS,
    verbose = false,
    check = false,
    rules = true,
    skills = true
  } = options;

  // 验证平台参数
  for (const platform of platforms) {
    if (!PLATFORMS.includes(platform)) {
      throw new Error(`Unknown platform: ${platform}`);
    }
  }

  const result = {
    success: true,
    platforms: platforms,
    filesCompiled: 0,
    filesSkipped: 0,
    resourcesCopied: 0,
    resourcesSkipped: 0,
    skillsEmitted: 0,
    agentsEmitted: 0,
    moduleRulesEmitted: 0,
    hooksEmitted: 0,
    rulesGenerated: 0,
    skillsRegistered: 0,
    errors: []
  };

  // 加载 manifest 并迁移到 v2.0
  const manifestPath = path.join(outputBaseDir, MANIFEST_PATH);
  let manifest = await loadManifest(manifestPath);
  manifest = migrateToV2(manifest);

  // 如果是 check 模式，只做漂移检测
  if (check) {
    const { checkDrift } = require('./manifest.js');
    const drift = await checkDrift(manifest);
    return {
      ...result,
      check: true,
      drift,
      success: drift.length === 0
    };
  }

  // 生成 skills registry
  let registry = null;
  if (skills) {
    try {
      registry = await generateSkillsRegistryV2(skillsDir);
      await writeSkillsRegistry(registry);
      result.skillsRegistered = registry.skills.length;

      // 更新 manifest 中的技能记录
      for (const skill of registry.skills) {
        const skillHash = hashContent(JSON.stringify(skill));
        addSkillEntry(manifest, {
          name: skill.name,
          sourceHash: skillHash,
          timestamp: new Date().toISOString()
        });
      }

      if (verbose) {
        console.log(`Generated skills-registry.json with ${registry.skills.length} skills`);
      }
    } catch (error) {
      result.errors.push(`Skills registry: ${error.message}`);
    }
  }

  // 编译多模块产物（skills / agents / rules / hooks）
  const sourceBaseDir = path.resolve(path.dirname(sourceDir));
  const moduleSummary = await emitPlatformModules(sourceBaseDir, platforms, {
    includeSkills: skills,
    includeAgents: true,
    includeRules: rules,
    includeHooks: true,
    verbose
  });
  result.skillsEmitted = moduleSummary.skillsEmitted;
  result.agentsEmitted = moduleSummary.agentsEmitted;
  result.moduleRulesEmitted = moduleSummary.moduleRulesEmitted;
  result.hooksEmitted = moduleSummary.hooksEmitted;
  result.errors.push(...moduleSummary.errors);

  // 解析所有命令文件
  const absoluteSourceDir = path.resolve(sourceDir);
  let irs = [];
  try {
    irs = await parseAllCommands(absoluteSourceDir);
  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
    return result;
  }

  if (verbose) {
    console.log(`Found ${irs.length} command files`);
  }

  // 生成规则入口文件
  if (rules && registry) {
    try {
      const commands = irs.map(ir => ({
        name: ir.source.filename.replace(/\.md$/, ''),
        description: ir.frontmatter?.description || ''
      }));

      const rulesResults = await emitAllRules(registry, commands, { platforms });

      for (const ruleResult of rulesResults) {
        if (ruleResult.error) {
          result.errors.push(`Rules ${ruleResult.platform}: ${ruleResult.error}`);
        } else {
          result.rulesGenerated++;

          // 更新 manifest
          addRulesEntry(manifest, ruleResult.platform, {
            path: ruleResult.path,
            hash: ruleResult.hash,
            timestamp: ruleResult.timestamp
          });

          if (verbose) {
            console.log(`Generated rules entry: ${ruleResult.path}`);
          }
        }
      }
    } catch (error) {
      result.errors.push(`Rules generation: ${error.message}`);
    }
  }

  // 复制资源文件到各平台目录
  const copyResult = await copyResourcesForAllPlatforms(irs, platforms, { verbose });
  result.resourcesCopied = copyResult.totalCopied;
  result.resourcesSkipped = copyResult.totalSkipped;

  if (verbose && copyResult.totalCopied > 0) {
    console.log(`Copied ${copyResult.totalCopied} resource files (${copyResult.totalSkipped} unchanged)`);
  }

  // 为每个平台构建路径映射
  const platformPathMaps = copyResult.allPathMaps;

  // 编译每个文件到每个平台
  for (const ir of irs) {
    for (const platform of platforms) {
      // 检查是否需要重新编译
      const sourceRelative = path.relative(outputBaseDir, ir.source.path);
      if (!needsRecompile(sourceRelative, ir.source.hash, manifest, platform)) {
        result.filesSkipped++;
        if (verbose) {
          console.log(`Skipped: ${ir.source.filename} -> ${platform} (unchanged)`);
        }
        continue;
      }

      try {
        // 获取该平台的路径映射
        const pathMap = platformPathMaps[platform] || {};

        // 转换（传入 pathMap 以重写路径）
        const transformed = transformForPlatform(ir, platform, { pathMap });

        // 获取 emitter
        const emitter = getEmitter(platform);

        // 格式化
        const formatted = emitter.format(ir, transformed.body);

        // 处理拆分文件（Antigravity 可能返回数组）
        if (Array.isArray(formatted)) {
          for (const part of formatted) {
            const emitResult = await emitter.emit(part.filename, part.content);

            // 更新 manifest
            addEntry(manifest, createEntry({
              source: sourceRelative,
              target: emitResult.path,
              sourceHash: ir.source.hash,
              targetHash: emitResult.hash,
              platform
            }));

            if (verbose) {
              console.log(`Compiled: ${ir.source.filename} -> ${platform} (${part.filename})`);
            }
          }
        } else {
          const emitResult = await emitter.emit(ir.source.filename, formatted);

          // 更新 manifest
          addEntry(manifest, createEntry({
            source: sourceRelative,
            target: emitResult.path,
            sourceHash: ir.source.hash,
            targetHash: emitResult.hash,
            platform
          }));

          if (verbose) {
            console.log(`Compiled: ${ir.source.filename} -> ${platform}`);
          }
        }

        result.filesCompiled++;
      } catch (error) {
        result.success = false;
        result.errors.push(`${ir.source.filename} -> ${platform}: ${error.message}`);
      }
    }
  }

  // 保存 manifest
  manifest.generatedAt = new Date().toISOString();
  await saveManifest(manifest, manifestPath);

  result.success = result.errors.length === 0;
  return result;
}

module.exports = {
  compile,
  compileMultiModule,
  PLATFORMS,
  DEFAULT_MODULES
};
