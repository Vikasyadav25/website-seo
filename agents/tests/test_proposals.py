import pytest

from agents.models import Product
from agents.proposals.draft import draft_product
from agents.proposals.validate import validate_proposal

STAMP = "2026-10-23T02:30:00Z"


def product(**changes):
    return Product(gid="gid://shopify/Product/1", title="Minimal ring", product_type="Rings",
                   url="https://ratniva.com/products/minimal-ring", seo_title=None,
                   seo_description=None, updated_at=STAMP).model_copy(update=changes)


def test_grounded_deterministic_draft():
    first = draft_product(product(), STAMP)
    assert first == draft_product(product(), STAMP)
    validate_proposal(first.model_dump())
    assert "925" not in first.fieldChanges[0].after
    assert first.fieldChanges[0].before is None


def test_preserve_good_copy():
    assert draft_product(product(seo_description="Useful original description."), STAMP) is None


def test_no_html_or_private_url():
    assert draft_product(product(title="<script>bad</script>"), STAMP) is None
    assert draft_product(product(url=None), STAMP) is None


def test_exact_hash_and_immutable_fields():
    proposal = draft_product(product(), STAMP).model_dump()
    proposal["fieldChanges"][0]["before"] = "changed baseline"
    with pytest.raises(ValueError):
        validate_proposal(proposal)
    proposal["fieldChanges"][0]["field"] = "price"
    with pytest.raises(ValueError):
        validate_proposal(proposal)
