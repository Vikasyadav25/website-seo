# API setup and provenance

## Shopify

The catalog and state queries and SEO mutation were schema-validated against
**2026-07**, pinned in `agents/configs/site.yaml` and the adapter. Catalog reads need
`read_products`; publishing additionally needs `write_products`. No customer/order
scopes are needed. Choose the current supported app authentication/token lifecycle
for your store; a configured static token is not guaranteed to be permanent.
Set `SHOPIFY_STORE_DOMAIN` to the actual `<store>.myshopify.com` domain.

The read-only adapter paginates at most ten 50-product pages. Truncation, throttling,
authorization, timeouts, GraphQL errors, and partial results are tested with mocks.
It never treats missing explicit SEO metadata as proof that rendered fallback
metadata is broken. Drafts require human review of the actual storefront.

References: [products](https://shopify.dev/docs/api/admin-graphql/2026-07/queries/products),
[productUpdate](https://shopify.dev/docs/api/admin-graphql/2026-07/mutations/productUpdate),
[SEOInput](https://shopify.dev/docs/api/admin-graphql/2026-07/input-objects/SEOInput).

## Search Console

Grant the chosen service-account identity read access to the exact GSC property.
Put the JSON credential in an Actions secret, not source or frontend config. The
collector requests finalized rows ending three days before collection and caps
pagination. Queries/pages/devices/countries stay private. Results are API aggregates,
not a full definitive query inventory; average position is not live rank.

Reference: [Search Analytics query](https://developers.google.com/webmaster-tools/v1/searchanalytics/query).
Identity setup and real property authorization still require live verification.

## PageSpeed and crawler

`ENABLE_PAGESPEED=true` plus a server-side key enables at most five URLs × mobile/
desktop, cached seven days locally. Scheduled clean runners do not share that cache;
run the job weekly or leave it disabled to control quota. Lab data is not field CWV.
Reference: [runPagespeed](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed).

`ENABLE_PUBLIC_CRAWL=true` enables eight same-origin HTML pages with robots policy,
throttling, public-DNS checks, and no redirect following. A failed robots fetch
fails closed. The sitemap root is parsed safely, but nested Shopify sitemap index
fan-out, redirect-chain traversal, hreflang evaluation, image weight fetching, and
full-link coverage are deliberately outside the current bounded crawler.

## Manual diagnostics/evidence

Merchant diagnostics CSV must have exactly `url,severity,message` and at most 1000
rows. Store it under ignored `private/`, then set `MERCHANT_DIAGNOSTICS_PATH` locally.
Manual AI/competitor observations use `python -m agents.jobs.manual_evidence INPUT
--output private/evidence.json`. Inspect the model fields in that module: exact
prompt/date/region/account conditions and evidence are required for citation logs.
They record observations, never inferred rankings. No Google/competitor SERP scraping.
