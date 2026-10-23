"""Bounded HTTP calls with redacted errors. Never include responses/URLs in logs."""
import time

import httpx


class SourceError(RuntimeError):
    def __init__(self, message, status=None):
        super().__init__(message)
        self.status = status


class BudgetExceeded(SourceError):
    pass


class ApiClient:
    def __init__(self, client: httpx.Client | None = None, *, calls=30, sleep=time.sleep):
        self.client = client or httpx.Client(timeout=20, follow_redirects=False)
        self.remaining = calls
        self.sleep = sleep
        self.owns_client = client is None

    def close(self):
        if self.owns_client:
            self.client.close()

    def request(self, method, url, **kwargs) -> httpx.Response:
        for attempt in range(3):
            if self.remaining <= 0:
                raise BudgetExceeded("Source call budget reached")
            self.remaining -= 1
            try:
                response = self.client.request(method, url, **kwargs)
            except httpx.TransportError:
                if attempt == 2:
                    raise SourceError("Source timeout or network failure") from None
                self.sleep(2 ** attempt)
                continue
            if response.status_code in (429, 500, 502, 503, 504):
                if attempt == 2:
                    raise SourceError("Source retry budget exhausted")
                delay = response.headers.get("retry-after", "")
                self.sleep(min(float(delay), 30) if delay.isdigit() else 2 ** attempt)
                continue
            if not response.is_success:
                raise SourceError(f"Source returned HTTP {response.status_code}", status=response.status_code)
            if len(response.content) > 6_000_000:
                raise SourceError("Source response exceeds size budget")
            return response
        raise SourceError("Source request incomplete")

    def json(self, method, url, **kwargs) -> dict:
        try:
            data = self.request(method, url, **kwargs).json()
            if not isinstance(data, dict):
                raise ValueError
            return data
        except ValueError:
            raise SourceError("Source returned malformed JSON") from None
