# Setup

## Local preview

Install current Node 22 (at least 22.12), pnpm 12.9.1, and Python 3.12+.
Run the install commands and checks in README, then `pnpm dev`. No credentials
are needed. The default fixture must show DEMO on every page.

Use Product SEO → View details for product facts and checklist. Use
Recommendations → Preview diff to inspect exact fields. Review on GitHub is
disabled for examples. No approval or Shopify mutation runs in the browser.
Reporting windows are anchored to report time; KPI cards remain latest snapshots
and show their own source timestamp. Dates are displayed in Asia/Kolkata.

## Repository and Pages

1. Use the selected repository name `website-seo` under `Vikasyadav25`.
   Remote: `https://github.com/Vikasyadav25/website-seo.git`.
2. Inspect the source and `.gitignore` before committing. Never add `private/`,
   `.env`, source exports, or credentials. Push to `main`.
3. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
4. Settings → Environments → `github-pages`: restrict deployment to `main`.
5. Confirm `.github/CODEOWNERS` (currently the connected account `Vikasyadav25`).
   Settings → Rules → Rulesets: protect `main`, require the CI check and PR review,
   require code-owner review, dismiss stale approvals, and restrict bypasses.
   Code-owner review is enforced only after configuring these account rules.
6. Run CI, then Deploy Pages (or manually dispatch Deploy Pages from `main`).
   The default build base is `/<repo-name>/`. For a custom domain/account-root site,
   explicitly use `/`. HashRouter keeps nested views compatible with static hosting.
7. Visit the resulting Pages URL and verify mobile navigation, every route, DEMO
   provenance, timestamps, drawers, and exports. The dashboard itself is noindex.
8. Daily audit defaults to demo at **02:30 UTC / 08:00 IST**. It can be dispatched
   in production read-only mode after [live setup](LIVE_SETUP.md). Only the validated
   public-safe artifact is transferred into the Pages build. Raw artifacts are not.

An ordinary code/CI deployment regenerates a labelled demo; run Daily audit again
to replace it with a fresh real report. Scheduled runs may be delayed/disabled by
GitHub; always inspect last report/source success rather than assuming cadence.

## Visual verification

The Playwright smoke suite builds/tests the `/website-seo/` project subpath
on desktop and 360px mobile. It saves full-page overview screenshots under ignored
`private/`. Preview the overview, product drawer, issue evidence, and proposal diff.
Commands are in README. No externally hosted fonts or image requests are needed.

## Live setup

Follow [LIVE_SETUP](LIVE_SETUP.md) for minimum-scope API configuration, private
report encryption, exact review/approval, and protected publishing. Keep writes
disabled until the test-product acceptance gate is independently verified.
