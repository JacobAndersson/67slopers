# BoulderFIT

> Hangboard interval timer for Android. Free, ad-supported, single indie developer. The closest
> thing to a "pure timer" competitor and the direct reference for our MVP feature set.

_Researched 2026-09-08. Based on the Google Play listing, user reviews and developer replies,
third-party roundups, the Aptoide mirror, and a hands-on walkthrough of v3.x installed from Google
Play on a Pixel 7 / Android 16 emulator (see [Screenshots](#screenshots)). The developer's landing
page (`boulderfit.allworkouts.app`) was unreachable at the time of research._

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
| Ads            | Full-screen interstitial (AdMob) after finishing a workout; no banners seen. 25 kr IAP removes |
| Tech           | Hybrid web app: one Android activity hosting a full-screen WebView (Cordova/Capacitor style)   |

## Positioning

The store copy is explicit: "BoulderFIT is your interval timer and workout companion" and "Set
up your training times and reps in seconds". It warns that "Hangboards and fingerboards are not
recommended for climbing or bouldering beginners!" and ships **no pre-built protocols**. It assumes
you already know what a repeater or max hang is and just need a timer that remembers your
configuration.

## Feature inventory

### Timer configuration (Config tab)

- **Simple mode.** One form with six fields: PREP, HANG, PAUSE, REPS, REST, SETS. Shows the
  estimated total duration (e.g. "4:45"), recalculated live, and a single "Start Workout" button.
  Values are typed into plain numeric text fields (seconds) with the system numeric keyboard, not
  pickers or steppers. The keyboard's done key submits the form and **starts the workout**; a
  non-numeric character produces a toast "Only numbers are allowed".
- **Complex mode.** A second page reached by **swiping horizontally** (two-dot pill indicator at
  the top). The empty state is just a "+" button and "0:00". Each set card has an optional title,
  a REPS field, and once reps are entered it reveals HANG and PAUSE (repeated per rep) plus a final
  HANG for the last rep with no trailing pause. REST appears between sets. A "+" button appends
  sets, an "x" removes them. A single PREP applies to the whole workout.
- **Favorites.** The outline heart opens an "Add Favorite" dialog (title field plus a one-line
  summary of hang/pause/reps/rest/sets, Cancel/Add). The saved title then shows above the form and
  the heart fills. A heart tab on the left edge opens a modal "Favorites" list (empty state: "No
  favorites yet"). Users rely on this for "multiple different workout combos".
- **Share.** A share icon sends a plain-text summary through the Android share sheet
  ("Preperation: 15s / Hang: 10s / ... / Created with BoulderFIT", typo included). No import.
- **No set duplication.** A reviewer notes you "have to fill each set thoroughly even if you want
  each set to be identical to the first one".
- **No presets, no library, no board picture, no hold selection, no added-weight field.**

### Workout execution (timer screen)

- Full-screen countdown with a **very large number** (roughly a third of the screen height) and a
  phase label ("REST", "HANG").
- **Animated background.** Two flat colours; the lower colour rises as the interval elapses so
  remaining time is visible from across the room without reading digits.
- Header shows "Rounds 2 / 2" (reps within the set), footer shows "Sets 1 / 6".
- **"Next up: Pockets"** chip previews the next set (complex mode only).
- Phase colours: PREPARE green, HANG and PAUSE purple, REST and DONE light blue.
- **Audio cues.** Beep pitch selectable at 300, 500 or 700 Hz. Short countdown cue pattern is
  selectable (e.g. 3-2-1, 2-1, 1 only, or none) plus a long cue at the end of each countdown.
  Sounds can be disabled entirely. **Vibration** can be enabled.
- v3.0.3 fixed the app "muting other audio sources" (it now no longer steals audio focus).
- **Tap anywhere to pause.** The screen greys out and shows a vibration toggle, a sound toggle and
  a "CANCEL WORKOUT" button; tapping again resumes. There is **no skip, no back, no add-a-rep**.
- **End of workout.** "DONE" is shown for about a second, the app returns to the Config screen and
  the session is logged silently. There is no summary, no note prompt, no celebration.
- Settings (see below) allow counting up instead of down, showing total time left, moving the set
  counter to the top, and disabling the animated background.

### Workout log (Workouts tab)

- Chronological list of completed sessions. Each row: workout name (only if it was a favorite),
  date, and Hang / Pause / Reps / Rest / Sets. Complex workouts show ranges ("10-15 Hang", "1-2
  Reps").
- An orange corner marker on a row appears to indicate an attached note.
- Tapping a row opens a detail page (purple header with back arrow): date, a "finished" checkbox,
  the six values including Prep, and a free-text note that autosaves. Sessions can therefore be
  **edited afterwards** and **annotated**.
- No charts, totals, streaks, weekly volume, or export.

### Grade converter (Converter tab)

- Table converting one grade across UIAA, French, British Technical, British Adjectival, USA
  (YDS), Finland, Sweden/Norway, Fontainebleau, Hueco (V), Saxon and Australia. Tapping a row
  opens a grid picker for that system; choosing a value converts all the others. Toggle between
  Boulder and Sport.
- Unrelated to the timer. Probably there to pad the feature list, but users do not complain about
  it.

### Profile tab

- **General**: Ad free (one product, "Remove Ads", 25,00 kr on a Swedish Play account), Settings,
  Language (English, German, Spanish, plus a "Help us translate" button).
- **Settings > Active workout**: Time left (show remaining workout time), Count direction
  (down/up), Animated background, Position of sets (bottom/top), Sound ("Play short and long
  beeps"), Countdown pattern (None, 10..5..4..3..2..1, 10..5..2..1, 10..5, 5..4..3..2..1, 3..2..1,
  2..1, 1), Beep frequency (300 / 500 / 700 Hz), Vibration. **Data**: Clear workouts, Clear
  favorites. No export.
- **More**: Introduction (replays onboarding), Contact us, Rate us, Tell a friend, Legal
  information. One reviewer reports the contact button does not work.

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
- **Ads.** No banners anywhere. Instead a **full-screen interstitial** (AdMob, with a "Viewing
  full screen" immersive-mode hint on first show) fires right after a workout ends, and must be
  closed via a small X that appears after the ad's own countdown. Reviewers consider the ~$2.50
  removal fair; the app owner of this repo describes the ad load as heavy and the overall UX as
  poor.
- **First launch** is a Google UMP consent dialog ("shared with 210 partners", "precise geolocation
  data") followed by a three-page onboarding (Welcome, Warmup tips, Feedback).
- **It is a WebView app.** The Android back button exits the app from any screen, including from
  a running timer; dialogs are closed by tapping outside them; screens have their own in-page
  back arrows.

## Monetization

- Free download, ad-supported via post-workout interstitials only.
- One-time in-app purchase "Remove Ads" (store range $0.99–$2.49; 25,00 kr on a Swedish account;
  users quote "$2.50").
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

## Screenshots

Captured 2026-09-08 from Google Play build on a Pixel 7 / Android 16 emulator, downscaled to 540 px.
All files live in `screenshots/boulderfit/`.

| Area              | Files                                                                                                                                                                                                                                                                                                                                                  |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| First launch      | [01 consent](screenshots/boulderfit/01-consent-dialog.png), [02 welcome](screenshots/boulderfit/02-onboarding-welcome.png), [03 warmup](screenshots/boulderfit/03-onboarding-warmup.png), [04 feedback](screenshots/boulderfit/04-onboarding-feedback.png)                                                                                              |
| Config            | [05 simple](screenshots/boulderfit/05-config-simple.png), [06 favorite loaded](screenshots/boulderfit/06-config-favorite-loaded.png), [07 numeric keyboard](screenshots/boulderfit/07-config-numeric-keyboard.png), [08 complex empty](screenshots/boulderfit/08-config-complex-empty.png), [09 complex set fields](screenshots/boulderfit/09-config-complex-set-fields.png) |
| Favorites / share | [10 favorites empty](screenshots/boulderfit/10-favorites-empty.png), [11 favorites list](screenshots/boulderfit/11-favorites-list.png), [12 add favorite](screenshots/boulderfit/12-add-favorite-dialog.png), [13 share sheet](screenshots/boulderfit/13-share-sheet.png)                                                                                  |
| Timer             | [14 prepare](screenshots/boulderfit/14-timer-prepare.png), [15 hang](screenshots/boulderfit/15-timer-hang.png), [16 pause](screenshots/boulderfit/16-timer-pause.png), [17 rest](screenshots/boulderfit/17-timer-rest.png), [18 set 2 hang](screenshots/boulderfit/18-timer-set2-hang.png), [19 paused controls](screenshots/boulderfit/19-timer-paused-controls.png), [20 done](screenshots/boulderfit/20-timer-done.png) |
| Ads               | [21 interstitial loading](screenshots/boulderfit/21-interstitial-ad-loading.png), [22 interstitial](screenshots/boulderfit/22-interstitial-ad.png), [32 ad-free purchase](screenshots/boulderfit/32-ad-free-purchase.png)                                                                                                                                |
| Workouts log      | [23 empty](screenshots/boulderfit/23-workouts-empty.png), [24 list with note marker](screenshots/boulderfit/24-workouts-list-note-marker.png), [25 detail with note](screenshots/boulderfit/25-workout-detail-note.png)                                                                                                                                    |
| Converter         | [26 table](screenshots/boulderfit/26-converter.png), [27 grade picker](screenshots/boulderfit/27-converter-grade-picker.png)                                                                                                                                                                                                                              |
| Profile           | [28 profile](screenshots/boulderfit/28-profile.png), [29 settings](screenshots/boulderfit/29-settings.png), [30 countdown pattern](screenshots/boulderfit/30-settings-countdown-pattern.png), [31 beep frequency](screenshots/boulderfit/31-settings-beep-frequency.png), [33 language](screenshots/boulderfit/33-language.png)                              |

## Sources

- Hands-on walkthrough on an Android 16 emulator, 2026-09-08 (screenshots above)
- Google Play listing: https://play.google.com/store/apps/details?id=com.tsm2.boulder_fit
- Aptoide mirror (version, size, changelog): https://boulderfit.en.aptoide.com/app
- MakeUseOf, "4 Climbing Apps for Android": https://www.makeuseof.com/climbing-apps-android/
- App Store search (no BoulderFIT result): https://itunes.apple.com/search?term=boulderfit&entity=software
