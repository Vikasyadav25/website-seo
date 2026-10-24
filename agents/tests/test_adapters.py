import json
from datetime import date

import httpx
import pytest

from agents.adapters.gsc import collect_gsc
from agents.adapters.http import ApiClient, BudgetExceeded, SourceError
from agents.adapters.pagespeed import collect_pagespeed
from agents.adapters.shopify import Shopify, client_credentials_token
from agents.jobs.crawl_site import audit_html, crawl, safe_url

STAMP = "2026-10-23T02:30:00Z"


def client(handler, calls=30):
    return ApiClient(httpx.Client(transport=httpx.MockTransport(handler)), calls=calls, sleep=lambda _: None)


def catalog_payload(next_page=False):
    return {"data": {"products": {"nodes": [{"id": "gid://shopify/Product/1", "title": "Silver ring",
            "productType": "Rings", "onlineStoreUrl": "https://ratniva.com/products/ring", "updatedAt": STAMP,
            "seo": {"title": None, "description": None}}], "pageInfo": {"hasNextPage": next_page, "endCursor": "cursor1"}}}}


def test_shopify_client_credentials_exchange():
    def handler(request):
        from urllib.parse import parse_qs
        assert request.url == "https://test.myshopify.com/admin/oauth/access_token"
        assert request.method == "POST"
        assert parse_qs(request.content.decode()) == {
            "grant_type": ["client_credentials"], "client_id": ["test-client"], "client_secret": ["test-secret"],
        }
        return httpx.Response(200, json={"access_token": "test-token", "expires_in": 86399, "scope": "read_products"})

    assert client_credentials_token("test.myshopify.com", "test-client", "test-secret", client(handler)) == "test-token"


@pytest.mark.parametrize("payload", [
    {}, {"access_token": "", "expires_in": 86399, "scope": "read_products"},
    {"access_token": "test-token", "expires_in": 86399, "scope": "read_orders"},
    {"access_token": "test-token", "expires_in": 0, "scope": "read_products"},
    {"access_token": "test-token", "expires_in": True, "scope": "read_products"},
])
def test_shopify_rejects_invalid_token_response(payload):
    with pytest.raises(SourceError, match="token response"):
        client_credentials_token("test.myshopify.com", "test-client", "test-secret",
                                 client(lambda _: httpx.Response(200, json=payload)))


def test_shopify_token_errors_are_redacted_and_domain_is_checked_before_sending():
    api = client(lambda _: pytest.fail("Credentials must not reach an invalid host"))
    with pytest.raises(SourceError):
        client_credentials_token("test.myshopify.com.evil.example", "test-client", "test-secret", api)
    api = client(lambda _: httpx.Response(403, json={"error": "PRIVATE_REMOTE_RESPONSE"}))
    with pytest.raises(SourceError) as error:
        client_credentials_token("test.myshopify.com", "test-client", "test-secret", api)
    assert "PRIVATE_REMOTE_RESPONSE" not in str(error.value)


def test_shopify_success_pagination():
    calls = []

    def handler(request):
        calls.append(json.loads(request.content))
        return httpx.Response(200, json=catalog_payload(len(calls) == 1))

    result = Shopify("test.myshopify.com", "not-a-real-token", client(handler)).inventory()
    assert len(result.records) == 2
    assert calls[1]["variables"]["after"] == "cursor1"
    assert result.complete


@pytest.mark.parametrize("status", [401, 403, 429, 503])
def test_adapters_http_failures(status, tmp_path):
    api = client(lambda _: httpx.Response(status, json={"error": "sensitive-remote-detail"}))
    results = [Shopify("test.myshopify.com", "x", api).inventory(),
               collect_gsc(api, "sc-domain:ratniva.com", "x"),
               collect_pagespeed(api, ["https://ratniva.com/"], "x", tmp_path)]
    assert all(r.status == "failed" and not r.complete for r in results)
    assert all("sensitive-remote-detail" not in r.message for r in results)


def test_retry_then_success():
    counter = []

    def handler(_):
        counter.append(1)
        return httpx.Response(429 if len(counter) == 1 else 200, json=catalog_payload(), headers={"retry-after": "0"})

    assert Shopify("test.myshopify.com", "x", client(handler)).inventory().status == "connected"
    assert len(counter) == 2


@pytest.mark.parametrize("status,reason", [(403, "SERVICE_DISABLED"), (429, "RATE_LIMIT_EXCEEDED")])
def test_google_errors_keep_only_allowlisted_diagnostics(status, reason, tmp_path):
    def handler(_):
        return httpx.Response(status, json={"error": {
            "message": "PRIVATE_REMOTE_RESPONSE",
            "details": [{"reason": reason, "metadata": {"key": "PRIVATE_CREDENTIAL"}}],
        }})

    for result in [collect_gsc(client(handler), "sc-domain:ratniva.com", "x"),
                   collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)]:
        assert result.status == "failed"
        assert f"HTTP {status}" in result.message and reason in result.message
        assert "PRIVATE_" not in result.message


@pytest.mark.parametrize("payload", [
    {"error": {"errors": [{"reason": "PRIVATE_CREDENTIAL"}]}},
    {"error": {"details": [{"reason": ["PRIVATE_CREDENTIAL"]}]}},
    {"error": "PRIVATE_CREDENTIAL"},
    {"error": {"details": None}},
])
def test_remote_error_content_is_never_used_as_a_diagnostic(payload):
    api = client(lambda _: httpx.Response(403, json=payload))
    result = collect_gsc(api, "sc-domain:ratniva.com", "x")
    assert "HTTP 403" in result.message
    assert "PRIVATE_CREDENTIAL" not in result.message


def test_timeouts_for_all_adapters(tmp_path):
    def handler(request):
        raise httpx.ReadTimeout("secret-url", request=request)

    for result in [Shopify("test.myshopify.com", "x", client(handler)).inventory(),
                   collect_gsc(client(handler), "sc-domain:ratniva.com", "x"),
                   collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)]:
        assert result.status == "failed"
        assert "secret-url" not in result.message

    result = collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)
    assert "timeout" in result.message and "0 succeeded" in result.message


def test_shopify_partial_and_graphql_errors():
    calls = []

    def handler(_):
        calls.append(1)
        return httpx.Response(200, json=catalog_payload(True)) if len(calls) == 1 else httpx.Response(403)

    result = Shopify("test.myshopify.com", "x", client(handler)).inventory()
    assert not result.complete and len(result.records) == 1
    errors = client(lambda _: httpx.Response(200, json={"errors": [{"message": "private info"}]}))
    assert Shopify("test.myshopify.com", "x", errors).inventory().status == "failed"


def test_gsc_final_window():
    bodies = []

    def handler(request):
        bodies.append(json.loads(request.content))
        return httpx.Response(200, json={"rows": [{"keys": ["2026-10-20", "query", "https://ratniva.com/", "mobile", "ind"], "clicks": 2, "impressions": 10, "ctr": .2, "position": 8}]})

    result = collect_gsc(client(handler), "sc-domain:ratniva.com", "x", today=date(2026, 10, 23))
    assert result.complete and len(result.records) == 1
    assert bodies[0]["dataState"] == "final" and bodies[0]["endDate"] == "2026-10-20"


@pytest.mark.parametrize("entries,hint", [
    ([{"siteUrl": "sc-domain:ratniva.com", "permissionLevel": "siteFullUser"}],
     "use GSC_SITE_URL=sc-domain:ratniva.com"),
    ([{"siteUrl": "https://ratniva.com/", "permissionLevel": "siteFullUser"}],
     "Configured property is listed"),
    ([{"siteUrl": "https://www.ratniva.com/", "permissionLevel": "siteOwner"}],
     "A different Ratniva property is authorized"),
    ([{"siteUrl": "sc-domain:ratniva.com", "permissionLevel": "siteUnverifiedUser"}],
     "No authorized Ratniva property found"),
    ([{"siteUrl": "PRIVATE_OTHER_PROPERTY", "permissionLevel": ["PRIVATE_INVALID_PERMISSION"]}],
     "No authorized Ratniva property found"),
])
def test_gsc_checks_property_access_without_exposing_other_sites(entries, hint):
    calls = []

    def handler(request):
        calls.append(request.method)
        if request.method == "GET":
            return httpx.Response(200, json={"siteEntry": entries + [
                {"siteUrl": "PRIVATE_OTHER_PROPERTY", "permissionLevel": "siteOwner"}]})
        return httpx.Response(403, json={"error": {"errors": [{"reason": "forbidden"}]}})

    result = collect_gsc(client(handler), "https://ratniva.com/", "PRIVATE_TOKEN")
    assert calls == ["POST", "GET"]
    assert result.status == "failed" and hint in result.message
    assert "PRIVATE_" not in result.message


def test_pagespeed_cache(tmp_path):
    calls = []

    def handler(_):
        calls.append(1)
        return httpx.Response(200, json={"lighthouseResult": {"fetchTime": STAMP, "categories": {"performance": {"score": .8}}, "audits": {}}})

    api = client(handler)
    first = collect_pagespeed(api, ["https://ratniva.com/"], "x", tmp_path)
    second = collect_pagespeed(api, ["https://ratniva.com/"], "x", tmp_path)
    assert first.records == second.records
    assert len(calls) == 2  # mobile + desktop, then cached


def test_pagespeed_uses_longer_single_attempt_samples(tmp_path):
    calls = []

    def handler(request):
        calls.append(1)
        assert request.extensions["timeout"]["read"] == 60
        raise httpx.ReadTimeout("PRIVATE_URL", request=request)

    result = collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)
    assert len(calls) == 2  # one attempt per strategy; avoids three long retries
    assert result.status == "failed" and "timeout" in result.message


def test_gsc_retains_partial_rows():
    calls = []
    row = {"keys": ["2026-10-20", "query", "https://ratniva.com/", "mobile", "ind"], "clicks": 1, "impressions": 10, "ctr": .1, "position": 8}

    def handler(_):
        calls.append(1)
        return httpx.Response(200, json={"rows": [row] * 1000}) if len(calls) == 1 else httpx.Response(403)

    result = collect_gsc(client(handler), "sc-domain:ratniva.com", "x")
    assert result.status == "failed" and not result.complete
    assert len(result.records) == 1000


def test_pagespeed_partial_samples(tmp_path):
    def handler(request):
        if request.url.params["strategy"] == "desktop":
            return httpx.Response(403)
        return httpx.Response(200, json={"lighthouseResult": {"fetchTime": STAMP, "categories": {"performance": {"score": .8}}, "audits": {}}})

    result = collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)
    assert result.status == "failed" and not result.complete and len(result.records) == 1


def test_no_api_budget():
    with pytest.raises(BudgetExceeded):
        client(lambda _: httpx.Response(200), calls=0).request("GET", "https://ratniva.com")


def test_html_evidence_and_no_claimed_indexing():
    records, links = audit_html("https://ratniva.com/", '<html><meta name="robots" content="noindex"><a href="https://evil.example/">x</a></html>', {}, STAMP)
    assert {r.get("category") for r in records} >= {"missing-title", "missing-meta", "noindex-review"}
    assert not links
    assert not safe_url("https://ratniva.com/?token=x")
    assert not safe_url("https://localhost/")


def test_robots_disallow_and_cross_host_redirects():
    visited = []

    def handler(request):
        visited.append(str(request.url))
        return httpx.Response(200, text="User-agent: *\nDisallow: /\n")

    result = crawl(client(handler), ["/"], STAMP, delay=0, dns_check=lambda: None)
    assert result.status == "connected"
    assert visited == ["https://ratniva.com/robots.txt"]
    assert not result.records


def test_crawler_partial_results():
    def handler(request):
        if request.url.path == "/robots.txt":
            return httpx.Response(200, text="User-agent: *\nAllow: /\n")
        if request.url.path == "/":
            return httpx.Response(200, text='<html><title>Home</title><a href="/missing">Missing</a></html>', headers={"content-type": "text/html"})
        return httpx.Response(404)

    result = crawl(client(handler), ["/"], STAMP, delay=0, dns_check=lambda: None)
    assert not result.complete
    assert any(r.get("category") == "http-404" for r in result.records)


def test_auth_domain_boundary():
    with pytest.raises(SourceError):
        Shopify("evil.example", "x", client(lambda _: httpx.Response(200)))
