import disconnected from "../../../examples/disconnected-report.json" with { type: "json" };
import { assertPublicReport } from "../lib/dataClient";
import type { PublicReport } from "../types";

export function connectedReport(): PublicReport {
  const stamp = new Date().toISOString();
  const sources = disconnected.sourceHealth.map((source) => ({
    name: source.name,
    status: source.name === "crawler" ? "connected" : "not_configured",
    ...(source.name === "crawler"
      ? {
          lastSyncedAt: stamp,
          message:
            "Checked 2 HTML pages within an 8-URL request limit; 1 fetch failures. More URLs remain queued; this is a sampled crawl, not full-site coverage.",
        }
      : {}),
  }));
  const report: unknown = {
    ...disconnected,
    mode: "connected",
    generatedAt: stamp,
    repositoryUrl: "https://github.com/Vikasyadav25/website-seo",
    sourceHealth: sources,
    latestRun: {
      runId: "test-audit",
      startedAt: stamp,
      finishedAt: stamp,
      status: "partial",
      jobName: "Read-only production audit",
      sourceStatuses: sources,
      issueCounts: { critical: 0, high: 0, medium: 1, low: 0 },
      githubRunUrl:
        "https://github.com/Vikasyadav25/website-seo/actions/runs/123",
    },
    publicSafeKpis: [
      { label: "Pages checked", value: 2, asOf: stamp },
      { label: "Technical findings", value: 1, asOf: stamp },
      { label: "High severity issues", value: 0, asOf: stamp },
      { label: "Fetch failures", value: 1, asOf: stamp },
    ],
    issues: [
      {
        id: "public-meta",
        source: "crawler",
        category: "missing-meta",
        severity: "medium",
        targetUrl: "https://ratniva.com/collections/rings",
        evidence: "No nonempty meta description detected.",
        discoveredAt: stamp,
        lastVerifiedAt: stamp,
        recommendation: "Review a factual, unique page summary.",
      },
    ],
    healthHistory: [{ date: stamp.slice(0, 10), score: 75, pagesChecked: 2 }],
    pageChecks: [
      {
        url: "https://ratniva.com/collections/rings",
        checkedAt: stamp,
        titlePresent: true,
        descriptionPresent: false,
        structuredDataPresent: false,
        helpfulQuestionsPresent: false,
        aboutOrContactLinkPresent: true,
      },
    ],
  };
  assertPublicReport(report);
  return report;
}
