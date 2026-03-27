import React, { useState, useEffect } from "react";
import { 
  FileText, Plus, Pencil, X, Check, Calendar, Book, Layers, Hash, ArrowRight,
  AlertCircle, Globe, Users, BookOpen, Clock
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, ColumnVisibilitySelector } from '../components/TableControls';
import authUtils from "../utils/authUtils";

const Exams = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dropdown data
  const [colleges, setColleges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectMappings, setSubjectMappings] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    semester_id: '',
    college_id: '',
    university_id: '',
    exam_type: authUtils.isCollegeAdmin() ? '1' : '',
    department_id: '',
    program_id: '',
    academic_year_id: '',
    subjects: [{ id: Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }],
    status: true
  });

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'details', label: 'Assessment Details' },
    { key: 'context', label: 'Academic Context' },
    { key: 'date', label: 'Timeline' }
  ];


  // Group data by series for display
  const groupedData = React.useMemo(() => {
    const groups = {};
    data.forEach(item => {
      // Group key: Name + Semester + College + Type + Program + Academic Year
      const key = `${item.exam_name}_${item.semester_id}_${item.college_id || 'null'}_${item.exam_type}_${item.program_id}_${item.academic_year_id}`;
      if (!groups[key]) {
        groups[key] = {
          ...item,
          subjects: []
        };
      }
      groups[key].subjects.push({
        id: item.id,
        subject_id: item.subject_id,
        subject_name: item.subject_name,
        exam_date: item.exam_date,
        start_time: item.start_time,
        end_time: item.end_time,
        is_published: item.is_published,
        results_published: item.results_published,
        student_application_open: item.student_application_open,
        has_marks_structure: item.has_marks_structure
      });
    });
    // Sort groups by ID (highest/latest first)
    return Object.values(groups).sort((a, b) => b.id - a.id);
  }, [data]);

  // Apply search/pagination to groupedData if needed, but useDataTable already handles 'data'.
  // We'll update useDataTable to use groupedData or manually filter/paginate here for better control.
  // Actually, for consistency with 'useDataTable' hook, let's keep it simple and just group the paginatedData 
  // OR map the paginatedData to its group owners. 
  // Best: Group the entire dataset, then apply search/pagination to groups.
  const {
    paginatedData: groupedPaginatedData,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    visibleColumns,
    toggleColumn
  } = useDataTable(groupedData, { 
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
      
      const [colRes, uniRes, semRes, typeRes, depRes, progRes, yearRes, subRes, mapRes] = await Promise.all([
        fetch('http://localhost:8080/api/colleges', { headers }),
        fetch('http://localhost:8080/api/universities', { headers }),
        fetch('http://localhost:8080/api/master-semesters', { headers }),
        fetch('http://localhost:8080/api/exam-types', { headers }),
        fetch('http://localhost:8080/api/master-departments', { headers }),
        fetch('http://localhost:8080/api/master-programs', { headers }),
        fetch('http://localhost:8080/api/academic-years', { headers }),
        fetch('http://localhost:8080/api/master-subjects', { headers }),
        fetch('http://localhost:8080/api/subject-mappings', { headers })
      ]);

      if (colRes.ok) setColleges(await colRes.json());
      if (uniRes.ok) setUniversities(await uniRes.json());
      if (semRes.ok) setSemesters(await semRes.json());
      if (typeRes.ok) setExamTypes(await typeRes.json());
      if (depRes.ok) setDepartments(await depRes.json());
      if (progRes.ok) setPrograms(await progRes.json());
      if (yearRes.ok) setAcademicYears(await yearRes.json());
      if (subRes.ok) setSubjects(await subRes.json());
      if (mapRes.ok) setSubjectMappings(await mapRes.json());
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  const fetchComponents = async (context) => {
    const { college_id, department_id, program_id, semester_id, subject_id } = context;
    
    // Only fetch if ALL context fields are present
    if (!college_id || !department_id || !program_id || !semester_id || !subject_id) {
      console.log("FRONTEND DEBUG: Incomplete context, clearing components");
      setAvailableComponents([]);
      if (!editingId) setFormData(prev => ({ ...prev, name: '' }));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const query = new URLSearchParams({
        college_id, department_id, program_id, semester_id, subject_id
      }).toString();

      console.log("FRONTEND DEBUG: Fetching components with URL:", `http://localhost:8080/api/college-admin/get-components?${query}`);

      const res = await fetch(`http://localhost:8080/api/college-admin/get-components?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const components = await res.json();
        console.log("FRONTEND DEBUG: Received components:", components);
        setAvailableComponents(components);
        
        // Auto-select if only one component exists and name is currently empty
        if (components.length === 1 && !formData.name) {
          setFormData(prev => ({ ...prev, name: components[0] }));
        }
      } else {
        console.error("FRONTEND DEBUG: Fetch failed with status:", res.status);
        setAvailableComponents([]);
      }
    } catch (err) {
      console.error("FRONTEND DEBUG: Fetch components error:", err);
      setAvailableComponents([]);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchComponents(formData);
    }
  }, [formData.college_id, formData.department_id, formData.program_id, formData.semester_id, formData.subject_id, isModalOpen]);

  // Auto-generate exam name from selected field values
  const generateExamName = () => {
    const program = programs.find(p => p.id === parseInt(formData.program_id));
    const semester = semesters.find(s => s.id === parseInt(formData.semester_id));
    const examType = examTypes.find(t => t.id === parseInt(formData.exam_type));
    const academicYear = academicYears.find(ay => ay.id === parseInt(formData.academic_year_id));
    const college = colleges.find(c => c.id === parseInt(formData.college_id));
    const university = universities.find(u => u.id === parseInt(formData.university_id));

    const parts = [];
    if (program) parts.push(program.name);
    if (semester) {
      // Extract number from semester name e.g. 'Semester 1' -> 'Sem-1'
      const semNum = semester.semester_name?.match(/\d+/)?.[0];
      parts.push(semNum ? `Sem-${semNum}` : semester.semester_name);
    }
    // Institution: college name or selected university
    if (formData.exam_type == 2 && !formData.college_id) {
      parts.push(university ? (university.name || 'University') : 'University');
    } else {
      parts.push(college ? college.name || college.college_name : 'University');
    }
    if (examType) parts.push(examType.type_name);
    parts.push('Exam');
    if (academicYear) parts.push(academicYear.year_name);

    return parts.join(' ');
  };

  useEffect(() => {
    if (!isModalOpen || editingId) return; // Don't override on edit
    const generated = generateExamName();
    if (generated && generated !== 'Exam') {
      setFormData(prev => ({ ...prev, name: generated }));
    }
  }, [formData.program_id, formData.semester_id, formData.college_id, formData.university_id, formData.exam_type, formData.academic_year_id]);

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
    const auth = authUtils.getAuth();
    const isRestricted = authUtils.isCollegeAdmin() || authUtils.isHOD();
    const defaultCollegeId = isRestricted ? auth.collegeId : '';
    const defaultDepartmentId = authUtils.isHOD() ? auth.departmentId : '';
    const defaultExamType = authUtils.isCollegeAdmin() ? '1' : '';

    setFormData({ 
      name: '', semester_id: '', college_id: defaultCollegeId, university_id: '', exam_type: defaultExamType, 
      department_id: defaultDepartmentId, program_id: '', academic_year_id: '', 
      subjects: [{ id: Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }],
      status: true 
    });
    setEditingId(null);
    setAvailableComponents([]);
    setIsModalOpen(false);
    setError(null);
  };

  const handleEdit = (exam) => {
    // Find all subjects in this series
    const series = data.filter(item => 
      item.exam_name === exam.exam_name && 
      item.semester_id === exam.semester_id && 
      (item.college_id === exam.college_id || (!item.college_id && !exam.college_id)) &&
      item.exam_type === exam.exam_type &&
      item.program_id === exam.program_id &&
      item.academic_year_id === exam.academic_year_id
    );

    setFormData({
      name: exam.exam_name || '',
      semester_id: exam.semester_id || '',
      college_id: exam.college_id || 'university_wide',
      exam_type: exam.exam_type || '',
      department_id: exam.department_id || '',
      program_id: exam.program_id || '',
      academic_year_id: exam.academic_year_id || '',
      status: exam.status,
      // Map existing records to the subjects array structure
      subjects: series.map(s => ({
        id: s.id,
        subject_id: s.subject_id,
        exam_date: s.exam_date ? new Date(s.exam_date).toISOString().split('T')[0] : '',
        start_time: s.start_time || '',
        end_time: s.end_time || ''
      }))
    });
    setEditingId(exam.id);
    setIsModalOpen(true);
  };

  const handleTogglePublish = async (series) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      // Determine new status (toggle based on the first item in series for consistency)
      const newStatus = !series.subjects[0].is_published;
      
      const promises = series.subjects.map(s => 
        fetch(`http://localhost:8080/api/exams/${s.id}/publish`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ is_published: newStatus })
        })
      );
      
      await Promise.all(promises);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleResultsPublish = async (series) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const newStatus = !series.subjects[0].results_published;
      
      const promises = series.subjects.map(s => 
        fetch(`http://localhost:8080/api/exams/${s.id}/publish-results`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ results_published: newStatus })
        })
      );
      
      await Promise.all(promises);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApplications = async (series) => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const newStatus = !series.subjects[0].student_application_open;

      const promises = series.subjects.map(s => 
        fetch(`http://localhost:8080/api/exams/${s.id}/toggle-applications`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ open: newStatus })
        })
      );
      
      await Promise.all(promises);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (series) => {
    if (!window.confirm(`Are you sure you want to delete this entire exam series (${series.subjects.length} subjects)?`)) return;
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      
      // Delete all subjects in parallel
      const deletePromises = series.subjects.map(s => 
        fetch(`http://localhost:8080/api/exams/${s.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(deletePromises);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error deleting exam series");
    } finally {
      setLoading(false);
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

      // Normalize 'university_wide' sentinel back to empty string (null college)
      const normalizedFormData = {
        ...formData,
        college_id: formData.college_id === 'university_wide' ? '' : formData.college_id
      };
      const payload = editingId 
        ? { ...normalizedFormData } 
        : { ...normalizedFormData, subjects: normalizedFormData.subjects };

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
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
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Schedule Exam</span>
            </button>
          </div>
        </div>

        {/* Premium Card-based List */}
        <div className="p-8 space-y-6">
          {groupedPaginatedData.length > 0 ? (
            groupedPaginatedData.map((item) => (
              <div key={item.id} className="group glass-card rounded-[2rem] border border-slate-200/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 animate-premium-fade">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* Card Section 1: Identity & Meta */}
                  <div className="p-8 lg:w-1/3 bg-slate-50/30">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                        <Layers size={28} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        ID: #{item.id}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.exam_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                        {item.semester_name || `SEM-${item.semester_id}`}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        {item.exam_type_name || 'General Exam'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Globe size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Institution</p>
                          <p className="text-xs font-bold text-slate-700 leading-tight">{item.college_name || 'University-wide'}</p>
                        </div>
                      </div>
                      
                      {(item.department_name || item.program_name) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <BookOpen size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Program Context</p>
                            <p className="text-xs font-bold text-slate-700 leading-tight">
                              {[item.department_name, item.program_name].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Section 2: Timeline & Subjects */}
                  <div className="p-8 lg:w-1/2 flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Examination Schedule</h4>
                      <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        {item.subjects.length} Subjects in Series
                      </div>
                    </div>

                    <div className="space-y-4">
                      {item.subjects.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group/sub">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 group-hover/sub:bg-indigo-50 group-hover/sub:text-indigo-500 group-hover/sub:border-indigo-100 transition-colors">
                              <span className="text-xs font-black">{new Date(sub.exam_date).getDate()}</span>
                              <span className="text-[8px] font-bold uppercase">{new Date(sub.exam_date).toLocaleString('default', { month: 'short' })}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 mb-0.5">{sub.subject_name}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                  <Clock size={10} />
                                  {sub.start_time}-{sub.end_time}
                                </div>
                                {sub.is_published ? (
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-50 rounded-md">LIVE</span>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1.5 py-0.5 bg-slate-50 rounded-md">DRAFT</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {sub.student_application_open && (
                               <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" title="Applications Open" />
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Section 3: Orchestration & Actions */}
                  <div className="p-8 lg:w-64 bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Orchestration</h4>
                      <div className="space-y-3">
                        {(authUtils.isAdmin() || authUtils.isCollegeAdmin()) && (
                          <>
                            <button 
                              onClick={() => handleTogglePublish(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].is_published ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                              <span className="uppercase tracking-widest">{item.subjects[0].is_published ? 'Published' : 'Publish All'}</span>
                              <Globe size={16} />
                            </button>
                            <button 
                              onClick={() => handleToggleApplications(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].student_application_open ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                              <span className="uppercase tracking-widest">{item.subjects[0].student_application_open ? 'Enrolling' : 'Open Enrollment'}</span>
                              <Users size={16} />
                            </button>
                            <button 
                              onClick={() => handleToggleResultsPublish(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].results_published ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}
                            >
                              <span className="uppercase tracking-widest">{item.subjects[0].results_published ? 'Results Live' : 'Publish Results'}</span>
                              <Check size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {!(authUtils.isCollegeAdmin() && item.exam_type == 2) && (
                      <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-200">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-indigo-500/10"
                        >
                          <Pencil size={14} />
                          Modify
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center glass-card rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                <FileText size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No Schedules Found</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Capture institutional assessments by establishing a new examination schedule.</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
              >
                Clear Filters
              </button>
            </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Exam Type</label>
                    <div className="relative">
                      <select
                        required
                        disabled={authUtils.isCollegeAdmin()}
                        value={formData.exam_type}
                        onChange={(e) => setFormData({ ...formData, exam_type: e.target.value, college_id: '', university_id: '' })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer"
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
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Exam Title</label>
                    <div className="relative">
                      <input
                        required
                        disabled={!formData.exam_type}
                        type="text"
                        placeholder="Auto-generated from selections below..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 pr-14 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        disabled={!formData.exam_type}
                        title="Regenerate name from selections"
                        onClick={() => {
                          const generated = generateExamName();
                          if (generated && generated !== 'Exam') setFormData(prev => ({ ...prev, name: generated }));
                        }}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl transition-all text-sm ${!formData.exam_type ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-purple-50 text-purple-500 hover:bg-purple-100'}`}
                      >
                        ✨
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${!formData.exam_type ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  {(!authUtils.isCollegeAdmin() && !authUtils.isHOD() && formData.exam_type == 2) ? (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">University Context</label>
                      <div className="relative">
                        <select
                          required
                          value={formData.university_id}
                          onChange={(e) => setFormData({ ...formData, university_id: e.target.value, college_id: '' })}
                          className="w-full h-14 bg-indigo-50 border border-indigo-200 text-indigo-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 px-5 transition-all outline-none appearance-none cursor-pointer disabled:opacity-70"
                        >
                          <option value="" disabled className="font-medium text-slate-500">Select University</option>
                          {universities.map(u => (
                            <option key={u.id} value={u.id}>🌐 {u.name}</option>
                          ))}
                        </select>
                        <Globe className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">College Context</label>
                      <div className="relative">
                        <select
                          required={formData.exam_type != 2}
                          disabled={authUtils.isCollegeAdmin() || authUtils.isHOD()}
                          value={formData.college_id}
                          onChange={(e) => setFormData({ ...formData, college_id: e.target.value, university_id: '' })}
                          className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled className="font-medium text-slate-500">Select College</option>
                          {colleges.map(c => (
                            <option key={c.id} value={c.id}>{c.name || c.college_name}</option>
                          ))}
                        </select>
                        <Layers className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Semester Cycle</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.semester_id}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          semester_id: e.target.value,
                          subject_id: '',
                          name: ''
                        })}
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

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${!formData.exam_type ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Department Context</label>
                    <div className="relative">
                      <select
                        required
                        disabled={authUtils.isHOD()}
                        value={formData.department_id}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          department_id: e.target.value,
                          program_id: '',
                          subject_id: '',
                          name: ''
                        })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
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
                        disabled={!formData.department_id}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          program_id: e.target.value,
                          subject_id: '',
                          name: ''
                        })}
                        className="w-full h-14 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-5 transition-all outline-none appearance-none cursor-pointer disabled:opacity-70"
                      >
                        <option value="" disabled className="font-medium text-slate-500">
                          {formData.department_id ? "Select Program" : "Select Department First"}
                        </option>
                        {programs
                          .filter(p => p.department_ids && p.department_ids.includes(parseInt(formData.department_id)))
                          .map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </select>
                      <Book className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${!formData.exam_type ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
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
                </div>

                <div className={`space-y-4 pt-4 border-t border-slate-100 transition-opacity duration-300 ${!formData.exam_type ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex items-center justify-between mb-2">
                     <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subjects & Schedule</label>
                     <button 
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        subjects: [...formData.subjects, { id: 'new-' + Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }]
                      })}
                      className="text-[10px] font-black uppercase text-purple-600 hover:text-purple-700 flex items-center gap-1 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100 transition-all"
                     >
                       <Plus size={12} /> Add Subject Row
                     </button>
                  </div>
                  
                  {formData.subjects.map((sub, index) => (
                    <div key={sub.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4 relative">
                      {formData.subjects.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            subjects: formData.subjects.filter(s => s.id !== sub.id)
                          })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-100 text-slate-400 hover:text-red-500 rounded-full flex items-center justify-center shadow-sm transition-all"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                          <select
                            required
                            value={sub.subject_id}
                            onChange={(e) => {
                              const newSubs = [...formData.subjects];
                              newSubs[index].subject_id = e.target.value;
                              setFormData({ ...formData, subjects: newSubs });
                            }}
                            className="w-full h-12 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-4 transition-all outline-none"
                          >
                            <option value="">Select Subject</option>
                            {/* Filtering logic for subjects */}
                            {(() => {
                              const programIdInt = parseInt(formData.program_id);
                              const semesterIdInt = parseInt(formData.semester_id);
                              const departmentIdInt = parseInt(formData.department_id);
                              if (!formData.program_id || !formData.semester_id) return [];
                              const mappedFromTableIds = subjectMappings
                                .filter(m => m.program_id === programIdInt && m.semester_id === semesterIdInt)
                                .map(m => m.subject_id);
                              const mappedDirectly = subjects.filter(s => {
                                const progMatch = s.program_id === programIdInt;
                                const semMatch = s.semester_id === semesterIdInt;
                                const deptMatch = !departmentIdInt || (s.department_ids && Array.isArray(s.department_ids) && s.department_ids.includes(departmentIdInt));
                                return progMatch && semMatch && deptMatch;
                              });
                              const allMappedIds = new Set([...mappedFromTableIds, ...mappedDirectly.map(s => s.id)]);
                              return subjects.filter(s => allMappedIds.has(s.id));
                            })().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date</label>
                          <input
                            required
                            type="date"
                            value={sub.exam_date}
                            onChange={(e) => {
                              const newSubs = [...formData.subjects];
                              newSubs[index].exam_date = e.target.value;
                              setFormData({ ...formData, subjects: newSubs });
                            }}
                            className="w-full h-12 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-4 transition-all outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                          <input
                            type="text"
                            placeholder="09.00 A.M"
                            value={sub.start_time}
                            onChange={(e) => {
                              const newSubs = [...formData.subjects];
                              newSubs[index].start_time = e.target.value;
                              setFormData({ ...formData, subjects: newSubs });
                            }}
                            className="w-full h-12 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-4 transition-all outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                          <input
                            type="text"
                            placeholder="12.00 NOON"
                            value={sub.end_time}
                            onChange={(e) => {
                              const newSubs = [...formData.subjects];
                              newSubs[index].end_time = e.target.value;
                              setFormData({ ...formData, subjects: newSubs });
                            }}
                            className="w-full h-12 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 px-4 transition-all outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
