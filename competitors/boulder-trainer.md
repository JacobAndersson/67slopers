# Boulder Trainer

> Board-centric hangboard app from a German indie developer, on the App Store since 2014. Its moat
> is 90 built-in hangboard pictures with numbered holds plus voice-guided workouts. In July 2026 it
> switched from a $2.99 one-off to free-with-Pro-subscription and launched on Android.

_Researched 2026-09-08. Based on the App Store listing (metadata via the iTunes lookup API), the
brand-new Google Play listing, boulder-trainer.com (which shows the current UI; the App Store
screenshots are from the iOS 9 era and no longer represent the app), user reviews, and third-party
roundups._

## Snapshot

| Field           | Value                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------- |
| Developer       | Jan Luther (indie, Germany, "just a small private project"). Support: `support@boulder-trainer.com`      |
| Site            | https://www.boulder-trainer.com (EN/DE), BT Online browser plan builder                                  |
| Platforms       | iPhone, iPad (iOS 26+), Apple Watch app (watchOS 26+), Apple-silicon Mac; Android (new, July 2026)       |
| Bundle / pkg    | `com.bufumufu.boulder-trainer` (iOS) / `com.bufumufu.bouldertrainer` (Android)                           |
| Price           | Free download. Boulder Trainer Pro: $1.99/week, $17.99/year, $39.99 lifetime                             |
| Loyalty pricing | Previous buyers of the $2.99 app keep free training; loyalty tiers $1.99/wk, $11.99/yr, $24.99 lifetime  |
| Ads             | None                                                                                                     |
| iOS stats       | 4.64 stars from 860 ratings. v4.1.6 on Aug 5, 2026. 198 MB. First released Feb 3, 2014                   |
| Android stats   | 10+ downloads, no ratings yet. Updated Jul 31, 2026. IAP $5.99–$43.99                                    |
| Account         | None required. iCloud sync across Apple devices. Fully offline. Optional free BT Online account to share |
| Languages       | English, German                                                                                          |

## Positioning

"Strong fingers are built daily." The pitch is board-first: "Pick your board, download a ready-made
plan or build your own. No account needed, everything works offline." The 2026 relaunch added a
habit tracker, streaks and medals, so the app now sells consistency as much as timing. The developer
statement is candid: "there is no company behind this app, just a small private project."

## Feature inventory

### Hangboards

- **90 built-in boards** with high-resolution artwork and numbered holds: Metolius (13 products),
  Beastmaker 1000/2000, So iLL (10), Antworks, Moon, Tension (Flash Board, Grindstone family),
  Crusher, Kraxl, ERZI, MAX CLIMBING, Entre Prises, Trango Rock Prodigy, Eva López
  Progression/Transgression, Problemsolver, DRCC, Vola, ALPIDEX, Nicros, Decathlon Ballsy, Core,
  OCUN, Griptonite smartrock, Frictitious Megalith, OK Board Crag and more.
- **Custom board from a photo**: cut out, align, number the holds. Since 4.1.3 the background is
  removed automatically with Apple Vision.
- **"Request a board"** in-app (4.1.4). Missing boards "ship with the next update".
- Hangboard Manager screen: list of board thumbnails grouped by manufacturer, one selected board.

### Plans and exercises

- **Custom training plans** made of exercises with sets, hang times and rest times. Each exercise
  stores which hold to use for the left and right hand (by hold number), a duration or rep count,
  and a pause.
- **Exercise library with silhouettes**: Dead Hang, Bent-Arm Hang, Offset Hang, Pull-up, Offset
  Pull-up, One-arm Pull-up, L-Hang, Front Lever, Knee Raises, Push-ups, Sit-ups, plus floor, gym
  (with weight) and prehab exercises with photos.
- **Ready-made preset plans per board**, e.g. "Beastmaker 1000 - Beginner Level", "Metolius Rock
  Rings - 10 Minute Sequence", "Trango Rock Prodigy - Beginner Level".
- **Community plans** shared through BT Online, downloadable for free.
- **Automatic plan generator** (Android listing): "answer a few questions and get a multi-week plan
  matched to your level and goal".
- Manage multiple plans; training reminder every 2, 3, 5 or 7 days; "tips for healthy training".

### Workout runner

- Header "Exercise 1/5" with a segmented progress bar, pause and close buttons.
- **NEXT strip** ("Next: Dead Hang") with previous/next arrows.
- **Giant single countdown digit** in the centre, exercise name below in pink.
- **Board image with the active holds highlighted** (green and blue circled numbers) and
  "Left: 4 / Right: 4" hold labels at the bottom.
- **Voice cues** count every hang, rest and rep and announce phase changes ("hang, rest, switch
  hands") so "your eyes stay on the board, not on the screen". Signal tones as an alternative.
  Background music keeps playing.
- **Apple Watch**: browse plans and start the session from the wrist, haptic feedback on every
  change, recorded as an Apple Health workout with heart rate and activity rings.

### Habits, streaks, achievements (new in 2026)

- **Home "Today" tab**: streak flame with day count, plan-progress ring ("11 days, Week 3 / 7"),
  week dots marking training and rest days, a "Next up" card (plan name, exercise count, duration,
  board) with a big "Start Training" button, today's habits checklist, and counter goals ("Go
  bouldering 47 / 100").
- **Habits tab**: daily habits or counters, week/month/year views, streak "freezes" for unplanned
  breaks, up to 3 reminders per day. Planned rest days count towards the streak.
- **Achievements tab**: activity bar chart, tiles for streak / workouts / habits-today percentage,
  and 31 hexagonal medals in four categories (e.g. Consistency: First Series, One week, Two weeks,
  Three weeks, One month, Two months). The website's marketing names seven gold medals: First Send,
  Chalked Up, Iron Grip, Board Regular, Crimp Master, Iron Flame, Statics Pro (365-day streak).
- Home Screen and Lock Screen widgets, Control Center toggle, habit check-in from the widget.

### Data and platform

- iCloud sync with no sign-up; works fully offline.
- BT Online: create plans in the browser, download to the app, share with friends.
- Bottom tabs: Home, Training, Habits, Achievements.
- App is 198 MB (board artwork).

### Explicitly missing

- No load or added-weight logging per hang (long-standing request: "8 hangs x 5 reps x 40
  entries" in notes is too much).
- No analytics beyond activity counts; no assessment tests; no workload or volume charts.
- No non-Apple sync (Android is local).
- Android build is brand new and unproven (10+ installs); an earlier Android attempt was described
  as buggy by a 2024 roundup.

## UX observations

- **Two different apps in the wild.** The App Store screenshots still show a 2015-era design (thin
  light-blue digits, lime green header, iPhone 6 frame). The website shows a 2026 redesign with a
  soft green accent, card layout, and a four-tab bar. Expect the store listing to be misleading.
- **Runner is uncluttered**: one huge digit, one board image, one "next" strip. Readable from the
  floor. The board image with highlighted holds removes the "which pocket was it?" problem.
- **Voice over beeps** is the defining choice. Reviewers who like it really like it ("voice
  reminders preventing breaks").
- **Paywall placement**: creating plans and boards is free, but pressing Start Training requires
  Pro. Users can build everything and then hit a wall at the first hang. No paywall complaints in
  the reviews sampled yet, but the switch is only two months old.
- **Navigation friction** reported: selecting routines goes through "manage workouts"; non-hanging
  exercises (sit-ups, push-ups) behave oddly inside a hang-oriented runner.

## Monetization

- Was a $2.99 one-time purchase for a decade.
- Since v4.1.0 (Jul 11, 2026): free download, **Boulder Trainer Pro** required to start workouts,
  check in habits and view achievements. Weekly $1.99, yearly $17.99, lifetime $39.99. Loyalty tiers
  for prior purchasers ($11.99/yr, $24.99 lifetime); prior purchasers keep training free.
- No ads, no content upsells.

## What users say

Positive:

- "Amazing workout timer and beginner session for my Metolius Simulator 3D... voice prompts and a
  timer that's very customizable!"
- "I've been using this app for over two years and love the ability to easily create my own
  programs. The countdown feature is very useful."
- "Manages several hangboards with different routines per training cycle" and syncs across devices
  via BT Online.
- "It's super concentrated, a little habanero session. And because it's not overwhelming, I have no
  excuse."

Negative:

- "It can't keep time very well... a 5 second countdown takes about 7 seconds" (2020; developer
  asked for details).
- "Most boards are labeled incorrectly... exercise 4 references position 14 not shown" (2017;
  developer replied that presets must be chosen after selecting the board).
- Requests: weight tracking without notes, next-hang preview during rest, filtering plans by board,
  duration preview, educational content and finger-care warnings, interval announcements during
  long hangs.
- Third-party: "Limited pre-made workouts, Android version buggy" (climbernews, 4/5); "Best for
  owners of uncommon or DIY hangboards" (thehangboard.com).

## Takeaways for our MVP

1. **Board picture with highlighted holds is the feature to envy.** It is the one thing neither
   BoulderFIT nor Crimpd offers, and it maps directly onto "which hold, which hand". A small
   curated board list (Beastmaker 1000/2000, Metolius Simulator/Project, Tension Grindstone, Moon,
   Lattice edges) covers most users; a photo-your-own-board flow can come later.
2. **Voice cues are a differentiator worth offering as an option** alongside beeps, especially for
   eyes-closed max hangs.
3. **Their paywall move opens a gap.** A free, ad-free timer that starts workouts without a
   subscription now looks generous next to Boulder Trainer Pro.
4. **Android is wide open.** Boulder Trainer's Android build is weeks old with almost no installs.
5. **Habit and streak mechanics** are cheap to add later and clearly resonate (the whole 2026
   relaunch is built on them), but they are not MVP.
6. **Keep the store listing honest and current.** Their decade-old screenshots are a warning.

## Sources

- App Store: https://apps.apple.com/us/app/boulder-trainer-hangboard/id770657161 (metadata via
  iTunes lookup API; IAP list and version history from the listing page)
- Google Play (Android, July 2026):
  https://play.google.com/store/apps/details?id=com.bufumufu.bouldertrainer
- Website and current screenshots: https://www.boulder-trainer.com/
- climbernews, "Best Hangboard Apps": https://climbernews.com/best-hangboard-app/
- thehangboard.com, "Best Hangboard Apps and Timers":
  https://thehangboard.com/blogs/news/hangboard-apps
