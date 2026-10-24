import importlib.util

import httpx
import pytest
import yaml

from agents.adapters.http import ApiClient
from agents.jobs.crawl_site import audit_html
from agents.jobs.pipeline import collect_production
from agents.main import build_report
from agents.models import SourceResult
from agents.security.crawl_export import public_crawl_issues
from agents.security.public_allowlist import ROOT, validate_public_report

STAMP = "2026-10-23T02:30:00Z"


def records():
    rows, _ = audit_html("https://ratniva.com/collections/rings", "<html><title>Public collection</title></html>", {}, STAMP)
    rows[0]["rawHtml"] = "PRIVATE_RAW_MARKUP"
    rows[-1]["description"] = ""
    return rows


def test_only_explicit_public_crawl_fields_are_exported():
    report = build_report("production")
    issues = public_crawl_issues(records(), report)
    assert issues
    assert all("kind" not in issue and "rawHtml" not in issue for issue in issues)
    assert "PRIVATE_RAW_MARKUP" not in str(issues)


def test_unsafe_findings_are_withheld():
    rows = records()
    rows[0]["evidence"] = "person@example.com"
    assert all(issue["id"] != rows[0]["id"] for issue in public_crawl_issues(rows, build_report("production")))
    rows[0]["category"] = "private-order"
    assert all(issue["category"] != "private-order" for issue in public_crawl_issues(rows, build_report("production")))


@pytest.mark.parametrize("enabled", [True, False])
def test_measured_crawl_report_and_privacy_switch(tmp_path, monkeypatch, enabled):
    import agents.jobs.pipeline as pipeline
    monkeypatch.setattr(pipeline, "ROOT", tmp_path)
    (tmp_path / "agents/configs").mkdir(parents=True)
    config = yaml.safe_load((ROOT / "agents/configs/site.yaml").read_text())
    config.update(publish_public_audit_metrics=enabled, publish_public_crawl_findings=enabled)
    (tmp_path / "agents/configs/site.yaml").write_text(yaml.safe_dump(config))
    monkeypatch.setattr(pipeline, "crawl", lambda *args, **kwargs: SourceResult(name="crawler", status="connected", complete=False, records=records(), message="Sampled crawl."))
    report = collect_production(build_report("production"), tmp_path / "private",
        env={"ENABLE_PUBLIC_CRAWL": "true", "GITHUB_REPOSITORY": "Vikasyadav25/website-seo", "GITHUB_RUN_ID": "123"},
        api_factory=lambda: ApiClient(httpx.Client(transport=httpx.MockTransport(lambda _: pytest.fail("Unexpected network request")))))
    assert report["latestRun"]["status"] == "partial"
    assert report["latestRun"]["githubRunUrl"].endswith("/actions/runs/123")
    assert not report["productAuditSummaries"] and not report["recommendations"]
    if enabled:
        values = {item["label"]: item["value"] for item in report["publicSafeKpis"]}
        assert values["Pages checked"] == 1 and values["Technical findings"] == len(report["issues"])
        assert report["issues"] and report["healthHistory"][0]["score"] == 50
    else:
        assert not report["issues"] and not report["publicSafeKpis"] and not report["healthHistory"]
    validate_public_report(report)


def test_deployment_selects_only_successful_trusted_audits():
    path = ROOT / "scripts/latest-audit-run.py"
    spec = importlib.util.spec_from_file_location("latest_audit", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    trusted = {"id": 3, "head_branch": "main", "conclusion": "success", "event": "schedule", "head_repository": {"full_name": "owner/repo"}}
    assert module.latest_trusted_run([{**trusted, "id": 9, "event": "pull_request"}, {**trusted, "id": 8, "head_branch": "untrusted"}, trusted], "owner/repo") == 3
    assert module.latest_trusted_run([trusted], "other/repo") is None
