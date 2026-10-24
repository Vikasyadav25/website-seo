import { Link } from "react-router-dom";
import type { PublicReport } from "../types";
import { AgentActivity } from "../components/AgentActivity";
import { AgentOrchestration } from "../components/AgentOrchestration";
import type { WorkflowStatus } from "../lib/useWorkflowStatus";
import { inWindow } from "../lib/format";

export function Overview({
  report,
  days,
  activity,
}: {
  report: PublicReport;
  days: number;
  activity: WorkflowStatus;
}) {
  const pages = report.publicSafeKpis.find(
    (kpi) => kpi.label === "Pages checked",
  );
  const findings = report.issues.filter((issue) =>
    inWindow(issue.lastVerifiedAt, days, report.generatedAt),
  );
  return (
    <>
      <AgentActivity report={report} activity={activity} />
      <AgentOrchestration report={report} />
      <section className="panel audit-summary" aria-label="Audit summary">
        <div>
          {pages ? (
            <span>
              <strong>{pages.value.toLocaleString("en-IN")}</strong> pages
              checked
            </span>
          ) : (
            <span>No page measurement published</span>
          )}
          <span>
            <strong>{findings.length}</strong> published findings in {days} days
          </span>
        </div>
        <div className="audit-summary-links">
          <Link className="text-link" to="/technical">
            View findings
          </Link>
          <Link className="text-link" to="/reports">
            Run history
          </Link>
        </div>
      </section>
    </>
  );
}
