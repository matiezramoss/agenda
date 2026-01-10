export function pad2(n) {
  return String(n).padStart(2, "0");
}

export function ymdLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function parseYmd(ymd) {
  const [y, m, d] = String(ymd).split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, d || 1);
}

export function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

export function hhmmToMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map((x) => Number(x));
  return (h || 0) * 60 + (m || 0);
}

/** crea lista de inicios cada stepMin desde openMin (incl) hasta closeMin (excl) */
export function buildSlotStarts(openMin, closeMin, stepMin = 30) {
  const out = [];
  for (let t = openMin; t + stepMin <= closeMin; t += stepMin) out.push(t);
  return out;
}

/** suma minutos (0..1439) sin fechas: para UI */
export function addMinutes(baseMin, plus) {
  return baseMin + plus;
}
