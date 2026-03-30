---
name: npm-release
description: Use when ready to publish a new version of cc-devflow npm package to npm registry. Enforces semantic versioning rules, prevents arbitrary version jumps (e.g., 3.0.1→7.0.0), and ensures atomic synchronization across package.json, CHANGELOG.md, and git tags.
---

# NPM Release Workflow

## Overview

Standardized release process for cc-devflow npm package ensuring consistent versioning, changelog maintenance, and safe publishing.

**Core Principles**:
1. **Atomic release** - All version markers (package.json, CHANGELOG.md, git tag) stay in sync
2. **Semantic versioning enforcement** - Prevents arbitrary jumps and format inconsistencies
3. **Decision tree validation** - Every version bump follows explicit SemVer rules

## When to Use

Use this skill when:
- ✅ Ready to release a new version of cc-devflow
- ✅ All changes committed and pushed
- ✅ On main branch with clean working directory
- ✅ Need to publish to npm registry

Don't use when:
- ❌ Working directory has uncommitted changes
- ❌ Not on main branch
- ❌ Pre-release/beta versions (needs adaptation)

## Version Decision Protocol

**MANDATORY**: Before any version bump, determine change type using the decision tree.

See [references/version-decision-guide.md](references/version-decision-guide.md) for detailed rules and examples.

### Quick Decision Tree

```
Is this a breaking change?
├─ YES → MAJOR bump (X.0.0)
└─ NO → Is this a new feature?
    ├─ YES → MINOR bump (X.Y.0)
    └─ NO → PATCH bump (X.Y.Z)
```

### Release Types

Follow [Semantic Versioning](https://semver.org/):

| Type | Version Change | When |
|------|---------------|------|
| **Patch** | 4.2.0 → 4.2.1 | Bug fixes, minor improvements |
| **Minor** | 4.2.1 → 4.3.0 | New features, backward compatible |
| **Major** | 4.3.0 → 5.0.0 | Breaking changes |

### Anti-Patterns (FORBIDDEN)

❌ **Arbitrary jumps**: 3.0.1 → 7.0.0 (no justification)
❌ **Skipping versions**: 4.2.0 → 4.4.0 (skipped 4.3.0)
❌ **Inconsistent formats**: v1.0, 1.0.0, release-1.0 (mixed formats)

## Complete Workflow

### Phase 0: Version Validation (MANDATORY)

**Before any changes**, validate current state and determine next version:

```bash
# 1. Validate version synchronization
bash .Codex/skills/utility/npm-release/scripts/validate-version-sync.sh

# 2. Determine change type (patch/minor/major)
# Use decision tree in references/version-decision-guide.md

# 3. Calculate next version
bash .Codex/skills/utility/npm-release/scripts/version-decision-tree.sh $(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+') <patch|minor|major>
```

**STOP if validation fails** - Fix inconsistencies before proceeding.

### Phase 1: Pre-Release Checks

```bash
# 1. Verify git status
git status
# MUST show: "On branch main", "working tree clean"

# 2. Check current version
cat package.json | grep version
# e.g., "version": "4.2.0"

# 3. Review recent changes
git log --oneline -10
```

**STOP if**:
- Not on main branch
- Uncommitted changes exist
- Unpushed commits exist

### Phase 2: Atomic Version Bump

**Use the atomic bump script** (recommended):

```bash
# Automatically updates package.json + CHANGELOG.md
bash .Codex/skills/utility/npm-release/scripts/atomic-version-bump.sh <patch|minor|major> "Brief description"

# Example:
bash .Codex/skills/utility/npm-release/scripts/atomic-version-bump.sh minor "Add export command"
```

**Or manual update** (if script unavailable):

**Step 1: Update package.json**

```bash
npm version patch --no-git-tag-version  # For patch release
npm version minor --no-git-tag-version  # For minor release
npm version major --no-git-tag-version  # For major release
```

**Step 2: Update CHANGELOG.md**

Add new version section at the top (after `---`):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### 🎯 Release Title

Brief description of main changes.

#### Changed / Added / Fixed
- Bullet point 1
- Bullet point 2

#### Benefits
- ✅ Benefit 1
- ✅ Benefit 2
```

### Phase 3: Git Operations

**Step 1: Create Release Commit**

```bash
git add CHANGELOG.md package.json

git commit -m "$(cat <<'EOF'
chore(release): bump version to X.Y.Z

Release X.Y.Z - [Brief title]

主要变更：
- 变更点 1
- 变更点 2

Co-Authored-By: Codex Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

**Step 2: Create Annotated Tag**

```bash
git tag -a vX.Y.Z -m "$(cat <<'EOF'
Release vX.Y.Z - [Brief title]

🎯 Main changes:
- Change 1
- Change 2

Benefits:
✅ Benefit 1
✅ Benefit 2

Full changelog: https://github.com/Dimon94/cc-devflow/blob/main/CHANGELOG.md
EOF
)"
```

**Step 3: Verify**

```bash
# Check commit
git log --oneline -1

# Check tag
git tag -l "v2.4.*" | tail -3

# Verify tag annotation
git show vX.Y.Z
```

### Phase 4: Publish

**Step 1: Push to GitHub**

```bash
# Push commits
git push origin main

# Push tags
git push origin vX.Y.Z
# Or push all tags: git push origin --tags
```

**Step 2: Create GitHub Release (Optional)**

Via GitHub CLI:
```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z - [Title]" \
  --notes-file <(sed -n '/## \[X.Y.Z\]/,/## \[/p' CHANGELOG.md | head -n -1)
```

Or manually at: https://github.com/Dimon94/cc-devflow/releases/new

**Step 3: Publish to npm**

```bash
# Test publish first (dry-run)
npm publish --dry-run

# Actual publish
npm publish

# Verify publication
npm view cc-devflow version
```

## Quick Reference

| Step | Command | Purpose |
|------|---------|---------|
| **Validate sync** | `bash scripts/validate-version-sync.sh` | Check version consistency |
| **Decide version** | `bash scripts/version-decision-tree.sh <current> <type>` | Calculate next version |
| **Atomic bump** | `bash scripts/atomic-version-bump.sh <type> "desc"` | Update all markers |
| Check status | `git status` | Verify clean state |
| Check version | `grep version package.json` | Current version |
| Create commit | `git commit -m "chore(release): ..."` | Commit version bump |
| Create tag | `git tag -a vX.Y.Z -m "..."` | Tag release |
| Push commits | `git push origin main` | Push to GitHub |
| Push tags | `git push origin vX.Y.Z` | Push tag to GitHub |
| Publish npm | `npm publish` | Publish to registry |

## Version Management Scripts

Three scripts enforce version discipline:

1. **validate-version-sync.sh** - Checks package.json, git tags, CHANGELOG.md consistency
2. **version-decision-tree.sh** - Calculates next version following SemVer rules
3. **atomic-version-bump.sh** - Updates all version markers atomically

**Usage**:
```bash
# Check current state
bash .Codex/skills/utility/npm-release/scripts/validate-version-sync.sh

# Calculate next version
bash .Codex/skills/utility/npm-release/scripts/version-decision-tree.sh 4.2.0 minor
# Output: 4.3.0

# Atomic bump (recommended)
bash .Codex/skills/utility/npm-release/scripts/atomic-version-bump.sh minor "Add export command"
```

## Common Mistakes

### ❌ Mistake 1: Arbitrary Version Jumps

**Problem**: Version jumps from 3.0.1 to 7.0.0 without justification

**Fix**: Use version-decision-tree.sh to calculate correct next version based on change type

### ❌ Mistake 2: Inconsistent Version Numbers

**Problem**: package.json shows 4.2.1 but CHANGELOG.md shows 4.2.0

**Fix**: Use atomic-version-bump.sh to update all markers simultaneously

### ❌ Mistake 3: Forgetting to Update CHANGELOG.md

**Problem**: Version bumped but no changelog entry

**Fix**: Always update CHANGELOG.md BEFORE committing (atomic-version-bump.sh does this automatically)

### ❌ Mistake 4: Pushing Tag Before Commit

**Problem**: Tag points to wrong commit

**Fix**: Always commit first, then tag, then push both together

### ❌ Mistake 5: Not Testing npm publish

**Problem**: Published package is broken

**Fix**: Run `npm publish --dry-run` first to catch issues

### ❌ Mistake 6: Inconsistent Tag Format

**Problem**: Mixed formats like v1.0, 1.0.0, release-1.0

**Fix**: Always use vX.Y.Z format (e.g., v4.2.0). validate-version-sync.sh detects format inconsistencies

## Network Troubleshooting

If `git push` fails with timeout:

1. **Check network connectivity**:
   ```bash
   curl -I https://github.com 2>&1 | head -5
   ```

2. **Try SSH instead of HTTPS**:
   ```bash
   git remote -v  # Check current remote URL
   git remote set-url origin git@github.com:Dimon94/cc-devflow.git
   ```

3. **If SSH fails (publickey error)**:
   - Check SSH key: `ssh -T git@github.com`
   - Add SSH key to GitHub: https://github.com/settings/keys
   - Or stay with HTTPS and retry later

4. **Commits and tags are safe locally**:
   - They won't be lost
   - Push when network is available

## Post-Release Verification

After successful release:

```bash
# 1. Verify GitHub tag
open https://github.com/Dimon94/cc-devflow/tags

# 2. Verify npm package
npm view cc-devflow version
npm view cc-devflow time

# 3. Test installation
npm install -g cc-devflow@latest
cc-devflow --version  # Should show new version
```

## Rollback (If Needed)

If published version has critical bugs:

```bash
# 1. Unpublish from npm (within 72 hours)
npm unpublish cc-devflow@X.Y.Z

# 2. Delete git tag locally and remotely
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z

# 3. Revert commit
git revert HEAD

# 4. Fix bug and re-release with new patch version
```

**Note**: npm unpublish is only available within 72 hours of publication. After that, publish a new patch version instead.

## Real-World Impact

Following this workflow ensures:
- ✅ **Consistency**: All version markers stay in sync
- ✅ **Traceability**: Clear changelog and git history
- ✅ **Safety**: Dry-run catches issues before publishing
- ✅ **Recoverability**: Can rollback if needed
- ✅ **Automation-ready**: Scriptable workflow for future CI/CD

---

**[PROTOCOL]**: 变更时更新此头部，然后检查 AGENTS.md
