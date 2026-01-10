// src/routes/OwnerDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import BrandShell from "../components/BrandShell.jsx";
import OwnerRequests from "../components/OwnerRequests.jsx";
import OwnerDayAgenda from "../components/OwnerDayAgenda.jsx";
import OwnerInternalBlock from "../components/OwnerInternalBlock.jsx";
import DayPicker from "../components/DayPicker.jsx";
import { streamAgenda, listAgendasForAdmin } from "../lib/firestore.js";
import { ymdLocal } from "../lib/time.js";

export default function OwnerDashboard() {
  const { slug: slugParam } = useParams();
  const nav = useNavigate();

  const [user, setUser] = useState(null);
  const [slug, setSlug] = useState(slugParam || null);
  const [agenda, setAgenda] = useState(null);
  const [fechaYmd, setFechaYmd] = useState(ymdLocal());
  const [loading, setLoading] = useState(true);

  // ✅ cuando cambia la URL, actualizamos el slug local
  useEffect(() => {
    setSlug(slugParam || null);
  }, [slugParam]);

  // 🔐 auth + resolver slug si estás en /owner (sin :slug)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        nav("/owner/login", { replace: true });
        return;
      }

      setUser(u);

      if (!slugParam) {
        try {
          setLoading(true);
          const agendas = await listAgendasForAdmin(u.email);
          if (!agendas.length) {
            await signOut(auth);
            alert("Este usuario no es admin de ninguna agenda.");
            nav("/owner/login", { replace: true });
            return;
          }

          // ✅ si querés selector cuando hay varias, lo hacemos después
          nav(`/owner/${agendas[0].slug}`, { replace: true });
        } catch (e) {
          await signOut(auth);
          nav("/owner/login", { replace: true });
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsub();
  }, [nav, slugParam]);

  // 📡 agenda (se subscribe cuando hay slug)
  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    const unsub = streamAgenda(slug, (a) => {
      setAgenda(a);
      setLoading(false);
    });

    return () => unsub?.();
  }, [slug]);

  const title = useMemo(() => agenda?.nombrePublico || slug, [agenda, slug]);

  async function doLogout() {
    await signOut(auth);
    nav("/owner/login", { replace: true });
  }

  // si estás en /owner sin slug todavía, mostramos loader (no null)
  if (!slug) {
    return (
      <BrandShell loading={true} agenda={null}>
        <div className="card">
          <div className="muted">Cargando panel...</div>
        </div>
      </BrandShell>
    );
  }

  return (
    <BrandShell
      loading={loading}
      agenda={agenda}
      right={
        <div className="row" style={{ alignItems: "center" }}>
          <Link className="pill" to={`/agenda/${slug}`}>
            Ver agenda pública
          </Link>
          <button className="btn" onClick={doLogout}>
            Salir
          </button>
        </div>
      }
    >
      {!user ? null : (
        <div className="row">
          <div className="col">
            <div className="card">
              <div className="h2">Panel owner — {title}</div>
              <div className="muted">
                Pendientes NO bloquean. Confirmadas e internas SÍ bloquean.
              </div>
              <hr className="hr" />
              <label className="label">Día</label>
              <DayPicker value={fechaYmd} onChange={setFechaYmd} />
            </div>

            <div style={{ height: 12 }} />

            <OwnerDayAgenda slug={slug} fechaYmd={fechaYmd} agenda={agenda} />

            <div style={{ height: 12 }} />

            <OwnerInternalBlock slug={slug} fechaYmd={fechaYmd} agenda={agenda} />
          </div>

          <div className="col">
            <OwnerRequests slug={slug} agenda={agenda} />
          </div>
        </div>
      )}
    </BrandShell>
  );
}
