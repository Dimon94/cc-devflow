/**
 * T010: Error Types Tests
 * Tests for compiler error classes
 * Expected: All tests FAIL (errors not implemented)
 */

// ============================================================
// Error imports - will fail until lib/compiler/errors.js exists
// ============================================================
let errors;
try {
  errors = require('../../lib/compiler/errors.js');
} catch (e) {
  errors = null;
}

describe('Compiler Errors', () => {
  beforeEach(() => {
    if (!errors) {
      throw new Error('errors.js not implemented');
    }
  });

  // ----------------------------------------------------------
  // CompilerError (Base Class) Tests
  // ----------------------------------------------------------
  describe('CompilerError', () => {
    it('should be an instance of Error', () => {
      const err = new errors.CompilerError('test message');
      expect(err).toBeInstanceOf(Error);
    });

    it('should set name to CompilerError', () => {
      const err = new errors.CompilerError('test');
      expect(err.name).toBe('CompilerError');
    });

    it('should preserve message', () => {
      const err = new errors.CompilerError('custom message');
      expect(err.message).toBe('custom message');
    });

    it('should have proper stack trace', () => {
      const err = new errors.CompilerError('test');
      expect(err.stack).toBeDefined();
      expect(err.stack).toContain('CompilerError');
    });
  });

  // ----------------------------------------------------------
  // MissingFrontmatterError Tests
  // ----------------------------------------------------------
  describe('MissingFrontmatterError', () => {
    it('should extend CompilerError', () => {
      const err = new errors.MissingFrontmatterError('test.md');
      expect(err).toBeInstanceOf(errors.CompilerError);
    });

    it('should set name to MissingFrontmatterError', () => {
      const err = new errors.MissingFrontmatterError('test.md');
      expect(err.name).toBe('MissingFrontmatterError');
    });

    it('should include file path in message', () => {
      const err = new errors.MissingFrontmatterError('/path/to/file.md');
      expect(err.message).toContain('/path/to/file.md');
    });

    it('should store filePath property', () => {
      const err = new errors.MissingFrontmatterError('/path/to/file.md');
      expect(err.filePath).toBe('/path/to/file.md');
    });
  });

  // ----------------------------------------------------------
  // InvalidFrontmatterError Tests
  // ----------------------------------------------------------
  describe('InvalidFrontmatterError', () => {
    it('should extend CompilerError', () => {
      const err = new errors.InvalidFrontmatterError('test.md', 'missing name');
      expect(err).toBeInstanceOf(errors.CompilerError);
    });

    it('should set name to InvalidFrontmatterError', () => {
      const err = new errors.InvalidFrontmatterError('test.md', 'reason');
      expect(err.name).toBe('InvalidFrontmatterError');
    });

    it('should include file path and reason in message', () => {
      const err = new errors.InvalidFrontmatterError('/path/file.md', 'missing required field: name');
      expect(err.message).toContain('/path/file.md');
      expect(err.message).toContain('missing required field: name');
    });

    it('should store filePath and reason properties', () => {
      const err = new errors.InvalidFrontmatterError('/path/file.md', 'bad format');
      expect(err.filePath).toBe('/path/file.md');
      expect(err.reason).toBe('bad format');
    });
  });

  // ----------------------------------------------------------
  // UnknownAliasError Tests
  // ----------------------------------------------------------
  describe('UnknownAliasError', () => {
    it('should extend CompilerError', () => {
      const err = new errors.UnknownAliasError('test.md', 'unknown_alias');
      expect(err).toBeInstanceOf(errors.CompilerError);
    });

    it('should set name to UnknownAliasError', () => {
      const err = new errors.UnknownAliasError('test.md', 'alias');
      expect(err.name).toBe('UnknownAliasError');
    });

    it('should include file path and alias in message', () => {
      const err = new errors.UnknownAliasError('/path/file.md', 'prereq');
      expect(err.message).toContain('/path/file.md');
      expect(err.message).toContain('prereq');
    });

    it('should store filePath and alias properties', () => {
      const err = new errors.UnknownAliasError('/path/file.md', 'my_alias');
      expect(err.filePath).toBe('/path/file.md');
      expect(err.alias).toBe('my_alias');
    });
  });

  // ----------------------------------------------------------
  // WriteError Tests
  // ----------------------------------------------------------
  describe('WriteError', () => {
    it('should extend CompilerError', () => {
      const err = new errors.WriteError('test.md', 'permission denied');
      expect(err).toBeInstanceOf(errors.CompilerError);
    });

    it('should set name to WriteError', () => {
      const err = new errors.WriteError('test.md', 'error');
      expect(err.name).toBe('WriteError');
    });

    it('should include file path and cause in message', () => {
      const err = new errors.WriteError('/output/file.md', 'EACCES: permission denied');
      expect(err.message).toContain('/output/file.md');
      expect(err.message).toContain('EACCES');
    });

    it('should store filePath and cause properties', () => {
      const err = new errors.WriteError('/output/file.md', 'disk full');
      expect(err.filePath).toBe('/output/file.md');
      expect(err.cause).toBe('disk full');
    });
  });

  // ----------------------------------------------------------
  // ContentTooLargeError Tests
  // ----------------------------------------------------------
  describe('ContentTooLargeError', () => {
    it('should extend CompilerError', () => {
      const err = new errors.ContentTooLargeError('test.md', 15000, 12000);
      expect(err).toBeInstanceOf(errors.CompilerError);
    });

    it('should set name to ContentTooLargeError', () => {
      const err = new errors.ContentTooLargeError('test.md', 15000, 12000);
      expect(err.name).toBe('ContentTooLargeError');
    });

    it('should include file path, actual and limit in message', () => {
      const err = new errors.ContentTooLargeError('/path/file.md', 15000, 12000);
      expect(err.message).toContain('/path/file.md');
      expect(err.message).toContain('15000');
      expect(err.message).toContain('12000');
    });

    it('should store filePath, actualSize and limit properties', () => {
      const err = new errors.ContentTooLargeError('/path/file.md', 15000, 12000);
      expect(err.filePath).toBe('/path/file.md');
      expect(err.actualSize).toBe(15000);
      expect(err.limit).toBe(12000);
    });
  });
});
