"""Validate and retain manual AI observations/competitor evidence privately."""
import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Literal

from pydantic import Field, HttpUrl

from agents.models import StrictModel
from agents.security.public_allowlist import ROOT


class CitationObservation(StrictModel):
    kind: Literal["citation"]
    model: str = Field(min_length=1, max_length=120)
    prompt: str = Field(min_length=1, max_length=2000)
    observed_at: datetime
    region: str = Field(min_length=1, max_length=120)
    account_conditions: str = Field(min_length=1, max_length=500)
    snippet: str = Field(min_length=1, max_length=2000)
    source_url: HttpUrl
    appeared: bool


class CompetitorObservation(StrictModel):
    kind: Literal["competitor"]
    brand: str = Field(min_length=1, max_length=120)
    url: HttpUrl
    observed_at: datetime
    property: str = Field(min_length=1, max_length=200)
    evidence: str = Field(min_length=1, max_length=2000)


def validate_evidence(data: dict) -> dict:
    record = CitationObservation.model_validate(data) if data.get("kind") == "citation" else CompetitorObservation.model_validate(data)
    if record.observed_at.tzinfo is None:
        raise ValueError("Observation must include timezone")
    url = record.source_url if isinstance(record, CitationObservation) else record.url
    if url.scheme != "https" or url.username or url.password or url.query or url.fragment:
        raise ValueError("Unsafe observation URL")
    return record.model_dump(mode="json")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        if not args.output.resolve().is_relative_to((ROOT / "private").resolve()):
            raise ValueError("Manual evidence must remain private")
        if args.input.stat().st_size > 2_000_000:
            raise ValueError("Input exceeds size budget")
        value = validate_evidence(json.loads(args.input.read_text(encoding="utf-8")))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    except (ValueError, OSError):
        raise SystemExit("Evidence import refused; rejected content withheld.") from None
    print("Manual observation validated and stored privately. This is not a ranking measurement.")
