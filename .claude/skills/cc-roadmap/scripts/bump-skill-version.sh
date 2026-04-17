#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# roadmap skill semver helper
# - bump SKILL.md frontmatter version
# - prepend CHANGELOG.md entry
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  bump-skill-version.sh --type patch|minor|major --message "change summary" \
    [--skill-file SKILL.md] [--changelog CHANGELOG.md] [--date YYYY-MM-DD]
EOF
}

TYPE=""
MESSAGE=""
SKILL_FILE="SKILL.md"
CHANGELOG_FILE="CHANGELOG.md"
DATE="$(date +%Y-%m-%d)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) TYPE="$2"; shift 2 ;;
    --message) MESSAGE="$2"; shift 2 ;;
    --skill-file) SKILL_FILE="$2"; shift 2 ;;
    --changelog) CHANGELOG_FILE="$2"; shift 2 ;;
    --date) DATE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$TYPE" || -z "$MESSAGE" ]]; then
  usage
  exit 1
fi

if [[ ! -f "$SKILL_FILE" ]]; then
  echo "Skill file not found: $SKILL_FILE" >&2
  exit 1
fi

CURRENT_VERSION="$(awk '/^version: / { print $2; exit }' "$SKILL_FILE")"

if [[ -z "$CURRENT_VERSION" ]]; then
  echo "No version field found in $SKILL_FILE" >&2
  exit 1
fi

IFS='.' read -r MAJOR MINOR PATCH <<<"$CURRENT_VERSION"

case "$TYPE" in
  patch)
    PATCH=$((PATCH + 1))
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  *)
    echo "Unsupported bump type: $TYPE" >&2
    exit 1
    ;;
esac

NEXT_VERSION="${MAJOR}.${MINOR}.${PATCH}"

TMP_SKILL="$(mktemp)"
awk -v next_version="$NEXT_VERSION" '
  BEGIN { done = 0 }
  {
    if (!done && $0 ~ /^version: /) {
      print "version: " next_version
      done = 1
      next
    }
    print
  }
' "$SKILL_FILE" > "$TMP_SKILL"
mv "$TMP_SKILL" "$SKILL_FILE"

if [[ ! -f "$CHANGELOG_FILE" ]]; then
  printf '# Roadmap Skill Changelog\n\n' > "$CHANGELOG_FILE"
fi

TMP_CHANGELOG="$(mktemp)"
{
  sed -n '1p' "$CHANGELOG_FILE"
  printf '\n## v%s - %s\n\n- %s\n' "$NEXT_VERSION" "$DATE" "$MESSAGE"
  sed -n '2,$p' "$CHANGELOG_FILE"
} > "$TMP_CHANGELOG"
mv "$TMP_CHANGELOG" "$CHANGELOG_FILE"

echo "Bumped roadmap skill: ${CURRENT_VERSION} -> ${NEXT_VERSION}"
