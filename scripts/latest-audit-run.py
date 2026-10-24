"""Find an existing trusted public audit artifact before rebuilding Pages."""
import os
import re
import sys
from pathlib import Path

import requests


def latest_trusted_run(runs: list[dict], repository: str) -> int | None:
    for run in runs:
        if (run.get("head_branch") == "main" and run.get("conclusion") == "success"
                and run.get("event") in {"schedule", "workflow_dispatch"}
                and run.get("head_repository", {}).get("full_name") == repository
                and isinstance(run.get("id"), int) and run["id"] > 0):
            return run["id"]
    return None


def main():
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository):
        raise ValueError("Invalid repository identity")
    response = requests.get(
        f"https://api.github.com/repos/{repository}/actions/workflows/daily-audit.yml/runs",
        params={"branch": "main", "status": "success", "per_page": 20},
        headers={"Authorization": "Bearer " + os.environ.get("GITHUB_TOKEN", ""),
                 "Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10"},
        timeout=20,
    )
    if not response.ok:
        raise ValueError("Could not verify existing audit runs")
    run_id = latest_trusted_run(response.json().get("workflow_runs", []), repository)
    if run_id:
        with Path(os.environ["GITHUB_OUTPUT"]).open("a", encoding="utf-8") as output:
            output.write(f"run_id={run_id}\n")
        print("A trusted completed audit will be preserved in this deployment.")
    else:
        print("No completed audit exists yet; use an explicitly labelled initial report.")


if __name__ == "__main__":
    try:
        main()
    except (requests.RequestException, ValueError, KeyError, OSError):
        print("Audit selection failed; refusing to replace a real report with demo data.", file=sys.stderr)
        raise SystemExit(1) from None
