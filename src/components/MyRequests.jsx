import React, { useEffect, useState } from "react";
import { streamMyRequests } from "../lib/firestore";
import { minutesToHHMM } from "../lib/time";

function EstadoBadge({ estado }) {
  if (estado === "confirmada")
    return <span className="badge ok">Confirmada</span>;
  if (estado === "rechazada")
    return <span className="badge bad">Rechazada</span>;
  return <span className="badge warn">Pendiente</span>;
}

export default function MyRequests({ slug }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const unsub = streamMyRequests(slug, setRows);
    return () => unsub?.();
  }, [slug]);

  if (!rows.length) {
    return <div className="muted">Todavía no tenés solicitudes.</div>;
  }

  return (
    <div className="reqList">
      {rows.map((r) => {
        const when = `${r.fechaYmd} · ${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;

        return (
          <div key={r.id} className="reqItem">
            <div className="reqItemTop">
              <div>
                <div className="reqWhen">{when}</div>
                <div className="reqMeta">
                  Pago: {r.tipoPago} · Total: {r.montoTotal}
                  {r.montoSena ? ` · Seña: ${r.montoSena}` : ""}
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
