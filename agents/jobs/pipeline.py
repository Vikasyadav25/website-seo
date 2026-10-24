"""Private collection and recommendations; explicitly allowlisted public count output."""
import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import yaml

from agents.adapters.gsc import collect_gsc, service_account_token
from agents.adapters.http import ApiClient, SourceError
from agents.adapters.merchant_manual import import_diagnostics
from agents.adapters.pagespeed import collect_pagespeed
from agents.adapters.shopify import Shopify, client_credentials_token
from agents.jobs.crawl_site import crawl
from agents.models import Product, SourceResult
from agents.proposals.draft import draft_product
from agents.proposals.validate import validate_proposal
from agents.security.public_allowlist import ROOT, validate_public_report
from agents.security.crawl_export import public_crawl_issues, public_page_checks


def collect_production(public_report: dict, private_dir: Path, *, env=None, api_factory=ApiClient) -> dict:
    env = os.environ if env is None else env
    private_dir = private_dir.resolve()
    if not private_dir.is_relative_to((ROOT / "private").resolve()):
        raise ValueError("Raw output must stay under the ignored private directory")
    private_dir.mkdir(parents=True, exist_ok=True)
    config = yaml.safe_load((ROOT / "agents/configs/site.yaml").read_text(encoding="utf-8"))
    stamp = datetime.now(timezone.utc).isoformat()
    results = []

    def collect(name, enabled, callback):
        if not enabled:
            results.append(SourceResult(name=name, status="not_configured", message="Credentials or explicit read-only source enablement are missing."))
            return
        api = api_factory()
        try:
            results.append(callback(api))
        except (SourceError, ValueError, OSError, KeyError, TypeError):
            results.append(SourceResult(name=name, status="failed", complete=False, message="Source unavailable; detailed response withheld."))
        finally:
            api.close()

    read_token = env.get("SHOPIFY_READ_ACCESS_TOKEN") or env.get("SHOPIFY_ADMIN_ACCESS_TOKEN")
    app_credentials = env.get("SHOPIFY_CLIENT_ID") and env.get("SHOPIFY_CLIENT_SECRET")

    def collect_shopify(api):
        token = client_credentials_token(env["SHOPIFY_STORE_DOMAIN"], env["SHOPIFY_CLIENT_ID"],
                                         env["SHOPIFY_CLIENT_SECRET"], api) if app_credentials else read_token
        return Shopify(env["SHOPIFY_STORE_DOMAIN"], token, api, config["shopify_api_version"]).inventory(config["max_catalog_pages"])

    collect("shopify", env.get("SHOPIFY_STORE_DOMAIN") and (app_credentials or read_token), collect_shopify)
    collect("gsc", env.get("GSC_SITE_URL") and env.get("GSC_CREDENTIALS_JSON"),
            lambda api: collect_gsc(api, env["GSC_SITE_URL"], service_account_token(env["GSC_CREDENTIALS_JSON"])))
    urls = ["https://ratniva.com" + path for path in config["sample_paths"]]
    collect("pagespeed", env.get("PAGESPEED_API_KEY") and env.get("ENABLE_PAGESPEED") == "true",
            lambda api: collect_pagespeed(api, urls, env["PAGESPEED_API_KEY"], private_dir / "pagespeed-cache"))
    collect("crawler", env.get("ENABLE_PUBLIC_CRAWL") == "true",
            lambda api: crawl(api, config["sample_paths"], stamp, max_pages=config["crawl_max_pages"], delay=config["crawl_delay_seconds"]))
    manual_path = env.get("MERCHANT_DIAGNOSTICS_PATH")
    if manual_path:
        try:
            path = Path(manual_path).resolve()
            if not path.is_relative_to((ROOT / "private").resolve()):
                raise ValueError("Manual input must be private")
            results.append(import_diagnostics(path))
        except (ValueError, OSError):
            results.append(SourceResult(name="merchant_manual", status="failed", complete=False, message="Manual diagnostics import refused."))
    else:
        results.append(SourceResult(name="merchant_manual", status="not_configured", message="Import a reviewed manual diagnostics report locally."))
    proposals = []
    for source in results:
        if source.name == "shopify":
            for record in source.records:
                proposal = draft_product(Product.model_validate(record), stamp)
                if proposal:
                    validate_proposal(proposal.model_dump())
                    proposals.append(proposal.model_dump())
    issues = [record for source in results if source.name == "crawler" for record in source.records if record.get("kind") == "issue"]
    summary = {"generatedAt": stamp, "sources": [r.model_dump() for r in results], "proposals": proposals}
    with sqlite3.connect(private_dir / "growth.sqlite") as connection:
        connection.execute("CREATE TABLE IF NOT EXISTS snapshots (timestamp TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        connection.execute("INSERT INTO snapshots VALUES (?, ?)", (stamp, json.dumps(summary)))
    (private_dir / "latest.ndjson").write_text("\n".join(json.dumps(r.model_dump()) for r in results) + "\n", encoding="utf-8")
    (private_dir / "proposals.json").write_text(json.dumps(proposals, indent=2) + "\n", encoding="utf-8")
    plan = sorted(proposals, key=lambda p: p["impact"] * p["confidence"] / p["effort"], reverse=True)[:5]
    (private_dir / "weekly-action-plan.json").write_text(json.dumps({"generatedAt": stamp, "proposals": plan,
        "measurement": "Compare completed 7/28-day windows privately; no change implies a ranking lift."}, indent=2), encoding="utf-8")
    health = []
    for result in results:
        item = {"name": result.name, "status": result.status, "message": result.message}
        if result.status == "connected":
            item["lastSyncedAt"] = stamp
        health.append(item)
    active = [r for r in results if r.status != "not_configured"]
    status = "skipped" if not active else "success" if all(r.status == "connected" and r.complete for r in active) else "partial" if any(r.records for r in active) else "failed"
    counts = {s: sum(i["severity"] == s for i in issues) for s in ("critical", "high", "medium", "low")}
    public_report["generatedAt"] = stamp
    public_report["sourceHealth"] = health
    run = {"runId": "audit-" + stamp.replace(":", ""), "startedAt": stamp, "finishedAt": datetime.now(timezone.utc).isoformat(),
           "status": status, "jobName": "Read-only production audit", "sourceStatuses": health,
           "issueCounts": {key: 0 for key in counts}}
    crawler = next((r for r in results if r.name == "crawler"), None)
    public_issues = []
    if config.get("publish_public_crawl_findings") is True and crawler:
        public_issues = public_crawl_issues(crawler.records, public_report)
        public_report["issues"] = public_issues
        public_report["pageChecks"] = public_page_checks(crawler.records, public_report)
    if (re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", env.get("GITHUB_REPOSITORY", ""))
            and env.get("GITHUB_RUN_ID", "").isdigit()):
        run["githubRunUrl"] = f"https://github.com/{env['GITHUB_REPOSITORY']}/actions/runs/{env['GITHUB_RUN_ID']}"
    # Only public-crawl measures are enabled here. Catalog/GSC/draft information stays private.
    if config.get("publish_public_audit_metrics") is True:
        pages = [r for r in (crawler.records if crawler else []) if r.get("kind") == "page"]
        run["issueCounts"] = {s: sum(i["severity"] == s for i in public_issues) for s in counts}
        kpis = []
        if crawler and crawler.status == "connected":
            failures = sum(r.get("kind") == "fetch-failure" for r in crawler.records)
            kpis = [{"label": label, "value": value, "asOf": stamp} for label, value in (
                ("Pages checked", len(pages)), ("Technical findings", len(public_issues)),
                ("High severity issues", run["issueCounts"]["high"] + run["issueCounts"]["critical"]),
                ("Fetch failures", failures))]
            if pages:
                passed = sum(bool(p.get("title", "").strip()) + bool(p.get("description", "").strip()) for p in pages)
                public_report["healthHistory"] = [{"date": stamp[:10], "score": round(100 * passed / (2 * len(pages))), "pagesChecked": len(pages)}]
        public_report["publicSafeKpis"] = kpis
    public_report["latestRun"] = run
    public_report["runs"] = [run]
    validate_public_report(public_report)
    with sqlite3.connect(private_dir / "growth.sqlite") as connection:
        connection.execute("CREATE TABLE IF NOT EXISTS public_snapshots (timestamp TEXT PRIMARY KEY, payload TEXT NOT NULL)")
        connection.execute("INSERT INTO public_snapshots VALUES (?, ?)", (stamp, json.dumps(public_report)))
        history = [json.loads(row[0]) for row in connection.execute("SELECT payload FROM public_snapshots ORDER BY timestamp DESC LIMIT 90")]
    public_report["runs"] = [snapshot["latestRun"] for snapshot in history[:20]]
    # No invented backfill: the first real run has no historical comparison.
    validate_public_report(public_report)
    return public_report
