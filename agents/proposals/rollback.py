"""Rollback only when current fields still exactly equal the applied values."""
import argparse
import os
import sys
from pathlib import Path

import httpx

from agents.adapters.http import ApiClient, SourceError
from agents.adapters.shopify import Shopify
from agents.proposals.apply import load_encrypted, operator_authorized, read_state, write_fields, write_switches


def rollback_receipt(shop, receipt, event_id, execute=True):
    if (receipt.get("schemaVersion") != 1 or receipt.get("eventId") != event_id
            or not receipt.get("before") or set(receipt["before"]) - {"seo.title", "seo.description"}
            or set(receipt["before"]) != set(receipt.get("after", {}))):
        raise ValueError("Invalid rollback event")
    current = read_state(shop, receipt["targetGid"])
    actual = {key: current[key] for key in receipt["after"]}
    if actual == receipt["before"]:
        return "already_rolled_back"
    if actual != receipt["after"]:
        raise ValueError("Current fields changed since publication; rollback refused")
    if not execute:
        return "ready_for_rollback"
    write_fields(shop, receipt["targetGid"], receipt["before"])
    verified = read_state(shop, receipt["targetGid"])
    if {key: verified[key] for key in receipt["before"]} != receipt["before"]:
        raise ValueError("Rollback verification failed")
    return "rolled_back"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--event-id", required=True)
    parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    api = ApiClient()
    try:
        env = os.environ
        operator_authorized(env, api.client)
        receipt = load_encrypted(args.receipt, env.get("ROLLBACK_ENCRYPTION_KEY", ""))
        if args.execute:
            write_switches(env)
        shop = Shopify(env.get("SHOPIFY_STORE_DOMAIN", ""), env.get("SHOPIFY_ADMIN_ACCESS_TOKEN", ""), api)
        print("Rollback state: " + rollback_receipt(shop, receipt, args.event_id, execute=args.execute))
        return 0
    except (ValueError, OSError, SourceError, httpx.HTTPError):
        print("Rollback refused or unconfirmed; inspect the current fields before retrying.", file=sys.stderr)
        return 1
    finally:
        api.close()


if __name__ == "__main__":
    raise SystemExit(main())
