# Competitors

One markdown file per competitor, documenting its feature set, UX, monetization, user sentiment and
what it means for our MVP. Each doc follows the same sections so apps can be compared side by side:
Snapshot, Positioning, Feature inventory, Hands-on walkthrough (where we ran the app), UX
observations, Monetization, What users say, Takeaways, Screenshots, Sources.

Screenshots live in `screenshots/<app>/`, captured from the Google Play builds on a Pixel 7 /
Android 16 emulator and downscaled to 540 px wide.

| App                                   | Type                                 | Platforms                   | Price model                                       | Hands-on |
| ------------------------------------- | ------------------------------------ | --------------------------- | ------------------------------------------------- | -------- |
| [BoulderFIT](boulderfit.md)           | Pure hangboard interval timer        | Android                     | Free with post-workout interstitials, 25 kr ad-free | Yes      |
| [Crimpd](crimpd.md)                   | Full training platform               | iOS, Android, web           | Free tier + $59.99/yr Crimpd+                     | Yes, logged out |
| [Boulder Trainer](boulder-trainer.md) | Board-centric timer with voice cues  | iOS, watchOS, Android (new) | Free to build plans, Pro sub to train (229 kr/yr) | Yes, up to paywall |
| [Grippy](grippy.md)                   | Beastmaker companion, force hardware | iOS, Android                | Free, account required, sells Motherboard         | No: Play refuses install on Android 16 ("made for an older version of Android") |

## Other hangboard apps on Google Play (2026-09-08)

From Play searches for "hangboard", "hangboard timer", "fingerboard timer", "hangboard training" and
"finger strength climbing". Ratings and install bands are from the listings that day.

| App (package)                                                   | Installs | Rating | Model                     | Notes                                   |
| --------------------------------------------------------------- | -------- | ------ | ------------------------- | --------------------------------------- |
| HangTight - Hangboard Timer (com.newtonapps.hangtight)          | 10K+     | 4.55   | Ads, $0.99 IAP            | Closest BoulderFIT peer; last update Oct 2025 |
| HangTime - Hangboard Training (nl.stevie.ray.hangtime)          | 10K+     | 4.07   | IAP $1.89–$18.99          | Updated Aug 2026; works with Motherboard |
| Hangboard Repeaters (com.mikeschen.www.hangboardrepeaters)      | 10K+     | 4.06   | Free                      | Repeaters-only timer, Jul 2026          |
| Linebreaker Hangboard Training (com.target10a.LinebreakerApp)   | 10K+     | -      | Free                      | Hardware companion, Aug 2026            |
| Zlagboard (com.zlagboard)                                       | 10K+     | -      | IAP $29.99–$299.99        | Hardware companion                      |
| Hangboard Timer (com.jookare.HangboardTimer)                    | 1K+      | -      | Free                      | Updated Aug 2026                        |
| Metolius hangboard training PRO (tankt72.simulator3dtrainingpro)| 1K+      | 4.42   | Paid                      | Board-specific presets, Apr 2026        |
| Project Hangboard Training PRO (com.tankt72.metoliusprojecttrainingpro) | 1K+ | 5.0 | Paid                    | Same developer, Metolius Project        |
| Rock Prodigy Hangboard Trainer (com.trango.hangboardtrainer)    | 1K+      | -      | Free                      | Trango official, Jul 2025               |
| Climb Craft - Hangboard Gym (com.kikkoapps.hangboardtraining)   | 1K+      | -      | Ads, $1.99 IAP            | Nov 2025                                |
| GainsLab - Climbing Training (com.pinchd)                       | 500+     | -      | Free                      | Aug 2026                                |
| Daily Hangboard (com.peaknorthlabs.dailyhangboard)              | 100+     | -      | $4.99 IAP                 | May 2026                                |
| Hang Timer - Climbing (com.dan_movie.ClimbTimer)                | 100+     | -      | $2.49 IAP                 | Apr 2026                                |
| MaxiGrip Hangboard Trainer (com.softwareoverflow.maxigriphangboardtrainer) | 50+ | - | Ads                     | Oct 2025                                |
| Send Hangboarding and Gym Log (com.sendapp.workout)             | 50+      | -      | IAP $3.99–$74.99          | May 2026                                |
| REPD: Hangboard Timer & HIIT (com.maximilianrach.repd)          | 10+      | -      | Free                      | May 2026                                |
| BoulderHang - Hangboard Timer (com.jkhosting.BoulderHang)       | 10+      | -      | IAP $24.99–$199.99        | Sep 2026, new                           |
| Climbing Training: Hangboard (com.tuentreno.escalada)           | 10+      | -      | IAP $3.49–$8.99           | Sep 2026, new                           |
| Tenar: Climbing & Training (net.tenar.app)                      | 10+      | -      | IAP $5.99–$94.99          | Sep 2026, new                           |

Adjacent platforms seen in the same searches: Lattice (com.mylatticetraining.app, 10K+, 3.42,
$29.99–$204.99), Griptonite (com.griptonite.app, 100K+, 2.59), Kilter Board (50K+, 1.40),
MoonBoard (100K+, 1.68), Stōkt (100K+), KAYA (100K+), BoulderBot (5K+, 5.0), Climbah (1K+, 4.2).

Takeaway: on Android the hangboard-timer niche is crowded with small indie timers in the 10+ to
10K+ install band, none above 4.6 stars, and most either ad-supported or hardware-bound. Nothing
combines an ad-free timer, board pictures and cross-platform sync.

Candidates to document next: HangTight, HangTime, hang! Hangboard Timer (iOS), HangClimb Timer
(iOS, Apple Watch), Grips & Grades (Android), Sequence (periodisation, Tindeq), Lattice app.
