// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicAgenda from "./routes/PublicAgenda.jsx";
import OwnerLogin from "./routes/OwnerLogin.jsx";
import OwnerDashboard from "./routes/OwnerDashboard.jsx";
import NotFound from "./routes/NotFound.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/agenda/demo" replace />} />
      <Route path="/agenda/:slug" element={<PublicAgenda />} />

      <Route path="/owner/login" element={<OwnerLogin />} />
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/owner/:slug" element={<OwnerDashboard />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
