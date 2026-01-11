// src/components/SuperServiciosEditor.jsx
import React, { useMemo, useState } from "react";
import { Card, Input, Button, Select } from "./Ui.jsx";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

export default function SuperServiciosEditor({ value, onChange }) {
  const map = value && typeof value === "object" ? value : {};
  const list = useMemo(() => {
    return Object.entries(map).map(([key, v]) => ({ key, ...(v || {}) }));
  }, [map]);

  const [newKey, setNewKey] = useState("");

  function updateService(key, patch) {
    const next = clone(map);
    next[key] = { ...(next[key] || {}), ...patch };
    onChange?.(next);
  }

  function removeService(key) {
    const next = clone(map);
    delete next[key];
    onChange?.(next);
  }

  function addService() {
    const k = String(newKey || "").trim();
    if (!k) return;

    const next = clone(map);
    if (next[k]) return;

    next[k] = {
      activo: true,
      nombre: k,
      precio: 0,
      duracionMin: 60,
    };
    onChange?.(next);
    setNewKey("");
  }

  return (
    <Card>
      <div className="h2">Servicios</div>
      <div className="muted">
        Map <b>servicios</b> configurable por rubro. El usuario ve esto y el precio sale de acá.
      </div>
      <hr className="hr" />

      <div className="row" style={{ gap: 8, alignItems: "flex-end" }}>
        <div className="col">
          <label className="label">Nuevo servicio (key)</label>
          <Input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="corte" />
        </div>
        <div>
          <Button className="success" type="button" onClick={addService}>
            + Agregar
          </Button>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {!list.length ? (
        <div className="muted">No hay servicios todavía.</div>
      ) : (
        <div className="list">
          {list.map((s) => (
            <div key={s.key} className="listItem" style={{ alignItems: "flex-start" }}>
              <div className="listLeft" style={{ width: "100%" }}>
                <div className="listTitle">{s.key}</div>

                <div className="formGrid2" style={{ marginTop: 8 }}>
                  <div className="formGroup">
                    <label className="label">Nombre</label>
                    <Input
                      value={s.nombre || ""}
                      onChange={(e) => updateService(s.key, { nombre: e.target.value })}
                    />
                  </div>

                  <div className="formGroup">
                    <label className="label">Activo</label>
                    <Select
                      value={s.activo ? "si" : "no"}
                      onChange={(e) => updateService(s.key, { activo: e.target.value === "si" })}
                    >
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                    </Select>
                  </div>
                </div>

                <div className="formGrid2">
                  <div className="formGroup">
                    <label className="label">Precio</label>
                    <Input
                      value={String(s.precio ?? 0)}
                      onChange={(e) =>
                        updateService(s.key, { precio: Number(String(e.target.value || "0")) })
                      }
                      placeholder="12000"
                    />
                  </div>

                  <div className="formGroup">
                    <label className="label">Duración (min)</label>
                    <Input
                      value={String(s.duracionMin ?? 60)}
                      onChange={(e) =>
                        updateService(s.key, { duracionMin: Number(String(e.target.value || "60")) })
                      }
                      placeholder="60"
                    />
                  </div>
                </div>
              </div>

              <div className="listRight" style={{ alignItems: "flex-end" }}>
                <Button className="danger" type="button" onClick={() => removeService(s.key)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
