#!/usr/bin/env bash

set -euo pipefail

# ------------------------------------------------------------
# 执行验证命令，输出结构化结果
# ------------------------------------------------------------

usage() {
  cat <<'EOF'
Usage: run-quality-gates.sh --cmd "npm test" [--cmd "npm run lint"]
EOF
}

cmds=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cmd) cmds+=("$2"); shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ${#cmds[@]} -eq 0 ]]; then
  usage
  exit 1
fi

printf '['
first=true
for cmd in "${cmds[@]}"; do
  if eval "$cmd" >/tmp/cc-devflow-gate.out 2>/tmp/cc-devflow-gate.err; then
    status="pass"
    code=0
  else
    status="fail"
    code=$?
  fi
  $first || printf ','
  first=false
  jq -nc \
    --arg command "$cmd" \
    --arg status "$status" \
    --arg output "$(cat /tmp/cc-devflow-gate.out 2>/dev/null)" \
    --arg error "$(cat /tmp/cc-devflow-gate.err 2>/dev/null)" \
    --argjson exitCode "$code" \
    '{command:$command,status:$status,exitCode:$exitCode,stdout:$output,stderr:$error}'
done
printf ']\n'
