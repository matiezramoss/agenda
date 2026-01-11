// src/components/Ui.jsx
import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

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

export function Button({
  className = "",
  type = "button",
  disabled = false,
  children,
  ...props
}) {
  return (
    <button type={type} disabled={disabled} className={`btn ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Badge({ variant = "", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
