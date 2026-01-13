// src/components/RequestForm.jsx
import React, { useMemo, useState } from "react";
import { Card, Input, Textarea, Button, Select } from "./Ui.jsx";
import { createPendingRequest } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";

function money(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "—");
  return new Intl.NumberFormat("es-AR").format(n);
}

export default function RequestForm({
  slug,
  agenda,
  servicio,
  fechaYmd,
  selectedRange,
  canSubmit,
  onDone,
}) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [tipoPago, setTipoPago] = useState("total");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const montoTotal = servicio?.precio || 0;

  const montoSena = useMemo(() => {
    if (!agenda?.aceptaSena) return null;
    if (tipoPago !== "sena") return null;
    return Math.round((montoTotal * (agenda.senaPct || 0)) / 100);
  }, [tipoPago, agenda, montoTotal]);

  const resto = useMemo(() => {
    const tot = Number(montoTotal);
    const sen = Number(montoSena);
    if (!Number.isFinite(tot)) return null;
    if (tipoPago !== "sena") return null;
    return Math.max(0, tot - (Number.isFinite(sen) ? sen : 0));
  }, [tipoPago, montoTotal, montoSena]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!canSubmit) return;

    try {
      setBusy(true);
      await createPendingRequest({
        slug,
        fechaYmd,
        startMin: selectedRange.startMin,
        endMin: selectedRange.endMin,

        servicioKey: servicio.key,
        servicioNombre: servicio.nombre,
        duracionMin: servicio.duracionMin,

        tipoPago,
        montoTotal,
        montoSena: tipoPago === "sena" ? montoSena : null,

        nombre,
        apellido,
        email,
        whatsapp,
        mensaje,
      });

      setOk("Solicitud enviada correctamente.");
      onDone?.();
    } catch {
      setErr("Error al enviar la solicitud.");
    } finally {
      setBusy(false);
    }
  }

  const showPagoBox = Boolean(agenda?.alias || agenda?.cbu);

  return (
    <Card>
      <div className="h2">Confirmar solicitud</div>

      {servicio && selectedRange && (
        <div className="muted">
          {servicio.nombre} · {minutesToHHMM(selectedRange.startMin)} →{" "}
          {minutesToHHMM(selectedRange.endMin)} · ${money(montoTotal)}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <Input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input placeholder="Apellido" value={apellido} onChange={(e) => setApellido(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <Textarea placeholder="Mensaje" value={mensaje} onChange={(e) => setMensaje(e.target.value)} />

        <label className="label">Forma de pago *</label>
        <Select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
          <option value="total">Pago total — ${money(montoTotal)}</option>
          {agenda?.aceptaSena && (
            <option value="sena">Seña ({agenda.senaPct}%) — ${money(montoSena)}</option>
          )}
        </Select>

        {/* ✅ Alias / CBU visible para el usuario */}
        {showPagoBox ? (
          <div className="listItem" style={{ marginTop: 10 }}>
            <div className="listLeft">
              <div className="listTitle">Datos para transferir</div>

              {tipoPago === "sena" ? (
                <div className="listSub">
                  Seña: <strong>${money(montoSena)}</strong>
                  {resto != null ? (
                    <>
                      {" "}
                      · Resta: <strong>${money(resto)}</strong>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="listSub">
                  Total: <strong>${money(montoTotal)}</strong>
                </div>
              )}

              {agenda?.alias ? (
                <div className="listSub">
                  Alias: <strong>{agenda.alias}</strong>
                </div>
              ) : null}

              {agenda?.cbu ? (
                <div className="listSub">
                  CBU: <strong>{agenda.cbu}</strong>
                </div>
              ) : null}

              <div className="listSub">
                Transferí y después confirmás la solicitud (el dueño te aprueba el turno).
              </div>
            </div>
          </div>
        ) : null}

        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
        {ok && <div style={{ color: "#166534" }}>{ok}</div>}

        <Button className="primary" type="submit" disabled={!canSubmit || busy}>
          Confirmar reserva
        </Button>
      </form>
    </Card>
  );
}
