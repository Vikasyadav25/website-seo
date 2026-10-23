import { SearchCheck } from "lucide-react";
export function EmptyState({
  title = "Nothing to show yet",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <SearchCheck size={30} aria-hidden="true" />
      <h3>{title}</h3>
      <p>
        {children ||
          "Try another filter or run an audit to collect verified evidence."}
      </p>
    </div>
  );
}
