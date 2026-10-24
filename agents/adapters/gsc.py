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
    result.complete = False
    if not result.message:
        result.message = "GSC row budget reached; partial data only."
    return result
