# Implementation and verification status

## Implemented and tested locally

- Phase 1: all twelve routes, responsive UI, source/error/stale/empty states,
  filters/sorts/date windows, product drawer, exact diffs, exports, tests and Pages.
- Phase 2 core: typed read-only Shopify/GSC/PageSpeed collectors, bounded crawler,
  retry/pagination/timeout/error behavior, private snapshots, source freshness,
  explicit public-count opt-in, encryption and trusted report handoff.
- Phase 3 core: conservative missing-description drafts, evidence IDs, priority
  scores, deterministic IDs/baseline and content hashes, validation, and an explicit
  public-review export. Authenticated PR review is performed in GitHub.
- Phase 4 code: approved payload/hash checks, maintainer/branch/workflow checks,
  kill switches, one-product batch limit, encrypted original capture before write,
  idempotent apply, current-state checks, and guarded rollback. Default writes OFF.
- Phase 5 core: private content-readiness signals, curated watchlist, validated
  manual AI/competitor observations, and constrained Merchant diagnostic imports.
- Phase 6 core: local reporting-window preference, local run history, private weekly
  action plan, bounded sampling, retries and operational source states.

## Not verified live / setup required

- GitHub workflow execution, Pages hosting, and branch/environment protection
  for `Vikasyadav25/website-seo`. Repository access has been verified.
- Actual hosted Pages deployment and scheduled-run permissions/quota.
- Shopify store domain, credential lifecycle/scopes, GSC property/identity, PSI key.
- Test-product dry-run, encrypted-original recovery, actual publish and rollback.
- Longitudinal real performance comparisons and measured ranking/conversion outcomes.

The code is not claimed production-approved merely because mocked tests pass.
No live store calls or writes were made. Default dashboard data remains DEMO.

## Deliberately limited coverage

The crawler is sampled; it does not traverse nested sitemap indexes or redirect
chains, prove indexing, or evaluate every technical SEO signal. Draft generation
currently handles absent explicit product descriptions; collection intros and image
alt require more verified inputs/human work. No raw GSC is made public. No automatic
LLM citation/rank tracking or competitor rank scraping exists. Publication history
appears only when reviewed sanitized event records are included in public reports.

Local SQLite history persists locally. Clean Actions runners do not automatically
restore source history/cache; use encrypted snapshots with reviewed retention before
adding cross-run historical comparisons. No fake comparisons or backfilled trends
are generated. The first live report may have no chart or comparison.

## Next operator decisions

Choose the GitHub destination and reviewers, configure minimum read credentials,
select exactly which aggregate data may be public, review priority products and
seed keywords against real demand, and verify the protected test-product flow.
See [LIVE_SETUP](LIVE_SETUP.md). Never send credentials through the dashboard or chat.
