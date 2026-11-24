"""Export every brand-book spread from Penpot as PDF (vector) and merge them in book order."""
import json, re, sys, urllib.request
from pathlib import Path
import book
from book import Book
from build_all import assemble
from pypdf import PdfWriter, PdfReader
OUT = Path(__file__).resolve().parents[1] / 'Rivet-brand-book.pdf'
TMP = Path(__file__).resolve().parents[2] / '.local/rivet/pdf'; TMP.mkdir(parents=True, exist_ok=True)
bk = Book(); assemble(bk); p = bk.d.p
prof = p.rpc('get-profile', {})
for b in bk.spreads:
    dest = TMP / f'{b.idx:02d}.pdf'
    body = {"~:cmd": "~:export-shapes", "~:profile-id": "~u" + prof['id'], "~:wait": True, "~:exports": [{"~:file-id": "~u" + p.workspace['fileId'],
            "~:page-id": "~u" + bk.pg, "~:object-id": "~u" + b.id, "~:type": "~:pdf", "~:suffix": "", "~:scale": 1, "~:name": b.key.split('/')[1]}]}
    req = urllib.request.Request(p.base + '/api/export', data=json.dumps(body).encode(), headers={'Content-Type': 'application/transit+json', 'Accept': 'application/transit+json'})
    r = p.opener.open(req, timeout=600).read().decode()
    dest.write_bytes(p.opener.open(p.local(re.search(r'"~#uri":"([^"]+)"', r)[1]), timeout=600).read())
    print('page', b.idx, flush=True)
w = PdfWriter()
for b in bk.spreads:
    for page in PdfReader(TMP / f'{b.idx:02d}.pdf').pages: w.add_page(page)
w.add_metadata({'/Title': 'Rivet Brand Guidelines, Edition 01', '/Author': 'Rivet'})
w.compress_identical_objects() if hasattr(w, 'compress_identical_objects') else None
raw = TMP / 'book-full.pdf'
with open(raw, 'wb') as fh: w.write(fh)
# Penpot embeds photos at full size; Ghostscript downsamples them to 200 dpi and keeps text and shapes vector.
import subprocess
subprocess.run(['gs', '-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.6', '-dPDFSETTINGS=/ebook',
                '-dColorImageResolution=200', '-dDownsampleColorImages=true', '-dDetectDuplicateImages=true', f'-sOutputFile={OUT}', str(raw)], check=True)
print('wrote', OUT, OUT.stat().st_size)
