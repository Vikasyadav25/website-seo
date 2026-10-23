import { humanize } from "../lib/format";
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge badge-${status}`}>
      <span aria-hidden="true" className="status-dot" />
      {humanize(status)}
    </span>
  );
}
