import json

import httpx
import pytest

from agents.adapters.http import ApiClient
from agents.jobs.manual_evidence import validate_evidence
from agents.jobs.pipeline import collect_production
from agents.main import build_report
from agents.security.public_allowlist import ROOT, validate_public_report
from agents.tests.test_adapters import catalog_payload


def test_disconnected_collectors_make_no_network_calls(tmp_path, monkeypatch):
    import agents.jobs.pipeline as pipeline
    monkeypatch.setattr(pipeline, "ROOT", tmp_path)
    (tmp_path / "agents/configs").mkdir(parents=True)
    (tmp_path / "agents/configs/site.yaml").write_text((ROOT / "agents/configs/site.yaml").read_text())
    report = collect_production(build_report("production"), tmp_path / "private", env={},
                                api_factory=lambda: pytest.fail("Missing sources must not make API calls"))
    assert report["latestRun"]["status"] == "skipped"
    assert not report["publicSafeKpis"]
    validate_public_report(report)


def test_live_mock_catalog_stays_private(tmp_path, monkeypatch):
    import agents.jobs.pipeline as pipeline
    monkeypatch.setattr(pipeline, "ROOT", tmp_path)
    (tmp_path / "agents/configs").mkdir(parents=True)
    (tmp_path / "agents/configs/site.yaml").write_text((ROOT / "agents/configs/site.yaml").read_text())
    api = lambda: ApiClient(httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200, json=catalog_payload()))))  # noqa: E731
    report = collect_production(build_report("production"), tmp_path / "private", env={"SHOPIFY_STORE_DOMAIN": "test.myshopify.com", "SHOPIFY_ADMIN_ACCESS_TOKEN": "test"}, api_factory=api)
    assert report["sourceHealth"][0]["status"] == "connected"
    assert not report["productAuditSummaries"] and not report["recommendations"]
    assert "targetGid" not in json.dumps(report)
    proposals = json.loads((tmp_path / "private/proposals.json").read_text())
    assert len(proposals) == 1
    assert proposals[0]["status"] == "needs_review"


def test_manual_observations_are_not_rankings():
    data = {"kind": "citation", "model": "Manual test", "prompt": "How should silver be cleaned?",
            "observed_at": "2026-10-23T12:00:00+05:30", "region": "India", "account_conditions": "Manual signed-in test",
            "snippet": "Example observation only", "source_url": "https://ratniva.com/", "appeared": False}
    assert validate_evidence(data)["appeared"] is False
    with pytest.raises(ValueError):
        validate_evidence({**data, "rank": 1})
