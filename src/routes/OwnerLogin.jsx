import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { Card, Input, Button } from "../components/Ui.jsx";

export default function OwnerLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);

    try {
      const em = String(email || "").trim().toLowerCase();
      if (!em || !pass) {
        setErr("Completá email y contraseña.");
        return;
      }

      await signInWithEmailAndPassword(auth, em, pass);

      // si loguea OK, OwnerDashboard resuelve agenda por admin-email
      nav("/owner", { replace: true });
    } catch (ex) {
      // 👇 ahora ves el error real
      const code = ex?.code || "";
      if (code === "auth/user-not-found") setErr("Ese email no existe en Auth.");
      else if (code === "auth/wrong-password") setErr("Contraseña incorrecta.");
      else if (code === "auth/invalid-email") setErr("Email inválido.");
      else setErr(ex?.message || "No se pudo ingresar.");
      console.error("OwnerLogin error:", ex);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <Card>
        <div className="h1">Ingreso propietario</div>
        <div className="muted">Accedé para administrar tu agenda.</div>
        <hr className="hr" />

        <form onSubmit={onLogin}>
          <label className="label">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@mail.com"
          />

          <div style={{ height: 12 }} />

          <label className="label">Contraseña</label>
          <Input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />

          {err ? (
            <div style={{ marginTop: 12, color: "#ef4444", fontWeight: 700 }}>
              {err}
            </div>
          ) : null}

          <div style={{ height: 16 }} />

          <Button className="success" type="submit" disabled={busy}>
            {busy ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
