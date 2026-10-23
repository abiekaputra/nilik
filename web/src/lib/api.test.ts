/** Module responsible for verifying browser API request behavior. */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSamples, inspectSample } from "./api";
import type { DemoSample } from "./types";

afterEach(() => vi.unstubAllGlobals());

describe("inspection API client", () => {
  it("returns demo samples from a successful response", async () => {
    const payload = [
      { name: "NLK-1", label: "Reference", expected: "PASS", pixels: [[0.5]] },
    ];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => payload }),
    );
    await expect(fetchSamples()).resolves.toEqual(payload);
  });

  it("sends the selected surface to the inspection endpoint", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) });
    vi.stubGlobal("fetch", fetchMock);
    const sample: DemoSample = {
      name: "sample.png",
      label: "Upload",
      expected: "ANOMALY",
      pixels: [[0.4]],
    };
    await inspectSample(sample);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      sample_name: "sample.png",
      pixels: [[0.4]],
    });
  });

  it("surfaces validation details from a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: "Invalid image" }),
      }),
    );
    await expect(fetchSamples()).rejects.toThrow("Invalid image");
  });
});
