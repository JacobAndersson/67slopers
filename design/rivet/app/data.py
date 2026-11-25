"""One canonical sample dataset for every board, so the screens agree with each other.

Today is Thursday 19 November 2026. The classic workouts mirror src/lib/store/presets.ts exactly; durations
follow the app's rule that a trailing rest is skipped on the final round of a repeat."""

def prep(s): return ('prep', s, None)
def hang(s, label=None): return ('hang', s, label)
def rest(s): return ('rest', s, None)
def rep(n, steps): return ('repeat', n, steps)


PRESETS = [
    ('Beginner', [
        ('First hangs', [prep(10), rep(2, [rep(6, [hang(10), rest(50)]), rest(180)])],
         'Ten seconds on, fifty off. Jugs or the biggest edge, feet on a chair if you need them.'),
        ('No-hangs, Emil style', [prep(10), rep(8, [hang(10, 'Feet on the floor'), rest(50)])],
         'Feet stay on the floor; load the fingers to about 70–80 %. Short and easy on purpose.'),
        ('Density hangs', [prep(10), rep(4, [hang(30), rest(120)])],
         'Longer hangs at about half effort. The edge sets the difficulty, not added weight.'),
    ]),
    ('Intermediate', [
        ('Repeaters 7:3', [prep(10), rep(6, [rep(6, [hang(7), rest(3)]), rest(180)])],
         'The classic strength-endurance set: 7 s on, 3 s off, six reps, six sets.'),
        ('Max hangs', [prep(10), rep(5, [hang(10), rest(180)])],
         'Five near-maximal 10 s hangs. The last one should be hard but clean.'),
        ('Minimum edge hangs', [prep(10), rep(5, [hang(10, 'Smallest edge you can hold'), rest(180)])],
         'Max hangs without added weight: the smallest edge you can hold for 10 s.'),
        ('Two-grip repeaters', [prep(10), rep(3, [rep(6, [hang(7, 'Half crimp'), rest(3)]), rest(180)]), rest(180),
                                rep(3, [rep(6, [hang(7, 'Open hand'), rest(3)]), rest(180)])],
         'Three sets on half crimp, then three on open hand.'),
    ]),
    ('Advanced', [
        ('7/53 max weight', [prep(10), rep(3, [rep(3, [hang(7, 'Added weight'), rest(53)]), rest(90)])],
         'Eric Hörst’s weighted protocol: 7 s on, 53 s off, three per set, three sets.'),
        ('One-arm hangs', [prep(10), rep(5, [hang(8, 'Left arm'), rest(30), hang(8, 'Right arm'), rest(150)])],
         'Eight seconds per arm on a big edge; take weight off with a pulley if you need to.'),
        ('Three-grip max hangs', [prep(10), rep(3, [hang(10, 'Half crimp'), rest(180)]), rest(180),
                                  rep(3, [hang(10, 'Open hand'), rest(180)]), rest(180),
                                  rep(3, [hang(10, 'Three-finger drag'), rest(180)])],
         'Three max hangs on each of three grips, three minutes between every hang.'),
    ]),
]


def expand(steps, top=True):
    """Flatten into (kind, seconds); a rest closing a top-level round becomes 'recover'."""
    out = []
    for i, s in enumerate(steps):
        if s[0] == 'repeat':
            n, inner = s[1], s[2]
            for r in range(n):
                part = expand(inner, top=False)
                if r == n - 1 and part and part[-1][0] in ('rest', 'recover'):
                    part = part[:-1]
                if top and inner and inner[-1][0] == 'rest' and r < n - 1 and part:
                    part[-1] = ('recover', part[-1][1])
                out += part
        else:
            out.append((s[0], s[1]))
    return out


def seconds(steps):
    return sum(s for _, s in expand(steps))


def clock(sec):
    return f'{sec // 60}:{sec % 60:02d}'


def sets(steps):
    n = sum(s[1] for s in steps if s[0] == 'repeat')
    return n


OVERRIDE = {'Two-grip repeaters': '2 grips  ·  3 sets each, 7 s on, 3 s off', 'One-arm hangs': '5 × 8 s each arm  ·  rest 2:30',
            'Three-grip max hangs': '3 grips  ·  3 × 10 s each'}


def summary(steps):
    """Plain words, readable at a glance: '6 sets · 7 s on, 3 s off'."""
    reps = [s for s in steps if s[0] == 'repeat']
    if not reps:
        return ''
    r = reps[0]
    inner = r[2]
    if inner and inner[0][0] == 'repeat':
        h, rs = inner[0][2][0][1], inner[0][2][1][1]
        return f'{sets(steps)} sets  ·  {inner[0][1]} × {h} s on, {rs} s off'
    hs = [s for s in inner if s[0] == 'hang']
    rests = [s for s in inner if s[0] == 'rest']
    if len(reps) > 1:
        return f'{len(reps)} grips  ·  {r[1]} × {hs[0][1]} s'
    return f'{r[1]} × {hs[0][1]} s  ·  rest {clock(rests[-1][1]) if rests[-1][1] >= 60 else str(rests[-1][1]) + " s"}'


def find(name):
    for _, items in PRESETS:
        for n, steps, d in items:
            if n == name: return steps
    raise KeyError(name)


REPEATERS = find('Repeaters 7:3')
REPEATERS_TIME = clock(seconds(REPEATERS))
