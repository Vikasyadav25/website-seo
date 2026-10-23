"""Regenerate deterministic, explicitly synthetic development fixtures and schemas."""
import hashlib
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def obj(properties, required=None):
    return {"type": "object", "additionalProperties": False, "properties": properties,
            "required": list(properties) if required is None else required}


def arr(items):
    return {"type": "array", "items": items}


def enum(*values):
    return {"enum": list(values)}


string = {"type": "string", "maxLength": 2000}
date = {"type": "string", "format": "date-time"}
url = {"type": "string", "format": "uri", "pattern": "^https://"}
number = {"type": "number", "minimum": 0}
score = {"type": "integer", "minimum": 0, "maximum": 100}
rating = {"type": "integer", "minimum": 0, "maximum": 5}
nullable = {"type": ["string", "null"], "maxLength": 2000}
severity = enum("critical", "high", "medium", "low")
status = enum("draft", "needs_review", "approved", "rejected", "applied", "failed", "rolled_back")
source = obj({"name": enum("gsc", "shopify", "pagespeed", "crawler", "merchant_manual"),
              "status": enum("connected", "not_configured", "failed", "stale"),
              "lastSyncedAt": date, "message": string}, ["name", "status"])
issue = obj({"id": string, "source": string, "category": string, "severity": severity,
             "targetUrl": url, "evidence": string, "discoveredAt": date,
             "lastVerifiedAt": date, "recommendation": string})
run = obj({"runId": string, "startedAt": date, "finishedAt": date,
           "status": enum("success", "partial", "failed", "skipped"), "jobName": string,
           "sourceStatuses": arr(source), "issueCounts": obj({s: number for s in severity["enum"]}),
           "githubRunUrl": url}, ["runId", "startedAt", "status", "jobName", "sourceStatuses", "issueCounts"])
change = obj({"field": enum("seo.title", "seo.description"), "before": nullable, "after": nullable})
recommendation = obj({"id": string, "targetKind": enum("product", "collection", "page"),
                      "targetUrl": url, "reason": string, "risk": rating, "status": status,
                      "prUrl": url, "createdAt": date, "impact": rating, "confidence": rating,
                      "effort": {"type": "integer", "minimum": 1, "maximum": 5},
                      "fieldChanges": arr(change), "testPlan": string},
                     ["id", "targetKind", "targetUrl", "reason", "risk", "status", "createdAt",
                      "impact", "confidence", "effort", "fieldChanges", "testPlan"])
product = obj({"id": string, "title": string, "url": url, "productType": string,
               "score": score, "issues": arr(string), "reviewState": status, "lastAudit": date,
               "facts": arr(string), "checklist": arr(obj({"label": string, "passed": {"type": "boolean"}}))})
report = obj({
    "schemaVersion": {"const": 1}, "mode": enum("demo", "connected"), "generatedAt": date,
    "siteUrl": url, "repositoryUrl": {"anyOf": [{"type": "null"}, {**url, "pattern": "^https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"}]},
    "latestRun": {"anyOf": [{"type": "null"}, run]}, "sourceHealth": arr(source),
    "publicSafeKpis": arr(obj({"label": enum("Pages checked", "High severity issues", "Product SEO completion", "Awaiting review"),
                               "value": number, "unit": string, "asOf": date}, ["label", "value", "asOf"])),
    "issues": arr(issue), "productAuditSummaries": arr(product), "recommendations": arr(recommendation),
    "runs": arr(run), "healthHistory": arr(obj({"date": {"type": "string", "format": "date"}, "score": score, "pagesChecked": number})),
    "keywordClusters": arr(obj({"keyword": string, "intent": enum("Commercial", "Informational"), "landingPage": url,
                                 "branded": {"type": "boolean"}, "nextStep": string})),
    "readiness": arr(obj({"label": string, "status": enum("verified", "needs_review", "not_checked"), "evidence": string})),
    "competitors": arr(obj({"name": string, "url": url, "observation": nullable, "verifiedAt": {"anyOf": [date, {"type": "null"}]}})),
    "publishingEvents": arr(obj({"id": string, "status": enum("applied", "failed", "rolled_back"), "timestamp": date,
                                  "fields": arr(string), "jobUrl": url})),
})
report.update({"$schema": "http://json-schema.org/draft-07/schema#", "title": "PublicDashboardReport"})
proposal = obj({"id": string, "targetKind": enum("product"), "targetGid": {"type": "string", "pattern": "^gid://shopify/Product/[0-9]+$"},
                "targetUrl": url, "fieldChanges": arr(change), "baselineHash": {"type": "string", "pattern": "^[a-f0-9]{64}$"},
                "reason": string, "evidenceIds": arr(string), "impact": rating, "confidence": rating,
                "effort": {"type": "integer", "minimum": 1, "maximum": 5}, "risk": rating,
                "status": status, "createdAt": date})
proposal["$schema"] = report["$schema"]
stamp = "2026-10-23T02:30:00Z"
health = [{"name": n, "status": "not_configured", "message": "DEMO fixture; live source is not connected."}
          for n in ("gsc", "shopify", "pagespeed", "crawler", "merchant_manual")]
base = "https://ratniva.com"
issues = []
cases = [
    ("missing-meta", "high", "/products/demo-silver-ring", "Meta description is absent in the synthetic page.", "Draft a description using verified product facts."),
    ("canonical-review", "high", "/collections/demo-rings", "Synthetic collection canonical points to a different URL.", "Verify the preferred URL before changing the canonical."),
    ("missing-alt", "medium", "/products/demo-silver-hoops", "One synthetic product image has empty alt text.", "Review the image and write a factual description."),
    ("thin-introduction", "medium", "/collections/demo-earrings", "The synthetic collection lacks buying guidance.", "Add a short useful introduction grounded in the collection."),
    ("missing-title", "high", "/products/demo-silver-pendant", "The synthetic SEO title is empty.", "Review the proposed title against the product record."),
    ("schema-review", "low", "/pages/demo-care", "Structured data has not been validated in this example.", "Validate supported structured data; do not infer eligibility."),
]
for category, sev, path, evidence, action in cases:
    issues.append(dict(id=hashlib.sha256(path.encode()).hexdigest()[:12], source="demo", category=category,
                       severity=sev, targetUrl=base + path, evidence=evidence,
                       discoveredAt="2026-10-20T02:30:00Z", lastVerifiedAt=stamp, recommendation=action))
products = []
for i, (name, kind, path, value, issue_names) in enumerate([
    ("Demo · Minimal silver ring", "Rings", "demo-silver-ring", 72, ["missing-meta"]),
    ("Demo · Everyday silver hoops", "Earrings", "demo-silver-hoops", 86, ["missing-alt"]),
    ("Demo · Silver pendant", "Pendants", "demo-silver-pendant", 64, ["missing-title"]),
    ("Demo · Fine silver bracelet", "Bracelets", "demo-silver-bracelet", 96, []),
]):
    products.append(dict(id=f"DEMO-{i+1:03}", title=name, url=base + "/products/" + path, productType=kind,
                         score=value, issues=issue_names, reviewState="needs_review" if issue_names else "draft", lastAudit=stamp,
                         facts=["Synthetic development product", "Material: silver (fixture only; not a live product claim)"],
                         checklist=[{"label": "Descriptive product title", "passed": True},
                                    {"label": "Unique meta description", "passed": "missing-meta" not in issue_names},
                                    {"label": "Descriptive image alt text", "passed": "missing-alt" not in issue_names}]))
recommendations = []
for i, product_row in enumerate(products[:3]):
    field = "seo.description" if i != 2 else "seo.title"
    recommendations.append(dict(id=f"DEMO-P{i+1:03}", targetKind="product", targetUrl=product_row["url"],
                                reason=["Add a factual, useful meta description.", "Review the product summary for clarity.", "Add a descriptive product SEO title."][i],
                                risk=1 + i, status="needs_review", createdAt="2026-10-21T02:30:00Z",
                                impact=5-i, confidence=5, effort=1+i,
                                fieldChanges=[dict(field=field, before=None if i != 1 else "Silver hoops.",
                                                   after=["Explore a minimal silver ring from Ratniva. Review product details to find your preferred style.",
                                                          "Explore everyday silver hoops from Ratniva, with product details to help you choose.",
                                                          "Silver Pendant | Ratniva"][i])],
                                testPlan="Verify all claims against the product, preview the snippet, then compare completed 7/28-day GSC windows privately."))
counts = {s: sum(x["severity"] == s for x in issues) for s in severity["enum"]}
demo_run = dict(runId="DEMO-20261023", startedAt=stamp, finishedAt="2026-10-23T02:30:02Z", status="skipped",
                jobName="Demo fixture generation", sourceStatuses=health, issueCounts=counts)
end = datetime(2026, 10, 23, tzinfo=timezone.utc)
data = dict(schemaVersion=1, mode="demo", generatedAt=stamp, siteUrl=base, repositoryUrl=None,
            latestRun=demo_run, sourceHealth=health, issues=issues, productAuditSummaries=products,
            recommendations=recommendations, runs=[demo_run], publishingEvents=[],
            publicSafeKpis=[dict(label=label, value=value, asOf=stamp, **({"unit": "%"} if label.endswith("completion") else {}))
                            for label, value in [("Pages checked", 48), ("High severity issues", 3), ("Product SEO completion", 80), ("Awaiting review", 3)]],
            healthHistory=[dict(date=(end-timedelta(days=89-i)).date().isoformat(), score=min(84, 55+i//3+(i%5)), pagesChecked=40+i//11) for i in range(90)],
            keywordClusters=[dict(keyword=kw, intent=intent, landingPage=base+path, branded=False,
                                  nextStep="Research hypothesis: validate demand and catalogue fit using private GSC data.") for kw, intent, path in [
                                      ("silver rings for women", "Commercial", "/collections/demo-rings"),
                                      ("silver earrings for women", "Commercial", "/collections/demo-earrings"),
                                      ("925 sterling silver jewellery", "Commercial", "/collections/all"),
                                      ("how to clean sterling silver", "Informational", "/pages/demo-care")]],
            readiness=[dict(label=label, status=state, evidence=evidence) for label, state, evidence in [
                ("Helpful care guidance", "needs_review", "Synthetic example: care instructions need fact checking."),
                ("Consistent brand facts", "not_checked", "No live pages have been inspected."),
                ("Supported structured data", "not_checked", "Schema presence does not establish validity or rich-result eligibility."),
                ("Product questions answered", "needs_review", "Review sizing, material, and care information for usefulness.")]],
            competitors=[dict(name=n, url=u, observation=None, verifiedAt=None) for n,u in [("GIVA", "https://www.giva.co"), ("Palmonas", "https://www.palmonas.com"), ("Zavya", "https://www.zavya.co")]])
empty = {**data, "latestRun": None, "publicSafeKpis": [], "issues": [], "productAuditSummaries": [],
         "recommendations": [], "runs": [], "healthHistory": [], "keywordClusters": [], "readiness": [], "competitors": []}
sample = {k: v for k, v in recommendations[0].items() if k not in ("testPlan",)}
sample.update(targetGid="gid://shopify/Product/1", baselineHash=hashlib.sha256(b"demo baseline").hexdigest(), evidenceIds=[issues[0]["id"]])


def write(path, value):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


if __name__ == "__main__":
    for path, value in [("schemas/public-report.schema.json", report), ("schemas/issue.schema.json", issue),
                        ("schemas/run.schema.json", run), ("schemas/proposal.schema.json", proposal),
                        ("web/public/data/report.json", data), ("examples/demo-report.json", data),
                        ("examples/disconnected-report.json", empty), ("examples/demo-proposal.json", sample)]:
        write(path, value)
