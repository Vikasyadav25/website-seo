"""Bounded, cached PageSpeed lab sampling; never interpret as field CWV."""
import hashlib
import json
import time
from pathlib import Path

from agents.adapters.http import ApiClient, SourceError
from agents.models import SourceResult


def collect_pagespeed(api: ApiClient, urls: list[str], key: str, cache: Path, now=time.time):
    result = SourceResult(name="pagespeed", status="connected")
    failures = set()
    cache.mkdir(parents=True, exist_ok=True)
    for url in urls[:5]:
        for strategy in ("mobile", "desktop"):
            path = cache / (hashlib.sha256(f"{url}:{strategy}".encode()).hexdigest() + ".json")
            try:
                if path.exists() and now() - path.stat().st_mtime < 7 * 86400:
                    record = json.loads(path.read_text(encoding="utf-8"))
                else:
                    payload = api.json("GET", "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
                                       params={"url": url, "strategy": strategy, "category": "performance", "key": key},
                                       timeout=60, max_attempts=1)
                    lighthouse = payload["lighthouseResult"]
                    audits = lighthouse["audits"]
                    record = {"url": url, "strategy": strategy, "kind": "lab", "asOf": lighthouse["fetchTime"],
                              "performanceScore": lighthouse["categories"]["performance"]["score"],
                              "lcpMs": audits.get("largest-contentful-paint", {}).get("numericValue"),
                              "cls": audits.get("cumulative-layout-shift", {}).get("numericValue")}
                    path.write_text(json.dumps(record), encoding="utf-8")
                result.records.append(record)
            except (SourceError, KeyError, ValueError, OSError, TypeError) as error:
                result.status = "failed"
                result.complete = False
                failures.add(error.diagnostic() if isinstance(error, SourceError) else "Invalid sample or cache")
    if failures:
        result.message = (f"PageSpeed samples: {len(result.records)} succeeded; failures: {', '.join(sorted(failures))}. "
                          "Retained lab results may be cached.")
    return result
