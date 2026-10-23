"""Validate a private draft and export only a deliberately reviewed public PR preview."""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from agents.proposals.draft import digest  # noqa: E402
from agents.proposals.validate import validate_proposal  # noqa: E402
from agents.security.public_allowlist import ROOT, validate_public_report  # noqa: E402


def preview(data):
    proposal = validate_proposal(data)
    safe = {key: data[key] for key in ("id", "targetKind", "targetUrl", "reason", "risk", "status", "createdAt", "impact", "confidence", "effort", "fieldChanges")}
    safe["testPlan"] = "Verify authoritative facts, exact diff, fallback metadata, and current field baseline. Dry-run before publication."
    report = json.loads((ROOT / "examples/disconnected-report.json").read_text(encoding="utf-8"))
    report["recommendations"] = [safe]
    validate_public_report(report)
    return {"proposalId": proposal.id, "proposalHash": digest(data), "review": safe}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("proposal", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--public-reviewed", action="store_true")
    args = parser.parse_args()
    if not args.public_reviewed:
        parser.error("Manually inspect the exact before/after and explicitly pass --public-reviewed before exporting a public PR preview.")
    try:
        data = json.loads(args.proposal.read_text(encoding="utf-8"))
        value = preview(data)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")
    except (ValueError, OSError):
        print("Proposal preview refused; input contents withheld.", file=sys.stderr)
        raise SystemExit(1) from None
    print("Reviewed public preview written. It grants no publication authority by itself.")
