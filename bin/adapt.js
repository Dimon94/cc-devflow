#!/usr/bin/env node
/**
 * T042: CLI Entry Point - bin/adapt.js
 *
 * Usage:
 *   npm run adapt                        # Compile for all platforms
 *   npm run adapt -- --platform codex    # Compile for Codex only
 *   npm run adapt -- --all               # Compile for all platforms (explicit)
 *   npm run adapt -- --check             # Check for drift
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

// ============================================================
// parseArgs - 解析命令行参数
// ============================================================
function parseArgs(argv) {
  const args = {
    platform: null,
    all: false,
    check: false,
    verbose: false,
    help: false
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

Command Emitter - Compile .claude/commands/*.md to multi-platform formats

Options:
  --platform <name>   Compile for specific platform (${PLATFORMS.join(', ')})
  --all               Compile for all platforms (default if no --platform)
  --check             Check for drift without compiling
  --verbose           Show detailed compilation output
  --help, -h          Show this help message

Examples:
  npm run adapt                        # Compile for all platforms
  npm run adapt -- --platform codex    # Compile for Codex only
  npm run adapt -- --all               # Compile for all platforms (explicit)
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

  try {
    const result = await compile({
      platforms,
      verbose: args.verbose,
      check: args.check
    });

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
