import reviewed from "../../../agents/content/silver-care-review.json" with { type: "json" };
import type { PublicReport, ContentWorkflow } from "../types";
import { assertPublicReport } from "./dataClient";

export function contentWorkflow(report: PublicReport): ContentWorkflow {
  const candidate: unknown = {
    ...report,
    contentWorkflow: report.contentWorkflow || reviewed,
  };
  assertPublicReport(candidate);
  return candidate.contentWorkflow!;
}

export function articleMarkdown(workflow: ContentWorkflow): string {
  return (
    [
      "DRAFT — Human review required. Not published.",
      `# ${workflow.draft.title}`,
      ...workflow.draft.sections.map(
        (section) => `## ${section.heading}\n\n${section.text}`,
      ),
      "## Frequently asked questions",
      ...workflow.draft.faqs.map(
        (faq) => `### ${faq.question}\n\n${faq.answer}`,
      ),
      "## Sources",
      ...workflow.sources.map((source) => `- [${source.label}](${source.url})`),
    ].join("\n\n") + "\n"
  );
}
