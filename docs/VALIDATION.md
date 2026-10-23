# Local validation record

Validated on Windows with Node 22.14.0, pnpm 12.9.1 and Python 3.13.12.
Hosted Node 22 / Python 3.12 CI also passed:
[successful CI run](https://github.com/Vikasyadav25/website-seo/actions/runs/39890994645).
[Pages deployment](https://github.com/Vikasyadav25/website-seo/actions/runs/39891232049)
completed successfully for application commit `965f665`.

The [live DEMO](https://vikasyadav25.github.io/website-seo/) and its public report
both returned HTTP 200. The deployed report passed the schema/privacy validator.
Live browser verification passed the overview, product drawer, and 360px mobile
layout with zero page errors. Pages deployment is restricted to `main`.

| Check                                            | Result                            |
| ------------------------------------------------ | --------------------------------- |
| Frozen pnpm install                              | Passed                            |
| ESLint and TypeScript strict check               | Passed                            |
| Frontend Vitest                                  | 28 passed                         |
| Python pytest                                    | 60 passed                         |
| Playwright desktop + 360px mobile                | 10 passed                         |
| Production build at `/website-seo/`              | Passed                            |
| Python Ruff                                      | Passed                            |
| Public JSON schema/privacy checks                | Passed                            |
| Deployable credential scan                       | Passed                            |
| GitHub workflow actionlint                       | Passed                            |
| Formatting                                       | Passed                            |
| pnpm audit                                       | No known vulnerabilities reported |
| pip-audit of requirements                        | No known vulnerabilities reported |
| Shopify 2026-07 query/mutation schema validation | Passed                            |

Meaningful coverage includes all routes and project-subpath data loading, mobile
overflow, date windows, exports, dialogs, before/after previews, failed/partial/
empty/stale data, public-data rejection, API pagination/throttling/auth/timeouts,
private live/mock separation, exact approval/version checks, idempotency, encrypted
originals and rollback refusal after subsequent edits.

Both screenshot variants under ignored `private/overview-*.png` were visually
inspected. Reproduction commands are in README. An audit finding count of zero is
not proof of security; repository protection and live store validation still need
operator verification. Detailed limits are in IMPLEMENTATION and LIVE_SETUP.
