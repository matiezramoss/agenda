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

async function copyToClipboard(text) {
  const t = String(text ?? "").trim();
  if (!t) return false;

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(t);
      return true;
    }
  } catch {
    // fallback abajo
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = t;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

function isValidEmail(v) {
  const s = String(v || "").trim();
  // simple y efectiva (sin overkill)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
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

  const [copiedKey, setCopiedKey] = useState(""); // "alias" | "cbu" | "datos"
  const [copyErr, setCopyErr] = useState("");

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

  const datosTransfer = useMemo(() => {
    const raw = String(agenda?.datostransferencia || "").trim();
    return raw ? raw.toUpperCase() : "";
  }, [agenda?.datostransferencia]);

  const hasAlias = Boolean(String(agenda?.alias || "").trim());
  const hasCbu = Boolean(String(agenda?.cbu || "").trim());
  const hasDatos = Boolean(String(agenda?.datostransferencia || "").trim());

  const showPagoBox = Boolean(hasAlias || hasCbu || hasDatos);

  async function onCopy(key, value) {
    setCopyErr("");
    setCopiedKey("");

    const ok = await copyToClipboard(value);
    if (!ok) {
      setCopyErr("No se pudo copiar. Copialo manualmente.");
      return;
    }

    setCopiedKey(key);
    window.clearTimeout(onCopy._t);
    onCopy._t = window.setTimeout(() => setCopiedKey(""), 1400);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    // ✅ VALIDACIÓN EXTRA (por si el browser no valida, o por input custom)
    const nom = String(nombre || "").trim();
    const ape = String(apellido || "").trim();
    const em = String(email || "").trim();
    const wa = String(whatsapp || "").trim();
    const msg = String(mensaje || "").trim();

    if (!canSubmit) {
      setErr("Elegí un horario disponible para continuar.");
      return;
    }
    if (!nom) {
      setErr("El nombre es obligatorio.");
      return;
    }
    if (!ape) {
      setErr("El apellido es obligatorio.");
      return;
    }
    if (!em) {
      setErr("El email es obligatorio.");
      return;
    }
    if (!isValidEmail(em)) {
      setErr("Ingresá un email válido.");
      return;
    }
    if (!wa) {
      setErr("El WhatsApp es obligatorio.");
      return;
    }
    if (!msg) {
      setErr("El mensaje es obligatorio.");
      return;
    }

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

        nombre: nom,
        apellido: ape,
        email: em,
        whatsapp: wa,
        mensaje: msg,
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
          {minutesToHHMM(selectedRange.endMin)} · ${money(montoTotal)}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <Input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <Input
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          required
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          required
        />
        <Input
          placeholder="WhatsApp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          inputMode="tel"
          required
        />
        <Textarea
          placeholder="Mensaje"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          required
        />

        <label className="label">Forma de pago *</label>
        <Select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)} required>
          <option value="total">Pago total — ${money(montoTotal)}</option>
          {agenda?.aceptaSena && (
            <option value="sena">
              Seña ({agenda.senaPct}%) — ${money(montoSena)}
            </option>
          )}
        </Select>

        {/* ✅ DATOS PARA TRANSFERIR (con copiar) */}
        {showPagoBox ? (
          <div className="payBox">
            <div className="payHeader">
              <div className="payTitle">DATOS PARA TRANSFERIR</div>

              <div className="payAmount">
                {tipoPago === "sena" ? (
                  <>
                    <span className="payPill">
                      SEÑA: <strong>${money(montoSena)}</strong>
                    </span>
                    {resto != null ? (
                      <span className="payPill soft">
                        RESTA: <strong>${money(resto)}</strong>
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="payPill">
                    TOTAL: <strong>${money(montoTotal)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* ✅ TITULAR / DATOS TRANSFERENCIA (ARRIBA DEL CBU) */}
            {hasDatos ? (
              <div className="copyRow">
                <div className="copyLeft">
                  <div className="copyLabel">CUENTA A NOMBRE DE</div>
                  <div className="copyValue mono">{datosTransfer}</div>
                </div>

                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => onCopy("datos", datosTransfer)}
                >
                  {copiedKey === "datos" ? "✅ COPIADO" : "COPIAR"}
                </button>
              </div>
            ) : null}

            {/* Alias */}
            {hasAlias ? (
              <div className="copyRow">
                <div className="copyLeft">
                  <div className="copyLabel">ALIAS</div>
                  <div className="copyValue mono">{String(agenda.alias).trim()}</div>
                </div>

                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => onCopy("alias", String(agenda.alias).trim())}
                >
                  {copiedKey === "alias" ? "✅ COPIADO" : "COPIAR"}
                </button>
              </div>
            ) : null}

            {/* CBU */}
            {hasCbu ? (
              <div className="copyRow">
                <div className="copyLeft">
                  <div className="copyLabel">CBU</div>
                  <div className="copyValue mono">{String(agenda.cbu).trim()}</div>
                </div>

                <button
                  type="button"
                  className="copyBtn"
                  onClick={() => onCopy("cbu", String(agenda.cbu).trim())}
                >
                  {copiedKey === "cbu" ? "✅ COPIADO" : "COPIAR"}
                </button>
              </div>
            ) : null}

            {copyErr ? <div className="copyError">{copyErr}</div> : null}

            <div className="payHint">
              Transferí y después confirmás la solicitud (el dueño te aprueba el turno).
            </div>
          </div>
        ) : null}

        {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
        {ok && <div style={{ color: "#166534" }}>{ok}</div>}

        <Button className="primary" type="submit" id="btnConf" disabled={!canSubmit || busy}>
          Confirmar reserva
        </Button>
      </form>
    </Card>
  );
}
