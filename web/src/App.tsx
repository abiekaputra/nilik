/** Module responsible for orchestrating the operator inspection workflow. */

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { DecisionBadge } from "./components/DecisionBadge";
import { HistoryTable } from "./components/HistoryTable";
import { SurfaceCanvas } from "./components/SurfaceCanvas";
import { fetchHistory, fetchSamples, inspectSample } from "./lib/api";
import { fileToSample } from "./lib/image";
import type { DemoSample, HistoryItem, InspectionResult } from "./lib/types";

export function App() {
  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [selected, setSelected] = useState<DemoSample>();
  const [result, setResult] = useState<InspectionResult>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState(
    "Connecting to the local inspection service…",
  );
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.all([fetchSamples(), fetchHistory()])
      .then(([available, records]) => {
        setSamples(available);
        setSelected(available[0]);
        setHistory(records);
        setStatus("Ready for inspection");
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  async function runInspection() {
    if (!selected) return;
    setBusy(true);
    setStatus(`Inspecting ${selected.name}…`);
    try {
      const nextResult = await inspectSample(selected);
      setResult(nextResult);
      setHistory(await fetchHistory());
      setStatus(`${selected.name} recorded as ${nextResult.decision}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Inspection failed");
    } finally {
      setBusy(false);
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const sample = await fileToSample(file);
      setSelected(sample);
      setResult(undefined);
      setStatus("Uploaded image normalized to the 64 × 64 inspection profile");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Image could not be read",
      );
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Nilik home">
          <img src="/nilik-mark.png" alt="" />
          <span>
            <strong>Nilik</strong>
            <small>Visual quality station</small>
          </span>
        </a>
        <div className="service-status">
          <i /> Local workstation · v1.0
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <span className="eyebrow eyebrow--light">
              Computer vision for the factory floor
            </span>
            <h1>
              See the anomaly.
              <br />
              Keep the decision human.
            </h1>
            <p>
              Nilik turns a surface image into an explainable quality decision,
              highlights the evidence, and keeps every operator review
              traceable.
            </p>
          </div>
          <div className="hero-metrics">
            <div>
              <strong>64 × 64</strong>
              <span>reproducible profile</span>
            </div>
            <div>
              <strong>3</strong>
              <span>synthetic defect families</span>
            </div>
            <div>
              <strong>Local</strong>
              <span>images stay on device</span>
            </div>
          </div>
        </section>

        <div className="status-strip" role="status">
          <span>{status}</span>
          <small>Surface profile · calibrated reference set</small>
        </div>

        <section className="workspace-grid">
          <article className="panel sample-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">01 · Select</span>
                <h2>Inspection sample</h2>
              </div>
              <button
                className="button button--ghost"
                onClick={() => inputRef.current?.click()}
              >
                Upload image
              </button>
              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={upload}
              />
            </div>
            <div className="sample-stage">
              {selected ? (
                <SurfaceCanvas pixels={selected.pixels} />
              ) : (
                <div className="canvas-skeleton" />
              )}
              <div className="sample-copy">
                <span className="sample-id">
                  {selected?.name ?? "Loading samples"}
                </span>
                <strong>{selected?.label ?? "Waiting for API"}</strong>
                <p>
                  Images are normalized in the browser before local analysis.
                </p>
              </div>
            </div>
            <div className="sample-list" aria-label="Demo samples">
              {samples.map((sample) => (
                <button
                  className={
                    selected?.name === sample.name
                      ? "sample-chip sample-chip--active"
                      : "sample-chip"
                  }
                  key={sample.name}
                  onClick={() => {
                    setSelected(sample);
                    setResult(undefined);
                    setStatus(`${sample.name} selected`);
                  }}
                >
                  <SurfaceCanvas pixels={sample.pixels} />
                  <span>
                    {sample.label}
                    <small>{sample.expected}</small>
                  </span>
                </button>
              ))}
            </div>
            <button
              className="button button--primary"
              disabled={!selected || busy}
              onClick={() => void runInspection()}
            >
              {busy ? "Inspecting…" : "Run visual inspection"}
            </button>
          </article>

          <article className="panel result-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">02 · Decide</span>
                <h2>Evidence view</h2>
              </div>
              {result && <DecisionBadge decision={result.decision} />}
            </div>
            {result && selected ? (
              <>
                <div className="result-stage">
                  <SurfaceCanvas
                    pixels={selected.pixels}
                    heatmap={result.heatmap}
                    regions={result.regions}
                  />
                </div>
                <div className="score-row">
                  <div>
                    <span>Anomaly score</span>
                    <strong>{result.anomaly_score.toFixed(2)}×</strong>
                  </div>
                  <div>
                    <span>Review boundary</span>
                    <strong>{result.threshold.toFixed(2)}×</strong>
                  </div>
                  <div>
                    <span>Regions</span>
                    <strong>{result.regions.length}</strong>
                  </div>
                </div>
                <div className="explanation">
                  <span>Operator context</span>
                  <p>{result.explanation}</p>
                </div>
              </>
            ) : (
              <div className="result-empty">
                <img src="/nilik-mark.png" alt="" />
                <strong>Evidence appears here</strong>
                <p>
                  Choose a reference or anomaly sample, then run the inspection.
                </p>
              </div>
            )}
          </article>
        </section>

        <HistoryTable items={history} />
      </main>
      <footer>
        <span>Nilik · reproducible visual inspection</span>
        <span>Local portfolio release · no production accuracy claim</span>
      </footer>
    </div>
  );
}
