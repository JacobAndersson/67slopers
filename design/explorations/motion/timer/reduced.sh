#!/bin/bash
# Record the runner under reduced motion: seed, turn Remove animations on (the three animation
# scales at 0; push.sh sets them back to 1, so this comes after it), cold start so Reanimated
# reads the setting, then Repeaters 7:3 with Pause during the first hang and Resume. The scales
# go back to 1 at the end.
#
#   reduced.sh [NAME=reduced]
#
# Env: SERIAL (default 127.0.0.1:5555), OUT (default this folder). Taps as in controls.sh.
set -euo pipefail
SERIAL=${SERIAL:-127.0.0.1:5555}
OUT=${OUT:-$(cd "$(dirname "$0")" && pwd)}
name=${1:-reduced}
A="$HOME/Android/Sdk/platform-tools/adb -s $SERIAL"
P=com.sloppyslopers.app
scales() { for k in animator_duration_scale transition_animation_scale window_animation_scale; do $A shell settings put global $k "$1"; done; }

SERIAL=$SERIAL ~/Android/seed/push.sh full >/dev/null 2>&1; sleep 2
scales 0; $A shell am force-stop $P; $A shell am start -n $P/.MainActivity >/dev/null; sleep 6
$A shell screenrecord --time-limit 24 "/sdcard/$name.mp4" & REC=$!
sleep 1
$A shell am start -a android.intent.action.VIEW -d 'slopers67://workout/seeded-repeaters-7-3/run?autostart=1' >/dev/null
sleep 13.5
$A shell input tap 540 2155; sleep 2.5      # Pause
$A shell input tap 540 2155                 # Resume
wait $REC || true; sleep 1
$A pull "/sdcard/$name.mp4" "$OUT/$name.mp4" >/dev/null 2>&1; $A shell rm "/sdcard/$name.mp4"
$A shell input keyevent 4
scales 1
echo "$OUT/$name.mp4"
