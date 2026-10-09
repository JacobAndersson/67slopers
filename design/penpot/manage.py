#!/usr/bin/env python3
"""Manage the repository's local Penpot without adding app dependencies."""

import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import secrets
import shutil
import subprocess
import time
import urllib.error
import urllib.request


HERE = Path(__file__).resolve().parent
DESIGN = HERE.parent
ENV = HERE / ".env"
COMPOSE = ["docker", "compose", "--env-file", str(ENV), "-f", str(HERE / "compose.yaml")]


def compose(*args, **kwargs):
    return subprocess.run([*COMPOSE, *args], check=True, **kwargs)


def initialize():
    if not ENV.exists():
        with open(ENV, "x", opener=lambda p, f: os.open(p, f, 0o600)) as file:
            file.write(f"PENPOT_SECRET_KEY={secrets.token_urlsafe(64)}\n")
            file.write(f"PENPOT_DATABASE_PASSWORD={secrets.token_urlsafe(32)}\n")
    for name in ("assets", "postgres"):
        (DESIGN / ".local" / "penpot" / name).mkdir(parents=True, exist_ok=True)


def wait_for_editor():
    deadline = time.monotonic() + 180
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen("http://localhost:9002/api/main/doc", timeout=3):
                return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(1)
    raise SystemExit("Penpot has not become ready. Run the logs command to investigate.")


def backup():
    """Pause writers so the database and asset archive describe the same moment."""
    running = compose("ps", "--status", "running", "--services", capture_output=True, text=True)
    services = running.stdout.splitlines()
    if "penpot-postgres" not in services or "penpot-backend" not in services:
        raise SystemExit("Start Penpot before taking a backup.")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    destination = DESIGN / "backups" / stamp
    destination.mkdir(parents=True, mode=0o700)
    writers = [
        s for s in ("penpot-frontend", "penpot-backend", "penpot-admin-console")
        if s in services
    ]
    try:
        compose("stop", *writers)
        with (destination / "database.dump").open("wb") as file:
            compose(
                "exec", "-T", "penpot-postgres", "pg_dump", "-U", "penpot", "-Fc", "penpot",
                stdout=file,
            )
        with (destination / "assets.tar.gz").open("wb") as file:
            compose(
                "run", "--rm", "--no-deps", "-T", "--entrypoint", "tar", "penpot-backend",
                "-czf", "-", "-C", "/opt/data/assets", ".", stdout=file,
            )
        shutil.copy2(ENV, destination / "penpot.env")
        shutil.copy2(HERE / "compose.yaml", destination / "compose.yaml")
        credentials = DESIGN / ".local" / "credentials.json"
        if credentials.exists():
            shutil.copy2(credentials, destination / "credentials.json")
        print(f"Backup saved to {destination}")
    finally:
        compose("start", *writers)
        wait_for_editor()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("up", "down", "status", "logs", "backup", "config"))
    command = parser.parse_args().command
    if command == "up":
        initialize()
        # Bind mounts start out owned by the host user; Penpot runs as uid 1001.
        compose(
            "run", "--rm", "--no-deps", "-T", "--user", "root", "--entrypoint", "chown",
            "penpot-backend", "penpot:penpot", "/opt/data/assets",
        )
        compose("up", "-d", "--wait", "--wait-timeout", "180")
        wait_for_editor()
        print("Penpot: http://localhost:9002")
    elif not ENV.exists():
        raise SystemExit("Run python3 design/penpot/manage.py up first.")
    elif command == "down":
        compose("down")
    elif command == "status":
        compose("ps")
    elif command == "logs":
        compose("logs", "--tail", "100", "-f")
    elif command == "config":
        compose("config", "--quiet")
    else:
        backup()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode) from error
