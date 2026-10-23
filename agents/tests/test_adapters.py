import json
from datetime import date

import httpx
import pytest

from agents.adapters.gsc import collect_gsc
from agents.adapters.http import ApiClient, BudgetExceeded, SourceError
from agents.adapters.pagespeed import collect_pagespeed
from agents.adapters.shopify import Shopify
from agents.jobs.crawl_site import audit_html, crawl, safe_url

STAMP = "2026-10-23T02:30:00Z"


def client(handler, calls=30):
    return ApiClient(httpx.Client(transport=httpx.MockTransport(handler)), calls=calls, sleep=lambda _: None)


def catalog_payload(next_page=False):
    return {"data": {"products": {"nodes": [{"id": "gid://shopify/Product/1", "title": "Silver ring",
            "productType": "Rings", "onlineStoreUrl": "https://ratniva.com/products/ring", "updatedAt": STAMP,
            "seo": {"title": None, "description": None}}], "pageInfo": {"hasNextPage": next_page, "endCursor": "cursor1"}}}}


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


def test_timeouts_for_all_adapters(tmp_path):
    def handler(request):
        raise httpx.ReadTimeout("secret-url", request=request)

    for result in [Shopify("test.myshopify.com", "x", client(handler)).inventory(),
                   collect_gsc(client(handler), "sc-domain:ratniva.com", "x"),
                   collect_pagespeed(client(handler), ["https://ratniva.com/"], "x", tmp_path)]:
        assert result.status == "failed"
        assert "secret-url" not in result.message


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
