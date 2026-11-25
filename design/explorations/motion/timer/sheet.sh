#!/bin/bash
# Contact sheet of a capture clip: one row of frames from START for SECS seconds at FPS.
#
#   sheet.sh CLIP OUT.png [START=0] [SECS=33] [FPS=1/3] [WIDTH=140] [BOOST]
#
# BOOST (a number, e.g. 4) multiplies the contrast around mid-grey, so a field too subtle to see
# at sheet size shows its shape. A boosted sheet is for reading the field's shape, never its colour.
set -euo pipefail
clip=$1; out=$2; start=${3:-0}; secs=${4:-33}; fps=${5:-1/3}; width=${6:-140}; boost=${7:-}
n=$(python3 -I -c "import math, fractions, sys; print(max(1, math.ceil(float(sys.argv[1]) * fractions.Fraction(sys.argv[2]))))" "$secs" "$fps")
eq=""; [ -n "$boost" ] && eq=",eq=contrast=$boost"
ffmpeg -v error -y -ss "$start" -t "$secs" -i "$clip" \
  -vf "fps=$fps,scale=$width:-1$eq,tile=${n}x1" -frames:v 1 "$out"
echo "$out"
