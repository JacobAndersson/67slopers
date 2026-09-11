# Future work

Agreed product direction from the 2026-09-11 review. These are prioritized recommendations
for future work, not shipped features or a fixed delivery commitment.

## Product ambition

Make 67slopers the easiest way to know what to do today, execute it reliably, and see
progress over time. Give climbers a reason to recommend it and keep using it for years.

Preserve the [product principles](principles.md): everything local, no accounts, instant
startup, free and ad-free. The [MVP scope](mvp.md) describes the original baseline; this
document records the proposed next stage.

Build on the existing strengths: flexible workouts, session snapshots, board guidance,
and a timer designed to be read from across the room. Showing the next grip when the
hands need to move is a detail worth preserving.

## 1. Make sessions exceptionally trustworthy

A climber should feel comfortable putting their phone down and relying on the app.

Findings from the source review, to recheck against the implementation before starting:

- Background audio was explicitly disabled. The timer catches up when returning to the
  app, but dependable cues while locked or backgrounded need native-device verification.
- Sessions were saved when the user finished the summary screen. Losing or closing the
  app before that could lose the session.
- Completed sets were inferred from timer position, so skipping hangs could count work
  that was not performed.
- "Do it again" ran the current saved workout when it existed, even if it had changed
  since the recorded session.

Future work:

- Preserve session progress during a run and recover an interrupted session. Completing
  the summary should not be the only point at which training is saved.
- Distinguish performed, skipped, and shortened work in session history.
- Make repeating a historical session preserve the workout that actually ran; make any
  choice to use the latest edited workout explicit.
- Establish a native-device quality bar for interruptions, Bluetooth and music, screen
  locking, accidental navigation, and recovery after the app is terminated.
- Measure startup and time to countdown against the budgets in the product principles.

Starting points: [runner](../src/components/runner.tsx),
[timer engine](../src/lib/timer/engine.ts), [timer hook](../src/lib/timer/useTimer.ts),
[cue player](../src/lib/timer/cue-player.ts), and
[session screen](../src/app/session/[id].tsx).

## 2. Make progress logging almost effortless

This is the biggest feature opportunity. Workout history should help answer:
"Am I improving on this grip?"

- Record edge depth, grip position, added weight or assistance, and actual completion.
- Remember previous values so a normal session requires almost no entry. Let users
  correct exceptions after a set or session, rather than during a three-second rest.
- Support missed and shortened hangs, rather than assuming the timer proves completion.
- Capture bodyweight when relevant to weighted-hang comparisons, preserving it with the
  session rather than applying a later bodyweight retroactively.
- Show a simple history of comparable performances. Keep different grips, edges,
  durations, and assistance methods distinct.
- Preserve the relevant setup and results in session snapshots.

Example of the useful experience:

> Last time: 20 mm half crimp, +12.5 kg, four of five hangs completed.
> Today: same setup, all five completed.

This makes history useful beyond session totals and subjective feelings. Start with
remembered load and completion corrections, then add comparisons once the data is sound.

Starting point: [stored workout and session types](../src/lib/store/types.ts).

## 3. Make the next workout the main action on Home

At review time, Home led with streaks and calendar history, with "Presets" and "New
workout" as its persistent actions. Starting a saved session required opening its
overview, pressing Start, and then pressing Play.

- Give the last-used or pinned workout the most prominent space for returning users,
  alongside its previous result and a direct way to begin the preparation countdown.
- Keep the overview available for inspection and editing.
- Offer first-time users a small, optional path based on their training goal and
  available equipment. Preserve immediate access without a mandatory onboarding wizard.
- Carry starter-workout guidance into the saved-workout overview. At review time,
  presets such as max hangs and repeaters lost their explanatory descriptions when
  copied into saved workouts.
- Explain each starter workout's purpose, setup, and intended effort before it starts.
  Beginner/intermediate/advanced labels alone leave too much to interpretation.
- Have a qualified climbing coach review guidance and its attribution.

## 4. Build a credible connection between sessions

Once logging is reliable, add a little continuity: the next session, previous settings,
and a clear explanation of any proposed adjustment.

- Begin with a few optional, coach-reviewed progressions.
- Explain each progression's purpose, how sessions fit together, and when to repeat or
  adjust the workload.
- Keep users in control, particularly when climbing outside the app changes their load.
- Retain the weekly approach to consistency and leave room for recovery.
- Do not turn a "Strong" feeling alone into an instruction to increase load.
- Keep guidance bundled and all training data and decisions on the device.

Validate what climbers actually need before expanding into a larger planning system.

## 5. Work with whatever board is available

The working tree contained eight illustrated boards at review time, beyond the two
mentioned in the older MVP document.

- Provide a strong generic setup alongside board illustrations: edge depth, grip
  position, and hand or side.
- Let someone train accurately on an unfamiliar gym board without waiting for a new
  illustration to ship.
- Distinguish the physical hold from how it is gripped.
- Make switching equipment manageable without silently treating performances on
  different setups as equivalent.
- Expand illustrated-board support based on actual requests.

The outcome is continuity: someone can walk into another gym and continue training.

## 6. Complete local ownership with backup and restore

Once the app holds months of meaningful training history, portability is essential.

- Offer a full, user-controlled file backup and restore on another device.
- Preserve sessions, workout snapshots, settings, and future load data.
- Offer a readable export for personal analysis or sharing with a coach.
- Make restore behavior understandable and verify that backups round-trip accurately.

This strengthens the local-only promise and reduces hesitation about adopting the app
as a long-term training record.

## 7. Make recommending a workout frictionless

The [compact workout codec](../src/lib/workout-codec.ts) already provides a foundation.
No user-facing sharing or import flow was found during the review.

- Finish sharing and import using self-contained workout data in text, links, or QR codes.
- Let recipients preview a workout before saving or running it locally.
- Support the practical moments of discovery: a coach sends a workout, a friend shares
  a routine, or a gym puts a QR code beside its board.
- Keep these flows within the local-only principles; no accounts or server lookup are
  needed to resolve a workout's contents.
- Pair the product with clear store positioning, useful demonstrations, and a few coach
  or gym relationships. Do not contact anyone automatically as part of implementation.

Becoming the default depends on people encountering the app when they want to train.

## Positioning and focus

Offline operation and no account are valuable, but already shared territory.
[Daily Hangboard's listing](https://play.google.com/store/apps/details?hl=en_US&id=com.peaknorthlabs.dailyhangboard)
advertised offline use, no account, board-specific guidance, and history when checked
on 2026-09-11. [Crimpd](https://www.crimpd.com/) offered coached workouts, training plans,
and progress analytics. These are published product claims, not hands-on verification.

The opportunity is a free, unrestricted hangboard experience that earns preference
through usability, trust, and useful training history. Keep Gen Z mode as optional
personality; prioritize these fundamentals over further investment in that mode.

## Proposed next release

1. Session preservation and recovery, with honest completion tracking.
2. Direct start from Home.
3. Remembered load with easy completion corrections.
4. Backup and restore.

Follow with comparable progress history and guided progressions once the data and
research support them. Keep generic board setup and workout sharing on the roadmap.

## Validate with real use

Put the next release in the hands of 10–15 climbers for several weeks. Through direct
observation and voluntary feedback, without adding in-app analytics, learn:

- Can they start an appropriate workout unaided?
- Can they rely on the timer through normal interruptions?
- Do they still need another logbook to record their training?
- Do they voluntarily return for their next session?
- Can they understand whether comparable performances are improving?

Use those observations to guide progression features and subsequent priorities.

## Review scope

The original assessment covered source code, product principles, repository competitor
research, and selected current competitor pages. The local web preview returned a
server error, so rendered visual polish was not assessed. Native background behavior
and interruption handling require real-device validation. Findings above are dated
observations, not a claim that every issue remains present after later changes.
