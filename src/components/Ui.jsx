import React from "react";

export function Card({ children, ...props }) {
  return <div className="card" {...props}>{children}</div>;
}

export function Input(props) {
  return <input className="input" {...props} />;
}

export function Select(props) {
  return <select className="select" {...props} />;
}

export function Textarea(props) {
  return <textarea className="textarea" {...props} />;
}

export function Button({ className = "", ...props }) {
  return <button className={`btn ${className}`} {...props} />;
}

export function Badge({ variant = "", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}
