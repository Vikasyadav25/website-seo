import type { Recommendation } from "../types";
import { Drawer } from "./Drawer";
import { DiffPreview } from "./DiffPreview";
import { StatusBadge } from "./StatusBadge";
import { dateTime } from "../lib/format";
export function ProposalDetail({
  proposal,
  demo,
  onClose,
}: {
  proposal: Recommendation;
  demo: boolean;
  onClose: () => void;
}) {
  return (
    <Drawer title={proposal.id} onClose={onClose}>
      <StatusBadge status={proposal.status} />
      <h3>{proposal.reason}</h3>
      <p className="muted">
        {dateTime(proposal.createdAt)} · Risk {proposal.risk}/5
      </p>
      <a href={proposal.targetUrl} target="_blank" rel="noopener noreferrer">
        View public page ↗
      </a>
      <DiffPreview proposal={proposal} />
      <h3>Verification plan</h3>
      <p>{proposal.testPlan}</p>
      <div className="notice">
        Publishing requires repository maintainer approval via GitHub.{" "}
        {demo && "This is a synthetic proposal; no Shopify change can be made."}
      </div>
      {!demo && proposal.prUrl ? (
        <a
          className="button primary"
          href={proposal.prUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Review on GitHub ↗
        </a>
      ) : (
        <button
          className="button"
          disabled
          title="No authenticated review PR is available for this proposal."
        >
          Review on GitHub
        </button>
      )}
    </Drawer>
  );
}
