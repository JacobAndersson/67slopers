# Gen Z mode validation

Validated locally on 2026-09-11. This report distinguishes automated checks, observed behavior,
and device checks that still need hardware.

## Assets

- 120 candidate excerpts catalogued from 12 downloaded recordings; 48 excerpts selected from
  11 distinct recordings. One recording was rejected as a duplicate orientation of another.
- 16 GTA, 16 Subway Surfers, and 16 Roblox clips, each 20 seconds.
- Total MP4 plus JPEG size: **78,341,978 bytes**, below the 100 MB budget.
- All 48 MP4s passed full FFmpeg decode, H.264/yuv420p, 30 fps, maximum 720-pixel edge,
  duration, silent-track, and SHA-256 validation. The repository test also checks fast-start
  metadata, exact pack membership, source links, and Git LFS pointer mistakes.
- Visual curation used candidate posters and seven sampled frames across each selected clip.
  This is sampled visual review, not a frame-by-frame review of all footage.
- Sources, discovery dates, creator claims, YouTube metadata, and selected ranges are recorded in
  `assets/brainrot/sources.json`, `catalog.json`, `manifest.json`, and `CREDITS.md`.
- A repeat build reused the selected videos and regenerated a formatted manifest successfully.

## Automated checks

| Check                              | Result                          |
| ---------------------------------- | ------------------------------- |
| `npm run typecheck`                | Pass                            |
| `npm run lint`                     | Pass                            |
| `npm run format:check`             | Pass                            |
| `npm test`                         | 86 tests pass                   |
| `node scripts/brainrot.mjs verify` | All 48 clips pass               |
| `npx expo export --platform web`   | Pass                            |
| `npm run build:android`            | Release APK builds successfully |

Tests cover legacy settings migration, defaults, shuffle cycles, no immediate repeat across
cycles, stable Back assignments, failed clips, nested hangs, long/consecutive/no-hang cases,
split and crop calculations, and asynchronous load/play/disposal races. Existing timer,
workout, session, and board tests also pass.

## Browser observations

Chrome, local Expo app:

- Settings menu works, remembers Gen Z mode, and dismisses with Escape.
- A 390 × 844 viewport shows a 422-point timer and 422-point gameplay pane.
- The loaded video URL is a local bundled asset; idle playback is paused.
- Start advances video. Pause holds the exact current time across observations.
- Skip to the next hang selects a different clip; Back restores the preceding assignment at
  time zero. Recovery retains the preceding hang's clip.
- Turning mode off removes the video element; turning it on restores the assignment.
- At 844 × 390, video is omitted so timer controls remain available.
- Ending removes video and returns a full-screen summary. Finish saves the session and returns
  to Home. Temporary viewport overrides were reset.

The existing Home session/calendar rendering emitted a nested-button development warning after
saving; this feature does not change those components.

## Android observations

Android API 36 emulator, 1080 × 2400, locally built release APK:

- Airplane-mode playback loads and advances from bundled media.
- Video occupies the lower half at normal text size, with timer and controls visible above.
- Captures of the video region before and after Pause have identical pixel hashes; running
  captures differ.
- Sound and Vibration settings can be toggled independently of Gen Z mode.
- Background/foreground navigation returns to a working timer and video.
- At 200% system text size, the upper pane expands and controls remain visible. Changing system
  font size restarts the Android activity; the large-text runner was reopened after that restart.
- Large-text testing exposed an idle-surface issue. Native playback now retains its poster until
  playback has started, even if the decoder reports a first frame early. The final release APK
  passed a fresh offline launch at 200% text size with its poster visible, followed by advancing
  video frames after Start.

Emulator screenshots and logs are in ignored `.media-work/`. Cue preferences and system text size
were restored, airplane mode was disabled, and the task emulator was stopped after testing. The emulator was launched without
audio, so this does not certify audible cues, vibration strength, or physical-device latency.
The SDK emits a handled PiP warning with PiP disabled; PiP remains intentionally disabled.

## Hardware follow-up

Still requires iOS and physical Android hardware: audible/haptic cue timing, audio mixing with
other apps, a 30-minute battery/thermal run, interruption and decoder stress tests, screen-reader
navigation, and grip-guidance layouts across device sizes. Automated lifecycle/error tests are
not a substitute for these device checks.
