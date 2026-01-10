// src/routes/PublicAgenda.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BrandShell from "../components/BrandShell.jsx";
import DayPicker from "../components/DayPicker.jsx";
import TimeGrid from "../components/TimeGrid.jsx";
import RequestForm from "../components/RequestForm.jsx";
import MyRequests from "../components/MyRequests.jsx";
import {
  streamAgenda,
  streamBlockingReservasForDay,
} from "../lib/firestore.js";
import { ymdLocal, hhmmToMinutes, buildSlotStarts } from "../lib/time.js";
import { buildOccupancyMap, computeStartAvailability } from "../lib/availability.js";

export default function PublicAgenda() {
  const { slug } = useParams();
  const [agenda, setAgenda] = useState(null);
  const [fechaYmd, setFechaYmd] = useState(ymdLocal());
  const [loading, setLoading] = useState(true);

  const [servicioKey, setServicioKey] = useState(null);
  const [blocking, setBlocking] = useState([]);
  const [selectedStartMin, setSelectedStartMin] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsub = streamAgenda(slug, (a) => {
      setAgenda(a);
      setLoading(false);
    });
    return () => unsub?.();
  }, [slug]);

  const servicios = useMemo(() => {
    const s = agenda?.servicios || {};
    return Object.entries(s)
      .filter(([, v]) => v?.activo)
      .map(([k, v]) => ({ key: k, ...v }));
  }, [agenda]);

  const servicio = servicios.find((s) => s.key === servicioKey) || null;

  useEffect(() => {
    setSelectedStartMin(null);
  }, [servicioKey, fechaYmd]);

  /* ✅ STREAM BLOQUEANTES EN TIEMPO REAL */
  useEffect(() => {
    if (!agenda || !servicio) return;
    const unsub = streamBlockingReservasForDay(slug, fechaYmd, setBlocking);
    return () => unsub?.();
  }, [slug, agenda, fechaYmd, servicio]);

  const cfg = useMemo(() => {
    if (!agenda || !servicio) return null;
    const stepMin = Number(agenda.stepMin || 30);
    const capacidad = Number(agenda.capacidadSimultanea || 1);
    const openMin = hhmmToMinutes(agenda.openHHMM || "08:00");
    const closeMin = hhmmToMinutes(agenda.closeHHMM || "20:00");

    return {
      stepMin,
      capacidad,
      tiempoTurno: Number(servicio.duracionMin || 60),
      slotStarts: buildSlotStarts(openMin, closeMin, stepMin),
    };
  }, [agenda, servicio]);

  const availability = useMemo(() => {
    if (!cfg) return [];
    const occupancy = buildOccupancyMap(blocking, cfg.stepMin);
    return computeStartAvailability({
      slotStarts: cfg.slotStarts,
      tiempoTurnoMin: cfg.tiempoTurno,
      capacidadSimultanea: cfg.capacidad,
      occupancyMap: occupancy,
      stepMin: cfg.stepMin,
    });
  }, [cfg, blocking]);

  /* ✅ FIX: si tu selección deja de estar disponible en tiempo real → reset */
  useEffect(() => {
    if (!cfg) return;
    if (selectedStartMin == null) return;

    const row = availability.find((a) => a.startMin === selectedStartMin);
    if (!row || !row.ok) {
      setSelectedStartMin(null);
    }
  }, [cfg, availability, selectedStartMin]);

  const selectedRange =
    selectedStartMin != null && cfg
      ? { startMin: selectedStartMin, endMin: selectedStartMin + cfg.tiempoTurno }
      : null;

  return (
    <BrandShell loading={loading} agenda={agenda}>
      <div className="pageGrid">
        <div>
          <div className="card">
            <div className="h2">Elegí servicio</div>
            <div className="slotGrid">
              {servicios.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className={`slot ${servicioKey === s.key ? "selected" : ""}`}
                  onClick={() => setServicioKey(s.key)}
                >
                  <div className="t">{s.nombre}</div>
                  <div className="s">
                    ${s.precio} · {s.duracionMin} min
                  </div>
                </button>
              ))}
            </div>
          </div>

          {servicio && (
            <>
              <div style={{ height: 12 }} />
              <div className="card">
                <DayPicker value={fechaYmd} onChange={setFechaYmd} />
                <hr className="hr" />
                <TimeGrid
                  cfg={cfg}
                  availability={availability}
                  selectedStartMin={selectedStartMin}
                  onSelectStart={setSelectedStartMin}
                />
              </div>
            </>
          )}

          <div style={{ height: 12 }} />
          <div className="card">
            <div className="h2">Mis solicitudes</div>
            <MyRequests slug={slug} />
          </div>
        </div>

        <div className="sticky">
          <RequestForm
            slug={slug}
            agenda={agenda}
            servicio={servicio}
            fechaYmd={fechaYmd}
            selectedRange={selectedRange}
            canSubmit={Boolean(servicio && selectedRange)}
            onDone={() => setSelectedStartMin(null)}
          />
        </div>
      </div>
    </BrandShell>
  );
}
