#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, '.claude');
const ADAPT_BIN = path.join(PACKAGE_ROOT, 'bin', 'adapt.js');
const ADAPTER_BIN = path.join(PACKAGE_ROOT, 'bin', 'cc-devflow.js');

function showHelp() {
  console.log(`
Usage: cc-devflow <command> [options]

Commands:
  init                Install .claude template into a project
  adapt               Compile .claude into multi-platform outputs

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
      fs.copyFileSync(src, dest);
      console.log(`[NEW] ${path.relative(process.cwd(), dest)}`);
    } else {
      // File exists - skip to preserve user changes
      // TODO: In the future, we could implement a 3-way merge or check for unmodified defaults
    }
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
    console.log(`Initialized .claude in ${targetRoot}`);
    return 0;
  }

  // Case 2: Directory exists + Force - Hard Reset
  if (options.force) {
    console.log('Force flag detected. Resetting .claude directory...');
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.cpSync(TEMPLATE_DIR, targetDir, { recursive: true });
    console.log(`Re-initialized .claude in ${targetRoot}`);
    return 0;
  }

  // Case 3: Directory exists - Incremental Update
  console.log(`Target ${targetDir} already exists. Performing incremental update...`);
  copyIncremental(TEMPLATE_DIR, targetDir);
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

  return runAdapter(command, rest);
}

if (require.main === module) {
  process.exit(main());
}
