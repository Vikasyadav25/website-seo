"""Scan deployable assets for known credential shapes; never print matched values."""
import re
import sys
from pathlib import Path

PATTERN = re.compile(r"shp(?:at|ca|pa|ss)_[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{25,}"
                     r"|github_pat_[A-Za-z0-9_]{30,}|\bAIza[0-9A-Za-z_-]{30,}"
                     r"|-----BEGIN (?:RSA |EC )?PRIVATE KEY-----")
if __name__ == "__main__":
    found = False
    for directory in sys.argv[1:] or ["dist"]:
        for path in Path(directory).rglob("*"):
            if path.is_file() and PATTERN.search(path.read_text(encoding="utf-8", errors="ignore")):
                found = True
    print("Credential scan failed: deployable content withheld." if found else "Deployable credential scan passed.")
    raise SystemExit(1 if found else 0)
