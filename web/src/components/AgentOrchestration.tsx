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
      evidence: `${content.keywords.length} editorial ideas prepared. Search volume and difficulty are unmeasured.`,
    },
    {
      name: "Content Agent",
      path: "/content",
      status: content.status,
      evidence: `One assisted article draft and ${content.images.length} illustrations ready for review. Not published.`,
    },
    {
      name: "AEO Agent",
      path: "/aeo",
      status: pages ? "checked" : "not_checked",
      evidence: pages
        ? `HTML readiness checks on ${pages} sampled pages. No rich-result win is claimed.`
        : "Run the updated audit to collect page-level structured-data evidence.",
    },
    {
      name: "GEO Agent",
      path: "/geo",
      status: "not_checked",
      evidence:
        "Answer-friendly draft sections prepared. AI-engine mentions have not been measured.",
    },
    {
      name: "Tracker Agent",
      path: "/tracker",
      status: gsc?.status || "not_configured",
      evidence:
        gsc?.status === "connected"
          ? "GSC collected privately. No public keyword ranks are exposed."
          : "Connect GSC for private search-performance measurements. No ranking trend is available.",
    },
  ];
  return (
    <section
      className="panel orchestration"
      aria-labelledby="orchestration-title"
    >
      <div className="section-heading">
        <div>
          <h2 id="orchestration-title">Agent orchestration</h2>
          <p className="small muted">
            Open an agent to inspect its evidence, output and next step.
          </p>
        </div>
      </div>
      <div className="orchestrator-node">
        <strong>Ratniva coordinator</strong>
        <span>Read-only audits + assisted content workflow</span>
      </div>
      <div className="agent-grid">
        {agents.map((agent) => (
          <Link className="agent-module" key={agent.path} to={agent.path}>
            <div>
              <h3>{agent.name}</h3>
              <StatusBadge status={agent.status} />
            </div>
            <p>{agent.evidence}</p>
            <span className="text-link">Inspect output</span>
          </Link>
        ))}
      </div>
      <p className="micro muted">
        These are work modules, not five continuously running AI models.
        Automated audit activity is verified above; content preparation is
        assisted and dated in its review bundle.
      </p>
    </section>
  );
}
