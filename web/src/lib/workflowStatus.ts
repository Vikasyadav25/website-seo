export interface WorkflowRun {
  id: number;
  status: string;
  conclusion: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function workflowEndpoint(repository: string): string {
  const match =
    /^https:\/\/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)$/.exec(
      repository,
    );
  if (!match) throw new Error("Invalid repository identity");
  return `https://api.github.com/repos/${match[1]}/actions/workflows/daily-audit.yml/runs?branch=main&per_page=20`;
}

export function latestWorkflowRun(
  payload: unknown,
  repository: string,
): WorkflowRun | null {
  workflowEndpoint(repository);
  const runs = object(payload).workflow_runs;
  if (!Array.isArray(runs)) throw new Error("Invalid workflow response");
  for (const value of runs) {
    const run = object(value);
    if (
      run.head_branch !== "main" ||
      !["schedule", "workflow_dispatch"].includes(String(run.event)) ||
      object(run.head_repository).full_name !==
        repository.slice("https://github.com/".length) ||
      !Number.isSafeInteger(run.id) ||
      Number(run.id) <= 0 ||
      ![
        "queued",
        "in_progress",
        "completed",
        "waiting",
        "pending",
        "requested",
      ].includes(String(run.status)) ||
      typeof run.created_at !== "string" ||
      !Number.isFinite(Date.parse(run.created_at)) ||
      typeof run.updated_at !== "string" ||
      !Number.isFinite(Date.parse(run.updated_at))
    )
      continue;
    return {
      id: Number(run.id),
      status: String(run.status),
      conclusion: [
        "success",
        "failure",
        "cancelled",
        "timed_out",
        "action_required",
        "neutral",
        "skipped",
        "startup_failure",
        "stale",
      ].includes(String(run.conclusion))
        ? String(run.conclusion)
        : null,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: `${repository}/actions/runs/${run.id}`,
    };
  }
  return null;
}
