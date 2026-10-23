import type { Recommendation } from "../types";
export function DiffPreview({ proposal }: { proposal: Recommendation }) {
  return (
    <div className="diff-list">
      {proposal.fieldChanges.map((change) => (
        <section key={change.field}>
          <h3>{change.field}</h3>
          <div className="diff-grid">
            <div className="diff-before">
              <span className="eyebrow">Before</span>
              <p>{change.before ?? "Not set"}</p>
            </div>
            <div className="diff-after">
              <span className="eyebrow">Proposed</span>
              <p>{change.after ?? "Not set"}</p>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
