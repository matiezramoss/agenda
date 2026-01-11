// src/routes/SuperDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { Card, Button } from "../components/Ui.jsx";
import SuperGuard from "./SuperGuard.jsx";
import { streamAllAgendas, superCreateAgenda, superUpdateAgenda } from "../lib/firestore.js";
import SuperAgendaForm from "../components/SuperAgendaForm.jsx";

export default function SuperDashboard() {
  const [agendas, setAgendas] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const unsub = streamAllAgendas(setAgendas);
    return () => unsub?.();
  }, []);

  const selected = useMemo(() => {
    if (!selectedSlug) return null;
    return agendas.find((a) => a.slug === selectedSlug) || null;
  }, [agendas, selectedSlug]);

  async function doLogout() {
    await signOut(auth);
    window.location.href = "/super/login";
  }

  return (
    <SuperGuard>
      <div className="container">
        <div className="topbar">
          <div className="brandBox">
            <div className="logo" />
            <div>
              <div className="h1" style={{ marginBottom: 2 }}>Super Admin</div>
              <div className="muted">Crear/editar agendas + servicios + admin email</div>
            </div>
          </div>

          <div className="row" style={{ alignItems: "center" }}>
            <Button className="btn" onClick={doLogout}>Salir</Button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        <div className="row">
          <div className="col">
            <Card>
              <div className="h2">Agendas</div>
              <div className="muted">Click para editar. “Nueva agenda” para crear.</div>
              <hr className="hr" />

              <div className="btnRow" style={{ marginBottom: 10 }}>
                <Button
                  className="primary"
                  onClick={() => {
                    setCreating(true);
                    setSelectedSlug("");
                  }}
                >
                  + Nueva agenda
                </Button>
              </div>

              {!agendas.length ? (
                <div className="muted">No hay agendas.</div>
              ) : (
                <div className="list">
                  {agendas.map((a) => (
                    <div
                      key={a.slug}
                      className="listItem"
                      style={{
                        cursor: "pointer",
                        border:
                          selectedSlug === a.slug ? "2px solid var(--brand)" : undefined,
                      }}
                      onClick={() => {
                        setCreating(false);
                        setSelectedSlug(a.slug);
                      }}
                    >
                      <div className="listLeft">
                        <div className="listTitle">{a.nombrePublico || a.slug}</div>
                        <div className="listSub">slug: {a.slug}</div>
                        <div className="listSub">admin: {a.admin || "—"}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="col">
            <SuperAgendaForm
              mode={creating ? "create" : "edit"}
              agenda={creating ? null : selected}
              onCreate={async (slug, data) => {
                await superCreateAgenda(slug, data);
                setCreating(false);
                setSelectedSlug(slug);
              }}
              onSave={async (slug, patch) => {
                await superUpdateAgenda(slug, patch);
              }}
            />
          </div>
        </div>
      </div>
    </SuperGuard>
  );
}
