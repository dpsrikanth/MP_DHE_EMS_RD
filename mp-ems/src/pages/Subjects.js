import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { getApiUrl } from '../config';

const Subjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

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
    periods_per_week: 6,
    credit: 4
  });

  const mappingTypes = [
    { value: 'Major 1', label: 'Major 1' },
    { value: 'Major 2', label: 'Major 2' },
    { value: 'Major', label: 'Major' },
    { value: 'Minor', label: 'Minor' },
    { value: 'Elective', label: 'Elective' },
    { value: 'Vocational', label: 'Vocational' },
    { value: 'FC-1', label: 'FC-1' },
    { value: 'FC-2', label: 'FC-2' },
    { value: 'FP/Int/Appr', label: 'FP/Int/Appr' },
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
    { key: 'credit', label: 'Credits' },
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
        fetch(getApiUrl('/master-programs'), { headers: h }),
        fetch(getApiUrl('/master-semesters'), { headers: h }),
        fetch(getApiUrl('/master-teachers'), { headers: h }),
        fetch(getApiUrl('/master-departments'), { headers: h })
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
      const response = await fetch(getApiUrl('/master-subjects'), {
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

  // Removed handleSubmit in favor of route-based Form page

  // Removed loadForEdit in favor of route-based Form page

  // Removed resetForm

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(getApiUrl(`/master-subjects/${deleteTarget.id}`), {
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
              onClick={() => navigate('/subjects/add')}
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
                <SortHeader label="Credits" field="credit" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.credit} className="text-center" />
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
                  {visibleColumns.credit && <td className="px-4 py-5 text-center text-sm font-black text-amber-600">{item.credit !== null && item.credit !== undefined ? item.credit : '-'}</td>}
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
                      <button onClick={() => navigate(`/subjects/edit/${item.id}`)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Pencil size={18} /></button>
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

      {/* Add/Edit Modal was removed in favor of route-based Form page */}

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
