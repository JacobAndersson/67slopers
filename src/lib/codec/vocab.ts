import { grips, type Board } from '../boards';

/**
 * Names the codec refers to by index. APPEND-ONLY: add at the end, never reorder, rename or
 * remove, or existing codes change meaning. The same holds for `BOARD_IDS` (generator order),
 * `PRESETS` (presets.ts) and each board's holds in its layout.json. `codec.test.ts` checks the
 * current order against `vocab.snapshot.ts`.
 *
 * Words are lowercase and matched whole. Their weight comes from their index (see
 * `TABLES.text.wordIndex`): the first 64 are cheapest, then 128, then 128, then 192 more slots.
 */
// prettier-ignore
export const WORDS: readonly string[] = [
  // 64 most common
  'hangs', 'hang', 'max', 'repeaters', 'edge', 'half', 'crimp', 'open',
  'hand', 'drag', 'grip', 'weight', 'added', 'rest', 'warm', 'up',
  'warm-up', 'left', 'right', 'arm', 'arms', 'one-arm', 'feet', 'on',
  'the', 'floor', 'and', 'with', 'mm', 'kg', 'sets', 'reps',
  'min', 'minimum', 'density', 'first', '7:3', 'no-hangs', 'emil', 'style',
  'three-finger', 'two-grip', 'three-grip', 'smallest', 'you', 'can', 'hold', 'big',
  'medium', 'small', 'sloper', 'jug', 'jugs', 'pocket', 'full', 'easy',
  'hard', 'day', 'session', 'workout', 'endurance', 'strength', 'bodyweight', 'of',
  // 128 common
  'repeater', 'max-hangs', 'weighted', 'pulley', 'assisted', '10:50', '7/53', 'one',
  'two', 'three', 'four', 'five', 'six', 'finger', 'fingers', 'grips',
  'crimps', 'pinch', 'mono', 'pockets', 'slopers', 'edges', 'deep', 'shallow',
  'large', 'little', 'wide', 'narrow', 'front', 'back', 'middle', 'set',
  'rep', 'round', 'rounds', 'second', 'seconds', 'sec', 's', 'x',
  'lb', 'lbs', 'cm', 'percent', 'effort', 'power', 'capacity', 'recruitment',
  'recovery', 'test', 'benchmark', 'protocol', 'routine', 'block', 'long', 'short',
  'quick', 'light', 'heavy', 'moderate', 'morning', 'evening', 'daily', 'beginner',
  'intermediate', 'advanced', 'both', 'single', 'double', 'foot', 'chair', 'band',
  'board', 'hangboard', 'fingerboard', 'campus', 'for', 'in', 'at', 'to',
  'or', 'no', 'not', 'only', 'all', 'top', 'bottom', 'before',
  'after', 'a', 'b', 'my', 'new', 'lattice', 'beastmaker', 'tension',
  'metolius', 'fika', 'hörst', 'lópez', 'eva', 'abrahamsson', 'anderson', 'climb',
  'climbing', 'bouldering', 'boulder', 'sport', 'lead', 'project', 'shake', 'out',
  'cool', 'down', 'pause', 'ladder', 'pyramid', 'thumb', 'index', 'ring',
  'pinky', 'pad', 'one-pad', 'two-finger', 'four-finger', 'incut', 'flat', 'sloping',
  // 128 less common
  'rung', 'rungs', 'pinches', 'monos', 'biggest', 'thumbless', 'pads', 'two-pad',
  'eight', 'ten', 'mins', 'minute', 'minutes', 'secs', 'hours', 'apart',
  'twice', 'weekly', 'degrees', 'rests', 'cooldown', 'warmup', 'maintenance', 'plan',
  'elite', 'gym', 'home', 'travel', 'old', 'c', 'without', 'off',
  'from', 'per', 'plus', 'pre', 'post', 'mid', 'mini', 'micro',
  'night', 'lunch', 'week', 'fast', 'slow', 'comp', 'competition', 'assist',
  'two-arm', 'offset', 'open-hand', 'half-crimp', 'full-crimp', 'chisel', 'sunday', 'wrist',
  'shoulders', 'shoulder', 'engaged', 'active', 'passive', 'hangboarding', 'training', 'train',
  'max-weight', 'last', 'next', 'each', 'every', 'then', 'until', 'fail',
  'failure', 'rpe', 'bw', 'body', 'kilo', 'kilos', 'pounds', 'grams',
  'hold-time', 'time', 'interval', 'intervals', 'circuit', 'emom', 'repeat', 'repeats',
  'pull', 'pull-ups', 'pullups', 'lock-off', 'lockoff', 'core', 'antagonist', 'forearm',
  'forearms', 'tendon', 'tendons', 'health', 'rehab', 'injury', 'prehab', 'mobility',
  'stretch', 'breath', 'breathe', 'focus', 'form', 'clean', 'controlled', 'slowly',
  'feet-on', 'toes', 'knees', 'jumping', 'assessment', 'baseline', 'peak', 'deload',
  'phase', 'cycle', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
];

/**
 * Whole names and labels, cheaper than their words: every built-in workout's name and labels,
 * then common grips and setups. Written as they are usually typed (sentence case); a lowercase
 * first letter is matched too. APPEND-ONLY like `WORDS`. The first 32 are cheapest, then 64,
 * then 160 more slots (`TABLES.text.phraseIndex`).
 */
// prettier-ignore
export const PHRASES: readonly string[] = [
  // 32 most common: the built-in workouts first
  'First hangs', 'No-hangs, Emil style', 'Density hangs', 'Repeaters 7:3',
  'Max hangs', 'Minimum edge hangs', 'Two-grip repeaters', '7/53 max weight',
  'One-arm hangs', 'Three-grip max hangs', 'Feet on the floor', 'Smallest edge you can hold',
  'Half crimp', 'Open hand', 'Added weight', 'Left arm',
  'Right arm', 'Three-finger drag', 'Full crimp', 'Warm up',
  'Warm-up', 'Cool down', 'Jugs', 'Big edge',
  'Medium edge', 'Small edge', '20 mm edge', 'Two-finger pocket',
  'Front three', 'Back three', 'Sloper', 'Repeaters',
  // 64 common
  'Front two', 'Middle two', 'Back two', 'Three-finger pocket',
  'Mono', 'Pinch', 'Wide pinch', 'Narrow pinch',
  '10 mm edge', '15 mm edge', '18 mm edge', '25 mm edge',
  'Assisted', 'Pulley', 'Bodyweight', 'Weighted',
  'Warm-up hangs', 'Recruitment pulls', 'Half crimp repeaters', 'Open hand repeaters',
  'Endurance repeaters', 'Strength', 'Endurance', 'Power',
  'Easy', 'Hard', 'Left hand', 'Right hand',
  'Both arms', 'One arm', 'Deep pocket', 'Deep edge',
  'Shallow edge', 'Round sloper', 'Jug hangs', 'Dead hangs',
  'Active hangs', 'Scapular pulls', 'Pull-ups', 'Lock-offs',
  'Max weight', 'Minimum edge', 'No-hangs', 'Emil style',
  'Density', 'Test', 'Benchmark', 'Recovery',
  'Deload', 'Daily', 'Morning session', 'Evening session',
  'Beastmaker 1000', 'Beastmaker 2000', 'Tension Grindstone', 'Metolius Simulator',
  'Max hangs 10s', 'Eva López max hangs', 'Hörst 7/53', 'Abrahamsson no-hangs',
  'Session', 'Workout', 'Half crimp, open hand', 'Shake out',
];

/**
 * A board's grips (mirrored pair, centre hold or lone hold, see `grips()`) in codec order: by
 * the position of the grip's first hold in the manifest, not the picker's row order, so a hold
 * appended to a layout does not shift the others.
 */
export function codecGrips(board: Board): string[][] {
  const position = new Map(board.holds.map((hold, i) => [hold.id, i]));
  return grips(board)
    .sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
    .map((grip) => grip.holdIds);
}
