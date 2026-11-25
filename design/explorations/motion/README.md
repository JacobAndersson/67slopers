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

## Phase 2b (data)

| Phase    | Commit    | Change                                                                                                                                                                                                                                                                                                                       | Cold start (`am start -W`, median of 5) | Launch on video (median of 10): splash / first React frame / Home settled |
| -------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------- |
| Phase 1  | `2b30e30` | Rerun beside Phase 2b, same instance, same hour.                                                                                                                                                                                                                                                                             | not rerun                               | 238 / 858 / 1412 ms (React 778 to 957, Home 1359 to 1498)                 |
| Phase 2b | `318d9cb` | Reduced-motion fades that run under the system setting; Home and Log lift in 40 ms apart, the week bars rise, Log's figures count up, the heat-calendar ring glides; the press dip on buttons, chips and cards, a dim on rows; the sheet springs back and closes at the finger's speed, and rises from the Modal's `onShow`. | not rerun                               | 246 / 843 / 1426 ms (React 752 to 920, Home 1345 to 1495)                 |

Measured with `capture.sh launch 5`, twice for each APK in the order Phase 1, Phase 2b, Phase 1,
Phase 2b, at host load under 5, on an emulator booted that hour. The two rounds disagree in sign
(round 1: Phase 2b 44 ms sooner to the first React frame and 102 ms sooner to Home; round 2: 51 ms
and 42 ms later), so the pooled medians above are the comparison: both are within noise of
Phase 1. Both APKs read about 150 ms slower than the Phase 1 row above, which was another boot of
the emulator at another host load. Compare rows measured together only.

Home settled does not move because Home mounts while the native splash is still up: the cascade
(three 40 ms steps and a spring of about 250 ms) and the week bars finish under the splash
hand-off, and the clip shows Home already in place when the Night lifts (`data/launch-sheet.png`).
The grow-in is seen on Log's first visit and on screens pushed later (a session's set bars, the
overview's timeline).

The worktree build needs the MoonBoard lists copied into `src/lib/moonboard/data/` (they are
git-ignored and a clone has empty ones), or Home has no board card and launch is not comparable.
Force the bundle with `rm -rf android/app/build/generated/assets/react` after copying them:
Gradle does not see the change. `~/Android/seed/push.sh` sets the animation scales back to 1,
so turn reduced motion on after seeding, never before.

`data/` holds the clips (git-ignored) and contact sheets:

- `tabs-sheet.png`, `log-arrival-sheet.png`: Hang, then Home (mounted at launch, so nothing
  replays), then Log's first visit at 25 fps. Its parts lift in and the figures count from 0 to
  8 weeks, 22 and 6 h 15 in about 320 ms. The figures sit left in their columns and do not shift
  as their digits change.
- `revisit-sheet.png`: Log and Home again after both were seen. Both appear complete on their
  first frame.
- `calendar-sheet.png`, `calendar-clear-sheet.png`: pinning a day (the ring fades in, the other
  days dim), moving the pin (the ring glides in about 200 ms, no visible overshoot), Clear (the
  ring fades out in about 100 ms). The list under the calendar crossfades in 120 ms, with old
  and new text briefly over each other.
- `sheet-open-sheet.png`, `sheet-drag-sheet.png`: Delete on a session opens the sheet, which rises
  over four frames. A slow 80 px drag springs back without overshoot. A flick closes it in about
  200 ms.
- `press-sheet.png`: a workout card held 0.6 s dips (its edge moves 13 px on a 940 px card, the
  0.97 scale), the library IconButton dips (129 to 127 px wide), a SettingRow dims (its title's
  mean luminance 217 to 228 and back).
- `reduced/`: Settings › Accessibility › Color and motion › Remove animations, set from adb as
  `animator_duration_scale`, `transition_animation_scale` and `window_animation_scale` 0.
  Reanimated reads `transition_animation_scale` once at process start, so the app was cold
  started after the change. `useReducedMotion()` picked it up: Log's figures show their values
  at once, the parts fade in 40 ms apart with no rise, the week bars fade, the sheet fades in and
  out in place and does not follow a drag. Before `318d9cb` the sheet's 120 ms fade had one frame
  between nothing and the full sheet, because it ran before the Modal's window was drawn; it now
  has four (`reduced/sheet-open-sheet.png`).

## Phase 2a (timer)

The timer, the core loop, in four units on the same harness. Clips are in `timer/` (git-ignored);
the contact sheets next to them are committed.

| Unit | Commit    | Change                                                                                                                                                                                                                                                                                    | Checked on the emulator                                                                                                                                                                                                                                                                               |
| ---- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A    | `7e783aa` | `src/lib/timer/energy.ts`: what each phase asks of the field (Get ready low and slow, Hang high, rests breathing, a stopped clock still) and a chase toward it by `1 - e^(-dt/tau)`, so a phase change retargets a running field and any frame rate lands on the same values.             | Pure: 9 tests (a hang arrives within 300 ms, the chase never passes its target, 30, 60 and 120 Hz land alike, a pause decays, a resume starts from where the decay stands).                                                                                                                           |
| B    | `7078271` | A smoke field on the session ground, a Skia shader drawn on the UI thread, chasing that energy. Over the fill, under the words, at most 16% toward the ground's deepest step or toward light, so Glow stays Glow. Lazy-loaded by the runner; no field under reduced motion or on the web. | `field-variants-sheet.png` and `field-*/runner-sheet.png` (three fields, below); `field/controls-sheet.png` (a pause lets it decay on Snow in about 2 s). `librnskia.so` is not mapped into the process after two cold launches to Home, and is once the runner opens.                                |
| C    | `84e7e2a` | The count in fixed slots per interval: only a changed digit rolls, 5% of its size from above in 220 ms (the old one leaves in 110), a lost digit becomes a leading zero ("09"). One size for the whole run, so a 3:00 rest and a 7 s hang no longer jump between 150 and 240 pt.          | `digits/roll-sheet.png` (10 to 09 over four frames, centred), `digits/runner-sheet.png`, `digits/reduced-sheet.png` (crossfade in place, the unchanged 0 stays). Pure: 7 tests in `count.test.ts`.                                                                                                    |
| D    | `b6e9216` | Press dip on the ground buttons and the pill; the pill stays mounted and its glyph and word cross-scale 0.75 to 1 on SPRING_SETTLE with a 200 ms fade (100 ms out), Back and Skip scale in at the sides; caption, Next line, set pills and a set line under the same word crossfade.      | `micro/swap-sheet.png`: Pause, Resume, Pause tapped 150 ms apart all land. A held press dips the Start pill 947 to 917 px and the settings ring 175 to 169 px (0.97). `micro/start-sheet.png`, `micro/boundary-sheet.png`, `micro/reduced-sheet.png`, `micro/split-reduced-sheet.png` (height snaps). |

### The field: three variants

Each field was built behind a constant, recorded with `capture.sh runner` and compared at one
frame every 3 s (`field-*/runner-sheet.png`) and over one hang at 2 fps with contrast ×4
(`field-variants-sheet.png`, top to bottom): smoke (fractal noise warped by noise), rising bands,
wandering cells. Smoke is the one kept. The bands travel up faster than the fill and read as a
second progress bar; the cells put a busy pattern behind the digits. Smoke is tone without
direction or structure, the nearest to one colour in many tones. The other two were deleted.

### Launch and cold start

| Build    | Commit    | Cold start (`am start -W`, median of 10) | Launch on video (median of 10): splash / first React frame / Home settled |
| -------- | --------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Phase 2b | `318d9cb` | 652.5 ms (614 to 681)                    | 216.5 / 824 / 1394.5 ms (React 757 to 943, Home 1317 to 1477)             |
| Phase 2a | `b6e9216` | 654.5 ms (631 to 690)                    | 210.5 / 815 / 1375.5 ms (React 779 to 903, Home 1330 to 1430)             |

Measured with `capture.sh launch 5` and then `capture.sh coldstart 5`, each twice per APK in the
order Phase 2b, Phase 2a, Phase 2b, Phase 2a, reseeded before every set, at host load 2.8 to 4.5,
on an emulator booted that hour. Both rounds put Phase 2a a little sooner to the first React frame
(5 and 9 ms), well inside the spread: no measurable difference in launch or cold start. That fits
what the process shows: after a cold launch to Home, `librnskia.so` is not mapped (Skia loads its
native library in `RNSkiaModule.install()`, the first time its JavaScript runs, not in
`Application.onCreate`), and the field's JavaScript only runs when the runner imports it.

### Size and jank

The x86_64 release APK grows from 101.8 MB (`318d9cb`) to 114.1 MB (`b6e9216`): 11.7 MB is
`librnskia.so`, stored uncompressed, and 0.47 MB is Skia's JavaScript in the bundle (5.05 to
5.52 MB), which Hermes loads but does not run until the runner imports the field.

Jank, from `dumpsys gfxinfo` over 20 s of the Warm-up ladder's 25 s hang (reached by Pause and
Skip, then Resume, sampled from 2 s in), three runs per build, alternating:

| Build                                      | Frames in 20 s | Janky frames         | p50 / p90 / p95 / p99 | Slow UI thread |
| ------------------------------------------ | -------------- | -------------------- | --------------------- | -------------- |
| Field on (`b6e9216`)                       | 973 to 978     | 23.4% (23.2 to 23.6) | 36 / 57 / 61 / 65 ms  | 175 to 178     |
| Field off (the same, field never mounted)  | 1196 to 1201   | 0.25% (0.17 to 0.59) | 18 / 29 / 30 / 32 ms  | 0 to 5         |
| Field on, redrawn at 30 Hz (not committed) | 997 to 1001    | 20.5% (20.4 to 20.8) | 34 / 61 / 61 / 65 ms  | 176 to 183     |
| Field on, a quarter of the pixels (1 run)  | 1005           | 19.7%                | 36 / 57 / 61 / 65 ms  | 170            |

On this emulator the field costs about a quarter of the hang's frames. The limiter is not the
shader: drawing a quarter of the pixels changes nothing. A `simpleperf` profile of the main thread
(DWARF call graphs) puts 53% of its samples in RN Skia presenting the canvas on the main thread
(`RNSkPictureView::setJsiProperties` to `OpenGLWindowContext::present`), and nearly all of that
in two calls that block on a round trip to the host GPU over the emulator's qemu pipe:
`glBufferDataSyncAEMU` (about 30%) and the fence created in `eglSwapBuffers` (about 20%). At
about 30 ms a round trip, even 30 redraws a second keep the main thread full, which is why the
30 Hz throttle only bought 3 points and was dropped. That transport exists only on the emulator
(`-gpu software`); a phone presents through its own GL driver. Whether the field holds 60 fps on
a phone is not measured here.

### Emulator notes from this phase

- uiautomator cannot dump a screen that draws every frame ("could not get idle state"), so
  `timer/controls.sh` and `timer/reduced.sh` tap fixed points on the 1080x2340 screen.
- The emulator died once, mid-build, while the host was out of swap and at load 200 (QEMU's
  watchdog logged 15 to 28 s stalls). `docker restart` and the image's own
  `docker-android start device` both fail on `sudo chown /dev/kvm`. What worked, in the same
  container: kill the `docker-android start device` process, delete `hardware-qemu.ini.lock` and
  `multiinstance.lock` in `/home/androidusr/emulator`, start
  `/opt/android/emulator/emulator @samsung_galaxy_s10_14.0 -gpu software -accel on -writable-system -no-boot-anim -no-audio -memory 2048`
  with `docker exec -d`, then repeat `~/Android/emu.sh`'s settings by hand (root, `wm size
1080x2340`, density 440, animation scales, `auto_time 0`, the demo clock). Installed apps and data
  survive.
- After that, release builds ran with a 1.5 GB Gradle heap and a 1.5 GB Metro heap, under `nice`
  and `ionice`, refused to start below 3 GB of free memory, and stopped the Gradle daemon after
  each build: about 30 s for a JS change, and the emulator stayed up.
- Drive the emulator from one script at a time. Two at once (a measurement in the background and a
  check in the foreground) gave runs of 99 to 400 frames in 20 s, which are worthless.
