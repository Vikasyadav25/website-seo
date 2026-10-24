"""Export only measured public-page findings; never catalog, GSC, or raw HTML."""
from agents.jobs.crawl_site import safe_url
from agents.security.public_allowlist import validate_public_report

CATEGORIES = frozenset({"missing-title", "missing-meta", "canonical-review", "noindex-review",
                        "invalid-jsonld", "schema-review", "image-alt-review", "http-404"})
FIELDS = ("id", "source", "category", "severity", "targetUrl", "evidence",
          "discoveredAt", "lastVerifiedAt", "recommendation")


def public_crawl_issues(records: list[dict], report: dict) -> list[dict]:
    exported = []
    for record in records:
        if record.get("kind") != "issue" or record.get("category") not in CATEGORIES:
            continue
        try:
            if record.get("source") != "crawler" or not safe_url(record.get("targetUrl", "")):
                continue
            issue = {key: record[key] for key in FIELDS}
            # Validate each sanitized row so an unsafe path/text cannot leak or break the whole report.
            validate_public_report({**report, "issues": [issue]})
            exported.append(issue)
        except (ValueError, KeyError, TypeError):
            continue
    return exported


def public_page_checks(records: list[dict], report: dict) -> list[dict]:
    """Export booleans about fetched public HTML, never titles, body text or private facts."""
    exported = []
    for record in records:
        if record.get("kind") != "page" or not safe_url(record.get("url", "")):
            continue
        readiness = record.get("readiness", {})
        try:
            row = {"url": record["url"], "checkedAt": record["asOf"],
                   "titlePresent": bool(record.get("title", "").strip()),
                   "descriptionPresent": bool(record.get("description", "").strip()),
                   **{key: readiness[key] for key in ("structuredDataPresent", "helpfulQuestionsPresent", "aboutOrContactLinkPresent")}}
            validate_public_report({**report, "pageChecks": [row]})
            exported.append(row)
        except (ValueError, KeyError, TypeError):
            continue
    return exported
