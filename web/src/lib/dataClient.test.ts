import { describe, it, expect } from "vitest";
import fixture from "../../../examples/demo-report.json";
import { assertPublicReport } from "./dataClient";
import { csvCell, makeCsv } from "./export";
import { inWindow, isStale } from "./format";
describe("public report boundary", () => {
  it("accepts the demo contract", () =>
    expect(() => assertPublicReport(fixture)).not.toThrow());
  it.each(["orders", "queries", "targetGid", "revenue"])(
    "rejects unexpected %s",
    (key) => {
      expect(() => assertPublicReport({ ...fixture, [key]: [] })).toThrow();
    },
  );
  it.each([
    "person@example.com",
    "shpat_" + "x".repeat(32),
    "+91 98765 43210",
    "https://ratniva.com/?token=secret",
    "https://evil.example",
  ])("blocks sensitive text", (text) => {
    const data = structuredClone(fixture);
    data.issues[0].evidence = text;
    expect(() => assertPublicReport(data)).toThrow();
  });
  it("rejects nested private fields", () => {
    const data = structuredClone(fixture);
    Object.assign(data.productAuditSummaries[0], {
      sourceFacts: { private: true },
    });
    expect(() => assertPublicReport(data)).toThrow();
  });
});
describe("safe exports and dates", () => {
  it.each([
    '=HYPERLINK("bad")',
    "+SUM(1,2)",
    "@SUM(1,2)",
    "-cmd",
    "  =bad",
    "\tbad",
  ])("neutralises spreadsheet formulas: %s", (text) =>
    expect(csvCell(text)).toMatch(/^"'/),
  );
  it("escapes quotes and preserves newlines", () =>
    expect(makeCsv([{ name: 'a,"b"\nc' }])).toBe('"name"\r\n"a,""b""\nc"'));
  it("filters completed windows relative to the report", () => {
    expect(inWindow("2026-10-22", 7, "2026-10-23")).toBe(true);
    expect(inWindow("2026-10-01", 7, "2026-10-23")).toBe(false);
    expect(inWindow("2026-10-24", 7, "2026-10-23")).toBe(false);
  });
  it("reports stale data after 48 hours", () =>
    expect(isStale("2026-10-20", Date.parse("2026-10-23"))).toBe(true));
});
