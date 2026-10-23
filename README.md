# Ratniva Growth OS

A public-safe SEO workspace for Ratniva: product audits, technical findings,
content readiness, evidence-led recommendations, and controlled review.

**Live dashboard:** [Open Ratniva Growth OS](https://vikasyadav25.github.io/website-seo/).

**Current release: deployed DEMO. Live API setup pending.**
All default metrics and products are synthetic. Read-only collectors, factual drafts,
encrypted private output, and a guarded publishing/rollback path are implemented
and tested with mocks. No credentials were used, no live collector was verified,
and no Shopify changes were made. This software makes no ranking guarantees.

## Run locally

Prerequisites: Node 22.12+ (use a current Node 22 patch), pnpm 12.9.1, Python 3.12+.

```sh
npm install --global pnpm@12.9.1
pnpm install --frozen-lockfile
python -m pip install -r requirements.txt
pnpm dev
```

Open the local URL printed by Vite. No credentials are needed. No external fonts,
image requests, analytics trackers, or privileged browser API requests are used.

## Included

- Twelve URL-addressable views; premium ivory, sage, and champagne styling.
- Responsive sidebar and layouts, keyboard-accessible native detail dialogs.
- Audit search, severity/category/type filters, sorting, and 7/28/90-day windows.
- Product checklists, exact before/after previews, and human-review notices.
- CSV formula neutralisation and downloads of already-public JSON only.
- Strict JSON Schemas, browser/worker validation, and deployable credential scan.
- Deterministic demo worker, read-only Shopify/GSC/PageSpeed adapters, bounded crawler.
- Private SQLite/NDJSON snapshots, factual drafts, manual evidence/diagnostic imports.
- CI, daily demo/production scheduling, encrypted artifacts, and Pages workflows.
- Exact approved proposal hashes, maintainer checks, kill switches, encrypted
  original capture before publication, idempotency, and stale-safe rollback.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
python -m ruff check agents scripts
python -m pytest agents/tests
python scripts/validate-public-data.py web/public/data/report.json
pnpm build
python scripts/scan-secrets.py dist
pnpm audit --audit-level high
python -m pip install pip-audit==2.10.1
python -m pip_audit -r requirements.txt
```

Browser tests exercise the GitHub Pages project subpath on desktop and 360px mobile.
Build the matching path first:

```powershell
$env:PAGES_BASE_PATH='/website-seo/'
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

On macOS/Linux use `PAGES_BASE_PATH=/website-seo/ pnpm build` and install
browser system dependencies with `pnpm exec playwright install --with-deps chromium`.
Use `pnpm dev` without that environment variable for a root-path local preview.

## Worker

```sh
python -m agents.main --mode demo --output private/demo-report.json
python -m agents.main --mode production --read-only --output private/disconnected-report.json
python -m agents.main --mode production --read-only --collect --output private/public-report.json
```

Without `--collect`, production returns a disconnected shell without network calls.
With `--collect`, only configured/enabled sources run. Missing sources are skipped;
partial failures retain private records and never invent success or metrics.
The `connected` schema mode means non-demo; visible UI badges use actual source
states and show NOT CONFIGURED until a real collector succeeds. Live data defaults
to source-health-only public output. See [live setup](docs/LIVE_SETUP.md).

## Deploy

Follow [SETUP](docs/SETUP.md). The Vite build uses an explicit Pages subpath, and
HashRouter avoids static-host route 404s. These choices follow the
[Vite Pages guide](https://vite.dev/guide/static-deploy.html) and
[GitHub custom workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
Styling uses the official [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).

[Source repository](https://github.com/Vikasyadav25/website-seo).
GitHub Pages hosting requires the workflow setup documented above.
Confirm the connected CODEOWNER has repository access, then enable protection rules.

## Cost and privacy

Target incremental hosting cost is ₹0 within applicable GitHub/free API limits;
the existing Shopify subscription and development costs are excluded. No paid AI,
SERP, or hosting APIs are required. Free quotas, availability, and protection
features depend on the account and current service policies; verify them at setup.

Pages is publicly readable static hosting. A fake login cannot protect downloaded
JSON. Never commit private analytics, source facts, credentials, customers, or orders.
Actions artifacts are **not automatically private in a public repository**: do not
upload confidential raw reports until access/retention has been reviewed; prefer
local private output or a properly private repository for those reports.

## Documentation

- [Setup](docs/SETUP.md), [live integration](docs/LIVE_SETUP.md), [architecture](docs/ARCHITECTURE.md), [operations](docs/OPERATIONS.md)
- [Security](SECURITY.md), [API setup](docs/API_SETUP.md), [free tier](docs/FREE_TIER.md)
- [Implementation status and remaining phases](docs/IMPLEMENTATION.md)
- [Source map](docs/FILES.md), [master specification](docs/MASTER_SPECIFICATION.md)

Do not turn on live publication until one safe test product has passed dry-run,
exact approval, encrypted-backup recovery, publication, and rollback verification.
The local mocked tests cannot prove a store's token scopes or theme behavior.
