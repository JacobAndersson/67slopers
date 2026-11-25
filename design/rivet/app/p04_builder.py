"""Page 04: a workout, read and built."""
from pagekit import Page
import screens_builder as S


def build(doc, index):
    p = Page(doc, '04 Workouts & builder', 'builder')
    p.heading('Workouts & builder', 'A workout is steps: Get ready, Hang, Rest, and repeats of them. Each step carries a rail in '
              'its own colour (Hang Night, Rest Glacier, Get ready and Recover Stone) so the rhythm reads before the words. '
              'A repeat is a soft rail down its left side: the outer one counts sets, the inner one reps. A rest that closes a set is what the timer calls Recover.')
    p.screen('overview', 'Workout overview', 'Read-only. Start sits in the bottom bar.', lambda b, T: S.overview(b, T), h=1470)
    p.screen('new', 'New workout', 'The builder, from the default template.', lambda b, T: S.builder(b, T, 'new'), h=1360)
    p.screen('step-open', 'Step open', 'Tap a step to edit it in place.', lambda b, T: S.builder(b, T, 'edit', open_step='hang'), h=1812)
    p.screen('repeat-open', 'Repeat open', 'Tap a repeat to set its rounds.', lambda b, T: S.builder(b, T, 'edit', open_repeat=True), h=1562)
    p.screen('drag', 'Dragging a step', 'Hold and drag. An empty slot shows where it lands.', lambda b, T: S.builder(b, T, 'edit', lifted=True), h=1452)
    p.newrow()
    p.screen('board-open', 'Choose a board', 'Change opens the boards in place.', lambda b, T: S.builder(b, T, 'new', board_open=True), h=1470)
    p.screen('error', 'Validation', 'The first problem, in words, at the top of Steps.', lambda b, T: S.builder(b, T, 'new', error='Add at least one hang.'), h=1240)
    p.screen('name-error', 'Save without a name', 'Start works without a name; Save needs one.', lambda b, T: S.builder(b, T, 'new', name_error=True), h=1390)
    p.screen('menu', 'Step menu', 'Every move the drag can do, as a sheet.', lambda b, T: S.builder_menu(b, T))
    p.screen('add', 'Add a step', 'Three kinds, each with its rail colour.', lambda b, T: S.add_menu(b, T))
    p.screen('discard', 'Discard changes?', 'Leaving the editor with changes.', lambda b, T: S.discard_sheet(b, T))
    p.newrow()
    p.screen('hold-picker', 'Choose grip', 'Tap a hold or a chip. Grips are mirrored pairs.', lambda b, T: S.hold_picker(b, T), h=1060)
    p.screen('presets', 'Classic workouts', 'Ten protocols by level.', lambda b, T: S.presets(b, T), h=2160)
    p.screen('board-setup', 'Your hangboard', 'Pick the default board.', lambda b, T: S.board_setup(b, T), h=960)
