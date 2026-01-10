import { hhmmToMinutes } from "./time";

/**
 * Reserva: { startMin, endMin, estado, tipo }:
 * - estado: pendiente|confirmada|rechazada|interna
 * - SOLO confirmada e interna bloquean
 */

/** True si dos intervalos [a1,a2) y [b1,b2) se solapan */
export function overlaps(a1, a2, b1, b2) {
  return a1 < b2 && b1 < a2;
}

/** Calcula ocupación por bloque de 30m (o step) dado un set de reservas bloqueantes */
export function buildOccupancyMap(reservas, stepMin = 30) {
  // Map: blockStartMin -> count
  const map = new Map();
  for (const r of reservas) {
    const s = Number(r.startMin);
    const e = Number(r.endMin);
    // recorremos bloques que toca
    for (let t = s; t < e; t += stepMin) {
      const key = t;
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  return map;
}

/**
 * Disponibilidad por inicio: un inicio es válido si TODOS los bloques que ocupa
 * (tiempoTurno) tienen cupo > 0.
 */
export function computeStartAvailability({
  slotStarts,           // array de minutes
  tiempoTurnoMin,       // 30|60|90|120
  capacidadSimultanea,  // int
  occupancyMap,         // Map blockStartMin->count (confirmadas+internas)
  stepMin = 30,
}) {
  const blocksNeeded = Math.ceil(tiempoTurnoMin / stepMin);
  const out = [];

  for (const start of slotStarts) {
    let ok = true;
    let minFree = Infinity;

    for (let i = 0; i < blocksNeeded; i++) {
      const blockStart = start + i * stepMin;
      const used = occupancyMap.get(blockStart) || 0;
      const free = capacidadSimultanea - used;
      if (free <= 0) ok = false;
      if (free < minFree) minFree = free;
    }

    out.push({
      startMin: start,
      ok,
      free: Number.isFinite(minFree) ? minFree : 0,
    });
  }

  return out;
}

/** Convierte "HH:MM" y duración a start/end mins */
export function rangeFromHHMM(hhmm, tiempoTurnoMin) {
  const startMin = hhmmToMinutes(hhmm);
  const endMin = startMin + Number(tiempoTurnoMin || 0);
  return { startMin, endMin };
}
