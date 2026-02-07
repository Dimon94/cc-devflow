#!/usr/bin/env node
/**
 * CLI Entry Point - bin/adapt.js (v2.0)
 *
 * Usage:
 *   npm run adapt                        # Compile all (commands + skills + rules)
 *   npm run adapt -- --platform codex    # Compile for Codex only
 *   npm run adapt -- --all               # Compile for all platforms (explicit)
 *   npm run adapt -- --check             # Check for drift
 *   npm run adapt -- --skills            # Generate skills-registry.json only
 *   npm run adapt -- --rules             # Generate rules entry files only
 *   npm run adapt -- --verbose           # Show detailed output
 *   npm run adapt -- --help              # Show help
 *
 * Exit Codes:
 *   0: Success
 *   1: Compilation error
 *   2: Drift detected (with --check)
 *   3: Invalid arguments
 */
const { compile, PLATFORMS } = require('../lib/compiler/index.js');
const { generateSkillsRegistryV2, writeSkillsRegistry } = require('../lib/compiler/skills-registry.js');
const { emitAllRules } = require('../lib/compiler/rules-emitters/index.js');

// ============================================================
// parseArgs - 解析命令行参数
// ============================================================
function parseArgs(argv) {
  const args = {
    platform: null,
    all: false,
    check: false,
    verbose: false,
    help: false,
    skills: false,
    rules: false
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    switch (arg) {
      case '--platform':
        args.platform = argv[++i];
        break;
      case '--all':
        args.all = true;
        break;
      case '--check':
        args.check = true;
        break;
      case '--verbose':
        args.verbose = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      case '--skills':
        args.skills = true;
        break;
      case '--rules':
        args.rules = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(3);
        }
    }
  }

  return args;
}

// ============================================================
// showHelp - 显示帮助信息
// ============================================================
function showHelp() {
  console.log(`
Usage: npm run adapt [options]

Adapter Compiler - Compile CC-DevFlow to multi-platform formats

Options:
  --platform <name>   Compile for specific platform (${PLATFORMS.join(', ')})
  --all               Compile for all platforms (default if no --platform)
  --check             Check for drift without compiling
  --skills            Generate skills-registry.json only
  --rules             Generate rules entry files only
  --verbose           Show detailed compilation output
  --help, -h          Show this help message

Examples:
  npm run adapt                        # Full compilation
  npm run adapt -- --platform codex    # Compile for Codex only
  npm run adapt -- --skills            # Generate skills registry
  npm run adapt -- --rules             # Generate rules entry files
  npm run adapt -- --check             # Check for drift
  npm run adapt -- --verbose           # Show detailed output

Exit Codes:
  0 - Success
  1 - Compilation error
  2 - Drift detected (with --check)
  3 - Invalid arguments
`);
}

// ============================================================
// main - 主函数
// ============================================================
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 显示帮助
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // 确定目标平台
  let platforms;
  if (args.platform) {
    if (!PLATFORMS.includes(args.platform)) {
      console.error(`Unknown platform: ${args.platform}`);
      console.error(`Available platforms: ${PLATFORMS.join(', ')}`);
      process.exit(3);
    }
    platforms = [args.platform];
  } else {
    platforms = PLATFORMS;
  }

  // 处理 --skills 单独模式
  if (args.skills && !args.rules) {
    try {
      const skillsDir = '.claude/skills';
      const registry = await generateSkillsRegistryV2(skillsDir);
      const outputPath = await writeSkillsRegistry(registry);

      console.log(`Skills registry generated: ${outputPath}`);
      console.log(`  Skills found: ${registry.skills.length}`);
      process.exit(0);
    } catch (error) {
      console.error(`Error generating skills registry: ${error.message}`);
      process.exit(1);
    }
  }

  // 处理 --rules 单独模式
  if (args.rules && !args.skills) {
    try {
      const skillsDir = '.claude/skills';
      const registry = await generateSkillsRegistryV2(skillsDir);

      const rulesResults = await emitAllRules(registry, [], { platforms });
      let rulesGenerated = 0;

      for (const ruleResult of rulesResults) {
        if (ruleResult.error) {
          console.error(`  Error (${ruleResult.platform}): ${ruleResult.error}`);
        } else {
          rulesGenerated++;
          if (args.verbose) {
            console.log(`  Generated: ${ruleResult.path}`);
          }
        }
      }

      console.log(`Rules entry files generated: ${rulesGenerated}`);
      process.exit(0);
    } catch (error) {
      console.error(`Error generating rules: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    // 确定编译选项
    const compileOptions = {
      platforms,
      verbose: args.verbose,
      check: args.check,
      rules: true,
      skills: true
    };

    // 如果只指定 --skills 或 --rules，调整选项
    if (args.skills || args.rules) {
      compileOptions.skills = args.skills;
      compileOptions.rules = args.rules;
    }

    const result = await compile(compileOptions);

    // 处理 check 模式
    if (args.check) {
      if (result.drift && result.drift.length > 0) {
        console.log('Drift detected:');
        for (const item of result.drift) {
          console.log(`  - ${item.source}: ${item.issue}`);
        }
        process.exit(2);
      }
      console.log('No drift detected.');
      process.exit(0);
    }

    // 输出编译结果
    if (result.success) {
      console.log(`Compilation complete.`);
      console.log(`  Platforms: ${result.platforms.join(', ')}`);
      console.log(`  Files compiled: ${result.filesCompiled}`);
      console.log(`  Files skipped: ${result.filesSkipped}`);
      console.log(`  Resources copied: ${result.resourcesCopied}`);
      console.log(`  Resources skipped: ${result.resourcesSkipped}`);
      console.log(`  Skills emitted: ${result.skillsEmitted}`);
      console.log(`  Agents emitted: ${result.agentsEmitted}`);
      console.log(`  Module rules emitted: ${result.moduleRulesEmitted}`);
      console.log(`  Hooks emitted: ${result.hooksEmitted}`);
      console.log(`  Skills registered: ${result.skillsRegistered}`);
      console.log(`  Rules generated: ${result.rulesGenerated}`);
      process.exit(0);
    } else {
      console.error('Compilation failed:');
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// 导出 parseArgs 供测试使用
module.exports = { parseArgs };

// 如果是直接运行则执行 main
if (require.main === module) {
  main();
}
