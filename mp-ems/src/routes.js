import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Navbar from "./components/Navbar";
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
import Policies from "./pages/Policies";

import Layout from "./components/Layout";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Routes wrapped in common Layout */}
      <Route path="/dashboard" element={<Layout><ProtectedRoute element={<Dashboard />} /></Layout>} />
      <Route path="/viewStudentsAndUniversitys" element={<Layout><ViewStudentsAndUniversities /></Layout>} />
      <Route path="/universities" element={<Layout><ProtectedRoute element={<Universities />} /></Layout>} />
      <Route path="/colleges" element={<Layout><ProtectedRoute element={<Colleges />} /></Layout>} />
      <Route path="/programs" element={<Layout><ProtectedRoute element={<Programs />} /></Layout>} />
      <Route path="/academic-years" element={<Layout><ProtectedRoute element={<AcademicYears />} /></Layout>} />
      <Route path="/semesters" element={<Layout><ProtectedRoute element={<Semesters />} /></Layout>} />
      <Route path="/subjects" element={<Layout><ProtectedRoute element={<Subjects />} /></Layout>} />
      <Route path="/teachers" element={<Layout><ProtectedRoute element={<Teachers />} /></Layout>} />
      <Route path="/students" element={<Layout><ProtectedRoute element={<Students />} /></Layout>} />
      <Route path="/exams" element={<Layout><ProtectedRoute element={<Exams />} /></Layout>} />
      <Route path="/marks" element={<Layout><ProtectedRoute element={<Marks />} /></Layout>} />
      <Route path="/policies" element={<Layout><ProtectedRoute element={<Policies />} /></Layout>} />
    </Routes>
  );
};

export default AppRoutes;