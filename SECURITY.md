# Security policy

Never file secrets, customer/order records, private analytics, or source credentials
in a public issue or PR. Contact the configured repository maintainer privately
through the organisation's existing security channel. This local project has no
invented security email address.

Public Pages is not an authenticated admin console. Browser credentials and fake
login gates are prohibited. Frontend exports only re-export already-public data.

All public reports must pass schema validation and sensitive-text/URL checks.
These automated checks are defence in depth, not a guarantee that arbitrary text
is safe to publish. Unknown properties are rejected recursively. Only Ratniva,
GitHub, and the exact reviewed competitor hosts are allowed; URL query strings,
fragments, user information, emails, phone-shaped strings, and known token formats
are blocked. Update both validators together when changing the allowlist.

Treat source configuration, public inclusion, and PR contents as explicit decisions.
Do not add raw query analytics or commercially sensitive product facts even if a
schema field could technically contain them. Report text must be reviewed.

The default demo consumes no credentials. Read-only production uses server-side
secrets only. Publishing requires an allowlisted GitHub maintainer on a manual
main-branch workflow, exact proposal ID/hash, approved secret payload, explicit kill
switches and protected environment. No publishing has been tested on a live store.
Public Actions artifacts must not be assumed private. Detailed scheduled reports
and rollback originals are encrypted before upload; encryption keys remain Actions
secrets. Raw detailed reports are never uploaded. Review retention and key recovery.

Shopify productUpdate has no field compare-and-swap precondition. The publisher
checks current values and updatedAt immediately before a write and verifies after,
but cannot eliminate a simultaneous merchant edit between that read and write.
Use a quiet edit window for the selected product and small approved batches (this
implementation handles one product per dispatch). The rollback checks current
field values and refuses to overwrite later differing edits.

Configure branch protection, real CODEOWNERS, required CI, reviewed workflow
changes, and main-only Pages deployments. The repository cannot self-enforce its
host settings. Never add `pull_request_target` jobs that execute untrusted code.

Known limitations: pattern matching cannot detect every possible secret/PII
encoding; privacy therefore depends on allowlisted data construction and human
review as well as validation. No dependency audit proves all packages safe.
