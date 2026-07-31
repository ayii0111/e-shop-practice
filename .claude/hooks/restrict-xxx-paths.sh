#!/bin/bash
set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# 沒有 file_path 的工具呼叫（例如非檔案類工具）直接放行
if [[ -z "$file_path" ]]; then
  echo '{"continue": true}'
  exit 0
fi

# 只允許這個路徑前綴，改成你要限制的路徑
ALLOWED_PREFIX="$CLAUDE_PROJECT_DIR/src/services"

case "$file_path" in
  "$ALLOWED_PREFIX"*)
    echo '{"continue": true}'
    ;;
  *)
    echo "{\"hookSpecificOutput\": {\"permissionDecision\": \"deny\"}, \"systemMessage\": \"agent xxx 只能操作 $ALLOWED_PREFIX 底下的檔案\"}"
    ;;
esac
