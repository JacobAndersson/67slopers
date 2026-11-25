"""Page layout for the app design file: a heading, then rows of 390 x 844 screens, each with a
small caption board above it (name, route, one line on what it shows)."""
from doc import Board
from ui import F, NIGHT, GRANITE, LIGHT, W, H

REGISTRY = []  # (page, key, board) for rendering


class Page:
    GAP = 72

    def __init__(self, doc, name, prefix):
        self.doc, self.name, self.prefix = doc, name, prefix
        self.pid = doc.page(name)
        self.x = 0; self.y = 0; self.row_h = 0; self.boards = []

    def heading(self, title, body='', w=2200, key=None):
        b = Board(self.doc, self.pid, f'app/{self.prefix}/h/{key or title}', 'Heading / ' + title, 0, self.y, w, 200, bg=None)
        b.text(title, 0, 0, size=64, font=F, weight=900, color=NIGHT, ls=-1.2, lh=1.1)
        if body:
            b.text(body, 0, 92, w=1200, size=21, font=F, weight=600, color=GRANITE, lh=1.45)
        self.boards.append(b)
        self.y += 240; self.x = 0; self.row_h = 0
        return b

    def newrow(self):
        if self.row_h:
            self.y += self.row_h + 120
        self.x = 0; self.row_h = 0

    def screen(self, key, title, note, draw, T=LIGHT, w=W, h=H, bg=None):
        cap = Board(self.doc, self.pid, f'app/{self.prefix}/{key}/cap', f'Caption / {title}', self.x, self.y, w, 88, bg=None)
        cap.text(title, 0, 0, size=22, font=F, weight=900, color=NIGHT)
        if note:
            cap.text(note, 0, 32, w=w, size=14, font=F, weight=600, color=GRANITE, lh=1.35)
        b = Board(self.doc, self.pid, f'app/{self.prefix}/{key}', title, self.x, self.y + 100, w, h, bg=bg or T['canvas'])
        b.dark = T['name'] == 'dark'
        draw(b, T)
        self.boards += [cap, b]
        REGISTRY.append((self.name, f'{self.prefix}-{key}', b))
        self.x += w + self.GAP
        self.row_h = max(self.row_h, h + 100)
        return b

    def board(self, key, title, w, h, draw, bg='#FFFFFF'):
        """A free-size reference board (foundations, components, flows)."""
        b = Board(self.doc, self.pid, f'app/{self.prefix}/{key}', title, self.x, self.y, w, h, bg=bg)
        draw(b)
        self.boards.append(b)
        REGISTRY.append((self.name, f'{self.prefix}-{key}', b))
        self.x += w + self.GAP
        self.row_h = max(self.row_h, h)
        return b
