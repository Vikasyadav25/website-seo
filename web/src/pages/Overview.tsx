import {
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
import { AgentOrchestration } from "../components/AgentOrchestration";
import type { WorkflowStatus } from "../lib/useWorkflowStatus";
import { PriorityFindings } from "../components/PriorityFindings";
import { dateTime, inWindow } from "../lib/format";

export function Overview({
  report,
  days,
  activity,
}: {
  report: PublicReport;
  days: number;
  activity: WorkflowStatus;
}) {
  const points = report.healthHistory.filter((p) =>
    inWindow(p.date, days, report.generatedAt),
  );
  const icons = [ScanLine, ShieldCheck, Gem, CircleCheck];
  const runs = (
    report.runs.length
      ? report.runs
      : report.latestRun
        ? [report.latestRun]
        : []
  ).filter((run) => inWindow(run.startedAt, days, report.generatedAt));
  return (
    <>
      <AgentActivity report={report} activity={activity} />
      <AgentOrchestration report={report} />
      <div className="section-heading">
        <h2>Last audit measurements</h2>
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
      <PriorityFindings report={report} days={days} />
      {(report.mode === "demo" || points.length > 1) && (
        <details className="panel">
          <summary>Metadata check history</summary>
          <p className="small muted">
            Title and description presence on sampled pages. This does not
            measure rankings.
          </p>
          <TrendChart points={points} demo={report.mode === "demo"} />
        </details>
      )}
      {report.recommendations.length > 0 && (
        <section className="panel">
          <h2>Changes awaiting review</h2>
          <p>
            {report.recommendations.length} proposals include before/after
            previews. No proposal publishes from this dashboard.
          </p>
          <Link className="text-link" to="/recommendations">
            Review proposals
          </Link>
        </section>
      )}
      <section className="panel">
        <div className="section-heading">
          <h2>Recent activity</h2>
          <Link className="text-link" to="/reports">
            All reports <ArrowRight size={14} />
          </Link>
        </div>
        {runs.length ? (
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
                {runs.map((run) => (
                  <tr key={run.runId}>
                    <td>
                      <strong>{run.jobName}</strong>
                    </td>
                    <td>
                      {report.mode === "demo" ? "DEMO fixture" : "Audit worker"}
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
