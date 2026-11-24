"""Render selected, already-published spreads without republishing: python render_keys.py key1 key2 ..."""
import sys
import book
from book import Book, RENDERS
from build_all import assemble  # noqa: E402  (build_all only publishes when run as a script)
dry = Book(); assemble(dry); book.PAGES.update(dry.starts)
for b in dry.spreads:
    if b.key.split('/', 1)[1] in sys.argv[1:]:
        dry.d.render(b, RENDERS / f'{b.idx:02d}-{b.key.split("/")[1]}.png', 0.5); print('rendered', b.idx, b.key)
