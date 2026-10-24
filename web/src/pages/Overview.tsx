import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  CircleCheck,
  Gem,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PublicReport } from "../types";
import { TrendChart } from "../components/TrendChart";
import { EmptyState } from "../components/EmptyState";
import { StatusBadge } from "../components/StatusBadge";
import { AgentActivity } from "../components/AgentActivity";
import { PriorityFindings } from "../components/PriorityFindings";
import { dateTime, humanize, inWindow } from "../lib/format";

export function Overview({
  report,
  days,
}: {
  report: PublicReport;
  days: number;
}) {
  const points = report.healthHistory.filter((p) =>
    inWindow(p.date, days, report.generatedAt),
  );
  const icons = [ScanLine, ShieldCheck, Gem, CircleCheck];
  const categories = [...new Set(report.issues.map((i) => i.category))];
  return (
    <>
      <AgentActivity report={report} />
      <PriorityFindings report={report} days={days} />
      <div className="section-heading">
        <h2>At a glance</h2>
        <span className="muted small">
          {report.mode === "demo"
            ? "DEMO · Synthetic audit metrics"
            : "Public-safe audit metrics"}
        </span>
      </div>
      {report.publicSafeKpis.length ? (
        <div className="kpi-grid">
          {report.publicSafeKpis.map((kpi, i) => {
            const Icon = icons[i % icons.length];
            return (
              <article className="kpi-card" key={kpi.label}>
                <div className="kpi-top">
                  <span>{kpi.label}</span>
                  <Icon size={18} />
                </div>
                <strong>
                  {kpi.value.toLocaleString("en-IN")}
                  {kpi.unit}
                </strong>
                <div className="small muted">
                  {report.mode === "demo" && "DEMO · "}Source: audit report
                </div>
                <time className="micro muted" dateTime={kpi.asOf}>
                  As of {dateTime(kpi.asOf)}
                </time>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No public metrics published">
          Private metrics are never replaced with assumed zeroes.
        </EmptyState>
      )}
      <div className="overview-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>
                {report.mode === "demo" ? "SEO health" : "Metadata coverage"}
              </h2>
              <p className="muted small">
                {report.mode === "demo"
                  ? "Audit completeness, never a search ranking."
                  : "Share of title and description presence checks passed on sampled pages. Not a ranking."}
              </p>
            </div>
            <span className="legend">
              <i />
              {report.mode === "demo" ? "Health score" : "Presence checks"}
            </span>
          </div>
          <TrendChart points={points} demo={report.mode === "demo"} />
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Needs your attention</h2>
            <ScanLine size={18} />
          </div>
          {categories.length ? (
            <div className="category-list">
              {categories.slice(0, 5).map((category, i) => (
                <Link
                  to={`/technical?category=${encodeURIComponent(category)}`}
                  key={category}
                >
                  <span className={`category-icon tone-${i % 3}`}>
                    {i % 2 ? (
                      <ArrowUpRight size={17} />
                    ) : (
                      <ArrowDownRight size={17} />
                    )}
                  </span>
                  <span>{humanize(category)}</span>
                  <strong>
                    {
                      report.issues.filter(
                        (issue) => issue.category === category,
                      ).length
                    }
                  </strong>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No findings published for the sampled pages" />
          )}
          <Link className="text-link" to="/technical">
            View technical audit <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <div className="overview-columns">
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>Today’s opportunities</h2>
              <p className="muted small">A focused place to start.</p>
            </div>
            <Link className="text-link" to="/recommendations">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {report.recommendations.length ? (
            report.recommendations.slice(0, 3).map((p) => (
              <Link
                className="opportunity-row"
                to={`/recommendations?proposal=${p.id}`}
                key={p.id}
              >
                <span className="opportunity-icon">
                  <Gem size={18} />
                </span>
                <div>
                  <strong>{p.reason}</strong>
                  <p className="muted small">
                    {p.targetKind} · Risk {p.risk}/5 · Human review required
                  </p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : report.issues.length ? (
            report.issues.slice(0, 3).map((issue) => (
              <Link
                className="opportunity-row"
                to={`/technical?category=${encodeURIComponent(issue.category)}`}
                key={issue.id}
              >
                <span className="opportunity-icon">
                  <ScanLine size={18} />
                </span>
                <div>
                  <strong>{issue.recommendation}</strong>
                  <p className="muted small">
                    Public crawl · {humanize(issue.severity)} · Verify intent
                    before editing
                  </p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <EmptyState title="No proposals awaiting review" />
          )}
        </section>
        <section className="panel">
          <div className="section-heading">
            <h2>Source connections</h2>
            <span className="muted small">Read-only</span>
          </div>
          <div className="source-list">
            {report.sourceHealth.map((source) => (
              <div key={source.name}>
                <span>
                  {source.name === "gsc"
                    ? "Google Search Console"
                    : humanize(source.name)}
                </span>
                <StatusBadge status={source.status} />
              </div>
            ))}
          </div>
          <Link to="/settings" className="text-link">
            Connection details <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <Link className="text-link" to="/reports">
            All reports <ArrowRight size={14} />
          </Link>
        </div>
        {report.runs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Source</th>
                  <th>Completed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.runs
                  .filter((r) =>
                    inWindow(r.startedAt, days, report.generatedAt),
                  )
                  .map((run) => (
                    <tr key={run.runId}>
                      <td>
                        <strong>{run.jobName}</strong>
                      </td>
                      <td>
                        {report.mode === "demo"
                          ? "DEMO fixture"
                          : "Audit worker"}
                      </td>
                      <td>{dateTime(run.finishedAt)}</td>
                      <td>
                        <StatusBadge status={run.status} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No completed runs yet" />
        )}
      </section>
    </>
  );
}
