#!/bin/bash
set -euo pipefail

# 功能：連續失敗煞車器（failure guard）
#
# 解決的問題：
#   agent 遇到錯誤時，容易在沒有真正查清楚根因的情況下，
#   一次又一次換不同做法硬試，過程零散又浪費時間，
#   也不會主動停下來跟使用者回報「我卡住了」。
#
# 解決方式：
#   用 PostToolUse 記錄每次 Bash 指令是成功還是失敗，
#   連續失敗次數存在 state.json 這個小本子裡；
#   用 PreToolUse 在每次要執行 Bash 前檢查小本子：
#     - 累積到 DIAGNOSE_THRESHOLD 次 → 擋下一次，
#       要求先啟動獨立的診斷 agent 找根因，而不是繼續瞎試
#     - 累積到 HALT_THRESHOLD 次 → 完全擋下，
#       強制停止並要求回報現況給使用者決定
#   只要有一次成功，小本子歸零重新計算。
#
# ── 你要調的兩個數字，改這裡就好 ──────────────────────
DIAGNOSE_THRESHOLD=3
HALT_THRESHOLD=5
# ─────────────────────────────────────────────────

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_FILE="$HOOK_DIR/state.json"

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')

if [ "$EVENT" = "PostToolUse" ]; then
  EXIT_CODE=$(echo "$INPUT" | jq -r '.tool_response.exit_code // .tool_response.exitCode // 0')

  COUNT=$(jq -r '.count' "$STATE_FILE")

  if [ "$EXIT_CODE" != "0" ]; then
    COUNT=$((COUNT + 1))
    jq --argjson c "$COUNT" '.count = $c' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  else
    jq '.count = 0 | .diagnosed = false' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
  exit 0
fi

if [ "$EVENT" = "PreToolUse" ]; then
  COUNT=$(jq -r '.count' "$STATE_FILE")
  DIAGNOSED=$(jq -r '.diagnosed' "$STATE_FILE")

  if [ "$COUNT" -ge "$HALT_THRESHOLD" ]; then
    jq -n --arg r "已連續失敗 $COUNT 次（達 halt_threshold=$HALT_THRESHOLD），必須立刻停止嘗試，完整回報目前狀況給使用者，交由使用者決定下一步。不要再自己重試。" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi

  if [ "$COUNT" -ge "$DIAGNOSE_THRESHOLD" ] && [ "$DIAGNOSED" = "false" ]; then
    jq '.diagnosed = true' "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    jq -n --arg r "已連續失敗 $COUNT 次（達 diagnose_threshold=$DIAGNOSE_THRESHOLD）。先不要繼續嘗試原本的做法。改用 Agent 工具啟動一個獨立的診斷 subagent，只負責找出這個錯誤的根本原因並回報建議修法，不要碰原本的最終任務。拿到診斷結果後才可以繼續。" \
      '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$r}}'
    exit 0
  fi

  exit 0
fi

exit 0
