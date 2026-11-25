"""Page 06: Climb. MoonBoard problems, circuits, lights, setup."""
from pagekit import Page
import screens_climb as S


def build(doc, index):
    p = Page(doc, '06 Climb', 'climb')
    p.heading('Climb', 'The MoonBoard, offline. Hold colours are the one exception to the palette: they are the LED colours on the '
              'wall (green start, blue hold, red finish), always paired with a ring shape and a word, never used for anything else.')
    p.screen('intro', 'Climb · no board yet', 'Before setup: what it is, one action.', lambda b, T: S.intro(b, T))
    p.screen('list', 'Problems', 'Board switcher, lights, search, filters, list.', lambda b, T: S.climb_list(b, T), h=1080)
    p.screen('empty', 'No projects yet', 'An empty view says what fills it.', lambda b, T: S.climb_list(b, T, 'Projects', empty=True))
    p.screen('mine', 'Mine', 'Problems you set, and where to set one.', lambda b, T: S.climb_list(b, T, 'Mine'))
    p.screen('filters', 'Filters', 'Grade range over a histogram of problems.', lambda b, T: S.filters(b, T))
    p.screen('circuits', 'Circuits', 'Playlists climbed in order.', lambda b, T: S.circuits(b, T))
    p.newrow()
    p.screen('problem', 'Problem', 'The wall, legend and status. Swipe for the next.', lambda b, T: S.problem(b, T))
    p.screen('problem-scrolled', 'Problem · scrolled', 'Stats and your log under the wall.', lambda b, T: S.problem_full(b, T))
    p.screen('problem-lit', 'Lit on the wall', 'Counting tries; Sent it logs the send.', lambda b, T: S.problem(b, T, lit=True))
    p.screen('reconnect', 'Lights dropped', 'Said in the header; the wall is never covered.', lambda b, T: S.problem(b, T, reconnect=True))
    p.screen('own', 'Your own problem', 'Share, edit and delete live in its ⋮.', lambda b, T: S.own_menu(b, T))
    p.screen('log-send', 'Log this go', 'Sent or not yet, exact tries, how it felt.', lambda b, T: S.log_send(b, T))
    p.screen('circuit-sheet', 'Add to circuit', 'Tick the circuits it belongs to.', lambda b, T: S.circuit_sheet(b, T))
    p.newrow()
    p.screen('new', 'New problem', 'Press a hold: a loupe shows it large and snaps to it.', lambda b, T: S.new_problem(b, T))
    p.screen('save', 'Save problem', 'Name, grade, feet, a note.', lambda b, T: S.save_problem(b, T))
    p.screen('circuit', 'Circuit', 'Problems in order.', lambda b, T: S.circuit(b, T))
    p.screen('circuit-edit', 'Edit circuit', 'Reorder, remove, rename.', lambda b, T: S.circuit_edit(b, T))
    p.screen('circuit-run', 'Circuit run', 'One problem at a time, tries and Sent it.', lambda b, T: S.circuit_run(b, T))
    p.screen('circuit-done', 'Circuit done', 'What was sent, saved to the log.', lambda b, T: S.circuit_run(b, T, done=True))
    p.newrow()
    p.screen('setup-layout', 'Setup · layout', 'Step 1 of 3.', lambda b, T: S.setup(b, T, 'layout'))
    p.screen('setup-angle', 'Setup · angle', 'Step 2 of 3, drawn as the wall from the side.', lambda b, T: S.setup(b, T, 'angle'))
    p.screen('setup-holds', 'Setup · hold sets', 'Step 3 of 3.', lambda b, T: S.setup(b, T, 'holds'))
    p.screen('lights-prompt', 'Got lights on it?', 'After a first setup.', lambda b, T: S.lights_prompt(b, T))
    p.screen('board', 'MoonBoard settings', 'The board, other boards, remove.', lambda b, T: S.board_settings(b, T))
    p.screen('session', 'Board session', 'Derived from the log: a 30-minute gap starts a new one.', lambda b, T: S.board_session(b, T), h=1000)
    p.newrow()
    for ph, nm, note in [('why', 'Connect · why', 'Bluetooth is asked for only here.'), ('searching', 'Connect · searching', ''),
                         ('found', 'Connect · found', 'Several boards: closest first.'), ('off', 'Bluetooth off', ''),
                         ('none', 'No board found', 'Three things to check.'), ('test', 'Check the lights', 'Four corners.'),
                         ('denied', 'Bluetooth blocked', ''), ('fix', 'Fix the lights', ''), ('done', 'Lights connected', '')]:
        p.screen(f'connect-{ph}', nm, note, lambda b, T, ph=ph: S.connect(b, T, ph))
    p.screen('lights', 'Board lights', 'Settings for the LED kit.', lambda b, T: S.lights_settings(b, T))
