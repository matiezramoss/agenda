// src/components/BrandShell.jsx
import React, { useMemo } from "react";

export default function BrandShell({ agenda, loading, right = null, children }) {
  const brand = useMemo(() => {
    const primary = agenda?.colorPrimario || "#4ea1ff";
    const secondary = agenda?.colorSecundario || "#7c4dff";
    return { primary, secondary };
  }, [agenda]);

  const style = useMemo(
    () => ({
      // Tus variables (las usa tu CSS)
      "--brand": brand.primary,
      "--brand2": brand.secondary,

      // Puente para Bootstrap (cuando uses btn-primary, text-primary, etc.)
      "--bs-primary": brand.primary,
      "--bs-secondary": brand.secondary,

      // (Opcional) si después agregás variables visuales extra en BDD
      // "--bg": agenda?.bgColor || undefined,
      // "--card": agenda?.cardColor || undefined,
      // "--text": agenda?.textColor || undefined,
      // "--muted": agenda?.mutedColor || undefined,
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
