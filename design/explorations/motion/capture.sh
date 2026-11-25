#!/bin/bash
# Motion baseline harness: cold start time and named screen recordings on the Android emulator.
#
#   capture.sh coldstart [RUNS]      cold start RUNS times (default 5): `am start -W` TotalTime and the median
#   capture.sh launch [RUNS]         cold start RUNS times on video: launch -> splash, first React frame, Home
#                                    settled (launch-time.py; light appearance), each run and the medians
#   capture.sh runner [NAME]         record the runner across prep -> hang -> rest -> hang (Repeaters 7:3)
#   capture.sh tabs [NAME]           record arriving on Home, then Log, from Hang through the dock
#   capture.sh clip NAME SECS [ROUTE] record SECS seconds, opening ROUTE (deep link) after the first second
#
# Env: SERIAL (default 127.0.0.1:5555), OUT (default baseline/ next to this script).
# Expects the seeded design dataset (SERIAL=... ~/Android/seed/push.sh full) and a release build
# installed, so no Metro or dev menu is in the numbers.
set -euo pipefail
SERIAL=${SERIAL:-127.0.0.1:5555}
OUT=${OUT:-$(cd "$(dirname "$0")" && pwd)/baseline}
P=com.sloppyslopers.app
A="$HOME/Android/Sdk/platform-tools/adb -s $SERIAL"
mkdir -p "$OUT"

go() { $A shell am start -a android.intent.action.VIEW -d "slopers67://$1" >/dev/null; }

# Centre of the first node whose content-desc or text is exactly $1.
center() {
  $A shell uiautomator dump /sdcard/ui.xml >/dev/null
  $A shell cat /sdcard/ui.xml | tr '>' '\n' |
    grep -E "(content-desc|text)=\"$1\"" | head -1 |
    sed -E 's/.*bounds="\[([0-9]+),([0-9]+)\]\[([0-9]+),([0-9]+)\]".*/\1 \2 \3 \4/' |
    awk '{ printf "%d %d", ($1+$3)/2, ($2+$4)/2 }'
}

where() {
  local xy; xy=$(center "$1")
  [ -n "$xy" ] || { echo "no element '$1' on screen" >&2; exit 1; }
  echo "$xy"
}

# record NAME SECS: start screenrecord in the background; `finish NAME` waits and pulls it.
record() { $A shell screenrecord --time-limit "$2" "/sdcard/$1.mp4" & REC=$!; sleep 1; }
finish() { wait $REC || true; sleep 1; $A pull "/sdcard/$1.mp4" "$OUT/$1.mp4" >/dev/null 2>&1; $A shell rm "/sdcard/$1.mp4"; echo "$OUT/$1.mp4"; }

# Every clip starts from the seeded design dataset (no unfinished run left by an earlier clip).
fresh() { SERIAL=$SERIAL ~/Android/seed/push.sh full >/dev/null 2>&1; sleep 4; }

case "${1:-}" in
  coldstart)
    runs=${2:-5}; times=()
    for i in $(seq 1 "$runs"); do
      $A shell am force-stop $P; sleep 2
      t=$($A shell am start -W -n $P/.MainActivity | tr -d '\r' | awk '/TotalTime/ { print $2 }')
      echo "run $i: ${t} ms"; times+=("$t"); sleep 4
    done
    printf '%s\n' "${times[@]}" | sort -n | awk '{ a[NR] = $1 } END { m = (NR % 2) ? a[(NR+1)/2] : (a[NR/2] + a[NR/2+1]) / 2; print "median: " m " ms (min " a[1] ", max " a[NR] ", n " NR ")" }'
    ;;
  launch)
    runs=${2:-5}; tmp=$(mktemp -d)
    for i in $(seq 1 "$runs"); do
      $A shell am force-stop $P; $A shell input keyevent 3; sleep 2
      record "launch" 7; sleep 0.5
      $A shell am start -n $P/.MainActivity >/dev/null
      wait $REC || true; sleep 1
      $A pull /sdcard/launch.mp4 "$tmp/$i.mp4" >/dev/null 2>&1
      echo "run $i: $(python3 -I "$(dirname "$0")/launch-time.py" "$tmp/$i.mp4")"
    done | tee "$tmp/runs"
    python3 -I - "$tmp/runs" <<'PY'
import statistics, sys
rows = [line.split()[2:] for line in open(sys.argv[1])]
for k in range(0, len(rows[0]), 2):
    vals = [int(r[k + 1]) for r in rows]
    print(f'median {rows[0][k]}: {statistics.median(vals):g} ms (min {min(vals)}, max {max(vals)}, n {len(vals)})')
PY
    cp "$tmp/1.mp4" "$OUT/launch.mp4"; rm -rf "$tmp"
    ;;
  runner)
    name=${2:-runner}; fresh
    record "$name" 32
    go 'workout/seeded-repeaters-7-3/run?autostart=1'
    finish "$name"
    $A shell input keyevent 4
    ;;
  tabs)
    name=${2:-tabs}; fresh; go hang; sleep 2
    home=$(where Home); log=$(where Log)
    record "$name" 7
    $A shell input tap $home; sleep 2.5
    $A shell input tap $log
    finish "$name"
    ;;
  clip)
    name=$2; secs=$3; fresh
    record "$name" "$secs"
    [ -n "${4:-}" ] && go "$4"
    finish "$name"
    ;;
  *) sed -n 2,11p "$0"; exit 1 ;;
esac
