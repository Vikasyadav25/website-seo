# Ratniva Growth OS engineering instructions

Ratniva is a premium Indian silver jewellery brand. Build minimal, maintainable,
production-ready software. Inspect existing architecture before changing it.
Preserve unrelated functionality. No jQuery, unnecessary libraries, fake metrics,
fabricated product claims, or ranking guarantees.

This repository is a separate SEO dashboard, not a Shopify theme. Do not change
Dawn, storefront pricing, carts, inventory, checkout, or app blocks.

## Product and security

- Follow the phases in docs/IMPLEMENTATION.md and the supplied master specification.
- Phase 1 is static, read-only, and synthetic. Never label fixtures as live data.
- Public reports must pass the strict schema and both safety validators.
- No credentials, personal information, raw GSC queries, revenue, or private facts
  in source, frontend bundles, localStorage, public JSON, PRs, or logs.
- Never use VITE_ environment variables for secrets. No browser Admin API calls.
- Missing metrics are absent, not invented zeroes. Missing sources are skipped.
- Shopify publication remains disabled by default. Do not enable it before a live
  test-product dry run, exact approval, encrypted backup, and guarded rollback test.
- Any later write path needs exact field allowlists, approval and hash validation,
  stale-state checks, private originals, idempotency, and guarded rollback.
- Production-safe controls take precedence over visual shortcuts.

## Implementation

- Strict TypeScript, reusable React components, scoped application styles.
- Keep mobile 360px layouts, keyboard operation, focus management, and reduced motion.
- HashRouter and BASE_URL-relative data fetching must work under a Pages subpath.
- Report dates use Asia/Kolkata. Filters use report time, not fabricated current time.
- Keep the dashboard itself noindex; product SEO work belongs to the storefront.
- Use pnpm and the frozen lockfile. Python 3.12+; pinned requirements.
- Run lint, typecheck, Vitest, pytest, public validation, build, credential scan,
  and Playwright for meaningful behavior changes. Update phase status truthfully.
