"""Validate public JSON without printing rejected payloads."""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agents.security.public_allowlist import validate_public_report  # noqa: E402

if __name__ == "__main__":
    paths = sys.argv[1:] or ["web/public/data/report.json"]
    try:
        for path in paths:
            validate_public_report(json.loads(Path(path).read_text(encoding="utf-8")))
    except (ValueError, OSError):
        print("Public data validation failed; unsafe or malformed input withheld.", file=sys.stderr)
        raise SystemExit(1) from None
    print(f"Validated {len(paths)} public report(s).")
