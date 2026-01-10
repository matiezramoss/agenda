// src/components/OwnerInternalBlock.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Card, Button, Textarea, Select } from "./Ui.jsx";
import { ownerCreateInternalBlock, streamBlockingReservasForDay } from "../lib/firestore.js";
import { hhmmToMinutes, minutesToHHMM, buildSlotStarts } from "../lib/time.js";
import { buildOccupancyMap, computeStartAvailability } from "../lib/availability.js";

export default function OwnerInternalBlock({ slug, fechaYmd, agenda }) {
  const [nota, setNota] = useState("Reserva interna");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // Servicios activos (si existen)
  const servicios = useMemo(() => {
    const s = agenda?.servicios || {};
    return Object.entries(s)
      .map(([key, v]) => ({ key, ...(v || {}) }))
      .filter((x) => x?.activo);
  }, [agenda]);

  const [servicioKey, setServicioKey] = useState("");

  // Si hay servicios, setear uno por default
  useEffect(() => {
    if (!servicios.length) {
      setServicioKey("");
      return;
    }
    if (!servicioKey) setServicioKey(servicios[0].key);
  }, [servicios, servicioKey]);

  const servicio = useMemo(() => {
    if (!servicioKey) return null;
    return servicios.find((s) => s.key === servicioKey) || null;
  }, [servicios, servicioKey]);

  // Duración del bloqueo:
  // - si hay servicio seleccionado → usa duracionMin
  // - si no → usa tiempoTurno (fallback)
  const duracionMin = useMemo(() => {
    if (servicio?.duracionMin != null) return Number(servicio.duracionMin);
    return Number(agenda?.tiempoTurno || 60);
  }, [servicio, agenda]);

  // 🔴 Bloqueantes (confirmadas + internas) en TIEMPO REAL
  const [blocking, setBlocking] = useState([]);

  useEffect(() => {
    if (!slug || !fechaYmd) return;
    const unsub = streamBlockingReservasForDay(slug, fechaYmd, setBlocking);
    return () => unsub?.();
  }, [slug, fechaYmd]);

  // Config slots del día
  const cfg = useMemo(() => {
    if (!agenda) return null;

    const stepMin = Number(agenda.stepMin || 30);
    const capacidad = Number(agenda.capacidadSimultanea || 1);
    const openMin = hhmmToMinutes(agenda.openHHMM || "08:00");
    const closeMin = hhmmToMinutes(agenda.closeHHMM || "20:00");
    const slotStarts = buildSlotStarts(openMin, closeMin, stepMin);

    return { stepMin, capacidad, openMin, closeMin, slotStarts };
  }, [agenda]);

  // Disponibilidad real según duracionMin (servicio o fallback)
  const availability = useMemo(() => {
    if (!cfg) return [];
    const occupancy = buildOccupancyMap(blocking, cfg.stepMin);
    return computeStartAvailability({
      slotStarts: cfg.slotStarts,
      tiempoTurnoMin: duracionMin,
      capacidadSimultanea: cfg.capacidad,
      occupancyMap: occupancy,
      stepMin: cfg.stepMin,
    });
  }, [cfg, blocking, duracionMin]);

  const opcionesDisponibles = useMemo(
    () => availability.filter((a) => a.ok),
    [availability]
  );

  // Hora inicio (en minutos) elegida por select
  const [startMin, setStartMin] = useState(null);

  // Reset cuando cambia fecha o servicio (porque cambia la duración)
  useEffect(() => {
    setStartMin(null);
  }, [fechaYmd, servicioKey, duracionMin]);

  async function create(e) {
    e.preventDefault();
    setMsg("");

    if (!startMin) {
      setMsg("Elegí un horario disponible.");
      return;
    }

    setBusy(true);

    try {
      const endMin = Number(startMin) + Number(duracionMin);

      await ownerCreateInternalBlock({
        slug,
        fechaYmd,
        startMin: Number(startMin),
        endMin,
        nota,
      });

      setMsg("Bloqueo interno creado (bloquea disponibilidad).");
      setStartMin(null);
    } catch (ex) {
      setMsg(ex?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="h2">Crear reserva interna (bloquea)</div>
      <div className="muted">
        {servicios.length
          ? "Elegís un servicio (define duración). No tiene pago."
          : "Usa tiempoTurno fijo del lugar. No tiene pago."}
      </div>
      <hr className="hr" />

      <form onSubmit={create}>
        {servicios.length ? (
          <>
            <label className="label">Servicio (define duración)</label>
            <Select value={servicioKey} onChange={(e) => setServicioKey(e.target.value)}>
              {servicios.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.nombre || s.key} ({Number(s.duracionMin || 0)} min)
                </option>
              ))}
            </Select>
            <div style={{ height: 10 }} />
          </>
        ) : null}

        <label className="label">Hora inicio (solo disponibles)</label>
        <Select
          value={startMin ?? ""}
          onChange={(e) => setStartMin(Number(e.target.value) || null)}
          disabled={!opcionesDisponibles.length}
        >
          <option value="">
            {opcionesDisponibles.length
              ? "Elegí un horario disponible"
              : "No hay horarios disponibles"}
          </option>

          {opcionesDisponibles.map((a) => (
            <option key={a.startMin} value={a.startMin}>
              {minutesToHHMM(a.startMin)} ({a.free} cupo)
            </option>
          ))}
        </Select>

        <div style={{ height: 10 }} />

        <label className="label">Nota</label>
        <Textarea value={nota} onChange={(e) => setNota(e.target.value)} />

        <div style={{ height: 10 }} />

        <Button className="primary" disabled={busy || !startMin}>
          {busy ? "Creando..." : `Crear bloqueo (${duracionMin} min)`}
        </Button>

        {msg ? (
          <div className="muted" style={{ marginTop: 10 }}>
            {msg}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
