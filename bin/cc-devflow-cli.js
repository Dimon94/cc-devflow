#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, '.claude');
const TEMPLATE_SKILLS_DIR = path.join(TEMPLATE_DIR, 'skills');
const DISTRIBUTION_CONFIG = require(path.join(PACKAGE_ROOT, 'config', 'distributable-skills.json'));
const ADAPT_BIN = path.join(PACKAGE_ROOT, 'bin', 'adapt.js');
const ADAPTER_BIN = path.join(PACKAGE_ROOT, 'bin', 'cc-devflow.js');
const TEMPLATE_IGNORES = new Set(['.DS_Store', 'tsc-cache']);
const DISTRIBUTED_SKILLS = Array.from(
  new Set(DISTRIBUTION_CONFIG.distributedSkills || DISTRIBUTION_CONFIG.publicSkills || [])
);
const DISTRIBUTED_SKILL_SET = new Set(DISTRIBUTED_SKILLS);

function shouldIncludeTemplatePath(src) {
  const relativePath = path.relative(TEMPLATE_DIR, src);

  if (!relativePath || relativePath === '') {
    return true;
  }

  const segments = relativePath.split(path.sep);
  const skillIndex = segments.indexOf('skills');

  if (skillIndex !== -1 && segments.length > skillIndex + 1) {
    const skillName = segments[skillIndex + 1];
    if (!DISTRIBUTED_SKILL_SET.has(skillName)) {
      return false;
    }
  }

  return !segments.some((segment) => TEMPLATE_IGNORES.has(segment));
}

function showHelp() {
  console.log(`
Usage: cc-devflow <command> [options]

Commands:
  init                Install .claude template into a project
  adapt               Compile .claude into multi-platform outputs

Init options:
  --dir <path>         Target project path (default: cwd)
  --force              Force-upgrade managed skills without deleting other .claude files

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

function copyManagedDirectory(src, dest, options = {}) {
  const { force = false } = options;

  if (!shouldIncludeTemplatePath(src)) {
    return;
  }

  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyManagedDirectory(path.join(src, entry), path.join(dest, entry), options);
    }
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`[NEW] ${path.relative(process.cwd(), dest)}`);
    return;
  }

  try {
    const srcContent = fs.readFileSync(src);
    const destContent = fs.readFileSync(dest);

    if (!force && srcContent.equals(destContent)) {
      return;
    }

    fs.copyFileSync(src, dest);
    console.log(`[UPDATE] ${path.relative(process.cwd(), dest)}`);
  } catch (err) {
    console.warn(`[WARN] Could not compare ${path.relative(process.cwd(), dest)}: ${err.message}`);
  }
}

function syncDistributedSkills(targetRoot, options = {}) {
  const { force = false } = options;
  const targetClaudeDir = path.join(targetRoot, '.claude');
  const targetSkillsDir = path.join(targetClaudeDir, 'skills');

  fs.mkdirSync(targetSkillsDir, { recursive: true });

  for (const skillName of DISTRIBUTED_SKILLS) {
    const sourceSkillDir = path.join(TEMPLATE_SKILLS_DIR, skillName);
    const targetSkillDir = path.join(targetSkillsDir, skillName);

    if (!fs.existsSync(sourceSkillDir)) {
      throw new Error(`Managed skill template not found: ${sourceSkillDir}`);
    }

    copyManagedDirectory(sourceSkillDir, targetSkillDir, { force });
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

  // Case 1: Directory does not exist - Create managed skill roots only
  if (!fs.existsSync(targetDir)) {
    syncDistributedSkills(targetRoot);
    console.log(`Initialized managed .claude skills in ${targetRoot}`);
    return 0;
  }

  // Case 2: Directory exists + Force - Force-upgrade managed skills only
  if (options.force) {
    console.log('Force flag detected. Reinstalling managed skills without deleting unrelated .claude files...');
    syncDistributedSkills(targetRoot, { force: true });
    console.log(`Reinstalled managed .claude skills in ${targetRoot}`);
    return 0;
  }

  // Case 3: Directory exists - Incremental Update
  console.log(`Target ${targetDir} already exists. Performing incremental update...`);
  syncDistributedSkills(targetRoot);
  console.log('Incremental update complete. Existing .claude files were preserved.');
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
