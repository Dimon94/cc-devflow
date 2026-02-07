const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');

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

  if (pkg.publishConfig?.access !== 'public') {
    errors.push('package.json publishConfig.access must be "public"');
  }

  if (pkg.license !== 'MIT') {
    errors.push('package.json license must be "MIT"');
  }

  const filesList = pkg.files;
  ensureArrayIncludes(filesList, 'bin/', errors, 'package.json files');
  ensureArrayIncludes(filesList, 'lib/', errors, 'package.json files');
  ensureArrayIncludes(filesList, 'config/', errors, 'package.json files');
  ensureArrayIncludes(filesList, '.claude/', errors, 'package.json files');
}

function validateTemplate(errors) {
  ensurePath('.claude/commands', 'dir', errors);
  ensurePath('.claude/skills', 'dir', errors);
  ensurePath('.claude/scripts', 'dir', errors);
  ensurePath('.claude/commands/flow/new.md', 'file', errors);
  ensurePath('.claude/skills/cc-devflow-orchestrator/SKILL.md', 'file', errors);
  ensurePath('.claude/scripts/verify-setup.sh', 'file', errors);
  ensurePath('bin/adapt.js', 'file', errors);
  ensurePath('bin/cc-devflow-cli.js', 'file', errors);
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
    const isEmpty = header.every(byte => byte === 0);
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
  const packResult = runCommand('pnpm', ['pack', '--pack-destination', tmpDir], { cwd: ROOT });

  if (!packResult.ok) {
    errors.push(`pnpm pack failed: ${packResult.error}`);
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return;
  }

  const tarballs = fs.readdirSync(tmpDir).filter(name => name.endsWith('.tgz'));
  if (tarballs.length === 0) {
    errors.push('pnpm pack produced no .tgz file');
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
    'package/lib/compiler/index.js',
    'package/config/adapters.yml',
    'package/.claude/CLAUDE.md',
    'package/.claude/commands/flow/new.md',
    'package/.claude/scripts/verify-setup.sh',
    'package/.claude/skills/cc-devflow-orchestrator/SKILL.md',
    'package/README.md',
    'package/README.zh-CN.md',
    'package/CHANGELOG.md',
    'package/LICENSE',
    'package/package.json'
  ];

  for (const entry of requiredEntries) {
    if (!entries.includes(entry)) {
      errors.push(`Tarball missing: ${entry}`);
    }
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

function main() {
  const errors = [];

  ensurePath('LICENSE', 'file', errors);
  ensurePath('README.md', 'file', errors);
  ensurePath('README.zh-CN.md', 'file', errors);
  ensurePath('CHANGELOG.md', 'file', errors);
  ensurePath('.claude', 'dir', errors);
  ensurePath('bin', 'dir', errors);
  ensurePath('lib', 'dir', errors);
  ensurePath('config', 'dir', errors);

  validatePackageJson(errors);
  validateTemplate(errors);
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
