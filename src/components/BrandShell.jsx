// src/components/BrandShell.jsx
import React, { useEffect, useMemo } from "react";

export default function BrandShell({ agenda, loading, right = null, children }) {
  const brand = useMemo(() => {
    const primary = agenda?.colorPrimario || "#4ea1ff";
    const secondary = agenda?.colorSecundario || "#7c4dff";
    return { primary, secondary };
  }, [agenda]);

  // ✅ SETEA TAMBIÉN EN :root para que el BODY (fondo fijo) tome los colores
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--brand", brand.primary);
    root.style.setProperty("--brand2", brand.secondary);
    root.style.setProperty("--bs-primary", brand.primary);
    root.style.setProperty("--bs-secondary", brand.secondary);

    // ✅ (Opcional pro) pinta la barra del navegador en mobile
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", brand.primary);

    return () => {
      // no limpiamos para evitar “flash” al navegar entre rutas
    };
  }, [brand.primary, brand.secondary]);

  const style = useMemo(
    () => ({
      // Tus variables (las usa tu CSS dentro del shell)
      "--brand": brand.primary,
      "--brand2": brand.secondary,

      // Puente para Bootstrap
      "--bs-primary": brand.primary,
      "--bs-secondary": brand.secondary,
    }),
    [brand]
  );

  return (
    <div style={style}>
      <div className="container">
        <div className="topbar">
          <div className="brandBox">
            {agenda?.logoUrl ? (
              <img className="logo" src={agenda.logoUrl} alt="logo" />
            ) : (
              <div className="logo" />
            )}

            <div>
              <div className="h1" style={{ marginBottom: 2 }}>
                {agenda?.nombrePublico || "Turnos"}
              </div>
              <div className="muted">
                {agenda?.textoPersonalizado || "Reservá tu turno en segundos."}
              </div>
            </div>
          </div>

          {right}
        </div>

        <div style={{ height: 12 }} />

        {loading ? (
          <div className="card">
            <div className="muted">Cargando...</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
