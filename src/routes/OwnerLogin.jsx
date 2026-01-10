// src/routes/OwnerLogin.jsx
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
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      nav("/owner", { replace: true }); // 🔑 se resuelve por admin-email
    } catch {
      setErr("Email o contraseña incorrectos.");
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
            autoComplete="email"
          />

          <div style={{ height: 12 }} />

          <label className="label">Contraseña</label>
          <Input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            autoComplete="current-password"
          />

          {err && <div style={{ marginTop: 12, color: "#ef4444" }}>{err}</div>}

          <div style={{ height: 16 }} />

          <Button className="success" disabled={busy}>
            {busy ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
