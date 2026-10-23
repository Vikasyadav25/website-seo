# Daily operations

## Demo mode

1. Open the dashboard. Confirm DEMO, source states, and fixture timestamp.
2. Review the issue queue, evidence drawer, product checklist, and proposal diff.
3. Export public JSON/CSV if needed; never import secret source records into public data.
4. Open GitHub Actions after repository setup and inspect CI/daily job results.
   A successful DEMO generation means the generator passed, not that sources ran.

The daily demo is deterministic and retains its synthetic source timestamps.
Report freshness must never be fabricated by updating measured source dates.

## Intended production SOP after integration

Review the latest audit and source freshness → prioritise verified issues → verify
product facts → review exact proposal diff/test plan → approve the exact PR revision
→ invoke protected dry-run with ID and hash → verify current state and rollback
capture → publish a small approved batch → confirm exact changed fields → compare
completed 7/28-day reporting windows privately. Never infer growth from one day.

Check scheduled workflow status manually if no report appears. GitHub schedules
may be delayed or disabled; display last success rather than promising exact timing.
Production freshness is flagged after 48 hours. API integrations and publishing
must pass the live acceptance gate in [LIVE_SETUP](LIVE_SETUP.md) before use.

## Stop and recover

Keep `PUBLISH_ENABLED=false`, disable publishing workflows if later enabled, and
revoke the store credential if access is suspected compromised. Remove secrets
from every affected location and rotate them; deleting a committed file alone
does not erase Git history. Later rollback must refuse changes when the current
field differs from the published value.
