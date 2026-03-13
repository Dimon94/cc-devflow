#!/usr/bin/env bash
# Version Decision Tree - Semantic Versioning Enforcer
# Prevents arbitrary version jumps by enforcing SemVer rules

set -euo pipefail

CURRENT_VERSION="${1:-}"
CHANGE_TYPE="${2:-}"

if [[ -z "$CURRENT_VERSION" || -z "$CHANGE_TYPE" ]]; then
    echo "Usage: $0 <current-version> <patch|minor|major>"
    exit 1
fi

# Parse current version
if [[ ! "$CURRENT_VERSION" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]]; then
    echo "❌ Invalid version format: $CURRENT_VERSION"
    echo "   Expected: X.Y.Z (e.g., 4.2.0)"
    exit 1
fi

MAJOR="${BASH_REMATCH[1]}"
MINOR="${BASH_REMATCH[2]}"
PATCH="${BASH_REMATCH[3]}"

# Calculate next version based on change type
case "$CHANGE_TYPE" in
    patch)
        NEXT_VERSION="$MAJOR.$MINOR.$((PATCH + 1))"
        ;;
    minor)
        NEXT_VERSION="$MAJOR.$((MINOR + 1)).0"
        ;;
    major)
        NEXT_VERSION="$((MAJOR + 1)).0.0"
        ;;
    *)
        echo "❌ Invalid change type: $CHANGE_TYPE"
        echo "   Expected: patch, minor, or major"
        exit 1
        ;;
esac

echo "$NEXT_VERSION"
