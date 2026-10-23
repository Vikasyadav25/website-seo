"""Strict private proposal validation with exact before/after and baseline checks."""
import json
import re

from jsonschema import Draft7Validator, FormatChecker

from agents.models import PrivateProposal
from agents.proposals.draft import digest
from agents.security.public_allowlist import ROOT


def validate_proposal(data: dict) -> PrivateProposal:
    schema = json.loads((ROOT / "schemas/proposal.schema.json").read_text(encoding="utf-8"))
    if not Draft7Validator(schema, format_checker=FormatChecker()).is_valid(data):
        raise ValueError("Invalid proposal schema")
    proposal = PrivateProposal.model_validate(data)
    fields = [change.field for change in proposal.fieldChanges]
    if len(set(fields)) != len(fields):
        raise ValueError("Duplicate proposal fields")
    before = {change.field: change.before for change in proposal.fieldChanges}
    if digest(before) != proposal.baselineHash:
        raise ValueError("Proposal baseline hash mismatch")
    for change in proposal.fieldChanges:
        if change.before == change.after or not change.after or re.search(r"[<>\x00-\x1f]", change.after):
            raise ValueError("Unsafe or empty SEO change")
        limit = 255 if change.field == "seo.title" else 500
        if len(change.after) > limit:
            raise ValueError("SEO change exceeds review length limit")
    return proposal
