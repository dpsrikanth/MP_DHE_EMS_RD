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

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes with Navbar */}
        <Route path="/dashboard" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Dashboard />} />
          </>
        } />
        <Route path="/viewStudentsAndUniversitys" element={
          <>
            <Navbar />
            <ViewStudentsAndUniversities/>
          </>
        } />
        <Route path="/universities" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Universities />} />
          </>
        } />
        <Route path="/colleges" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Colleges />} />
          </>
        } />
        <Route path="/programs" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Programs />} />
          </>
        } />
        <Route path="/academic-years" element={
          <>
            <Navbar />
            <ProtectedRoute element={<AcademicYears />} />
          </>
        } />
        <Route path="/semesters" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Semesters />} />
          </>
        } />
        <Route path="/subjects" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Subjects />} />
          </>
        } />
        <Route path="/teachers" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Teachers />} />
          </>
        } />
        <Route path="/students" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Students />} />
          </>
        } />
        <Route path="/exams" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Exams />} />
          </>
        } />
        <Route path="/marks" element={
          <>
            <Navbar />
            <ProtectedRoute element={<Marks />} />
          </>
        } />
      </Routes>
    </>
  );
};

export default AppRoutes;