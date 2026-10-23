import copy
import json

import httpx
import pytest
from cryptography.fernet import Fernet

from agents.adapters.http import ApiClient
from agents.adapters.shopify import Shopify
from agents.proposals.apply import (apply_receipt, exact_proposal, load_encrypted, operator_authorized,
                                    prepare, save_encrypted, write_switches)
from agents.proposals.draft import digest, draft_product
from agents.proposals.rollback import rollback_receipt
from agents.tests.test_proposals import STAMP, product


def approved():
    data = draft_product(product(), STAMP).model_dump()
    data["status"] = "approved"
    return data, exact_proposal(data, data["id"], digest(data)), digest(data)


def store():
    state = {"seo.title": None, "seo.description": None, "updatedAt": STAMP}
    writes = []

    def handler(request):
        payload = json.loads(request.content)
        if payload["query"].lstrip().startswith("mutation"):
            writes.append(payload)
            seo = payload["variables"]["product"]["seo"]
            for key, value in seo.items():
                state["seo." + key] = value
            state["updatedAt"] = "2026-10-23T03:00:00Z"
            return httpx.Response(200, json={"data": {"productUpdate": {"product": {"id": product().gid}, "userErrors": []}}})
        return httpx.Response(200, json={"data": {"product": {"id": product().gid, "updatedAt": state["updatedAt"],
                                                             "seo": {"title": state["seo.title"], "description": state["seo.description"]}}}})

    shop = Shopify("test.myshopify.com", "x", ApiClient(httpx.Client(transport=httpx.MockTransport(handler)), sleep=lambda _: None))
    return shop, state, writes


def test_dry_preparation_never_writes():
    _, proposal, hash_value = approved()
    shop, _, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    assert receipt["before"] == {"seo.description": None}
    assert not writes


def test_apply_idempotent_and_exact_fields():
    _, proposal, hash_value = approved()
    shop, _, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    assert apply_receipt(shop, receipt, proposal, hash_value) == "applied"
    assert apply_receipt(shop, receipt, proposal, hash_value) == "already_applied"
    assert len(writes) == 1
    assert set(writes[0]["variables"]["product"]) == {"id", "seo"}
    assert set(writes[0]["variables"]["product"]["seo"]) == {"description"}
    assert prepare(shop, proposal, hash_value) is None


def test_prepare_and_apply_refuse_stale_product():
    _, proposal, hash_value = approved()
    shop, state, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    state["seo.description"] = "Merchant wrote a new summary"
    with pytest.raises(ValueError):
        prepare(shop, proposal, hash_value)
    with pytest.raises(ValueError):
        apply_receipt(shop, receipt, proposal, hash_value)
    assert not writes


def test_modified_receipt_refused():
    _, proposal, hash_value = approved()
    shop, _, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    receipt["after"]["seo.description"] = "Unapproved edit"
    with pytest.raises(ValueError):
        apply_receipt(shop, receipt, proposal, hash_value)
    assert not writes


def test_rollback_does_not_override_subsequent_edits():
    _, proposal, hash_value = approved()
    shop, state, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    apply_receipt(shop, receipt, proposal, hash_value)
    state["seo.description"] = "New merchant change"
    with pytest.raises(ValueError):
        rollback_receipt(shop, receipt, receipt["eventId"])
    assert len(writes) == 1


def test_rollback_restores_only_selected_fields():
    _, proposal, hash_value = approved()
    shop, state, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    apply_receipt(shop, receipt, proposal, hash_value)
    assert rollback_receipt(shop, receipt, receipt["eventId"]) == "rolled_back"
    assert state["seo.description"] is None
    assert rollback_receipt(shop, receipt, receipt["eventId"]) == "already_rolled_back"
    assert len(writes) == 2


def test_rollback_dry_run_verifies_event_and_current_values():
    _, proposal, hash_value = approved()
    shop, _, writes = store()
    receipt = prepare(shop, proposal, hash_value)
    apply_receipt(shop, receipt, proposal, hash_value)
    assert rollback_receipt(shop, receipt, receipt["eventId"], execute=False) == "ready_for_rollback"
    assert len(writes) == 1
    with pytest.raises(ValueError):
        rollback_receipt(shop, receipt, "wrong-event", execute=False)


def test_unknown_mutation_outcome_not_retried():
    _, proposal, hash_value = approved()
    shop, _, _ = store()
    receipt = prepare(shop, proposal, hash_value)
    count = []
    original = shop.api.client

    def handler(request):
        body = json.loads(request.content)
        if body["query"].lstrip().startswith("mutation"):
            count.append(1)
            raise httpx.ReadTimeout("private response", request=request)
        return original.send(request)

    shop.api.client = httpx.Client(transport=httpx.MockTransport(handler))
    with pytest.raises(ValueError, match="verification"):
        apply_receipt(shop, receipt, proposal, hash_value)
    assert len(count) == 1


def test_approval_version_and_protected_fields():
    data, _, hash_value = approved()
    bad = copy.deepcopy(data)
    bad["status"] = "needs_review"
    with pytest.raises(ValueError):
        exact_proposal(bad, bad["id"], digest(bad))
    with pytest.raises(ValueError):
        exact_proposal(data, "wrong-id", hash_value)
    bad = copy.deepcopy(data)
    bad["fieldChanges"][0]["field"] = "price"
    with pytest.raises(ValueError):
        exact_proposal(bad, bad["id"], digest(bad))


def test_kill_switch_and_actual_maintainer_authority():
    with pytest.raises(ValueError):
        write_switches({})
    with pytest.raises(ValueError):
        write_switches({"PUBLISH_ENABLED": "true", "ENABLE_SHOPIFY_WRITES": "true"})
    write_switches({"PUBLISH_ENABLED": "true", "ENABLE_SHOPIFY_WRITES": "true", "DRY_RUN": "false"})
    env = {"GITHUB_EVENT_NAME": "workflow_dispatch", "GITHUB_REF": "refs/heads/main", "GITHUB_REPOSITORY": "owner/repo",
           "GITHUB_ACTOR": "maintainer", "PUBLISH_OPERATORS": "maintainer", "GITHUB_TOKEN": "test"}
    client = httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200, json={"permission": "admin"})))
    operator_authorized(env, client)
    env["GITHUB_REF"] = "refs/heads/untrusted"
    with pytest.raises(ValueError):
        operator_authorized(env, client)


def test_receipt_is_encrypted_authenticated_and_not_overwritten(tmp_path):
    key = Fernet.generate_key()
    _, proposal, hash_value = approved()
    shop, _, _ = store()
    receipt = prepare(shop, proposal, hash_value)
    path = tmp_path / "rollback.enc"
    save_encrypted(receipt, path, key)
    assert b"targetGid" not in path.read_bytes()
    assert load_encrypted(path, key) == receipt
    with pytest.raises(FileExistsError):
        save_encrypted(receipt, path, key)
    path.write_bytes(b"tampered")
    with pytest.raises(ValueError):
        load_encrypted(path, key)


@pytest.mark.parametrize("role,allowed", [("maintain", True), ("write", False), ("read", False)])
def test_github_roles_use_full_role_name(role, allowed):
    env = {"GITHUB_EVENT_NAME": "workflow_dispatch", "GITHUB_REF": "refs/heads/main", "GITHUB_REPOSITORY": "owner/repo",
           "GITHUB_ACTOR": "maintainer", "PUBLISH_OPERATORS": "maintainer", "GITHUB_TOKEN": "test"}
    # GitHub maps maintain to legacy permission=write; role_name distinguishes it.
    client = httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200, json={"permission": "write", "role_name": role})))
    if allowed:
        operator_authorized(env, client)
    else:
        with pytest.raises(ValueError):
            operator_authorized(env, client)
