const API_BASE_URL = window.EMS_CONFIG?.API_BASE_URL;

export const getApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const API_ENDPOINTS = {
  // Auth
  LOGIN: getApiUrl('/login'),
  SIGNUP: getApiUrl('/signup'),
  CHANGE_PASSWORD: getApiUrl('/change-password'),
  
  // Faculty Marks
  FACULTY_MARKS_STUDENTS: getApiUrl('/faculty-marks/students'),
  FACULTY_MARKS_ASSIGNED_SUBJECTS: getApiUrl('/faculty-marks/assigned-subjects'),
  FACULTY_MARKS_STUDENTS_FOR_ROUND: getApiUrl('/faculty-marks/students-for-round'),
  FACULTY_MARKS_EXAM_ROUNDS: getApiUrl('/faculty-marks/exam-rounds'),
  FACULTY_MARKS_SAVE: getApiUrl('/faculty-marks/save'),
  FACULTY_MARKS_ENTER: getApiUrl('/faculty-marks/enter-marks'),
  FACULTY_MARKS_ENTERED: getApiUrl('/faculty-marks/entered-marks'),
  FACULTY_MARKS_SUBMIT: getApiUrl('/faculty-marks/submit-marks'),
  FACULTY_MARKS_SUBMIT_FOR_APPROVAL: getApiUrl('/faculty-marks/submit-for-approval'),
  FACULTY_MARKS_DELETE_STUDENT_MARKS: getApiUrl('/faculty-marks/delete-student-marks'),
  
  // University Admin
  RESULT_HUB_DATA: getApiUrl('/university-admin/result-hub'),
  RESULT_HUB_DATA_FETCH: getApiUrl('/university-admin/result-hub-data'),
  FINALIZED_EXTERNAL_MARKS: getApiUrl('/university-admin/finalized-external-marks'),
  
  // Internal Exams
  INTERNAL_EXAM_SCHEDULES: getApiUrl('/internal-exams/schedules'),
  
  // College Admin
  COLLEGE_ADMIN_MARKS_STRUCTURE: getApiUrl('/college-admin/marks-structure'),
  COLLEGE_ADMIN_WORKFLOW_STATUS: getApiUrl('/college-admin/workflow-status'),
  
  // Master Data
  ACADEMIC_YEARS: getApiUrl('/academic-years'),
  SEMESTERS: getApiUrl('/semesters'),
  COLLEGES: getApiUrl('/colleges'),
  UNIVERSITIES: getApiUrl('/universities'),
  ROLES: getApiUrl('/roles'),
  DEPARTMENTS: getApiUrl('/master-departments'),
  SUBJECTS: getApiUrl('/grading/subjects'),
  EXAMS: getApiUrl('/exams'),
  MASTER_PROGRAMS: getApiUrl('/master-programs'),
};

export default API_BASE_URL;
