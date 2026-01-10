import React, { useEffect, useState } from "react";
import { Card, Badge } from "./Ui.jsx";
import { streamOwnerDay } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";

export default function OwnerDayAgenda({ slug, fechaYmd }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const unsub = streamOwnerDay(slug, fechaYmd, setRows);
    return () => unsub?.();
  }, [slug, fechaYmd]);

  return (
    <Card>
      <div className="h2">Agenda del día (bloqueantes)</div>
      <div className="muted">Solo confirmadas e internas aparecen acá.</div>
      <hr className="hr" />

      {!rows.length ? (
        <div className="muted">No hay reservas confirmadas/internas ese día.</div>
      ) : (
        <div className="list">
          {rows.map((r) => {
            const title = `${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;
            const isInterna = r.estado === "interna";
            const subtitle = isInterna
              ? `Bloqueo interno: ${r.mensaje || "—"}`
              : `${r.nombre} ${r.apellido} · ${r.whatsapp}`;

            return (
              <div key={r.id} className="listItem">
                <div className="listLeft">
                  <div className="listTitle">{title}</div>
                  <div className="listSub">{subtitle}</div>
                </div>
                <div className="listRight">
                  <Badge variant="ok">{isInterna ? "Interna" : "Confirmada"}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
