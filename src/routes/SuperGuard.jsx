// src/routes/SuperGuard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { getSuperAdminSelf } from "../lib/firestore.js";

export default function SuperGuard({ children }) {
  const nav = useNavigate();
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) {
          setOk(false);
          setLoading(false);
          nav("/super/login", { replace: true });
          return;
        }

        // ✅ valida por Firestore: /superadmins/{uid}
        const docSelf = await getSuperAdminSelf();

        if (!docSelf) {
          await signOut(auth);
          setOk(false);
          setLoading(false);
          nav("/super/login", { replace: true });
          return;
        }

        setOk(true);
        setLoading(false);
      } catch {
        try { await signOut(auth); } catch {}
        setOk(false);
        setLoading(false);
        nav("/super/login", { replace: true });
      }
    });

    return () => unsub?.();
  }, [nav]);

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="muted">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!ok) return null;
  return children;
}
