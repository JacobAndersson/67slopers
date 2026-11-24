"""python build.py <chapter modules...> [--render] ; builds the brand book spreads."""
import sys, importlib
from book import Book, RENDERS
mods = [a for a in sys.argv[1:] if not a.startswith('--')]
bk = Book()
for m in mods: importlib.import_module(m).build(bk)
bk.publish(RENDERS if '--render' in sys.argv else None)
