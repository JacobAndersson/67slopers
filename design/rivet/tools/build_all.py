"""Build the complete Rivet brand book (page 02) and render every spread to design/.local/rivet/renders.
Two passes: the first only counts pages so the contents spread can print chapter page numbers."""
import sys
import book
from book import Book, RENDERS
import ch_intro, ch_identity, ch_colour_type, ch_imagery, ch_digital, ch_print, ch_systems

def assemble(bk):
    for m in (ch_intro, ch_identity, ch_colour_type): m.build(bk)
    ch_imagery.build(bk); ch_imagery.build_sound(bk)
    ch_digital.build(bk)
    ch_print.build_all(bk)

if __name__ == '__main__':
    dry = Book(); assemble(dry); book.PAGES.update(dry.starts)
    bk = Book(); assemble(bk)
    print(len(bk.spreads), 'spreads', book.PAGES)
    keys = set(sys.argv[sys.argv.index('--keys') + 1:]) if '--keys' in sys.argv else None
    bk.publish(RENDERS if '--render' in sys.argv else None, keys=keys)
