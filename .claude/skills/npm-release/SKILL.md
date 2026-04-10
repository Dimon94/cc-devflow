---
name: npm-release
version: 1.0.0
description: Use when ready to publish a new version of cc-devflow npm package to npm registry, including version sync, changelog finalization, git tag creation, and publish verification.
---

# NPM Release Workflow

> [PROTOCOL]: 发布前先确认 git 干净、版本结论正确、CHANGELOG 已落地、npm 身份可用，然后再 commit/tag/push/publish

## Overview

Standardized release process for cc-devflow npm package ensuring consistent versioning, changelog maintenance, and safe publishing.

**Core Principle**: Atomic release - all version markers (package.json, CHANGELOG.md, git tag) must stay in sync.

`npm-release` 是内部维护 skill，不属于对外公开分发的五步 workflow。

## When to Use

Use this skill when:
- ✅ Ready to release a new version of cc-devflow
- ✅ All changes committed and pushed
- ✅ On main branch with clean working directory
- ✅ Need to publish to npm registry
- ✅ npm auth is available for the target registry

Don't use when:
- ❌ Working directory has uncommitted changes
- ❌ Not on main branch
- ❌ Pre-release/beta versions (needs adaptation)

## Release Types

Follow [Semantic Versioning](https://semver.org/):

| Type | Version Change | When |
|------|---------------|------|
| **Patch** | 2.4.3 → 2.4.4 | Bug fixes, minor improvements |
| **Minor** | 2.4.4 → 2.5.0 | New features, backward compatible |
| **Major** | 2.5.0 → 3.0.0 | Breaking changes |

## Complete Workflow

### Phase 1: Pre-Release Checks

```bash
# 1. Verify git status
git status
# MUST show: "On branch main", "working tree clean"

# 2. Check current version
cat package.json | grep version
# e.g., "version": "2.4.3"

# 3. Review recent changes
git log --oneline -10
```

**STOP if**:
- Not on main branch
- Uncommitted changes exist
- Unpushed commits exist
- `npm whoami` fails for the publish registry

### Phase 2: Version Updates

**Step 1: Update CHANGELOG.md**

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

**Step 2: Update package.json**

```bash
# Manually edit or use npm version
npm version patch --no-git-tag-version  # For patch release
npm version minor --no-git-tag-version  # For minor release
npm version major --no-git-tag-version  # For major release
```

Or edit directly:
```json
{
  "version": "X.Y.Z"
}
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

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
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
| Check status | `git status` | Verify clean state |
| Check version | `grep version package.json` | Current version |
| Bump version | Edit package.json | Update version number |
| Update changelog | Edit CHANGELOG.md | Document changes |
| Create commit | `git commit -m "chore(release): ..."` | Commit version bump |
| Create tag | `git tag -a vX.Y.Z -m "..."` | Tag release |
| Push commits | `git push origin main` | Push to GitHub |
| Push tags | `git push origin vX.Y.Z` | Push tag to GitHub |
| Publish npm | `npm publish` | Publish to registry |

## Bundled Resources

- `PLAYBOOK.md`
- `CHANGELOG.md`

## Exit Criteria

- `package.json`, `package-lock.json`, `CHANGELOG.md`, git tag version all match
- Release commit exists and points to the final changelog
- Annotated tag exists for the exact release commit
- GitHub push is complete
- npm publish either succeeded or failed with a captured reason

## Common Mistakes

### ❌ Mistake 1: Forgetting to Update CHANGELOG.md

**Problem**: Version bumped but no changelog entry

**Fix**: Always update CHANGELOG.md BEFORE committing

### ❌ Mistake 2: Inconsistent Version Numbers

**Problem**: package.json shows 2.4.4 but CHANGELOG.md shows 2.4.3

**Fix**: Double-check all version numbers match before committing

### ❌ Mistake 3: Pushing Tag Before Commit

**Problem**: Tag points to wrong commit

**Fix**: Always commit first, then tag, then push both together

### ❌ Mistake 4: Not Testing npm publish

**Problem**: Published package is broken

**Fix**: Run `npm publish --dry-run` first to catch issues

### ❌ Mistake 5: Network Timeout During Push

**Problem**: `Failed to connect to github.com port 443`

**Fix**:
```bash
# Option 1: Retry after network stabilizes
git push origin main
git push origin vX.Y.Z

# Option 2: Switch to SSH (if HTTPS blocked)
git remote set-url origin git@github.com:Dimon94/cc-devflow.git
git push origin main
```

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

**[PROTOCOL]**: 变更时更新此头部，然后检查 CLAUDE.md
