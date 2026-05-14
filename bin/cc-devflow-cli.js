#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(PACKAGE_ROOT, '.claude');
const TEMPLATE_SKILLS_DIR = path.join(TEMPLATE_DIR, 'skills');
const DISTRIBUTION_CONFIG = require(path.join(PACKAGE_ROOT, 'config', 'distributable-skills.json'));
const {
  doctorUserConfig,
  getConfigValue,
  resolveUserConfig,
  setConfigValue,
  writeConfigTemplate
} = require(path.join(PACKAGE_ROOT, 'lib/skill-runtime/config.js'));
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
  config init         Create a YAML config template
  config get          Print one resolved config value
  config set          Set one project/user/local config value
  config resolve      Print resolved YAML config with key-level trace
  config doctor       Validate config and local ignore safety
  next-change-key     Compute the next REQ/FIX change key
  archive-change      Archive a completed change to devflow/changes/archive/YYYY-MM/
  restore-change      Restore an archived change back to devflow/changes/
  list-archived       List all archived changes

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

Config options:
  --cwd <path>         Project path used for project/local config lookup
  --user               Read/write ~/.cc-devflow/config.yml
  --project            Read/write .cc-devflow/config.yml
  --local              Read/write .cc-devflow/config.local.yml
  --scope <name>       Backward-compatible scope alias: user, project, or local
  --format <name>      Output format: json or policy
  --document-language  CLI override for output.document_language
  --trace              Include key-level source trace with policy output
  --force              Overwrite an existing config template

Next-change-key options:
  --prefix <REQ|FIX>   Change type prefix (required)
  --description <text> Short description, will be slugified (required)
  --cwd <path>         Project path (default: cwd)

Examples:
  cc-devflow init
  cc-devflow init --dir /path/to/project
  cc-devflow adapt --platform cursor
  cc-devflow adapt --cwd /path/to/project --platform codex
  cc-devflow config init --cwd /path/to/project --project
  cc-devflow config set output.document_language zh-CN --cwd /path/to/project --project
  cc-devflow config set output.document_language zh-CN --user
  cc-devflow config resolve --cwd /path/to/project --format policy
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
    if (force) {
      pruneManagedDirectory(src, dest);
    }
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

function pruneManagedDirectory(src, dest) {
  if (!fs.existsSync(dest) || !fs.statSync(dest).isDirectory()) {
    return;
  }

  const sourceEntries = new Set(fs.readdirSync(src));
  for (const entry of fs.readdirSync(dest)) {
    if (sourceEntries.has(entry)) {
      continue;
    }

    const targetPath = path.join(dest, entry);
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`[DELETE] ${path.relative(process.cwd(), targetPath)}`);
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

function parseConfigArgs(args) {
  const parsed = {
    cwd: null,
    documentLanguage: null,
    force: false,
    format: 'json',
    scope: 'project',
    trace: false
  };
  const rest = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force') {
      parsed.force = true;
      continue;
    }

    if (arg === '--trace') {
      parsed.trace = true;
      continue;
    }

    if (arg === '--user') {
      parsed.scope = 'user';
      continue;
    }

    if (arg === '--project') {
      parsed.scope = 'project';
      continue;
    }

    if (arg === '--local') {
      parsed.scope = 'local';
      continue;
    }

    if (arg === '--cwd') {
      parsed.cwd = args[++i];
      continue;
    }

    if (arg.startsWith('--cwd=')) {
      parsed.cwd = arg.slice('--cwd='.length);
      continue;
    }

    if (arg === '--scope') {
      parsed.scope = args[++i];
      continue;
    }

    if (arg.startsWith('--scope=')) {
      parsed.scope = arg.slice('--scope='.length);
      continue;
    }

    if (arg === '--format') {
      parsed.format = args[++i];
      continue;
    }

    if (arg.startsWith('--format=')) {
      parsed.format = arg.slice('--format='.length);
      continue;
    }

    if (arg === '--document-language') {
      parsed.documentLanguage = args[++i];
      continue;
    }

    if (arg.startsWith('--document-language=')) {
      parsed.documentLanguage = arg.slice('--document-language='.length);
      continue;
    }

    rest.push(arg);
  }

  parsed.rest = rest;
  return parsed;
}

function parseConfigOverrides(options) {
  if (!options.documentLanguage) {
    return {};
  }

  return {
    output: {
      document_language: options.documentLanguage
    }
  };
}

function runConfig(args) {
  const [subcommand, ...rest] = args;
  const options = parseConfigArgs(rest);
  const cwd = path.resolve(options.cwd || process.cwd());

  if (subcommand === 'init') {
    const configPath = writeConfigTemplate({
      cwd,
      force: options.force,
      scope: options.scope
    });
    console.log(`Config template ready: ${configPath}`);
    return 0;
  }

  if (subcommand === 'get') {
    const keyPath = options.rest[0];
    if (!keyPath) {
      console.error('Config key is required.');
      return 3;
    }

    const resolved = resolveUserConfig({
      cwd,
      overrides: parseConfigOverrides(options)
    });
    const value = getConfigValue(resolved.config, keyPath);
    if (value === undefined) {
      return 4;
    }
    process.stdout.write(`${typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}\n`);
    return 0;
  }

  if (subcommand === 'set') {
    const [keyPath, value] = options.rest;
    if (!keyPath || value === undefined) {
      console.error('Use: cc-devflow config set <key> <value>');
      return 3;
    }

    const configPath = setConfigValue(keyPath, value, {
      cwd,
      scope: options.scope
    });
    console.log(`Updated ${configPath}`);
    return 0;
  }

  if (subcommand === 'doctor') {
    const result = doctorUserConfig({
      cwd,
      overrides: parseConfigOverrides(options)
    });

    if (result.ok) {
      console.log('Config OK');
      return 0;
    }

    for (const warning of result.warnings) {
      console.error(`Config warning: ${warning}`);
    }
    return 2;
  }

  if (subcommand !== 'resolve') {
    console.error('Unknown config command. Use: cc-devflow config init|get|set|resolve|doctor');
    return 3;
  }

  const resolved = resolveUserConfig({
    cwd,
    overrides: parseConfigOverrides(options)
  });

  if (options.format === 'policy') {
    process.stdout.write(resolved.policy || '');
    if (options.trace) {
      process.stdout.write('\nTrace:\n');
      for (const entry of resolved.trace) {
        const sourcePath = entry.path ? ` ${entry.path}` : '';
        process.stdout.write(`- ${entry.key} = ${entry.value} (${entry.source}${sourcePath})\n`);
      }
    }
    return 0;
  }

  if (options.format !== 'json') {
    console.error(`Unknown config format: ${options.format}`);
    return 3;
  }

  process.stdout.write(`${JSON.stringify(resolved, null, 2)}\n`);
  return 0;
}

function runNextChangeKey(args) {
  const parsed = { prefix: null, description: null, cwd: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--prefix') { parsed.prefix = args[++i]; continue; }
    if (arg.startsWith('--prefix=')) { parsed.prefix = arg.slice('--prefix='.length); continue; }
    if (arg === '--description') { parsed.description = args[++i]; continue; }
    if (arg.startsWith('--description=')) { parsed.description = arg.slice('--description='.length); continue; }
    if (arg === '--cwd') { parsed.cwd = args[++i]; continue; }
    if (arg.startsWith('--cwd=')) { parsed.cwd = arg.slice('--cwd='.length); continue; }
  }

  if (!parsed.prefix || !parsed.description) {
    console.error('Use: cc-devflow next-change-key --prefix REQ|FIX --description "short description"');
    return 1;
  }

  const { nextChangeKey } = require(path.join(PACKAGE_ROOT, 'lib/skill-runtime/paths.js'));
  const repoRoot = path.resolve(parsed.cwd || process.cwd());
  const result = nextChangeKey(repoRoot, parsed.prefix, parsed.description);
  process.stdout.write(`${result.changeId}\n${result.changeKey}\n`);
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

function runArchiveChange(args) {
  const parsed = { changeKey: null, cwd: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--cwd') { parsed.cwd = args[++i]; continue; }
    if (arg.startsWith('--cwd=')) { parsed.cwd = arg.slice('--cwd='.length); continue; }
    if (!arg.startsWith('-') && !parsed.changeKey) { parsed.changeKey = arg; continue; }
  }

  if (!parsed.changeKey) {
    console.error('Use: cc-devflow archive-change <change-key> [--cwd path]');
    return 1;
  }

  const { archiveChange } = require(path.join(PACKAGE_ROOT, 'lib/skill-runtime/archive-change.js'));
  const repoRoot = path.resolve(parsed.cwd || process.cwd());
  const result = archiveChange(repoRoot, parsed.changeKey);
  process.stdout.write(`Archived to ${result.archived}\n`);
  return 0;
}

function runRestoreChange(args) {
  const parsed = { archivedPath: null, cwd: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--cwd') { parsed.cwd = args[++i]; continue; }
    if (arg.startsWith('--cwd=')) { parsed.cwd = arg.slice('--cwd='.length); continue; }
    if (!arg.startsWith('-') && !parsed.archivedPath) { parsed.archivedPath = arg; continue; }
  }

  if (!parsed.archivedPath) {
    console.error('Use: cc-devflow restore-change <archived-path> [--cwd path]');
    return 1;
  }

  const { restoreChange } = require(path.join(PACKAGE_ROOT, 'lib/skill-runtime/archive-change.js'));
  const repoRoot = path.resolve(parsed.cwd || process.cwd());
  const archivePath = path.resolve(parsed.archivedPath);
  const result = restoreChange(repoRoot, archivePath);
  process.stdout.write(`Restored to ${result.restored}\n`);
  return 0;
}

function runListArchived(args) {
  const parsed = { cwd: null };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--cwd') { parsed.cwd = args[++i]; continue; }
    if (arg.startsWith('--cwd=')) { parsed.cwd = arg.slice('--cwd='.length); continue; }
  }

  const { listArchived } = require(path.join(PACKAGE_ROOT, 'lib/skill-runtime/archive-change.js'));
  const repoRoot = path.resolve(parsed.cwd || process.cwd());
  const items = listArchived(repoRoot);

  if (items.length === 0) {
    process.stdout.write('No archived changes.\n');
    return 0;
  }

  for (const item of items) {
    process.stdout.write(`${item.month}  ${item.changeKey}\n`);
  }
  return 0;
}

async function main() {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return 0;
  }

  if (command.startsWith('-')) {
    console.error(`Unknown top-level option: ${command}`);
    console.error('Use: cc-devflow <command> [options]');
    return 3;
  }

  if (command === 'init') {
    return runInit(rest);
  }

  if (command === 'adapt') {
    return runAdapt(rest);
  }

  if (command === 'config') {
    return runConfig(rest);
  }

  if (command === 'query') {
    console.error('cc-devflow query has been removed. Read task.md, Git history/status, and PR or handoff truth directly.');
    return 3;
  }

  if (command === 'next-change-key') {
    return runNextChangeKey(rest);
  }

  if (command === 'archive-change') {
    return runArchiveChange(rest);
  }

  if (command === 'restore-change') {
    return runRestoreChange(rest);
  }

  if (command === 'list-archived') {
    return runListArchived(rest);
  }

  return runAdapter(command, rest);
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
}
