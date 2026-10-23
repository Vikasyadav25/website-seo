# Source map

New implementation files are grouped by responsibility; there was no existing theme
or application in the workspace to modify.

| Path                                               | Purpose                                                         |
| -------------------------------------------------- | --------------------------------------------------------------- |
| `web/src/app/`                                     | Router, application shell, and navigation                       |
| `web/src/pages/Overview.tsx`                       | KPI overview, SVG trend, findings, opportunities, sources       |
| `web/src/pages/Audits.tsx`                         | Product, issue, keyword and proposal views                      |
| `web/src/pages/Operations.tsx`                     | Privacy, GEO, competitors, publication, reports and settings    |
| `web/src/components/`                              | Native drawers, status badges, charts, diffs, safe GitHub links |
| `web/src/lib/`                                     | Report loading/validation, dates and safe exports               |
| `web/src/styles/index.css`                         | Responsive design, focus and reduced-motion behavior            |
| `schemas/`                                         | Strict public-report, proposal, issue and run contracts         |
| `examples/`                                        | Synthetic and disconnected fixtures                             |
| `agents/main.py`                                   | Credential-free demo/disconnected worker                        |
| `agents/security/`                                 | Public report privacy boundary                                  |
| `scripts/`                                         | Fixture generation and safety validation                        |
| `.github/workflows/`                               | CI, read-only schedule, Pages and guarded write/rollback paths  |
| `web/e2e/`, `agents/tests/`, `web/src/**/*.test.*` | Behavioral and privacy tests                                    |
| `docs/`                                            | Setup, operations, architecture, limitations and phase backlog  |

For complete contents, open these files directly. No repeated code blocks are
required to apply the project: the files are already written in this workspace.
