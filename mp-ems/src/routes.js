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
import Policies from "./pages/Policies";
import Departments from "./pages/Departments";
import PolicyConfig from "./pages/CollegeAdmin/PolicyConfig";
import MarksConfig from "./pages/CollegeAdmin/MarksConfig";
import FacultyAssignment from "./pages/CollegeAdmin/FacultyAssignment";
import MarksApproval from "./pages/CollegeAdmin/MarksApproval";
import MarksEntry from "./pages/Faculty/MarksEntry";
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
      <Route path="/departments" element={<Layout><ProtectedRoute element={<Departments />} /></Layout>} />

      {/* College Admin Routes */}
      <Route path="/college-admin/dashboard" element={<Layout><ProtectedRoute element={<div className="p-6"><h1 className="text-2xl font-bold">College Admin Dashboard</h1><p>Welcome to College Admin Panel.</p></div>} /></Layout>} />
      <Route path="/college-admin/policies" element={<Layout><ProtectedRoute element={<PolicyConfig />} /></Layout>} />
      <Route path="/college-admin/marks-config" element={<Layout><ProtectedRoute element={<MarksConfig />} /></Layout>} />
      <Route path="/college-admin/faculty-assign" element={<Layout><ProtectedRoute element={<FacultyAssignment />} /></Layout>} />
      <Route path="/college-admin/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard" element={<Layout><ProtectedRoute element={<div className="p-6"><h1 className="text-2xl font-bold">Faculty Dashboard</h1></div>} /></Layout>} />
      <Route path="/faculty/marks-entry" element={<Layout><ProtectedRoute element={<MarksEntry />} /></Layout>} />
    </Routes>
  );
};

export default AppRoutes;