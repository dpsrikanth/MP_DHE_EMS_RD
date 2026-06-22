import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";

// Eager: shown on first paint or wrapping every protected route.
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Lazy: every page is its own chunk, fetched only when its route is visited.
const Dashboard = React.lazy(() => import("./components/Dashboard"));
const Register = React.lazy(() => import("./pages/Register"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const ViewStudentsAndUniversities = React.lazy(() => import("./pages/viewStudentsAndUniversitys"));
const Universities = React.lazy(() => import("./pages/Universities"));
const Colleges = React.lazy(() => import("./pages/Colleges"));
const Programs = React.lazy(() => import("./pages/Programs"));
const Batches = React.lazy(() => import("./pages/Batches"));
const AcademicYears = React.lazy(() => import("./pages/AcademicYears"));
const Semesters = React.lazy(() => import("./pages/Semesters"));
const Subjects = React.lazy(() => import("./pages/Subjects"));
const Teachers = React.lazy(() => import("./pages/Teachers"));
const Students = React.lazy(() => import("./pages/Students"));
const Users = React.lazy(() => import("./pages/Users"));
const Roles = React.lazy(() => import("./pages/Roles"));
const Exams = React.lazy(() => import("./pages/Exams"));
const Marks = React.lazy(() => import("./pages/Marks"));
const Policies = React.lazy(() => import("./pages/Policies"));
const Departments = React.lazy(() => import("./pages/Departments"));
const InternalCalendar = React.lazy(() => import("./pages/InternalCalendar"));
const MilestoneManagement = React.lazy(() => import("./pages/MilestoneManagement"));
const MilestonesForm = React.lazy(() => import("./pages/MilestonesForm"));
const PolicyConfig = React.lazy(() => import("./pages/CollegeAdmin/PolicyConfig"));
const MarksConfig = React.lazy(() => import("./pages/CollegeAdmin/MarksConfig"));
const FacultyAssignment = React.lazy(() => import("./pages/CollegeAdmin/FacultyAssignment"));
const FacultyAssignmentEdit = React.lazy(() => import("./pages/CollegeAdmin/FacultyAssignmentEdit"));
const MarksApproval = React.lazy(() => import("./pages/CollegeAdmin/MarksApproval"));
const ExaminationHalls = React.lazy(() => import("./pages/CollegeAdmin/ExaminationHalls"));
const InfrastructureAnalytics = React.lazy(() => import("./pages/UniversityAdmin/InfrastructureAnalytics"));
const ExamAnalytics = React.lazy(() => import("./pages/UniversityAdmin/ExamAnalytics"));
const InstitutionalRanking = React.lazy(() => import("./pages/UniversityAdmin/InstitutionalRanking"));
const FacultyStatus = React.lazy(() => import("./pages/CollegeAdmin/FacultyStatus"));
const CollegePerformance = React.lazy(() => import("./pages/CollegeAdmin/CollegePerformance"));
const SeatingArrangement = React.lazy(() => import("./pages/CollegeAdmin/SeatingArrangement"));
const InvigilatorAssignment = React.lazy(() => import("./pages/CollegeAdmin/InvigilatorAssignment"));
const FacultyDashboard = React.lazy(() => import("./pages/Faculty/Dashboard"));
const MarksEntry = React.lazy(() => import("./pages/Faculty/MarksEntry"));
const InternalExamMarks = React.lazy(() => import("./pages/Faculty/InternalExamMarks"));
const Attendance = React.lazy(() => import("./pages/Faculty/Attendance"));
const FacultyInternalAttendance = React.lazy(() => import("./pages/Faculty/InternalExamAttendance"));
const InvigilationDuty = React.lazy(() => import("./pages/Faculty/InvigilationDuty"));
const MarksVerification = React.lazy(() => import("./pages/CollegeAdmin/MarksVerification"));
const MarksReview = React.lazy(() => import("./pages/CollegeAdmin/MarksReview"));
const MarksReports = React.lazy(() => import("./pages/CollegeAdmin/MarksReports"));
const InternalExamAttendance = React.lazy(() => import("./pages/CollegeAdmin/InternalExamAttendance"));
const CollegeAdminDashboard = React.lazy(() => import("./pages/CollegeAdmin/Dashboard"));
const StudentDashboard = React.lazy(() => import("./pages/Student/Dashboard"));
const StudentExams = React.lazy(() => import("./pages/Student/StudentExams"));
const StudentResults = React.lazy(() => import("./pages/Student/StudentResults"));
const StudentAttendance = React.lazy(() => import("./pages/Student/StudentAttendance"));
const HODDashboard = React.lazy(() => import("./pages/HOD/Dashboard"));
const AssessmentAcceptance = React.lazy(() => import("./pages/HOD/AssessmentAcceptance"));
const ExternalAssignment = React.lazy(() => import("./pages/UniversityAdmin/ExternalAssignment"));
const ExternalFacultyDashboard = React.lazy(() => import("./pages/ExternalFaculty/Dashboard"));
const ExternalMarksEntry = React.lazy(() => import("./pages/ExternalFaculty/MarksEntry"));
const UniversityMarksView = React.lazy(() => import("./pages/UniversityAdmin/UniversityMarksView"));
const GradingPolicy = React.lazy(() => import("./pages/UniversityAdmin/GradingPolicy"));
const HallTicket = React.lazy(() => import("./pages/Student/HallTicket"));
const ResultSheet = React.lazy(() => import("./pages/Student/ResultSheet"));
const ManageCredits = React.lazy(() => import("./pages/UniversityAdmin/ManageCredits"));
const HallApprovals = React.lazy(() => import("./pages/UniversityAdmin/HallApprovals"));
const StudentCenterAllocations = React.lazy(() => import("./pages/UniversityAdmin/StudentCenterAllocations"));
const StudentGlobalSearch = React.lazy(() => import("./pages/UniversityAdmin/StudentGlobalSearch"));
const UniversityExamAttendance = React.lazy(() => import("./pages/UniversityAdmin/UniversityExamAttendance"));
const PaperSetterDashboard = React.lazy(() => import("./pages/PaperSetter/Dashboard"));
const PaperSetterSubmittedPapers = React.lazy(() => import("./pages/PaperSetter/SubmittedPapers"));
const PaperSetterGuidelines = React.lazy(() => import("./pages/PaperSetter/Guidelines"));
const SecrecyDashboard = React.lazy(() => import("./pages/Secrecy/Dashboard"));
const SecrecyPaperSetters = React.lazy(() => import("./pages/Secrecy/PaperSetters"));
const SecrecyQuestionPapers = React.lazy(() => import("./pages/Secrecy/QuestionPapers"));
const SecrecyPayments = React.lazy(() => import("./pages/Secrecy/Payments"));
const SmtpSettings = React.lazy(() => import("./pages/SmtpSettings"));
const RoundManagement = React.lazy(() => import("./pages/InternalExams/RoundManagement"));
const ExamScheduling = React.lazy(() => import("./pages/InternalExams/ExamScheduling"));
const UniversitiesForm = React.lazy(() => import("./pages/UniversitiesForm"));
const CollegesForm = React.lazy(() => import("./pages/CollegesForm"));
const ProgramsForm = React.lazy(() => import("./pages/ProgramsForm"));
const BatchesForm = React.lazy(() => import("./pages/BatchesForm"));
const AcademicYearsForm = React.lazy(() => import("./pages/AcademicYearsForm"));
const SemestersForm = React.lazy(() => import("./pages/SemestersForm"));
const SubjectsForm = React.lazy(() => import("./pages/SubjectsForm"));
const TeachersForm = React.lazy(() => import("./pages/TeachersForm"));
const StudentsForm = React.lazy(() => import("./pages/StudentsForm"));
const UsersForm = React.lazy(() => import("./pages/UsersForm"));
const RolesForm = React.lazy(() => import("./pages/RolesForm"));
const ExamsForm = React.lazy(() => import("./pages/ExamsForm"));
const PoliciesForm = React.lazy(() => import("./pages/PoliciesForm"));
const DepartmentsForm = React.lazy(() => import("./pages/DepartmentsForm"));
const Profile = React.lazy(() => import("./pages/Profile"));

// New Report Pages
const AttendanceShortage = React.lazy(() => import("./pages/CollegeAdmin/AttendanceShortage"));
const ResultSummary = React.lazy(() => import("./pages/CollegeAdmin/ResultSummary"));
const StatisticalReports = React.lazy(() => import("./pages/UniversityAdmin/StatisticalReports"));
const HODAttendanceShortage = React.lazy(() => import("./pages/HOD/AttendanceShortage"));
const FacultyAttendanceShortage = React.lazy(() => import("./pages/Faculty/AttendanceShortage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen w-full">
    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
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
      <Route path="/internal-calendar" element={<Layout><ProtectedRoute element={<InternalCalendar />} /></Layout>} />
      <Route path="/milestones" element={<Layout><ProtectedRoute element={<MilestoneManagement />} /></Layout>} />

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

      <Route path="/milestones/add" element={<Layout><ProtectedRoute element={<MilestonesForm />} /></Layout>} />
      <Route path="/milestones/edit/:id" element={<Layout><ProtectedRoute element={<MilestonesForm />} /></Layout>} />

      {/* College Admin Routes */}
      <Route path="/college-admin/dashboard" element={<Layout><ProtectedRoute element={<CollegeAdminDashboard />} /></Layout>} />

      <Route path="/college-admin/policies" element={<Layout><ProtectedRoute element={<PolicyConfig />} /></Layout>} />
      <Route path="/college-admin/marks-config" element={<Layout><ProtectedRoute element={<MarksConfig />} /></Layout>} />
      <Route path="/college-admin/faculty-assign" element={<Layout><ProtectedRoute element={<FacultyAssignment />} /></Layout>} />
      <Route path="/college-admin/faculty-assign/edit/:id" element={<Layout><ProtectedRoute element={<FacultyAssignmentEdit />} /></Layout>} />
      <Route path="/college-admin/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />
      <Route path="/college-admin/examination-halls" element={<Layout><ProtectedRoute element={<ExaminationHalls />} /></Layout>} />
      <Route path="/college-admin/faculty-status" element={<Layout><ProtectedRoute element={<FacultyStatus />} /></Layout>} />
      <Route path="/college-admin/performance" element={<Layout><ProtectedRoute element={<CollegePerformance />} /></Layout>} />
      <Route path="/college-admin/seating-arrangement" element={<Layout><ProtectedRoute element={<SeatingArrangement />} /></Layout>} />
      <Route path="/college-admin/invigilator-assignment" element={<Layout><ProtectedRoute element={<InvigilatorAssignment />} /></Layout>} />
      <Route path="/college-admin/internal-attendance" element={<Layout><ProtectedRoute element={<InternalExamAttendance />} /></Layout>} />
      <Route path="/college-admin/attendance-shortage" element={<Layout><ProtectedRoute element={<AttendanceShortage />} /></Layout>} />
      <Route path="/college-admin/result-summary" element={<Layout><ProtectedRoute element={<ResultSummary />} /></Layout>} />
      {/* Internal Exam Routes */}
      <Route path="/college-admin/internal-exams/rounds" element={<Layout><ProtectedRoute element={<RoundManagement />} /></Layout>} />
      <Route path="/college-admin/internal-exams/schedules" element={<Layout><ProtectedRoute element={<ExamScheduling />} /></Layout>} />

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard" element={<Layout><ProtectedRoute element={<FacultyDashboard />} /></Layout>} />
      <Route path="/faculty/marks-entry" element={<Layout><ProtectedRoute element={<MarksEntry />} /></Layout>} />
      <Route path="/faculty/internal-marks" element={<Layout><ProtectedRoute element={<InternalExamMarks />} /></Layout>} />
      <Route path="/faculty/attendance" element={<Layout><ProtectedRoute element={<Attendance />} /></Layout>} />
      <Route path="/faculty/internal-attendance" element={<Layout><ProtectedRoute element={<FacultyInternalAttendance />} /></Layout>} />
      <Route path="/faculty/invigilation-duty" element={<Layout><ProtectedRoute element={<InvigilationDuty />} /></Layout>} />
      <Route path="/faculty/attendance-shortage" element={<Layout><ProtectedRoute element={<FacultyAttendanceShortage />} /></Layout>} />

      {/* HOD Routes */}
      <Route path="/hod/dashboard" element={<Layout><ProtectedRoute element={<HODDashboard />} /></Layout>} />
      <Route path="/hod/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />
      <Route path="/hod/assessment-acceptance" element={<Layout><ProtectedRoute element={<AssessmentAcceptance />} /></Layout>} />
      <Route path="/hod/attendance-shortage" element={<Layout><ProtectedRoute element={<HODAttendanceShortage />} /></Layout>} />
      <Route path="/admin/marks-approval" element={<Layout><ProtectedRoute element={<MarksApproval />} /></Layout>} />

      {/* New Marks Verification Routes */}
      <Route path="/admin/marks-verification" element={<Layout><ProtectedRoute element={<MarksVerification />} /></Layout>} />
      <Route path="/admin/marks-review/:subjectId/:section" element={<Layout><ProtectedRoute element={<MarksReview />} /></Layout>} />
      <Route path="/admin/marks-reports" element={<Layout><ProtectedRoute element={<MarksReports />} /></Layout>} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={<Layout><ProtectedRoute element={<StudentDashboard />} /></Layout>} />
      <Route path="/student/exams" element={<Layout><ProtectedRoute element={<StudentExams />} /></Layout>} />
      <Route path="/student/results" element={<Layout><ProtectedRoute element={<StudentResults />} /></Layout>} />
      <Route path="/student/attendance" element={<Layout><ProtectedRoute element={<StudentAttendance />} /></Layout>} />
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
      <Route path="/university/student-search" element={<Layout><ProtectedRoute element={<StudentGlobalSearch />} /></Layout>} />
      <Route path="/university/exam-attendance" element={<Layout><ProtectedRoute element={<UniversityExamAttendance />} /></Layout>} />
      <Route path="/university/statistical-reports" element={<Layout><ProtectedRoute element={<StatisticalReports />} /></Layout>} />
      <Route path="/profile" element={<Layout><ProtectedRoute element={<Profile />} /></Layout>} />
      <Route path="/smtp-settings" element={<Layout><ProtectedRoute element={<SmtpSettings />} /></Layout>} />
    </Routes>
    </Suspense>
  );
};

export default AppRoutes;
