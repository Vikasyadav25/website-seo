"""Encrypt a bounded private report bundle before any artifact upload."""
import io
import os
import sys
import zipfile
from pathlib import Path

from cryptography.fernet import Fernet

ROOT = Path(__file__).resolve().parents[1]
if __name__ == "__main__":
    buffer = io.BytesIO()
    directory = ROOT / "private"
    try:
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name in ("latest.ndjson", "proposals.json", "weekly-action-plan.json", "growth.sqlite"):
                path = directory / name
                if path.exists():
                    if path.stat().st_size > 25_000_000:
                        raise ValueError("Bundle size exceeds budget")
                    archive.write(path, arcname=name)
        encrypted = Fernet(os.environ.get("PRIVATE_REPORT_ENCRYPTION_KEY", "")).encrypt(buffer.getvalue())
        (directory / "private-report.zip.enc").write_bytes(encrypted)
    except (ValueError, OSError):
        print("Private report encryption failed. No raw upload is permitted.", file=sys.stderr)
        raise SystemExit(1) from None
    print("Detailed report encrypted for controlled artifact retention.")
