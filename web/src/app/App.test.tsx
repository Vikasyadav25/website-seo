import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../../../examples/demo-report.json";
import disconnected from "../../../examples/disconnected-report.json";
import { App } from "./App";
import { connectedReport } from "../test/connectedReport";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => fixture }),
  );
});
function mount(route = "/") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <App />
    </MemoryRouter>,
  );
}
describe("dashboard states", () => {
  it("shows measured production activity, findings and partial coverage", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => connectedReport(),
    } as Response);
    mount();
    expect(await screen.findByText("Last published audit")).toBeInTheDocument();
    expect(
      screen.getByText("PARTIAL", { selector: ".environment-tag" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Pages checked")).toBeInTheDocument();
    expect(screen.getByText("Technical findings")).toBeInTheDocument();
    expect(
      screen.queryByText("First measured baseline recorded"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View published audit proof" }),
    ).toHaveAttribute("href", expect.stringContaining("/actions/runs/123"));
    expect(
      screen.queryByText("No public metrics published"),
    ).not.toBeInTheDocument();
  });
  it("reloads reports using only public report and GitHub status requests", async () => {
    mount();
    await screen.findByText("Last audit measurements");
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => connectedReport(),
    } as Response);
    fireEvent.click(
      screen.getByRole("button", { name: "Refresh published report" }),
    );
    expect(await screen.findByText("Last published audit")).toBeInTheDocument();
    expect(
      vi
        .mocked(fetch)
        .mock.calls.every(
          ([url, options]) =>
            (String(url).endsWith("data/report.json") ||
              String(url).startsWith(
                "https://api.github.com/repos/Vikasyadav25/website-seo/actions/workflows/daily-audit.yml/runs?",
              )) &&
            !new Headers(options?.headers).has("Authorization"),
        ),
    ).toBe(true);
  });
  it("labels stale production data explicitly", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...disconnected,
        mode: "connected",
        generatedAt: "2020-01-01T00:00:00Z",
      }),
    } as Response);
    mount();
    expect(
      await screen.findByText("STALE", { selector: ".environment-tag" }),
    ).toBeInTheDocument();
  });
  it("offers retry after a failed network response", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    mount();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => fixture,
    } as Response);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByText("Last audit measurements"),
    ).toBeInTheDocument();
  });
  it("shows demo provenance and functional date window", async () => {
    mount();
    expect(
      await screen.findByText("Last audit measurements"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("DEMO", { selector: ".environment-tag" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Reporting window"), {
      target: { value: "7" },
    });
    expect(localStorage.getItem("ratniva-date-window")).toBe("7");
  });
  it("shows a safe retry state for invalid data", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ...fixture, orders: [] }),
    } as Response);
    mount();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t load a safe report",
    );
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  });
  it("does not turn disconnected metrics into zero", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ ...disconnected, mode: "connected" }),
    } as Response);
    mount();
    expect(
      await screen.findByText("No public metrics published"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("NOT CONFIGURED", { selector: ".environment-tag" }),
    ).toBeInTheDocument();
  });
  it("filters audit issues", async () => {
    mount("/technical");
    await screen.findByText("Audit findings");
    fireEvent.change(screen.getByLabelText("Search issues"), {
      target: { value: "missing-meta" },
    });
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(2));
  });
  it("keeps search analytics private", async () => {
    mount("/search");
    expect(
      await screen.findByText("Private analytics stay private."),
    ).toBeInTheDocument();
  });
  it("renders partial failures without false success", async () => {
    const data = structuredClone(fixture);
    data.sourceHealth[0].status = "failed";
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => data,
    } as Response);
    mount("/settings");
    expect(await screen.findByText(/Partial data:/)).toHaveTextContent(
      "gsc (failed)",
    );
  });
});
