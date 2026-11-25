"""The Rivet app design file: the brand book's Penpot builder (tools/pp.py) pointed at
**Rivet — App design** instead of the brand book. The file id lives in
design/.local/rivet/app-file.json (created once with the Penpot `create-file` RPC)."""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'tools'))
import pp  # noqa: E402
from pp import Board, Doc, uid  # noqa: E402,F401

LOCAL = pp.LOCAL
APP = json.loads((LOCAL / 'app-file.json').read_text())


class AppDoc(Doc):
    def __init__(self):
        super().__init__()
        self.p.workspace = dict(self.p.workspace, fileId=APP['fileId'], pageId=APP['pageId'])
        self._media_path = LOCAL / 'app-media.json'
        self._media = json.loads(self._media_path.read_text()) if self._media_path.exists() else {}

    def media(self, path):
        path = Path(path); key = str(path)
        if key not in self._media:
            mt = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp'}[path.suffix.lower()]
            r = self.p.multipart('upload-file-media-object', {'file-id': APP['fileId'], 'is-local': 'true', 'name': path.stem},
                                 [('content', path, mt)])
            self._media[key] = dict(id=r['id'], width=r['width'], height=r['height'], mtype=r['mtype'], name=path.stem)
            self._media_path.write_text(json.dumps(self._media, indent=1))
        return self._media[key]

    def page(self, name, index=None):
        f = self.p.file(); pid = uid('app-page', name)
        if pid not in f['data']['pagesIndex']:
            ch = dict(type='add-page', id=pid, name=name)
            if index is not None: ch['index'] = index
            self.p.update([ch])
        self.pages[name] = pid
        return pid

    def drop_default_page(self):
        f = self.p.file()
        if APP['pageId'] in f['data']['pagesIndex'] and len(f['data']['pages']) > 1:
            self.p.update([dict(type='del-page', id=APP['pageId'])])
