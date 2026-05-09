const fs = require('fs');
const path = require('path');
const { getChangesRoot } = require('./paths.js');

function getArchiveRoot(repoRoot) {
  return path.join(getChangesRoot(repoRoot), 'archive');
}

function archiveChange(repoRoot, changeKey) {
  const changesRoot = getChangesRoot(repoRoot);
  const changeDir = path.join(changesRoot, changeKey);

  if (!fs.existsSync(changeDir) || !fs.statSync(changeDir).isDirectory()) {
    throw new Error(`Change directory not found: ${changeDir}`);
  }

  const month = new Date().toISOString().slice(0, 7);
  const archiveDir = path.join(getArchiveRoot(repoRoot), month);
  fs.mkdirSync(archiveDir, { recursive: true });

  const dest = path.join(archiveDir, changeKey);
  if (fs.existsSync(dest)) {
    throw new Error(`Archive target already exists: ${dest}`);
  }

  fs.renameSync(changeDir, dest);
  return { archived: dest, month };
}

function restoreChange(repoRoot, archivedPath) {
  if (!fs.existsSync(archivedPath) || !fs.statSync(archivedPath).isDirectory()) {
    throw new Error(`Archived directory not found: ${archivedPath}`);
  }

  const changeKey = path.basename(archivedPath);
  const changesRoot = getChangesRoot(repoRoot);
  const dest = path.join(changesRoot, changeKey);

  if (fs.existsSync(dest)) {
    throw new Error(`Change already exists in active directory: ${dest}`);
  }

  fs.mkdirSync(changesRoot, { recursive: true });
  fs.renameSync(archivedPath, dest);
  return { restored: dest, changeKey };
}

function listArchived(repoRoot) {
  const archiveRoot = getArchiveRoot(repoRoot);
  if (!fs.existsSync(archiveRoot)) return [];

  const results = [];
  for (const month of fs.readdirSync(archiveRoot, { withFileTypes: true })) {
    if (!month.isDirectory()) continue;
    const monthDir = path.join(archiveRoot, month.name);
    for (const entry of fs.readdirSync(monthDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      results.push({ month: month.name, changeKey: entry.name, path: path.join(monthDir, entry.name) });
    }
  }
  return results;
}

module.exports = { archiveChange, restoreChange, listArchived, getArchiveRoot };
