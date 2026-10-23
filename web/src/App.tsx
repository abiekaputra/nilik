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
  const [status, setStatus] = useState("Connecting to inspection service");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void Promise.all([fetchSamples(), fetchHistory()])
      .then(([available, records]) => {
        setSamples(available);
        setSelected(available[0]);
        setHistory(records);
        setStatus("Station ready");
      })
      .catch((error: Error) => setStatus(error.message));
  }, []);

  async function runInspection() {
    if (!selected) return;
    setBusy(true);
    setStatus(`Scanning ${selected.name}`);
    try {
      const nextResult = await inspectSample(selected);
      setResult(nextResult);
      setHistory(await fetchHistory());
      setStatus(`${selected.name} · ${nextResult.decision}`);
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
      setStatus("Image normalized to active inspection profile");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Image could not be read",
      );
    } finally {
      event.target.value = "";
    }
  }

  function choose(sample: DemoSample) {
    setSelected(sample);
    setResult(undefined);
    setStatus(`${sample.name} loaded`);
  }

  return (
    <div className="station-shell">
      <aside className="rail">
        <a href="#station" className="rail-logo" aria-label="Nilik home">
          <img src="/nilik-mark.png" alt="" />
        </a>
        <nav aria-label="Station sections">
          <a className="rail-link rail-link--active" href="#station">
            <span>01</span>Inspect
          </a>
          <a className="rail-link" href="#records">
            <span>02</span>Records
          </a>
        </nav>
        <span className="rail-version">V1.0</span>
      </aside>

      <div className="station-body">
        <header className="station-header">
          <div className="wordmark">
            <strong>NILIK</strong>
            <span>VISUAL QUALITY SYSTEM</span>
          </div>
          <div className="station-state">
            <i />
            {status}
          </div>
          <div className="station-meta">
            <span>STATION</span>
            <strong>QA-01</strong>
          </div>
        </header>

        <main id="station">
          <section className="title-row">
            <div>
              <span className="overline">SURFACE CONTROL / LOCAL CELL</span>
              <h1>
                Inspection
                <br />
                workstation
              </h1>
            </div>
            <p>
              Calibrated anomaly triage with evidence that stays visible to the
              operator. The system recommends; the quality team decides.
            </p>
            <dl>
              <div>
                <dt>PROFILE</dt>
                <dd>64 × 64 / GRAYSCALE</dd>
              </div>
              <div>
                <dt>DATA MODE</dt>
                <dd>LOCAL / SYNTHETIC DEMO</dd>
              </div>
              <div>
                <dt>ENGINE</dt>
                <dd>SURFACE-V1</dd>
              </div>
            </dl>
          </section>

          <section className="inspection-deck">
            <div className="viewport-column">
              <div className="viewport-toolbar">
                <span>
                  <i /> INPUT FRAME
                </span>
                <span>{selected?.name ?? "AWAITING SAMPLE"}</span>
                <span>64 × 64 PX</span>
              </div>
              <div className="viewfinder">
                {selected ? (
                  <SurfaceCanvas
                    pixels={selected.pixels}
                    heatmap={result?.heatmap}
                    regions={result?.regions}
                  />
                ) : (
                  <div className="canvas-skeleton" />
                )}
                <span className="corner corner--tl" />
                <span className="corner corner--tr" />
                <span className="corner corner--bl" />
                <span className="corner corner--br" />
                <div className="scan-line" />
              </div>
              <div className="viewport-caption">
                <span>{result ? "ANALYSIS COMPLETE" : "RAW INPUT"}</span>
                <p>
                  {result?.explanation ??
                    "Select a sample and start inspection."}
                </p>
              </div>
            </div>

            <aside className="control-column">
              <div className="control-heading">
                <span>ACTIVE LOT</span>
                <strong>{selected?.label ?? "Loading"}</strong>
                <small>{selected?.name ?? "Connecting to API"}</small>
              </div>
              <div className="sample-stack" aria-label="Demo samples">
                {samples.map((sample, index) => (
                  <button
                    className={
                      selected?.name === sample.name
                        ? "sample-row sample-row--active"
                        : "sample-row"
                    }
                    key={sample.name}
                    onClick={() => choose(sample)}
                  >
                    <span className="sample-index">0{index + 1}</span>
                    <SurfaceCanvas pixels={sample.pixels} />
                    <span className="sample-label">
                      <strong>{sample.label}</strong>
                      <small>{sample.expected}</small>
                    </span>
                    <span className="sample-arrow">↗</span>
                  </button>
                ))}
              </div>
              <button
                className="upload-link"
                onClick={() => inputRef.current?.click()}
              >
                + LOAD EXTERNAL IMAGE
              </button>
              <input
                ref={inputRef}
                hidden
                type="file"
                accept="image/*"
                onChange={upload}
              />
              <button
                className="inspect-button"
                disabled={!selected || busy}
                onClick={() => void runInspection()}
              >
                <span>{busy ? "ANALYZING FRAME" : "RUN INSPECTION"}</span>
                <b>→</b>
              </button>
            </aside>
          </section>

          <section
            className={result ? "verdict verdict--ready" : "verdict"}
            aria-live="polite"
          >
            <div className="verdict-label">
              <span>DECISION OUTPUT</span>
              {result ? (
                <DecisionBadge decision={result.decision} />
              ) : (
                <strong>—</strong>
              )}
            </div>
            <div>
              <span>ANOMALY SCORE</span>
              <strong>
                {result ? `${result.anomaly_score.toFixed(2)}×` : "0.00×"}
              </strong>
            </div>
            <div>
              <span>REVIEW BOUNDARY</span>
              <strong>
                {result ? `${result.threshold.toFixed(2)}×` : "1.00×"}
              </strong>
            </div>
            <div>
              <span>CONNECTED REGIONS</span>
              <strong>{result?.regions.length ?? 0}</strong>
            </div>
          </section>

          <div id="records">
            <HistoryTable items={history} />
          </div>
        </main>
        <footer>
          <span>NILIK / VISUAL INSPECTION LAB</span>
          <span>
            LOCAL RELEASE · SYNTHETIC BENCHMARK · HUMAN REVIEW REQUIRED
          </span>
        </footer>
      </div>
    </div>
  );
}
