import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, Plus, Pencil, X, Check, Calendar, Book, Layers, Hash, ArrowRight,
  AlertCircle, Globe, Users, BookOpen, Clock, Filter, ChevronDown
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, ColumnVisibilitySelector } from '../components/TableControls';
import authUtils from "../utils/authUtils";
import { toast } from 'react-toastify';
import { formatDate } from '../utils/dateUtils';
import { masterDataApi } from '../api/masterDataApi';
import { examApi } from '../api/examApi';
const Exams = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // For college admin and university admin: tab switcher between Internal and External exams
  const isCollegeAdminRole = authUtils.isCollegeAdmin();
  const isUniversityAdminRole = authUtils.isUniversityAdmin() || authUtils.isAdmin();
  const [examTypeFilter, setExamTypeFilter] = useState('internal');

  // University Admin cascading filters
  const [filterUniversity, setFilterUniversity] = useState('');
  const [filterCollege, setFilterCollege] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

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
    { key: 'id', label: 'ID Reference', mandatory: true },
    { key: 'details', label: 'Assessment Details', mandatory: true },
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
        has_marks_structure: item.has_marks_structure,
        marks_submitted: item.marks_submitted
      });
    });
    // Sort subjects within each group by date ascending
    Object.values(groups).forEach(group => {
      group.subjects.sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date));
    });

    // Sort groups by ID (highest/latest first)
    let allGroups = Object.values(groups).sort((a, b) => b.id - a.id);

    // For college admin: filter by selected tab (internal=type 1, external=type 2)
    const typeVal = examTypeFilter === 'internal' ? 1 : 2;

    if (isCollegeAdminRole) {
      let filtered = allGroups.filter(g => g.exam_type === typeVal);
      if (filterProgram) {
        filtered = filtered.filter(g => String(g.program_id) === String(filterProgram));
      }
      if (filterSemester) {
        filtered = filtered.filter(g => String(g.semester_id) === String(filterSemester));
      }
      return filtered;
    }

    // University Admin cascading filters
    // Note: External exams (exam_type=2) are university-wide with college_id=NULL,
    // so we include them alongside the selected college's exams.
    if (isUniversityAdminRole) {
      allGroups = allGroups.filter(g => g.exam_type === typeVal);
      
      if (filterUniversity) {
        allGroups = allGroups.filter(g => String(g.university_id) === String(filterUniversity));
      }
      if (filterCollege) {
        allGroups = allGroups.filter(g => 
          String(g.college_id) === String(filterCollege) || !g.college_id
        );
      }
      if (filterProgram) {
        allGroups = allGroups.filter(g => String(g.program_id) === String(filterProgram));
      }
      if (filterSemester) {
        allGroups = allGroups.filter(g => String(g.semester_id) === String(filterSemester));
      }
    }

    return allGroups;
  }, [data, examTypeFilter, isCollegeAdminRole, isUniversityAdminRole, filterUniversity, filterCollege, filterProgram, filterSemester]);

  // Cascading filter options: derive available options from the actual data
  const filterOptions = useMemo(() => {
    // Build all groups first (ungrouped data for option derivation)
    const groups = {};
    data.forEach(item => {
      const key = `${item.exam_name}_${item.semester_id}_${item.college_id || 'null'}_${item.exam_type}_${item.program_id}_${item.academic_year_id}`;
      if (!groups[key]) {
        groups[key] = { ...item };
      }
    });
    const allGroups = Object.values(groups);

    // Available Universities from actual exam data
    const universitySet = new Map();
    allGroups.forEach(g => {
      if (g.university_id) universitySet.set(String(g.university_id), g.university_name || `University #${g.university_id}`);
    });
    const availableUniversities = Array.from(universitySet, ([id, name]) => ({ id, name }));

    // Available colleges: filtered by selected university
    let filteredForColleges = allGroups;
    if (filterUniversity) filteredForColleges = filteredForColleges.filter(g => String(g.university_id) === String(filterUniversity));
    const collegeSet = new Map();
    filteredForColleges.forEach(g => {
      if (g.college_id) collegeSet.set(String(g.college_id), g.college_name || `College #${g.college_id}`);
    });
    const availableColleges = Array.from(collegeSet, ([id, name]) => ({ id, name }));

    // Programs: filtered by selected university + college (include external/university-wide exams too)
    let filteredForPrograms = allGroups;
    if (filterUniversity) filteredForPrograms = filteredForPrograms.filter(g => String(g.university_id) === String(filterUniversity));
    if (filterCollege) filteredForPrograms = filteredForPrograms.filter(g => 
      String(g.college_id) === String(filterCollege) || !g.college_id
    );
    const programSet = new Map();
    filteredForPrograms.forEach(g => {
      if (g.program_id) programSet.set(String(g.program_id), g.program_name || `Program #${g.program_id}`);
    });
    const availablePrograms = Array.from(programSet, ([id, name]) => ({ id, name }));

    // Semesters: filtered by selected university + college + program (include external/university-wide exams too)
    let filteredForSemesters = allGroups;
    if (filterUniversity) filteredForSemesters = filteredForSemesters.filter(g => String(g.university_id) === String(filterUniversity));
    if (filterCollege) filteredForSemesters = filteredForSemesters.filter(g => 
      String(g.college_id) === String(filterCollege) || !g.college_id
    );
    if (filterProgram) filteredForSemesters = filteredForSemesters.filter(g => String(g.program_id) === String(filterProgram));
    const semesterSet = new Map();
    filteredForSemesters.forEach(g => {
      if (g.semester_id) semesterSet.set(String(g.semester_id), g.semester_name || `Semester ${g.semester_id}`);
    });
    const availableSemesters = Array.from(semesterSet, ([id, name]) => ({ id, name }));

    // Exam types: filtered by university + college + program + semester (include external/university-wide exams too)
    let filteredForTypes = allGroups;
    if (filterUniversity) filteredForTypes = filteredForTypes.filter(g => String(g.university_id) === String(filterUniversity));
    if (filterCollege) filteredForTypes = filteredForTypes.filter(g => 
      String(g.college_id) === String(filterCollege) || !g.college_id
    );
    if (filterProgram) filteredForTypes = filteredForTypes.filter(g => String(g.program_id) === String(filterProgram));
    if (filterSemester) filteredForTypes = filteredForTypes.filter(g => String(g.semester_id) === String(filterSemester));
    const typeSet = new Map();
    filteredForTypes.forEach(g => {
      if (g.exam_type) typeSet.set(String(g.exam_type), g.exam_type_name || (g.exam_type === 1 ? 'Internal' : 'External'));
    });
    const availableExamTypes = Array.from(typeSet, ([id, name]) => ({ id, name }));

    return { availableUniversities, availableColleges, availablePrograms, availableSemesters };
  }, [data, filterUniversity, filterCollege, filterProgram, filterSemester]);

  // College Admin filter options: derive from exams matching current tab (internal/external)
  const collegeAdminFilterOptions = useMemo(() => {
    if (!isCollegeAdminRole) return { programs: [], semesters: [] };
    const typeVal = examTypeFilter === 'internal' ? 1 : 2;
    const groups = {};
    data.forEach(item => {
      const key = `${item.exam_name}_${item.semester_id}_${item.college_id || 'null'}_${item.exam_type}_${item.program_id}_${item.academic_year_id}`;
      if (!groups[key]) groups[key] = { ...item };
    });
    let tabExams = Object.values(groups).filter(g => g.exam_type === typeVal);

    // Programs in current tab
    const progSet = new Map();
    tabExams.forEach(g => {
      if (g.program_id) progSet.set(String(g.program_id), g.program_name || `Program #${g.program_id}`);
    });
    const programs = Array.from(progSet, ([id, name]) => ({ id, name }));

    // Semesters: filtered by selected program
    let filteredForSem = tabExams;
    if (filterProgram) filteredForSem = filteredForSem.filter(g => String(g.program_id) === String(filterProgram));
    const semSet = new Map();
    filteredForSem.forEach(g => {
      if (g.semester_id) semSet.set(String(g.semester_id), g.semester_name || `Semester ${g.semester_id}`);
    });
    const semesters = Array.from(semSet, ([id, name]) => ({ id, name }));

    return { programs, semesters };
  }, [data, isCollegeAdminRole, examTypeFilter, filterProgram]);

  // Reset downstream filters when a parent filter changes
  const handleUniversityFilterChange = (val) => {
    setFilterUniversity(val);
    setFilterCollege('');
    setFilterProgram('');
    setFilterSemester('');
  };
  const handleCollegeFilterChange = (val) => {
    setFilterCollege(val);
    setFilterProgram('');
    setFilterSemester('');
  };
  const handleProgramFilterChange = (val) => {
    setFilterProgram(val);
    setFilterSemester('');
  };
  const handleSemesterFilterChange = (val) => {
    setFilterSemester(val);
  };
  const handleClearAllFilters = () => {
    setFilterUniversity('');
    setFilterCollege('');
    setFilterProgram('');
    setFilterSemester('');
  };
  const hasActiveFilters = filterUniversity || filterCollege || filterProgram || filterSemester;


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
      const [colRes, uniRes, semRes, typeRes, depRes, progRes, yearRes, subRes, mapRes] = await Promise.all([
        masterDataApi.getColleges(),
        masterDataApi.getUniversities(),
        masterDataApi.getSemesters(),
        examApi.getExamTypes(),
        masterDataApi.getDepartments(),
        masterDataApi.getPrograms(),
        masterDataApi.getAcademicYears(),
        masterDataApi.getSubjects(),
        masterDataApi.getSubjectMappings()
      ]);

      if (colRes) setColleges(colRes);
      if (uniRes) setUniversities(uniRes);
      if (semRes) setSemesters(semRes);
      if (typeRes) setExamTypes(typeRes);
      if (depRes) setDepartments(depRes);
      if (progRes) setPrograms(progRes);
      if (yearRes) setAcademicYears(yearRes);
      if (subRes) setSubjects(subRes);
      if (mapRes) setSubjectMappings(mapRes);
    } catch (err) {
      console.error("Failed to fetch dropdown data:", err);
    }
  };

  // fetchComponents logic moved to ExamsForm.js

  const fetchData = async () => {
    try {
      const jsonData = await examApi.getExams();
      setData(Array.isArray(jsonData) ? jsonData : []);
    } catch (err) {
      console.error("Fetch exams error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // internal modal handlers removed - logic moved to ExamsForm.js

  const handleTogglePublish = async (series) => {
    try {
      setLoading(true);
      const newStatus = !series.subjects[0].is_published;
      
      const promises = series.subjects.map(s => 
        examApi.publishExam(s.id, { is_published: newStatus })
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
      setLoading(true);
      const newStatus = !series.subjects[0].results_published;

      // For internal exams: fire ONE request first — backend checks ALL subjects in the series.
      // If that passes, fire the rest. This prevents partial publish.
      let firstResponse;
      try {
        firstResponse = await examApi.publishResults(series.subjects[0].id, { results_published: newStatus });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to publish results');
        return; // Abort — don't publish any remaining subjects
      }

      if (series.subjects.length > 1) {
        const rest = series.subjects.slice(1);
        try {
          await Promise.all(
            rest.map(s =>
              examApi.publishResults(s.id, { results_published: newStatus })
            )
          );
        } catch (err) {
          toast.error(err.response?.data?.message || 'Some subjects failed to publish');
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
      setLoading(true);
      const newStatus = !series.subjects[0].student_application_open;

      const promises = series.subjects.map(s => 
        examApi.toggleApplications(s.id, { open: newStatus })
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
      setLoading(true);
      
      const deletePromises = series.subjects.map(s => examApi.deleteExam(s.id));
      
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
      await examApi.requestShortage({
        college_id: shortageData.college_id,
        program_id: shortageData.program_id,
        semester_id: shortageData.semester_id,
        student_count: shortageData.studentCount,
        available_capacity: shortageData.totalCapacity,
        shortage: shortageData.shortage
      });

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
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-bold">
      Error: {error}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
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
            {/* Column visibility: hidden for university admin and college admin */}
            {!isUniversityAdminRole && !isCollegeAdminRole && (
              <ColumnVisibilitySelector 
                columns={availableColumns} 
                visibleColumns={visibleColumns} 
                onToggle={toggleColumn} 
              />
            )}
            {/* Hide Schedule Exam for college-admin — internal exams are now managed via the Internal Schedule module */}
            {!isCollegeAdminRole && (
              <button 
                onClick={() => navigate('/exams/add')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Schedule Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        {(isCollegeAdminRole || isUniversityAdminRole) && (
          <div className="px-6 mt-2 pb-0 flex items-center gap-2 border-b border-slate-100">
            <button
              onClick={() => { setExamTypeFilter('internal'); setFilterProgram(''); setFilterSemester(''); }}
              className={`px-6 py-3 text-[13px] font-black  tracking-widest rounded-t-xl transition-all border-b-2 ${
                examTypeFilter === 'internal'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              📝 Internal Exams
            </button>
            <button
              onClick={() => { setExamTypeFilter('external'); setFilterProgram(''); setFilterSemester(''); }}
              className={`px-6 py-3 text-[13px] font-black  tracking-widest rounded-t-xl transition-all border-b-2 ${
                examTypeFilter === 'external'
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              🌐 External Exams
            </button>
          </div>
        )}

        {/* University Admin: Cascading Filter Bar */}
        {isUniversityAdminRole && (
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50/80 to-purple-50/40 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo- flex items-center justify-center text-indigo-">
                <Filter size={14} />
              </div>
              <span className="text-[12px] font-black text-slate-400  tracking-[0.2em]">Filter Examinations</span>
              {hasActiveFilters && (
                <button
                  onClick={handleClearAllFilters}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-black  tracking-widest text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                >
                  <X size={12} />
                  Clear All
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* University Filter */}
              <div className="relative">
                <select
                  value={filterUniversity}
                  onChange={(e) => handleUniversityFilterChange(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-slate-200 hover:border-purple-300 focus:border-indigo-500 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold text-slate-700 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Universities</option>
                  {filterOptions.availableUniversities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* College Filter */}
              <div className="relative">
                <select
                  value={filterCollege}
                  onChange={(e) => handleCollegeFilterChange(e.target.value)}
                  disabled={!filterUniversity}
                  className={`w-full appearance-none border-2 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold outline-none transition-all cursor-pointer shadow-sm ${
                    filterUniversity 
                      ? 'bg-white border-slate-200 hover:border-purple-300 focus:border-indigo-500 text-slate-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">{filterUniversity ? 'All Colleges' : 'Select University First'}</option>
                  {filterOptions.availableColleges.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Program Filter */}
              <div className="relative">
                <select
                  value={filterProgram}
                  onChange={(e) => handleProgramFilterChange(e.target.value)}
                  disabled={!filterCollege}
                  className={`w-full appearance-none border-2 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold outline-none transition-all cursor-pointer shadow-sm ${
                    filterCollege 
                      ? 'bg-white border-slate-200 hover:border-purple-300 focus:border-indigo-500 text-slate-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">{filterCollege ? 'All Programs' : 'Select College First'}</option>
                  {filterOptions.availablePrograms.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Semester Filter */}
              <div className="relative">
                <select
                  value={filterSemester}
                  onChange={(e) => handleSemesterFilterChange(e.target.value)}
                  disabled={!filterProgram}
                  className={`w-full appearance-none border-2 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold outline-none transition-all cursor-pointer shadow-sm ${
                    filterProgram 
                      ? 'bg-white border-slate-200 hover:border-purple-300 focus:border-indigo-500 text-slate-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">{filterProgram ? 'All Semesters' : 'Select Program First'}</option>
                  {filterOptions.availableSemesters.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* College Admin: Program & Semester Filter Bar */}
        {isCollegeAdminRole && (
          <div className="px-5 py-3 bg-gradient-to-r from-slate-50/80 to-purple-50/40 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo- flex items-center justify-center text-indigo-">
                <Filter size={14} />
              </div>
              <span className="text-[12px] font-black text-slate-400  tracking-[0.2em]">Filter by Program & Semester</span>
              {(filterProgram || filterSemester) && (
                <button
                  onClick={() => { setFilterProgram(''); setFilterSemester(''); }}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-black  tracking-widest text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all"
                >
                  <X size={12} />
                  Clear
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Program Filter */}
              <div className="relative">
                <select
                  value={filterProgram}
                  onChange={(e) => handleProgramFilterChange(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-slate-200 hover:border-purple-300 focus:border-indigo-500 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold text-slate-700 outline-none transition-all cursor-pointer shadow-sm"
                >
                  <option value="">All Programs</option>
                  {collegeAdminFilterOptions.programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Semester Filter */}
              <div className="relative">
                <select
                  value={filterSemester}
                  onChange={(e) => setFilterSemester(e.target.value)}
                  disabled={!filterProgram}
                  className={`w-full appearance-none border-2 rounded-xl px-4 py-3 pr-10 text-[13px] font-bold outline-none transition-all cursor-pointer shadow-sm ${
                    filterProgram 
                      ? 'bg-white border-slate-200 hover:border-purple-300 focus:border-indigo-500 text-slate-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <option value="">{filterProgram ? 'All Semesters' : 'Select Program First'}</option>
                  {collegeAdminFilterOptions.semesters.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Read-only banner for college admin viewing external exams */}
        {isCollegeAdminRole && examTypeFilter === 'external' && (
          <div className="mx-6 mt-4 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-sm text-blue-700 font-semibold">
            <Globe size={16} className="shrink-0" />
            External exams are managed by the University Admin. You can view them here but cannot create, edit or delete them.
          </div>
        )}

        {/* Premium Card-based List */}
        <div className="p-4 sm:p-5 space-y-4">
          {groupedPaginatedData.length > 0 ? (
            groupedPaginatedData.map((item) => (
              <div key={item.id} className="group glass-card rounded-[1.5rem] border border-slate-200/60 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 animate-premium-fade">
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* Card Section 1: Identity & Meta */}
                  <div className="p-5 lg:w-1/3 bg-slate-50/30">
                     <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                        <Layers size={28} />
                      </div>
                      <span className="text-[12px] font-black text-slate-400 bg-white border border-slate-200 px-3 py-1 rounded-full  tracking-widest shadow-sm">
                        ID: #{item.id}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.exam_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[12px] font-black  tracking-widest border border-indigo-100">
                        {item.semester_name || `SEM-${item.semester_id}`}
                      </span>
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[12px] font-black  tracking-widest border border-slate-200">
                        {item.exam_type_name || 'General Exam'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <Globe size={14} />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-400  tracking-widest mb-0.5">Institution</p>
                          <p className="text-[13px] font-bold text-slate-700 leading-tight">{item.college_name || 'University-wide'}</p>
                        </div>
                      </div>
                      
                      {(item.department_name || item.program_name) && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                            <BookOpen size={14} />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-0.5">Program Context</p>
                            <p className="text-[13px] font-bold text-slate-700 leading-tight">
                              {[item.department_name, item.program_name].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Section 2: Timeline & Subjects */}
                  <div className="p-5 lg:w-1/2 flex-1">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[12px] font-black text-slate-400  tracking-[0.2em]">Examination Schedule</h4>
                      <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black  tracking-widest border border-slate-200">
                        {item.subjects.length} Subjects in Series
                      </div>
                    </div>

                    <div className="space-y-4">
                      {item.subjects.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group/sub">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 group-hover/sub:bg-indigo-50 group-hover/sub:text-indigo-500 group-hover/sub:border-indigo-100 transition-colors shrink-0">
                              <span className="text-[10px] font-black leading-tight text-center">{formatDate(sub.exam_date)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 mb-0.5">{sub.subject_name}</p>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[12px] text-slate-400 font-bold  tracking-tight">
                                  <Clock size={10} />
                                  {sub.start_time}-{sub.end_time}
                                </div>
                                {sub.is_published ? (
                                  <span className="text-[8px] font-black text-emerald-500  tracking-widest px-1.5 py-0.5 bg-emerald-50 rounded-md">LIVE</span>
                                ) : (
                                  <span className="text-[8px] font-black text-slate-400  tracking-widest px-1.5 py-0.5 bg-slate-50 rounded-md">DRAFT</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             {sub.student_application_open && (
                               <div className="w-2 h-2 rounded-full bg-indigo- animate-pulse" title="Applications Open" />
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Section 3: Orchestration & Actions */}
                  <div className="p-5 lg:w-64 bg-slate-50/50 flex flex-col justify-between">
                    {(authUtils.isAdmin() || (authUtils.isCollegeAdmin() && item.exam_type != 2)) ? (
                      <div>
                        <h4 className="text-[12px] font-black text-slate-400  tracking-[0.2em] mb-6">Orchestration</h4>
                        <div className="space-y-3">
                            <button 
                              onClick={() => handleTogglePublish(item)}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-[13px] ${item.subjects[0].is_published ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                            >
                              <span className=" tracking-widest">{item.subjects[0].is_published ? 'Published' : 'Publish All'}</span>
                              <Globe size={16} />
                            </button>
                            {/* Open Enrollment: only for external exams — internal exams need no registration */}
                            {item.exam_type !== 1 && (
                              <button 
                                onClick={() => handleToggleApplications(item)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-[13px] ${item.subjects[0].student_application_open ? 'bg-indigo- border-indigo- text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'}`}
                              >
                                <span className=" tracking-widest">{item.subjects[0].student_application_open ? 'Enrolling' : 'Open Enrollment'}</span>
                                <Users size={16} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleToggleResultsPublish(item)}
                              disabled={!item.subjects.every(s => s.marks_submitted) && !item.subjects[0].results_published}
                              title={!item.subjects.every(s => s.marks_submitted) && !item.subjects[0].results_published ? "All internal marks must be 'Locked' by colleges and external marks must be 'Submitted' before publishing." : ""}
                              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all font-bold text-[13px] ${item.subjects[0].results_published ? 'bg-indigo- border-indigo- text-amber-700' : (!item.subjects.every(s => s.marks_submitted) ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed grayscale' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo- hover:text-indigo-')}`}
                            >
                              <span className=" tracking-widest">{item.subjects[0].results_published ? 'Results Live' : 'Publish Results'}</span>
                              <Check size={16} />
                            </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50 py-8">
                        <Globe size={40} className="text-slate-300 mb-4" />
                        <p className="text-[12px] font-black text-slate-400  tracking-widest leading-relaxed">Managed By<br/>University</p>
                      </div>
                    )}

                    {!(authUtils.isCollegeAdmin() && item.exam_type == 2) && (
                      <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-200">
                        <button 
                          onClick={() => navigate(`/exams/edit/${item.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black text-[12px]  tracking-widest shadow-sm hover:shadow-indigo-500/10"
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
              <h3 className="text-xl font-black text-slate-900 mb-2  tracking-tighter">No Schedules Found</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto font-medium">Capture institutional assessments by establishing a new examination schedule.</p>
              <button 
                onClick={() => { setSearchQuery(''); handleClearAllFilters(); }}
                className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[13px] font-black  tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
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
