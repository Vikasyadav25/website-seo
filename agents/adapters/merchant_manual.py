"""Constrained local Merchant Center diagnostics import; no Merchant API auth required."""
import csv
from pathlib import Path

from agents.jobs.crawl_site import safe_url
from agents.models import SourceResult


def import_diagnostics(path: Path) -> SourceResult:
    if path.stat().st_size > 2_000_000:
        raise ValueError("Diagnostics file exceeds size budget")
    result = SourceResult(name="merchant_manual", status="connected", message="Imported operator diagnostics; freshness depends on the source export.")
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if set(reader.fieldnames or []) != {"url", "severity", "message"}:
            raise ValueError("Unknown diagnostics columns")
        for row in reader:
            if (not safe_url(row["url"]) or row["severity"] not in ("critical", "high", "medium", "low")
                    or not row["message"] or len(row["message"]) > 2000 or len(result.records) >= 1000):
                raise ValueError("Invalid diagnostics row")
            result.records.append(row)
    return result
