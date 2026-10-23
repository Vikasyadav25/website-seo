"""Explicit approved SEO writes, with encrypted originals and no automatic retry."""
import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from cryptography.fernet import Fernet, InvalidToken

from agents.adapters.http import ApiClient, SourceError
from agents.adapters.shopify import Shopify
from agents.proposals.draft import digest
from agents.proposals.validate import validate_proposal
from agents.security.public_allowlist import ROOT

STATE_QUERY = Path(__file__).with_name("product-state.graphql").read_text(encoding="utf-8")
UPDATE = Path(__file__).with_name("product-update.graphql").read_text(encoding="utf-8")


def read_state(shop: Shopify, gid: str) -> dict:
    payload = shop.api.json("POST", shop.url, headers=shop.headers,
                            json={"query": STATE_QUERY, "variables": {"id": gid}})
    if payload.get("errors") or not payload.get("data", {}).get("product"):
        raise ValueError("Current product state unavailable")
    state = payload["data"]["product"]
    if state["id"] != gid or not isinstance(state.get("updatedAt"), str):
        raise ValueError("Unexpected product state")
    return {"updatedAt": state["updatedAt"], "seo.title": state["seo"].get("title"),
            "seo.description": state["seo"].get("description")}


def write_fields(shop: Shopify, gid: str, fields: dict):
    if not fields or set(fields) - {"seo.title", "seo.description"}:
        raise ValueError("Unsupported publication fields")
    seo = {key.split(".")[1]: value for key, value in fields.items()}
    # No automatic retry: a lost response could mean Shopify applied the mutation.
    try:
        response = shop.api.client.post(shop.url, headers=shop.headers, timeout=20,
                                        json={"query": UPDATE, "variables": {"product": {"id": gid, "seo": seo}}})
        payload = response.json()
        result = payload.get("data", {}).get("productUpdate")
        if (not response.is_success or payload.get("errors") or not result
                or result.get("userErrors") or not result.get("product")):
            raise ValueError("Shopify did not confirm the update")
    except (httpx.TransportError, ValueError, KeyError, TypeError):
        raise ValueError("Write outcome requires verification; do not retry blindly") from None


def exact_proposal(data, proposal_id, proposal_hash):
    proposal = validate_proposal(data)
    if proposal.id != proposal_id or digest(data) != proposal_hash:
        raise ValueError("Approved proposal ID or content hash mismatch")
    if proposal.status != "approved":
        raise ValueError("Proposal is not explicitly approved")
    return proposal


def operator_authorized(env, client):
    """Verify actual GitHub maintainer permission for protected manual workflows."""
    if (env.get("GITHUB_EVENT_NAME") != "workflow_dispatch" or env.get("GITHUB_REF") != "refs/heads/main"
            or env.get("GITHUB_ACTOR") not in env.get("PUBLISH_OPERATORS", "").split(",")):
        raise ValueError("Only allowlisted maintainers on manual main-branch workflows may publish")
    actor = env["GITHUB_ACTOR"]
    repo = env.get("GITHUB_REPOSITORY", "")
    import re
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo) or not re.fullmatch(r"[A-Za-z0-9-]+", actor):
        raise ValueError("Invalid trusted workflow identity")
    response = client.get(f"https://api.github.com/repos/{repo}/collaborators/{actor}/permission",
                          headers={"Authorization": f"Bearer {env.get('GITHUB_TOKEN', '')}",
                                   "Accept": "application/vnd.github+json"}, timeout=15)
    if response.status_code != 200:
        raise ValueError("Repository maintainer permission required")
    permissions = response.json()
    role = permissions.get("role_name", permissions.get("permission"))
    if role not in ("admin", "maintain"):
        raise ValueError("Repository maintainer permission required")


def write_switches(env):
    if (env.get("PUBLISH_ENABLED") != "true" or env.get("ENABLE_SHOPIFY_WRITES") != "true"
            or env.get("DRY_RUN", "true") != "false"):
        raise ValueError("Shopify publication kill switch is off")


def prepare(shop, proposal, proposal_hash):
    before = {change.field: change.before for change in proposal.fieldChanges}
    after = {change.field: change.after for change in proposal.fieldChanges}
    current = read_state(shop, proposal.targetGid)
    values = {field: current[field] for field in before}
    if values == after:
        return None  # Idempotent: do not overwrite the original rollback receipt.
    if values != before or digest(values) != proposal.baselineHash:
        raise ValueError("Stale proposal: current fields no longer match the reviewed baseline")
    return {"schemaVersion": 1, "eventId": digest({"proposal": proposal_hash})[:24],
            "proposalHash": proposal_hash, "proposalId": proposal.id, "targetGid": proposal.targetGid,
            "before": before, "after": after, "preparedUpdatedAt": current["updatedAt"],
            "preparedAt": datetime.now(timezone.utc).isoformat()}


def apply_receipt(shop, receipt, proposal, proposal_hash):
    if (receipt.get("schemaVersion") != 1 or receipt.get("proposalHash") != proposal_hash
            or receipt.get("proposalId") != proposal.id or receipt.get("targetGid") != proposal.targetGid
            or receipt.get("before") != {c.field: c.before for c in proposal.fieldChanges}
            or receipt.get("after") != {c.field: c.after for c in proposal.fieldChanges}):
        raise ValueError("Rollback receipt does not match the approved proposal")
    current = read_state(shop, receipt["targetGid"])
    actual = {field: current[field] for field in receipt["before"]}
    if actual == receipt["after"]:
        return "already_applied"
    if actual != receipt["before"] or current["updatedAt"] != receipt["preparedUpdatedAt"]:
        raise ValueError("Product changed since rollback capture; refusing the write")
    write_fields(shop, receipt["targetGid"], receipt["after"])
    verified = read_state(shop, receipt["targetGid"])
    if {field: verified[field] for field in receipt["after"]} != receipt["after"]:
        raise ValueError("Post-publication field verification failed")
    return "applied"


def save_encrypted(receipt, path, key):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Refuse accidental replacement of an existing original-state receipt.
    with path.open("xb") as handle:
        handle.write(Fernet(key).encrypt(json.dumps(receipt).encode()))


def load_encrypted(path, key):
    try:
        return json.loads(Fernet(key).decrypt(path.read_bytes()))
    except (InvalidToken, ValueError):
        raise ValueError("Rollback receipt could not be authenticated") from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--proposal-id", required=True)
    parser.add_argument("--proposal-hash", required=True)
    parser.add_argument("--stage", choices=["dry-run", "prepare", "apply"], default="dry-run")
    parser.add_argument("--receipt", type=Path, default=ROOT / "private/rollback.enc")
    args = parser.parse_args()
    env = os.environ
    api = ApiClient()
    try:
        data = json.loads(env.get("APPROVED_PROPOSAL_JSON", "{}"))
        proposal = exact_proposal(data, args.proposal_id, args.proposal_hash)
        operator_authorized(env, api.client)
        shop = Shopify(env.get("SHOPIFY_STORE_DOMAIN", ""), env.get("SHOPIFY_ADMIN_ACCESS_TOKEN", ""), api)
        if args.stage == "dry-run":
            receipt = prepare(shop, proposal, args.proposal_hash)
            print("Dry run validated; no Shopify write. State: " + ("already applied" if receipt is None else "ready for protected preparation"))
            return 0
        write_switches(env)
        if args.stage == "prepare":
            receipt = prepare(shop, proposal, args.proposal_hash)
            if receipt is None:
                if env.get("GITHUB_OUTPUT"):
                    with Path(env["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
                        output.write("prepared=false\n")
                print("Already applied; original rollback receipt must be retained.")
                return 0
            save_encrypted(receipt, args.receipt, env.get("ROLLBACK_ENCRYPTION_KEY", ""))
            if env.get("GITHUB_OUTPUT"):
                with Path(env["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
                    output.write("prepared=true\n")
            event = {"id": receipt["eventId"], "proposalId": proposal.id, "status": "prepared",
                     "fields": list(receipt["after"]), "timestamp": receipt["preparedAt"]}
            args.receipt.with_suffix(".event.json").write_text(json.dumps(event), encoding="utf-8")
            print("Encrypted original captured. Upload it successfully before the apply stage.")
        else:
            if env.get("ROLLBACK_CAPTURE_UPLOADED") != "true":
                raise ValueError("Original-state artifact upload has not been confirmed")
            receipt = load_encrypted(args.receipt, env.get("ROLLBACK_ENCRYPTION_KEY", ""))
            status = apply_receipt(shop, receipt, proposal, args.proposal_hash)
            event_path = args.receipt.with_suffix(".event.json")
            event = json.loads(event_path.read_text(encoding="utf-8"))
            event["status"] = status
            event["timestamp"] = datetime.now(timezone.utc).isoformat()
            event_path.write_text(json.dumps(event), encoding="utf-8")
            print("Publication state: " + status)
        return 0
    except (ValueError, OSError, SourceError, httpx.HTTPError):
        print("Publication refused or unconfirmed. No sensitive response was logged; inspect state before retrying.", file=sys.stderr)
        return 1
    finally:
        api.close()


if __name__ == "__main__":
    raise SystemExit(main())
