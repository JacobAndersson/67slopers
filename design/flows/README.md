# Storyboards

The **06 Storyboards** Penpot page maps six implemented journeys:

| Intent            | Sequence                                                            | Important behavior                                                             |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Train now         | Home → preparation → hang/rest → summary → Home                     | Home Start counts down immediately. The session is saved when the timer stops. |
| Build a workout   | New/classic → optional board → steps → grip → save/start            | Starting an unsaved draft is supported; repeats have sets and reps.            |
| Recover a run     | Unfinished card → continue paused, save as ended, or discard        | Continue preserves the checkpoint. Discard asks for confirmation.              |
| Review and repeat | Calendar/history → session → grade/note → Do it again               | Changed or deleted workouts replay the stored session snapshot.                |
| Share offline     | Overview → QR → scan permission → import preview → save/start       | Invalid codes stay in the scanner. Importing does not save automatically.      |
| End a draft       | Timer → confirmation → saved ended session → optional name → finish | Only performed work counts. Naming the draft keeps it as a workout.            |

Board keys on the map match [the screen inventory](../screens/inventory.json). Action hotspots
connect representative states; cross-page links open a new Penpot preview tab. Countdown,
camera scanning, video, and persistence remain app behavior rather than simulated design behavior.

Motion references from `runner.tsx` and `timer-phase-label.tsx`: phase flip 180 ms, background
and board reveal 250 ms, Gen Z split 300 ms, hang fill 100 ms, summary delay 900 ms. The boards
show representative still states of those transitions.
