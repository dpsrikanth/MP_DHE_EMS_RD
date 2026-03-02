import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  Plus, 
  Pencil, 
  X, 
  Check,
  User,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  ShieldAlert
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Students = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'Student ID' },
    { key: 'policies', label: 'Policy' },
    { key: 'programName', label: 'Program' },
    { key: 'admission_year', label: 'Academic Year' },
    { key: 'semister', label: 'Semester' }
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
    clearFilters,
    visibleColumns,
    toggleColumn
  } = useDataTable(data, { 
    searchFields: ['id', 'name', 'policies', 'programName', 'admission_year', 'semister'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // ---- Add Student Modal State ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    name: '',
    policies: '',
    programName: '',
    admission_year: '',
    semister: ''
  });
  const [addErrors, setAddErrors] = useState({});

  // ---- Edit Student Modal State ----
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    id: null,
    name: '',
    policies: '',
    programName: '',
    admission_year: '',
    semister: ''
  });
  const [editErrors, setEditErrors] = useState({});

  // ---- Delete Confirmation Modal State ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [studentToDelete, setStudentToDelete] = useState(null);

  // ---- Dropdown Data State ----
  const [academicYears, setAcademicYears] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchDropdownData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const data = await response.json();
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all dropdown data in parallel
      const [yearRes, policyRes, programRes, semesterRes] = await Promise.all([
        fetch('http://localhost:8080/api/academic-years', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8080/api/master-policies', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8080/api/master-programs', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:8080/api/master-semesters', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (yearRes.ok) {
        const years = await yearRes.json();
        setAcademicYears(years || []);
      }

      if (policyRes.ok) {
        const pols = await policyRes.json();
        setPolicies(pols || []);
      }

      if (programRes.ok) {
        const progs = await programRes.json();
        setPrograms(progs || []);
      }

      if (semesterRes.ok) {
        const sems = await semesterRes.json();
        setSemesters(sems || []);
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    } finally {
      setDropdownLoading(false);
    }
  };

  // ---- Validation ----
  const validate = (form) => {
    const errs = {};
    if (!form.name || !form.name.trim()) errs.name = 'Student name is required';
    if (!form.policies || !form.policies.trim()) errs.policies = 'Policy is required';
    if (!form.programName || !form.programName.trim()) errs.programName = 'Program is required';
    if (!form.admission_year) errs.admission_year = 'Admission year is required';
    if (!form.semister || !form.semister.trim()) errs.semister = 'Semester is required';
    return errs;
  };

  // ---- Add Modal Handlers ----
  const openAddModal = () => {
    setAddForm({ name: '', policies: '', programName: '', admission_year: '', semister: '' });
    setAddErrors({});
    setAddError('');
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(addForm);
    if (Object.keys(errs).length > 0) return setAddErrors(errs);

    setAddLoading(true);
    setAddError('');
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('http://localhost:8080/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to enroll student');
      }
      await fetchData();
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // ---- Edit Modal Handlers ----
  const openEditModal = (student) => {
    setEditForm({
      id: student.id,
      name: student.name,
      policies: student.policies || '',
      programName: student.programName || '',
      admission_year: student.admission_year || '',
      semister: student.semister || ''
    });
    setEditErrors({});
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => setShowEditModal(false);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(editForm);
    if (Object.keys(errs).length > 0) return setEditErrors(errs);

    setEditLoading(true);
    setEditError('');
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:8080/api/students/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          policies: editForm.policies,
          programName: editForm.programName,
          admission_year: editForm.admission_year,
          semister: editForm.semister
        })
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to update student');
      }
      await fetchData();
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ---- Delete Modal Handlers ----
  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => setShowDeleteModal(false);

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:8080/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || 'Failed to delete student');
      }
      await fetchData();
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Student Directory</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage student profile, enrollment and affiliations</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by name, ID or affiliation..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Enroll Student</span>
            </button>
          </div>
        </div>

        {/* Improved Data Table */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/20">
                <SortHeader 
                  label="StudentId" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-8 text-center"
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Policy" 
                  field="policies" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.policies}
                />
                <SortHeader 
                  label="Program" 
                  field="programName" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.programName}
                />
                <SortHeader 
                  label="AcademicYear" 
                  field="admission_year" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.admission_year}
                />
                <SortHeader 
                  label="Semister" 
                  field="semister" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.semister}
                />
                {/* <th className={`${visibleColumns.status ? '' : 'hidden'} px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center`}>Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th> */}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-8 py-5 text-center">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          ID-{item.id.toString().padStart(4, '0')}
                        </span>
                      </td>
                    )}
                    {visibleColumns.policies && (
                      <td className="px-4 py-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-bold group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-all duration-300">
                            <User size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{item.name?.trim() || '—'}</p>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none flex items-center gap-1"><FileText size={10} /> {item.policies || '—'}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.programName && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{item.programName || '—'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.admission_year && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{item.admission_year || '—'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.semister && (
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-1.5">
                          <Layers size={14} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{item.semister || '—'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Edit Record"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => openDeleteModal(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove Record"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No students found matching your query</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-emerald-500 hover:text-emerald-600 underline uppercase tracking-tighter"
                      >
                        Reset Results
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

      {/* ===== Enroll Student Modal ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeAddModal} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                  Enroll New Student
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <GraduationCap size={12} /> Student Enrollment System
                </p>
              </div>
              <button 
                onClick={closeAddModal}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {addError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                  <ShieldAlert size={18} /> {addError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Name */}
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="name" 
                      value={addForm.name} 
                      onChange={handleAddChange} 
                      placeholder="e.g. Sriram"
                      className={`w-full bg-slate-50 border-2 ${addErrors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {addErrors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.name}</p>}
                </div>

                {/* Policy */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="policies" 
                      value={addForm.policies} 
                      onChange={handleAddChange}
                      className={`w-full bg-slate-50 border-2 ${addErrors.policies ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Policy --</option>
                      {policies.map((policy) => (
                        <option key={policy.id} value={policy.name}>
                          {policy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addErrors.policies && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.policies}</p>}
                </div>

                {/* Program */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="programName" 
                      value={addForm.programName} 
                      onChange={handleAddChange}
                      className={`w-full bg-slate-50 border-2 ${addErrors.programName ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Program --</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.name}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addErrors.programName && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.programName}</p>}
                </div>

                {/* Admission Year */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="admission_year" 
                      value={addForm.admission_year} 
                      onChange={handleAddChange}
                      className={`w-full bg-slate-50 border-2 ${addErrors.admission_year ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Academic Year --</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.year_name}>
                          {year.year_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addErrors.admission_year && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.admission_year}</p>}
                </div>

                {/* Semester */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="semister" 
                      value={addForm.semister} 
                      onChange={handleAddChange}
                      className={`w-full bg-slate-50 border-2 ${addErrors.semister ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Semester --</option>
                      {semesters.map((semester) => (
                        <option key={semester.id} value={semester.semester_name}>
                          {semester.semester_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {addErrors.semister && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.semister}</p>}
                </div>


              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={closeAddModal}
                disabled={addLoading}
              >
                Discard
              </button>
              <button 
                onClick={handleAddSubmit}
                disabled={addLoading}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {addLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                <span>Save Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Edit Student Modal ===== */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeEditModal} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                  Edit Student
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <GraduationCap size={12} /> Student ID: {editForm.id}
                </p>
              </div>
              <button 
                onClick={closeEditModal}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {editError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                  <ShieldAlert size={18} /> {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Name */}
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="name" 
                      value={editForm.name} 
                      onChange={handleEditChange} 
                      placeholder="e.g. Sriram"
                      className={`w-full bg-slate-50 border-2 ${editErrors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {editErrors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{editErrors.name}</p>}
                </div>

                {/* Policy */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="policies" 
                      value={editForm.policies} 
                      onChange={handleEditChange}
                      className={`w-full bg-slate-50 border-2 ${editErrors.policies ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Policy --</option>
                      {policies.map((policy) => (
                        <option key={policy.id} value={policy.name}>
                          {policy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editErrors.policies && <p className="text-[10px] font-bold text-red-500 ml-1">{editErrors.policies}</p>}
                </div>

                {/* Program */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="programName" 
                      value={editForm.programName} 
                      onChange={handleEditChange}
                      className={`w-full bg-slate-50 border-2 ${editErrors.programName ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Program --</option>
                      {programs.map((program) => (
                        <option key={program.id} value={program.name}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editErrors.programName && <p className="text-[10px] font-bold text-red-500 ml-1">{editErrors.programName}</p>}
                </div>

                {/* Admission Year */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="admission_year" 
                      value={editForm.admission_year} 
                      onChange={handleEditChange}
                      className={`w-full bg-slate-50 border-2 ${editErrors.admission_year ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Academic Year --</option>
                      {academicYears.map((year) => (
                        <option key={year.id} value={year.year_name}>
                          {year.year_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editErrors.admission_year && <p className="text-[10px] font-bold text-red-500 ml-1">{editErrors.admission_year}</p>}
                </div>

                {/* Semester */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select 
                      name="semister" 
                      value={editForm.semister} 
                      onChange={handleEditChange}
                      className={`w-full bg-slate-50 border-2 ${editErrors.semister ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer`}
                    >
                      <option value="">-- Select Semester --</option>
                      {semesters.map((semester) => (
                        <option key={semester.id} value={semester.semester_name}>
                          {semester.semester_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editErrors.semister && <p className="text-[10px] font-bold text-red-500 ml-1">{editErrors.semister}</p>}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={closeEditModal}
                disabled={editLoading}
              >
                Discard
              </button>
              <button 
                onClick={handleEditSubmit}
                disabled={editLoading}
                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {editLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                <span>Update Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation Modal ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeDeleteModal} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-10 py-8 border-b border-red-100 bg-red-50">
              <h2 className="text-2xl font-black text-red-600 tracking-tight leading-none">
                Delete Student
              </h2>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest opacity-70 mt-2">
                Confirmation Required
              </p>
            </div>
            
            {/* Body */}
            <div className="p-10 space-y-4">
              {deleteError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                  <ShieldAlert size={18} /> {deleteError}
                </div>
              )}
              
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
                <p className="text-sm text-slate-700 font-bold mb-3">
                  Are you sure you want to remove:
                </p>
                <div className="bg-white rounded-xl p-4 border border-red-100 mb-4">
                  <p className="text-lg font-black text-slate-900">{studentToDelete?.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Student ID: {studentToDelete?.id}</p>
                </div>
                <p className="text-xs text-red-600 font-bold">
                  This action will soft-delete the record. It cannot be immediately undone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                {deleteLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <MdDelete size={20} />
                )}
                <span>Delete Student</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
