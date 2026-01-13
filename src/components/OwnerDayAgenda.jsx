// src/components/OwnerDayAgenda.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "./Ui.jsx";
import { streamOwnerDay } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  return new Intl.NumberFormat("es-AR").format(n);
}

function serviceInfo(r) {
  const name = r.servicioNombre || r.servicioKey || null;
  const dur = r.duracionMin ? `${r.duracionMin} min` : null;
  const price = r.montoTotal != null ? `$${money(r.montoTotal)}` : null;
  const parts = [name, dur, price].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

function payInfo(r) {
  const tipo = (r?.tipoPago || "").toLowerCase();
  const total = Number(r?.montoTotal);
  const sena = Number(r?.montoSena);

  if (tipo === "sena") {
    const senaOk = Number.isFinite(sena) ? sena : 0;
    const totalOk = Number.isFinite(total) ? total : 0;
    const resta = Math.max(0, totalOk - senaOk);
    return `Seña $${money(senaOk)} · Resta $${money(resta)}`;
  }

  if (Number.isFinite(total)) return "Total";
  return null;
}

export default function OwnerDayAgenda({ slug, fechaYmd }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!slug || !fechaYmd) return;
    const unsub = streamOwnerDay(slug, fechaYmd, setRows);
    return () => unsub?.();
  }, [slug, fechaYmd]);

  const items = useMemo(() => rows || [], [rows]);

  return (
    <Card>
      <div className="h2">Agenda del día (bloqueantes)</div>
      <div className="muted">Solo confirmadas e internas aparecen acá.</div>
      <hr className="hr" />

      {!items.length ? (
        <div className="muted">No hay reservas confirmadas/internas ese día.</div>
      ) : (
        <div className="list">
          {items.map((r) => {
            const title = `${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;
            const isInterna = r.estado === "interna";

            if (isInterna) {
              const subtitle = `Bloqueo interno: ${r.mensaje || "—"}`;
              return (
                <div key={r.id} className="listItem">
                  <div className="listLeft">
                    <div className="listTitle">{title}</div>
                    <div className="listSub">{subtitle}</div>
                  </div>
                  <div className="listRight">
                    <Badge variant="ok">Interna</Badge>
                  </div>
                </div>
              );
            }

            const cliente = `${r.nombre || ""} ${r.apellido || ""}`.trim() || "—";
            const sub1 = `${cliente} · ${r.whatsapp || "—"}`;
            const serv = serviceInfo(r);
            const pago = payInfo(r);

            return (
              <div key={r.id} className="listItem">
                <div className="listLeft">
                  <div className="listTitle">{title}</div>
                  <div className="listSub">{sub1}</div>
                  {serv ? <div className="listSub">Servicio: {serv}</div> : null}
                  {pago ? <div className="listSub">Pago: {pago}</div> : null}
                </div>
                <div className="listRight">
                  <Badge variant="ok">Confirmada</Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
