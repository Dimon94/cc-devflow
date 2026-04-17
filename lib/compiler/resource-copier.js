/**
 * T050: Resource Copier Module
 *
 * 资源文件复制与路径重写:
 * - 收集 IR 中引用的 scripts/templates/guides 文件
 * - 复制到各平台对应目录
 * - 提供路径映射表供 transformer 重写内容中的路径
 *
 * 目录映射规则:
 *   .claude/scripts/       → .{platform}/scripts/
 *   .claude/docs/templates/ → .{platform}/docs/templates/
 *   .claude/docs/guides/    → .{platform}/docs/guides/
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matter = require('gray-matter');

// ============================================================
// Platform Directory Mapping
// ============================================================
const PLATFORM_DIRS = {
  codex: '.codex',
  cursor: '.cursor',
  qwen: '.qwen',
  antigravity: '.agent'
};

// ============================================================
// Patterns for inline .claude/ path detection
// ============================================================
const INLINE_CLAUDE_PATH_PATTERN = /\.claude\/(scripts|docs\/templates|docs\/guides)\/[^\s"'`<>)}\]]+/g;

// ============================================================
// collectReferencedResources - 收集 IR 中引用的资源文件
// 包括 frontmatter 定义的和内容中直接硬编码的
// ============================================================
function collectReferencedResources(irs) {
  const resources = {
    scripts: new Set(),
    templates: new Set(),
    guides: new Set()
  };

  for (const ir of irs) {
    const fm = ir.frontmatter;

    // 1. 收集 frontmatter 中定义的 scripts
    if (fm.scripts) {
      for (const scriptPath of Object.values(fm.scripts)) {
        resources.scripts.add(scriptPath);
      }
    }

    // 2. 收集 frontmatter 中定义的 templates
    if (fm.templates) {
      for (const templatePath of Object.values(fm.templates)) {
        resources.templates.add(templatePath);
      }
    }

    // 3. 收集 frontmatter 中定义的 guides
    if (fm.guides) {
      for (const guidePath of Object.values(fm.guides)) {
        resources.guides.add(guidePath);
      }
    }

    // 4. 收集 agent_scripts 中的脚本路径
    if (fm.agent_scripts) {
      if (fm.agent_scripts.sh) {
        // 提取脚本路径（去掉 __AGENT__ 等参数）
        const shPath = extractScriptPath(fm.agent_scripts.sh);
        if (shPath && shPath.startsWith('.claude/scripts/')) {
          resources.scripts.add(shPath);
        }
      }
    }

    // 5. 扫描内容中直接硬编码的 .claude/ 路径
    const inlinePaths = scanInlineClaudePaths(ir.body);
    for (const inlinePath of inlinePaths) {
      if (inlinePath.startsWith('.claude/scripts/')) {
        resources.scripts.add(inlinePath);
      } else if (inlinePath.startsWith('.claude/docs/templates/')) {
        resources.templates.add(inlinePath);
      } else if (inlinePath.startsWith('.claude/docs/guides/')) {
        resources.guides.add(inlinePath);
      }
    }
  }

  return {
    scripts: Array.from(resources.scripts),
    templates: Array.from(resources.templates),
    guides: Array.from(resources.guides)
  };
}

// ============================================================
// extractScriptPath - 从命令字符串中提取脚本路径
// 例如：".claude/scripts/foo.sh __AGENT__" → ".claude/scripts/foo.sh"
// ============================================================
function extractScriptPath(commandString) {
  if (!commandString) return null;
  // 匹配 .claude/ 开头的路径
  const match = commandString.match(/^(\.claude\/[^\s]+)/);
  return match ? match[1] : null;
}

// ============================================================
// scanInlineClaudePaths - 扫描内容中直接硬编码的 .claude/ 路径
// ============================================================
function scanInlineClaudePaths(content) {
  const paths = new Set();
  const pattern = new RegExp(INLINE_CLAUDE_PATH_PATTERN.source, 'g');

  let match;
  while ((match = pattern.exec(content)) !== null) {
    // 清理路径末尾可能的标点符号
    let cleanPath = match[0];
    // 移除末尾的常见标点
    cleanPath = cleanPath.replace(/[,;:.\s]+$/, '');
    paths.add(cleanPath);
  }

  return Array.from(paths);
}

// ============================================================
// mapPathToPlatform - 将 .claude/ 路径映射到平台路径
// ============================================================
function mapPathToPlatform(sourcePath, platform) {
  const platformDir = PLATFORM_DIRS[platform];
  if (!platformDir) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  // 将 .claude/xxx 替换为 .{platform}/xxx
  if (sourcePath.startsWith('.claude/')) {
    return sourcePath.replace(/^\.claude\//, `${platformDir}/`);
  }

  // 如果不是 .claude 开头，保持原样
  return sourcePath;
}

// ============================================================
// copyResourceFile - 复制单个资源文件
// ============================================================
async function copyResourceFile(sourcePath, targetPath, options = {}) {
  const { verbose = false, dryRun = false } = options;

  // 解析绝对路径
  const absoluteSource = path.resolve(process.cwd(), sourcePath);
  const absoluteTarget = path.resolve(process.cwd(), targetPath);

  // 检查源文件是否存在
  if (!fs.existsSync(absoluteSource)) {
    if (verbose) {
      console.warn(`Warning: Source file not found: ${sourcePath}`);
    }
    return { success: false, error: 'Source not found' };
  }

  if (dryRun) {
    if (verbose) {
      console.log(`[DRY-RUN] Would copy: ${sourcePath} → ${targetPath}`);
    }
    return { success: true, dryRun: true };
  }

  try {
    // 确保目标目录存在
    const targetDir = path.dirname(absoluteTarget);
    await fs.promises.mkdir(targetDir, { recursive: true, mode: 0o755 });

    // 复制文件
    await fs.promises.copyFile(absoluteSource, absoluteTarget);

    // 设置权限
    await fs.promises.chmod(absoluteTarget, 0o644);

    if (verbose) {
      console.log(`Copied: ${sourcePath} → ${targetPath}`);
    }

    return { success: true, source: sourcePath, target: targetPath };
  } catch (error) {
    if (verbose) {
      console.error(`Error copying ${sourcePath}: ${error.message}`);
    }
    return { success: false, error: error.message };
  }
}

// ============================================================
// copyResourcesForPlatform - 为单个平台复制所有资源
// ============================================================
async function copyResourcesForPlatform(resources, platform, options = {}) {
  const { verbose = false, dryRun = false } = options;
  const results = {
    platform,
    copied: 0,
    skipped: 0,
    errors: [],
    pathMap: {} // 源路径 → 目标路径 映射
  };

  // 合并所有资源
  const allResources = [
    ...resources.scripts,
    ...resources.templates,
    ...resources.guides
  ];

  for (const sourcePath of allResources) {
    const targetPath = mapPathToPlatform(sourcePath, platform);
    results.pathMap[sourcePath] = targetPath;

    // 检查目标文件是否已存在且相同
    const absoluteSource = path.resolve(process.cwd(), sourcePath);
    const absoluteTarget = path.resolve(process.cwd(), targetPath);

    if (fs.existsSync(absoluteTarget) && fs.existsSync(absoluteSource)) {
      const sourceHash = hashFile(absoluteSource);
      const targetHash = hashFile(absoluteTarget);
      if (sourceHash === targetHash) {
        results.skipped++;
        if (verbose) {
          console.log(`Skipped (unchanged): ${targetPath}`);
        }
        continue;
      }
    }

    const copyResult = await copyResourceFile(sourcePath, targetPath, { verbose, dryRun });

    if (copyResult.success) {
      results.copied++;
    } else {
      results.errors.push({ source: sourcePath, error: copyResult.error });
    }
  }

  return results;
}

// ============================================================
// copyResourcesForAllPlatforms - 为所有平台复制资源
// ============================================================
async function copyResourcesForAllPlatforms(irs, platforms, options = {}) {
  const resources = collectReferencedResources(irs);
  const results = {
    totalCopied: 0,
    totalSkipped: 0,
    platforms: {},
    allPathMaps: {} // platform → pathMap
  };

  for (const platform of platforms) {
    const platformResult = await copyResourcesForPlatform(resources, platform, options);
    results.platforms[platform] = platformResult;
    results.allPathMaps[platform] = platformResult.pathMap;
    results.totalCopied += platformResult.copied;
    results.totalSkipped += platformResult.skipped;
  }

  return results;
}

// ============================================================
// rewritePathsInContent - 重写内容中的 .claude/ 路径
// ============================================================
function rewritePathsInContent(content, pathMap) {
  let result = content;

  // 按路径长度降序排序，避免短路径替换长路径的部分
  const sortedPaths = Object.keys(pathMap).sort((a, b) => b.length - a.length);

  for (const sourcePath of sortedPaths) {
    const targetPath = pathMap[sourcePath];
    // 全局替换
    result = result.split(sourcePath).join(targetPath);
  }

  return result;
}

// ============================================================
// hashFile - 计算文件哈希
// ============================================================
function hashFile(filePath) {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

function hashContent(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function toRepoRelativePath(absolutePath) {
  return path.relative(process.cwd(), absolutePath).split(path.sep).join('/');
}

function rewriteCodexSkillReads(content, sourceSkillDir, targetSkillDir) {
  const parsed = matter(content);
  const reads = Array.isArray(parsed.data.reads) ? parsed.data.reads : [];

  parsed.data.reads = reads.map((entry) => {
    const relativeEntry = String(entry || '').trim();
    if (!relativeEntry || path.isAbsolute(relativeEntry)) {
      return relativeEntry;
    }

    const bundledSourcePath = path.join(sourceSkillDir, relativeEntry);
    if (!fs.existsSync(bundledSourcePath)) {
      return relativeEntry;
    }

    return toRepoRelativePath(path.join(targetSkillDir, relativeEntry));
  });

  return matter.stringify(parsed.content, parsed.data);
}

async function copyMirroredFile(sourcePath, targetPath, platform, options = {}) {
  const { sourceSkillDir = null, targetSkillDir = null } = options;
  const stat = await fs.promises.stat(sourcePath);
  await fs.promises.mkdir(path.dirname(targetPath), { recursive: true, mode: 0o755 });

  if (
    platform === 'codex' &&
    path.basename(sourcePath) === 'SKILL.md' &&
    sourceSkillDir &&
    targetSkillDir
  ) {
    const sourceContent = await fs.promises.readFile(sourcePath, 'utf8');
    const rewritten = rewriteCodexSkillReads(sourceContent, sourceSkillDir, targetSkillDir);
    await fs.promises.writeFile(targetPath, rewritten, 'utf8');
  } else {
    await fs.promises.copyFile(sourcePath, targetPath);
  }

  await fs.promises.chmod(targetPath, stat.mode & 0o777);
}

async function getExpectedMirroredHash(sourcePath, targetPath, platform, options = {}) {
  const { sourceSkillDir = null, targetSkillDir = null } = options;

  if (
    platform === 'codex' &&
    path.basename(sourcePath) === 'SKILL.md' &&
    sourceSkillDir &&
    targetSkillDir
  ) {
    const sourceContent = await fs.promises.readFile(sourcePath, 'utf8');
    const rewritten = rewriteCodexSkillReads(sourceContent, sourceSkillDir, targetSkillDir);
    return hashContent(rewritten);
  }

  return hashFile(sourcePath);
}

// ============================================================
// mirrorSkillDirectoriesForPlatform - 镜像 skills 目录到平台目录
// ============================================================
async function mirrorSkillDirectoriesForPlatform(skillsDir, platform, skillNames, options = {}) {
  const { verbose = false, dryRun = false } = options;
  const result = {
    platform,
    copied: 0,
    skipped: 0,
    errors: []
  };

  const platformDir = PLATFORM_DIRS[platform];
  if (!platformDir) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  const sourceRoot = path.resolve(process.cwd(), skillsDir);
  const targetRoot = path.resolve(process.cwd(), platformDir, 'skills');

  for (const skillName of skillNames) {
    const sourceSkillDir = path.join(sourceRoot, skillName);
    const targetSkillDir = path.join(targetRoot, skillName);

    if (!fs.existsSync(sourceSkillDir)) {
      result.errors.push({ skill: skillName, error: 'Source skill directory not found' });
      continue;
    }

    const mirrorResult = await mirrorDirectoryRecursive(sourceSkillDir, targetSkillDir, {
      verbose,
      dryRun,
      platform,
      sourceSkillDir,
      targetSkillDir
    });
    result.copied += mirrorResult.copied;
    result.skipped += mirrorResult.skipped;
    result.errors.push(...mirrorResult.errors.map((error) => ({ skill: skillName, error })));
  }

  return result;
}

async function removePathIfExists(targetPath, options = {}) {
  const { verbose = false, dryRun = false } = options;
  const absoluteTarget = path.resolve(process.cwd(), targetPath);

  if (!fs.existsSync(absoluteTarget)) {
    return false;
  }

  if (!dryRun) {
    await fs.promises.rm(absoluteTarget, { recursive: true, force: true });
  }

  if (verbose) {
    console.log(`Removed stale path: ${targetPath}`);
  }

  return true;
}

async function mirrorDirectoryRecursive(sourceDir, targetDir, options = {}) {
  const { verbose = false, dryRun = false, platform, sourceSkillDir, targetSkillDir } = options;
  const result = {
    copied: 0,
    skipped: 0,
    errors: []
  };

  let entries;
  try {
    entries = await fs.promises.readdir(sourceDir, { withFileTypes: true });
  } catch (error) {
    result.errors.push(error.message);
    return result;
  }

  if (!dryRun) {
    await fs.promises.mkdir(targetDir, { recursive: true, mode: 0o755 });
  }

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await mirrorDirectoryRecursive(sourcePath, targetPath, options);
      result.copied += nested.copied;
      result.skipped += nested.skipped;
      result.errors.push(...nested.errors);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const sourceHash = await getExpectedMirroredHash(sourcePath, targetPath, platform, {
      sourceSkillDir,
      targetSkillDir
    });
    const targetHash = fs.existsSync(targetPath) ? hashFile(targetPath) : null;

    if (sourceHash && targetHash && sourceHash === targetHash) {
      result.skipped++;
      if (verbose) {
        console.log(`Skipped skill file (unchanged): ${path.relative(process.cwd(), targetPath)}`);
      }
      continue;
    }

    if (!dryRun) {
      await copyMirroredFile(sourcePath, targetPath, platform, { sourceSkillDir, targetSkillDir });
    }

    result.copied++;
    if (verbose) {
      console.log(`Mirrored skill file: ${path.relative(process.cwd(), targetPath)}`);
    }
  }

  return result;
}

// ============================================================
// clearResourceCache - 清除资源缓存（用于测试）
// ============================================================
function clearResourceCache() {
  // 目前没有缓存，预留接口
}

module.exports = {
  PLATFORM_DIRS,
  INLINE_CLAUDE_PATH_PATTERN,
  collectReferencedResources,
  scanInlineClaudePaths,
  extractScriptPath,
  mapPathToPlatform,
  copyResourceFile,
  copyResourcesForPlatform,
  copyResourcesForAllPlatforms,
  mirrorSkillDirectoriesForPlatform,
  removePathIfExists,
  rewritePathsInContent,
  clearResourceCache
};
