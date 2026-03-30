# npm-release Skill

Version management skill with semantic versioning enforcement.

## Structure

```
npm-release/
├── SKILL.md                           # Main workflow instructions
├── scripts/
│   ├── validate-version-sync.sh       # Check version consistency
│   ├── version-decision-tree.sh       # Calculate next version
│   └── atomic-version-bump.sh         # Atomic version update
└── references/
    └── version-decision-guide.md      # Detailed SemVer rules
```

## Purpose

Prevents version chaos by enforcing:
1. Semantic versioning rules (no arbitrary jumps)
2. Atomic synchronization (package.json + CHANGELOG.md + git tags)
3. Format consistency (vX.Y.Z everywhere)

## Key Scripts

### validate-version-sync.sh
Checks that package.json, git tags, and CHANGELOG.md all have matching versions.

### version-decision-tree.sh
Enforces SemVer rules:
- Breaking change → MAJOR (X.0.0)
- New feature → MINOR (X.Y.0)
- Bug fix → PATCH (X.Y.Z)

### atomic-version-bump.sh
Updates all version markers in one transaction, preventing inconsistencies.

## Usage

```bash
# Validate current state
bash scripts/validate-version-sync.sh

# Calculate next version
bash scripts/version-decision-tree.sh 4.2.0 minor
# Output: 4.3.0

# Atomic bump (recommended)
bash scripts/atomic-version-bump.sh minor "Add export command"
```

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
