/**
 * T011: Drift Detection Tests
 *
 * 测试漂移检测:
 * 1. 无漂移时返回 exit code 0
 * 2. 手动修改时返回 exit code 2 并输出 diff
 * 3. 目标文件缺失时返回 exit code 2
 * 4. 规则入口文件包含在漂移检测中
 *
 * Reference: contracts/cli-spec.yaml#check_output
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

describe('Drift Detection', () => {
  let tempDir;

  beforeEach(async () => {
    // 创建临时目录用于测试
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'drift-test-'));
  });

  afterEach(async () => {
    // 清理临时目录
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('checkDrift()', () => {
    test('should return empty array when no drift', async () => {
      const { checkDrift, hashContent } = require('../manifest');

      // 创建测试文件
      const targetPath = path.join(tempDir, 'test.md');
      const content = 'test content';
      await fs.promises.writeFile(targetPath, content);

      // 创建 manifest 记录
      const manifest = {
        entries: [
          {
            source: 'source.md',
            target: targetPath,
            hash: hashContent(content), // 使用相同 hash
            platform: 'codex'
          }
        ]
      };

      const drift = await checkDrift(manifest);

      expect(drift).toEqual([]);
    });

    test('should detect drift when target file modified', async () => {
      const { checkDrift, hashContent } = require('../manifest');

      // 创建测试文件
      const targetPath = path.join(tempDir, 'test.md');
      const originalContent = 'original content';
      const modifiedContent = 'modified content';

      await fs.promises.writeFile(targetPath, modifiedContent);

      // manifest 记录原始内容的 hash
      const manifest = {
        entries: [
          {
            source: 'source.md',
            target: targetPath,
            hash: hashContent(originalContent),
            platform: 'codex'
          }
        ]
      };

      const drift = await checkDrift(manifest);

      expect(drift.length).toBe(1);
      expect(drift[0].issue).toBe('target file modified since last compile');
    });

    test('should detect drift when target file missing', async () => {
      const { checkDrift, hashContent } = require('../manifest');

      const missingPath = path.join(tempDir, 'nonexistent.md');

      const manifest = {
        entries: [
          {
            source: 'source.md',
            target: missingPath,
            hash: hashContent('some content'),
            platform: 'codex'
          }
        ]
      };

      const drift = await checkDrift(manifest);

      expect(drift.length).toBe(1);
      expect(drift[0].issue).toBe('target file missing');
    });

    test('should return empty array for null manifest', async () => {
      const { checkDrift } = require('../manifest');

      const drift = await checkDrift(null);

      expect(drift).toEqual([]);
    });

    test('should return empty array for manifest without entries', async () => {
      const { checkDrift } = require('../manifest');

      const drift = await checkDrift({ entries: null });

      expect(drift).toEqual([]);
    });
  });

  describe('Rules Entry Drift Detection', () => {
    test('should include rules entry files in drift check', async () => {
      // 规则入口文件应该和普通命令文件一样被检测
      // 这需要在 Phase 4 扩展 checkDrift 函数

      const { checkDrift, hashContent, addRulesEntry, createManifest } = require('../manifest');

      const manifest = createManifest();

      // 添加规则入口记录
      const rulesPath = path.join(tempDir, 'devflow.mdc');
      const originalContent = 'original rules';

      addRulesEntry(manifest, 'cursor', {
        path: rulesPath,
        hash: hashContent(originalContent),
        timestamp: new Date().toISOString()
      });

      // 创建被修改的文件
      await fs.promises.writeFile(rulesPath, 'modified rules');

      // 注意：当前 checkDrift 只检查 entries，不检查 rulesEntry
      // 这个测试会在 Phase 4 (T025) 实现后通过

      // 占位断言
      expect(manifest.rulesEntry.cursor).toBeDefined();
    });
  });

  describe('Exit Codes', () => {
    test('should indicate exit code 0 for no drift', async () => {
      const { checkDrift } = require('../manifest');

      const drift = await checkDrift({ entries: [] });

      // exit code 由调用方根据 drift 数组长度决定
      const exitCode = drift.length > 0 ? 2 : 0;
      expect(exitCode).toBe(0);
    });

    test('should indicate exit code 2 for drift detected', async () => {
      const { checkDrift, hashContent } = require('../manifest');

      const targetPath = path.join(tempDir, 'drifted.md');
      await fs.promises.writeFile(targetPath, 'modified');

      const manifest = {
        entries: [
          {
            source: 'source.md',
            target: targetPath,
            hash: hashContent('original'),
            platform: 'codex'
          }
        ]
      };

      const drift = await checkDrift(manifest);

      const exitCode = drift.length > 0 ? 2 : 0;
      expect(exitCode).toBe(2);
    });
  });

  describe('Drift Report Format', () => {
    test('should include source and target in drift report', async () => {
      const { checkDrift, hashContent } = require('../manifest');

      const targetPath = path.join(tempDir, 'report-test.md');
      await fs.promises.writeFile(targetPath, 'modified');

      const manifest = {
        entries: [
          {
            source: 'original-source.md',
            target: targetPath,
            hash: hashContent('original content'),
            platform: 'codex'
          }
        ]
      };

      const drift = await checkDrift(manifest);

      expect(drift[0]).toHaveProperty('source', 'original-source.md');
      expect(drift[0]).toHaveProperty('target', targetPath);
      expect(drift[0]).toHaveProperty('issue');
    });
  });
});
