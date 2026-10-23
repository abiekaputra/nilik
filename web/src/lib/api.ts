/** Module responsible for communicating with the local Nilik API. */

import type { DemoSample, HistoryItem, InspectionResult } from "./types";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4600";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(
      payload?.detail ?? `Request failed with status ${response.status}`,
    );
  }
  return response.json() as Promise<T>;
}

export function fetchSamples(): Promise<DemoSample[]> {
  return request("/api/samples");
}

export function fetchHistory(): Promise<HistoryItem[]> {
  return request("/api/inspections?limit=8");
}

export function inspectSample(sample: DemoSample): Promise<InspectionResult> {
  return request("/api/inspections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sample_name: sample.name, pixels: sample.pixels }),
  });
}
