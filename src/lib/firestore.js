// src/lib/firestore.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

import { db, auth } from "./firebase";
import { getOrCreatePublicToken } from "./tokens";

/* ===========================
   Agenda
   =========================== */

export async function getAgendaBySlug(slug) {
  const ref = doc(db, "agendas", String(slug));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export function streamAgenda(slug, cb) {
  const ref = doc(db, "agendas", String(slug));
  return onSnapshot(ref, (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

/* ===========================
   PUBLIC — BLOQUEANTES EN TIEMPO REAL
   (Confirmadas + Internas)
   =========================== */

export function streamBlockingReservasForDay(slug, fechaYmd, cb) {
  const col = collection(db, "agendas", String(slug), "reservas");

  const q = query(
    col,
    where("fechaYmd", "==", String(fechaYmd)),
    where("estado", "in", ["confirmada", "interna"]),
    orderBy("startMin", "asc"),
    limit(2000)
  );

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// compat: si tu código viejo llama listBlockingReservasForDay
export async function listBlockingReservasForDay(slug, fechaYmd) {
  const col = collection(db, "agendas", String(slug), "reservas");
  const q = query(
    col,
    where("fechaYmd", "==", String(fechaYmd)),
    where("estado", "in", ["confirmada", "interna"]),
    orderBy("startMin", "asc"),
    limit(2000)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* ===========================
   PUBLIC — MIS SOLICITUDES
   =========================== */

export function streamMyRequests(slug, cb) {
  const token = getOrCreatePublicToken();
  const col = collection(db, "agendas", String(slug), "reservas");
  const q = query(
    col,
    where("publicToken", "==", token),
    orderBy("createdAt", "desc"),
    limit(200)
  );

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ===========================
   OWNER — PENDIENTES
   =========================== */

export function streamOwnerPending(slug, cb) {
  const col = collection(db, "agendas", String(slug), "reservas");
  const q = query(col, where("estado", "==", "pendiente"), orderBy("createdAt", "desc"), limit(300));

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ===========================
   OWNER — AGENDA DEL DÍA (bloqueantes)
   =========================== */

export function streamOwnerDay(slug, fechaYmd, cb) {
  const col = collection(db, "agendas", String(slug), "reservas");
  const q = query(
    col,
    where("fechaYmd", "==", String(fechaYmd)),
    where("estado", "in", ["confirmada", "interna"]),
    orderBy("startMin", "asc"),
    limit(1000)
  );

  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/* ===========================
   OWNER — BUSCAR AGENDAS POR ADMIN EMAIL
   =========================== */

export async function listAgendasForAdmin(email) {
  const em = String(email || "").trim().toLowerCase();
  if (!em) return [];

  const qy = query(collection(db, "agendas"), where("admin", "==", em));
  const snap = await getDocs(qy);

  const out = snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
  out.sort((a, b) => String(a.nombrePublico || a.slug).localeCompare(String(b.nombrePublico || b.slug)));

  return out;
}

/* ===========================
   CREAR SOLICITUD (PUBLIC)
   - servicios
   - seña / total
   =========================== */

export async function createPendingRequest({
  slug,
  fechaYmd,
  startMin,
  endMin,

  servicioKey,
  servicioNombre,
  duracionMin,

  tipoPago, // "sena" | "total"
  montoTotal,
  montoSena,

  nombre,
  apellido,
  email,
  whatsapp,
  mensaje,
}) {
  const token = getOrCreatePublicToken();
  const col = collection(db, "agendas", String(slug), "reservas");

  await addDoc(col, {
    fechaYmd: String(fechaYmd),
    startMin: Number(startMin),
    endMin: Number(endMin),
    estado: "pendiente",

    servicioKey: servicioKey || null,
    servicioNombre: servicioNombre || null,
    duracionMin: Number.isFinite(Number(duracionMin)) ? Number(duracionMin) : null,

    tipoPago: tipoPago || "total",
    montoTotal: Number.isFinite(Number(montoTotal)) ? Number(montoTotal) : null,
    montoSena: Number.isFinite(Number(montoSena)) ? Number(montoSena) : null,

    nombre: String(nombre || "").trim(),
    apellido: String(apellido || "").trim(),
    email: String(email || "").trim(),
    whatsapp: String(whatsapp || "").trim(),
    mensaje: String(mensaje || "").trim(),

    publicToken: token,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ===========================
   OWNER — ACCIONES
   =========================== */

export async function ownerSetEstado(slug, reservaId, estado) {
  const ref = doc(db, "agendas", String(slug), "reservas", String(reservaId));
  await updateDoc(ref, { estado: String(estado), updatedAt: serverTimestamp() });
}

export async function ownerCreateInternalBlock({ slug, fechaYmd, startMin, endMin, nota }) {
  const col = collection(db, "agendas", String(slug), "reservas");

  // schema completo
  await addDoc(col, {
    fechaYmd: String(fechaYmd),
    startMin: Number(startMin),
    endMin: Number(endMin),
    estado: "interna",

    servicioKey: null,
    servicioNombre: null,
    duracionMin: null,

    tipoPago: null,
    montoTotal: null,
    montoSena: null,

    nombre: "INTERNO",
    apellido: "",
    email: "",
    whatsapp: "",
    mensaje: String(nota || "").trim(),

    publicToken: "INTERNAL",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/* ===========================
   SUPER ADMIN — VALIDACIÓN (🔥 IMPORTANTE)
   =========================== */

// ✅ ESTA FUNCIÓN ES LA QUE TE ESTABA DUPLICADA.
// Dejála UNA SOLA VEZ.
export async function getSuperAdminSelf() {
  const u = auth.currentUser;
  if (!u?.uid) return null;

  const ref = doc(db, "superadmins", u.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  return { uid: snap.id, ...snap.data() };
}

/* ===========================
   SUPER ADMIN — AGENDAS (CRUD)
   =========================== */

export function streamAllAgendas(cb) {
  const col = collection(db, "agendas");
  const qy = query(col, limit(500));

  return onSnapshot(qy, (snap) => {
    const out = snap.docs.map((d) => ({ slug: d.id, ...d.data() }));
    out.sort((a, b) => String(a.nombrePublico || a.slug).localeCompare(String(b.nombrePublico || b.slug)));
    cb(out);
  });
}

export async function superCreateAgenda(slug, data) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) throw new Error("Slug requerido.");

  const ref = doc(db, "agendas", cleanSlug);

  const payload = {
    ...data,
    admin: String(data?.admin || "").trim().toLowerCase() || null,
    stepMin: Number(data?.stepMin ?? 30),
    capacidadSimultanea: Number(data?.capacidadSimultanea ?? 1),
    tiempoTurno: Number(data?.tiempoTurno ?? 60),

    openHHMM: String(data?.openHHMM || "08:00"),
    closeHHMM: String(data?.closeHHMM || "20:00"),

    aceptaSena: Boolean(data?.aceptaSena),
    senaPct: Number(data?.senaPct ?? 0),

    colorPrimario: String(data?.colorPrimario || "#4ea1ff"),
    colorSecundario: String(data?.colorSecundario || "#7c4dff"),

    nombrePublico: String(data?.nombrePublico || cleanSlug),
    textoPersonalizado: String(data?.textoPersonalizado || "Reservá tu turno en segundos."),
    logoUrl: String(data?.logoUrl || ""),

    alias: String(data?.alias || ""),
    cbu: String(data?.cbu || ""),

    servicios: data?.servicios && typeof data.servicios === "object" ? data.servicios : {},

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, payload, { merge: false });
}

export async function superUpdateAgenda(slug, patch) {
  const cleanSlug = String(slug || "").trim();
  if (!cleanSlug) throw new Error("Slug requerido.");

  const ref = doc(db, "agendas", cleanSlug);

  const payload = {
    ...patch,
    admin:
      patch?.admin !== undefined
        ? String(patch.admin || "").trim().toLowerCase() || null
        : undefined,
    updatedAt: serverTimestamp(),
  };

  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  await updateDoc(ref, payload);
}
