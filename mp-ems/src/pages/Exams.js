import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Pencil, X, Check, Calendar, Book, Layers, Hash, ArrowRight,
  AlertCircle
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Exams = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dropdown data
  const [colleges, setColleges] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semester_id: '',
    college_id: '',
    exam_type: '',
    department_id: '',
    program_id: '',
    academic_year_id: '',
    subject_id: '',
    exam_date: '',
    status: true
  });

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'details', label: 'Assessment Details' },
    { key: 'context', label: 'Academic Context' },
    { key: 'date', label: 'Timeline' }
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
    searchFields: ['id', 'exam_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [colRes, semRes, typeRes, depRes, progRes, yearRes, subRes] = await Promise.all([
        fetch('http://localhost:8080/api/colleges', { headers }),
        fetch('http://localhost:8080/api/master-semesters', { headers }),
        fetch('http://localhost:8080/api/exam-types', { headers }),
        fetch('http://localhost:8080/api/master-departments', { headers }),
        fetch('http://localhost:8080/api/master-programs', { headers }),
        fetch('http://localhost:8080/api/academic-years', { headers }),
        fetch('http://localhost:8080/api/master-subjects', { headers })
      ]);

      if (colRes.ok) setColleges(await colRes.json());
      if (semRes.ok) setSemesters(await semRes.json());
      if (typeRes.ok) setExamTypes(await typeRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
      if (progRes.ok) setPrograms(await progRes.json());
      if (yearRes.ok) setAcademicYears(await yearRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/exams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const jsonData = await response.json();
      setData(jsonData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', semester_id: '', college_id: '', exam_type: '', 
      department_id: '', program_id: '', academic_year_id: '', subject_id: '', 
      exam_date: '', status: true 
    });
    setEditingId(null);
    setIsModalOpen(false);
    setError(null);
  };

  const handleEdit = (exam) => {
    setFormData({
      name: exam.exam_name || '',
      semester_id: exam.semester_id || '',
      college_id: exam.college_id || '',
      exam_type: exam.exam_type || '',
      department_id: exam.department_id || '',
      program_id: exam.program_id || '',
      academic_year_id: exam.academic_year_id || '',
      subject_id: exam.subject_id || '',
      exam_date: exam.exam_date ? new Date(exam.exam_date).toISOString().split('T')[0] : '',
      status: exam.status
    });
    setEditingId(exam.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/exams/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        const errData = await res.json();
        alert(errData.message || "Failed to delete exam");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting exam");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const url = editingId 
        ? `http://localhost:8080/api/exams/${editingId}`
        : 'http://localhost:8080/api/exams';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Operation failed");
      }

      await fetchData();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
              <FileText size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Examination Management</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Schedule, track and configure institutional assessments</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by exam name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Schedule Exam</span>
            </button>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/20">
                <SortHeader 
                  label="ID Reference" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-8" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Assessment Details" 
                  field="exam_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.details}
                />
                <th className={`${visibleColumns.context ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Academic Context</th>
                <SortHeader 
                  label="Timeline" 
                  field="exam_date" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.date}
                />
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.details && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 border border-purple-100 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                            <FileText size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{item.exam_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-1.5">
                              Major Assessment <ArrowRight size={10} /> Tier 1
                            </p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.context && (
                      <td className="px-4 py-5 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0" />
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]" title={item.college_name}>{item.college_name || `College-${item.college_id}`}</p>
                          </div>
                          {(item.department_name || item.program_name) && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0" />
                              <p className="text-[11px] font-semibold text-slate-500 truncate max-w-[200px]">
                                {[item.department_name, item.program_name].filter(Boolean).join(' • ')}
                              </p>
                            </div>
                          )}
                          {(item.subject_name || item.year_name) && (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                              <p className="text-[11px] font-semibold text-slate-500 truncate max-w-[200px]">
                                {item.subject_name} {item.year_name ? `(${item.year_name})` : ''}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />
                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-tight">{item.semester_name || `Semester-${item.semester_id}`}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.date && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2 text-slate-500 group-hover:text-purple-600 transition-colors">
                          <Calendar size={14} />
                          <span className="text-xs font-black tracking-tighter">
                            {item.exam_date ? new Date(item.exam_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 text-slate-400">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                          title="Modify Specification"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Revoke Schedule"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No examinations found</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-purple-500 hover:text-purple-600 underline uppercase tracking-tighter"
                      >
                        Reset Search
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600">
                  <FileText size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-none mb-1">
                    {editingId ? 'Modify Assessment' : 'New Assessment'}
                  </h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {editingId ? 'Update Configurations' : 'Schedule Configuration'}
                  </p>
                </div>
              </div>
              <button 
                onClick={resetForm}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h3 className="text-sm font-bold text-red-800">Operation Failed</h3>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <form id="examForm" onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Assessment Name</label>
                  <input
                    required
                    maxLength={255}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none md:text-base placeholder:text-slate-400 placeholder:font-medium"
                    placeholder="e.g. Midterm Examination 2026"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">College Context</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.college_id}
                        onChange={(e) => setFormData({ ...formData, college_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select College</option>
                        {colleges.map(c => (
                          <option key={c.id} value={c.id}>{c.college_name || c.name}</option>
                        ))}
                      </select>
                      <Layers className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Semester Cycle</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.semester_id}
                        onChange={(e) => setFormData({ ...formData, semester_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Semester</option>
                        {semesters.map(s => (
                          <option key={s.id} value={s.id}>{s.semester_name || `Semester ${s.id}`}</option>
                        ))}
                      </select>
                      <Book className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Department Context</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.department_id}
                        onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Department</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.department_name || d.name}</option>
                        ))}
                      </select>
                      <Layers className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Program Selection</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.program_id}
                        onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Program</option>
                        {programs.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <Book className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.academic_year_id}
                        onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Academic Year</option>
                        {academicYears.map(ay => (
                          <option key={ay.id} value={ay.id}>{ay.year_name}</option>
                        ))}
                      </select>
                      <Calendar className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.subject_id}
                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Subject</option>
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <FileText className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Exam Type</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.exam_type}
                        onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="" disabled className="font-medium text-slate-500">Select Exam Type</option>
                        {examTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.type_name}</option>
                        ))}
                      </select>
                      <Hash className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Schedule Date</label>
                    <div className="relative">
                      <input
                        required
                        type="date"
                        value={formData.exam_date}
                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-purple-500/20 ${formData.status ? 'bg-purple-500' : 'bg-slate-200'}`}
                  >
                    <span 
                      className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${formData.status ? 'transform translate-x-6' : ''}`}
                    >
                      {formData.status && <Check size={12} className="text-purple-500" />}
                    </span>
                  </button>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Active Specification</p>
                    <p className="text-[11px] font-medium text-slate-500">Enable this exam to be used for evaluations</p>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 mt-auto shrink-0">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 bg-white border border-slate-200 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="examForm"
                disabled={submitLoading}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black rounded-xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} />
                    <span>{editingId ? 'Save Configuration' : 'Establish Schedule'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exams;
