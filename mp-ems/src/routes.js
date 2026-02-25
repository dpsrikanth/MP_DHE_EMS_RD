import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ViewStudentsAndUniversities from "./pages/viewStudentsAndUniversitys"
import ProtectedRoute from "./components/ProtectedRoute";
import Universities from "./pages/Universities";
import Colleges from "./pages/Colleges";
import Programs from "./pages/Programs";
import AcademicYears from "./pages/AcademicYears";
import Semesters from "./pages/Semesters";
import Subjects from "./pages/Subjects";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Exams from "./pages/Exams";
import Marks from "./pages/Marks";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/viewStudentsAndUniversitys" element={<ViewStudentsAndUniversities/>} />
      <Route path="/universities" element={<ProtectedRoute element={<Universities />} />} />
      <Route path="/colleges" element={<ProtectedRoute element={<Colleges />} />} />
      <Route path="/programs" element={<ProtectedRoute element={<Programs />} />} />
      <Route path="/academic-years" element={<ProtectedRoute element={<AcademicYears />} />} />
      <Route path="/semesters" element={<ProtectedRoute element={<Semesters />} />} />
      <Route path="/subjects" element={<ProtectedRoute element={<Subjects />} />} />
      <Route path="/teachers" element={<ProtectedRoute element={<Teachers />} />} />
      <Route path="/students" element={<ProtectedRoute element={<Students />} />} />
      <Route path="/exams" element={<ProtectedRoute element={<Exams />} />} />
      <Route path="/marks" element={<ProtectedRoute element={<Marks />} />} />
    </Routes>
  );
};

export default AppRoutes;