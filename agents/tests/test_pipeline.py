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


@pytest.mark.parametrize("token_name", ["SHOPIFY_ADMIN_ACCESS_TOKEN", "SHOPIFY_READ_ACCESS_TOKEN", "client_credentials"])
def test_live_mock_catalog_stays_private(tmp_path, monkeypatch, token_name):
    import agents.jobs.pipeline as pipeline
    monkeypatch.setattr(pipeline, "ROOT", tmp_path)
    (tmp_path / "agents/configs").mkdir(parents=True)
    (tmp_path / "agents/configs/site.yaml").write_text((ROOT / "agents/configs/site.yaml").read_text())
    calls = []

    def handler(request):
        calls.append(request.url.path)
        if request.url.path == "/admin/oauth/access_token":
            return httpx.Response(200, json={"access_token": "PRIVATE_TOKEN_SENTINEL", "expires_in": 86399, "scope": "read_products"})
        if token_name == "client_credentials":
            assert request.headers["X-Shopify-Access-Token"] == "PRIVATE_TOKEN_SENTINEL"
        return httpx.Response(200, json=catalog_payload())

    api = lambda: ApiClient(httpx.Client(transport=httpx.MockTransport(handler)))  # noqa: E731
    credentials = {"SHOPIFY_CLIENT_ID": "PRIVATE_CLIENT_SENTINEL", "SHOPIFY_CLIENT_SECRET": "PRIVATE_SECRET_SENTINEL",
                   "SHOPIFY_READ_ACCESS_TOKEN": "old-token"} if token_name == "client_credentials" else {token_name: "test"}
    report = collect_production(build_report("production"), tmp_path / "private", env={"SHOPIFY_STORE_DOMAIN": "test.myshopify.com", **credentials}, api_factory=api)
    assert report["sourceHealth"][0]["status"] == "connected"
    assert not report["productAuditSummaries"] and not report["recommendations"]
    assert "targetGid" not in json.dumps(report)
    proposals = json.loads((tmp_path / "private/proposals.json").read_text())
    assert len(proposals) == 1
    assert proposals[0]["status"] == "needs_review"
    assert calls.count("/admin/oauth/access_token") == (1 if token_name == "client_credentials" else 0)
    for path in (tmp_path / "private").rglob("*"):
        if path.is_file():
            assert b"PRIVATE_TOKEN_SENTINEL" not in path.read_bytes()
            assert b"PRIVATE_SECRET_SENTINEL" not in path.read_bytes()
            assert b"PRIVATE_CLIENT_SENTINEL" not in path.read_bytes()
    assert "PRIVATE_TOKEN_SENTINEL" not in json.dumps(report)


def test_manual_observations_are_not_rankings():
    data = {"kind": "citation", "model": "Manual test", "prompt": "How should silver be cleaned?",
            "observed_at": "2026-10-23T12:00:00+05:30", "region": "India", "account_conditions": "Manual signed-in test",
            "snippet": "Example observation only", "source_url": "https://ratniva.com/", "appeared": False}
    assert validate_evidence(data)["appeared"] is False
    with pytest.raises(ValueError):
        validate_evidence({**data, "rank": 1})
