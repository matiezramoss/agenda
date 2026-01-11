import React, { useEffect, useMemo, useState } from "react";
import { Card, Input, Button, Textarea, Select } from "./Ui.jsx";
import SuperServiciosEditor from "./SuperServiciosEditor.jsx";

function toNum(v, def = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : def;
}

export default function SuperAgendaForm({ mode, agenda, onCreate, onSave }) {
  const isCreate = mode === "create";

  const [slug, setSlug] = useState("");
  const [nombrePublico, setNombrePublico] = useState("");
  const [textoPersonalizado, setTextoPersonalizado] = useState("");

  const [admin, setAdmin] = useState("");

  const [openHHMM, setOpenHHMM] = useState("08:00");
  const [closeHHMM, setCloseHHMM] = useState("20:00");
  const [stepMin, setStepMin] = useState("30");
  const [capacidadSimultanea, setCapacidadSimultanea] = useState("1");
  const [tiempoTurno, setTiempoTurno] = useState("60");

  const [aceptaSena, setAceptaSena] = useState(false);
  const [senaPct, setSenaPct] = useState("0");

  const [colorPrimario, setColorPrimario] = useState("#4ea1ff");
  const [colorSecundario, setColorSecundario] = useState("#7c4dff");
  const [logoUrl, setLogoUrl] = useState("");

  const [alias, setAlias] = useState("");
  const [cbu, setCbu] = useState("");

  const [servicios, setServicios] = useState({});

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setMsg("");

    if (!agenda) {
      setSlug("");
      setNombrePublico("");
      setTextoPersonalizado("");

      setAdmin("");

      setOpenHHMM("08:00");
      setCloseHHMM("20:00");
      setStepMin("30");
      setCapacidadSimultanea("1");
      setTiempoTurno("60");

      setAceptaSena(false);
      setSenaPct("0");

      setColorPrimario("#4ea1ff");
      setColorSecundario("#7c4dff");
      setLogoUrl("");

      setAlias("");
      setCbu("");

      setServicios({});
      return;
    }

    setSlug(agenda.slug || "");
    setNombrePublico(agenda.nombrePublico || agenda.slug || "");
    setTextoPersonalizado(agenda.textoPersonalizado || "");

    setAdmin(agenda.admin || "");

    setOpenHHMM(agenda.openHHMM || "08:00");
    setCloseHHMM(agenda.closeHHMM || "20:00");
    setStepMin(String(agenda.stepMin ?? 30));
    setCapacidadSimultanea(String(agenda.capacidadSimultanea ?? 1));
    setTiempoTurno(String(agenda.tiempoTurno ?? 60));

    setAceptaSena(Boolean(agenda.aceptaSena));
    setSenaPct(String(agenda.senaPct ?? 0));

    setColorPrimario(agenda.colorPrimario || "#4ea1ff");
    setColorSecundario(agenda.colorSecundario || "#7c4dff");
    setLogoUrl(agenda.logoUrl || "");

    setAlias(agenda.alias || "");
    setCbu(agenda.cbu || "");

    setServicios(agenda.servicios && typeof agenda.servicios === "object" ? agenda.servicios : {});
  }, [agenda]);

  const payload = useMemo(() => {
    return {
      nombrePublico: String(nombrePublico || "").trim(),
      textoPersonalizado: String(textoPersonalizado || "").trim(),

      admin: String(admin || "").trim().toLowerCase(),

      openHHMM: String(openHHMM || "08:00"),
      closeHHMM: String(closeHHMM || "20:00"),
      stepMin: toNum(stepMin, 30),
      capacidadSimultanea: toNum(capacidadSimultanea, 1),
      tiempoTurno: toNum(tiempoTurno, 60),

      aceptaSena: Boolean(aceptaSena),
      senaPct: toNum(senaPct, 0),

      colorPrimario: String(colorPrimario || "#4ea1ff"),
      colorSecundario: String(colorSecundario || "#7c4dff"),
      logoUrl: String(logoUrl || ""),

      alias: String(alias || ""),
      cbu: String(cbu || ""),

      servicios: servicios && typeof servicios === "object" ? servicios : {},
    };
  }, [
    nombrePublico,
    textoPersonalizado,
    admin,
    openHHMM,
    closeHHMM,
    stepMin,
    capacidadSimultanea,
    tiempoTurno,
    aceptaSena,
    senaPct,
    colorPrimario,
    colorSecundario,
    logoUrl,
    alias,
    cbu,
    servicios,
  ]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (isCreate) {
      const s = String(slug || "").trim();
      if (!s) {
        setMsg("Slug requerido.");
        return;
      }
    } else {
      if (!agenda?.slug) return;
    }

    setBusy(true);
    try {
      if (isCreate) {
        await onCreate?.(String(slug).trim(), payload);
        setMsg("Agenda creada ✅");
      } else {
        await onSave?.(agenda.slug, payload);
        setMsg("Cambios guardados ✅");
      }
    } catch (ex) {
      setMsg(ex?.message || "Error guardando");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <div className="h2">{isCreate ? "Crear agenda" : "Editar agenda"}</div>
      <div className="muted">
        {isCreate ? "Creás todo desde acá, sin tocar Firestore manual." : `Editando: ${agenda?.slug || ""}`}
      </div>
      <hr className="hr" />

      <form onSubmit={submit}>
        {isCreate ? (
          <>
            <label className="label">Slug (ID del doc) *</label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="barberiapepe"
            />
            <div style={{ height: 10 }} />
          </>
        ) : null}

        <label className="label">Nombre público</label>
        <Input value={nombrePublico} onChange={(e) => setNombrePublico(e.target.value)} />

        <div style={{ height: 10 }} />

        <label className="label">Texto personalizado</label>
        <Textarea value={textoPersonalizado} onChange={(e) => setTextoPersonalizado(e.target.value)} />

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <label className="label">Admin email (owner)</label>
        <Input value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder="owner@mail.com" />

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <div className="formGrid2">
          <div className="formGroup">
            <label className="label">Abre (HH:MM)</label>
            <Input value={openHHMM} onChange={(e) => setOpenHHMM(e.target.value)} />
          </div>
          <div className="formGroup">
            <label className="label">Cierra (HH:MM)</label>
            <Input value={closeHHMM} onChange={(e) => setCloseHHMM(e.target.value)} />
          </div>
        </div>

        <div className="formGrid2">
          <div className="formGroup">
            <label className="label">Step (min)</label>
            <Input value={stepMin} onChange={(e) => setStepMin(e.target.value)} />
          </div>
          <div className="formGroup">
            <label className="label">Cupo simultáneo</label>
            <Input value={capacidadSimultanea} onChange={(e) => setCapacidadSimultanea(e.target.value)} />
          </div>
        </div>

        <div className="formGroup">
          <label className="label">Tiempo turno default (fallback) (min)</label>
          <Input value={tiempoTurno} onChange={(e) => setTiempoTurno(e.target.value)} />
          <div className="muted small" style={{ marginTop: 6 }}>
            Si un servicio no define duración, se usa esto.
          </div>
        </div>

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <div className="formGrid2">
          <div className="formGroup">
            <label className="label">Acepta seña</label>
            <Select
              value={aceptaSena ? "si" : "no"}
              onChange={(e) => setAceptaSena(e.target.value === "si")}
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </Select>
          </div>

          <div className="formGroup">
            <label className="label">Seña %</label>
            <Input value={senaPct} onChange={(e) => setSenaPct(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <div className="formGrid2">
          <div className="formGroup">
            <label className="label">Color primario</label>
            <Input value={colorPrimario} onChange={(e) => setColorPrimario(e.target.value)} />
          </div>
          <div className="formGroup">
            <label className="label">Color secundario</label>
            <Input value={colorSecundario} onChange={(e) => setColorSecundario(e.target.value)} />
          </div>
        </div>

        <div className="formGroup">
          <label className="label">Logo URL</label>
          <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </div>

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <div className="formGrid2">
          <div className="formGroup">
            <label className="label">Alias transferencia</label>
            <Input value={alias} onChange={(e) => setAlias(e.target.value)} />
          </div>
          <div className="formGroup">
            <label className="label">CBU</label>
            <Input value={cbu} onChange={(e) => setCbu(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />
        <hr className="hr" />

        <SuperServiciosEditor value={servicios} onChange={setServicios} />

        {msg ? <div style={{ marginTop: 12, fontWeight: 700 }}>{msg}</div> : null}

        <div style={{ height: 12 }} />

        {/* ✅ CLAVE: type="submit" */}
        <Button type="submit" className="primary" disabled={busy}>
          {busy ? "Guardando..." : isCreate ? "Crear agenda" : "Guardar cambios"}
        </Button>
      </form>
    </Card>
  );
}
