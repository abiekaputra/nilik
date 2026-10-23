/** Module responsible for presenting the latest persisted inspections. */

import type { HistoryItem } from "../lib/types";
import { DecisionBadge } from "./DecisionBadge";

export function HistoryTable({ items }: { items: HistoryItem[] }) {
  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Traceability</span>
          <h2>Inspection history</h2>
        </div>
        <span className="record-count">{items.length} recent records</span>
      </div>
      {items.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sample</th>
                <th>Decision</th>
                <th>Score</th>
                <th>Regions</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.sample_name}</td>
                  <td>
                    <DecisionBadge decision={item.decision} />
                  </td>
                  <td>{item.anomaly_score.toFixed(2)}×</td>
                  <td>{item.region_count}</td>
                  <td>
                    {new Date(`${item.created_at}Z`).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">
          Run an inspection to create the first traceable record.
        </p>
      )}
    </section>
  );
}
