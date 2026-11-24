"""Rivet mark candidates, drawn in a 100x100 box. Each mark is a list of parts:
('fill', d) or ('stroke', d, width)."""
import math

def rr(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    return (f'M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} '
            f'H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z')

def circle_rev(cx, cy, r):
    return f'M{cx-r} {cy} A{r} {r} 0 1 1 {cx+r} {cy} A{r} {r} 0 1 1 {cx-r} {cy} Z'

def circle(cx, cy, r):
    return f'M{cx-r} {cy} A{r} {r} 0 1 0 {cx+r} {cy} A{r} {r} 0 1 0 {cx-r} {cy} Z'

MARKS = {
    # A: three soft bars rising: the training load climbing, the old "Pitch", redrawn heavier
    'pitch': dict(name='Pitch', note='Three soft bars rising. Load, progress, a cap-sized shape.',
                  parts=[('fill', rr(12, 52, 20, 36, 10)), ('fill', rr(40, 34, 20, 54, 10)), ('fill', rr(68, 12, 20, 76, 10))]),
    # A2: two bars and the goal: the third bar became a point you reach for
    'reach': dict(name='Reach', note='Two bars and the hold you are reaching for. Focus as a point.',
                  parts=[('fill', rr(12, 52, 20, 36, 10)), ('fill', rr(40, 30, 20, 58, 10)), ('fill', circle(78, 22, 10))]),
    # B: three bars sharing one sloped top: a hillside / the pitch of a slab, not a signal icon
    'slope': dict(name='Slope', note='Three bars cut by one rising line: a mountainside, the pitch of a slab.',
                  parts=[('fill', 'M12 64 Q12 58 17.5 56.2 L26 53.4 Q32 51.4 32 57.6 V82 Q32 88 26 88 H18 Q12 88 12 82 Z'),
                         ('fill', 'M40 46.6 Q40 40.6 45.5 38.8 L54 36 Q60 34 60 40.3 V82 Q60 88 54 88 H46 Q40 88 40 82 Z'),
                         ('fill', 'M68 29.3 Q68 23.3 73.5 21.4 L82 18.6 Q88 16.6 88 23 V82 Q88 88 82 88 H74 Q68 88 68 82 Z')]),
    # D: a rising ridge line that ends in a dot
    'ridge': dict(name='Ridge', note='One continuous line, two summits, and the point of focus above.',
                  parts=[('stroke', 'M12 80 L36 50 L50 64 L74 32', 12), ('fill', circle(86, 16, 8))]),
    # E: a rounded R; the rivet sits where bowl and leg meet
    'monogram': dict(name='R + rivet', note='A soft R, fastened: the rivet sits exactly where the bowl meets the leg.',
                     parts=[('stroke', 'M28 86 V18 H52 A18 18 0 0 1 52 54 H44 L72 86', 13), ('fill', circle(44, 54, 11)), ('fill', circle_rev(44, 54, 4.5))]),
    # F: the focus ring: rivet head from above
    'focus': dict(name='Focus', note='A rivet from above: a ring and its centre. Total attention.',
                  parts=[('fill', circle(50, 50, 40) + ' ' + circle_rev(50, 50, 25)), ('fill', circle(50, 50, 10))]),
}

def draw(b, key, x, y, size, color, name=None):
    s = size / 100
    for i, part in enumerate(MARKS[key]['parts']):
        nm = f'{name or "Mark / " + MARKS[key]["name"]} / {i+1}'
        if part[0] == 'fill':
            b.path(part[1], x, y, s, fill=color, name=nm)
        else:
            b.path(part[1], x, y, s, stroke=color, sw=part[2] * s, name=nm)
