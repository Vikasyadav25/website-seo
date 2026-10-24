import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import { connectedReport } from "../test/connectedReport";
import { assertPublicReport } from "../lib/dataClient";
import published from "../../public/data/report.json";
import { PriorityFindings } from "./PriorityFindings";

it("accepts the bundled snapshot through the browser safety validator", () => {
  expect(() => assertPublicReport(published)).not.toThrow();
});

it("prioritises severity, shows page evidence, and excludes older findings", () => {
  const report = connectedReport();
  const original = report.issues[0];
  report.issues.push(
    {
      ...original,
      id: "high",
      severity: "high",
      evidence: "High priority evidence",
    },
    {
      ...original,
      id: "expired",
      severity: "critical",
      lastVerifiedAt: "2020-01-01T00:00:00Z",
      evidence: "Expired evidence",
    },
  );
  render(
    <MemoryRouter>
      <PriorityFindings report={report} days={7} />
    </MemoryRouter>,
  );
  const rows = screen.getAllByRole("row");
  expect(rows).toHaveLength(3);
  expect(
    within(rows[1]).getByText("High priority evidence"),
  ).toBeInTheDocument();
  expect(within(rows[1]).getByRole("link")).toHaveAttribute(
    "href",
    original.targetUrl,
  );
  expect(screen.queryByText("Expired evidence")).not.toBeInTheDocument();
  expect(report.issues[0].id).toBe(original.id);
});
