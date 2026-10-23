"""Shopify Admin GraphQL catalog collection; no mutation in this adapter."""
import re
from pathlib import Path

from agents.adapters.http import ApiClient, SourceError
from agents.models import Product, SourceResult

QUERY = Path(__file__).with_suffix(".graphql").read_text(encoding="utf-8")


class Shopify:
    def __init__(self, domain: str, token: str, api: ApiClient, version="2026-07"):
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]*\.myshopify\.com", domain):
            raise SourceError("Invalid Shopify store domain")
        if not re.fullmatch(r"20\d{2}-(01|04|07|10)", version):
            raise SourceError("Invalid Shopify API version")
        self.url = f"https://{domain}/admin/api/{version}/graphql.json"
        self.headers = {"X-Shopify-Access-Token": token}
        self.api = api

    def inventory(self, max_pages=10) -> SourceResult:
        result = SourceResult(name="shopify", status="connected")
        cursor = None
        try:
            for _ in range(max_pages):
                for retry in range(3):
                    payload = self.api.json("POST", self.url, headers=self.headers,
                                            json={"query": QUERY, "variables": {"after": cursor}})
                    errors = payload.get("errors", [])
                    if not errors:
                        break
                    throttled = all(e.get("extensions", {}).get("code") == "THROTTLED" for e in errors)
                    if not throttled or retry == 2:
                        raise SourceError("Shopify GraphQL request failed")
                    self.api.sleep(2 ** retry)
                connection = payload["data"]["products"]
                for node in connection["nodes"]:
                    result.records.append(Product(
                        gid=node["id"], title=node["title"], product_type=node["productType"],
                        url=node.get("onlineStoreUrl"), updated_at=node["updatedAt"],
                        seo_title=node["seo"].get("title"), seo_description=node["seo"].get("description"),
                    ).model_dump())
                info = connection["pageInfo"]
                if not info["hasNextPage"]:
                    return result
                next_cursor = info["endCursor"]
                if not next_cursor or next_cursor == cursor:
                    raise SourceError("Shopify pagination did not advance")
                cursor = next_cursor
        except (SourceError, KeyError, TypeError, ValueError):
            result.status = "failed"
            result.complete = False
            result.message = "Catalog collection incomplete; retained records are private and partial."
            return result
        result.complete = False
        result.message = "Catalog page budget reached; partial inventory only."
        return result
