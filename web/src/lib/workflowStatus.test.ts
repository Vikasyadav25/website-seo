import { expect, it } from "vitest";
import { latestWorkflowRun, workflowEndpoint } from "./workflowStatus";

const repository = "https://github.com/Vikasyadav25/website-seo";
const run = {
  id: 123,
  status: "in_progress",
  conclusion: null,
  head_branch: "main",
  event: "workflow_dispatch",
  head_repository: { full_name: "Vikasyadav25/website-seo" },
  created_at: "2026-10-24T05:40:00Z",
  updated_at: "2026-10-24T05:41:00Z",
};

it("uses only the reviewed repository's public daily workflow endpoint", () => {
  expect(workflowEndpoint(repository)).toContain(
    "/repos/Vikasyadav25/website-seo/actions/workflows/daily-audit.yml/runs?",
  );
  expect(() => workflowEndpoint(`${repository}?token=secret`)).toThrow();
  expect(() => workflowEndpoint("https://evil.example/owner/repo")).toThrow();
});

it("rejects fork, PR and invalid runs and constructs a trusted proof link", () => {
  const result = latestWorkflowRun(
    {
      workflow_runs: [
        { ...run, id: 444, event: "pull_request" },
        { ...run, id: 333, head_repository: { full_name: "other/repo" } },
        { ...run, id: 222, head_branch: "other" },
        { ...run, id: 111, updated_at: "invalid" },
        {
          ...run,
          html_url: "https://evil.example",
          actor: { email: "private@example.com" },
        },
      ],
    },
    repository,
  );
  expect(result?.id).toBe(123);
  expect(result?.url).toBe(`${repository}/actions/runs/123`);
  expect(JSON.stringify(result)).not.toContain("private@example.com");
  expect(JSON.stringify(result)).not.toContain("evil.example");
});

it("distinguishes an empty verified history from a malformed API response", () => {
  expect(latestWorkflowRun({ workflow_runs: [] }, repository)).toBeNull();
  expect(() => latestWorkflowRun({}, repository)).toThrow();
});
