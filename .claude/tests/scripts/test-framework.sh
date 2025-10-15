#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
TEST_ARTIFACT_ROOT="$REPO_ROOT/.tmp/script-tests"

mkdir -p "$TEST_ARTIFACT_ROOT"

TEST_TOTAL=0
TEST_FAILED=0
declare -a TEST_CLEANUP_PATHS=()

register_cleanup() {
    local path="$1"
    TEST_CLEANUP_PATHS+=("$path")
}

cleanup_all() {
    local path
    for path in "${TEST_CLEANUP_PATHS[@]}"; do
        if [[ -e "$path" || -L "$path" ]]; then
            rm -rf "$path"
        fi
    done
}

trap cleanup_all EXIT

# ===== 终端色彩工具 =====
_color_green() { printf "\033[32m%s\033[0m" "$1"; }
_color_red() { printf "\033[31m%s\033[0m" "$1"; }

# ===== 断言工具族 =====
assert_equals() {
    local expected="$1"
    local actual="$2"
    local message="${3:-Values differ}"
    if [[ "$expected" != "$actual" ]]; then
        echo "  $( _color_red "ASSERT FAIL" ): $message"
        echo "    expected: $expected"
        echo "    actual:   $actual"
        return 1
    fi
    return 0
}

assert_contains() {
    local needle="$1"
    local haystack="$2"
    local message="${3:-Substring not found}"
    if [[ "$haystack" != *"$needle"* ]]; then
        echo "  $( _color_red "ASSERT FAIL" ): $message"
        echo "    missing substring: $needle"
        return 1
    fi
    return 0
}

assert_file_exists() {
    local path="$1"
    local message="${2:-File not found}"
    if [[ ! -e "$path" ]]; then
        echo "  $( _color_red "ASSERT FAIL" ): $message"
        echo "    missing path: $path"
        return 1
    fi
    return 0
}

assert_json_valid() {
    local path="$1"
    local message="${2:-Invalid JSON}"
    if ! python3 - "$path" <<'PY' >/dev/null 2>&1
import json
import pathlib
import sys
text = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
json.loads(text)
PY
    then
        echo "  $( _color_red "ASSERT FAIL" ): $message"
        echo "    file: $path"
        return 1
    fi
    return 0
}

assert_grep_match() {
    local pattern="$1"
    local file="$2"
    local message="${3:-Pattern not found}"
    if ! LC_ALL=C grep -Eq "$pattern" "$file"; then
        echo "  $( _color_red "ASSERT FAIL" ): $message"
        echo "    pattern: $pattern"
        echo "    file: $file"
        return 1
    fi
    return 0
}

# ===== 核心运行流程 =====
run_test() {
    local name="$1"
    shift
    local fn="$1"
    shift || true

    TEST_TOTAL=$((TEST_TOTAL + 1))
    printf "→ %s ... " "$name"
    if "$fn" "$@"; then
        printf "%s\n" "$(_color_green OK)"
    else
        printf "%s\n" "$(_color_red FAIL)"
        TEST_FAILED=$((TEST_FAILED + 1))
    fi
}

finish_tests() {
    if [[ "$TEST_FAILED" -eq 0 ]]; then
        printf "\n%s (%d tests)\n" "$(_color_green "All tests passed")" "$TEST_TOTAL"
        exit 0
    else
        printf "\n%s (%d/%d failed)\n" "$(_color_red "Tests failed")" "$TEST_FAILED" "$TEST_TOTAL"
        exit 1
    fi
}
