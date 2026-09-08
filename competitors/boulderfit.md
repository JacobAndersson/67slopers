# BoulderFIT

> Hangboard interval timer for Android. Free, ad-supported, single indie developer. The closest
> thing to a "pure timer" competitor and the direct reference for our MVP feature set.

_Researched 2026-09-08. Based on the Google Play listing, store screenshots, user reviews and
developer replies, third-party roundups, and the Aptoide mirror. The developer's landing page
(`boulderfit.allworkouts.app`) was unreachable at the time of research._

## Snapshot

| Field          | Value                                                                                 |
| -------------- | ------------------------------------------------------------------------------------- |
| Developer      | Tobias Schroepfer (indie). Contact: `boulderfit@allworkouts.app`                      |
| Package        | `com.tsm2.boulder_fit`                                                                |
| Platforms      | Android only (Android 11+). No iOS app found on the App Store (US and DE storefronts) |
| Store title    | "BoulderFIT Hangboard timer" (previously "BoulderFIT Hangboard training")             |
| Store subtitle | "Hangboard & Fingerboard Interval Timer – Track & Save Climbing Workouts"             |
| Price          | Free with ads. In-app purchases $0.99–$2.49 (ad removal, quoted by users as "$2.50")  |
| Downloads      | 5K+                                                                                   |
| Rating         | 4.85 stars from ~153 ratings                                                          |
| Last update    | Aug 8, 2026 (v3.0.3 shipped Feb 9, 2026 per Aptoide; ~7.5 MB APK)                     |
| Account / sync | None. Everything is local to the device                                               |
| Ads            | Yes, banner-style ads in the free tier; one-time IAP to remove                        |

## Positioning

The store copy is explicit: "BoulderFIT is your interval timer and workout companion" and "Set
up your training times and reps in seconds". It warns that "Hangboards and fingerboards are not
recommended for climbing or bouldering beginners!" and ships **no pre-built protocols**. It assumes
you already know what a repeater or max hang is and just need a timer that remembers your
configuration.

## Feature inventory

### Timer configuration (Config tab)

- **Simple mode.** One form with six fields: PREP, HANG, PAUSE, REPS, REST, SETS. Shows the
  estimated total duration (e.g. "4:45") and a single "Start Workout" button. Values are typed
  into plain numeric text fields (seconds), not pickers or steppers.
- **Complex mode.** A second page (toggled via a two-dot pill indicator at the top) where a
  workout is a list of named **sets** (e.g. "Sloper", "Pockets"). Each set has its own REPS, HANG
  and PAUSE, an optional trailing HANG, and a REST after the set. A "+" button appends sets, an
  "x" removes them. A single PREP applies to the whole workout.
- **Favorites.** Heart icon saves the current configuration with a name; a heart tab on the left
  edge opens the favorites drawer to load one. Users rely on this for "multiple different workout
  combos".
- **No set duplication.** A reviewer notes you "have to fill each set thoroughly even if you want
  each set to be identical to the first one".
- **No presets, no library, no board picture, no hold selection, no added-weight field.**

### Workout execution (timer screen)

- Full-screen countdown with a **very large number** (roughly a third of the screen height) and a
  phase label ("REST", "HANG").
- **Animated background.** Two flat colours; the lower colour rises as the interval elapses so
  remaining time is visible from across the room without reading digits.
- Header shows "Rounds 2 / 2" (reps within the set), footer shows "Sets 1 / 6".
- **"Next up: Pockets"** chip previews the next set.
- **Audio cues.** Beep pitch selectable at 300, 500 or 700 Hz. Short countdown cue pattern is
  selectable (e.g. 3-2-1, 2-1, 1 only, or none) plus a long cue at the end of each countdown.
  Sounds can be disabled entirely. **Vibration** can be enabled.
- v3.0.3 fixed the app "muting other audio sources" (it now no longer steals audio focus).
- Pause, skip and "previous" controls are not visible in any screenshot and are not mentioned in
  the store copy. Treat as absent or minimal until verified on-device.

### Workout log (Workouts tab)

- Chronological list of completed sessions. Each row: workout name (only if it was a favorite),
  date, and Hang / Pause / Reps / Rest / Sets. Complex workouts show ranges ("10-15 Hang", "1-2
  Reps").
- An orange corner marker on a row appears to indicate an attached note.
- Sessions can be **edited afterwards** and **annotated** with free-text notes.
- No charts, totals, streaks, weekly volume, or export.

### Grade converter (Converter tab)

- Table converting one grade across UIAA, French, British Technical, British Adjectival, USA
  (YDS), Finland, Sweden/Norway, Fontainebleau, Hueco (V), Saxon and Australia. Toggle between
  Boulder and Sport.
- Unrelated to the timer. Probably there to pad the feature list, but users do not complain about
  it.

### Profile tab

- Settings live here: sound frequency, cue pattern, vibration, remove-ads purchase, contact link.
  One reviewer reports the "Contact" button in settings does not work.

### Explicitly missing

- No pre-built protocols or coaching content.
- No iOS, web, tablet or watch version.
- No account, cloud sync, backup or export.
- No analytics beyond the raw list.
- No training plans, calendar or scheduling.
- No assessment tests, bodyweight tracking or added-weight logging.
- No dark mode visible in screenshots.

## UX observations (from screenshots and reviews)

- **Visual style.** Material-era Android look: white cards, saturated purple accent, bottom tab
  bar with four tabs (Config, Workouts, Converter, Profile). Functional, dated, not "designed".
- **Number entry is raw text fields.** Every value is typed in seconds. Fast for power users,
  error-prone with sweaty fingers and no min/max guards visible.
- **Complex-mode editing is tedious.** Sets cannot be copied, reordered or templated.
- **Timer readability is the strong point.** The huge digits and colour-fill background are what
  users praise ("easily visible timer", "Looks good, no fluff").
- **Ads.** The free tier shows ads. Reviewers consider the ~$2.50 removal fair; the app owner of
  this repo describes the ad load as heavy and the overall UX as poor.

## Monetization

- Free download, ad-supported.
- One-time in-app purchase to remove ads (store range $0.99–$2.49; users quote "$2.50").
- No subscription, no paid content.

## What users say

Positive (Play Store, 4.85 stars):

- "Exactly what you're looking for if you want a hangboard timer. Looks good, no fluff, simple to
  use and input custom workouts, easily visible timer."
- "easily worth the $2.50 to go ad free and support the dev. Update: Dev got in touch and added
  the feature" (a 1-second-only beep option).
- "I like that I can do sets and rounds and adjust the rest time for both."
- "Simple, but great. Make use of the favorites feature to create multiple different workout
  combos."

Negative:

- "Severely inaccurate sound cues for 7:3 repeaters unfortunately" (one-star review).
- "the sounds cues feel like they are not perfectly in sync with time."
- "Not sure why adding additional workouts has to be more complicated than the way the default
  workout is configured."
- "I'd like a celebratory beep at the end of workout."
- "'Contact' button in settings doesn't work."

Developer behaviour: replies personally to reviews, ships small requested options within days
("I just released a new version where it is possible to select between different short sound cue
pattern").

## Takeaways for our MVP

BoulderFIT's feature set is a reasonable **floor** for our MVP. Parity items:

1. Configurable interval timer with prep, hang, pause (between reps), reps, rest (between sets),
   sets.
2. Multi-set workouts where each set can have its own hang/pause/reps and a label.
3. Save and reload named workouts.
4. Full-screen execution view with oversized digits, phase label, progress fill, rep and set
   counters, and "next up" preview.
5. Audio and haptic cues, with a countdown pattern and end-of-interval cue.
6. Workout history with edit and notes.

Where we can clearly beat it:

- **No ads, ever.** This is the single biggest complaint from the repo owner and the reason the
  ad-removal IAP exists.
- **iOS, Android and web** from one codebase; BoulderFIT is Android only.
- **Accurate audio scheduling.** Two of the handful of negative reviews are about drift. Schedule
  cues against a monotonic clock, not `setInterval`.
- **Set duplication and reordering** in the workout builder.
- **Pause / skip / back** controls and a lock-screen or background timer.
- **A few sane presets** (7:3 repeaters, max hangs, density hangs) so beginners are not staring at
  six empty fields. Keep the "not for beginners" warning.
- **End-of-workout celebration cue** (explicitly requested).
- Steppers or wheel pickers instead of raw text fields.

## Sources

- Google Play listing: https://play.google.com/store/apps/details?id=com.tsm2.boulder_fit
- Aptoide mirror (version, size, changelog): https://boulderfit.en.aptoide.com/app
- MakeUseOf, "4 Climbing Apps for Android": https://www.makeuseof.com/climbing-apps-android/
- App Store search (no BoulderFIT result): https://itunes.apple.com/search?term=boulderfit&entity=software
