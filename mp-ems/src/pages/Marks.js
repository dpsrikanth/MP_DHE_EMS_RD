import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  ArrowUpRight,
  GraduationCap,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { toast } from 'react-toastify';
import authUtils from '../utils/authUtils';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import { marksApi } from '../api/marksApi';
import { masterDataApi } from '../api/masterDataApi';
import { examApi } from '../api/examApi';

/**
 * Modern Marks Management component with Tailwind CSS styling.
 * Designed for high-performance academic record tracking.
 */
const Marks = () => {
  const [activeTab, setActiveTab] = useState('teacher'); // 'teacher' or 'hod'

  // Data States
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);

  // Selected Filters
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const [saving, setSaving] = useState(false);

  // Clear selected exam and data if parent filters change
  useEffect(() => {
    setSelectedExam('');
    setData([]);
  }, [selectedCollege, selectedDepartment, selectedProgram, selectedAcademicYear, selectedSemester, selectedSubject]);

  // Fetch initial dropdown data (Colleges, Depts, etc)
  useEffect(() => {
    fetchFilterData();

    // Auto-setup for HOD
    const auth = authUtils.getAuth();
    if (auth.roleName === 'HOD') {
      setActiveTab('hod');
      if (auth.collegeId) setSelectedCollege(auth.collegeId);
      if (auth.departmentId) setSelectedDepartment(auth.departmentId);
    } else if (authUtils.isFaculty()) {
      setActiveTab('teacher');
      if (auth.collegeId) setSelectedCollege(auth.collegeId);
    }
  }, []);

  const handleMarkChange = (id, field, value) => {
    setData(prev => prev.map(item => {
      // id passed from inputs is always item.student_id
      if (item.student_id === id) {
        const val = value === '' ? '' : Math.min(Math.max(0, Number(value)), field === 'internal_marks' ? 40 : 60);

        const newItem = { ...item, [field]: val };
        const intMarks = Number(newItem.internal_marks) || 0;
        const extMarks = Number(newItem.external_marks) || 0;
        newItem.total_marks = intMarks + extMarks;

        // Let's modify the item so it marks as edited
        newItem._edited = true;
        return newItem;
      }
      return item;
    }));
  };

  const saveSelectedMarks = async (status = 'Draft') => {
    const editedRecords = data.filter(d => d._edited || status === 'Pending Approval');
    if (editedRecords.length === 0) return;

    setSaving(true);
    try {
      const payload = {
        subject_id: selectedSubject,
        exam_id: selectedExam,
        academic_year_id: selectedAcademicYear,
        marksData: editedRecords.map(r => ({
          student_id: r.student_id,
          internal_marks: r.internal_marks,
          external_marks: r.external_marks,
          status: status
        }))
      };

      await marksApi.saveInternalMarks(payload);

      toast.success(status === 'Draft' ? 'Drafts saved successfully' : 'Submitted for approval successfully');
      fetchData(); // reload
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleHodAction = async (mark_id, action) => {
    try {
      await marksApi.approveRejectMarks({
        mark_ids: [mark_id],
        action: action
      });

      toast.success(`Mark ${action}d successfully`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || `Failed to ${action} mark`);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [colRes, deptRes, progRes, yrRes, semRes, subRes, exRes] = await Promise.all([
        masterDataApi.getColleges(),
        masterDataApi.getDepartments(),
        masterDataApi.getPrograms(),
        masterDataApi.getAcademicYears(),
        masterDataApi.getSemesters(),
        masterDataApi.getSubjects(),
        examApi.getExams()
      ]);

      if (colRes) setColleges(colRes);
      if (deptRes) setDepartments(deptRes);
      if (progRes) setPrograms(progRes);
      if (yrRes) setAcademicYears(yrRes);
      if (semRes) setSemesters(semRes);
      if (subRes) setSubjects(subRes);
      if (exRes) setExams(exRes);
    } catch (err) {
      console.error("Error fetching filters", err);
    }
  };

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'student', label: 'Student Info' },
    { key: 'exam', label: 'Exam Details' },
    { key: 'performance', label: 'Performance' }
  ];

  const {
    paginatedData,
    searchQuery,
    setSearchQuery,
    sortConfig,
    handleSort,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    visibleColumns,
    toggleColumn
  } = useDataTable(data, {
    searchFields: ['id', 'student_id', 'exam_id'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    // Intentionally left blank. We don't want to auto-fetch on mount 
    // because all dropdowns are empty, which would just throw a validation warning.
  }, []);

  const fetchData = async () => {
    if (activeTab === 'teacher') {
      if (!selectedCollege || !selectedDepartment || !selectedProgram || !selectedSemester || !selectedSubject || !selectedExam) {
        setData([]);
        toast.warning('Please select College, Department, Program, Semester, Subject, and Exam to load students.');
        return;
      }
    } else {
      // HOD Approval Tab
      if (!selectedCollege || !selectedDepartment) {
        setData([]);
        toast.warning('Please select College and Department to load approvals.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCollege) params.college_id = selectedCollege;
      if (selectedDepartment) params.department_id = selectedDepartment;

      if (activeTab === 'teacher') {
        if (selectedProgram) params.program_id = selectedProgram;
        if (selectedAcademicYear) params.academic_year_id = selectedAcademicYear;
        if (selectedSemester) params.semester_id = selectedSemester;
        if (selectedSubject) params.subject_id = selectedSubject;
        if (selectedExam) params.exam_id = selectedExam;

        const data = await marksApi.getStudentsForMarks(params);
        setData(data || []);
      } else {
        const data = await marksApi.getApprovals(params);
        setData(data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
      toast.error('Failed to sync records');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data.filter(item =>
    item.student_id?.toString().includes(searchQuery) ||
    item.exam_id?.toString().includes(searchQuery)
  );

  const getPerformanceColor = (obtained, max) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 80) return "text-emerald-500 bg-emerald-50 border-emerald-100";
    if (percentage >= 60) return "text-sky-500 bg-sky-50 border-sky-100";
    if (percentage >= 40) return "text-amber-500 bg-amber-50 border-amber-100";
    return "text-red-500 bg-red-50 border-red-100";
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <BarChart3 size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Marks <span className="text-indigo-600">Management</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest  flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              60/40 Split & Approvals
            </p>
          </div>
        </div>

        {/* Role Tabs - only show if both roles are possible (e.g. for super admin) or hide based on role */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          {(authUtils.isAdmin() || authUtils.isFaculty()) && (
            <button
              onClick={() => { setActiveTab('teacher'); setData([]); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'teacher' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Teacher Entry
            </button>
          )}
          {(authUtils.isAdmin() || authUtils.isHOD()) && (
            <button
              onClick={() => { setActiveTab('hod'); setData([]); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'hod' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              HOD Approvals
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          {activeTab === 'teacher' && data.length > 0 && (
            <>
              <button
                onClick={() => saveSelectedMarks('Draft')}
                disabled={saving}
                className="px-6 py-3 bg-white text-indigo-600 border-2 border-indigo-100 rounded-xl font-black text-sm  tracking-widest hover:border-indigo-600 transition-all disabled:opacity-50"
              >
                Save Drafts
              </button>
              <button
                onClick={() => saveSelectedMarks('Pending Approval')}
                disabled={saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm  tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                Submit to HOD
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">College</label>
          <select
            value={selectedCollege} onChange={(e) => setSelectedCollege(e.target.value)}
            disabled={authUtils.isHOD() || authUtils.isCollegeAdmin() || authUtils.isFaculty()}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <option value="">Select College...</option>
            {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name || c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Department</label>
          <select
            value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}
            disabled={authUtils.isHOD()}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <option value="">Select Department...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </select>
        </div>
        {activeTab === 'teacher' && (
          <>
            <div>
              <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Program</label>
              <select
                value={selectedProgram} onChange={(e) => setSelectedProgram(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="">Select Program...</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Academic Year</label>
              <select
                value={selectedAcademicYear} onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="">Select Year...</option>
                {academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Semester</label>
              <select
                value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="">Select Semester...</option>
                {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name || `Semester ${s.id}`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Subject</label>
              <select
                value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="">Select Subject...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[13px] font-bold text-slate-500  tracking-widest mb-2">Exam</label>
              <select
                value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-colors"
              >
                <option value="">Select Exam...</option>
                {exams.filter(e => {
                  if (selectedDepartment && e.department_id && e.department_id.toString() !== selectedDepartment.toString()) return false;
                  if (selectedProgram && e.program_id && e.program_id.toString() !== selectedProgram.toString()) return false;
                  if (selectedAcademicYear && e.academic_year_id && e.academic_year_id.toString() !== selectedAcademicYear.toString()) return false;
                  if (selectedSemester && e.semester_id && e.semester_id.toString() !== selectedSemester.toString()) return false;
                  if (selectedSubject && e.subject_id && e.subject_id.toString() !== selectedSubject.toString()) return false;
                  return true;
                }).map(e => <option key={e.id} value={e.id}>{e.exam_name || e.name}</option>)}
              </select>
            </div>
          </>
        )}
        <div className="flex items-end">
          <button
            onClick={fetchData}
            className="w-full bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black text-sm  tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
          >
            <Search size={18} />
            <span>Load Data</span>
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex flex-col lg:flex-row justify-between items-center gap-6">
          <TableSearch
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by Student ID, Exam ID, or Ref..."
            className="w-full lg:w-96"
          />
          <div className="flex items-center gap-3">
            <ColumnVisibilitySelector
              columns={availableColumns}
              visibleColumns={visibleColumns}
              onToggle={toggleColumn}
            />
            <button className="p-3.5 bg-white border-2 border-slate-100 text-slate-500 rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm">
              <Filter size={20} />
            </button>
            <div className="h-10 w-px bg-slate-200 mx-2"></div>
            <p className="text-sm font-bold text-slate-500  tracking-tighter">Total {totalItems} Records</p>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-400 font-bold  tracking-widest text-[13px]">Accessing Secure Records...</p>
            </div>
          ) : error ? (
            <div className="py-24 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Sync Connection Failed</h3>
              <p className="text-slate-500 font-medium max-w-md mb-8">{error}</p>
              <button onClick={fetchData} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold  tracking-widest text-[13px] hover:bg-slate-800 transition-all">Retry Synchronization</button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <SortHeader
                    label="Enrollment No"
                    field="enrollment_number"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-8 py-6 text-[12px] font-black  tracking-[0.2em] border-b border-slate-100"
                    visible={visibleColumns.id}
                  />
                  <SortHeader
                    label="Student Info"
                    field="student_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    className="px-8 py-6 text-[12px] font-black  tracking-[0.2em] border-b border-slate-100"
                    visible={visibleColumns.student}
                  />
                  {activeTab === 'teacher' ? (
                    <>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Internal (40)</th>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">External (60)</th>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Total (100)</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Subject</th>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Total Marks</th>
                      <th className="px-8 py-6 text-left text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Submitted By</th>
                    </>
                  )}
                  <th className="px-8 py-6 text-right text-[13px] font-black text-slate-400  tracking-[0.2em] border-b border-slate-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedData.map((item) => (
                  <tr key={item.mark_id || item.student_id} className="group hover:bg-slate-50/50 transition-colors">
                    {visibleColumns.id && (
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-sm font-bold text-slate-500 tabular-nums">
                          {item.enrollment_number || 'N/A'}
                        </span>
                      </td>
                    )}
                    {visibleColumns.student && (
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-all">
                            <GraduationCap size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{item.student_name}</p>
                            <p className="text-[13px] font-bold text-slate-500">ID: {item.student_id}</p>
                          </div>
                        </div>
                      </td>
                    )}

                    {activeTab === 'teacher' ? (
                      <>
                        <td className="px-8 py-6">
                          <input
                            type="number"
                            min="0" max="40"
                            value={item.internal_marks ?? ''}
                            onChange={(e) => handleMarkChange(item.student_id, 'internal_marks', e.target.value)}
                            disabled={item.status === 'Approved' || item.status === 'Pending Approval'}
                            className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <input
                            type="number"
                            min="0" max="60"
                            value={item.external_marks ?? ''}
                            onChange={(e) => handleMarkChange(item.student_id, 'external_marks', e.target.value)}
                            disabled={item.status === 'Approved' || item.status === 'Pending Approval'}
                            className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-sm font-black tabular-nums ${getPerformanceColor(item.total_marks || 0, 100)} px-3 py-1.5 rounded-lg border`}>
                            {item.total_marks || 0}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-6 text-sm font-bold text-slate-700">{item.subject_name}</td>
                        <td className="px-8 py-6">
                          <span className={`text-sm font-black tabular-nums ${getPerformanceColor(item.total_marks || 0, 100)} px-3 py-1.5 rounded-lg border`}>
                            {item.total_marks || 0}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-600">{item.submitted_by}</td>
                      </>
                    )}

                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <span className={`px-3 py-1 text-[12px] font-black  tracking-wider rounded-md border
                          ${item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            item.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-slate-100 text-slate-500 border-slate-200'}`}>
                          {item.status || 'Not Entered'}
                        </span>

                        {activeTab === 'hod' && (
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => handleHodAction(item.mark_id, 'Approve')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200" title="Approve">
                              <CheckCircle2 size={18} />
                            </button>
                            <button onClick={() => handleHodAction(item.mark_id, 'Reject')} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200" title="Reject">
                              <AlertCircle size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />

        {!loading && paginatedData.length === 0 && !error && (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6 border-t border-slate-50">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-8 border-4 border-white shadow-sm">
              <BarChart3 size={48} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight italic">Ecosystem Void</h3>
            <p className="text-slate-500 font-medium max-w-sm mb-10 leading-relaxed">No marks records found in the system for the current criteria. Start by recording a new evaluation.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm  tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all transform hover:-translate-y-1"
            >
              <Plus size={20} />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Footer Insight Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-10 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white opacity-10 group-hover:scale-150 transition-transform duration-700">
            <CheckCircle2 size={120} />
          </div>
          <h4 className="text-xl font-black mb-4  tracking-tighter">Record Verification</h4>
          <p className="text-indigo-100 font-medium mb-8 leading-relaxed max-w-sm">All academic records are signed and synchronized across the institutional blockchain for integrity.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[13px] font-black  tracking-widest">Secure Ledger Active</span>
          </div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden group border border-slate-800">
          <div className="absolute top-0 right-0 p-8 text-sky-500 opacity-20 group-hover:scale-150 transition-transform duration-700">
            <TrendingUp size={120} />
          </div>
          <h4 className="text-xl font-black mb-4  tracking-tighter">Trend Insights</h4>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed max-w-sm">Use our advanced AI engines to predict student outcomes based on historical performance data.</p>
          <button className="text-sm font-black text-sky-400 hover:text-sky-300 transition-colors  tracking-widest flex items-center gap-2">
            Explore Analytics
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Marks;

