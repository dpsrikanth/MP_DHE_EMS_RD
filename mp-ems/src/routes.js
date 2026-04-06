import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ViewStudentsAndUniversities from "./pages/viewStudentsAndUniversitys"
import ProtectedRoute from "./components/ProtectedRoute";
import Universities from "./pages/Universities";
import Colleges from "./pages/Colleges";
import Programs from "./pages/Programs";
import Batches from './pages/Batches';
import AcademicYears from "./pages/AcademicYears";
import Semesters from "./pages/Semesters";
import Subjects from "./pages/Subjects";
import Teachers from "./pages/Teachers";
import Students from "./pages/Students";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Exams from "./pages/Exams";
import Marks from "./pages/Marks";
import Policies from "./pages/Policies";
import Departments from "./pages/Departments";
import PolicyConfig from "./pages/CollegeAdmin/PolicyConfig";
import MarksConfig from "./pages/CollegeAdmin/MarksConfig";
import FacultyAssignment from "./pages/CollegeAdmin/FacultyAssignment";
import FacultyAssignmentEdit from "./pages/CollegeAdmin/FacultyAssignmentEdit";
import MarksApproval from "./pages/CollegeAdmin/MarksApproval";
import ExaminationHalls from "./pages/CollegeAdmin/ExaminationHalls";
import InfrastructureAnalytics from "./pages/UniversityAdmin/InfrastructureAnalytics";
import ExamAnalytics from "./pages/UniversityAdmin/ExamAnalytics";
import InstitutionalRanking from "./pages/UniversityAdmin/InstitutionalRanking";
import FacultyStatus from "./pages/CollegeAdmin/FacultyStatus";
import CollegePerformance from "./pages/CollegeAdmin/CollegePerformance";
import SeatingArrangement from "./pages/CollegeAdmin/SeatingArrangement";
import FacultyDashboard from "./pages/Faculty/Dashboard";
import MarksEntry from "./pages/Faculty/MarksEntry";
import Attendance from "./pages/Faculty/Attendance";
import MarksVerification from "./pages/CollegeAdmin/MarksVerification";
import MarksReview from "./pages/CollegeAdmin/MarksReview";
import RollNumberGenerator from './pages/CollegeAdmin/RollNumberGenerator';
import MarksReports from "./pages/CollegeAdmin/MarksReports";
import StudentDashboard from "./pages/Student/Dashboard";
import StudentExams from "./pages/Student/StudentExams";
import StudentResults from "./pages/Student/StudentResults";
import HODDashboard from "./pages/HOD/Dashboard";
import ExternalAssignment from "./pages/UniversityAdmin/ExternalAssignment";
import ExternalFacultyDashboard from "./pages/ExternalFaculty/Dashboard";
import ExternalMarksEntry from "./pages/ExternalFaculty/MarksEntry";
import UniversityMarksView from "./pages/UniversityAdmin/UniversityMarksView";
import GradingPolicy from "./pages/UniversityAdmin/GradingPolicy";
import HallTicket from "./pages/Student/HallTicket";
import ResultSheet from "./pages/Student/ResultSheet";
import ManageCredits from "./pages/UniversityAdmin/ManageCredits";
import HallApprovals from "./pages/UniversityAdmin/HallApprovals";
import StudentCenterAllocations from "./pages/UniversityAdmin/StudentCenterAllocations";
import PaperSetterDashboard from "./pages/PaperSetter/Dashboard";
import PaperSetterSubmittedPapers from "./pages/PaperSetter/SubmittedPapers";
import PaperSetterGuidelines from "./pages/PaperSetter/Guidelines";
import SecrecyDashboard from "./pages/Secrecy/Dashboard";
import SecrecyPaperSetters from "./pages/Secrecy/PaperSetters";
import SecrecyQuestionPapers from "./pages/Secrecy/QuestionPapers";
import SecrecyPayments from "./pages/Secrecy/Payments";
import SmtpSettings from "./pages/SmtpSettings";
import Layout from "./components/Layout";
import UniversitiesForm from "./pages/UniversitiesForm";
import CollegesForm from "./pages/CollegesForm";
import ProgramsForm from "./pages/ProgramsForm";
import BatchesForm from "./pages/BatchesForm";
import AcademicYearsForm from "./pages/AcademicYearsForm"; // Assuming this might be needed later or created
import SemestersForm from "./pages/SemestersForm";
import SubjectsForm from "./pages/SubjectsForm";
import TeachersForm from "./pages/TeachersForm";
import StudentsForm from "./pages/StudentsForm";
import UsersForm from "./pages/UsersForm";
import RolesForm from "./pages/RolesForm";
import ExamsForm from "./pages/ExamsForm";
import PoliciesForm from "./pages/PoliciesForm";
import DepartmentsForm from "./pages/DepartmentsForm";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Protected Routes wrapped in common Layout */}
      <Route path="/dashboard" element={<Layout><ProtectedRoute element={<Dashboard />} /></Layout>} />
      <Route path="/viewStudentsAndUniversitys" element={<Layout><ViewStudentsAndUniversities /></Layout>} />
      <Route path="/universities" element={<Layout><ProtectedRoute element={<Universities />} /></Layout>} />
      <Route path="/colleges" element={<Layout><ProtectedRoute element={<Colleges />} /></Layout>} />
      <Route path="/programs" element={<Layout><ProtectedRoute element={<Programs />} /></Layout>} />
      <Route path="/batches" element={<Layout><ProtectedRoute element={<Batches />} /></Layout>} />
      <Route path="/academic-years" element={<Layout><ProtectedRoute element={<AcademicYears />} /></Layout>} />
      <Route path="/semesters" element={<Layout><ProtectedRoute element={<Semesters />} /></Layout>} />
      <Route path="/subjects" element={<Layout><ProtectedRoute element={<Subjects />} /></Layout>} />
      <Route path="/teachers" element={<Layout><ProtectedRoute element={<Teachers />} /></Layout>} />
      <Route path="/students" element={<Layout><ProtectedRoute element={<Students />} /></Layout>} />
      <Route path="/users" element={<Layout><ProtectedRoute element={<Users />} /></Layout>} />
      <Route path="/roles" element={<Layout><ProtectedRoute element={<Roles />} /></Layout>} />
      <Route path="/exams" element={<Layout><ProtectedRoute element={<Exams />} /></Layout>} />
      <Route path="/marks" element={<Layout><ProtectedRoute element={<Marks />} /></Layout>} />
      <Route path="/policies" element={<Layout><ProtectedRoute element={<Policies />} /></Layout>} />
      <Route path="/departments" element={<Layout><ProtectedRoute element={<Departments />} /></Layout>} />
      
      {/* Entity Add/Edit Routes */}
      <Route path="/universities/add" element={<Layout><ProtectedRoute element={<UniversitiesForm />} /></Layout>} />
      <Route path="/universities/edit/:id" element={<Layout><ProtectedRoute element={<UniversitiesForm />} /></Layout>} />
      
      <Route path="/colleges/add" element={<Layout><ProtectedRoute element={<CollegesForm />} /></Layout>} />
      <Route path="/colleges/edit/:id" element={<Layout><ProtectedRoute element={<CollegesForm />} /></Layout>} />
      
      <Route path="/programs/add" element={<Layout><ProtectedRoute element={<ProgramsForm />} /></Layout>} />
      <Route path="/programs/edit/:id" element={<Layout><ProtectedRoute element={<ProgramsForm />} /></Layout>} />
      
      <Route path="/batches/add" element={<Layout><ProtectedRoute element={<BatchesForm />} /></Layout>} />
      <Route path="/batches/edit/:id" element={<Layout><ProtectedRoute element={<BatchesForm />} /></Layout>} />
      
      <Route path="/academic-years/add" element={<Layout><ProtectedRoute element={<AcademicYearsForm />} /></Layout>} />
      <Route path="/academic-years/edit/:id" element={<Layout><ProtectedRoute element={<AcademicYearsForm />} /></Layout>} />
      
      <Route path="/semesters/add" element={<Layout><ProtectedRoute element={<SemestersForm />} /></Layout>} />
      <Route path="/semesters/edit/:id" element={<Layout><ProtectedRoute element={<SemestersForm />} /></Layout>} />
      
      <Route path="/subjects/add" element={<Layout><ProtectedRoute element={<SubjectsForm />} /></Layout>} />
      <Route path="/subjects/edit/:id" element={<Layout><ProtectedRoute element={<SubjectsForm />} /></Layout>} />
      
      <Route path="/teachers/add" element={<Layout><ProtectedRoute element={<TeachersForm />} /></Layout>} />
      <Route path="/teachers/edit/:id" element={<Layout><ProtectedRoute element={<TeachersForm />} /></Layout>} />
      
      <Route path="/students/add" element={<Layout><ProtectedRoute element={<StudentsForm />} /></Layout>} />
      <Route path="/students/edit/:id" element={<Layout><ProtectedRoute element={<StudentsForm />} /></Layout>} />
      
      <Route path="/users/add" element={<Layout><ProtectedRoute element={<UsersForm />} /></Layout>} />
      <Route path="/users/edit/:id" element={<Layout><ProtectedRoute element={<UsersForm />} /></Layout>} />
      
      <Route path="/roles/add" element={<Layout><ProtectedRoute element={<RolesForm />} /></Layout>} />
      <Route path="/roles/edit/:id" element={<Layout><ProtectedRoute element={<RolesForm />} /></Layout>} />
      
      <Route path="/exams/add" element={<Layout><ProtectedRoute element={<ExamsForm />} /></Layout>} />
      <Route path="/exams/edit/:id" element={<Layout><ProtectedRoute element={<ExamsForm />} /></Layout>} />
      
      <Route path="/policies/add" element={<Layout><ProtectedRoute element={<PoliciesForm />} /></Layout>} />
      <Route path="/policies/edit/:id" element={<Layout><ProtectedRoute element={<PoliciesForm />} /></Layout>} />
      
      <Route path="/departments/add" element={<Layout><ProtectedRoute element={<DepartmentsForm />} /></Layout>} />
      <Route path="/departments/edit/:id" element={<Layout><ProtectedRoute element={<DepartmentsForm />} /></Layout>} />

      {/* College Admin Routes */}
      <Route path="/college-admin/dashboard" element={<Layout><ProtectedRoute element={<div className="p-6"><h1 className="text-2xl font-bold">College Admin Dashboard</h1><p>Welcome to College Admin Panel.</p></div>} /></Layout>} />
      <Route path="/college-admin/policies" element={<Layout><ProtectedRoute element={<PolicyConfig />} /></Layout>} />
      <Route path="/college-admin/marks-config" element={<Layout><ProtectedRoute element={<MarksConfig />} /></Layout>} />
      <Route path="/college-admin/faculty-assign" element={<Layout><ProtectedRoute element={<FacultyAssignment />} /></Layout>} />
      <Route path="/college-admin/faculty-assign/edit/:id" element={<Layout><ProtectedRoute element={<FacultyAssignmentEdit />} /></Layout>} />
      <Route path="/college-admin/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />
      <Route path="/college-admin/examination-halls" element={<Layout><ProtectedRoute element={<ExaminationHalls />} /></Layout>} />
      <Route path="/college-admin/faculty-status" element={<Layout><ProtectedRoute element={<FacultyStatus />} /></Layout>} />
      <Route path="/college-admin/performance" element={<Layout><ProtectedRoute element={<CollegePerformance />} /></Layout>} />
      <Route path="/college-admin/seating-arrangement" element={<Layout><ProtectedRoute element={<SeatingArrangement />} /></Layout>} />
      <Route path="/college-admin/generate-roll-numbers" element={<Layout><ProtectedRoute element={<RollNumberGenerator />} /></Layout>} />

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard" element={<Layout><ProtectedRoute element={<FacultyDashboard />} /></Layout>} />
      <Route path="/faculty/marks-entry" element={<Layout><ProtectedRoute element={<MarksEntry />} /></Layout>} />
      <Route path="/faculty/attendance" element={<Layout><ProtectedRoute element={<Attendance />} /></Layout>} />

      {/* HOD Routes */}
      <Route path="/hod/dashboard" element={<Layout><ProtectedRoute element={<HODDashboard />} /></Layout>} />
      <Route path="/hod/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />

      {/* New Marks Verification Routes */}
      <Route path="/admin/marks-verification" element={<Layout><ProtectedRoute element={<MarksVerification />} /></Layout>} />
      <Route path="/admin/marks-review/:subjectId/:section" element={<Layout><ProtectedRoute element={<MarksReview />} /></Layout>} />
      <Route path="/admin/marks-reports" element={<Layout><ProtectedRoute element={<MarksReports />} /></Layout>} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<Layout><ProtectedRoute element={<StudentDashboard />} /></Layout>} />
      <Route path="/student/exams" element={<Layout><ProtectedRoute element={<StudentExams />} /></Layout>} />
      <Route path="/student/results" element={<Layout><ProtectedRoute element={<StudentResults />} /></Layout>} />
      <Route path="/student/hall-ticket/:examName/:semesterId" element={<ProtectedRoute element={<HallTicket />} />} />
      <Route path="/student/result-sheet/:examName" element={<ProtectedRoute element={<ResultSheet />} />} />

      {/* External Faculty Routes */}
      <Route path="/external-faculty/dashboard" element={<Layout><ProtectedRoute element={<ExternalFacultyDashboard />} /></Layout>} />
      <Route path="/external-faculty/marks-entry" element={<Layout><ProtectedRoute element={<ExternalMarksEntry />} /></Layout>} />

      {/* Paper Setter Workflow */}
      <Route path="/paper-setter/dashboard" element={<Layout><ProtectedRoute element={<PaperSetterDashboard />} /></Layout>} />
      <Route path="/paper-setter/assigned-exams" element={<Layout><ProtectedRoute element={<PaperSetterDashboard />} /></Layout>} />
      <Route path="/paper-setter/submitted-papers" element={<Layout><ProtectedRoute element={<PaperSetterSubmittedPapers />} /></Layout>} />
      <Route path="/paper-setter/guidelines" element={<Layout><ProtectedRoute element={<PaperSetterGuidelines />} /></Layout>} />
      <Route path="/secrecy/dashboard" element={<Layout><ProtectedRoute element={<SecrecyDashboard />} /></Layout>} />
      <Route path="/secrecy/paper-setters" element={<Layout><ProtectedRoute element={<SecrecyPaperSetters />} /></Layout>} />
      <Route path="/secrecy/question-papers" element={<Layout><ProtectedRoute element={<SecrecyQuestionPapers />} /></Layout>} />
      <Route path="/secrecy/payments" element={<Layout><ProtectedRoute element={<SecrecyPayments />} /></Layout>} />

      {/* University Admin / Super Admin specialized routes */}
      <Route path="/university/external-assignment" element={<Layout><ProtectedRoute element={<ExternalAssignment />} /></Layout>} />
      <Route path="/university/external-marks" element={<Layout><ProtectedRoute element={<UniversityMarksView />} /></Layout>} />
      <Route path="/university/grading-policy" element={<Layout><ProtectedRoute element={<GradingPolicy />} /></Layout>} />
      <Route path="/university/manage-credits" element={<Layout><ProtectedRoute element={<ManageCredits />} /></Layout>} />
      <Route path="/university/hall-approvals" element={<Layout><ProtectedRoute element={<HallApprovals />} /></Layout>} />
      <Route path="/university/infrastructure-analytics" element={<Layout><ProtectedRoute element={<InfrastructureAnalytics />} /></Layout>} />
      <Route path="/university/exam-analytics" element={<Layout><ProtectedRoute element={<ExamAnalytics />} /></Layout>} />
      <Route path="/university/institutional-ranking" element={<Layout><ProtectedRoute element={<InstitutionalRanking />} /></Layout>} />
      <Route path="/university/student-allocations" element={<Layout><ProtectedRoute element={<StudentCenterAllocations />} /></Layout>} />
      <Route path="/smtp-settings" element={<Layout><ProtectedRoute element={<SmtpSettings />} /></Layout>} />
    </Routes>
  );
};

export default AppRoutes;