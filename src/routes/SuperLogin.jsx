import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { Card, Input, Button } from "../components/Ui.jsx";

function prettyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "Email inválido.";
    case "auth/user-not-found":
      return "Ese usuario no existe en Authentication.";
    case "auth/wrong-password":
      return "Contraseña incorrecta.";
    case "auth/invalid-credential":
      return "Credenciales inválidas (email/contraseña).";
    case "auth/operation-not-allowed":
      return "Email/Password no está habilitado en Firebase Auth.";
    case "auth/network-request-failed":
      return "Error de red. Revisá conexión / AdBlock / firewall.";
    default:
      return null;
  }
}

export default function SuperLogin() {
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
      const em = String(email || "").trim();
      const pw = String(pass || "");

      await signInWithEmailAndPassword(auth, em, pw);

      // Si el login salió bien, el guard decide si sos superadmin o no.
      nav("/super", { replace: true });
    } catch (ex) {
      console.error("SUPER LOGIN ERROR:", ex);
      const code = ex?.code || "";
      const msg = prettyAuthError(code);

      // Si es el 400 que ves, casi siempre viene por config/env
      if (!msg) {
        setErr(ex?.message || "Error al iniciar sesión.");
      } else {
        setErr(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420 }}>
      <Card>
        <div className="h1">Super Admin</div>
        <div className="muted">Acceso privado (Firebase Auth + permisos por colección).</div>
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

          {err && <div style={{ marginTop: 12, color: "#ef4444", fontWeight: 700 }}>{err}</div>}

          <div style={{ height: 16 }} />

          <Button className="success" type="submit" disabled={busy}>
            {busy ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
