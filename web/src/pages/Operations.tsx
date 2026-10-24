import {
  Download,
  LockKeyhole,
  ShieldCheck,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import type { PublicReport } from "../types";
import { GitHubLink } from "../components/GitHubLink";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { download, makeCsv } from "../lib/export";
import { dateTime, humanize, inWindow } from "../lib/format";

export function SearchPerformance({ report }: { report: PublicReport }) {
  const gsc = report.sourceHealth.find((source) => source.name === "gsc");
  return (
    <section className="panel privacy-panel">
      <div className="privacy-icon">
        <LockKeyhole size={30} strokeWidth={1.3} />
      </div>
      <span className="eyebrow">Owner analytics · Protected by design</span>
      <h2>Private analytics stay private.</h2>
      <p>
        Google Search Console:{" "}
        <StatusBadge status={gsc?.status || "not_configured"} />
      </p>
      <p>
        Search Console impressions, clicks, CTR, query lists, and average
        position are not published to this dashboard.
      </p>
      <div className="notice">
        Private analytics — available in authenticated Actions artifacts once
        configured read-only GSC collector completes. Detailed artifacts are
        encrypted before upload; the operator decrypts them locally.
      </div>
      <GitHubLink repository={report.repositoryUrl}>
        View GitHub Actions
      </GitHubLink>
      <p className="small muted">
        GSC reports can lag. Average position is an aggregate metric, not a live
        or definitive Google rank. Compare completed reporting windows.
      </p>
    </section>
  );
}
export function GEO({ report }: { report: PublicReport }) {
  return (
    <>
      <div className="notice">
        Content readiness signals help prioritise useful, factual pages. They do
        not measure or predict AI search rankings or citations.
      </div>
      <section className="panel">
        <h2>AI-engine citation evidence</h2>
        <p>
          No automated engine observations have been collected. Missing
          observations are not a No or a zero.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Engine</th>
                <th>Brand citation</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {["ChatGPT", "Gemini", "Perplexity", "Google AI Overviews"].map(
                (engine) => (
                  <tr key={engine}>
                    <td>{engine}</td>
                    <td>
                      <StatusBadge status="not_checked" />
                    </td>
                    <td>No verified observation recorded</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>
      <div className="readiness-grid">
        {report.readiness.map((signal) => (
          <section className="panel" key={signal.label}>
            <ShieldCheck size={24} strokeWidth={1.4} />
            <h2>{signal.label}</h2>
            <StatusBadge status={signal.status} />
            <p>{signal.evidence}</p>
            <p className="muted small">
              Source:{" "}
              {report.mode === "demo" ? "DEMO checklist" : "Readiness audit"} ·
              As of {dateTime(report.generatedAt)}
            </p>
          </section>
        ))}
      </div>
      {!report.readiness.length && (
        <EmptyState title="No readiness checks available" />
      )}
      <section className="panel">
        <h2>Manual AI citation evidence</h2>
        <EmptyState title="No observations recorded">
          Log the model, exact prompt, date, region, account conditions, and a
          quoted snippet with a source link in a private report. A single
          observation is not a repeatable ranking.
        </EmptyState>
      </section>
    </>
  );
}
export function Competitors({ report }: { report: PublicReport }) {
  return (
    <>
      <div className="notice">
        A curated research watchlist, with no automated SERP scraping or
        unverified competitor claims. Example domains must be confirmed by the
        operator before research.
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Research watchlist</h2>
          <span className="muted small">Manual / monthly</span>
        </div>
        {report.competitors.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Public website</th>
                  <th>Observation</th>
                  <th>Verified</th>
                </tr>
              </thead>
              <tbody>
                {report.competitors.map((c) => (
                  <tr key={c.name}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <a
                        className="text-link"
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit website <ExternalLink size={13} />
                      </a>
                    </td>
                    <td>{c.observation || "No evidence recorded"}</td>
                    <td>{dateTime(c.verifiedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
      <section className="panel">
        <h2>A useful benchmark</h2>
        <p>
          Compare category introductions, product buying guidance, care content,
          and publicly visible structured data. Record the URL and observation
          date. Use the findings to improve usefulness and clarity.
        </p>
      </section>
    </>
  );
}
export function Publishing({ report }: { report: PublicReport }) {
  return (
    <>
      <div className="notice">
        <LockKeyhole size={18} />
        This dashboard is read-only. Server-side publishing is disabled by
        default and requires an approved proposal, exact content hash, protected
        workflow, and encrypted rollback capture. Live store verification is
        still required.
      </div>
      <div className="toolbar">
        <GitHubLink
          repository={report.repositoryUrl}
          suffix="/actions/workflows/publish-approved.yml"
        >
          Open publish workflow
        </GitHubLink>
        <GitHubLink
          repository={report.repositoryUrl}
          suffix="/actions/workflows/rollback.yml"
        >
          Open rollback workflow
        </GitHubLink>
      </div>
      <section className="panel">
        <h2>Publication history</h2>
        {report.publishingEvents.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>State</th>
                  <th>Fields</th>
                  <th>Timestamp</th>
                  <th>Job</th>
                </tr>
              </thead>
              <tbody>
                {report.publishingEvents.map((e) => (
                  <tr key={e.id}>
                    <td>{e.id}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td>{e.fields.join(", ")}</td>
                    <td>{dateTime(e.timestamp)}</td>
                    <td>
                      <a href={e.jobUrl}>View job</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No changes have been published">
            Approved publication and rollback events will appear here once the
            reviewed sanitized event records are included in a public report.
          </EmptyState>
        )}
      </section>
    </>
  );
}
export function Reports({
  report,
  days,
}: {
  report: PublicReport;
  days: number;
}) {
  const runs = report.runs.filter((r) =>
    inWindow(r.startedAt, days, report.generatedAt),
  );
  return (
    <>
      <div className="toolbar">
        <button
          className="button"
          onClick={() =>
            download(
              `ratniva-${report.mode}-public-report.json`,
              JSON.stringify(report, null, 2),
            )
          }
        >
          <Download size={15} />
          Download public JSON
        </button>
        <button
          className="button"
          disabled={!runs.length}
          onClick={() =>
            download(
              `ratniva-${report.mode}-runs.csv`,
              makeCsv(
                runs.map((r) => ({
                  run: r.runId,
                  job: r.jobName,
                  status: r.status,
                  started: r.startedAt,
                  finished: r.finishedAt,
                })),
              ),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={15} />
          Download runs CSV
        </button>
        <GitHubLink repository={report.repositoryUrl}>
          Private Actions artifacts
        </GitHubLink>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Audit runs</h2>
          <span className="muted small">Selected {days}-day window</span>
        </div>
        {runs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Run</th>
                  <th>Job</th>
                  <th>Started</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.runId}>
                    <td>{r.runId}</td>
                    <td>{r.jobName}</td>
                    <td>{dateTime(r.startedAt)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No runs in this reporting window" />
        )}
      </section>
      <div className="overview-columns">
        <section className="panel">
          <h2>Weekly action plan</h2>
          {report.recommendations.length ? (
            <ol className="action-plan">
              {report.recommendations.slice(0, 3).map((p) => (
                <li key={p.id}>
                  {p.reason}
                  <small>
                    Validate evidence → review exact diff → use protected
                    workflow when enabled.
                  </small>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="Run an audit to build an action plan" />
          )}
        </section>
        <section className="panel">
          <h2>Provenance</h2>
          <dl className="config-list">
            <div>
              <dt>Data mode</dt>
              <dd>{report.mode.toUpperCase()}</dd>
            </div>
            <div>
              <dt>Generated</dt>
              <dd>{dateTime(report.generatedAt)}</dd>
            </div>
            <div>
              <dt>Report schema</dt>
              <dd>Version {report.schemaVersion}</dd>
            </div>
            <div>
              <dt>Analytics privacy</dt>
              <dd>Raw analytics excluded</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>Asia/Kolkata</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
export function Settings({ report }: { report: PublicReport }) {
  return (
    <>
      <div className="notice">
        Read-only configuration. Store credentials in GitHub Actions secrets.
        This public dashboard never accepts API tokens or changes safety
        controls.
      </div>
      <div className="overview-columns">
        <section className="panel">
          <h2>Workspace</h2>
          <dl className="config-list">
            <div>
              <dt>Site</dt>
              <dd>
                <a href={report.siteUrl}>{report.siteUrl}</a>
              </dd>
            </div>
            <div>
              <dt>Cadence</dt>
              <dd>Daily · 02:30 UTC / 08:00 IST</dd>
            </div>
            <div>
              <dt>Hosting</dt>
              <dd>Static GitHub Pages</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{report.mode.toUpperCase()}</dd>
            </div>
            <div>
              <dt>Repository</dt>
              <dd>{report.repositoryUrl || "Not configured"}</dd>
            </div>
          </dl>
          <GitHubLink
            repository={report.repositoryUrl}
            suffix="/settings/secrets/actions"
          >
            Secure Actions settings
          </GitHubLink>
        </section>
        <section className="panel">
          <h2>Default safety controls</h2>
          <p className="muted small">
            Verify actual protected workflow settings on GitHub before any
            publication.
          </p>
          <dl className="config-list">
            <div>
              <dt>DRY_RUN</dt>
              <dd>true</dd>
            </div>
            <div>
              <dt>ENABLE_SHOPIFY_WRITES</dt>
              <dd>false</dd>
            </div>
            <div>
              <dt>PUBLISH_ENABLED</dt>
              <dd>false</dd>
            </div>
            <div>
              <dt>Private analytics</dt>
              <dd>Never in public reports</dd>
            </div>
            <div>
              <dt>Write adapter</dt>
              <dd>Server-side only · Live verification required</dd>
            </div>
          </dl>
        </section>
      </div>
      <section className="panel">
        <h2>Source health</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>State</th>
                <th>Last synced</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {report.sourceHealth.map((s) => (
                <tr key={s.name}>
                  <td>{humanize(s.name)}</td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                  <td>{dateTime(s.lastSyncedAt)}</td>
                  <td>{s.message || "No further information"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel">
        <h2>
          <BookOpen size={20} /> Operator documentation
        </h2>
        <p>
          Setup, public-data policy, daily operations, and phase acceptance are
          documented in the repository.
        </p>
        <GitHubLink
          repository={report.repositoryUrl}
          suffix="/blob/main/docs/SETUP.md"
        >
          Open setup guide
        </GitHubLink>
      </section>
    </>
  );
}
