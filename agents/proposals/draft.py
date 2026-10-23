"""Conservative proposals for missing explicit SEO descriptions only."""
import hashlib
import json
import re

from agents.models import Change, PrivateProposal, Product


def digest(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def draft_product(product: Product, stamp: str) -> PrivateProposal | None:
    if product.seo_description and product.seo_description.strip():
        return None
    if not product.url or not product.url.startswith("https://ratniva.com/products/"):
        return None
    name = product.title.strip()
    if not name or len(name) > 100 or re.search(r"[<>\x00-\x1f]", name):
        return None
    # The authoritative title is the only factual input. No inferred purity/material/shipping claims.
    after = f"Explore {name} from Ratniva. Read the product details to find your preferred style."
    changes = [Change(field="seo.description", before=product.seo_description, after=after)]
    baseline = digest({"seo.description": product.seo_description})
    identity = digest({"gid": product.gid, "changes": [c.model_dump() for c in changes], "baseline": baseline})
    return PrivateProposal(id=f"P-{identity[:20]}", targetGid=product.gid, targetUrl=product.url,
                           fieldChanges=changes, baselineHash=baseline,
                           reason="Review an explicit SEO description; first confirm the storefront fallback is insufficient.",
                           evidenceIds=[digest({"gid": product.gid, "rule": "explicit-description-absent"})[:16]],
                           impact=2, confidence=3, effort=1, risk=1, status="needs_review", createdAt=stamp)
