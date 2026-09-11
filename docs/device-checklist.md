# Device checklist

The native quality bar for [future work §1](future-work.md#1-make-sessions-exceptionally-trustworthy):
what has to hold on a real phone before a release. Unit tests cover the timer engine, the
hang log and the run checkpoint; everything here needs hardware. Run it on one mid-range
Android phone and one iPhone, and record the results in the table at the end.

## How the timer behaves, by design

- **Foreground only.** The runner keeps the screen awake. Background audio is disabled in
  `app.json`, and iOS suspends JavaScript timers in the background, so no cue plays while the
  app is not on screen. The engine runs on a monotonic clock and catches up on return; a
  boundary crossed in the background gives at most one late beep when the app comes back.
- **Checkpoints.** A run is written to storage at every interval change, on pause and resume,
  and when the app leaves the foreground. If the app is closed, Home offers to continue the
  run paused where it stood, save it as ended, or discard it.
- **Sessions are saved when the timer stops,** not when Finish is tapped.
- **History is honest.** Each hang's actual time is logged; a skipped or cut-short hang does
  not complete its set.

## Checks

Set up: install the release build (`npm run build:android`, or a release build from Xcode),
make a workout with a board, and start it from the Home card.

### Interruptions

1. Take a phone call during a hang. Expected: the timer keeps time; on return, the display
   shows the right interval and the next cue plays on time.
2. An alarm goes off during a rest. Same expectation.
3. Play music in another app, then run a workout. Expected: music keeps playing, beeps mix
   over it (`interruptionMode: 'mixWithOthers'`).
4. Connect and disconnect Bluetooth headphones mid-run. Expected: beeps follow the output
   route; the timer is unaffected.
5. iOS with the silent switch on. Expected: beeps still play (`playsInSilentMode`).
6. Android with touch vibration turned off in system settings. Expected: the cue still buzzes
   (alarm-tagged vibration from `modules/cue-vibration`).

### Screen and navigation

7. Leave the phone on the floor for a full workout. Expected: the screen never locks.
8. Lock the screen by hand during a rest, wait past the boundary, unlock. Expected: the timer
   has caught up; at most one late beep.
9. Android hardware back and back gesture mid-run. Expected: the timer pauses and asks
   before ending.
10. iOS swipe down on the runner. Expected: nothing; the runner is not dismissable by gesture.

### Termination and recovery

11. Mid-hang, switch to another app and force-stop 67slopers
    (`adb shell am force-stop com.sloppyslopers.app` or swipe it away). Reopen. Expected: Home
    shows the unfinished workout; Continue opens it paused on the same interval with the same
    time left; finishing it records one session.
12. Same, then choose Save as ended. Expected: one session with the sets and hangs done
    before the app closed, marked ended early.
13. Finish a workout and close the app on the summary without tapping Finish. Expected: the
    session is in history.
14. Leave an unfinished workout on Home and start a different one. Expected: the unfinished
    one is kept in history as ended; only the new run can be continued.

### Budgets from the product principles

15. Cold start to interactive Home, under 1 s:
    `adb shell am start -W -n com.sloppyslopers.app/.MainActivity` (TotalTime), after
    `adb shell am force-stop com.sloppyslopers.app`.
16. Warm start, under 300 ms: the same command with the app in the background.
17. Tap Start on Home to the first countdown frame, under 100 ms: screen-record at 60 fps and
    count frames, or read the development log line `perf: start → countdown`.

## Results

| Date | Device | OS  | Build | Failed checks | Notes |
| ---- | ------ | --- | ----- | ------------- | ----- |
|      |        |     |       |               |       |
