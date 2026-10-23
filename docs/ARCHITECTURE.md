# Architecture

The static React app fetches one BASE_URL-relative JSON report and validates it
with Ajv before rendering. HashRouter supports Pages subpaths. Reusable components
handle keyboard-accessible native dialogs, diffs, badges, exports, and small
accessible SVG charts. Only a public date-window preference is stored locally.

The strict public JSON Schema rejects unexpected nested properties. Python
jsonschema and browser Ajv both inspect sensitive strings and URL hosts. Private
source models are Pydantic models and are never directly serialized into Pages.

`python -m agents.main --mode production --read-only --collect` runs only configured
sources. API adapters use bounded retries, timeouts, pagination/call limits, and
sanitized failures. Crawler scope is the Ratniva HTTPS origin, robots-aware and
bounded; redirects are not followed. HTML/schema signals are evidence, not proof
of indexing or rich-result eligibility. PageSpeed samples are cached for a week
and explicitly classified as lab data.

Private source snapshots and local history use SQLite/NDJSON under `private/`.
Factual drafts target absent explicit SEO descriptions and preserve good existing
copy. Hashes bind exact before/after fields to their reviewed baseline. Weekly
action plans sort those drafts by impact × confidence / effort.

Public live reports contain source health by default. Aggregate audit counts
require a deliberate configuration change. Source rows, GSC queries, catalog GIDs,
private drafts, and internal evidence remain excluded. Manual evidence and Merchant
diagnostics imports remain private. Reviewed PR previews require explicit public
review, and never contain internal GIDs.

The daily workflow uploads validated public JSON, optionally uploads an encrypted
private bundle, and never commits source data. The Pages workflow accepts reports
only from a successful trusted main-branch run and revalidates before packaging.

Publishing is a separate main-only, manual, protected-environment workflow. It
verifies maintainer identity, exact approved secret-payload hash, current fields,
and kill switches. It captures encrypted originals and uploads them before a write.
Writes have no blind retry. Repeated exact applies are idempotent. Rollback verifies
the authenticated receipt and current values before restoring only selected fields.

Shopify has no productUpdate compare-and-swap field guard; a simultaneous merchant
edit between final read and mutation remains a documented limitation. Use quiet edit
windows. No live publisher or credential integration was exercised during local QA.
