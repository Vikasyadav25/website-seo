import { useState } from "react";
import type { PublicReport } from "../types";
import { contentWorkflow, articleMarkdown } from "../lib/contentWorkflow";
import { dateTime } from "../lib/format";
import { download } from "../lib/export";
import { StatusBadge } from "../components/StatusBadge";

export function ContentAgent({ report }: { report: PublicReport }) {
  const workflow = contentWorkflow(report);
  const [topic, setTopic] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(
        `Prepare a sourced Ratniva content review bundle for: ${topic.trim()}. Research primary sources and public competitors, propose editorial keywords without invented metrics, write an original article with FAQs, create two labelled illustrations, and save a draft for human review. Do not publish or invent product claims.`,
      );
      setCopyStatus(
        "Instructions copied. Paste them into your assistant to start the next assisted run.",
      );
    } catch {
      setCopyStatus(
        "Clipboard unavailable. Copy the topic and request an assisted research and draft run.",
      );
    }
  }
  return (
    <>
      <div className="notice">
        Assisted content run · Prepared {dateTime(workflow.preparedAt)} · Human
        review required · Not published to Shopify.
      </div>
      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Current topic</span>
            <h2>{workflow.topic}</h2>
          </div>
          <StatusBadge status={workflow.status} />
        </div>
        <ol className="content-stages">
          {workflow.stages.map((stage) => (
            <li key={stage.id}>
              <div>
                <strong>{stage.label}</strong>
                <StatusBadge status={stage.status} />
              </div>
              <p>{stage.evidence}</p>
            </li>
          ))}
        </ol>
        <div className="toolbar">
          <button
            className="button"
            onClick={() =>
              download(
                `${workflow.draft.slug}.md`,
                articleMarkdown(workflow),
                "text/markdown;charset=utf-8",
              )
            }
          >
            Download article draft
          </button>
          <button
            className="button"
            onClick={() =>
              download(`${workflow.id}.json`, JSON.stringify(workflow, null, 2))
            }
          >
            Download review bundle
          </button>
          <button
            className="button"
            disabled
            title="Blog publication is not implemented in the guarded product SEO publisher."
          >
            Store publication unavailable
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Research and competitor evidence</h2>
        <ul className="research-sources">
          {workflow.sources.map((source) => (
            <li key={source.url}>
              <a
                className="text-link"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.label}
              </a>
              <p>{source.note}</p>
            </li>
          ))}
        </ul>
        <p className="small muted">
          Keyword brief: {workflow.keywords.join(" · ")}. These are editorial
          ideas, not measured demand.
        </p>
      </section>
      <section className="panel content-draft">
        <span className="eyebrow">Article draft · Needs merchant review</span>
        <h2>{workflow.draft.title}</h2>
        <details>
          <summary>Search metadata</summary>
          <dl className="config-list">
            <div>
              <dt>Meta title</dt>
              <dd>{workflow.draft.metaTitle}</dd>
            </div>
            <div>
              <dt>Meta description</dt>
              <dd>{workflow.draft.metaDescription}</dd>
            </div>
            <div>
              <dt>Proposed slug</dt>
              <dd>{workflow.draft.slug}</dd>
            </div>
          </dl>
        </details>
        {workflow.draft.sections.map((section) => (
          <section key={section.heading}>
            <h3>{section.heading}</h3>
            <p>{section.text}</p>
          </section>
        ))}
        <h3>Frequently asked questions</h3>
        {workflow.draft.faqs.map((faq) => (
          <section key={faq.question}>
            <h4>{faq.question}</h4>
            <p>{faq.answer}</p>
          </section>
        ))}
      </section>
      <section className="panel">
        <h2>Generated editorial illustrations</h2>
        <p className="small muted">
          Illustrative visuals only. These are not verified Ratniva product
          photographs.
        </p>
        <div className="content-images">
          {workflow.images.map((image) => (
            <figure key={image.src}>
              <img
                src={`${import.meta.env.BASE_URL}${image.src}`}
                alt={image.alt}
                loading="lazy"
                decoding="async"
                width="1536"
                height="1024"
              />
              <figcaption>
                {image.caption}
                <br />
                Alt: {image.alt}
              </figcaption>
              <a
                className="text-link"
                href={`${import.meta.env.BASE_URL}${image.src}`}
                download
              >
                Download illustration
              </a>
            </figure>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Prepare another topic</h2>
        <p>
          Research, drafting and image creation currently run with your
          assistant. This form prepares instructions; it does not launch a
          background job.
        </p>
        <label className="content-topic">
          Topic
          <input
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setCopyStatus("");
            }}
            maxLength={200}
            placeholder="For example: how to choose a silver ring"
          />
        </label>
        <button
          className="button"
          disabled={!topic.trim()}
          onClick={() => void copyBrief()}
        >
          Copy next-run instructions
        </button>
        <p role="status" className="small muted">
          {copyStatus}
        </p>
      </section>
    </>
  );
}
