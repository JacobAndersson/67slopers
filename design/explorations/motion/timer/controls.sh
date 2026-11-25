#!/bin/bash
# Record the runner's controls: Repeaters 7:3 counting down, Pause during the first hang, Skip
# while paused (the set line changes under "Paused"), then Resume.
#
#   controls.sh [NAME=controls]
#
# Env: SERIAL (default 127.0.0.1:5555), OUT (default this folder). Expects capture.sh's setup: a
# release build installed and the seeded design dataset. The taps are fixed points on the
# 1080x2340 emulator screen: uiautomator cannot dump a screen that draws every frame (the field).
set -euo pipefail
SERIAL=${SERIAL:-127.0.0.1:5555}
OUT=${OUT:-$(cd "$(dirname "$0")" && pwd)}
name=${1:-controls}
A="$HOME/Android/Sdk/platform-tools/adb -s $SERIAL"
MAIN="540 2155"   # Start, Pause, Resume
SKIP="924 2155"

SERIAL=$SERIAL ~/Android/seed/push.sh full >/dev/null 2>&1; sleep 4
$A shell screenrecord --time-limit 30 "/sdcard/$name.mp4" & REC=$!
sleep 1
$A shell am start -a android.intent.action.VIEW -d 'slopers67://workout/seeded-repeaters-7-3/run?autostart=1' >/dev/null
sleep 12.5                                  # Get ready 10 s, then into the first hang
$A shell input tap $MAIN; sleep 2.5         # Pause
$A shell input tap $SKIP; sleep 2.5         # Skip while paused
$A shell input tap $MAIN                    # Resume
wait $REC || true; sleep 1
$A pull "/sdcard/$name.mp4" "$OUT/$name.mp4" >/dev/null 2>&1; $A shell rm "/sdcard/$name.mp4"
$A shell input keyevent 4
echo "$OUT/$name.mp4"
