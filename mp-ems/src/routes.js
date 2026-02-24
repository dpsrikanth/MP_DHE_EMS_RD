import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Register from "./pages/Register";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
     <Route path="/register" element={<Register />} />
    </Routes>
  );
};

export default AppRoutes;