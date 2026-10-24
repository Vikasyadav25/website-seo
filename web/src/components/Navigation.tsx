import { NavLink, useLocation } from "react-router-dom";
import { navigation } from "../app/navigation";
import type { PublicReport } from "../types";

const primaryPaths = new Set(["/", "/settings"]);
const agentPaths = new Set([
  "/keywords",
  "/content",
  "/aeo",
  "/geo",
  "/tracker",
]);

export function Navigation({
  report,
  onNavigate,
}: {
  report: PublicReport | null;
  onNavigate: () => void;
}) {
  const location = useLocation();
  const pending = report?.recommendations.filter(
    (proposal) => proposal.status === "needs_review",
  ).length;
  const itemLink = (item: (typeof navigation)[number]) => (
    <NavLink
      end={item.path === "/"}
      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
      key={item.path}
      to={item.path}
      onClick={onNavigate}
    >
      <item.icon size={18} strokeWidth={1.6} />
      <span>{item.label}</span>
      {item.path === "/approvals" && !!pending && (
        <span className="nav-count">{pending}</span>
      )}
    </NavLink>
  );
  return (
    <nav aria-label="Main navigation">
      <div className="nav-group">
        <p>Workspace</p>
        {navigation.filter((item) => primaryPaths.has(item.path)).map(itemLink)}
      </div>
      <div className="nav-group">
        <p>Agents</p>
        {navigation.filter((item) => agentPaths.has(item.path)).map(itemLink)}
      </div>
      <details
        className="nav-more"
        open={
          (!primaryPaths.has(location.pathname) &&
            !agentPaths.has(location.pathname)) ||
          undefined
        }
      >
        <summary>More tools</summary>
        {navigation
          .filter(
            (item) =>
              !primaryPaths.has(item.path) && !agentPaths.has(item.path),
          )
          .map(itemLink)}
      </details>
    </nav>
  );
}
