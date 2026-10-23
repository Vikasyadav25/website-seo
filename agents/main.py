"""Demo/disconnected worker with explicitly enabled read-only collection."""
import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from agents.security.public_allowlist import ROOT, validate_public_report


def build_report(mode: str, repository_url: str | None = None) -> dict:
    filename = "demo-report.json" if mode == "demo" else "disconnected-report.json"
    report = json.loads((ROOT / "examples" / filename).read_text(encoding="utf-8"))
    if repository_url:
        report["repositoryUrl"] = repository_url.rstrip("/")
    if mode == "production":
        report["mode"] = "connected"
        report["generatedAt"] = datetime.now(timezone.utc).isoformat()
        for source in report["sourceHealth"]:
            source["message"] = "Not collected: run with --collect and configure this read-only source."
        report["latestRun"] = {
            "runId": f"disconnected-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}",
            "startedAt": report["generatedAt"], "finishedAt": report["generatedAt"],
            "status": "skipped", "jobName": "Read-only source availability check",
            "sourceStatuses": report["sourceHealth"],
            "issueCounts": {key: 0 for key in ("critical", "high", "medium", "low")},
        }
        report["runs"] = [report["latestRun"]]
    validate_public_report(report)
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["demo", "production"], default="demo")
    parser.add_argument("--read-only", action="store_true")
    parser.add_argument("--output", type=Path, default=ROOT / "private/public-report.json")
    parser.add_argument("--repository-url", default=None)
    parser.add_argument("--collect", action="store_true", help="Run configured read-only collectors; all raw output stays under private/")
    args = parser.parse_args()
    if args.mode == "production" and not args.read_only:
        parser.error("Production collection requires --read-only. Use the separately protected publisher for approved changes.")
    if (os.getenv("PUBLISH_ENABLED", "false").lower() != "false"
            or os.getenv("ENABLE_SHOPIFY_WRITES", "false").lower() != "false"
            or os.getenv("DRY_RUN", "true").lower() != "true"):
        parser.error("Unsafe mode requested. This foundation supports read-only runs only.")
    try:
        report = build_report(args.mode, args.repository_url)
        if args.collect:
            if args.mode != "production" or not args.read_only:
                parser.error("Collectors require --mode production --read-only")
            from agents.jobs.pipeline import collect_production
            report = collect_production(report, ROOT / "private")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_suffix(".tmp")
        temporary.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        temporary.replace(args.output)
    except (ValueError, OSError):
        print("Report generation failed. Check schema, safe configuration, and output permissions.", file=sys.stderr)
        return 1
    print(f"{args.mode.upper()}: public report validated; Shopify writes disabled. Inspect sourceHealth for collected/skipped/failed states.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
