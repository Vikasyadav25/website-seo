import { Clock3, ScanLine } from "lucide-react";
import type { PublicReport } from "../types";
import { dateTime } from "../lib/format";
import { StatusBadge } from "./StatusBadge";

export function AgentActivity({ report }: { report: PublicReport }) {
  if (report.mode === "demo") return null;
  const crawler = report.sourceHealth.find(
    (source) => source.name === "crawler",
  );
  const missing = report.sourceHealth.filter(
    (source) =>
      ["shopify", "gsc"].includes(source.name) &&
      source.status === "not_configured",
  );
  return (
    <section
      className="panel agent-activity"
      aria-labelledby="agent-activity-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Real audit activity</span>
          <h2 id="agent-activity-title">
            <ScanLine size={19} />
            Website crawler agent
          </h2>
        </div>
        <StatusBadge status={crawler?.status || "not_configured"} />
      </div>
      <p>{crawler?.message || "The website crawler has not run yet."}</p>
      <div className="agent-run-details">
        <span>
          <Clock3 size={15} />
          Latest attempt finished: {dateTime(report.latestRun?.finishedAt)}
        </span>
        {report.latestRun && <StatusBadge status={report.latestRun.status} />}
        {report.latestRun?.githubRunUrl && (
          <a
            className="text-link"
            href={report.latestRun.githubRunUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View this audit run ↗
          </a>
        )}
      </div>
      <p className="muted small">
        Scheduled audit time: 08:00 IST; check the run history to verify
        execution. This dashboard shows the latest published snapshot and
        refreshes every 60 seconds; the crawler does not run continuously in the
        browser.
      </p>
      {missing.length > 0 && (
        <p className="small muted">
          {missing
            .map((source) =>
              source.name === "gsc" ? "Google Search Console" : "Shopify",
            )
            .join(" and ")}{" "}
          not connected yet. Product audits and search-performance data require
          those connections.
        </p>
      )}
      <a
        className="text-link"
        href={
          report.repositoryUrl
            ? `${report.repositoryUrl}/blob/main/docs/LIVE_SETUP.md`
            : "#/settings"
        }
      >
        Read-only connection setup
      </a>
    </section>
  );
}
