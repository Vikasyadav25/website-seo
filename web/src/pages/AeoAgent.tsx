import { Link } from "react-router-dom";
import type { PublicReport } from "../types";
import { dateTime, pathLabel } from "../lib/format";
import { EmptyState } from "../components/EmptyState";

export function AeoAgent({ report }: { report: PublicReport }) {
  const pages = report.pageChecks || [];
  return (
    <>
      <div className="notice">
        Read-only checks on fetched HTML. JSON-LD presence does not prove schema
        validity, Google eligibility, a featured snippet, or an AI citation.
      </div>
      <section className="panel">
        <div className="section-heading">
          <h2>Page-level answer readiness</h2>
          <span className="small muted">
            {pages.length
              ? `${pages.length} sampled pages`
              : "No measured page checks in this report"}
          </span>
        </div>
        {pages.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Title / description</th>
                  <th>JSON-LD</th>
                  <th>Question heading</th>
                  <th>About/contact link</th>
                  <th>Checked</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.url}>
                    <td>
                      <a
                        className="text-link"
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {pathLabel(page.url)}
                      </a>
                    </td>
                    <td>
                      {page.titlePresent ? "Title present" : "Title absent"}
                      <br />
                      {page.descriptionPresent
                        ? "Description present"
                        : "Description absent"}
                    </td>
                    <td>
                      {page.structuredDataPresent ? "Detected" : "Not detected"}
                    </td>
                    <td>
                      {page.helpfulQuestionsPresent
                        ? "Detected"
                        : "Not detected"}
                    </td>
                    <td>
                      {page.aboutOrContactLinkPresent
                        ? "Detected"
                        : "Not detected"}
                    </td>
                    <td>{dateTime(page.checkedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="A new audit is needed for this evidence">
            Run the updated production workflow. Older reports remain valid but
            do not contain these page-level checks.
          </EmptyState>
        )}
      </section>
      <section className="panel">
        <h2>Answer sections prepared for review</h2>
        <p>
          The silver-care draft includes concise answers to three reader
          questions. They have not been added to the storefront or measured in
          search results.
        </p>
        <Link className="text-link" to="/content">
          Inspect draft and FAQ answers
        </Link>
      </section>
    </>
  );
}
