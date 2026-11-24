"""Small local Penpot API client. Uses the ignored local login, never an access token."""

import http.cookiejar
import json
from pathlib import Path
import urllib.request
import urllib.error
import uuid

ROOT = Path(__file__).resolve().parents[2]


class Penpot:
    def __init__(self):
        self.workspace = json.loads((ROOT / "design/.local/workspace.json").read_text())
        credentials = json.loads((ROOT / "design/.local/credentials.json").read_text())
        self.base = credentials["url"]
        self.opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())
        )
        self.rpc("login-with-password", {k: credentials[k] for k in ("email", "password")})

    def request(self, method, body, content_type):
        req = urllib.request.Request(
            self.base + "/api/main/methods/" + method,
            data=body,
            headers={"Content-Type": content_type, "Accept": "application/json"},
        )
        try:
            with self.opener.open(req, timeout=180) as response:
                raw = response.read()
                return json.loads(raw) if "json" in response.headers.get("Content-Type", "") else raw
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"{method}: {error.code} {error.read().decode()[:12000]}") from None

    def local(self, uri):
        """Download links use Penpot's public address (which may be a VPN name); fetch them locally."""
        import re
        return re.sub(r'^https?://[^/]+', self.base, uri)

    def rpc(self, method, args):
        return self.request(method, json.dumps(args).encode(), "application/json")

    def multipart(self, method, fields, files):
        boundary = "PenpotDesign" + uuid.uuid4().hex
        parts = []
        for key, value in fields.items():
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
        for key, path, mime in files:
            parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"; filename="{path.name}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + path.read_bytes() + b"\r\n")
        parts.append(f"--{boundary}--\r\n".encode())
        return self.request(method, b"".join(parts), f"multipart/form-data; boundary={boundary}")

    def file(self):
        return self.rpc("get-file", {"id": self.workspace["fileId"]})

    def update(self, changes):
        file = self.file()
        return self.rpc("update-file", {
            "id": file["id"], "sessionId": str(uuid.uuid4()),
            "revn": file["revn"], "vern": file["vern"],
            "features": file["features"], "changes": changes,
        })

    def render(self, page, board, path, scale=2, kind="png"):
        """Render one board to PNG (or PDF, kind="pdf") with Penpot's own exporter."""
        import re

        profile = self.rpc("get-profile", {})
        body = {"~:cmd": "~:export-shapes", "~:profile-id": "~u" + profile["id"], "~:wait": True, "~:exports": [{
            "~:file-id": "~u" + self.workspace["fileId"], "~:page-id": "~u" + page, "~:object-id": "~u" + board,
            "~:type": "~:" + kind, "~:suffix": "", "~:scale": scale, "~:name": "board"}]}
        req = urllib.request.Request(self.base + "/api/export", data=json.dumps(body).encode(), headers={
            "Content-Type": "application/transit+json", "Accept": "application/transit+json"})
        result = self.opener.open(req, timeout=600).read().decode()
        path.write_bytes(self.opener.open(self.local(re.search(r'"~#uri":"([^"]+)"', result)[1]), timeout=600).read())

    def export(self, path):
        import io
        import re
        import zipfile

        result = self.rpc("export-binfile", {
            "fileId": self.workspace["fileId"], "includeLibraries": True, "embedAssets": False,
        }).decode()
        if "event: error" in result:
            raise RuntimeError(result)
        match = re.search(r'"~#uri":"([^"]+)"', result)
        if not match:
            raise RuntimeError(result)
        payload = self.opener.open(self.local(match[1]), timeout=180).read()
        with zipfile.ZipFile(io.BytesIO(payload)) as archive:
            assert archive.testzip() is None
        path.write_bytes(payload)
        return len(payload)
