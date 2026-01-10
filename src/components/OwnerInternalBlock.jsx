import React, { useMemo, useState } from "react";
import { Card, Input, Button, Textarea } from "./Ui.jsx";
import { ownerCreateInternalBlock } from "../lib/firestore.js";
import { hhmmToMinutes } from "../lib/time.js";

export default function OwnerInternalBlock({ slug, fechaYmd, agenda }) {
  const [startHHMM, setStartHHMM] = useState("10:00");
  const [nota, setNota] = useState("Reserva interna");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const tiempoTurno = useMemo(() => Number(agenda?.tiempoTurno || 60), [agenda]);

  async function create(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const startMin = hhmmToMinutes(startHHMM);
      const endMin = startMin + tiempoTurno;
      await ownerCreateInternalBlock({ slug, fechaYmd, startMin, endMin, nota });
      setMsg("Bloqueo interno creado (bloquea disponibilidad).");
    } catch (ex) {
      setMsg(ex?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="h2">Crear reserva interna (bloquea)</div>
      <div className="muted">Usa tiempoTurno fijo del lugar. No tiene estados ni pago.</div>
      <hr className="hr" />

      <form onSubmit={create}>
        <label className="label">Hora inicio</label>
        <Input value={startHHMM} onChange={(e) => setStartHHMM(e.target.value)} placeholder="HH:MM" />
        <div style={{ height: 10 }} />
        <label className="label">Nota</label>
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />
        <div style={{ height: 10 }} />
        <Button className="primary" disabled={busy}>{busy ? "Creando..." : "Crear bloqueo"}</Button>
        {msg ? <div className="muted" style={{ marginTop: 10 }}>{msg}</div> : null}
      </form>
    </Card>
  );
}
