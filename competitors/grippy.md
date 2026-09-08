# Grippy (Beastmaker workouts)

> The official Beastmaker app, built by gym-software company Griptonite. Coach-authored workouts
> with hold overlays for the Beastmaker 1000/2000, plus optional force sensing via the Motherboard
> hardware. Free, account-gated, and effectively unmaintained since October 2024.

_Researched 2026-09-08. Based on the App Store and Google Play listings (metadata via the iTunes
lookup API and the Play page), store screenshots, user reviews and developer replies,
griptonite.io and beastmaker.co.uk, the Griptonite training FAQ, and third-party write-ups._

## Snapshot

| Field         | Value                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------- |
| Developer     | Griptonite, a trade name of Cascom Ltd (UK). Gym competition/route-management platform vendor     |
| Partner       | Beastmaker (replaced the original official Beastmaker app, which was shut down)                   |
| Site          | https://www.griptonite.io/grippy                                                                  |
| Platforms     | iOS 12.1+ (iPhone, iPad), Android. No watch app, no web app                                       |
| Bundle / pkg  | `com.griptonite.grippy`                                                                           |
| Price         | Free. Play Store lists in-app purchases of $9.99–$99.99 but the listing never explains them       |
| Ads           | No third-party ads, but repeated in-app upsell of the Motherboard hardware (about £330–£407)      |
| iOS stats     | 2.7 stars from 18 ratings. v2.0.7 on Oct 7, 2024 (crash-fix release). 49 MB                       |
| Android stats | 50K+ downloads, 4.3 stars from ~151 reviews. v2.0.8 on Oct 2, 2024                                |
| First release | April/May 2020                                                                                    |
| Languages     | English, Dutch, French, German, Italian, Spanish                                                  |
| Account       | Required to use the app (the most common complaint)                                               |
| Status        | No release in ~23 months; Griptonite's site now leads with its gym products                       |

## Positioning

"Get a Grip on your progression." Grippy is a hardware-adjacent companion app: coach-branded
Beastmaker workouts, hold-by-hold visual guidance for the two Beastmaker boards, and "Beastmarks"
benchmark tests that get real numbers only when paired with the Motherboard force-sensing backboard.
The FAQ frames it as usable on any board if you match hold types, but everything visual assumes a
Beastmaker.

## Feature inventory

### Workout library

- **Browse / Saved / Mine** tabs with a Filter button.
- **Top Coaches** row (Adam Watson, Dan Varian, Neil Gresham, Savannah Pena and others) with coach
  profile pages (photo, location, favourite button).
- **Popular Workouts** cards with coach attribution, star rating and rating count (e.g. 4.2k).
- **Beastmaker Official** workouts, including the classic tiered "Beasty" workouts carried over
  from the old app (e.g. "Beasty 5a", graded by climbing level). Users report the grading is
  sandbagged and the beginner set is thin.
- **Custom workouts** for any board: choose holds for left and right hand, hang time or reps, rest.
  The editor asks for confirmation between steps, which users find slow for 5–10 s breaks.

### Timer and hold guidance

- **Landscape-locked** timer screen (users ask for portrait).
- Green "hang" panel with a **Beastmaker board illustration and the active holds highlighted** in
  bright green.
- **Per-rep checkboxes**: tick off reps as you go; you can uncheck reps you missed so progress
  tracking stays honest.
- Transport controls: restart, previous, pause, next.
- **Hangtime counter** ("7s Hangtime") accumulating actual time under tension.
- Audio: a "robot" voice or beep option (reviewers say the switch does nothing and the sounds are
  "really ugly and annoying"), plus rotating motivational messages that cannot be disabled.
- Known gaps from reviews: no visible countdown during short rests, short rests cannot be skipped
  without resetting the set, no warning beep before the next hang (a feature the old Beastmaker app
  had), countdown disappears just before a set starts, current exercise name not shown during the
  hang, workouts ended early are not saved, post-set prompt asks for reps but not seconds hung.

### Benchmarks ("Beastmarks")

- Tiered benchmark workouts of increasing difficulty for all levels.
- **Pull Down Test** on sloper, slot, 20 mm and 15 mm holds, per hand, reporting average load as a
  percentage. Requires Bluetooth pairing with a Motherboard.
- Media/selfie sharing from benchmark results (reported stuck on a loading spinner).

### Progress tracking

- **Workout history** with a monthly chart: daily hangtime bars plus a cumulative line, "Hangtime
  this month" total, month navigation, and a list of sessions showing coach and duration.
- Profile tab exists but is thin ("so much untapped potential").
- Added-weight logging in whole kilograms only; entering decimals caused a save error. No kg/lb
  switch.

### Motherboard hardware integration

- Beastmaker Motherboard: electronic backboard with multiple force sensors, Bluetooth, replaceable
  AA batteries (8–12 months). Fits Beastmaker 1000 or 2000 only (separate models). Price about
  £330 for the board, £407 bundled with a Beastmaker.
- App shows real-time load, left/right hand and arm bias, peak force, hang at a % of bodyweight,
  and detects stepping off. No pull-up detection.
- Also used at gyms ("linked up to the Motherboard at my local gym").
- Unofficial open API (`hangtime-grip-connect`); third-party apps Heli Hero and Hang Time also talk
  to the board.

### Explicitly missing

- No use without an account (login/logout and password-reset failures are the top 1-star theme).
- No Apple Watch, no web, no widgets, no background/lock-screen timer mentioned.
- No board graphics for non-Beastmaker boards.
- No lifetime stats, no analytics beyond monthly hangtime, no plans or scheduling.
- No unit switching, no portrait timer.

## UX observations

- **Visual style**: 2020 startup look, deep blue gradients, big white display type, coach photos,
  green hang panel. The screenshots are polished; the reviews describe a rougher reality (crashes,
  layout overflow on iPhone SE, media that never loads).
- **Per-rep tick-off** and the **hangtime metric** are two small ideas that make logging honest and
  motivating.
- **Account wall + hardware upsell** dominate sentiment: "Why the account requirement all of the
  sudden? I want to simply track my training", "repeatedly asks about purchasing the motherboard
  (~$300) without remembering preferences".
- **Stale**: the last release fixed a launch crash in October 2024 and nothing has shipped since.

## Monetization

- Free app; the business is selling Motherboards (and Griptonite's gym SaaS). In-app purchases
  appear on the Play listing ($9.99–$99.99) without any description; treat as unexplained.
- Developer reply on Play captures the model: "we work really hard to bring you this service (for
  free) and poor reviews really make it hard for us."

## What users say

Positive:

- "Best app I've used so far for hangboard workouts! It's a clean interface and easy to make your
  own workouts."
- "I like that you can uncheck reps that you missed to accurately track your progress."
- "the UI is simple and easy even when you get too pumped out to touch the screen accurately."
- "used it at my local gym linked up to the Motherboard and that was pretty cool."

Negative:

- "Why does it even require an account to work? I just need a simple timer."
- "The sounds in the app are really ugly and annoying... setting to change from robot to beep
  doesn't seem to do anything."
- "Old app was better... annoying sounds for start & stop, excessive advertising for $350
  accessory, and non-adjustable timers."
- "The short rest doesn't have a countdown visible. You can't skip short rest... If you end the
  workout prematurely it won't be saved."
- "If you climb anything less than V5 and own a beastmaker 2000 you probably won't find any
  workouts you can complete."
- "This app is at best a late beta version... constantly crashes."

## Takeaways for our MVP

1. **Never require an account for the timer.** Grippy's rating collapsed on this alone; BoulderFIT
   and Boulder Trainer both work offline with no sign-up.
2. **Steal the small things**: highlighted holds on a board graphic, per-rep tick-off (including
   un-ticking a failed rep), and a cumulative "time under tension" metric per session and month.
3. **Sound design matters.** Ugly or unskippable audio is a recurring 1-star reason across Grippy
   and Crimpd. Ship pleasant, distinct cues with a 10-second warning before the next hang, and let
   users mute the extras.
4. **Rest handling**: always show the countdown during rest, allow skipping rest without resetting
   the set, and save partially completed workouts.
5. **Portrait and landscape** both need to work; do not lock orientation.
6. Grippy shows that a big brand plus coach content is not enough if the app is abandoned. An
   actively maintained, board-agnostic timer can win Beastmaker owners.

## Sources

- App Store: https://apps.apple.com/us/app/grippy-beastmaker-workouts/id1505768255 (metadata via
  iTunes lookup API; reviews from the listing)
- Google Play: https://play.google.com/store/apps/details?id=com.griptonite.grippy
- Griptonite Grippy page: https://griptonite.io/grippy/ · Training FAQ:
  https://www.griptonite.io/training/faq/ · Company: https://www.griptonite.io/
- Beastmaker app page: https://www.beastmaker.co.uk/collections/the-beastmaker-app · Motherboard:
  https://www.beastmaker.co.uk/products/motherboard
- Ascension Rock Club, "Griptonite Challenge #4: Get Grippy":
  https://ascensionrockclub.substack.com/p/griptonite-challenge-4-get-grippy
- thehangboard.com, "Best Hangboard Apps and Timers":
  https://thehangboard.com/blogs/news/hangboard-apps
