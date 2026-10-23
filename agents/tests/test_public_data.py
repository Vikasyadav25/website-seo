import copy
import json

import pytest
from jsonschema import Draft7Validator, FormatChecker

from agents.main import build_report
from agents.security.public_allowlist import ROOT, validate_public_report


@pytest.fixture
def report():
    return build_report("demo")


def test_demo_deterministic(report):
    assert report == build_report("demo")
    assert report["mode"] == "demo"
    assert not report["publishingEvents"]
    assert all(s["status"] == "not_configured" for s in report["sourceHealth"])


def test_production_never_uses_demo_metrics():
    report = build_report("production")
    assert report["latestRun"]["status"] == "skipped"
    assert not report["publicSafeKpis"]
    assert not report["issues"]
    assert not report["recommendations"]
    validate_public_report(report)


@pytest.mark.parametrize("key", ["queries", "customers", "orders", "revenue", "targetGid", "credentials"])
def test_reject_unknown_fields(report, key):
    report[key] = []
    with pytest.raises(ValueError):
        validate_public_report(report)


@pytest.mark.parametrize("value", [
    "person@example.com", "shpat_" + "a" * 32, "github_pat_" + "b" * 40,
    "+91 98765 43210", "Bearer private-data", "-----BEGIN PRIVATE KEY-----",
    "https://ratniva.com/products/test?token=private", "https://user:password@ratniva.com/",
    "https://untrusted.example/", "sk-" + "z" * 32,
])
def test_sensitive_strings_rejected_without_echo(report, value):
    report["issues"][0]["evidence"] = value
    with pytest.raises(ValueError) as error:
        validate_public_report(report)
    assert value not in str(error.value)


def test_nested_unexpected_field(report):
    report["productAuditSummaries"][0]["sourceFacts"] = {"private": True}
    with pytest.raises(ValueError):
        validate_public_report(report)


def test_proposal_and_run_schemas(report):
    proposal = json.loads((ROOT / "examples/demo-proposal.json").read_text(encoding="utf-8"))
    for name, instance in [("proposal", proposal), ("run", report["latestRun"]), ("issue", report["issues"][0])]:
        schema = json.loads((ROOT / f"schemas/{name}.schema.json").read_text(encoding="utf-8"))
        Draft7Validator(schema, format_checker=FormatChecker()).validate(instance)


def test_bad_proposal_field_blocked():
    schema = json.loads((ROOT / "schemas/proposal.schema.json").read_text(encoding="utf-8"))
    proposal = json.loads((ROOT / "examples/demo-proposal.json").read_text(encoding="utf-8"))
    bad = copy.deepcopy(proposal)
    bad["fieldChanges"][0]["field"] = "price"
    assert not Draft7Validator(schema).is_valid(bad)


def test_repository_url_boundary():
    validate_public_report(build_report("demo", "https://github.com/ratniva/growth-os"))
    with pytest.raises(ValueError):
        build_report("demo", "https://evil.example/repo")
