// src/components/TimeGrid.jsx
import React, { useMemo } from "react";
import { minutesToHHMM } from "../lib/time.js";

export default function TimeGrid({
  cfg,
  availability,
  selectedStartMin,
  onSelectStart,
}) {
  if (!cfg) return null;

  const available = useMemo(
    () => (availability || []).filter((a) => a.ok),
    [availability]
  );

  function onPick(e) {
    const v = e.target.value;
    if (v === "") {
      onSelectStart?.(null);
      return;
    }
    const n = Number(v);
    if (Number.isFinite(n)) onSelectStart?.(n);
  }

  return (
    <div>
      {/* ✅ SELECT SOLO DISPONIBLES */}
      <div style={{ marginBottom: 12 }}>
        <label className="label">Horarios disponibles</label>
        <select className="select" value={selectedStartMin ?? ""} onChange={onPick}>
          <option value="">
            {available.length ? "Elegí un horario" : "No hay horarios disponibles"}
          </option>

          {available.map((a) => (
            <option key={a.startMin} value={a.startMin}>
              {minutesToHHMM(a.startMin)} ({a.free} cupo)
            </option>
          ))}
        </select>

        <div className="muted small" style={{ marginTop: 6 }}>
          Solo aparecen horarios disponibles. La grilla abajo muestra todo.
        </div>
      </div>

      {/* ✅ GRILLA (VERDE/ROJO) */}
      <div className="slotGrid">
        {availability.map((a) => {
          const isSel = selectedStartMin === a.startMin;

          const cls = ["slot", a.ok ? "green" : "red", isSel ? "selected" : ""]
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
    </div>
  );
}
