#!/usr/bin/env python3
"""Read a screen recording of one cold launch and print its timings in ms.

screenrecord writes a frame only when the screen changes, so frame timestamps are change times.
The status bar is cropped off (the system restyles it during launch). Timings count from the
first change after the recording's first frame, which is the launcher starting the launch
animation:

  splash   the screen first goes dark (the Night splash is up)
  react    the frame that ends the longest silence between splash and home: the splash is static
           while JS loads, and SplashHandoff starts on its exact frame, so frames resume (often
           with no visible change yet) when React first draws
  home     the first frame within 2/255 mean difference of the final frame (Home in its final look)

Usage: launch-time.py CLIP.mp4
"""
import subprocess
import sys

W, H = 40, 88
CROP_TOP = 6  # rows of the 88 that hold the status bar


def frames(path):
    pts = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time',
         '-of', 'csv=p=0', path],
        capture_output=True, text=True, check=True).stdout.split()
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-fps_mode', 'passthrough',
         '-vf', f'scale={W}:{H},format=gray', '-f', 'rawvideo', '-'],
        capture_output=True, check=True).stdout
    size = W * H
    out = []
    for i, t in enumerate(pts):
        px = raw[i * size + CROP_TOP * W:(i + 1) * size]
        if len(px) == size - CROP_TOP * W:
            out.append((float(t), px))
    return out


def mean(px):
    return sum(px) / len(px)


def diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / len(a)


def main(path):
    fs = frames(path)
    t0 = fs[1][0]
    splash = next(i for i, (_, px) in enumerate(fs) if i > 0 and mean(px) < 40)
    final = fs[-1][1]
    home = next(i for i in range(splash, len(fs)) if diff(fs[i][1], final) < 2)
    react = max(range(splash + 1, home + 1), key=lambda i: fs[i][0] - fs[i - 1][0])
    ms = lambda i: round((fs[i][0] - t0) * 1000)
    print(f'splash {ms(splash)} react {ms(react)} home {ms(home)}')


if __name__ == '__main__':
    main(sys.argv[1])
