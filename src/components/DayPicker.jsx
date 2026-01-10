import React from "react";
import { Input } from "./Ui.jsx";

export default function DayPicker({ value, onChange }) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    />
  );
}
