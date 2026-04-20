const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const DISTRIBUTION_CONFIG = require(path.join(ROOT, 'config', 'distributable-skills.json'));
const PUBLIC_SKILLS = DISTRIBUTION_CONFIG.publicSkills || [];
const DISTRIBUTED_SKILLS = DISTRIBUTION_CONFIG.distributedSkills || PUBLIC_SKILLS;
const INTERNAL_SKILLS = DISTRIBUTION_CONFIG.internalSkills || [];

function statType(stat) {
  if (stat.isFile()) {
    return 'file';
  }
  if (stat.isDirectory()) {
    return 'dir';
  }
  return 'other';
}

function ensurePath(relPath, expectedType, errors) {
  const target = path.join(ROOT, relPath);

  if (!fs.existsSync(target)) {
    errors.push(`Missing ${expectedType}: ${relPath}`);
    return;
  }

  const actualType = statType(fs.statSync(target));
  if (actualType !== expectedType) {
    errors.push(`Expected ${expectedType} but found ${actualType}: ${relPath}`);
  }
}

function ensureArrayIncludes(list, value, errors, label) {
  if (!Array.isArray(list)) {
    errors.push(`${label} must be an array`);
    return;
  }

  if (!list.includes(value)) {
    errors.push(`${label} missing: ${value}`);
  }
}

function validatePackageJson(errors) {
  const pkgPath = path.join(ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.bin || typeof pkg.bin !== 'object') {
    errors.push('package.json missing bin field');
    return;
  }

  const binPath = pkg.bin['cc-devflow'];
  if (!binPath) {
    errors.push('package.json bin missing cc-devflow entry');
  } else {
    ensurePath(binPath, 'file', errors);
  }

  if (pkg.main !== 'bin/cc-devflow.js') {
    errors.push('package.json main must be "bin/cc-devflow.js"');
  }

  if (pkg.license !== 'MIT') {
    errors.push('package.json license must be "MIT"');
  }

  if (pkg.private === true) {
    errors.push('package.json should not be private when restoring the distributable CLI');
  }

  if (pkg.publishConfig?.access !== 'public') {
    errors.push('package.json publishConfig.access must be "public"');
  }

  const scripts = pkg.scripts || {};
  if (scripts.prepublishOnly !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.prepublishOnly must be "node scripts/validate-publish.js"');
  }
  if (scripts['verify:examples'] !== 'bash docs/examples/scripts/check-example-bindings.sh') {
    errors.push('package.json scripts.verify:examples must run the example bindings check');
  }
  if (scripts['verify:publish'] !== 'node scripts/validate-publish.js') {
    errors.push('package.json scripts.verify:publish must be "node scripts/validate-publish.js"');
  }
  if (typeof scripts.verify !== 'string' || !scripts.verify.includes('npm run verify:examples')) {
    errors.push('package.json scripts.verify must include "npm run verify:examples"');
  }

  ensureArrayIncludes(pkg.files, 'bin/', errors, 'package.json files');
  ensureArrayIncludes(pkg.files, 'lib/', errors, 'package.json files');
  ensureArrayIncludes(pkg.files, 'config/', errors, 'package.json files');
  for (const skillName of DISTRIBUTED_SKILLS) {
    ensureArrayIncludes(pkg.files, `.claude/skills/${skillName}/`, errors, 'package.json files');
  }

  if (pkg.files.includes('.claude/skills/')) {
    errors.push('package.json files should not include broad ".claude/skills/" entry');
  }
}

function validateTemplate(errors) {
  ensurePath('.claude', 'dir', errors);
  ensurePath('.claude/skills', 'dir', errors);
  ensurePath('bin/adapt.js', 'file', errors);
  ensurePath('bin/cc-devflow-cli.js', 'file', errors);
  ensurePath('bin/cc-devflow.js', 'file', errors);
  ensurePath('config/adapters.yml', 'file', errors);
  ensurePath('config/schema/adapters.schema.json', 'file', errors);
  ensurePath('lib/compiler', 'dir', errors);
  for (const skillName of DISTRIBUTED_SKILLS) {
    ensurePath(`.claude/skills/${skillName}`, 'dir', errors);
    ensurePath(`.claude/skills/${skillName}/SKILL.md`, 'file', errors);
  }

  for (const skillName of PUBLIC_SKILLS) {
    ensurePath(`.claude/skills/${skillName}/PLAYBOOK.md`, 'file', errors);
  }
}

function ensureNonEmptyString(value, label, errors) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function ensureStringArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }

  for (const item of value) {
    if (typeof item !== 'string' || item.trim().length === 0) {
      errors.push(`${label} must contain non-empty strings`);
      return;
    }
  }
}

function ensureWritesArray(value, label, errors) {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be a non-empty array`);
    return;
  }

  for (const item of value) {
    if (!item || typeof item !== 'object') {
      errors.push(`${label} must contain objects`);
      return;
    }

    ensureNonEmptyString(item.path, `${label}.path`, errors);

    if (item.durability !== undefined) {
      ensureNonEmptyString(item.durability, `${label}.durability`, errors);
    }

    if (item.required !== undefined && typeof item.required !== 'boolean') {
      errors.push(`${label}.required must be a boolean when present`);
    }
  }
}

function validatePublicSkillContracts(errors) {
  for (const skillName of PUBLIC_SKILLS) {
    const skillPath = path.join(ROOT, '.claude', 'skills', skillName, 'SKILL.md');
    const playbookPath = path.join(ROOT, '.claude', 'skills', skillName, 'PLAYBOOK.md');
    const skillBody = fs.readFileSync(skillPath, 'utf8');
    const playbookBody = fs.readFileSync(playbookPath, 'utf8');

    let parsed;
    try {
      parsed = matter(skillBody);
    } catch (error) {
      errors.push(`Failed to parse public skill ${skillName}: ${error.message}`);
      continue;
    }

    const data = parsed.data || {};
    ensureNonEmptyString(data.name, `${skillName} frontmatter.name`, errors);
    ensureNonEmptyString(data.version, `${skillName} frontmatter.version`, errors);
    ensureNonEmptyString(data.description, `${skillName} frontmatter.description`, errors);
    ensureStringArray(data.triggers, `${skillName} frontmatter.triggers`, errors);
    ensureStringArray(data.reads, `${skillName} frontmatter.reads`, errors);
    ensureWritesArray(data.writes, `${skillName} frontmatter.writes`, errors);
    ensureStringArray(data.entry_gate, `${skillName} frontmatter.entry_gate`, errors);
    ensureStringArray(data.exit_criteria, `${skillName} frontmatter.exit_criteria`, errors);

    if (!Array.isArray(data.reroutes) || data.reroutes.length === 0) {
      errors.push(`${skillName} frontmatter.reroutes must be a non-empty array`);
    } else {
      for (const route of data.reroutes) {
        if (!route || typeof route !== 'object') {
          errors.push(`${skillName} frontmatter.reroutes must contain objects`);
          break;
        }
        ensureNonEmptyString(route.when, `${skillName} reroutes.when`, errors);
        ensureNonEmptyString(route.target, `${skillName} reroutes.target`, errors);
      }
    }

    if (!Array.isArray(data.recovery_modes) || data.recovery_modes.length === 0) {
      errors.push(`${skillName} frontmatter.recovery_modes must be a non-empty array`);
    } else {
      for (const mode of data.recovery_modes) {
        if (!mode || typeof mode !== 'object') {
          errors.push(`${skillName} frontmatter.recovery_modes must contain objects`);
          break;
        }
        ensureNonEmptyString(mode.name, `${skillName} recovery_modes.name`, errors);
        ensureNonEmptyString(mode.when, `${skillName} recovery_modes.when`, errors);
        ensureNonEmptyString(mode.action, `${skillName} recovery_modes.action`, errors);
      }
    }

    const budget = data.tool_budget;
    if (!budget || typeof budget !== 'object') {
      errors.push(`${skillName} frontmatter.tool_budget must be an object`);
    } else {
      for (const key of ['read_files', 'search_steps', 'shell_commands']) {
        if (!Number.isInteger(budget[key]) || budget[key] < 0) {
          errors.push(`${skillName} frontmatter.tool_budget.${key} must be a non-negative integer`);
        }
      }
    }

    if (!/## Harness Contract\b/.test(parsed.content)) {
      errors.push(`${skillName} SKILL.md must include "## Harness Contract"`);
    }

    if (!/## Visible State Machine\b/.test(playbookBody)) {
      errors.push(`${skillName} PLAYBOOK.md must include "## Visible State Machine"`);
    }
  }
}

function runCommand(command, args, options) {
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' });

  if (result.error) {
    return { ok: false, error: result.error.message, output: '' };
  }

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    return { ok: false, error: output || `${command} exited with code ${result.status}`, output };
  }

  return { ok: true, error: '', output: result.stdout || '' };
}

function readString(buffer, start, length) {
  const slice = buffer.slice(start, start + length);
  const nullIndex = slice.indexOf(0);
  const end = nullIndex === -1 ? slice.length : nullIndex;
  return slice.slice(0, end).toString('utf8');
}

function parseOctal(buffer, start, length) {
  const raw = readString(buffer, start, length).trim();
  if (!raw) {
    return 0;
  }
  return parseInt(raw, 8);
}

function parsePaxHeader(content) {
  const text = content.toString('utf8');
  let index = 0;
  let pathValue = null;

  while (index < text.length) {
    const spaceIndex = text.indexOf(' ', index);
    if (spaceIndex === -1) {
      break;
    }

    const lengthStr = text.slice(index, spaceIndex);
    const recordLength = parseInt(lengthStr, 10);
    if (!Number.isFinite(recordLength) || recordLength <= 0) {
      break;
    }

    const record = text.slice(index, index + recordLength);
    const eqIndex = record.indexOf('=');
    if (eqIndex !== -1) {
      const key = record.slice(record.indexOf(' ') + 1, eqIndex);
      const value = record.slice(eqIndex + 1, recordLength - 1);
      if (key === 'path') {
        pathValue = value;
      }
    }

    index += recordLength;
  }

  return { path: pathValue };
}

function listTarEntries(tarBuffer) {
  const entries = [];
  let offset = 0;
  let longName = null;
  let paxPath = null;

  while (offset + 512 <= tarBuffer.length) {
    const header = tarBuffer.slice(offset, offset + 512);
    const isEmpty = header.every((byte) => byte === 0);
    if (isEmpty) {
      break;
    }

    const name = readString(header, 0, 100);
    const size = parseOctal(header, 124, 12);
    const typeflag = String.fromCharCode(header[156] || 0);
    const prefix = readString(header, 345, 155);
    const contentStart = offset + 512;
    const contentEnd = contentStart + size;

    let fullName = name;
    if (prefix) {
      fullName = `${prefix}/${name}`;
    }

    if (typeflag === 'L') {
      longName = readString(tarBuffer.slice(contentStart, contentEnd), 0, size);
    } else if (typeflag === 'x') {
      const pax = parsePaxHeader(tarBuffer.slice(contentStart, contentEnd));
      paxPath = pax.path || null;
    } else {
      if (longName) {
        fullName = longName;
        longName = null;
      }
      if (paxPath) {
        fullName = paxPath;
        paxPath = null;
      }
      if (fullName) {
        entries.push(fullName);
      }
    }

    const paddedSize = Math.ceil(size / 512) * 512;
    offset = contentStart + paddedSize;
  }

  return entries;
}

function validatePackTarball(errors) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-devflow-pack-'));
  const packEnv = { ...process.env };
  delete packEnv.npm_config_dry_run;
  delete packEnv.NPM_CONFIG_DRY_RUN;

  const packResult = runCommand('npm', ['pack', '--pack-destination', tmpDir], {
    cwd: ROOT,
    env: packEnv
  });

  if (!packResult.ok) {
    errors.push(`npm pack failed: ${packResult.error}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const tarballs = fs.readdirSync(tmpDir).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length === 0) {
    errors.push('npm pack produced no .tgz file');
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const tarballPath = path.join(tmpDir, tarballs[0]);
  let entries;

  try {
    const tgzBuffer = fs.readFileSync(tarballPath);
    const tarBuffer = zlib.gunzipSync(tgzBuffer);
    entries = listTarEntries(tarBuffer);
  } catch (error) {
    errors.push(`Failed to read tarball: ${error.message}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const requiredEntries = [
    'package/bin/cc-devflow-cli.js',
    'package/bin/adapt.js',
    'package/bin/cc-devflow.js',
    'package/lib/compiler/index.js',
    'package/config/adapters.yml',
    'package/README.md',
    'package/README.zh-CN.md',
    'package/CHANGELOG.md',
    'package/LICENSE',
    'package/package.json'
  ];

  for (const skillName of DISTRIBUTED_SKILLS) {
    requiredEntries.push(`package/.claude/skills/${skillName}/SKILL.md`);
  }

  for (const skillName of PUBLIC_SKILLS) {
    requiredEntries.push(`package/.claude/skills/${skillName}/PLAYBOOK.md`);
  }

  for (const entry of requiredEntries) {
    if (!entries.includes(entry)) {
      errors.push(`Tarball missing: ${entry}`);
    }
  }

  for (const entry of entries) {
    if (entry.includes('/.DS_Store') || entry.includes('.claude/tsc-cache/')) {
      errors.push(`Tarball should not include transient file: ${entry}`);
    }
  }

  for (const skillName of INTERNAL_SKILLS) {
    for (const entry of entries) {
      if (entry.startsWith(`package/.claude/skills/${skillName}/`)) {
        errors.push(`Tarball should not include internal skill: ${entry}`);
      }
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function validateExampleBindings(errors) {
  ensurePath('docs/examples/example-bindings.json', 'file', errors);
  ensurePath('docs/examples/scripts/check-example-bindings.sh', 'file', errors);

  const result = runCommand('bash', ['docs/examples/scripts/check-example-bindings.sh'], {
    cwd: ROOT,
    env: process.env
  });

  if (!result.ok) {
    errors.push(`example bindings check failed: ${result.error}`);
  }
}

function main() {
  const errors = [];

  ensurePath('LICENSE', 'file', errors);
  ensurePath('README.md', 'file', errors);
  ensurePath('README.zh-CN.md', 'file', errors);
  ensurePath('CHANGELOG.md', 'file', errors);
  ensurePath('bin', 'dir', errors);
  ensurePath('lib', 'dir', errors);
  ensurePath('config', 'dir', errors);

  validatePackageJson(errors);
  validateTemplate(errors);
  validatePublicSkillContracts(errors);
  validateExampleBindings(errors);
  validatePackTarball(errors);

  if (errors.length > 0) {
    console.error('Publish validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Publish validation passed.');
}

main();
