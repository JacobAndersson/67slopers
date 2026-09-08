# Product principles

These are the non-negotiables for the hangboard app. Every feature, dependency and
architectural choice is checked against them. When two goals conflict, the earlier
principle wins.

## 1. Everything is local

All data lives on the device: workouts, sessions, notes, settings. There is no server,
no cloud sync and no network requirement. The app must be fully functional in airplane
mode, forever, not just until a "later" cloud feature ships.

Implications:

- No network requests in the app at all. No analytics, no crash reporting that phones
  home, no remote config, no update checks, no ads.
- Storage is an on-device database (see [mvp.md](mvp.md#data-and-storage)). Backups, if
  we add them, are local file export and import that the user controls.
- Only the permissions the timer needs (keep-awake). No location, no
  contacts, no notifications for marketing.
- If sync is ever added, it is optional, additive and opt-in. The local copy stays the
  source of truth.

## 2. No account, ever

Nothing is gated behind sign-up or sign-in. The first screen after install is the timer,
not a form. No email, no password, no OAuth, no "continue as guest".

Implications:

- No identity, no user table, no onboarding wizard that collects personal data.
- Settings are per device. That is a feature, not a limitation.

## 3. Instant startup

The app opens to a usable timer immediately. A climber standing under the board with
chalked hands should never wait for a spinner.

Proposed budgets (measure on a mid-range Android phone, adjust once we have numbers):

| Scenario                        | Target       |
| ------------------------------- | ------------ |
| Cold start to interactive timer | under 1 s    |
| Warm start                      | under 300 ms |
| Tap "Start" to first countdown  | under 100 ms |

Implications:

- Nothing on the launch path touches the network (see principle 1).
- The only work allowed before first paint is loading bundled fonts and reading the
  last-used workout and settings from local storage with synchronous APIs.
- No heavy providers or SDKs mounted at the root. Screens beyond the timer load lazily.
- Keep the JS bundle small: audit every dependency, prefer the platform over libraries.
- Startup time is measured in development and regressions are treated as bugs.

## 4. Free and ad-free

The full app is free. There are no ads, no unlock purchases and no subscription for the
timer. Ads are the single biggest complaint about the closest competitor, and a timer
with a banner under it is not a product we want to ship.

## Design tenets

Not principles, but defaults that follow from how a hangboard timer is actually used
(phone on the floor, on a shelf, or taped to the wall two metres away):

- Legible from across the room: oversized digits, a colour-fill progress background and
  large rep and set counters. Never shrink these to fit more on screen.
- Few taps to start: last workout is preselected, one tap starts it.
- Timing you can trust: the clock is monotonic, not `setInterval`, so 7:3 repeaters stay
  in sync. The app is silent: no beeps, no vibration.
- One appearance. There are no themes and no dark mode; the palette is fixed.
- Cross-platform from one codebase: iOS, Android and web, with native tab bars where the
  platform has them.
