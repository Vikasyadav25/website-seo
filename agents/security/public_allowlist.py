"""Fail closed on malformed reports, unexpected fields, credentials, and unsafe links."""
import json
import re
from pathlib import Path
from urllib.parse import urlparse

from jsonschema import Draft7Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[2]
SCHEMA = json.loads((ROOT / "schemas/public-report.schema.json").read_text(encoding="utf-8"))
VALIDATOR = Draft7Validator(SCHEMA, format_checker=FormatChecker())
FORBIDDEN = re.compile(
    r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"
    r"|shp(?:at|ca|pa|ss)_[A-Za-z0-9]+|gh[pousr]_[A-Za-z0-9]+"
    r"|github_pat_[A-Za-z0-9_]+|-----BEGIN [A-Z ]*PRIVATE KEY-----"
    r"|\bBearer\s+\S+|\bAIza[0-9A-Za-z_-]{20,}|\bsk-[A-Za-z0-9_-]{16,}"
    r"|\+\d[\d ()-]{8,}\d", re.I,
)
PUBLIC_HOSTS = {"github.com", "www.giva.co", "www.palmonas.com", "www.zavya.co",
                "www.tiffany.com", "www.canada.ca"}


def validate_public_report(report: dict) -> None:
    """Error messages intentionally omit rejected values, which may contain secrets."""
    if not VALIDATOR.is_valid(report):
        raise ValueError("Report rejected: invalid public schema or unexpected fields")
    site_host = urlparse(report["siteUrl"]).hostname
    if site_host != "ratniva.com":
        raise ValueError("Report rejected: site hostname is not allowlisted")

    def inspect(node):
        if isinstance(node, str):
            if FORBIDDEN.search(node):
                raise ValueError("Report rejected: sensitive content detected")
            for match in re.findall(r"https?://[^\s<>\"']+", node, re.I):
                parsed = urlparse(match)
                if (parsed.scheme != "https" or parsed.username or parsed.password
                        or parsed.query or parsed.fragment
                        or parsed.hostname not in PUBLIC_HOSTS | {site_host}):
                    raise ValueError("Report rejected: unsafe public URL")
        elif isinstance(node, list):
            for item in node:
                inspect(item)
        elif isinstance(node, dict):
            for item in node.values():
                inspect(item)

    inspect(report)
