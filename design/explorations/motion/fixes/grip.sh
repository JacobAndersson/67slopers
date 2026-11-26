#!/bin/bash
# Record a workout whose grip changes between sets: Get ready, two sets of two reps on medium
# edges, then two on large edges. The board shows for Get ready and the first hang, hides on the
# repeats, and returns for the rest before the large edges and their first hang. Paused there
# and resumed, to show a paused run follows the interval it stopped in.
#
#   grip.sh [NAME=grip]
#
# Env: SERIAL (default 127.0.0.1:5555), OUT (default this folder). Expects capture.sh's setup.
# The workout comes in by import code (made with encodeWorkout), so the seeded dataset is untouched:
#   prep 10, 2 x [2 x (hang 5 medium edges, rest 3), rest 10], 2 x [the same on large edges]
set -euo pipefail
SERIAL=${SERIAL:-127.0.0.1:5555}
OUT=${OUT:-$(cd "$(dirname "$0")" && pwd)}
name=${1:-grip}
A="$HOME/Android/Sdk/platform-tools/adb -s $SERIAL"
CODE=535197802784214815005242734
MAIN="540 2155"   # Start, Pause, Resume

center() {
  $A shell uiautomator dump /sdcard/ui.xml >/dev/null
  $A shell cat /sdcard/ui.xml | tr '>' '\n' | grep -E "(content-desc|text)=\"$1\"" | head -1 |
    sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/' |
    awk '{ printf "%d %d", ($1+$3)/2, ($2+$4)/2 }'
}

SERIAL=$SERIAL ~/Android/seed/push.sh full >/dev/null 2>&1; sleep 4
$A shell am start -a android.intent.action.VIEW -d "slopers67://import?code=$CODE" >/dev/null; sleep 3
start=$(center Start); [ -n "$start" ] || { echo "no Start on the import screen" >&2; exit 1; }
$A shell input tap $start; sleep 3
$A shell screenrecord --time-limit 80 "/sdcard/$name.mp4" & REC=$!
sleep 1
$A shell input tap $MAIN                    # Start: Get ready 10 s
sleep 63.5                                  # 1.5 s into the first hang on large edges (62 to 67 s)
$A shell input tap $MAIN; sleep 3           # Pause
$A shell input tap $MAIN                    # Resume
wait $REC || true; sleep 1
$A pull "/sdcard/$name.mp4" "$OUT/$name.mp4" >/dev/null 2>&1; $A shell rm "/sdcard/$name.mp4"
$A shell input keyevent 4
echo "$OUT/$name.mp4"
