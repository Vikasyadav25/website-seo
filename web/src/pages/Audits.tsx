import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Gem,
  Search,
  ExternalLink,
  CircleCheck,
  CircleDashed,
  Download,
} from "lucide-react";
import type { Issue, Product, PublicReport, Recommendation } from "../types";
import { EmptyState } from "../components/EmptyState";
import { Drawer } from "../components/Drawer";
import { StatusBadge } from "../components/StatusBadge";
import { DiffPreview } from "../components/DiffPreview";
import { ProposalDetail } from "../components/ProposalDetail";
import { dateTime, humanize, inWindow, pathLabel } from "../lib/format";
import { download, makeCsv } from "../lib/export";

function SearchInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="search-field">
      <Search size={17} />
      <input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function Technical({
  report,
  days,
}: {
  report: PublicReport;
  days: number;
}) {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("category") || "");
  const [severity, setSeverity] = useState("all");
  const [sort, setSort] = useState("severity");
  const [selected, setSelected] = useState<Issue | null>(null);
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  const rows = report.issues
    .filter(
      (i) =>
        inWindow(i.lastVerifiedAt, days, report.generatedAt) &&
        (severity === "all" || i.severity === severity) &&
        `${i.category} ${i.targetUrl} ${i.recommendation}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "severity"
        ? order[a.severity] - order[b.severity]
        : a.category.localeCompare(b.category),
    );
  return (
    <>
      <div className="notice">
        Checks require verification of intent. HTML signals do not establish
        Google indexing. PageSpeed lab tests and field Core Web Vitals are
        different measurements.
      </div>
      <div className="toolbar">
        <SearchInput
          label="Search issues"
          value={search}
          onChange={setSearch}
        />
        <select
          aria-label="Filter severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          {["all", "critical", "high", "medium", "low"].map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All severities" : humanize(s)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort issues"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="severity">Severity first</option>
          <option value="category">Category A–Z</option>
        </select>
        <button
          className="button"
          disabled={!rows.length}
          onClick={() =>
            download(
              "ratniva-public-issues.csv",
              makeCsv(
                rows.map((i) => ({
                  category: i.category,
                  severity: i.severity,
                  url: i.targetUrl,
                  action: i.recommendation,
                })),
              ),
              "text/csv;charset=utf-8",
            )
          }
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Audit findings</h2>
          <span className="muted small">
            {rows.length} findings ·{" "}
            {report.mode === "demo" ? "DEMO" : "Audit worker"}
          </span>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Severity</th>
                  <th>Affected page</th>
                  <th>Last verified</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{humanize(i.category)}</strong>
                    </td>
                    <td>
                      <StatusBadge status={i.severity} />
                    </td>
                    <td className="url-cell">{pathLabel(i.targetUrl)}</td>
                    <td>{dateTime(i.lastVerifiedAt)}</td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelected(i)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
      {selected && (
        <Drawer
          title={humanize(selected.category)}
          onClose={() => setSelected(null)}
        >
          <StatusBadge status={selected.severity} />
          <h3>Evidence</h3>
          <p>{selected.evidence}</p>
          <h3>Suggested action</h3>
          <p>{selected.recommendation}</p>
          <p className="muted small">
            Source: {selected.source} · Verified{" "}
            {dateTime(selected.lastVerifiedAt)}
          </p>
          <a
            href={selected.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Inspect public URL ↗
          </a>
        </Drawer>
      )}
    </>
  );
}
export function Products({
  report,
  days,
}: {
  report: PublicReport;
  days: number;
}) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [selected, setSelected] = useState<Product | null>(null);
  const rows = report.productAuditSummaries
    .filter(
      (p) =>
        inWindow(p.lastAudit, days, report.generatedAt) &&
        (kind === "all" || p.productType === kind) &&
        p.title.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => a.score - b.score);
  const proposal = report.recommendations.find(
    (p) => p.targetUrl === selected?.url,
  );
  return (
    <>
      <div className="toolbar">
        <SearchInput
          label="Search products"
          value={search}
          onChange={setSearch}
        />
        <select
          aria-label="Product type"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="all">All product types</option>
          {[
            ...new Set(report.productAuditSummaries.map((p) => p.productType)),
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <span className="muted small">Lowest audit score first</span>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Product catalogue</h2>
          <span className="muted small">
            {rows.length} products ·{" "}
            {report.mode === "demo" ? "DEMO" : "Shopify audit"}
          </span>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>SEO score</th>
                  <th>Issues</th>
                  <th>Review state</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <span className="product-placeholder">
                          <Gem size={25} strokeWidth={1} />
                        </span>
                        <div>
                          <strong>{p.title}</strong>
                          <small>{p.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{p.productType}</td>
                    <td>
                      <span className="score">
                        {p.score}
                        <small>/100</small>
                      </span>
                    </td>
                    <td>{p.issues.length}</td>
                    <td>
                      <StatusBadge status={p.reviewState} />
                    </td>
                    <td>
                      <button
                        className="text-link"
                        onClick={() => setSelected(p)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
      {selected && (
        <Drawer title={selected.title} onClose={() => setSelected(null)}>
          <p className="muted">
            {report.mode === "demo" ? "DEMO fixture" : "Shopify audit"} ·{" "}
            {dateTime(selected.lastAudit)}
          </p>
          <a href={selected.url} target="_blank" rel="noopener noreferrer">
            View public product ↗
          </a>
          <h3>Product facts</h3>
          <ul className="fact-list">
            {selected.facts.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <h3>On-page checklist</h3>
          <ul className="checklist">
            {selected.checklist.map((c) => (
              <li key={c.label}>
                {c.passed ? (
                  <CircleCheck size={17} />
                ) : (
                  <CircleDashed size={17} />
                )}
                {c.label}
                <span className="sr-only">
                  {c.passed ? "Pass" : "Needs review"}
                </span>
              </li>
            ))}
          </ul>
          {proposal ? (
            <>
              <h3>Suggested change</h3>
              <p>{proposal.reason}</p>
              <DiffPreview proposal={proposal} />
              <p className="notice">
                Draft only. Verify product facts and approve the exact change in
                GitHub before publication.
              </p>
            </>
          ) : (
            <EmptyState title="No proposal for this product" />
          )}
        </Drawer>
      )}
    </>
  );
}
export function Recommendations({
  report,
  days,
  approvals = false,
}: {
  report: PublicReport;
  days: number;
  approvals?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("priority");
  const selected = report.recommendations.find(
    (p) => p.id === params.get("proposal"),
  );
  const rows = report.recommendations
    .filter(
      (p) =>
        inWindow(p.createdAt, days, report.generatedAt) &&
        (!approvals || ["needs_review", "approved"].includes(p.status)) &&
        (status === "all" || p.status === status) &&
        `${p.id} ${p.reason} ${p.targetUrl}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "risk"
        ? a.risk - b.risk
        : (b.impact * b.confidence) / b.effort -
          (a.impact * a.confidence) / a.effort,
    );
  function open(p: Recommendation) {
    setParams({ proposal: p.id });
  }
  return (
    <>
      <div className="notice">
        Publishing requires repository maintainer approval via GitHub.{" "}
        {report.mode === "demo" &&
          "DEMO drafts cannot be approved or published."}
      </div>
      <div className="toolbar">
        <SearchInput
          label="Search proposals"
          value={search}
          onChange={setSearch}
        />
        <select
          aria-label="Proposal status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All review states</option>
          {[
            "draft",
            "needs_review",
            "approved",
            "rejected",
            "applied",
            "failed",
            "rolled_back",
          ].map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <select
          aria-label="Sort proposals"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="priority">Impact × confidence / effort</option>
          <option value="risk">Lowest risk first</option>
        </select>
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>{approvals ? "Review queue" : "Prioritised opportunities"}</h2>
          <span className="muted small">
            {rows.length} proposals ·{" "}
            {report.mode === "demo" ? "DEMO" : "Rules engine"}
          </span>
        </div>
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Proposal</th>
                  <th>Target</th>
                  <th>Risk</th>
                  <th>Status</th>
                  <th>Change</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.reason}</strong>
                      <small>{p.id}</small>
                    </td>
                    <td>{p.targetKind}</td>
                    <td>{p.risk}/5</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <button className="text-link" onClick={() => open(p)}>
                        Preview diff
                      </button>
                    </td>
                    <td>
                      {report.mode !== "demo" && p.prUrl ? (
                        <a
                          className="text-link"
                          href={p.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Review on GitHub <ExternalLink size={13} />
                        </a>
                      ) : (
                        <button
                          className="text-link"
                          disabled
                          title="No live review PR. Configure the repository and proposal workflow first."
                        >
                          Review on GitHub
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
      {selected && (
        <ProposalDetail
          proposal={selected}
          demo={report.mode === "demo"}
          onClose={() => setParams({})}
        />
      )}
    </>
  );
}
export function Keywords({ report }: { report: PublicReport }) {
  const [search, setSearch] = useState("");
  const [intent, setIntent] = useState("all");
  const [sort, setSort] = useState("asc");
  const rows = report.keywordClusters
    .filter(
      (k) =>
        (intent === "all" || intent === k.intent) &&
        k.keyword.includes(search.toLowerCase()),
    )
    .sort(
      (a, b) => (sort === "asc" ? 1 : -1) * a.keyword.localeCompare(b.keyword),
    );
  return (
    <>
      <div className="notice">
        Seed clusters are research hypotheses. Live rankings, impressions, and
        raw query analytics are private and are not available in this public
        report.
      </div>
      <div className="toolbar">
        <SearchInput
          label="Search keyword clusters"
          value={search}
          onChange={setSearch}
        />
        <select
          aria-label="Keyword intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        >
          <option value="all">All intents</option>
          <option>Commercial</option>
          <option>Informational</option>
        </select>
        <select
          aria-label="Sort keywords"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="asc">Keyword A–Z</option>
          <option value="desc">Keyword Z–A</option>
        </select>
      </div>
      <section className="panel">
        {rows.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Keyword cluster</th>
                  <th>Intent</th>
                  <th>Brand</th>
                  <th>Landing page</th>
                  <th>Next step</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <tr key={k.keyword}>
                    <td>
                      <strong>{k.keyword}</strong>
                    </td>
                    <td>{k.intent}</td>
                    <td>{k.branded ? "Branded" : "Non-branded"}</td>
                    <td className="url-cell">{pathLabel(k.landingPage)}</td>
                    <td>{k.nextStep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </>
  );
}
