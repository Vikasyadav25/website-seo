# Read-only integration and approved publication

Shopify client-credentials authentication, catalog reads, and a public HTML crawl
were verified on 24 October 2026. PageSpeed also connected; GSC returned a property
access rejection (`HTTP 403; forbidden`) in the latest run. See
[latest audit](LATEST_AUDIT.md) for the actual run and remaining limits.

## Installed Dev Dashboard app: next steps

This flow requires the app and target store to belong to the same Shopify
organization, and the app to be installed with `read_products` approved.

1. Open **Dev Dashboard > RatnivaSEO > Settings > Credentials**.
2. Open the GitHub repository's **Settings > Secrets and variables > Actions >
   Secrets > New repository secret**. Add both:
   - `SHOPIFY_CLIENT_ID`: the app's Client ID.
   - `SHOPIFY_CLIENT_SECRET`: the app's Client secret.
3. Under **Variables**, set `SHOPIFY_STORE_DOMAIN` to the store's exact
   `*.myshopify.com` domain (no scheme or path), and `AUDIT_MODE=production`.
4. Ensure the updated collector and `daily-audit.yml` are committed and pushed to
   `main` before running Actions. These are local changes until pushed.
5. Open **Actions > Daily audit > Run workflow**, select `main` and `production`.
6. Download `public-safe-report` and check the `shopify` row in `sourceHealth`.
   `connected` proves a catalog response; a green workflow alone does not.

Do not put the Client secret into `SHOPIFY_READ_ACCESS_TOKEN`. That field is an
alternative for an already-issued access token and is not required with the
complete Client ID/secret pair. Environment secrets are not used by Daily audit;
use **repository secrets**.

The worker exchanges the pair for a fresh token once per audit, validates the
returned `read_products` scope, and keeps the token only in memory. A complete
client pair takes precedence over a supplied access token. There is no token
file/cache or browser credential handling. Shopify issues these tokens for 24
hours; the audit is bounded to ten minutes. A rejected exchange marks the source
failed without falling back to an old token or logging the response.

If Shopify refuses the grant because the app/store are in different organizations,
this flow cannot connect them; use the appropriate authorization-code integration.
Do not create a replacement store. See [Shopify authentication documentation](https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant).

## Read-only configuration

Repository Settings → Secrets and variables → Actions:

| Name                            | Storage  | Purpose                                             |
| ------------------------------- | -------- | --------------------------------------------------- |
| `SHOPIFY_STORE_DOMAIN`          | Variable | Actual `store.myshopify.com` domain                 |
| `SHOPIFY_CLIENT_ID`             | Secret   | Installed same-organization app Client ID           |
| `SHOPIFY_CLIENT_SECRET`         | Secret   | App Client secret; exchanged once per audit         |
| `SHOPIFY_READ_ACCESS_TOKEN`     | Secret   | Optional existing catalog token; `read_products`    |
| `GSC_SITE_URL`                  | Variable | Verified exact property identifier                  |
| `GSC_CREDENTIALS_JSON`          | Secret   | Authorised service-account identity JSON            |
| `PAGESPEED_API_KEY`             | Secret   | Optional server-side PSI key                        |
| `ENABLE_PUBLIC_CRAWL`           | Variable | `true` only to enable bounded public crawl          |
| `ENABLE_PAGESPEED`              | Variable | `true` only for deliberate sampling                 |
| `AUDIT_MODE`                    | Variable | `demo` by default; `production` after configuration |
| `PRIVATE_REPORT_ENCRYPTION_KEY` | Secret   | Optional Fernet key for raw report encryption       |

Locally, set the same domain and Client ID/secret pair in the worker process
environment. Alternatively, provide `SHOPIFY_READ_ACCESS_TOKEN`; the collector
also supports `SHOPIFY_ADMIN_ACCESS_TOKEN` as a legacy fallback. Write access is
not required. `.env.example` is documentation; files are not auto-loaded. Editing
it does not establish a connection. Keep real values in a secure process runner or
GitHub Actions secrets, never in the example.

To collect public HTML without credentials, run locally in PowerShell:

```powershell
$env:ENABLE_PUBLIC_CRAWL='true'
python -m agents.main --mode production --read-only --collect --output private/public-report.json
python scripts/validate-public-data.py private/public-report.json
```

Inspect `sourceHealth` in that report. Only a successful source request verifies
a connection. Missing Shopify/GSC credentials remain `not_configured`; a working
public crawler does not verify either API. Raw details stay under `private/`.

Dispatch Daily audit → mode `production`. Missing sources must show not_configured;
failed sources must not show false success. Inspect `public-safe-report` before
Pages publication. It contains source status only unless you explicitly enable
`publish_public_audit_metrics` in `agents/configs/site.yaml` through review.

Raw analytics/drafts stay in ignored local private files. On Actions they are
ephemeral unless encryption is configured. Public-repository artifacts are not
private storage: only ciphertext bundles are uploaded. Generate a Fernet key
locally with `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`,
save it directly in the secret store and an operator-controlled recovery vault;
never commit it. Decrypt downloaded ciphertext locally with Fernet, then open the
ZIP/SQLite under a private directory. The private report artifact retains seven days.

## Proposal review

Read `private/proposals.json`, verify authoritative product facts and actual
storefront fallback metadata, and save the one selected proposal in a private JSON
file. Edit only consciously reviewed fields. For an explicitly public-safe PR:

```sh
python scripts/review-proposal.py private/selected-proposal.json --output review/proposal.json --public-reviewed
```

The export omits internal GIDs. Create a normal review branch, commit only that
preview, and open a GitHub PR. Configure required maintainer/code-owner review.
The browser links to real PRs only when an operator adds their actual URLs to a
reviewed public report. No public click grants approval or triggers a secret job.

The publication pathway uses **maintainer-invoked exact ID/SHA authorization**:
after review, change the selected private proposal status to `approved`, validate
it, and compute its canonical SHA using `agents.proposals.draft.digest`. Put that
exact JSON into the `APPROVED_PROPOSAL_JSON` environment secret. Recompute the SHA
after any field/status change. A merged PR alone never publishes anything.

## Protected publication setup

Create repository environment **shopify-production**, restrict branches to `main`,
require the store owner's approval where supported, prevent self-review/bypass
where available, and keep `main` protected. If the plan cannot enforce reviewers,
retain explicit allowlisted maintainer dispatch and never describe it as automatic
environment approval. The script also checks the caller's actual admin/maintain
permission via GitHub and a comma-separated `PUBLISH_OPERATORS` variable (no spaces).

Environment settings:

- Secret `SHOPIFY_ADMIN_ACCESS_TOKEN`: separate token with read/write product scopes.
- Secret `APPROVED_PROPOSAL_JSON`: exact one approved private proposal.
- Secret `ROLLBACK_ENCRYPTION_KEY`: Fernet key, backed up privately for recovery.
- Variables `PUBLISH_OPERATORS`, `SHOPIFY_STORE_DOMAIN`.
- Variables `PUBLISH_ENABLED=false`, `ENABLE_SHOPIFY_WRITES=false` by default.

Dispatch Publish approved on `main`, exact proposal ID/hash, **dry_run=true**.
Validate the result against a safe test product before enabling the two write
switches and explicitly selecting dry_run=false. Each dispatch handles one product,
not an unattended batch. The workflow uploads encrypted full originals **before**
calling Shopify. Artifact upload failure prevents apply. It never retries a mutation
blindly when the response is lost. Verify current fields before retrying such a job.

Encrypted rollback receipts retain 30 days and must be kept with their recovery key.
Do not rotate away/delete the only key while receipts remain necessary. Sanitized
event metadata gives event ID, fields, run ID/attempt context. Record those after
the test publish. Dispatch Rollback with exact event ID, original run ID/attempt,
first in dry-run then explicit execution. Later differing edits must cause refusal.

**Concurrency limitation:** Shopify productUpdate has no compare-and-swap field
precondition. The code verifies values/updatedAt immediately before update and reads
back after, but a simultaneous merchant edit can race the mutation. Use a quiet edit
window and avoid editing the selected product until verification completes.

## Acceptance before daily use

Verify real scopes/property access, no private information in public artifacts,
current-state rejection after deliberately changing the test field, exact approval
hash rejection, duplicate-run idempotency, encrypted-original recovery, rollback
refusal after a later edit, actual guarded rollback, and final kill-switch behavior.
Only then consider small reviewed production test batches and 7/28-day observation.
