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
      <section className="welcome-panel">
        <div>
          <span className="eyebrow">
            A clearer view. A considered next step.
          </span>
          <h2>
            Small improvements.
            <br />
            <em>Lasting discovery.</em>
          </h2>
          <p>
            Your search health, product opportunities, and review queue —
            together in one calm workspace.
          </p>
          <Link to="/recommendations" className="button primary">
            Explore opportunities <ArrowRight size={16} />
          </Link>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <Gem strokeWidth={0.7} />
          <span className="art-caption">THE ART OF BEING FOUND</span>
        </div>
      </section>
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
              <h2>SEO health</h2>
              <p className="muted small">
                Audit completeness, never a search ranking.
              </p>
            </div>
            <span className="legend">
              <i />
              Health score
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
            <EmptyState title="No issues in this report" />
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
