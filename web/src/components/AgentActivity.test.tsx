import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import { connectedReport } from "../test/connectedReport";
import { AgentActivity } from "./AgentActivity";
import type { WorkflowStatus } from "../lib/useWorkflowStatus";

const report = connectedReport();
const workflow = {
  id: 123,
  status: "completed",
  conclusion: "success",
  createdAt: report.generatedAt,
  updatedAt: report.generatedAt,
  url: report.latestRun!.githubRunUrl!,
};

function mount(activity: WorkflowStatus) {
  render(
    <MemoryRouter>
      <AgentActivity report={report} activity={activity} />
    </MemoryRouter>,
  );
}

it.each([
  ["in_progress", null, "Audit running now"],
  ["queued", null, "Audit waiting to start"],
  ["completed", "failure", "Latest audit did not complete successfully"],
  ["completed", "success", "Latest audit finished"],
])(
  "shows verified %s activity separately from published findings",
  (status, conclusion, heading) => {
    mount({
      state: "verified",
      run: { ...workflow, status: status!, conclusion },
      checkedAt: report.generatedAt,
    });
    expect(screen.getByRole("heading", { name: heading! })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Last published audit" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View published audit proof" }),
    ).toHaveAttribute("href", workflow.url);
    expect(screen.getByText("No published change records")).toBeInTheDocument();
  },
);

it("does not claim running or idle when GitHub status cannot be checked", () => {
  mount({ state: "unavailable" });
  expect(
    screen.getByRole("heading", { name: "Current agent activity unavailable" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Audit running now")).not.toBeInTheDocument();
});

it("keeps an earlier report explicit after a newer successful workflow", () => {
  mount({
    state: "verified",
    run: {
      ...workflow,
      id: 456,
      url: "https://github.com/Vikasyadav25/website-seo/actions/runs/456",
      createdAt: new Date(
        Date.parse(report.generatedAt) + 60_000,
      ).toISOString(),
    },
    checkedAt: report.generatedAt,
  });
  expect(
    screen.getByRole("heading", {
      name: "Audit finished; report update pending",
    }),
  ).toBeInTheDocument();
});
