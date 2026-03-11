import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from 'react-toastify';
import { 
  Book, 
  Plus, 
  Pencil, 
  X, 
  Check,
  User,
  Calendar,
  Layers,
  FileCheck,
  BookOpen,
  Code,
  Hash,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Subjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    name: '',
    subject_code: '',
    department_ids: [],
    program_id: null,
    semester_id: null,
    teacher_id: null,
    mapping_type: 'Major',
    is_mandatory: 'M',
    has_examination: true,
    periods_per_week: 6
  });

  const mappingTypes = [
    { value: 'Major', label: 'Major' },
    { value: 'Minor', label: 'Minor' },
    { value: 'AEC', label: 'AEC' },
    { value: 'SEC', label: 'SEC' },
    { value: 'VBC', label: 'VBC' },
    { value: 'English Literature', label: 'English Literature' },
    { value: 'Hindi Literature', label: 'Hindi Literature' },
  ];

  const mandatoryOptions = [
    { value: 'M', label: 'Mandatory (M)' },
    { value: 'E', label: 'Elective (E)' }
  ];

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'program_name', label: 'Course Name' },
    { key: 'class_name', label: 'Class' },
    { key: 'batch', label: 'Batch' },
    { key: 'name', label: 'Subject' },
    { key: 'mapping_type', label: 'Type' },
    { key: 'teacher_name', label: 'Faculty' },
    { key: 'periods_per_week', label: 'PPW' }
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
    searchFields: ['program_name', 'name', 'teacher_name', 'semester_name', 'mapping_type', 'subject_code'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      
      const [progRes, semRes, teaRes, depRes] = await Promise.all([
        fetch('http://localhost:8080/api/master-programs', { headers: h }),
        fetch('http://localhost:8080/api/master-semesters', { headers: h }),
        fetch('http://localhost:8080/api/master-teachers', { headers: h }),
        fetch('http://localhost:8080/api/master-departments', { headers: h })
      ]);

      if (progRes.ok) setPrograms((await progRes.json()).map(p => ({ value: p.id, label: p.name })));
      if (semRes.ok) setSemesters((await semRes.json()).map(s => ({ value: s.id, label: s.semester_name })));
      if (teaRes.ok) setTeachers((await teaRes.json()).map(t => ({ value: t.id, label: t.name })));
      if (depRes.ok) setDepartments((await depRes.json()).map(d => ({ value: d.id, label: d.department_name })));
      
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const result = await response.json();
      
      const processed = result.map(item => {
        const batchNum = item.semester_name?.match(/\d+/)?.[0] || item.semester_name?.match(/[IVXLCDM]+/)?.[0] || '';
        return {
          ...item,
          class_name: item.program_name ? `${item.program_name} ${item.semester_name}` : 'Not Mapped',
          batch: batchNum
        };
      });
      
      setData(processed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (isEdit = false) => {
    if (!form.name || !form.subject_code) return toast.warning('Name and Code are required');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        department_ids: form.department_ids?.map(d => d.value) || [],
        program_id: form.program_id?.value || null,
        semester_id: form.semester_id?.value || null,
        teacher_id: form.teacher_id?.value || null,
        mapping_type: form.mapping_type?.value || 'Major',
        is_mandatory: form.is_mandatory?.value || 'M'
      };
      
      const res = await fetch(`http://localhost:8080/api/master-subjects${isEdit ? `/${selected.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(isEdit ? 'Update failed' : 'Save failed');
      toast.success(isEdit ? 'Subject updated!' : 'Subject added!');
      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const loadForEdit = (item) => {
    setSelected(item);
    setForm({
      name: item.name,
      subject_code: item.subject_code,
      department_ids: departments.filter(d => item.department_ids?.includes(d.value)) || [],
      program_id: programs.find(p => p.value === item.program_id) || null,
      semester_id: semesters.find(s => s.value === item.semester_id) || null,
      teacher_id: teachers.find(t => t.value === item.teacher_id) || null,
      mapping_type: mappingTypes.find(m => m.value === item.mapping_type) || mappingTypes[0],
      is_mandatory: mandatoryOptions.find(m => m.value === item.is_mandatory) || mandatoryOptions[0],
      has_examination: item.has_examination,
      periods_per_week: item.periods_per_week || 1
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setForm({
      name: '',
      subject_code: '',
      department_ids: [],
      program_id: null,
      semester_id: null,
      teacher_id: null,
      mapping_type: mappingTypes[0],
      is_mandatory: mandatoryOptions[0],
      has_examination: true,
      periods_per_week: 6
    });
    setSelected(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#f8fafc',
      borderColor: '#f1f5f9',
      borderWidth: '2px',
      borderRadius: '1rem',
      padding: '0.2rem',
      transition: 'all 0.2s ease',
      minHeight: '56px',
      '&:hover': {
        borderColor: '#e2e8f0',
        backgroundColor: '#fff'
      }
    }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      backgroundColor: isSelected ? '#amber-600' : isFocused ? '#fff7ed' : 'white',
      color: isSelected ? 'white' : '#1e293b',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#d97706'
      }
    })
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Subjects</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage subjects and curriculum mappings</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search subjects..." />
            <ColumnVisibilitySelector columns={availableColumns} visibleColumns={visibleColumns} onToggle={toggleColumn} />
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <SortHeader label="ID" field="id" currentSort={sortConfig} onSort={handleSort} className="px-8" visible={visibleColumns.id} />
                <SortHeader label="Course Name" field="program_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.program_name} />
                <SortHeader label="Class" field="class_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.class_name} />
                <SortHeader label="Batch" field="batch" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.batch} />
                <SortHeader label="Subject" field="name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.name} />
                <SortHeader label="Type" field="mapping_type" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.mapping_type} />
                <SortHeader label="Faculty" field="teacher_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.teacher_name} />
                <SortHeader label="PPW" field="periods_per_week" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.periods_per_week} className="text-center" />
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                  {visibleColumns.program_name && <td className="px-4 py-5 text-sm font-semibold text-slate-900">{item.program_name || '—'}</td>}
                  {visibleColumns.class_name && <td className="px-4 py-5 font-bold"><span className={`px-3 py-1.5 rounded-xl border text-xs ${item.program_name ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>{item.class_name}</span></td>}
                  {visibleColumns.batch && <td className="px-4 py-5 text-sm font-bold text-slate-500 text-center">{item.batch || '—'}</td>}
                  {visibleColumns.name && (
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{item.subject_code}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.mapping_type && (
                    <td className="px-4 py-5">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-black uppercase border ${
                        item.is_mandatory === 'M' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {item.mapping_type} {item.is_mandatory === 'M' ? '(M)' : '(E)'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.teacher_name && (
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.teacher_name || 'Not Assigned'}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.periods_per_week && <td className="px-4 py-5 text-center text-sm font-black text-slate-900">{item.periods_per_week}</td>}
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => loadForEdit(item)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Pencil size={18} /></button>
                      <button onClick={() => { setDeleteTarget(item); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><MdDelete size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-xl font-black tracking-tight">{showEditModal ? 'Update Subject' : 'New Subject Entry'}</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Unified Subject Detail</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all"><X size={18} /></button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Book size={18} /></div>
                    <input type="text" placeholder="e.g. Operating Systems" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all font-semibold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Code size={18} /></div>
                    <input type="text" placeholder="e.g. CS101" value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold uppercase" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Departments</label>
                  <Select isMulti options={departments} value={form.department_ids} onChange={(v) => setForm({ ...form, department_ids: v })} styles={customSelectStyles} placeholder="Select Departments..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Teacher</label>
                  <Select options={teachers} isClearable value={form.teacher_id} onChange={(v) => setForm({ ...form, teacher_id: v })} styles={customSelectStyles} placeholder="Select Teacher (Optional)..." />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program / Course</label>
                  <Select options={programs} isClearable value={form.program_id} onChange={(v) => setForm({ ...form, program_id: v })} styles={customSelectStyles} placeholder="Select Program..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                  <Select options={semesters} isClearable value={form.semester_id} onChange={(v) => setForm({ ...form, semester_id: v })} styles={customSelectStyles} placeholder="Select Semester..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Requirement</label>
                    <Select options={mandatoryOptions} value={form.is_mandatory} onChange={(v) => setForm({ ...form, is_mandatory: v })} styles={customSelectStyles} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Mapping Type</label>
                    <Select options={mappingTypes} value={form.mapping_type} onChange={(v) => setForm({ ...form, mapping_type: v })} styles={customSelectStyles} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Examination</label>
                    <button 
                      onClick={() => setForm({...form, has_examination: !form.has_examination})}
                      className={`w-full py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        form.has_examination ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      {form.has_examination ? <FileCheck size={20} /> : <X size={20} />}
                      <span className="text-[10px] font-bold uppercase">{form.has_examination ? 'Required' : 'None'}</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Periods/Week</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={18} /></div>
                      <input 
                        type="number" 
                        value={form.periods_per_week} 
                        onChange={(e) => setForm({...form, periods_per_week: parseInt(e.target.value) || 0})}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }}>Discard</button>
              <button 
                onClick={() => handleSubmit(showEditModal)}
                className="px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm flex items-center gap-2"
              >
                <Check size={18} />
                <span>{showEditModal ? 'Update Subject' : 'Save Subject'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><MdDelete size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Permanently remove this subject entry? This cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all" onClick={handleDeleteConfirm}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
