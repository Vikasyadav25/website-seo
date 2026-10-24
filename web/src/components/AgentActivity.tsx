import { Link } from "react-router-dom";
import type { PublicReport, SourceHealth } from "../types";
import type { WorkflowStatus } from "../lib/useWorkflowStatus";
import { dateTime } from "../lib/format";
import { StatusBadge } from "./StatusBadge";
import { GitHubLink } from "./GitHubLink";

const sourceNames: Record<SourceHealth["name"], string> = {
  shopify: "Shopify catalog",
  crawler: "Website crawl",
  gsc: "Google Search Console",
  pagespeed: "PageSpeed",
  merchant_manual: "Merchant diagnostics",
};

function sourceEvidence(source: SourceHealth) {
  if (source.status === "failed")
    return "Request failed. No successful check is claimed.";
  if (source.status === "stale")
    return "Source results are stale; collect a fresh report.";
  if (source.status === "not_configured")
    return "Not configured. This source did not run.";
  if (source.name === "shopify")
    return "Catalog read succeeded. Detailed catalog results stay private.";
  return source.message || "Read-only collection succeeded.";
}

export function AgentActivity({
  report,
  activity,
}: {
  report: PublicReport;
  activity: WorkflowStatus;
}) {
  if (report.mode === "demo") return null;
  const run = activity.state === "verified" ? activity.run : null;
  const newerRun =
    run &&
    run.url !== report.latestRun?.githubRunUrl &&
    Date.parse(run.createdAt) > Date.parse(report.generatedAt);
  let heading =
    activity.state === "checking"
      ? "Checking current agent activity"
      : "Current agent activity unavailable";
  let badge = activity.state === "checking" ? "checking" : "unavailable";
  let explanation =
    "The published report below is available. Open GitHub to verify whether a newer audit is running.";
  if (activity.state === "verified") {
    if (!run) {
      heading = "No audit run could be verified";
      badge = "not_configured";
    } else if (run.status === "in_progress") {
      heading = "Audit running now";
      badge = "running";
      explanation =
        "GitHub confirms an audit is in progress. Findings below remain from the last published report.";
    } else if (run.status !== "completed") {
      heading = "Audit waiting to start";
      badge = "queued";
      explanation =
        "GitHub has queued or paused the audit. No new results are available yet.";
    } else if (run.conclusion === "success") {
      heading = newerRun
        ? "Audit finished; report update pending"
        : "Latest audit finished";
      badge = newerRun ? "partial" : "success";
      explanation = newerRun
        ? "The latest audit finished in GitHub. This dashboard is still showing an earlier published report."
        : "The workflow finished. Source results below show what was collected and what remains unconfigured.";
    } else {
      heading = "Latest audit did not complete successfully";
      badge = "failed";
      explanation =
        "Open the latest attempt to check its failed, cancelled or skipped steps. The published report may be older.";
    }
  }
  const latest = report.latestRun;
  const duration = latest?.finishedAt
    ? Date.parse(latest.finishedAt) - Date.parse(latest.startedAt)
    : NaN;
  return (
    <section
      className="panel agent-activity"
      aria-labelledby="agent-activity-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Audit status</span>
          <h2 id="agent-activity-title">{heading}</h2>
        </div>
        <StatusBadge status={badge} />
      </div>
      <p className="small muted">Last audit: {dateTime(latest?.finishedAt)}</p>
      <div className="agent-actions">
        <GitHubLink
          repository={report.repositoryUrl}
          suffix="/actions/workflows/daily-audit.yml"
        >
          Run audit in GitHub
        </GitHubLink>
      </div>
      <details className="agent-run-details">
        <summary>Run details</summary>
        <p>{explanation}</p>
        {activity.state === "verified" && (
          <p className="small muted">
            GitHub status checked: {dateTime(activity.checkedAt)}. Background
            checks every 5 minutes.
          </p>
        )}
        {run && (
          <a
            className="text-link"
            href={run.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            View latest attempt #{run.id}
          </a>
        )}
        <div className="agent-proof">
          <div className="section-heading">
            <h3>Last published audit</h3>
            {latest && <StatusBadge status={latest.status} />}
          </div>
          <dl className="agent-proof-facts">
            <div>
              <dt>Finished</dt>
              <dd>{dateTime(latest?.finishedAt)}</dd>
            </div>
            {Number.isFinite(duration) && duration >= 0 && (
              <div>
                <dt>Duration</dt>
                <dd>{Math.round(duration / 1000)} seconds</dd>
              </div>
            )}
            <div>
              <dt>Store changes</dt>
              <dd>
                {report.publishingEvents.length
                  ? `${report.publishingEvents.length} published event records`
                  : "No published change records"}
              </dd>
            </div>
          </dl>
          {latest?.githubRunUrl && (
            <a
              className="text-link"
              href={latest.githubRunUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View published audit proof
            </a>
          )}
          <div className="agent-source-details">
            <h3>Source checks</h3>
            <ul>
              {report.sourceHealth
                .filter((source) => source.name !== "merchant_manual")
                .map((source) => (
                  <li key={source.name}>
                    <div>
                      <strong>{sourceNames[source.name]}</strong>
                      <StatusBadge status={source.status} />
                    </div>
                    <p>{sourceEvidence(source)}</p>
                    {source.lastSyncedAt && (
                      <time
                        className="micro muted"
                        dateTime={source.lastSyncedAt}
                      >
                        Checked {dateTime(source.lastSyncedAt)}
                      </time>
                    )}
                  </li>
                ))}
            </ul>
            <Link className="text-link" to="/settings">
              Connection setup and details
            </Link>
          </div>
        </div>
        <p className="micro muted">
          Scheduled time: 08:00 IST. Refresh checks reports and status; start a
          new audit in GitHub.
        </p>
      </details>
    </section>
  );
}
