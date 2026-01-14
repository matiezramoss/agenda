// src/components/OwnerRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { streamOwnerPending, ownerSetEstado } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";
import { Card, Button, Badge } from "./Ui.jsx";

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

  if (Number.isFinite(total)) return `Total $${money(total)}`;
  return tipo ? tipo : "—";
}

/* ===========================
   WhatsApp helpers
   =========================== */

function normalizePhone(raw) {
  // deja solo dígitos
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";

  // si viene con 00... (prefijo internacional), lo limpiamos
  digits = digits.replace(/^00+/, "");

  // si empieza con 0 (011..., 0341...), lo sacamos
  digits = digits.replace(/^0+/, "");

  // si ya viene con 549..., OK
  if (digits.startsWith("549")) return digits;

  // si ya viene con 54 pero sin 9, lo convertimos a 549 (caso típico AR)
  if (digits.startsWith("54")) return `549${digits.slice(2)}`;

  // default AR: asumimos móvil y armamos 549 + número
  return `549${digits}`;
}

function buildWaLink(phoneDigits, text) {
  const p = String(phoneDigits || "").trim();
  if (!p) return "";
  const msg = encodeURIComponent(String(text || "").trim());
  return `https://wa.me/${p}${msg ? `?text=${msg}` : ""}`;
}

export default function OwnerRequests({ slug }) {
  const [pending, setPending] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!slug) return;
    const unsub = streamOwnerPending(slug, setPending);
    return () => unsub?.();
  }, [slug]);

  const items = useMemo(() => pending || [], [pending]);

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

      {!items.length ? (
        <div className="muted">No hay pendientes.</div>
      ) : (
        <div className="list">
          {items.map((r) => {
            const title = `${r.fechaYmd} · ${minutesToHHMM(r.startMin)}–${minutesToHHMM(r.endMin)}`;

            const cliente = `${r.nombre || ""} ${r.apellido || ""}`.trim() || "—";
            const sub1 = `${cliente} · ${r.whatsapp || "—"} · ${r.email || "—"}`;

            const serv = serviceInfo(r);
            const subServ = serv ? `Servicio: ${serv}` : null;

            const subPago = `Pago: ${payInfo(r)}`;

            // ✅ WhatsApp link
            const waDigits = normalizePhone(r.whatsapp);
            const waMsg = `Hola ${cliente}. Soy del local. Vi tu solicitud para ${r.fechaYmd} ${minutesToHHMM(
              r.startMin
            )}–${minutesToHHMM(r.endMin)}.`;
            const waLink = buildWaLink(waDigits, waMsg);

            return (
              <div key={r.id} className="listItem">
                <div className="listLeft">
                  <div className="listTitle">{title}</div>
                  <div className="listSub">{sub1}</div>
                  {subServ ? <div className="listSub">{subServ}</div> : null}
                  <div className="listSub">{subPago}</div>
                  {r.mensaje ? <div className="listSub">Msg: {r.mensaje}</div> : null}
                </div>

                <div className="listRight" style={{ alignItems: "flex-end" }}>
                  <Badge variant="warn">Pendiente</Badge>

                  <div className="btnRow" style={{ marginTop: 10 }}>
                    {/* ✅ WHATSAPP PRIMERO */}
                    {/* <Button
                      id="btnWsp"
                      disabled={!waLink}
                      onClick={() => {
                        if (!waLink) return;
                        window.open(waLink, "_blank", "noopener,noreferrer");
                      }}
                    >
                      {waLink ? "WhatsApp" : "WhatsApp (sin número)"}
                    </Button> */}

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
