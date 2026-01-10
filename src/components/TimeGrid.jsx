// src/components/TimeGrid.jsx
import React from "react";
import { minutesToHHMM } from "../lib/time.js";

export default function TimeGrid({ cfg, availability, selectedStartMin, onSelectStart }) {
  if (!cfg) return null;

  return (
    <div className="slotGrid">
      {availability.map((a) => {
        const isSel = selectedStartMin === a.startMin;

        const cls = [
          "slot",
          a.ok ? "green" : "red",
          isSel ? "selected" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={a.startMin}
            className={cls}
            onClick={() => a.ok && onSelectStart?.(a.startMin)}
            disabled={!a.ok}
            type="button"
          >
            <div className="t">{minutesToHHMM(a.startMin)}</div>
            <div className="s">{a.ok ? `${a.free} cupo` : "Sin cupo"}</div>
          </button>
        );
      })}
    </div>
  );
}
