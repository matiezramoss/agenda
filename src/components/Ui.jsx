import React from "react";

/* ===========================
   Card
   =========================== */
export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

/* ===========================
   Inputs
   =========================== */
export function Input({ className = "", ...props }) {
  return <input className={`input ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className = "", ...props }) {
  return <textarea className={`textarea ${className}`} {...props} />;
}

/* ===========================
   Button
   className esperadas:
   - primary
   - success
   - danger
   - ghost (opcional)
   =========================== */
export function Button({
  className = "",
  type = "button",
  disabled = false,
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`btn ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ===========================
   Badge
   variants:
   - ok
   - warn
   - danger (opcional)
   - soft (opcional)
   =========================== */
export function Badge({ variant = "", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
