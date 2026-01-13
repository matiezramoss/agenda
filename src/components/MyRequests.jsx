// src/components/MyRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { streamMyRequests } from "../lib/firestore";
import { minutesToHHMM } from "../lib/time";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  return new Intl.NumberFormat("es-AR").format(n);
}

function EstadoBadge({ estado }) {
  if (estado === "confirmada") return <span className="badge ok">Confirmada</span>;
  if (estado === "rechazada") return <span className="badge bad">Rechazada</span>;
  return <span className="badge warn">Pendiente</span>;
}

function payText(r) {
  const tipo = (r?.tipoPago || "").toLowerCase();
  const total = Number(r?.montoTotal);
  const sena = Number(r?.montoSena);

  if (tipo === "sena") {
    const senaOk = Number.isFinite(sena) ? sena : 0;
    const totalOk = Number.isFinite(total) ? total : 0;
    const resta = Math.max(0, totalOk - senaOk);
    return { corner: "Seña", chips: [`Seña: $${money(senaOk)}`, `Resta: $${money(resta)}`] };
  }

  if (Number.isFinite(total)) {
    return { corner: "Total", chips: [`Total: $${money(total)}`] };
  }

  return { corner: "Pago", chips: ["—"] };
}

export default function MyRequests({ slug }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!slug) return;
    const unsub = streamMyRequests(slug, setRows);
    return () => unsub?.();
  }, [slug]);

  const items = useMemo(() => rows || [], [rows]);

  if (!items.length) {
    return <div className="muted">Todavía no tenés solicitudes.</div>;
  }

  return (
    <div className="reqList">
      {items.map((r) => {
        const when = `${r.fechaYmd} · ${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;
        const pay = payText(r);

        return (
          <div key={r.id} className="reqItem reqItemPro">
            <div className="payCorner">{pay.corner}</div>

            <div className="reqItemTop">
              <div className="reqLeft">
                <div className="reqWhen">{when}</div>

                <div className="reqMetaRow">
                  {pay.chips.map((t, i) => (
                    <span key={i} className={`reqChip ${i > 0 ? "soft" : ""}`.trim()}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <EstadoBadge estado={r.estado} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
