/**
 * Compiler Entry Point (v2.0)
 *
 * 编译器主入口:
 * - compile(options): 编译命令文件到目标平台
 * - 协调 parser, transformer, emitters, manifest
 * - 复制资源文件并重写路径
 * - 生成 skills-registry.json 和规则入口文件
 *
 * v2.0 (REQ-006): 支持 --rules, --skills 参数
 */
const path = require('path');

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

  return result;
}

module.exports = {
  compile,
  PLATFORMS
};
