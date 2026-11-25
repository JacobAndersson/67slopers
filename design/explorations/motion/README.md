# Motion step-up

Rivet's motion, stepped up with ElevenLabs as the reference, in three phases. Phase 1 lays one
motion vocabulary in `src/lib/motion.ts` and captures a baseline. Phases 2 and 3 build features on
it, and each reruns the capture below so every change is measured against the same harness.

## Decision log

| Phase    | Commit    | Change                                                                                                                                                                                                    | Cold start (`am start -W`, median of 5) | Launch on video (median of 5): splash / first React frame / Home settled |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------ |
| Baseline | `a435f72` | Before any motion work.                                                                                                                                                                                   | 590 ms (553 to 621)                     | 202 / 745 / 1308 ms                                                      |
| Phase 1  | `2b30e30` | Motion tokens in `src/lib/motion.ts` (`liftIn`, `LAYOUT_SETTLE`, `CSS_EASE_OUT`, press timings). The lift springs now pass mass 1, `EASE_OUT` on every timed fade, shared values through `get()`/`set()`. | 585 ms (579 to 602)                     | 194 / 682 / 1249 ms                                                      |

The two rows were measured back to back on one emulator instance at host load under 7. Phase 1
is within noise of the baseline: its launch ranges overlap the baseline's (first React frame 666 to
742 ms against 698 to 774 ms). An earlier baseline run on another emulator instance read 582 ms and
221 / 695 / 1269 ms; a run during a host load spike read 647 ms with a 2 s outlier, so check
`uptime` before trusting a number, and rerun the previous phase's APK beside the new one.

Phase 1 is meant to leave motion as it was, with two exceptions, both visible on the clips:

- **Mass.** Reanimated 4's spring default mass is 4, not 1. Every hand-built
  `.springify().stiffness(380).damping(32)` that left out `.mass()` ran at damping ratio 0.41,
  with about 24% overshoot and about 1 s to settle: Home's layout glide, the unfinished-run card,
  the set bars, and the runner's Done words and summary. `SPRING_SETTLE` documents a ratio of
  0.82, under 2% overshoot and about 0.25 s to settle. `liftIn` and `LAYOUT_SETTLE` now pass the
  mass, so those lifts settle crisply as the brand book describes. Any new spring built from a
  builder must pass `.mass(SPRING_SETTLE.mass)` too, or use the factories.
- **Easing.** Six `withTiming` calls without easing ran on Reanimated's default in-out quad. They
  now use `EASE_OUT`.

## Measuring

Everything runs on the Docker emulator from `~/Android` (see `~/Android/README.md`), container 1
at `127.0.0.1:5555`, with an **x86_64 release build** so neither Metro nor the dev menu shows up
in the numbers. Build it pinned to six cores, or host load kills the emulator:

```bash
cd android
export JAVA_HOME=$HOME/Android/jdk ANDROID_HOME=$HOME/Android/Sdk CMAKE_BUILD_PARALLEL_LEVEL=4 NODE_ENV=production
taskset -c 0-5 ./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64 --max-workers=4 --console=plain
~/Android/Sdk/platform-tools/adb -s 127.0.0.1:5555 install -r app/build/outputs/apk/release/app-release.apk
SERIAL=127.0.0.1:5555 ~/Android/seed/push.sh full
```

After a native dependency is added (Skia, say), run `npx expo prebuild --platform android --clean`
first. Builds of each phase are kept in `~/Android/apk/rivet-<commit>-release-x86_64.apk`, so an
earlier phase can be reinstalled and measured again on the same day.

Then, from the repo root:

```bash
SERIAL=127.0.0.1:5555 design/explorations/motion/capture.sh coldstart 5   # am start -W TotalTime
SERIAL=127.0.0.1:5555 design/explorations/motion/capture.sh launch 5      # video: splash, React, Home
SERIAL=127.0.0.1:5555 OUT=design/explorations/motion/phase2 design/explorations/motion/capture.sh runner
SERIAL=127.0.0.1:5555 OUT=design/explorations/motion/phase2 design/explorations/motion/capture.sh tabs
```

`OUT` defaults to `baseline/`. `clip NAME SECS [ROUTE]` records any other route by deep link.
Every clip starts from the seeded design dataset in light appearance.

What the two cold-start numbers measure:

- **`coldstart`** is `am start -W -n com.sloppyslopers.app/.MainActivity` after `am force-stop`,
  reading `TotalTime`. That is process start, `Application.onCreate` and the first frame of the
  activity window, which is the native splash. Native libraries loaded at startup (a Skia
  package registered in `MainApplication`, say) land here. JS does not.
- **`launch`** records each cold launch from the launcher and reads the frame times with
  `launch-time.py`. screenrecord writes a frame only when the screen changes. _splash_ is when
  the screen goes dark. _react_ ends the longest silence between splash and Home: the splash is
  still while the bundle loads, and `SplashHandoff` starts on its exact frame, so frames resume
  when React first draws. _home_ is the first frame within 2/255 of the final one. JS-side cost,
  such as a module imported at the root, lands in _react_. All times count from the first
  change after launch.

Both run on an emulator without hardware GPU timing. Compare phases measured on the same machine
on the same day, never against a phone.

## Baseline clips

`baseline/` and `phase1/` hold the same captures. The `.mp4` clips are git-ignored (about 12 MB
each set). The contact sheets next to them are committed:

- `runner-sheet.png`: Repeaters 7:3 started with `?autostart=1`, one frame every 3 s. Get ready
  10 to 1, Hang, Rest, Hang, through rep 3 of set 1.
- `tabs-sheet.png`: from Hang, the dock to Home (the week bars rise), then to Log, two frames per
  second.
- `launch-sheet.png`: one cold launch at 10 frames per second, from the launcher through the
  splash hand-off to Home.
