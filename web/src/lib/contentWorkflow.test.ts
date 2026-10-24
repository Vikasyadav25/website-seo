import { expect, it } from "vitest";
import { connectedReport } from "../test/connectedReport";
import { contentWorkflow, articleMarkdown } from "./contentWorkflow";
import { assertPublicReport } from "./dataClient";

it("validates the actual assisted draft in the browser and exports a reviewable article", () => {
  const report = connectedReport();
  const workflow = contentWorkflow(report);
  expect(workflow.mode).toBe("assisted");
  expect(workflow.images).toHaveLength(2);
  expect(
    workflow.stages.find((stage) => stage.id === "publishing")?.status,
  ).toBe("blocked");
  expect(articleMarkdown(workflow)).toContain(
    "Human review required. Not published.",
  );
  expect(() =>
    assertPublicReport({ ...report, contentWorkflow: workflow }),
  ).not.toThrow();
  const unsafe = structuredClone(workflow);
  unsafe.images[0].src = "../private/report.json";
  expect(() =>
    assertPublicReport({ ...report, contentWorkflow: unsafe }),
  ).toThrow();
});
