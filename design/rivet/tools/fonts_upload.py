"""Upload the brand typefaces to the local Penpot team (idempotent per family/weight)."""
import base64, json, sys, uuid, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'penpot'))
from api import Penpot

def upload(p, team, family, files):
    """files: {weight: Path}. Returns font-id."""
    existing = p.rpc('get-font-variants', {'teamId': team})
    have = {(v['fontFamily'], str(v['fontWeight'])): v['fontId'] for v in existing}
    fid = next((f for (fam, _), f in have.items() if fam == family), None) or str(uuid.uuid5(uuid.NAMESPACE_URL, 'rivet/font/' + family))
    for w, path in files.items():
        if (family, str(w)) in have: continue
        sess = p.rpc('create-upload-session', {'totalChunks': 1})['sessionId']
        p.multipart('upload-chunk', {'session-id': sess, 'index': 0}, [('content', path, 'font/ttf')])
        p.rpc('create-font-variant', {'teamId': team, 'fontId': fid, 'fontFamily': family, 'fontWeight': int(w),
                                      'fontStyle': 'normal', 'uploads': {'font/ttf': sess}})
        print('uploaded', family, w)
    return fid

if __name__ == '__main__':
    p = Penpot(); team = p.workspace['teamId']
    root = Path(__file__).resolve().parents[1] / 'fonts'
    fams = {}
    for f in sorted(root.glob('*.ttf')):
        name, w = f.stem.rsplit('-', 1); fams.setdefault(name, {})[w] = f
    want = sys.argv[1:] or list(fams)
    ids = {}
    for name in want:
        ids[name] = upload(p, team, name, fams[name])
    out = Path(__file__).resolve().parents[2] / '.local/rivet/fonts.json'
    old = json.loads(out.read_text()) if out.exists() else {}
    old.update(ids); out.write_text(json.dumps(old, indent=1)); print(ids)
