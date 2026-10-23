/** Module responsible for defining the browser-side inspection contracts. */

export type Decision = "PASS" | "REVIEW" | "FAIL";

export interface DemoSample {
  name: string;
  label: string;
  expected: "PASS" | "ANOMALY";
  pixels: number[][];
}

export interface Region {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: number;
}

export interface InspectionResult {
  id: number;
  sample_name: string;
  decision: Decision;
  anomaly_score: number;
  threshold: number;
  regions: Region[];
  heatmap: number[][];
  explanation: string;
}

export interface HistoryItem {
  id: number;
  sample_name: string;
  decision: Decision;
  anomaly_score: number;
  region_count: number;
  created_at: string;
}
