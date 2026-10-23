import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import fixture from "../../../examples/demo-report.json";
import disconnected from "../../../examples/disconnected-report.json";
import { App } from "./App";

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
    expect(await screen.findByText("At a glance")).toBeInTheDocument();
  });
  it("shows demo provenance and functional date window", async () => {
    mount();
    expect(await screen.findByText("At a glance")).toBeInTheDocument();
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
