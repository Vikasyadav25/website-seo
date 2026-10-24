import json

import pytest

import agents.content.__main__ as content
from agents.main import build_report
from agents.security.public_allowlist import ROOT, validate_public_report


def test_assisted_review_manifest_passes_public_validation_and_matches_schema():
    workflow = json.loads((ROOT / "agents/content/silver-care-review.json").read_text(encoding="utf-8"))
    validate_public_report({**build_report("production"), "contentWorkflow": workflow})
    root_schema = json.loads((ROOT / "schemas/public-report.schema.json").read_text())
    assert root_schema["properties"]["contentWorkflow"] == json.loads((ROOT / "schemas/content-workflow.schema.json").read_text())
    assert workflow["status"] == "needs_review"
    assert workflow["stages"][-1]["status"] == "blocked"


def test_content_bundle_requires_safe_existing_assets_and_private_destination(tmp_path, monkeypatch):
    monkeypatch.setattr(content, "ROOT", tmp_path)
    source = ROOT / "agents/content/silver-care-review.json"
    with pytest.raises(ValueError):
        content.package_content(source, tmp_path / "public")
    with pytest.raises(ValueError, match="image"):
        content.package_content(source, tmp_path / "private/content")
    workflow = json.loads(source.read_text(encoding="utf-8"))
    for image in workflow["images"]:
        asset = tmp_path / "web/public" / image["src"]
        asset.parent.mkdir(parents=True, exist_ok=True)
        asset.write_bytes(b"TEST_ASSET")
    content.package_content(source, tmp_path / "private/content")
    article = (tmp_path / "private/content/article.md").read_text(encoding="utf-8")
    assert "Not published" in article
    assert workflow["draft"]["title"] in article
    assert (tmp_path / "private/content/manifest.json").exists()
