import React, { useMemo, useState } from "react";
import { Card, Input, Textarea, Button, Select } from "./Ui.jsx";
import { createPendingRequest } from "../lib/firestore.js";
import { minutesToHHMM } from "../lib/time.js";

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

  return (
    <Card>
      <div className="h2">Confirmar solicitud</div>

      {servicio && selectedRange && (
        <div className="muted">
          {servicio.nombre} · {minutesToHHMM(selectedRange.startMin)} →{" "}
          {minutesToHHMM(selectedRange.endMin)} · ${montoTotal}
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
          <option value="total">Pago total — ${montoTotal}</option>
          {agenda?.aceptaSena && (
            <option value="sena">
              Seña ({agenda.senaPct}%) — ${montoSena}
            </option>
          )}
        </Select>

        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
        {ok && <div style={{ color: "#166534" }}>{ok}</div>}

        <Button className="primary" disabled={!canSubmit || busy}>
          Confirmar reserva
        </Button>
      </form>
    </Card>
  );
}
