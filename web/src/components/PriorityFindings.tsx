import { Link } from "react-router-dom";
import type { PublicReport, Severity } from "../types";
import { humanize, inWindow, pathLabel } from "../lib/format";
import { StatusBadge } from "./StatusBadge";
import { EmptyState } from "./EmptyState";

const priority: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function PriorityFindings({
  report,
  days,
}: {
  report: PublicReport;
  days: number;
}) {
  const findings = report.issues
    .filter((issue) => inWindow(issue.lastVerifiedAt, days, report.generatedAt))
    .sort((a, b) => priority[a.severity] - priority[b.severity]);

  return (
    <section className="panel" aria-labelledby="priority-findings-title">
      <div className="section-heading">
        <div>
          <h2 id="priority-findings-title">What to work on first</h2>
          <p className="muted small">
            {report.mode === "demo"
              ? "DEMO examples"
              : "Measured page findings"}
            {" · "}Severity first · Selected {days}-day window
          </p>
        </div>
        <Link className="text-link" to="/technical">
          All findings ({findings.length})
        </Link>
      </div>
      {findings.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Priority / page</th>
                <th>Evidence</th>
                <th>Next step</th>
              </tr>
            </thead>
            <tbody>
              {findings.slice(0, 5).map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <StatusBadge status={issue.severity} />
                    <p>
                      <strong>{humanize(issue.category)}</strong>
                    </p>
                    <a
                      className="text-link"
                      href={issue.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {pathLabel(issue.targetUrl)}
                    </a>
                  </td>
                  <td>{issue.evidence}</td>
                  <td>{issue.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No verified findings in this window">
          Check source status and crawl coverage before deciding that pages need
          no work.
        </EmptyState>
      )}
      <p className="muted small">
        Review page intent before editing. These checks do not measure traffic,
        indexing or Google rankings.
      </p>
    </section>
  );
}
