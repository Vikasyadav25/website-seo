import { useCallback, useEffect, useState } from "react";
import {
  latestWorkflowRun,
  workflowEndpoint,
  type WorkflowRun,
} from "./workflowStatus";

export type WorkflowStatus =
  | { state: "unavailable" | "checking" }
  | { state: "verified"; run: WorkflowRun | null; checkedAt: string };

export function useWorkflowStatus(repository: string | null, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<{
    repository: string | null;
    status: WorkflowStatus;
  }>({ repository: null, status: { state: "checking" } });
  const [attempt, setAttempt] = useState(0);
  const refresh = useCallback(() => {
    setSnapshot({ repository, status: { state: "checking" } });
    setAttempt((value) => value + 1);
  }, [repository]);

  useEffect(() => {
    if (!enabled || !repository) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    async function check() {
      try {
        const response = await fetch(workflowEndpoint(repository!), {
          signal: controller.signal,
          credentials: "omit",
          cache: "no-store",
          headers: { Accept: "application/vnd.github+json" },
        });
        if (!response.ok) throw new Error("Workflow status unavailable");
        const run = latestWorkflowRun(await response.json(), repository!);
        if (!disposed)
          setSnapshot({
            repository,
            status: {
              state: "verified",
              run,
              checkedAt: new Date().toISOString(),
            },
          });
      } catch {
        if (!disposed)
          setSnapshot({ repository, status: { state: "unavailable" } });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    let disposed = false;
    void check();
    return () => {
      disposed = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [repository, enabled, attempt]);

  useEffect(() => {
    if (!enabled || !repository) return;
    // Public GitHub reads are unauthenticated; keep background polling at 12 requests/hour or fewer.
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 300_000);
    return () => window.clearInterval(timer);
  }, [enabled, repository, refresh]);

  const status: WorkflowStatus =
    snapshot.repository === repository
      ? snapshot.status
      : { state: "checking" };
  return { status, refresh };
}
