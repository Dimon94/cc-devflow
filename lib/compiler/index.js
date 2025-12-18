/**
 * T043: Compiler Entry Point
 *
 * 编译器主入口:
 * - compile(options): 编译命令文件到目标平台
 * - 协调 parser, transformer, emitters, manifest
 */
const path = require('path');

const { parseAllCommands } = require('./parser.js');
const { transformForPlatform } = require('./transformer.js');
const { getEmitter, getAllEmitters, PLATFORMS } = require('./emitters/index.js');
const {
  loadManifest,
  saveManifest,
  needsRecompile,
  addEntry,
  createEntry,
  createManifest,
  hashContent,
  MANIFEST_PATH
} = require('./manifest.js');

// ============================================================
// compile - 编译主函数
// ============================================================
async function compile(options = {}) {
  const {
    sourceDir = '.claude/commands/',
    outputBaseDir = '.',
    platforms = PLATFORMS,
    verbose = false,
    check = false
  } = options;

  // 验证平台参数
  for (const platform of platforms) {
    if (!PLATFORMS.includes(platform)) {
      throw new Error(`Unknown platform: ${platform}`);
    }
  }

  const result = {
    success: true,
    platforms: platforms,
    filesCompiled: 0,
    filesSkipped: 0,
    errors: []
  };

  // 加载 manifest
  const manifestPath = path.join(outputBaseDir, MANIFEST_PATH);
  let manifest = await loadManifest(manifestPath);
  if (!manifest) {
    manifest = createManifest();
  }

  // 如果是 check 模式，只做漂移检测
  if (check) {
    const { checkDrift } = require('./manifest.js');
    const drift = await checkDrift(manifest);
    return {
      ...result,
      check: true,
      drift,
      success: drift.length === 0
    };
  }

  // 解析所有命令文件
  const absoluteSourceDir = path.resolve(sourceDir);
  let irs;
  try {
    irs = await parseAllCommands(absoluteSourceDir);
  } catch (error) {
    result.success = false;
    result.errors.push(error.message);
    return result;
  }

  if (verbose) {
    console.log(`Found ${irs.length} command files`);
  }

  // 编译每个文件到每个平台
  for (const ir of irs) {
    for (const platform of platforms) {
      // 检查是否需要重新编译
      const sourceRelative = path.relative(outputBaseDir, ir.source.path);
      if (!needsRecompile(sourceRelative, ir.source.hash, manifest, platform)) {
        result.filesSkipped++;
        if (verbose) {
          console.log(`Skipped: ${ir.source.filename} -> ${platform} (unchanged)`);
        }
        continue;
      }

      try {
        // 转换
        const transformed = transformForPlatform(ir, platform);

        // 获取 emitter
        const emitter = getEmitter(platform);

        // 格式化
        const formatted = emitter.format(ir, transformed.body);

        // 处理拆分文件（Antigravity 可能返回数组）
        if (Array.isArray(formatted)) {
          for (const part of formatted) {
            const emitResult = await emitter.emit(part.filename, part.content);

            // 更新 manifest
            addEntry(manifest, createEntry({
              source: sourceRelative,
              target: emitResult.path,
              sourceHash: ir.source.hash,
              targetHash: emitResult.hash,
              platform
            }));

            if (verbose) {
              console.log(`Compiled: ${ir.source.filename} -> ${platform} (${part.filename})`);
            }
          }
        } else {
          const emitResult = await emitter.emit(ir.source.filename, formatted);

          // 更新 manifest
          addEntry(manifest, createEntry({
            source: sourceRelative,
            target: emitResult.path,
            sourceHash: ir.source.hash,
            targetHash: emitResult.hash,
            platform
          }));

          if (verbose) {
            console.log(`Compiled: ${ir.source.filename} -> ${platform}`);
          }
        }

        result.filesCompiled++;
      } catch (error) {
        result.success = false;
        result.errors.push(`${ir.source.filename} -> ${platform}: ${error.message}`);
      }
    }
  }

  // 保存 manifest
  manifest.generatedAt = new Date().toISOString();
  await saveManifest(manifest, manifestPath);

  return result;
}

module.exports = {
  compile,
  PLATFORMS
};
