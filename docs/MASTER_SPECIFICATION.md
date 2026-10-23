# RATNIVA GROWTH OS — CODEX MASTER BUILD SPECIFICATION

**Version:** 1.0 (free-first MVP)  
**Date:** 23 October 2026  
**Brand:** Ratniva | https://ratniva.com  
**Project:** Ratniva Growth OS — SEO, GEO, Products, Technical SEO, Competitors and Publishing Command Center  
**Target:** Public GitHub source repository + GitHub Pages dashboard + GitHub Actions scheduled agent jobs; avoid paid services in MVP.

> **INSTRUCTIONS TO CODEX:** Treat this document as the product specification and implementation backlog. Build a real, tested, deployable project—not a visual-only mockup. Use production-quality TypeScript, Python, GitHub Actions, secure data handling, accessibility, tests, and documentation. Implement the phases in order. Do not silently assume access to Shopify or Google APIs. Where credentials are unavailable, implement deterministic fixture/demo mode with prominent DEMO labels and provide configuration guides. Do not invent live rankings, historical metrics, purchases, or AI citations. After each phase, run its tests and provide exact commands to reproduce. Do not publish anything to Shopify without a defined approval pathway.

---

## 1. Product vision and measurable goals

Ratniva Growth OS should help a small Indian silver jewellery ecommerce brand improve discovery, crawlability, product information quality, Search Console performance and conversion visibility through **daily measurement and controlled iteration**.

The system should:

1. Monitor organic search performance daily using Google Search Console (GSC), with explicit data-freshness notices.
2. Inventory Shopify products/collections and identify fixable on-page SEO issues.
3. Run non-invasive technical SEO checks, PageSpeed Insights checks and sitemap validation.
4. Generate accurate, non-spammy recommendations and before/after diffs.
5. Review changes and publish only the specifically approved fields to Shopify from a trusted server-side GitHub Actions job.
6. Track approval history, publication events, failures, and outcomes.
7. Publish a **public-safe dashboard** on GitHub Pages without leaking credentials, customer/order data or commercially sensitive analytics.
8. Run on scheduled workflows within available free quotas.

**Definition of “top five”:** Do not claim Ratniva is or will become a top-five jewellery brand. Let the operator define target _query clusters_ (e.g., `925 sterling silver rings`, `silver earrings for women`, `silver jewellery gifts`) and monitor share of non-branded impressions, click growth, number of queries whose average position falls in selected bands, indexed product coverage and organic ecommerce outcomes (only in protected/private analytics). Google’s average position is not a live, definitive SERP rank. Rankings and outcomes are not guaranteed.

**Non-goals (MVP):** live competitor rank scraping, automatic AI answers tracking across all chatbots, paid keyword research tools, paid ads, affiliate link farming, bulk auto-generated SEO pages, unattended theme changes, backend authentication served directly from GitHub Pages, access to Shopify customer details, and exposing raw GSC performance publicly.

---

## 2. Platform constraints — read first

### 2.1 Free hosting and security

- **Public repository:** store code, documentation, fixtures, schema, aggregate public-safe reports, and built static assets. Anything committed is publicly readable, including Git history.
- **GitHub Pages:** static hosting only. It cannot securely execute Shopify Admin API operations or hold confidential API keys. Never put tokens in Vite environment variables, `public/`, `dist/`, JS bundles, browser localStorage, issue content, or committed workflow logs.
- **GitHub Actions:** perform API calls server-side with repository/environment secrets. Use least-privilege credentials, pinned actions, minimal `permissions`, concurrency groups, timeouts, and limit scheduler/resource usage. Secrets are unavailable to fork PRs; never run credentialed write jobs against untrusted pull-request code.
- **Public dashboard:** show only deliberately allowlisted metrics. Default to synthetic example data or safe high-level results until each dataset is explicitly designated public. **Never expose raw query/site analytics, revenue, conversion, customers, emails, URLs with private tokens, order details, private competitor datasets, or internal commercial insights.** If operator wants private analytics, provide a local-only/private output and optional future authenticated hosting path, not a fake login over public JSON.
- **Approvals:** in free MVP, the website’s “Review/Pending Approval” screen can show proposals, diffs and a link to the corresponding GitHub PR. Approve via GitHub account in the PR workflow, not a public client-side button. The app must clearly label that navigation as “Review on GitHub.”
- **Publish trigger:** protected, explicitly invoked `workflow_dispatch` with exact proposal ID + SHA, or a protected-environment job that verifies a merged, reviewed PR and approval metadata. Do not trigger publication merely because public data files were updated. The browser never calls Shopify admin directly.
- **Control plane limitation:** On GitHub Pages the user can view reports and proposals, filter/sort/export, navigate to protected Actions/PRs, and manage public-safe local preferences; it cannot provide secure native one-click server mutations without authenticated backend. The UI must accurately convey this limitation.

### 2.2 Codex / ChatGPT Plus

Codex can help build/test/review the source using ChatGPT sign-in and included **usage-limited** access. ChatGPT Plus **does not bundle unrestricted OpenAI API credit** for an independently scheduled website agent. Do not rely on a Codex session remaining logged in to a GitHub runner. Implement routine automation with deterministic Python rules and approved templates. Optional local/manual LLM-assisted drafts can be pasted/imported and validated. Treat any hosted API-driven generative mode as future paid/optional work.

### 2.3 Shopify and Google

- Use official Shopify Admin GraphQL API on GitHub Actions only. Configure scoped credentials following current Shopify app/token setup; determine correct version and credential type at integration time.
- Read data with minimum scopes; request `write_products` only if operator enables publishing. Avoid unnecessary `read_orders`, `read_customers`, etc.
- Search Console APIs return sampled/aggregated search performance within freshness and quota limitations. Use completed reporting dates; do not equate GSC average position with a live Google rank.
- Google Merchant Center integration requires separate setup. Begin with _manual feed diagnostics / imported report_ if API authentication is too costly in engineering time.
- PageSpeed Insights is not a substitute for field Core Web Vitals, and latency/rate limits exist; cache results and limit requests.

---

## 3. What the ₹0/month MVP can realistically accomplish

| Capability            | MVP behavior                                                                                                                            | Limitations                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| GSC daily performance | Pull date/query/page/device/country aggregated reporting with daily comparisons                                                         | Data may lag; not absolute real-time rank                                |
| Product SEO inventory | Audit Shopify products for title, description, canonical/hreflang visibility, image alt, collection links, content duplication signals  | Quality suggestions require human judgement                              |
| Product proposals     | Generate safe rule/template-based SEO draft fields with diffs, risk score and reasons                                                   | No fabricated gemstone/metals claims; no guaranteed improvement          |
| Technical SEO         | robots.txt, sitemap, HTTP status, canonical, noindex, meta title/description, schema presence, redirects                                | Crawl rate controlled; HTML detection cannot verify full Google indexing |
| PageSpeed             | Sample key templates/products on mobile and desktop                                                                                     | Lab test variability; limited sampled URLs                               |
| GEO / AEO             | Content-readiness audit (crawlability, useful FAQs, brand facts, structured data hygiene); optional manual evidence log of AI citations | No free automated comprehensive AI answer ranking                        |
| Competitors           | Manually curated competitor URLs, public-side content comparisons, quarterly benchmark templates                                        | No mass scraping or automatic competitor SERP position data              |
| Daily recommendations | Prioritized issue queue and diff proposals                                                                                              | Deterministic in v1, not a magical unrestricted AI agent                 |
| Shopify push          | Approved field-level changes via GitHub Actions with dry-run, idempotency and rollback                                                  | No unsafe autonomous publishing                                          |
| Dashboard             | Beautiful mobile/desktop management UI hosted on GitHub Pages                                                                           | Public-readable data only                                                |

**Expected first 30-day deliverable:** reliable baseline, daily reports, indexed-product visibility overview where accessible, 20–50 high-priority product recommendations, audited critical collection pages, issue prioritization and 3–5 tightly controlled test batches. No guarantee of ranking lift in the first month.

---

## 4. Technical stack

- **UI:** Vite + React + TypeScript (strict) + Tailwind CSS + React Router (HashRouter or Pages-compatible base path) + Lucide + lightweight chart library (Recharts where bundle size acceptable).
- **Testing/UI:** Vitest + React Testing Library + Playwright smoke tests; eslint + prettier + TypeScript checks.
- **Workers:** Python 3.12+, `httpx`, `pydantic`, `beautifulsoup4`, `lxml`, `PyYAML` (pin versions), pytest; reusable typed API adapters and exponential backoff.
- **Persistence:** SQLite for local/private runs and intermediate aggregates, NDJSON snapshots in job artifacts; publish allowlisted derived JSON and compressed public-safe snapshot summaries to `web/public/data/` or generated Pages artifact. Git repository is _not_ a secret database. Prefer Actions artifacts for private reports (check retention and access).
- **Scheduling:** GitHub Actions daily `schedule` plus manual `workflow_dispatch`; avoid concurrent writes. Scheduled workflows can be delayed or disabled by GitHub inactivity policies; surface last successful run.
- **GitHub deployment:** public repository + GitHub Pages (Actions deployment workflow), no paid hosting.
- **CI:** automated tests, type check, Python lint and unit tests, secret scanning guard, JSON schema validation, dependency audit.
- **Optional later:** authenticated backend / database, private user roles, OAuth and fully integrated edit/approve buttons. Do not fake this in v1.

---

## 5. Repository layout

```text
ratniva-growth-os/
├─ README.md
├─ LICENSE
├─ SECURITY.md
├─ AGENTS.md
├─ .gitignore
├─ .env.example                 # only names/placeholders
├─ package.json
├─ pnpm-lock.yaml
├─ web/
│  ├─ index.html
│  ├─ vite.config.ts
│  ├─ src/
│  │  ├─ app/App.tsx
│  │  ├─ components/{AppShell,Sidebar,Header,KpiCard,StatusBadge,DataTable,TrendChart,EmptyState,ErrorState,ConfirmDialog}.tsx
│  │  ├─ pages/{Overview,SEO,Keywords,Products,Technical,GEO,Competitors,Recommendations,Approvals,Publishing,Reports,Settings}.tsx
│  │  ├─ lib/{dataClient,schemas,format,export,dates}.ts
│  │  ├─ types/index.ts
│  │  └─ styles/index.css
│  └─ public/{logo-placeholder.svg,data/demo.json}
├─ agents/
│  ├─ main.py
│  ├─ configs/{site.yaml,keywords.csv,competitors.yaml,rules.yaml}
│  ├─ adapters/{gsc.py,shopify.py,pagespeed.py,merchant_manual.py}
│  ├─ jobs/{collect_gsc.py,inventory_products.py,crawl_site.py,pagespeed_audit.py,geo_audit.py,score_opportunities.py,build_reports.py}
│  ├─ proposals/{draft.py,validate.py,apply.py,rollback.py}
│  ├─ security/{redact.py,public_allowlist.py}
│  ├─ models.py
│  └─ tests/
├─ schemas/{public-report.schema.json,proposal.schema.json,run.schema.json,issue.schema.json}
├─ examples/{demo-report.json,demo-proposal.json}
├─ scripts/{bootstrap.sh,dev.sh,validate-public-data.py,create-proposal-pr.py}
├─ .github/
│  ├─ workflows/{ci.yml,daily-audit.yml,deploy-pages.yml,publish-approved.yml,rollback.yml}
│  ├─ pull_request_template.md
│  └─ CODEOWNERS
└─ docs/{SETUP.md,ARCHITECTURE.md,OPERATIONS.md,SECURITY.md,API_SETUP.md,FREE_TIER.md}
```

GitHub Actions proposals should be represented as file-based JSON objects under a dedicated review directory/branch or as PR changes. Validate against schema, include deterministic IDs and baseline hashes; never include confidential source records in a public PR.

---

## 6. UI/UX — functional screens

### Visual direction

Modern premium ecommerce analytics aesthetic, inspired by tasteful jewellery branding—not excessive gradients or dark neon dashboards. Use warm ivory background, muted champagne/gold accents, charcoal text, restrained green/red status indicators. Prioritize readable tables and spacious layouts. Responsive from 360px mobile to 1440px desktop; collapsible sidebar, accessible keyboard focus states and adequate contrast. Use generic logo fallback; don't invent Ratniva's official logo/colors.

### Global shell

- Left navigation: Overview, Search Performance, Keywords, Product SEO, Technical SEO, GEO / AI Readiness, Competitors, Recommendations, Approvals, Publishing, Reports, Settings.
- Top: site name, selected date window (7/28/90 days), environment indicator (DEMO / CONNECTED / STALE / ERROR), last successful update, manual “View GitHub Actions” control.
- All metrics display source and “as of” timestamp. Sample data must be visibly labelled DEMO.
- Loading/skeleton/empty/partial/error states on every screen; URL-addressable views.
- Only show public-safe metrics from allowlisted JSON. Implement filters and exports locally; never attempt unauthenticated private API requests.

### 6.1 Overview

KPI widgets (when public-safe and explicitly enabled): crawlable pages checked, high severity issues, product SEO completion %, number of proposals awaiting review, applied edits, job success ratio. Default traffic/revenue KPIs OFF for public site. Trend chart of public-safe SEO health, top issue categories, recent job runs, “Today’s opportunities”, last publish and rollbacks.

### 6.2 Search Performance

When owner explicitly authorizes publication of aggregate numbers: impressions, clicks, CTR, GSC average position with explanatory tooltip; 7/28/90-day comparisons and data freshness. Otherwise show `Private analytics — available in authenticated Actions artifact` with link to workflow. Never publish full search query list unless operator deliberately exports a sanitized subset.

### 6.3 Keywords

Curated intent clusters (silver rings, silver earrings, 925 sterling silver jewellery, silver pendants, gifts under ₹X, silver jewellery care); fields: keyword, landing page, intent, location, device, current GSC position metric (if authorized), impressions, last comparison, opportunity score, suggested next step. Filter/sort/search. Distinguish branded/non-branded. Do not rank by fake Google position.

### 6.4 Product SEO

Product rows: sanitized product ID, public URL, image thumbnail from public Shopify CDN, title, product type, SEO score, issues, review state, last audit. Detail drawer: factual product attributes, on-page checklist, proposed before/after SEO title, meta description, image alt, optional human-edited description, explanation and warnings. Direct Shopify write must not appear in browser.

### 6.5 Technical SEO

Issue summary for 404, redirect chain, canonical mismatch, duplicate meta, missing meta, robots/noindex, broken links, missing supported structured data, oversized image warnings, sampled PageSpeed metrics. Severity and affected URL count; detail with verification evidence and a suggested fix. Respect robots policy and throttle crawls.

### 6.6 GEO / AI Readiness

Display “readiness signals”, **not invented AI-search ranking**: answerable educational content coverage, product FAQ usefulness, accurate about/contact/policy pages, brand entity consistency, structured data validity and crawlability. Optional manual evidence registry: model, exact prompt, date, region/account condition, quoted snippet/link, whether Ratniva appeared. Never claim repeatable AI ranking based on one manual test.

### 6.7 Competitors

Operator-managed watchlist (e.g. GIVA, Palmonas, Zavya, other validated jewellery brands). Compare verifiable public content properties, useful category coverage and manually gathered observations. Do not scrape Google results or bypass anti-bot rules; avoid competitor claims without evidence/date.

### 6.8 Recommendations

Queue sorted by expected impact × confidence / effort, with severity, source, target URL, proposed action, before/after field diff, test plan, risk, last verified date, status. Search/sort/filter by issue, page template, collection, priority and agent. “Open review PR” is a real GitHub link; disabled with tooltip in demo mode.

### 6.9 Approvals

Cards/table: proposal ID, reason, product/page, changed fields, risk score, verification status, PR link, review status. Review must occur in authenticated GitHub PR; no fake approve buttons. Show explicit note: `Publishing requires repository maintainer approval via GitHub.`

### 6.10 Publishing

Table: scheduled/approved/applied/failed/rolled back events; idempotency key, reviewer, job URL, Shopify product reference (sanitized), applied fields, timestamp, rollback availability. Offer `Open publish workflow` and `Open rollback workflow` GitHub links. For demo, simulate nothing irreversible.

### 6.11 Reports

Daily audit summaries, weekly comparisons, weekly action plan, `download CSV/JSON` of already-public dashboard metrics, source provenance and last updated time. Links to Actions artifacts for private detailed reports (authenticated users only).

### 6.12 Settings

Read-only public dashboard config: site URL, run cadence, source connection states (connected/not configured/failed), link to secure GitHub Settings → Secrets and variables → Actions, safety toggles described but not actually writable from static UI, and documentation shortcuts. Do **not** request credentials in a web form served by GitHub Pages.

---

## 7. Daily agent pipeline

1. **Scheduler (daily e.g. 02:30 UTC, configurable):** start job; save unique run ID, start time, source statuses and last-success metadata.
2. **Source collection:** request GSC completed-date aggregates, paginate cautiously and respect quotas; retrieve Shopify catalog read-only; sample PageSpeed APIs; fetch allowed public pages. Missing credentials should degrade gracefully, not crash the whole pipeline.
3. **Normalize:** common typed models, canonical URLs, timezone Asia/Kolkata for dashboard, consistent date window, currency INR, source timestamps.
4. **Audit:** rules evaluate product titles, absent metadata, duplicates, internal-link coverage, technical errors; do not overwrite good content solely to change wording.
5. **Score:** impact (0–5), confidence (0–5), effort (1–5), risk (0–5), opportunity = impact × confidence / effort; critical safety rules override score.
6. **Proposals:** generate structured, auditable JSON diff. Reject invented material (925 purity, price, weight, gemstones, plating, warranty, delivery or ratings). A product claim may appear only if it is grounded in Shopify authoritative attributes.
7. **Validate:** schema, max title/description guidance, HTML sanitization, URL validity, unchanged protected fields, precondition hashes, duplicated suggestions, diff readability, Shopify GraphQL field support.
8. **Deliver:** private detailed output as Actions artifacts; public-safe summary JSON as Pages deploy artifact. Avoid committing secrets or raw performance data.
9. **Review:** optionally create a PR of safe proposals with evidence links, a structured checklist, and human approval. Never use public AI/third-party PRs to trigger secret access.
10. **Publish:** credentialed job checks protected environment, proposal hash, exact permitted fields, current product state/version (guard against stale change), rate limits and idempotency. Apply only an approved set. Log failures and sanitized results. Limit default batch size to 5 products.
11. **Observe:** record before/after and inspect performance in 7/28-day windows; avoid judging outcomes from single-day noise.

### Initial agent jobs and cadences

| Job                  | Frequency                            | Inputs                     | Output                                      |
| -------------------- | ------------------------------------ | -------------------------- | ------------------------------------------- |
| GSC Monitor          | Daily                                | GSC API                    | private query metrics + public-safe summary |
| Product SEO Audit    | Daily                                | Shopify GraphQL            | issues/proposals                            |
| Technical Crawler    | Daily small scan; weekly deeper scan | Ratniva public URLs        | issues and templates                        |
| PageSpeed            | Weekly; 5–10 representative URLs     | PageSpeed API              | lab metrics and history                     |
| GEO Readiness        | Weekly                               | Public product/brand pages | factual audit checklist                     |
| Competitor Benchmark | Monthly/manual                       | curated public URLs        | qualitative comparisons                     |
| Publish Approved     | Manual/protected event               | approved proposal IDs      | audited Shopify writes                      |
| Report Composer      | Daily/weekly                         | completed runs             | sanitized UI JSON + private artifact        |

Daily job must cap runtime and API calls; report `SKIPPED` not false green on unavailable integrations.

---

## 8. Data models & APIs

Implement JSON Schemas for these entities:

```ts
type RunStatus = "success" | "partial" | "failed" | "skipped";
type ProposalStatus =
  | "draft"
  | "needs_review"
  | "approved"
  | "rejected"
  | "applied"
  | "failed"
  | "rolled_back";
type Severity = "critical" | "high" | "medium" | "low";

interface SourceHealth {
  name: "gsc" | "shopify" | "pagespeed" | "crawler" | "merchant_manual";
  status: "connected" | "not_configured" | "failed" | "stale";
  lastSyncedAt?: string;
  message?: string;
}
interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  status: RunStatus;
  jobName: string;
  sourceStatuses: SourceHealth[];
  issueCounts: Record<Severity, number>;
  githubRunUrl?: string;
}
interface Issue {
  id: string;
  source: string;
  category: string;
  severity: Severity;
  targetUrl: string;
  evidence: string;
  discoveredAt: string;
  lastVerifiedAt: string;
  recommendation: string;
}
interface Proposal {
  id: string;
  targetKind: "product" | "collection" | "page";
  targetGid: string;
  targetUrl: string;
  fieldChanges: Array<{
    field: string;
    before: string | null;
    after: string | null;
  }>;
  baselineHash: string;
  reason: string;
  evidenceIds: string[];
  impact: number;
  confidence: number;
  effort: number;
  risk: number;
  status: ProposalStatus;
  createdAt: string;
  reviewedBy?: string;
  prUrl?: string;
  appliedAt?: string;
  rollbackRef?: string;
}
interface PublicDashboardReport {
  schemaVersion: 1;
  mode: "demo" | "connected";
  generatedAt: string;
  latestRun: RunSummary | null;
  sourceHealth: SourceHealth[];
  publicSafeKpis: Array<{
    label: string;
    value: number;
    unit?: string;
    asOf: string;
  }>;
  issues: Issue[];
  productAuditSummaries: unknown[];
  recommendations: Array<
    Pick<
      Proposal,
      "id" | "targetKind" | "targetUrl" | "reason" | "risk" | "status" | "prUrl"
    >
  >;
}
```

- Define `PublicDashboardReport` final structure in schema and ensure it does **not** include `targetGid` or internal evidence that would reveal confidential fields unless explicitly whitelisted.
- Store source provenance; encode `no data` as `null`/empty states, never 0 unless truly measured.
- Validation should reject forbidden patterns (emails, phone numbers, tokens, order identifiers) and unexpected fields before Pages deployment.
- Treat CSV import as untrusted; sanitize against CSV formula injection in exports.
- Favor deterministic IDs: hash of normalized target, issue category and source; version proposal hashes on changed contents.

---

## 9. Safe product SEO improvement rules

### Prioritization

1. Pages excluded from crawl/index due to accidental noindex or broken links (verify intent).
2. Broken canonical and duplicate URLs (verify preferred URL).
3. High-impression/low-CTR pages in GSC (where user opted into private access).
4. Major product category pages without unique, useful introductions.
5. Priority products missing accurate meta description or descriptive alt text.
6. Thin content that omits important verifiable attributes and buying guidance.
7. Image sizes, template speed and internal navigational links.

### Generator

Generate only when grounded inputs are available; prioritize readability and precise intent over keyword stuffing.

- SEO title draft template: `{verified_product_style} in {verified_metal} | Ratniva` or `{verified_product_name} | Ratniva`. Keep title sensible; no hard guaranteed Google character count.
- Meta description draft: one clear, grammatically correct sentence summarizing **verified** product type/material/features; no claims of awards, purity, shipping or returns not established in source records.
- Image alt draft: describe visible product only when image or verified description supports it; no unsupported stones or manufacturing details.
- Collection intro draft: short useful description addressing intent and product category; never bulk-stuff synonyms.
- Never alter price, tax, inventory, variants, SEO canonical overrides, merchant feed identifiers, checkout setup, policy, warranties or unrelated data.

A proposal includes `sourceFacts` privately for audit but must be excluded from public JSON if sensitive.

---

## 10. Governance and safeguards

1. Default `DRY_RUN=true` and `ENABLE_SHOPIFY_WRITES=false`.
2. Distinguish three modes: _demo_, _read-only production_, _approved publish_.
3. Exact product-field allowlist for write mode: supported SEO title/meta description; product body and image alt only if separately authorized; no destructive operations.
4. Publish only after explicitly approved PR + protected environment or maintainer-invoked validated proposal ID/SHA workflow; block stale/superseded proposals.
5. Before every write, capture full original field values in private artifact with controlled access and defined retention; create rollback command.
6. Limit to default max 5 products per publish, respect API rate limits, and fail closed for malformed/unknown data.
7. Secret redaction in logs, private source files, stack traces and error reporting. Ensure source permissions scoped appropriately.
8. PR review permissions/CODEOWNERS and protected branch; compare base SHA and prevent review bypass through automation.
9. Pages data strict allowlist + leak-detection test. No customer, order, finance, token or confidential query data.
10. Add kill switch `PUBLISH_ENABLED=false`; instructions to revoke access tokens.
11. Respect robots.txt and resource limitations; do not promise undisclosed search ranking manipulation.
12. Optional external calls need timeouts, retry budgets, exponential backoff and helpful partial-failure indicators.

---

## 11. GitHub workflows (spec)

### `ci.yml`

On PR / main: Node install with lockfile, lint, typecheck, unit tests, `vite build`, Python setup and pytest, schema verification, detect accidental secret inclusion, scan public JSON for forbidden properties, Playwright smoke test. Minimal read permissions.

### `daily-audit.yml`

`schedule` daily (UTC, docs show IST conversion), `workflow_dispatch`. Fetch required repository secrets, run read-only Python collectors and rules, publish private report artifacts and generated public-safe report artifact. If no tokens, run DEMO fixtures only _and label as demo_. Do not commit confidential artifacts; do not auto-push to protected main. Deploy sanitized dashboard via safe workflow or immutable Pages artifact.

### `deploy-pages.yml`

On main and/or after successful sanitized report generation: `npm ci` (or pnpm locked setup), verify public report schema and fields, build with Pages base path, upload Pages artifact and deploy with documented official permissions. Ensure missing latest report yields visible empty state or fixtures (labelled demo). Avoid source code execution from unknown PRs.

### `publish-approved.yml`

Manual `workflow_dispatch` with required `proposal_id`, `proposal_hash`, `dry_run` (default true); use environment `shopify-production` requiring maintainer approvals where supported and branch protection. Verify proposal comes from approved protected revision, review metadata/explicit operator authorization, current Shopify preconditions, and field allowlist. Run apply script with idempotency. Store sanitized event log and private rollback input in protected artifact. **Do not allow arbitrary JSON/content from an unauthenticated user input to be published.**

### `rollback.yml`

Manual, exact publish event ID, latest-field verification, protected environment approval; rollback selected changes only if target state still matches previously applied values. Never overwrite subsequent user edits silently.

### GitHub permissions

Use `contents: read` by default; grant `pages: write`, `id-token: write`, `pull-requests: write`, or `contents: write` only to the exact job needing it. Pin official actions versions and review action dependencies.

---

## 12. Setup wizard / operator documentation

`docs/SETUP.md` must contain clear screenshots or UI descriptions (not assumed access), and should cover:

1. Create `ratniva-growth-os` public repo; enable Issues, Actions and GitHub Pages (deploy via Actions).
2. Connect Codex using **Sign in with ChatGPT**, within Plus limits. Use Codex for coding/review, not as an unattended external API.
3. Configure `SITE_URL=https://ratniva.com`, `SHOPIFY_STORE_DOMAIN=<store>.myshopify.com`, `GSC_SITE_URL` and suitable GSC API credentials scoped to the property.
4. Create app with least privilege and read-only Shopify scopes first; store Shopify access token in GitHub **Actions secrets** (not code). Write scope only after reviewing publishing workflow.
5. Add repository secrets: `SHOPIFY_ADMIN_ACCESS_TOKEN`, `GSC_CREDENTIALS_JSON` or safer supported identity method; optional `PAGESPEED_API_KEY`; document each source, secret permissions, token rotation and API quota.
6. Configure Github repo environment `shopify-production`, protection rules/approvals available on current plan, and operator-only publishing instructions. If public repo security rules differ, implement equivalent explicit protected manual confirmation rather than pretending approval gating exists.
7. Run `daily-audit` manually in `DRY_RUN` mode; verify the `public-safe-report` has no confidential content.
8. Enable GitHub Pages and test public build on project-subpath URL. Base path must be `/<repo-name>/` by default.
9. Open the dashboard and confirm connectivity badges, report timestamps and empty/failure states.
10. Create a test proposal from a **test product**; approve and publish only once all assertions and rollback test pass.
11. Review daily workflow usage/billing and set spending limits where possible. Stop and report if future feature needs paid third-party service.

Also provide a concise operator daily SOP: review audit, inspect proposed edits, validate product facts, approve PR, run publish workflow, confirm published fields, and monitor changes over 7–28 days.

---

## 13. MVP acceptance tests (definition of done)

- [ ] `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass on a clean checkout.
- [ ] `python -m pytest agents/tests` passes.
- [ ] `pnpm dev` displays a responsive dashboard with demo data and clear DEMO labels.
- [ ] Every navigation route renders; date filters, issue search/sort, product detail drawer, diff preview and public-safe exports actually work.
- [ ] Empty/failed/stale source states render correctly and do not show zero in place of unknown.
- [ ] Worker can run `--mode demo` with zero credentials and generate valid JSON.
- [ ] Worker can run `--mode production --read-only` with only selected credentials; missing sources show `not_configured`.
- [ ] GSC/Shopify/PageSpeed adapters have mocked integration tests for success, rate limits, 401/403, timeout and partial failures.
- [ ] Public report schema rejects raw query analytics, customer info, order data, secrets, unknown fields and personally identifying records.
- [ ] Missing OAuth/API credentials never break the public Pages deployment.
- [ ] A valid proposal contains exact before/after, rationale, evidence references, baseline hash and risk.
- [ ] Publish script dry-run is safe by default, verifies exact approval/version and field allowlist, and is idempotent.
- [ ] Rollback refuses to override fields changed since publication.
- [ ] Public build has NO Shopify/GSC tokens or private data and no privileged browser API calls.
- [ ] GitHub Pages deploy works at a project-subpath and on mobile.
- [ ] CI blocks unreviewed deployment-affecting changes and documents protection setup.
- [ ] `README.md` makes free-tier restrictions and realistic coverage explicit.

---

## 14. Phased implementation plan for Codex

### PHASE 1: Functional foundation

Create monorepo, React/Tailwind UI, complete navigation, types, demo fixture, dashboard charts, recommendations list, issue/product detail drawers, source status widgets, export, responsive styling, tests and Pages deployment. Complete first before starting external integrations. Include a polished README and screenshot instructions.

### PHASE 2: Real read-only collectors

Implement GSC (property-level summary with privacy), Shopify GraphQL product inventory, technical crawler and PageSpeed sampling, typed adapters, configuration, cache/retry/rate limit behavior and private output artifacts. Prove public report allowlisting and source freshness. Connect to UI.

### PHASE 3: Recommendations and review

Build rule engine, evidence and scoring, conservative draft generator, diff viewer, proposal version hashes, schema verification and secure GitHub PR review flow. No Shopify writes yet.

### PHASE 4: Approved Shopify publishing

Add strict write path, dry-run, approvals, credentials, logging, idempotency, protected manual workflow, rollback and tests. Verify with one safe test product. Keep default read-only for production.

### PHASE 5: GEO readiness / competitor / Merchant Center

Add documented content-readiness rules, manual AI answer evidence log, curated competitor research and optional Merchant Center diagnostics as configured. Do not assert automatic LLM rankings or live competitor positions.

### PHASE 6: Usability and measured optimisation

Saved local filters, weekly summaries, more category templates, trend comparisons, performance safeguards, run retries and operational dashboards. Improve only from evidence and user-approved scope.

**Coding priorities:** Security > data correctness > useful workflows > ease of setup > visual polish > optional AI. Keep work in small reviewable commits/PRs. Avoid introducing paid infra by accident.

---

## 15. Sample daily report contents

```json
{
  "schemaVersion": 1,
  "mode": "demo",
  "generatedAt": "2026-10-23T00:00:00Z",
  "latestRun": null,
  "sourceHealth": [
    { "name": "gsc", "status": "not_configured" },
    { "name": "shopify", "status": "not_configured" },
    { "name": "pagespeed", "status": "not_configured" },
    { "name": "crawler", "status": "not_configured" },
    { "name": "merchant_manual", "status": "not_configured" }
  ],
  "publicSafeKpis": [],
  "issues": [],
  "productAuditSummaries": [],
  "recommendations": []
}
```

Create richer labelled demo fixtures for visual development; above is a truthful disconnected-state fixture.

---

## 16. Suggested keyword clusters (research hypotheses, NOT proven rankings)

These are seed themes; verify using GSC, customer demand and product catalog before scaling:

- silver jewellery online India
- 925 sterling silver jewellery
- silver rings for women
- silver earrings for women
- silver pendant for women
- silver bracelets for women
- silver jewellery gifts for her
- minimalist silver jewellery
- how to clean 925 sterling silver jewellery
- sterling silver vs silver plated jewellery

Avoid building dozens of near-duplicate pages. One useful page per unique search intent, grounded in product facts and customer needs.

---

## 17. Costs and upgrade path

**MVP target incremental infra bill:** ₹0/month with GitHub Pages, public repo Actions, supported free Google APIs and existing Shopify subscription, within terms/quotas. This excludes ChatGPT Plus subscription already owned, internet/electricity/development time and optional paid integrations.

Potential cost triggers: paid SERP data APIs; LLM API calls; private managed hosting/auth; managed database; high-frequency crawling; external image processing; commercial rank tracking; advertising. Show when a new feature crosses a free quota rather than auto-spending.

If the operator requires a genuinely private UI that triggers workflows, stores private analytics and controls Shopify in-app, add a separate **authenticated server-side control plane**. Do not represent a static GitHub Pages site as private. A dedicated backend may not be free at production scale.

---

## 18. Codex execution prompt — paste in Codex with this file

> Read `RATNIVA_GROWTH_AI_CODEX_MASTER.md` completely. Implement PHASE 1 for Ratniva Growth OS as a fully working monorepo, not a prototype screenshot. Use a premium responsive design, real routing, typed fixtures, dashboard views, filters, before/after previews, GitHub Pages hosting support, CI/tests and clear setup docs. Keep credentials out of frontend and all repository content. All sample metrics must say DEMO. Then run all relevant tests, report results, and identify any decisions needed for PHASE 2. Create an `AGENTS.md` from project requirements. Do not attempt Shopify writes or integrate paid APIs in Phase 1.

Follow-on prompt after Phase 1:

> Implement PHASE 2 of `RATNIVA_GROWTH_AI_CODEX_MASTER.md`, using production read-only adapters and private GitHub Actions artifacts, source health, data freshness and public-safe export filtering. Test mocked API limits and failures. Never leak raw GSC/Shopify secrets/data into GitHub Pages. Keep writes disabled.

---

## 19. Official documentation references

- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- GitHub Actions: https://docs.github.com/en/actions
- ChatGPT Plus / Codex usage: https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan
- Shopify GraphQL productUpdate: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productUpdate
- Shopify access tokens: https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens
- Google Search Console API quotas: https://developers.google.com/webmaster-tools/limits
- Google Search Console API: https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- PageSpeed Insights API: https://developers.google.com/speed/docs/insights/v5/get-started

**Final note:** A free build can create disciplined daily monitoring, actionable proposals and controlled Shopify publication. It cannot guarantee top-5 brand positioning, unlimited AI generation, instant ranking data or a fully secure private admin console hosted only on static GitHub Pages.
