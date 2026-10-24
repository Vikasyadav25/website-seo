# Agent command center and assisted content workflow

The reference screenshots and shared guide describe both an agent overview and a
topic-to-article workflow. Ratniva adapts that structure to the existing Shopify
read-only worker and public-safe dashboard. It does not copy the reference's
keyword volumes, rankings, citation counts, snippet wins or WordPress publisher.

## What runs automatically

Daily audit runs the configured read-only collectors. The dashboard checks the
public GitHub Daily audit run endpoint every five minutes while visible, and when
the operator explicitly refreshes. It verifies the main branch, source repository
and schedule/manual event before presenting running, queued or completed status.
No browser token is used. If the endpoint is unavailable or rate limited, current
activity is unknown; the last published report stays visible with its own date.

The crawler exports a strict allowlist of public HTML booleans for sampled pages:
title/description presence, parseable JSON-LD presence, question headings and an
about/contact link. Those checks do not establish indexing, valid Google schema,
rich-result eligibility, a featured snippet, or AI citations.

## Work modules

| Agent   | Existing output                                                  | Remaining dependency                                                  |
| ------- | ---------------------------------------------------------------- | --------------------------------------------------------------------- |
| Keyword | Editorial ideas attached to a sourced content brief              | GSC for private performance; external evidence for volume/difficulty  |
| Content | Actual silver-care article, metadata, FAQs and two illustrations | Merchant review; next-topic preparation is assisted                   |
| AEO     | Sampled public-page HTML readiness evidence                      | A fresh audit for older reports; intent and eligibility review        |
| GEO     | Answer-friendly content draft and explicit citation-check states | Verified engine observations; no automated citation tracking          |
| Tracker | GSC source state and private analytics path                      | Configured GSC and completed reporting windows; no public raw queries |

These modules are not five continuously running LLM agents. Routine checks are
deterministic. Research, article writing and illustration creation for the first
care guide were assisted in the operator's session. The content manifest records
the package's preparation time and actual artifacts, not invented execution times.

## First content run

Topic: **925 silver jewellery care guide**.

- Three public sources reviewed, including a public competitor care page.
- Five editorial keyword ideas; no fabricated demand measurements.
- Original article draft, search metadata and three FAQ answers.
- Two generated editorial illustrations with alt text, labelled as illustrations.
- Human review pending. Blog publication is blocked, not marked complete.

The reviewed public-safe manifest is `agents/content/silver-care-review.json`.
It passes the strict report schema and both public-data safety validators. It is
separate from live Shopify metrics and remains an unpublished editorial draft.

Package the supplied review bundle locally:

```sh
python -m agents.content
```

This validates the manifest and required assets, then saves `article.md`,
`brief.md`, `manifest.json` and images under ignored
`private/content/925-silver-care/`. It does not research a new topic, call a hosted
model or publish a blog. New supplied review manifests can be packaged using
`--input` and `--output`; output must remain under `private/`.

The Content Agent page exports the article and manifest, provides image downloads,
and prepares copyable instructions for a new assisted topic. Copying instructions
does not launch an unattended job. No new paid service or secret is assumed.

## Publication boundary

The current protected publisher supports approved product SEO fields only. It
cannot create blog articles or upload content images. A Shopify blog-draft writer
would need a separate exact approval, field allowlist, stale-state checks, private
backup, idempotency and guarded rollback verification. It remains unimplemented;
no existing product publishing safety switch has been enabled for this feature.
