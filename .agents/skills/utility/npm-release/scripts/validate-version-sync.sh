#!/usr/bin/env bash
# Version Sync Validator - Ensures all version markers are consistent
# Checks: package.json, git tags, CHANGELOG.md

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

echo "🔍 Validating version synchronization..."
echo ""

# 1. Extract version from package.json
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ package.json not found${NC}"
    exit 1
fi

PKG_VERSION=$(grep -o '"version": *"[^"]*"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
echo "📦 package.json version: $PKG_VERSION"

# 2. Check latest git tag
LATEST_TAG=$(git tag --sort=-v:refname | head -1 || echo "")
if [[ -z "$LATEST_TAG" ]]; then
    echo -e "${YELLOW}⚠️  No git tags found${NC}"
else
    TAG_VERSION="${LATEST_TAG#v}"  # Remove 'v' prefix
    echo "🏷️  Latest git tag: $LATEST_TAG ($TAG_VERSION)"

    if [[ "$PKG_VERSION" != "$TAG_VERSION" ]]; then
        echo -e "${RED}❌ Version mismatch: package.json ($PKG_VERSION) != git tag ($TAG_VERSION)${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ package.json and git tag match${NC}"
    fi
fi

# 3. Check CHANGELOG.md
if [[ ! -f "CHANGELOG.md" ]]; then
    echo -e "${YELLOW}⚠️  CHANGELOG.md not found${NC}"
else
    # Extract first version from CHANGELOG (after the header)
    # macOS grep doesn't support -P, use sed instead
    CHANGELOG_VERSION=$(sed -n 's/^## \[\([0-9]\+\.[0-9]\+\.[0-9]\+\)\].*/\1/p' CHANGELOG.md | head -1)

    if [[ -z "$CHANGELOG_VERSION" ]]; then
        echo -e "${YELLOW}⚠️  No version found in CHANGELOG.md${NC}"
    else
        echo "📝 CHANGELOG.md latest: $CHANGELOG_VERSION"

        if [[ "$PKG_VERSION" != "$CHANGELOG_VERSION" ]]; then
            echo -e "${RED}❌ Version mismatch: package.json ($PKG_VERSION) != CHANGELOG.md ($CHANGELOG_VERSION)${NC}"
            ((ERRORS++))
        else
            echo -e "${GREEN}✅ package.json and CHANGELOG.md match${NC}"
        fi
    fi
fi

# 4. Check for version format consistency in git tags
echo ""
echo "🔍 Checking git tag format consistency..."
INCONSISTENT_TAGS=$(git tag | grep -v '^v[0-9]\+\.[0-9]\+\.[0-9]\+$' || true)
if [[ -n "$INCONSISTENT_TAGS" ]]; then
    echo -e "${YELLOW}⚠️  Found tags with inconsistent format:${NC}"
    echo "$INCONSISTENT_TAGS" | sed 's/^/   /'
    echo -e "${YELLOW}   Expected format: vX.Y.Z (e.g., v4.2.0)${NC}"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ All version markers are synchronized${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $ERRORS version synchronization error(s)${NC}"
    exit 1
fi
