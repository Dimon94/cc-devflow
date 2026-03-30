#!/usr/bin/env bash
# Atomic Version Bump - Updates all version markers in one transaction
# Ensures package.json, CHANGELOG.md stay in sync

set -euo pipefail

CHANGE_TYPE="${1:-}"
CHANGE_DESCRIPTION="${2:-}"

if [[ -z "$CHANGE_TYPE" ]]; then
    echo "Usage: $0 <patch|minor|major> [description]"
    echo ""
    echo "Examples:"
    echo "  $0 patch 'Fix login bug'"
    echo "  $0 minor 'Add user dashboard'"
    echo "  $0 major 'Redesign API'"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 1. Get current version
CURRENT_VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
echo "📦 Current version: $CURRENT_VERSION"

# 2. Calculate next version using decision tree
NEXT_VERSION=$("$SCRIPT_DIR/version-decision-tree.sh" "$CURRENT_VERSION" "$CHANGE_TYPE")
echo "🎯 Next version: $NEXT_VERSION"

# 3. Validate version sync before proceeding
echo ""
echo "🔍 Pre-flight validation..."
if ! "$SCRIPT_DIR/validate-version-sync.sh"; then
    echo ""
    echo "❌ Version sync validation failed. Fix inconsistencies before bumping."
    exit 1
fi

# 4. Update package.json
echo ""
echo "📝 Updating package.json..."
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEXT_VERSION\"/" package.json
rm package.json.bak

# 5. Prepare CHANGELOG.md entry
CURRENT_DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEXT_VERSION] - $CURRENT_DATE

### 🎯 ${CHANGE_DESCRIPTION:-Version $NEXT_VERSION}

#### Changed
- TODO: Add change details

---

"

# Insert after the first "---" line in CHANGELOG.md
if [[ -f "CHANGELOG.md" ]]; then
    echo "📝 Updating CHANGELOG.md..."
    # Create temp file with new entry
    awk -v entry="$CHANGELOG_ENTRY" '
        /^---$/ && !inserted {
            print
            print entry
            inserted=1
            next
        }
        {print}
    ' CHANGELOG.md > CHANGELOG.md.tmp
    mv CHANGELOG.md.tmp CHANGELOG.md
else
    echo "⚠️  CHANGELOG.md not found, skipping"
fi

# 6. Validate post-update
echo ""
echo "🔍 Post-update validation..."
UPDATED_VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')

if [[ "$UPDATED_VERSION" != "$NEXT_VERSION" ]]; then
    echo "❌ Version update failed: expected $NEXT_VERSION, got $UPDATED_VERSION"
    exit 1
fi

echo ""
echo "✅ Version bumped successfully: $CURRENT_VERSION → $NEXT_VERSION"
echo ""
echo "📋 Next steps:"
echo "   1. Edit CHANGELOG.md to add detailed changes"
echo "   2. Review changes: git diff"
echo "   3. Commit: git add package.json CHANGELOG.md && git commit -m 'chore(release): bump version to $NEXT_VERSION'"
echo "   4. Tag: git tag -a v$NEXT_VERSION -m 'Release v$NEXT_VERSION'"
echo "   5. Push: git push origin main && git push origin v$NEXT_VERSION"
