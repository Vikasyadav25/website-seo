import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, Link } from "react-router-dom";
import {
  ArrowUpRight,
  BellDot,
  ChevronDown,
  Gem,
  Menu,
  RefreshCw,
  ShieldCheck,
  X,
  CircleAlert,
} from "lucide-react";
import { navigation } from "./navigation";
import type { PublicReport } from "../types";
import { loadReport } from "../lib/dataClient";
import { dateTime, isStale } from "../lib/format";
import { Overview } from "../pages/Overview";
import {
  Keywords,
  Products,
  Recommendations,
  Technical,
} from "../pages/Audits";
import {
  Competitors,
  GEO,
  Publishing,
  Reports,
  SearchPerformance,
  Settings,
} from "../pages/Operations";
import { GitHubLink } from "../components/GitHubLink";
import { EmptyState } from "../components/EmptyState";

const descriptions: Record<string, string> = {
  "/": "A thoughtful overview of your organic growth.",
  "/search": "Search visibility, with the right privacy boundaries.",
  "/keywords": "Connect clear search intent with useful landing pages.",
  "/products": "Help every product tell its story clearly.",
  "/technical": "Find the issues that stand between your pages and discovery.",
  "/geo": "Be useful, factual, and ready to be understood.",
  "/competitors": "Learn from public evidence, with context.",
  "/recommendations": "Evidence-led improvements, ready for your review.",
  "/approvals": "Review the exact change before anything is published.",
  "/publishing": "A clear record of controlled changes.",
  "/reports": "Your audit history and next considered steps.",
  "/settings": "Connections, configuration, and safety controls.",
};
export function App() {
  const [report, setReport] = useState<PublicReport | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [menu, setMenu] = useState(false);
  const [days, setDays] = useState(() => {
    try {
      const value = Number(localStorage.getItem("ratniva-date-window"));
      return [7, 28, 90].includes(value) ? value : 28;
    } catch {
      return 28;
    }
  });
  const location = useLocation();
  useEffect(() => {
    const controller = new AbortController();
    loadReport(controller.signal)
      .then((data) => {
        setReport(data);
        setError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    document.title = `${navigation.find((n) => n.path === location.pathname)?.label || "Page not found"} · Ratniva Growth OS`;
  }, [location.pathname]);
  const current = navigation.find((n) => n.path === location.pathname);
  const state = error
    ? "ERROR"
    : !report
      ? "LOADING"
      : report.mode === "demo"
        ? "DEMO"
        : isStale(report.generatedAt)
          ? "STALE"
          : report.sourceHealth.some((s) => s.status === "failed")
            ? "ERROR"
            : report.sourceHealth.some((s) => s.status === "connected")
              ? "CONNECTED"
              : "NOT CONFIGURED";
  const failedSources =
    report?.sourceHealth.filter(
      (s) => s.status === "failed" || s.status === "stale",
    ) || [];
  function changeDays(value: string) {
    const next = Number(value);
    setDays(next);
    try {
      localStorage.setItem("ratniva-date-window", value);
    } catch {
      /* Preferences are optional. */
    }
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menu && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={`sidebar ${menu ? "sidebar-open" : ""}`}>
        <Link to="/" className="brand" onClick={() => setMenu(false)}>
          <Gem size={30} strokeWidth={1} />
          <div>
            <strong>RATNIVA</strong>
            <span>GROWTH OS</span>
          </div>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <nav aria-label="Main navigation">
          {["Workspace", "Actions", "Manage"].map((group) => (
            <div className="nav-group" key={group}>
              <p>{group}</p>
              {navigation
                .filter((n) => n.group === group)
                .map((item) => (
                  <NavLink
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? "active" : ""}`
                    }
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenu(false)}
                  >
                    <item.icon size={18} strokeWidth={1.6} />
                    <span>{item.label}</span>
                    {item.path === "/approvals" &&
                      !!report?.recommendations.filter(
                        (p) => p.status === "needs_review",
                      ).length && (
                        <span className="nav-count">
                          {
                            report.recommendations.filter(
                              (p) => p.status === "needs_review",
                            ).length
                          }
                        </span>
                      )}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={18} />
          <div>
            <strong>Considered growth.</strong>
            <span>Human reviewed. Always.</span>
          </div>
        </div>
        <div className="workspace-owner">
          <span>R</span>
          <div>
            <strong>Ratniva workspace</strong>
            <small>925 silver jewellery</small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(true)}
            >
              <Menu size={20} />
            </button>
            <span className="desktop-only">Workspace</span>
            <span className="muted desktop-only">/</span>
            <strong>{current?.label || "Page not found"}</strong>
          </div>
          <div className="topbar-right">
            <span className="site-indicator">
              <i />
              ratniva.com
            </span>
            <span className="top-divider" />
            <Link
              className="icon-button"
              to="/approvals"
              aria-label="View pending approvals"
            >
              <BellDot size={19} />
            </Link>
            <span className="avatar" aria-label="Ratniva workspace">
              R
            </span>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">RATNIVA INTELLIGENCE</span>
              <h1>{current?.label || "Page not found"}</h1>
              <p>{descriptions[location.pathname]}</p>
            </div>
            <div className="heading-controls">
              <label className="date-control">
                <span className="sr-only">Reporting window</span>
                <select
                  aria-label="Reporting window"
                  value={days}
                  onChange={(e) => changeDays(e.target.value)}
                >
                  <option value="7">Last 7 days</option>
                  <option value="28">Last 28 days</option>
                  <option value="90">Last 90 days</option>
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>
              <GitHubLink repository={report?.repositoryUrl || null}>
                View GitHub Actions
              </GitHubLink>
            </div>
          </div>
          <div
            className={`environment-banner environment-${state.toLowerCase().replaceAll(" ", "-")}`}
            role="status"
          >
            <div>
              <span className="environment-tag">{state}</span>
              <span>
                {report?.mode === "demo"
                  ? "You’re exploring synthetic example data. No live analytics or store connections."
                  : state === "STALE"
                    ? "This report is over 48 hours old. Run a fresh audit before making decisions."
                    : state === "NOT CONFIGURED"
                      ? "No live sources connected. Follow the setup guide to configure read-only collectors."
                      : error
                        ? "Report unavailable. No data has been assumed."
                        : "Public-safe audit workspace. Private analytics stay in authenticated artifacts."}
              </span>
            </div>
            <span className="small">
              {report
                ? `Report: ${dateTime(report.generatedAt)}`
                : "Loading report…"}
            </span>
          </div>
          {failedSources.length > 0 && (
            <div className="notice" role="status">
              <CircleAlert size={18} />
              Partial data:{" "}
              {failedSources.map((s) => `${s.name} (${s.status})`).join(", ")}.
              Missing values are not treated as zero.
            </div>
          )}
          {error ? (
            <section className="panel" role="alert">
              <EmptyState title="We couldn’t load a safe report">
                Check that data/report.json exists and passes validation, then
                try again.
              </EmptyState>
              <button
                className="button"
                onClick={() => {
                  setError(false);
                  setAttempt((a) => a + 1);
                }}
              >
                <RefreshCw size={16} />
                Retry
              </button>
            </section>
          ) : !report ? (
            <div
              className="skeleton-grid"
              aria-label="Loading dashboard"
              aria-busy="true"
            >
              {[1, 2, 3, 4].map((n) => (
                <div className="skeleton" key={n} />
              ))}
            </div>
          ) : (
            <Routes>
              <Route
                path="/"
                element={<Overview report={report} days={days} />}
              />
              <Route
                path="/search"
                element={<SearchPerformance report={report} />}
              />
              <Route path="/keywords" element={<Keywords report={report} />} />
              <Route
                path="/products"
                element={<Products report={report} days={days} />}
              />
              <Route
                path="/technical"
                element={<Technical report={report} days={days} />}
              />
              <Route path="/geo" element={<GEO report={report} />} />
              <Route
                path="/competitors"
                element={<Competitors report={report} />}
              />
              <Route
                path="/recommendations"
                element={<Recommendations report={report} days={days} />}
              />
              <Route
                path="/approvals"
                element={
                  <Recommendations report={report} days={days} approvals />
                }
              />
              <Route
                path="/publishing"
                element={<Publishing report={report} />}
              />
              <Route
                path="/reports"
                element={<Reports report={report} days={days} />}
              />
              <Route path="/settings" element={<Settings report={report} />} />
              <Route
                path="*"
                element={
                  <EmptyState title="Page not found">
                    <Link to="/">Return to overview</Link>
                  </EmptyState>
                }
              />
            </Routes>
          )}
          <footer className="page-footer">
            <span>
              <Gem size={14} />
              Ratniva Growth OS{" "}
              <span className="muted">· Built for thoughtful growth</span>
            </span>
            <Link to="/settings">
              Read-only dashboard <ArrowUpRight size={13} />
            </Link>
          </footer>
        </main>
      </div>
    </div>
  );
}
