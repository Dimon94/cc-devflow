# Version Decision Reference

## Semantic Versioning Rules

**Format**: `MAJOR.MINOR.PATCH` (e.g., 4.2.0)

### When to Bump Each Number

| Version | Increment When | Examples |
|---------|---------------|----------|
| **MAJOR** | Breaking changes that require user action | API redesign, removed features, incompatible changes |
| **MINOR** | New features, backward compatible | New commands, new options, enhanced functionality |
| **PATCH** | Bug fixes, minor improvements | Fix crashes, improve error messages, documentation |

### Decision Tree

```
Is this a breaking change?
├─ YES → MAJOR bump (X.0.0)
└─ NO → Is this a new feature?
    ├─ YES → MINOR bump (X.Y.0)
    └─ NO → PATCH bump (X.Y.Z)
```

## Common Scenarios

### Scenario 1: Bug Fix
**Current**: 4.2.0
**Change**: Fix login crash
**Decision**: PATCH → **4.2.1**

### Scenario 2: New Feature (Compatible)
**Current**: 4.2.1
**Change**: Add `/flow:export` command
**Decision**: MINOR → **4.3.0**

### Scenario 3: Breaking Change
**Current**: 4.3.0
**Change**: Remove deprecated `/flow-new` command
**Decision**: MAJOR → **5.0.0**

### Scenario 4: Multiple Changes
**Current**: 4.3.0
**Changes**:
- Fix 3 bugs (PATCH)
- Add 2 new features (MINOR)
- No breaking changes

**Decision**: Take highest level → MINOR → **4.4.0**

## Anti-Patterns (FORBIDDEN)

### ❌ Arbitrary Jumps
```
3.0.1 → 7.0.0  # WRONG: No justification for jumping 4 major versions
```

**Correct**:
```
3.0.1 → 4.0.0  # If breaking change
3.0.1 → 3.1.0  # If new feature
3.0.1 → 3.0.2  # If bug fix
```

### ❌ Skipping Versions
```
4.2.0 → 4.4.0  # WRONG: Skipped 4.3.0
```

**Correct**:
```
4.2.0 → 4.3.0 → 4.4.0  # Sequential
```

### ❌ Inconsistent Formats
```
v1.0          # WRONG: Missing patch
1.0.0         # WRONG: Missing 'v' prefix in git tag
release-1.0   # WRONG: Non-standard format
```

**Correct**:
```
Git tag:      v4.2.0
package.json: "version": "4.2.0"
CHANGELOG:    ## [4.2.0] - 2026-03-12
```

## Version Validation Checklist

Before bumping version, verify:

- [ ] Change type is clear (patch/minor/major)
- [ ] Version increment follows SemVer rules
- [ ] No arbitrary jumps (e.g., 3.x → 7.x)
- [ ] All version markers will be updated atomically
- [ ] CHANGELOG.md entry prepared
- [ ] Git tag format will be `vX.Y.Z`

## Breaking Change Examples

**Breaking changes require MAJOR bump**:

- Removing commands or options
- Changing command syntax
- Changing output format (breaking scripts)
- Removing configuration options
- Changing default behavior significantly
- Requiring new dependencies
- Dropping support for Node versions

**NOT breaking changes** (MINOR or PATCH):

- Adding new commands (MINOR)
- Adding new options with defaults (MINOR)
- Deprecation warnings (MINOR)
- Bug fixes (PATCH)
- Performance improvements (PATCH)
- Documentation updates (PATCH)

## Version History Analysis

Use this to understand past version decisions:

```bash
# View version history
git tag --sort=v:refname

# View changes between versions
git log v4.1.0..v4.2.0 --oneline

# Check CHANGELOG for version rationale
grep -A 10 "## \[4.2.0\]" CHANGELOG.md
```
