import React, { useEffect, useState } from "react";
import { streamOwnerPending, ownerSetEstado } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";
import { Card, Button, Badge } from "./Ui.jsx";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  return new Intl.NumberFormat("es-AR").format(n);
}

function payInfo(r) {
  const t = r.tipoPago || "—";
  const total = money(r.montoTotal ?? "—");
  const sena = r.montoSena ? ` · seña ${money(r.montoSena)}` : "";
  return `${t} · total ${total}${sena}`;
}

function serviceInfo(r) {
  // soporta tanto el nuevo schema (servicioNombre/duracionMin/montoTotal)
  // como valores faltantes
  const name = r.servicioNombre || r.servicioKey || null;
  const dur = r.duracionMin ? `${r.duracionMin} min` : null;
  const price = r.montoTotal != null ? `$${money(r.montoTotal)}` : null;

  const parts = [name, dur, price].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export default function OwnerRequests({ slug }) {
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!slug) return;
    const unsub = streamOwnerPending(slug, setPending);
    return () => unsub?.();
  }, [slug]);

  async function setEstado(id, estado) {
    setBusyId(id);
    try {
      await ownerSetEstado(slug, id, estado);
      // Después: WhatsApp + Email (Cloud Functions / backend)
    } finally {
      setBusyId("");
    }
  }

  return (
    <Card>
      <div className="h2">Solicitudes pendientes</div>
      <div className="muted">Confirmar bloquea turno. Rechazar no bloquea.</div>
      <hr className="hr" />

      {!pending.length ? (
        <div className="muted">No hay pendientes.</div>
      ) : (
        <div className="list">
          {pending.map((r) => {
            const title = `${r.fechaYmd} · ${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;

            const cliente = `${r.nombre || ""} ${r.apellido || ""}`.trim() || "—";
            const sub1 = `${cliente} · ${r.whatsapp || "—"} · ${r.email || "—"}`;

            const serv = serviceInfo(r);
            const subServ = serv ? `Servicio: ${serv}` : null;

            const sub2 = `Pago: ${payInfo(r)}`;

            return (
              <div key={r.id} className="listItem">
                <div className="listLeft">
                  <div className="listTitle">{title}</div>
                  <div className="listSub">{sub1}</div>
                  {subServ ? <div className="listSub">{subServ}</div> : null}
                  <div className="listSub">{sub2}</div>
                  {r.mensaje ? <div className="listSub">Msg: {r.mensaje}</div> : null}
                </div>

                <div className="listRight" style={{ alignItems: "flex-end" }}>
                  <Badge variant="warn">Pendiente</Badge>

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    <Button
                      className="success"
                      disabled={busyId === r.id}
                      onClick={() => setEstado(r.id, "confirmada")}
                    >
                      Confirmar
                    </Button>

                    <Button
                      className="danger"
                      disabled={busyId === r.id}
                      onClick={() => setEstado(r.id, "rechazada")}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
