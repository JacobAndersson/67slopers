# MVP scope

The MVP is a hangboard interval timer that matches BoulderFIT feature-for-feature and
fixes its known weaknesses, built on the [product principles](principles.md). The
detailed competitor notes live in [`competitors/boulderfit.md`](../competitors/boulderfit.md);
this document turns them into scope.

**Screenshots:** a hands-on walkthrough of BoulderFIT on an Android emulator is
captured in [`competitors/screenshots/boulderfit/`](../competitors/screenshots/boulderfit/)
and indexed at the end of the competitor notes.

## Why BoulderFIT is the base

It is the closest "pure timer" on the market, rated 4.85 with a small but loyal user base,
and it is local-only with no account, which matches our principles. It is also Android
only, has drifting audio cues and a tedious multi-set editor. The walkthrough settled the
ad question: the free tier shows a full-screen interstitial after you finish a workout,
which is the worst possible moment for it. Those gaps are the MVP's reason to exist.

## In scope

### Workout builder

Parity with BoulderFIT:

- Simple mode: prep, hang, pause (between reps), reps, rest (between sets), sets, with a
  live estimate of total duration.
- Complex mode: an ordered list of named sets, each with its own hang, pause, reps and a
  rest after the set. One prep time for the whole workout.
- Save the current configuration as a named workout and reload it later (BoulderFIT's
  "favorites"). A name is only needed to save: Start runs the configuration as is, and the
  finish screen offers to save it afterwards.

Improvements:

- Duplicate, reorder and delete sets in complex mode.
- Steppers or wheel pickers with sane bounds instead of raw text fields.
- A handful of built-in presets to start from (7:3 repeaters, max hangs, density hangs).
  Keep BoulderFIT's warning that hangboarding is not for beginners.

### Timer execution

Parity:

- Full-screen countdown with oversized digits and a phase label (Get ready, Hang, Rest).
  The timer opens ready on the first interval and starts when you press Play.
- Colour-fill background that rises as the interval elapses.
- Rep counter and set counter, plus a "next up" preview of the coming set.
- No audio or haptic cues: the app is silent by design and the display carries the
  timing. (BoulderFIT's beeps and vibration are deliberately not copied.)

Improvements:

- Pause, skip forward and go back one interval. BoulderFIT has tap-anywhere-to-pause but
  no skip and no back, so a mistimed set means restarting the workout.
- Timing on a monotonic clock so long sessions never drift.
- Screen stays awake during a workout.
- A short session summary with a one-tap grade,
  "How did you feel?" (weak, normal, strong), saved on the session and shown on the
  home screen, the session screen and the workout overview. BoulderFIT shows "DONE" for
  about a second, drops back to the config screen and logs the session silently.
- Keeps running when the app is backgrounded (lock-screen presentation is a follow-up).

### History

Parity:

- Chronological list of completed sessions showing the workout name, date and the
  interval summary (ranges for complex workouts).
- Edit a session afterwards and attach a free-text note.

Improvements:

- Tap a completed session on the home screen to open it: grade, sets, duration, note,
  and a "Do it again" button that starts the same workout.

### Settings

- None yet. No profile, no theme picker, no cue settings (there are no cues).

## Out of scope for the MVP

- Accounts, cloud sync, sharing, social features (principles 1 and 2).
- Training plans, calendars, scheduling, coaching content, assessments.
- Analytics, charts, streaks, weekly volume, CSV export.
- Added-weight or bodyweight logging (natural next layer after the timer).
- Grade converter. BoulderFIT ships one; it is unrelated to the timer.
- Watch apps, tablet layouts beyond what the responsive layout gives for free.
- Force-sensor or board integrations.

## Data and storage

Everything is on-device (principle 1) and must be readable synchronously at startup
(principle 3).

Recommended: `expo-sqlite` for workouts and sessions, and its key-value store for
settings and the last-used workout. It works in Expo Go and in development builds,
supports synchronous reads, and gives us a real query layer once history grows.
`react-native-mmkv` is faster for key-value data but needs a development build, so it is
a possible later optimisation, not an MVP dependency.

Entities:

```
Workout   id, name, prepSeconds, sets[], createdAt, updatedAt, isPreset
Set       label, hangSeconds, pauseSeconds, reps, restSeconds
Session   id, workoutId?, name, startedAt, completedAt, snapshot (the workout as run),
          completed (bool), note
```

Sessions store a snapshot of the workout so editing or deleting a workout never rewrites
history.

## Milestones

Simple mode ships first: the workout model already uses `blocks[]`, so multi-set editing
is an editor change, not a data or timer change.

1. **Timer core.** Simple-mode configuration, execution screen, keep-awake,
   pause and skip. Usable for a real session end to end. Measure startup time.
2. **Workouts.** Complex mode, presets, save and load, duplicate and reorder sets.
3. **History.** Session log, edit and notes.
4. **Polish.** Background timing, web
   layout pass.

## Open questions

- Which presets ship by default and with what exact numbers.
- Web: does the timer need to work on the web at all for the MVP, or is web a
  development convenience until later.
