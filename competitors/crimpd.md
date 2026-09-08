# Crimpd

> Full climbing-training platform from the Lattice Training ecosystem (Tom Randall, Ollie Torr).
> Free workout library plus a paid Crimpd+ tier for training plans. The "ceiling" reference: far
> beyond our MVP scope, but its timer and logging UX set the bar climbers compare against.

_Researched 2026-09-08. Based on crimpd.com (pricing, docs, blog release notes), the App Store and
Google Play listings, store screenshots, user reviews and developer replies, third-party reviews
and forum threads, and a hands-on walkthrough of the Android build (v8.x from Google Play) on a
Pixel 7 / Android 16 emulator without logging in (see [Screenshots](#screenshots))._

## Snapshot

| Field           | Value                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Developer       | Crimpd Inc (US). Sister company/app of Lattice Training. Site: https://www.crimpd.com             |
| Platforms       | iOS (iPhone and iPad, iOS 15+), Android, web app at `my.crimpd.com`                               |
| Apple Watch     | No watchOS app (App Store device list has no Watch entries despite some blogs claiming support)   |
| Bundle / pkg    | `com.crimpd.ios` / `com.crimpd.ui`                                                                |
| Price           | Free tier. Crimpd+ subscription: $12.99/month, $29.99/quarter, $59.99/year (~$4.99/month annual)  |
| Ads             | None. Users call this out positively ("No banners and ads")                                       |
| iOS stats       | v8.5.0 released Sep 5, 2026. 4.6 stars, 100 US ratings (313 across storefronts). 40.5 MB. Age 17+ |
| Android stats   | 100K+ downloads, 4.6 stars from ~608 reviews. Updated Sep 7, 2026                                 |
| Self-reported   | 500k+ downloads, 10M+ workouts logged, 30k+ completed training plans                              |
| First release   | July 30, 2018                                                                                     |
| Release cadence | 7.0 (Mar 2026), 8.0 (May 2026), 8.1–8.4 (Jun–Aug 2026), 8.5 (Sep 2026). Roughly monthly           |
| Account         | Required. Cloud sync across iOS, Android and web                                                  |
| Offline         | Not supported (recurring user request)                                                            |

## Positioning

"Follow workouts crafted by world-class climbers and coaches Tom Randall and Ollie Torr." Crimpd is
a **training app, not a send logger**: the value is coach-authored workouts with a guided timer,
plus a logbook and analytics. Crimpd+ targets "the self-coached climber" who wants to build a
multi-week plan. It is also the delivery vehicle for Lattice Lite 12-week coached plans.

## Feature inventory

### Workout library

- **75+ workouts free, 200+ with Crimpd+.**
- Four top-level categories, each colour-coded throughout the app: Endurance (blue), Power
  Endurance (navy), Strength & Power (red), Conditioning (orange).
- Categories are split into energy-system sub-groups shown as photo tiles with a workout count,
  e.g. Aerobic Capacity, Regeneration, Aerobic Power, Anaerobic Capacity, Bouldering, Finger
  Strength (7 workouts each in the free tier).
- Each workout has a description, per-exercise photos, demo video, an "i" info sheet (targets,
  focus points), and an equipment list.
- Filters by category, equipment and "home-suitable".
- **Playlists** of themed drills (e.g. Paradigm Climbing "Tension & Movement Drills", six free
  drills, Mar 2026).
- Cross-training workouts (recent additions: cross-country skiing, route setting).
- **Workout progressions** (Crimpd+): harder variants of the same workout to step up over time.
- **Custom workouts.** Users can adjust sets, reps, rest between sets and reps, toggle a rep timer,
  set durations to the second, add notes, and reorder exercises. Custom workouts have limitations
  (e.g. added weight is only tracked if created as a "fingerboard" type, per a review).

### Guided timer (workout execution)

- Media header with the exercise photo/video and name ("Dead Hang: 20mm Edge") plus a clipboard
  button for notes.
- Large `mm:ss` countdown with a small tenths digit.
- **"UP NEXT"** row with previous/next arrows to preview the coming exercise.
- **REP 1 / 1** and **SET 1 / 6** counters with an info button.
- Transport bar: previous set, previous rep, play/pause, next rep, next set.
- Audio countdown cues at rep start and end; haptics. Audio scheduling was rewritten in 8.x "so
  cues fire precisely regardless of app load" after long-running complaints.
- "GET READY" alert in the final ten seconds of long rests (8.x).
- **Added-weight suggestion.** For deadhangs the weight to add is auto-calculated from the last
  finger-strength assessment and profile bodyweight.
- **Background mini-player** (8.0): minimise the workout to a bottom bar, keep timer, audio and
  wake-lock while browsing the rest of the app.
- **iOS Live Activities and Dynamic Island** (8.5): timers and open sessions on the Lock Screen
  (iOS 16.2+).
- **In-session logging** (8.0): a table filling in live as you go with weight used, perceived
  effort per set and notes. The log card collapses during work and expands during rest. Extra sets
  beyond the prescription can be added.
- Screen wake-lock during workouts.

### Logbook and history

- Log completion as 25 / 50 / 75 / 100 percent, an effort or difficulty rating (easy to max),
  average grade climbed, and free-text notes. Per-set and workout-level effort since 8.4.
- History tab: chronological list of the last three months, colour-coded by category.
- **Open climbing and cross-training sessions** can be logged in the free tier.
- **Live session logging** (8.1–8.4): "Start Session" stopwatch for open climbing. Log each
  problem with grade, attempts, effort and send status; header shows running counts of problems,
  attempts, ascents and average grade; minimise to a banner; review screen before saving.
- **Climb tags**: location type (gym, spray wall, outdoor, top rope, lead), board (Kilter, Tension,
  MoonBoard), wall angle, style, length, hold types. Location tags persist across sessions.
- Grade scales: V, Font, YDS, French, plus UIAA and Ewbank added in 8.x. Chosen at onboarding or in
  settings and applied everywhere.
- **Personal metric history**: bodyweight, height, and six profile grades (max, session, flash for
  boulder and route) tracked over time with an editable history screen.

### Analytics

- Workload is auto-calculated per workout (training minutes).
- Charts by workout count or total minutes, broken down by category.
- Weekly breakdown trend chart and a three-month summary of training distribution.
- **CSV export** (Crimpd+).
- An analytics redesign to use climb tags is announced for autumn 2026.

### Assessments and Peer Insights

- Built-in **assessment tests** with result history and sparkline: Finger Strength (20 mm edge,
  7 s, max added weight, shown as +lbs and % bodyweight), Power Endurance 60% (time under tension
  vs total duration), Weighted Pull-up, Hip Flexibility. Release 8.0 added Finger Strength
  One-arm, Small Edges, Open Grip, Front-3 Open Drag and Edge Lift.
- **Peer Insights** (Crimpd+): compare test results against climbers segmented by discipline
  (boulder/sport), gender and grade band.
- Profile header shows height, weight, and a bar chart of Max / Session / Flash grades for boulder
  and route.

### Training plans (Crimpd+)

- **Plan builder**: start from scratch or from a Skill Template. Plans start on the first day of
  the week (Sunday in North America, Monday in ISO regions; the start day is not user-selectable,
  a frequent complaint). Recommended max 12 weeks.
- **Skill Templates**: 20+ pre-built six-week modules with Beginner / Intermediate / Advanced /
  Elite variants (A–D selector), an equipment icon row and a "min / week" estimate. Examples seen:
  Base Endurance, Bouldering Mastery, Conquer One-Arm Pull-ups, Bouldering Fitness, Core
  Conditioning. Templates use a 2:1 Base-to-Rest micro-cycle.
- **Phases**: Base, Rest (deload, roughly half volume), Peak. Weeks are labelled (e.g. "Week 3
  PEAK").
- **Week view**: per-category progress bars (e.g. Endurance 1 / 2, Conditioning 7 / 7) with
  completion ticks; workouts listed by weekday with duration; "Schedule" button and list/calendar
  toggle. Colour coding: green done, yellow partial, red skipped.
- Adjust volume per workout, add or delete weeks, clone plans (now including the schedule).
- Guidance baked into docs: "fingerboard workouts must always be done when fresh", 3:1
  Base-to-Rest for custom plans.
- **Lattice Lite** coach-built plans are delivered and tracked inside Crimpd.
- No automatic periodisation: third-party reviewers note "the logic for structuring base, build,
  and peak phases lives in the climber's head, not the app".

### Platform and account

- Account required; data synced across iOS, Android and web.
- **Dark mode** (light / dark / system) since 7.0, still labelled beta.
- Design-system overhaul in 7.0: semantic colour tokens, unified buttons and modals, calmer cards.
- Responsive iPad and browser layouts with dedicated side navigation on large screens.
- In-app subscription management (view plan, renewal date, switch billing period).
- Timezone setting; unit switching lb/kg (a review reports added weight not converting).
- Crash reporting via Sentry; backend rewritten to TypeScript in 8.0.
- Not present: Apple Watch app, offline mode, HealthKit or Google Fit sync (not advertised),
  force-gauge / Tindeq integration, board (Kilter/Tension) app integration beyond tags.

## Hands-on walkthrough of the Android build, logged out (2026-09-08)

Crimpd is a WebView app (Ionic/Capacitor style) whose DOM is exposed to accessibility, so it feels
native enough. What works **without an account**:

- **Home** opens directly with no onboarding: a search field "What do you want to train today?",
  then category sections with photo tiles and counts (Endurance: Aerobic Capacity 12, Regeneration
  10; Power Endurance: Aerobic Power 15, Anaerobic Capacity 23; Strength & Power: Bouldering 12,
  Finger Strength 50, Power 6; Conditioning: Antagonist & Lower Body 7, Core 18, Flexibility 20,
  Upper Body 40, so 213 workouts in total), then **Featured Playlists** (Paradigm Climbing "Tension
  & Movement Drills" 6, Emil Abrahamsson "Technique & Strength Drills" 15, Jonathan Sin "Climbing
  Training Starter Pack" 10, and more), then promo cards for Create Custom Workouts (Crimpd+), Log
  Cross-Training Workouts, Start Open Climbing Session, and an **Assessment Tests** row (Edge Lift
  Test 25 min, Finger Strength Test 20 min, ...).
- **Search** has Category / Equipment / Home Workouts filters. "hang" finds 21 workouts: Density
  Hangs 65/70/75 % (15 min), Hangboard Isometric Holds and Repeaters (10 min), Max Hangs 85/90/95 %,
  Max Hangs One Arm 85/90/95 %, and so on. Cards show image, name, one-line description, category
  icon and minutes.
- **Category page** has Featured and All Workouts tabs.
- **Locked content**: many hangboard workouts (Density Hangs, Hangboard Isometric Holds) carry a
  "Premium Workout" badge; Start Workout / Log Workout / Add to Plan are greyed out and the page
  says "This workout is only available to Crimpd+ subscribers" with an upgrade card (Over 200
  workouts, Training plans, Custom workouts). Free examples: the assessment tests and Emil
  Abrahamsson's sub-max routine.
- **Workout detail**: hero image, category icon and title, three round action buttons (Start
  Workout, Log Workout, Add to Plan), description, variant chips where relevant (A 65 % / B 70 % /
  C 75 %; A Half Crimp / B Open Crimp / C 3FD), a minutes chip, then the exercise list with
  thumbnails: "1 set · 6 reps · 00:10 per rep, Rest 00:20 per rep, Resistance 2/10 RPE" (or "Up to
  Max Load" for tests).
- **Timer** (Emil's Sub-max Daily Fingerboard Routine): media header with photo/video, exercise
  name, an info button (bottom sheet with Resistance, Rest Between Reps, Focus Points), a minimise
  chevron and a clipboard button. Big `mm:ss` plus a small tenths digit. Pressing play starts a
  **10-second "GET READY..." countdown in orange**, then **"GO!" in green** for the hang, then
  **"REST" in blue** with the counter switching to "NEXT REP 2/6"; pausing turns the digits red
  with "PAUSED". Prev/next arrows sit beside the phase label. A card shows SET 1/1 and REP x/6 and
  expands to the in-session log: a "SET 1 4/6 reps" chip, "Set 1" with a green tick, a
  five-segment "How hard was this set?" slider (Easy by default) and Add Note. Transport bar: prev
  set, prev rep, play/pause, next rep, next set. Tapping the clipboard while logged out shows the
  toast "You must be logged in to log your workouts."
- **Mini-player**: the chevron shrinks the workout to a bottom bar (thumbnail, exercise, "Set 1/1 ·
  Rep 4/6", state and time, play, close) that persists across every tab, even the login screen,
  with a "Return to workout" affordance.
- **Training Plans tab** (logged out) is an upgrade card ("Create your own training plans or
  assemble a training plan using Skill Templates", Start Your Training Plan) plus the **Skill
  Templates grid**: Base Endurance (Off-season Base Endurance Training), Bouldering Fitness (Build
  Power Endurance for Long Boulder Problems), Bouldering Mastery (Foundational Drills & Workouts
  for Boulderers), Build Power (Apply Strength through Dynamic Movements), Conquer One-Arm Pull-ups
  (Advanced Training for Difficult Crux Moves), Improve Body Tension (Maintain Tension on Steep
  Terrain), Increase Flexibility (Improve Movement at End Ranges of Motion), Peak Power Endurance
  (Manage the Pump on your Sport Climbing Projects), Progress ... and more.
- **Login walls**: Logbook ("Training History"), Analytics and Profile each show "You must be
  logged in to view..." with a Login/Sign-up button. The side menu lists Log In/Sign Up, Home,
  Training Plans, Training History, Analytics, Profile, Help. The login screen has Log In / Sign Up
  tabs, email-or-username and password fields, and Forgot your password.
- The "Upgrade to Crimpd+" buttons did nothing while logged out, so the in-app purchase sheet was
  not captured; prices above come from the store listings.

## UX observations (from screenshots, release notes and reviews)

- **Visual style.** Clean white cards, single blue accent, bold uppercase display headings,
  category colour system, photography-heavy tiles. Reads as a polished product, not an indie tool.
- **Timer screen is dense.** Video header, countdown, "UP NEXT", counters, transport bar. Great for
  guided circuits; several users say the 8.0 redesign made the **set/rep font too small** to read
  from a hangboard ("I put my phone up on a wall when I hang... I can't see it anymore").
- **Learning curve.** "There is a learning curve initially"; some exercises are vague on whether
  they are timed or rep-based.
- **Navigation.** Hamburger side menu on Android and iPad; iOS users complain swipe-from-left opens
  the menu instead of going back.
- **Audio vs music.** Recurring complaint that cues pause or are inaudible over music through
  earbuds; users ask for audio ducking like the Clock app.
- **Performance.** Slowness and crashes in the Training Plan section (subscriber review), white
  screens on workout start, being signed out on launch. Partly addressed by 8.x rewrites.
- **Logging friction.** Forced per-set difficulty after 8.x ("I prefer to set the difficulty per
  workout just once"); developer re-added workout-level effort in 8.4. Users want to log grades and
  reps during workouts (added in 8.0/8.1) and to change time under tension on route drills.

## Monetization

- Free tier is genuinely usable: full timer, 75+ workouts, logbook, analytics, open sessions.
- Crimpd+ ($12.99 monthly, $29.99 quarterly, $59.99 yearly): 200+ workouts and progressions,
  plan builder, Skill Templates, Peer Insights, CSV export. No trial mentioned. Plans remain saved
  but locked if the subscription lapses.
- UKC forum consensus: the free version is "very good"; Crimpd+ is worth it if you want templates
  and scheduling, less so "just for flexibility and mobility work".
- Third-party verdict: "the best-value pick for V4–V8 climbers who already understand the drills
  and want a structured calendar".

## What users say

Positive:

- "I am officially climbing two grades higher after training... half a year" (App Store, 5 stars).
- "Very well organized: exercises, plans, logs and tests are present and link together in a
  complete training tool. No banners and ads."
- "the weight to add for a deadhang exercise is automatically calculated from the results of your
  last testing session and your profile weight."
- "one of only 2 apps that I happily pay for... Just when I think I want some new functionality,
  the app adds it."
- "Phenomenal app for training for climbing and logging it... Very quick updates from the
  developers."

Negative:

- "Lacking in quality, detail and UI/UX" (1 star): basic program structure, poor videos, no load
  management guidance for beginners.
- "The sets and reps font size is almost not visible... It's as vital as the timer."
- "Slowness and locking up is very aggravating... crashing on a daily basis in the Training Plan
  section."
- "all the videos don't play for the examples of how to properly do the exercise."
- "for untimed exercises, the app counts down the rest before the last set, then jumps straight to
  the log-this-session screen. Confusing."
- "during rest periods the previous exercise is shown, not the one coming up."
- "Would pay for this especially if there was an offline feature."
- "all training plans assume a week starts on Sunday" (cannot change start day).
- Music pauses at countdown beeps; cues inaudible with earbuds.

Developer behaviour: replies to Play Store reviews, references specific fixes and release numbers,
publishes detailed release-note blog posts.

## Takeaways for our MVP

Crimpd is not the MVP target, but it defines what "good" looks like for the pieces we do build:

1. **Timer execution details worth copying**: oversized countdown, "up next" preview, rep and set
   counters, previous/next rep and set controls, end-of-rest "get ready" cue, wake-lock, and a
   background or lock-screen timer (Live Activities on iOS).
2. **Do not repeat their readability regression.** Set and rep counters must be legible from
   two metres away. This is a hangboard app; the phone is on the floor or taped to a wall.
3. **Audio must coexist with music.** Duck rather than pause; make cues audible through earbuds.
   Schedule precisely; Crimpd needed a rewrite to get there.
4. **Logging should be optional and one tap.** Their forced per-set effort rating annoyed users;
   default to a single post-workout log with optional detail.
5. **Free and ad-free is table stakes.** Crimpd's free tier already covers a full hangboard
   routine with no ads. We cannot charge for, or put ads on, a bare timer.
6. **Offline-first** is a differentiator neither app offers well (Crimpd requires an account and
   network; BoulderFIT is local-only but Android-only).
7. **Later**: added-weight suggestion from a finger-strength test, simple weekly volume chart, and
   preset protocols are the natural next layer after the timer.

## Screenshots

Captured 2026-09-08 from the Google Play build on a Pixel 7 / Android 16 emulator, logged out,
downscaled to 540 px. All files live in `screenshots/crimpd/`.

| Area           | Files                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home           | [01 home](screenshots/crimpd/01-home.png), [02 scrolled](screenshots/crimpd/02-home-scrolled.png), [03 custom / log / session](screenshots/crimpd/03-home-custom-log-session.png), [04 assessment tests](screenshots/crimpd/04-home-assessment-tests.png)                                                                                                                                       |
| Library        | [05 search "hang"](screenshots/crimpd/05-search-hang.png), [06 premium locked](screenshots/crimpd/06-workout-detail-premium-locked.png), [07 category](screenshots/crimpd/07-category-finger-strength.png), [08 free workout](screenshots/crimpd/08-workout-detail-free.png), [09 exercises](screenshots/crimpd/09-workout-detail-exercises.png), [19 assessment detail](screenshots/crimpd/19-assessment-detail.png) |
| Timer          | [10 ready](screenshots/crimpd/10-timer-ready.png), [11 get ready](screenshots/crimpd/11-timer-get-ready.png), [12 hang](screenshots/crimpd/12-timer-hang-go.png), [13 rest](screenshots/crimpd/13-timer-rest-next-rep.png), [14 paused](screenshots/crimpd/14-timer-paused.png), [15 set details](screenshots/crimpd/15-timer-set-details-log.png), [16 log needs login](screenshots/crimpd/16-timer-log-requires-login.png), [17 info sheet](screenshots/crimpd/17-exercise-info-sheet.png), [18 mini-player](screenshots/crimpd/18-timer-mini-player.png) |
| Plans          | [20 training plans](screenshots/crimpd/20-training-plans.png), [21 skill templates](screenshots/crimpd/21-skill-templates.png), [22 more templates](screenshots/crimpd/22-skill-templates-more.png)                                                                                                                                                                                              |
| Login walls    | [23 logbook](screenshots/crimpd/23-logbook-login-wall.png), [24 analytics](screenshots/crimpd/24-analytics-login-wall.png), [25 profile](screenshots/crimpd/25-profile-login-wall.png), [26 side menu](screenshots/crimpd/26-side-menu.png), [27 login](screenshots/crimpd/27-login.png)                                                                                                        |

## Sources

- Hands-on walkthrough of the Android build on an Android 16 emulator, 2026-09-08 (screenshots above)
- Site: https://www.crimpd.com/ · Pricing: https://www.crimpd.com/pricing/ · Crimpd+:
  https://www.crimpd.com/crimpd-plus/
- Docs: https://www.crimpd.com/docs/ · Plan builder:
  https://www.crimpd.com/docs/build-a-training-plan/
- Blog release notes: https://www.crimpd.com/blog (7.0 Mar 2026, 8.0 May 2026, Summer 2026 8.1–8.4)
- App Store: https://apps.apple.com/us/app/crimpd/id1252333138 (metadata via iTunes lookup API)
- Google Play: https://play.google.com/store/apps/details?id=com.crimpd.ui
- MWM app analysis: https://mwm.ai/apps/crimpd/1252333138
- thehangboard.com, "Best Hangboard Apps and Timers":
  https://thehangboard.com/blogs/news/hangboard-apps
- Fitness AI Trends, "Crimpd vs Lattice vs Sequence (2026)":
  https://fitnessaitrends.com/blog/crimpd-vs-lattice-vs-sequence-climbing-training-app/
- SENDO, "Best climbing apps in 2026":
  https://getsendo.app/blog/which-climbing-app-should-you-use-2026
- UKC forum, "Is Crimpd+ worth it?":
  https://www.ukclimbing.com/forums/walls+training/is_crimpd_+_worth_it-740622
- MakeUseOf, "4 Climbing Apps for Android": https://www.makeuseof.com/climbing-apps-android/
