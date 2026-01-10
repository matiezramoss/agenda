import React, { useEffect, useState } from "react";
import { streamOwnerPending, ownerSetEstado } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";
import { Card, Button, Badge } from "./Ui.jsx";

function payInfo(r) {
  const t = r.tipoPago || "—";
  const total = r.montoTotal ?? "—";
  const sena = r.montoSena ? ` (seña ${r.montoSena})` : "";
  return `${t} · total ${total}${sena}`;
}

export default function OwnerRequests({ slug }) {
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
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
            const sub1 = `${r.nombre} ${r.apellido} · ${r.whatsapp} · ${r.email}`;
            const sub2 = `Pago: ${payInfo(r)}`;

            return (
              <div key={r.id} className="listItem">
                <div className="listLeft">
                  <div className="listTitle">{title}</div>
                  <div className="listSub">{sub1}</div>
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
