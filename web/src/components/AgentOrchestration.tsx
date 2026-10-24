import { Link } from "react-router-dom";
import type { PublicReport } from "../types";
import { contentWorkflow } from "../lib/contentWorkflow";
import { StatusBadge } from "./StatusBadge";

export function AgentOrchestration({ report }: { report: PublicReport }) {
  const content = contentWorkflow(report);
  const gsc = report.sourceHealth.find((source) => source.name === "gsc");
  const pages = report.pageChecks?.length;
  const agents = [
    {
      name: "Keyword Agent",
      path: "/keywords",
      status: "needs_review",
      evidence: `${content.keywords.length} keyword ideas to review`,
    },
    {
      name: "Content Agent",
      path: "/content",
      status: content.status,
      evidence: "Assisted article draft ready",
    },
    {
      name: "AEO Agent",
      path: "/aeo",
      status: pages ? "checked" : "not_checked",
      evidence: pages
        ? `${pages} sampled pages checked`
        : "Awaiting page checks",
    },
    {
      name: "GEO Agent",
      path: "/geo",
      status: "not_checked",
      evidence: "Citation checks not run",
    },
    {
      name: "Tracker Agent",
      path: "/tracker",
      status: gsc?.status || "not_configured",
      evidence:
        gsc?.status === "connected"
          ? "Private GSC data collected"
          : "Connect Search Console",
    },
  ];
  return (
    <section
      className="panel orchestration"
      aria-labelledby="orchestration-title"
    >
      <h2 id="orchestration-title">Your agents</h2>
      <div className="agent-grid">
        {agents.map((agent) => (
          <Link className="agent-module" key={agent.path} to={agent.path}>
            <div>
              <h3>{agent.name}</h3>
              <StatusBadge status={agent.status} />
            </div>
            <p>{agent.evidence}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
