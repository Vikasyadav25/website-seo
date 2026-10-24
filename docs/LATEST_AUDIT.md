# Public website audit — 24 October 2026

Verified in [production audit 40090935558](https://github.com/Vikasyadav25/website-seo/actions/runs/40090935558).
Collection started at 17:12 IST on 24 October 2026. Shopify catalog reads,
PageSpeed sampling and the public crawler succeeded. GSC authenticated but the
configured property's search-analytics request returned `HTTP 403; forbidden`.
This is an access rejection, not missing credentials. Verify service-account
permission and the exact property identifier; no replacement key is needed based
on this evidence. Raw Google messages, identities and query data are withheld.

The bundled `web/public/data/report.json` remains the earlier 23 October public
crawl for local use. The hosted dashboard reads the newer validated Actions report.

The updated report additionally contains eight sampled-page readiness records:
title/description presence, JSON-LD presence, question headings and about/contact
links. Presence checks are not schema validation or search-result wins.

## Findings

- Eight HTML pages checked: homepage, `/collections/all`, and six product pages.
- All eight had a nonempty title and meta description. Presence does not establish
  content quality, uniqueness, indexing, or search rankings.
- Eight low-priority image-alt review items; no high/critical findings detected by
  the implemented checks on this sample. No fetch failures in these eight requests.
- Homepage: 23 images with empty/missing alt; collection page: one; sampled product
  pages: two or three each. These counts can include shared theme/decorative images.
  They do not prove that product photography lacks useful alt text.

## Next work

1. Inspect the homepage image elements first. Identify product/content images with
   missing descriptions, and retain empty alt for decorative images.
2. Inspect the repeated findings on product pages to determine whether they come
   from shared theme elements before changing individual product media.
3. Resolve GSC property access for the configured service-account identity, then
   rerun **Daily audit > production**. Shopify and PageSpeed already connected in
   the latest run. Use the [read-only setup guide](LIVE_SETUP.md).

## Limits

The crawler stopped at its eight-URL budget with URLs still queued. This is not
full-site coverage. Title/meta checks inspect presence; JSON-LD parsing does not
validate Google's eligibility rules. Public JSON excludes private catalog details;
PageSpeed lab measurements remain private; the public report exposes source
health. There is no click/impression comparison or ranking analysis because GSC
access failed. Manual Merchant diagnostics remain not configured: supplied CSVs
contain item IDs but lack the product URLs required by the current importer.

No private report encryption key is configured. Detailed catalog records/drafts
created on the ephemeral Actions runner were not uploaded as an artifact; only the
validated public report was retained. Set up encrypted report retention before
expecting private analysis to be available after a run.

Raw source records and any later private analytics stay under ignored `private/`.
No storefront changes or publishing were performed.
