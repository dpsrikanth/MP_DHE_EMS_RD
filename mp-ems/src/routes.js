import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ViewStudentsAndUniversities from "./pages/viewStudentsAndUniversitys"


const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/dashboard" element={<Dashboard />} />
     <Route path="/register" element={<Register />} />
     <Route path="/viewStudentsAndUniversitys" element={<ViewStudentsAndUniversities/>} />
     
    </Routes>
  );
};

export default AppRoutes;