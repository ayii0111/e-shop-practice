#!/bin/bash
set -euo pipefail

# 功能：限制檔案操作路徑（restrict paths）
#
# 解決的問題：
#   希望某個 agent（xxx）在讀寫檔案時，
#   不會誤動到專案裡不該碰的其他目錄。
#
# 解決方式：
#   在 PreToolUse（Read/Write/Edit 前）攔截每次操作，
#   檢查目標檔案路徑是否落在允許的路徑前綴（ALLOWED_PREFIX）之下，
#   在範圍內就放行，超出範圍就直接 deny 並回覆提示訊息。

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
