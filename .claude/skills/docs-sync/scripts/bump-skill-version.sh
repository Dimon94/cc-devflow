#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 通用 skill semver helper
# - bump <skill>/SKILL.md frontmatter version
# - prepend <skill>/CHANGELOG.md entry
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  bump-skill-version.sh --skill-dir .claude/skills/<skill> \
    --type patch|minor|major \
    --message "change summary" \
    [--date YYYY-MM-DD]
EOF
}

SKILL_DIR=""
TYPE=""
MESSAGE=""
DATE="$(date +%Y-%m-%d)"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skill-dir) SKILL_DIR="$2"; shift 2 ;;
    --type) TYPE="$2"; shift 2 ;;
    --message) MESSAGE="$2"; shift 2 ;;
    --date) DATE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$SKILL_DIR" || -z "$TYPE" || -z "$MESSAGE" ]]; then
  usage
  exit 1
fi

SKILL_FILE="${SKILL_DIR%/}/SKILL.md"
CHANGELOG_FILE="${SKILL_DIR%/}/CHANGELOG.md"

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

tmp_skill="$(mktemp)"
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
' "$SKILL_FILE" > "$tmp_skill"
mv "$tmp_skill" "$SKILL_FILE"

if [[ ! -f "$CHANGELOG_FILE" ]]; then
  skill_name="$(basename "$SKILL_DIR")"
  printf '# %s Skill Changelog\n\n' "$skill_name" > "$CHANGELOG_FILE"
fi

tmp_changelog="$(mktemp)"
{
  sed -n '1p' "$CHANGELOG_FILE"
  printf '\n## v%s - %s\n\n- %s\n' "$NEXT_VERSION" "$DATE" "$MESSAGE"
  sed -n '2,$p' "$CHANGELOG_FILE"
} > "$tmp_changelog"
mv "$tmp_changelog" "$CHANGELOG_FILE"

echo "Bumped ${SKILL_DIR}: ${CURRENT_VERSION} -> ${NEXT_VERSION}"
