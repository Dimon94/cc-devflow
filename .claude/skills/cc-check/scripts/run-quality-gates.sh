#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 执行验证命令，输出结构化结果
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage:
  run-quality-gates.sh --gate "test::npm test" [--gate "lint::npm run lint"]
  run-quality-gates.sh --cmd "npm test" [--cmd "npm run lint"]
EOF
}

cmds=()
gates=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gate) gates+=("$2"); shift 2 ;;
    --cmd) cmds+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ${#cmds[@]} -eq 0 && ${#gates[@]} -eq 0 ]]; then
  usage
  exit 1
fi

if [[ ${#gates[@]} -eq 0 ]]; then
  for cmd in "${cmds[@]}"; do
    gates+=("$cmd::$cmd")
  done
fi

printf '['
first=true
for gate in "${gates[@]}"; do
  name="${gate%%::*}"
  cmd="${gate#*::}"
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  start_ms="$(node -e 'console.log(Date.now())')"

  if eval "$cmd" >"$stdout_file" 2>"$stderr_file"; then
    status="pass"
    code=0
  else
    status="fail"
    code=$?
  fi
  end_ms="$(node -e 'console.log(Date.now())')"
  duration_ms=$((end_ms - start_ms))
  stdout_text="$(cat "$stdout_file" 2>/dev/null || true)"
  stderr_text="$(cat "$stderr_file" 2>/dev/null || true)"
  details="ok"
  if [[ "$stdout_text" == __CC_DEVFLOW_SKIP__* || "$stderr_text" == __CC_DEVFLOW_SKIP__* ]]; then
    status="skipped"
    code=0
    details="${stdout_text#__CC_DEVFLOW_SKIP__ }"
    if [[ "$details" == "$stdout_text" ]]; then
      details="${stderr_text#__CC_DEVFLOW_SKIP__ }"
    fi
  elif [[ "$status" != "pass" ]]; then
    details="$(cat "$stderr_file" 2>/dev/null || true)"
    if [[ -z "$details" ]]; then
      details="$(cat "$stdout_file" 2>/dev/null || true)"
    fi
    details="${details//$'\n'/ }"
  fi
  $first || printf ','
  first=false
  jq -nc \
    --arg name "$name" \
    --arg command "$cmd" \
    --arg status "$status" \
    --arg details "${details:0:400}" \
    --argjson durationMs "$duration_ms" \
    --argjson exitCode "$code" \
    '{name:$name,command:$command,status:$status,durationMs:$durationMs,details:$details,exitCode:$exitCode}'
  rm -f "$stdout_file" "$stderr_file"
done
printf ']\n'
