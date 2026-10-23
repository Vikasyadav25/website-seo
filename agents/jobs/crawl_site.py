"""Small robots-aware, same-origin crawl. No redirects or arbitrary-host fetching."""
import hashlib
import ipaddress
import json
import socket
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

from bs4 import BeautifulSoup
from lxml import etree

from agents.adapters.http import ApiClient, SourceError
from agents.models import SourceResult

USER_AGENT = "RatnivaGrowthAudit/0.1"


def safe_url(url: str) -> bool:
    parsed = urlparse(url)
    return (parsed.scheme == "https" and parsed.hostname == "ratniva.com"
            and parsed.port in (None, 443) and not parsed.username and not parsed.password
            and not parsed.query and not parsed.fragment)


def public_dns():
    addresses = socket.getaddrinfo("ratniva.com", 443, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(item[4][0]).is_global for item in addresses):
        raise SourceError("Crawl destination is not a public address")


def audit_html(url, html, headers, stamp):
    soup = BeautifulSoup(html, "lxml")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    description = soup.find("meta", attrs={"name": lambda v: v and v.lower() == "description"})
    canonical = soup.find("link", rel=lambda v: v and "canonical" in v)
    robots = soup.find("meta", attrs={"name": lambda v: v and v.lower() == "robots"})
    records = []

    def issue(category, severity, evidence, action):
        records.append({"kind": "issue", "id": hashlib.sha256(f"crawler:{url}:{category}".encode()).hexdigest()[:16],
                        "source": "crawler", "category": category, "severity": severity,
                        "targetUrl": url, "evidence": evidence, "discoveredAt": stamp,
                        "lastVerifiedAt": stamp, "recommendation": action})

    if not title:
        issue("missing-title", "high", "No nonempty HTML title detected.", "Verify template and intended page title.")
    if not description or not description.get("content", "").strip():
        issue("missing-meta", "medium", "No nonempty meta description detected.", "Review a factual, unique page summary.")
    if canonical and urljoin(url, canonical.get("href", "")) != url:
        issue("canonical-review", "medium", "Canonical differs from requested URL.", "Verify the preferred URL and consolidation intent.")
    noindex = ((robots.get("content", "") if robots else "") + " " + headers.get("x-robots-tag", "")).lower()
    if "noindex" in noindex:
        issue("noindex-review", "high", "Noindex signal detected.", "Verify index-exclusion intent before changing anything.")
    parsed_schema = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            parsed_schema.append(json.loads(script.get_text()))
        except ValueError:
            issue("invalid-jsonld", "medium", "An embedded JSON-LD block did not parse.", "Validate JSON syntax and supported structured data.")
    if not parsed_schema:
        issue("schema-review", "low", "No parseable JSON-LD found in fetched HTML.", "Check appropriate schema types; presence alone does not prove validity.")
    missing_alt = sum(not image.get("alt", "").strip() for image in soup.find_all("img"))
    if missing_alt:
        issue("image-alt-review", "low", f"{missing_alt} images have empty alt text, which may be intentional for decorative images.", "Review images individually and preserve decorative empty alt text.")
    text = soup.get_text(" ", strip=True)
    readiness = {"structuredDataPresent": bool(parsed_schema), "helpfulQuestionsPresent": bool(soup.find(["h2", "h3"], string=lambda s: s and "?" in s)),
                 "aboutOrContactLinkPresent": any("/pages/about" in a.get("href", "") or "/pages/contact" in a.get("href", "") for a in soup.find_all("a")),
                 "wordCount": len(text.split())}
    records.append({"kind": "page", "url": url, "title": title,
                    "description": description.get("content", "") if description else "",
                    "asOf": stamp, "readiness": readiness})
    links = [urljoin(url, a["href"]).split("#")[0] for a in soup.find_all("a", href=True)]
    return records, [link for link in links if safe_url(link)]


def crawl(api: ApiClient, paths: list[str], stamp: str, *, max_pages=8, delay=1.5, dns_check=public_dns):
    result = SourceResult(name="crawler", status="connected")
    queue = [urljoin("https://ratniva.com", p) for p in paths]
    seen = set()
    headers = {"User-Agent": USER_AGENT}
    try:
        dns_check()
        robots_response = api.request("GET", "https://ratniva.com/robots.txt", headers=headers)
        policy = RobotFileParser()
        policy.parse(robots_response.text.splitlines())
        crawl_delay = max(delay, policy.crawl_delay(USER_AGENT) or 0, policy.crawl_delay("*") or 0)
        if crawl_delay > 30:
            raise SourceError("Robots delay exceeds crawl time budget")
        if policy.can_fetch(USER_AGENT, "https://ratniva.com/sitemap.xml"):
            api.sleep(crawl_delay)
            dns_check()
            try:
                sitemap = api.request("GET", "https://ratniva.com/sitemap.xml", headers=headers)
                parser = etree.XMLParser(resolve_entities=False, no_network=True, load_dtd=False)
                root = etree.fromstring(sitemap.content, parser=parser)
                # Only seed a flat urlset; do not fan out nested sitemap indexes without a budget.
                if etree.QName(root).localname == "urlset":
                    queue.extend(link for link in root.xpath("//*[local-name()='loc']/text()") if safe_url(link))
            except (SourceError, etree.XMLSyntaxError, ValueError):
                result.message = "Sitemap unavailable or invalid; seed URLs used."
        while queue and len(seen) < max_pages:
            url = queue.pop(0)
            if url in seen or not safe_url(url) or not policy.can_fetch(USER_AGENT, url):
                continue
            seen.add(url)
            api.sleep(crawl_delay)
            dns_check()
            try:
                response = api.request("GET", url, headers=headers)
                if "text/html" not in response.headers.get("content-type", ""):
                    continue
                records, links = audit_html(url, response.text, response.headers, stamp)
                result.records.extend(records)
                queue.extend(link for link in links if link not in seen and link not in queue)
            except SourceError as error:
                result.complete = False
                result.records.append({"kind": "fetch-failure", "url": url, "asOf": stamp,
                                       "message": "Request failed or redirect not followed; verify status separately."})
                if error.status == 404:
                    result.records.append({"kind": "issue", "id": hashlib.sha256(f"404:{url}".encode()).hexdigest()[:16],
                                           "source": "crawler", "category": "http-404", "severity": "high",
                                           "targetUrl": url, "evidence": "URL returned HTTP 404 during this crawl.",
                                           "discoveredAt": stamp, "lastVerifiedAt": stamp,
                                           "recommendation": "Review internal links and whether removal or a relevant redirect is intended."})
        if queue:
            result.complete = False
        if not result.complete:
            result.message = "Bounded crawl completed partially; unvisited URLs are not assumed healthy."
        return result
    except (SourceError, OSError, ValueError):
        result.status = "failed"
        result.complete = False
        result.message = "Crawl skipped or incomplete: public destination/robots verification failed."
        return result
