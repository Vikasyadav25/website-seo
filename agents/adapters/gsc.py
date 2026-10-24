"""Completed-date GSC analytics. All returned rows stay private."""
import json
from datetime import date, timedelta
from urllib.parse import quote

from agents.adapters.http import ApiClient, SourceError
from agents.models import SourceResult


def service_account_token(credentials_json: str) -> str:
    from google.auth.transport.requests import Request
    from google.oauth2 import service_account
    try:
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(credentials_json), scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
        credentials.refresh(Request())
        return credentials.token
    except Exception:
        raise SourceError("GSC identity could not be authenticated") from None


def property_access_hint(api: ApiClient, site: str, access_token: str) -> str:
    """Diagnose a rejected property without exporting identities or other sites."""
    try:
        payload = api.json("GET", "https://www.googleapis.com/webmasters/v3/sites",
                           headers={"Authorization": f"Bearer {access_token}"}, max_attempts=1)
        entries = payload.get("siteEntry", [])
        if not isinstance(entries, list):
            return "Property access check unavailable."
        authorized = {entry.get("siteUrl") for entry in entries if isinstance(entry, dict)
                      and isinstance(entry.get("siteUrl"), str)
                      and isinstance(entry.get("permissionLevel"), str)
                      and entry.get("permissionLevel") in {"siteOwner", "siteFullUser", "siteRestrictedUser"}}
        if site in authorized:
            return "Configured property is listed; its analytics request was rejected."
        if site == "https://ratniva.com/" and "sc-domain:ratniva.com" in authorized:
            return "Configured URL-prefix property is not authorized. Domain property is authorized; use GSC_SITE_URL=sc-domain:ratniva.com."
        if authorized & {"https://ratniva.com/", "https://www.ratniva.com/", "sc-domain:ratniva.com"}:
            return "A different Ratniva property is authorized; verify the exact GSC_SITE_URL."
        return "No authorized Ratniva property found for this identity. Add this identity in Search Console users and permissions."
    except SourceError:
        return "Property access check unavailable."


def collect_gsc(api: ApiClient, site: str, access_token: str, *, today=None, days=28, max_pages=5):
    today = today or date.today()
    end = today - timedelta(days=3)
    start = end - timedelta(days=days - 1)
    endpoint = f"https://www.googleapis.com/webmasters/v3/sites/{quote(site, safe='')}/searchAnalytics/query"
    result = SourceResult(name="gsc", status="connected")
    try:
        for page in range(max_pages):
            body = {"startDate": start.isoformat(), "endDate": end.isoformat(),
                    "dimensions": ["date", "query", "page", "device", "country"],
                    "dataState": "final", "rowLimit": 1000, "startRow": page * 1000}
            payload = api.json("POST", endpoint, headers={"Authorization": f"Bearer {access_token}"}, json=body)
            rows = payload.get("rows", [])
            if not isinstance(rows, list):
                raise SourceError("GSC rows malformed")
            for row in rows:
                if (not isinstance(row, dict) or len(row.get("keys", [])) != 5
                        or any(not isinstance(row.get(k), (int, float)) for k in ("clicks", "impressions", "ctr", "position"))):
                    raise SourceError("GSC row malformed")
            result.records.extend(rows)
            if len(rows) < 1000:
                result.message = f"Final reporting window {start.isoformat()} to {end.isoformat()}; API rows are not exhaustive."
                return result
    except SourceError as error:
        result.status = "failed"
        result.message = f"Search performance collection incomplete ({error.diagnostic()}); retained rows stay private."
        if error.status == 403 and error.code not in {"SERVICE_DISABLED", "accessNotConfigured"}:
            result.message += " " + property_access_hint(api, site, access_token)
    result.complete = False
    if not result.message:
        result.message = "GSC row budget reached; partial data only."
    return result
