# Gen Z workout mode

The workout gear menu remembers Sound, Vibration and Gen Z mode per device. Gen Z mode is off
by default. Toggling it glides the timer into its compact share while the video fades in below;
toggling off, or finishing the run, reverses the animation. Compact hides the set/rep row and the
next-up preview, keeping the phase label, grip guidance and digits, so the video takes the larger
share of the screen. If less than 120 points remain, video is temporarily hidden.
The finished/ended summary stays full screen.

## Playback

The timer remains the only clock. A run-scoped ledger assigns one clip to each hang, cycling
evenly through the content buckets (gta, subway, roblox) so no source dominates; recovery retains
the previous hang’s clip. Initial prep uses the first hang’s clip. Clips loop,
pause with the timer, and stop when the app is inactive. Back restores the same assignment and
restarts playback. Disabling releases the player but keeps the run’s assignments. Source loading,
autoplay rejection and decoder errors are isolated from the timer and session recording.

Native uses SDK 57 expo-video. Web uses a small HTML video adapter so rejected play promises can
be handled rather than becoming unhandled errors. Both use the same tested playback controller.
There are no third-party runtime requests, streaming URLs or media accounts. Native assets work
in airplane mode; web requires its usual same-origin static assets to have loaded.

## Source and asset pipeline

All sources come from public YouTube embeds inspected on [OrbitalNCG+’s shop](https://ko-fi.com/orbital2ncg/shop).
The catalog records the creator’s reuse claim; it does not assert an independently verified app license.
Reuse has been cleared, so the app shows no attribution label. `assets/brainrot/CREDITS.md` still
links each source listing for the record.

Requirements: current yt-dlp, Node, FFmpeg and ffprobe. Downloaded masters, metadata and QA images
live in `.media-work/`, ignored by Git and Metro. A local yt-dlp installation in `.media-work/tools`
is used when available; otherwise the script uses the system executable.

```sh
node scripts/brainrot.mjs download
node scripts/brainrot.mjs catalog
node scripts/brainrot.mjs posters
# Review candidates, then set selected/review in assets/brainrot/catalog.json.
node scripts/brainrot.mjs build
node scripts/brainrot.mjs verify
```

`catalog` recreates the candidate list, so do not run it over a reviewed selection unless deliberately
starting a new curation pass. `build` reuses valid clips with matching source ranges. Remove the affected generated
MP4 when changing encoding settings. Source IDs deduplicate downloads, but visual
review is still necessary: vertical and landscape uploads can contain identical gameplay.

The pack has 48 twenty-second clips. Encoding uses silent H.264/yuv420p MP4, 30 fps, fast-start metadata,
a maximum 720-pixel long edge, and a 650 kbps target. Video plus posters must stay below 100 MB.
Shipped MP4s use Git LFS. Run `git lfs pull` after checkout before building or testing media.

`verify` checks every file’s full decode, codec, audio absence, frame rate, dimensions, duration,
SHA-256, poster existence and total pack budget. The runtime manifest is generated together with the
media manifest so the app only imports local assets.

## Validation

Run the four repository checks plus `node scripts/brainrot.mjs verify`. Native testing needs a freshly
built app after adding expo-video. The timer must remain usable when media fails. Test sound/vibration
independently of video, background/foreground transitions, long hangs, rapid toggles, Back/Skip,
board-guidance layout, large text, saved/draft runs and completion. Real-device timing, thermal and
battery measurements are separate from emulator/browser smoke tests.
