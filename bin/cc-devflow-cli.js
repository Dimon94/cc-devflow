#!/usr/bin/env node
/**
 * [INPUT]: 依赖 .claude 模板、adapt 编译入口与 harness 运行时入口。
 * [OUTPUT]: 提供 init/adapt/harness 命令，并在目标仓库自动补齐 harness npm scripts。
 * [POS]: cc-devflow 的统一 CLI 门面，串联安装、编译与运行时发布链路。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, '.claude');
const ADAPT_BIN = path.join(PACKAGE_ROOT, 'bin', 'adapt.js');
const ADAPTER_BIN = path.join(PACKAGE_ROOT, 'bin', 'cc-devflow.js');
const HARNESS_BIN = path.join(PACKAGE_ROOT, 'bin', 'harness.js');
const HARNESS_SCRIPT_COMMANDS = {
  'harness:init': 'init',
  'harness:pack': 'pack',
  'harness:plan': 'plan',
  'harness:dispatch': 'dispatch',
  'harness:verify': 'verify',
  'harness:release': 'release',
  'harness:resume': 'resume',
  'harness:janitor': 'janitor'
};

function showHelp() {
  console.log(`
Usage: cc-devflow <command> [options]

Commands:
  init                Install .claude template into a project
  adapt               Compile .claude into multi-platform outputs
  harness             Run harness runtime commands (init/verify/release/janitor...)

Init options:
  --dir <path>         Target project path (default: cwd)
  --force              Overwrite existing .claude

Adapt options:
  --cwd <path>         Target project path (default: cwd)
  --platform <name>    Compile for specific platform
  --all                Compile all platforms (default)
  --check              Check for drift without compiling
  --skills             Generate skills registry only
  --rules              Generate rules entry files only
  --verbose            Show detailed output

Examples:
  cc-devflow init
  cc-devflow init --dir /path/to/project
  cc-devflow adapt --platform cursor
  cc-devflow adapt --cwd /path/to/project --platform codex
  cc-devflow harness release --change-id REQ-123
`);
}

function parseCliArgs(args) {
  const options = {
    dir: null,
    cwd: null,
    force: false,
    help: false
  };
  const rest = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--dir') {
      options.dir = args[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--dir=')) {
      options.dir = arg.slice('--dir='.length);
      continue;
    }

    if (arg === '--cwd') {
      options.cwd = args[i + 1];
      i += 1;
      continue;
    }

    if (arg.startsWith('--cwd=')) {
      options.cwd = arg.slice('--cwd='.length);
      continue;
    }

    rest.push(arg);
  }

  return { options, rest };
}

function copyIncremental(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyIncremental(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    if (!fs.existsSync(dest)) {
      // Case 1: File missing - Copy it
      fs.copyFileSync(src, dest);
      console.log(`[NEW] ${path.relative(process.cwd(), dest)}`);
    } else {
      // Case 2: File exists - Compare content
      try {
        const srcContent = fs.readFileSync(src);
        const destContent = fs.readFileSync(dest);

        if (!srcContent.equals(destContent)) {
          // Content differs - Overwrite original
          fs.unlinkSync(dest);
          fs.copyFileSync(src, dest);
          console.log(`[UPDATE] ${path.relative(process.cwd(), dest)}`);
        }
        // else: Content identical - Silent skip
      } catch (err) {
        console.warn(`[WARN] Could not compare ${path.relative(process.cwd(), dest)}: ${err.message}`);
      }
    }
  }
}

function detectJsonIndent(content) {
  const match = content.match(/\n([ \t]+)"[^"\n]+":/);
  if (!match) {
    return 2;
  }

  const indent = match[1];
  return indent.includes('\t') ? '\t' : indent.length;
}

function hasLocalHarnessBinary(targetRoot) {
  return fs.existsSync(path.join(targetRoot, 'bin', 'harness.js'));
}

function getHarnessScriptCommand(targetRoot, subcommand) {
  if (hasLocalHarnessBinary(targetRoot)) {
    return `node bin/harness.js ${subcommand}`;
  }
  return `cc-devflow harness ${subcommand}`;
}

function ensureHarnessScripts(targetRoot) {
  const pkgPath = path.join(targetRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.warn(`[WARN] Missing package.json in ${targetRoot}; skipping harness script bootstrap.`);
    return;
  }

  let raw;
  let packageJson;
  try {
    raw = fs.readFileSync(pkgPath, 'utf8');
    packageJson = JSON.parse(raw);
  } catch (error) {
    console.warn(`[WARN] Skipping harness script bootstrap: cannot parse package.json (${error.message})`);
    return;
  }

  if (!packageJson || typeof packageJson !== 'object' || Array.isArray(packageJson)) {
    console.warn('[WARN] Skipping harness script bootstrap: package.json root must be an object.');
    return;
  }

  if (!packageJson.scripts || typeof packageJson.scripts !== 'object' || Array.isArray(packageJson.scripts)) {
    packageJson.scripts = {};
  }

  const hasLocalBinary = hasLocalHarnessBinary(targetRoot);
  const added = [];
  const repaired = [];
  let changed = false;

  for (const [scriptName, subcommand] of Object.entries(HARNESS_SCRIPT_COMMANDS)) {
    const desired = getHarnessScriptCommand(targetRoot, subcommand);
    const existing = packageJson.scripts[scriptName];

    if (typeof existing === 'undefined') {
      packageJson.scripts[scriptName] = desired;
      added.push(scriptName);
      changed = true;
      continue;
    }

    if (typeof existing !== 'string') {
      continue;
    }

    // Auto-repair legacy value when local harness binary does not exist.
    if (!hasLocalBinary && existing.trim() === `node bin/harness.js ${subcommand}`) {
      packageJson.scripts[scriptName] = desired;
      repaired.push(scriptName);
      changed = true;
      continue;
    }

    // Auto-repair previous injected npx-based value to deterministic runtime path.
    if (!hasLocalBinary && existing.trim() === `npx --yes cc-devflow harness ${subcommand}`) {
      packageJson.scripts[scriptName] = desired;
      repaired.push(scriptName);
      changed = true;
      continue;
    }

    // Auto-repair previous absolute-path fallback value (not portable across machines).
    const escapedHarnessBin = HARNESS_BIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const absoluteLegacy = new RegExp(`^node\\s+["']?${escapedHarnessBin}["']?\\s+${subcommand}(\\s*\\|\\|\\s*cc-devflow\\s+harness\\s+${subcommand})?$`);
    if (!hasLocalBinary && absoluteLegacy.test(existing.trim())) {
      packageJson.scripts[scriptName] = desired;
      repaired.push(scriptName);
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  const indent = detectJsonIndent(raw);
  fs.writeFileSync(pkgPath, `${JSON.stringify(packageJson, null, indent)}\n`);

  if (added.length > 0) {
    console.log(`[UPDATE] package.json (added ${added.join(', ')})`);
  }
  if (repaired.length > 0) {
    console.log(`[UPDATE] package.json (repaired ${repaired.join(', ')})`);
  }
}

function runInit(args) {
  const { options } = parseCliArgs(args);

  if (options.help) {
    showHelp();
    return 0;
  }

  const targetRoot = path.resolve(options.dir || options.cwd || process.cwd());
  const targetDir = path.join(targetRoot, '.claude');

  if (!fs.existsSync(TEMPLATE_DIR)) {
    console.error(`Template not found: ${TEMPLATE_DIR}`);
    return 1;
  }

  // Case 1: Directory does not exist - Clean Install
  if (!fs.existsSync(targetDir)) {
    fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });
    ensureHarnessScripts(targetRoot);
    console.log(`Initialized .claude in ${targetRoot}`);
    return 0;
  }

  // Case 2: Directory exists + Force - Hard Reset
  if (options.force) {
    console.log('Force flag detected. Resetting .claude directory...');
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });
    ensureHarnessScripts(targetRoot);
    console.log(`Re-initialized .claude in ${targetRoot}`);
    return 0;
  }

  // Case 3: Directory exists - Incremental Update
  console.log(`Target ${targetDir} already exists. Performing incremental update...`);
  copyIncremental(TEMPLATE_DIR, targetDir);
  ensureHarnessScripts(targetRoot);
  console.log('Incremental update complete. Existing files were preserved.');
  return 0;
}

function runAdapt(args) {
  const { options, rest } = parseCliArgs(args);

  if (options.help) {
    showHelp();
    return 0;
  }

  const targetRoot = path.resolve(options.cwd || process.cwd());
  const claudeDir = path.join(targetRoot, '.claude');

  if (!fs.existsSync(claudeDir)) {
    console.error(`Missing .claude directory in ${targetRoot}`);
    console.error('Run: cc-devflow init');
    return 1;
  }

  ensureHarnessScripts(targetRoot);

  const result = spawnSync(process.execPath, [ADAPT_BIN, ...rest], {
    stdio: 'inherit',
    cwd: targetRoot
  });

  if (result.error) {
    console.error(`Failed to run adapt: ${result.error.message}`);
    return 1;
  }

  return typeof result.status === 'number' ? result.status : 1;
}

function runHarness(args) {
  const { options, rest } = parseCliArgs(args);

  const targetRoot = path.resolve(options.cwd || process.cwd());
  const cliArgs = options.help || rest.length === 0 ? ['--help'] : rest;
  const result = spawnSync(process.execPath, [HARNESS_BIN, ...cliArgs], {
    stdio: 'inherit',
    cwd: targetRoot
  });

  if (result.error) {
    console.error(`Failed to run harness: ${result.error.message}`);
    return 1;
  }

  return typeof result.status === 'number' ? result.status : 1;
}

function runAdapter(command, args) {
  const result = spawnSync(process.execPath, [ADAPTER_BIN, command, ...args], {
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`Failed to run adapter: ${result.error.message}`);
    return 1;
  }

  return typeof result.status === 'number' ? result.status : 1;
}

function main() {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return 0;
  }

  if (command === 'init') {
    return runInit(rest);
  }

  if (command === 'adapt') {
    return runAdapt(rest);
  }

  if (command === 'harness') {
    return runHarness(rest);
  }

  return runAdapter(command, rest);
}

if (require.main === module) {
  process.exit(main());
}
