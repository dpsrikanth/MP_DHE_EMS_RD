import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Plus, Pencil, X, Check, Calendar, Book, Layers, Hash, ArrowRight,
  AlertCircle, Globe, Users, BookOpen, Clock
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, ColumnVisibilitySelector } from '../components/TableControls';
import authUtils from "../utils/authUtils";
import { toast } from 'react-toastify';

const Exams = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For college admin: tab switcher between Internal and External exams
  const isCollegeAdminRole = authUtils.isCollegeAdmin();
  const [examTypeFilter, setExamTypeFilter] = useState(isCollegeAdminRole ? 'internal' : 'all');

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

  // Shortage Request Modal State
  const [shortageData, setShortageData] = useState(null);
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [shortageLoading, setShortageLoading] = useState(false);

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
    const allGroups = Object.values(groups).sort((a, b) => b.id - a.id);

    // For college admin: filter by selected tab (internal=type 1, external=type 2)
    if (isCollegeAdminRole) {
      const typeVal = examTypeFilter === 'internal' ? 1 : 2;
      return allGroups.filter(g => g.exam_type === typeVal);
    }
    return allGroups;
  }, [data, examTypeFilter, isCollegeAdminRole]);


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

  // fetchComponents logic moved to ExamsForm.js

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/exams', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || 'Unknown Error'}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Non-JSON response from /api/exams:", text);
        throw new Error("Server returned an invalid response format (Expected JSON)");
      }

      const jsonData = await response.json();
      setData(Array.isArray(jsonData) ? jsonData : []);
    } catch (err) {
      console.error("Fetch exams error:", err);
      setError(err.message === "Unexpected end of JSON input" 
        ? "Server returned an empty response. This might be a server-side error." 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  // internal modal handlers removed - logic moved to ExamsForm.js

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

      // For internal exams: fire ONE request first — backend checks ALL subjects in the series.
      // If that passes, fire the rest. This prevents partial publish.
      const firstResponse = await fetch(`http://localhost:8080/api/exams/${series.subjects[0].id}/publish-results`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ results_published: newStatus })
      });

      if (!firstResponse.ok) {
        const err = await firstResponse.json();
        toast.error(err.message || 'Failed to publish results');
        return; // Abort — don't publish any remaining subjects
      }

      // First subject passed — now publish the rest in parallel
      if (series.subjects.length > 1) {
        const rest = series.subjects.slice(1);
        const responses = await Promise.all(
          rest.map(s =>
            fetch(`http://localhost:8080/api/exams/${s.id}/publish-results`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ results_published: newStatus })
            })
          )
        );
        const failures = await Promise.all(
          responses.filter(r => !r.ok).map(r => r.json())
        );
        if (failures.length > 0) {
          toast.error(failures[0]?.message || 'Some subjects failed to publish');
          fetchData();
          return;
        }
      }

      toast.success(`Results ${newStatus ? 'published' : 'unpublished'} for all subjects.`);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Network error while publishing results');
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
    toast.info(`Deleting exam series (${series.subjects.length} subjects)...`);
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
      toast.success('Exam series deleted successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Error deleting exam series');
    } finally {
      setLoading(false);
    }
  };


  // handleSubmit removed - logic moved to ExamsForm.js

  const handleSendShortageRequest = async () => {
    setShortageLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/examination-halls/shortage-request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          college_id: shortageData.college_id,
          program_id: shortageData.program_id,
          semester_id: shortageData.semester_id,
          student_count: shortageData.studentCount,
          available_capacity: shortageData.totalCapacity,
          shortage: shortageData.shortage
        })
      });

      if (!res.ok) throw new Error("Failed to send request");
      
      toast.success('Shortage request sent to University Admin successfully.');
      setIsShortageModalOpen(false);
      setShortageData(null);
    } catch (err) {
      toast.error('Error sending shortage request: ' + err.message);
    } finally {
      setShortageLoading(false);
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
            {/* Only show Schedule Exam for non-college-admin, or college admin on Internal tab */}
            {(!isCollegeAdminRole || examTypeFilter === 'internal') && (
              <button 
                onClick={() => navigate('/exams/add')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl shadow-xl shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Schedule Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher — only visible for college admin */}
        {isCollegeAdminRole && (
          <div className="px-8 pb-0 flex items-center gap-2 border-b border-slate-100">
            <button
              onClick={() => setExamTypeFilter('internal')}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 ${
                examTypeFilter === 'internal'
                  ? 'border-purple-500 text-purple-600 bg-purple-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📝 Internal Exams
            </button>
            <button
              onClick={() => setExamTypeFilter('external')}
              className={`px-6 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all border-b-2 ${
                examTypeFilter === 'external'
                  ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              🌐 External Exams
            </button>
          </div>
        )}

        {/* Read-only banner for college admin viewing external exams */}
        {isCollegeAdminRole && examTypeFilter === 'external' && (
          <div className="mx-8 mt-4 px-5 py-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-sm text-blue-700 font-semibold">
            <Globe size={16} className="shrink-0" />
            External exams are managed by the University Admin. You can view them here but cannot create, edit or delete them.
          </div>
        )}

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
                    {(authUtils.isAdmin() || (authUtils.isCollegeAdmin() && item.exam_type != 2)) ? (
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Orchestration</h4>
                        <div className="space-y-3">
                            <button 
                              onClick={() => handleTogglePublish(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].is_published ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                              <span className="uppercase tracking-widest">{item.subjects[0].is_published ? 'Published' : 'Publish All'}</span>
                              <Globe size={16} />
                            </button>
                            {/* Open Enrollment: only for external exams — internal exams need no registration */}
                            {item.exam_type !== 1 && (
                              <button 
                                onClick={() => handleToggleApplications(item)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].student_application_open ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                              >
                                <span className="uppercase tracking-widest">{item.subjects[0].student_application_open ? 'Enrolling' : 'Open Enrollment'}</span>
                                <Users size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleToggleResultsPublish(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-xs ${item.subjects[0].results_published ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'}`}
                            >
                              <span className="uppercase tracking-widest">{item.subjects[0].results_published ? 'Results Live' : 'Publish Results'}</span>
                              <Check size={16} />
                            </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50 py-8">
                        <Globe size={40} className="text-slate-300 mb-4" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Managed By<br/>University</p>
                      </div>
                    )}

                    {!(authUtils.isCollegeAdmin() && item.exam_type == 2) && (
                      <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-200">
                        <button 
                          onClick={() => navigate(`/exams/edit/${item.id}`)}
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


      {/* Modals removed - logic moved to ExamsForm.js */}
    </div>
  );
};

export default Exams;
