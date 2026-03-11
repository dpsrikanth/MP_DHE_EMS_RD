import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { 
  Calendar, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Layers,
  Settings,
  ListRestart,
  BookOpen
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import Select, { components } from "react-select";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const InfoItem = ({ label, value, isMono = false, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-0.5">{label}</p>
    <div className={`bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl ${isMono ? 'font-mono' : 'font-bold'} text-slate-700 text-sm`}>
      {value || '-'}
    </div>
  </div>
);

const Batches = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  const batchNameOptions = [
    { value: 'July-November', label: 'July-November' },
    { value: 'January-June', label: 'January-June' },
    { value: 'Annual', label: 'Annual' },
    { value: 'September-May', label: 'September-May' },
    { value: 'October-February', label: 'October-February' },
    { value: 'March-August', label: 'March-August' }
  ];
  const [form, setForm] = useState({ 
    batch_name: null, 
    start_date: '', 
    end_date: '',
    academic_year: null,
    import_fees_flag: 'N',
    program_id: null
  });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'batch_name', label: 'Batch Name' },
    { key: 'academic_year', label: 'Academic Year' },
    { key: 'program_name', label: 'Program' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created On' }
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
    searchFields: ['id', 'batch_name', 'academic_year', 'program_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    fetchPrograms();
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/academic-years', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAcademicYears(result.map(y => ({ value: y.year_name, label: y.year_name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setPrograms(result.map(p => ({ value: p.id, label: p.name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const result = await response.json();
      setData(result || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.batch_name || !form.program_id) return toast.warning('Batch Name and Program are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...form,
          batch_name: form.batch_name?.value,
          academic_year: form.academic_year?.value,
          program_id: form.program_id?.value
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Save failed');
      }
      const result = await res.json();
      toast.success(result.message || 'Batch added successfully!');
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!form.batch_name || !form.program_id) return toast.warning('Batch Name and Program are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-batches/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...form,
          batch_name: form.batch_name?.value,
          academic_year: form.academic_year?.value,
          program_id: form.program_id?.value
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Update failed');
      }
      const result = await res.json();
      toast.success(result.message || 'Batch updated successfully!');
      setShowEditModal(false);
      setSelected(null);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const resetForm = () => {
    setForm({ 
      batch_name: null, 
      start_date: '', 
      end_date: '',
      academic_year: null,
      import_fees_flag: 'N',
      program_id: null
    });
  };

  const loadForEdit = (id) => {
    const item = data.find(x => x.id === id);
    if (item) {
      setSelected(item);
      const selectedProg = programs.find(p => p.value === item.program_id);
      const selectedBatch = batchNameOptions.find(b => b.value === item.batch_name);
      const selectedAY = academicYears.find(y => y.value === item.academic_year) || { value: item.academic_year, label: item.academic_year };
      
      setForm({ 
        batch_name: selectedBatch || { value: item.batch_name, label: item.batch_name }, 
        start_date: item.start_date ? item.start_date.split('T')[0] : '', 
        end_date: item.end_date ? item.end_date.split('T')[0] : '',
        academic_year: selectedAY,
        import_fees_flag: item.import_fees_flag || 'N',
        program_id: selectedProg || null
      });
      setShowEditModal(true);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-batches/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
      toast.success('Batch deleted successfully');
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600">
              <Layers size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Master Batches</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage academic batches and date ranges</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search batches..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => { setSelected(null); resetForm(); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Batch</span>
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <SortHeader label="ID" field="id" currentSort={sortConfig} onSort={handleSort} className="px-8" visible={visibleColumns.id} />
                <SortHeader label="Batch Name" field="batch_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.batch_name} />
                <SortHeader label="Academic Year" field="academic_year" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.academic_year} />
                <SortHeader label="Program" field="program_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.program_name} />
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center`}>Status</th>
                <th className={`${visibleColumns.created_at ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Created On</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.batch_name && <td className="px-4 py-5 text-sm font-semibold text-slate-900 leading-tight">{item.batch_name}</td>}
                    {visibleColumns.academic_year && <td className="px-4 py-5 text-sm font-bold text-sky-600 uppercase tracking-tighter"><span className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100">{item.academic_year}</span></td>}
                    {visibleColumns.program_name && <td className="px-4 py-5 text-sm font-medium text-slate-600">{item.program_name}</td>}
                    {visibleColumns.status && (
                      <td className="px-4 py-5 text-center">
                        {item.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-100 tracking-tighter shadow-sm"><ShieldCheck size={12} /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase border border-slate-200 tracking-tighter"><ShieldAlert size={12} /> Inactive</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.created_at && <td className="px-4 py-5 text-xs font-medium text-slate-400">{item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}</td>}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setViewData(item); setShowViewModal(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
                        <button onClick={() => loadForEdit(item.id)} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all" title="Edit Batch"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Batch"><MdDelete size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="px-8 py-12 text-center text-sm font-bold text-slate-400 uppercase tracking-widest">No batches found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-xl font-black tracking-tight">{showEditModal ? 'Update Batch' : 'New Batch'}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5 opacity-60">Configuration</p>
              </div>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all"><X size={18} /></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Name</label>
                  <Select 
                    options={batchNameOptions} 
                    value={form.batch_name} 
                    onChange={(opt) => setForm({ ...form, batch_name: opt })} 
                    className="react-select-container text-sm font-semibold" 
                    classNamePrefix="react-select" 
                    placeholder="Select Batch..." 
                    styles={{ control: (base, state) => ({ ...base, padding: '0.4rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Course/Program</label>
                  <Select options={programs} value={form.program_id} onChange={(opt) => setForm({ ...form, program_id: opt })} className="react-select-container text-sm font-semibold" classNamePrefix="react-select" placeholder="Select Program..." styles={{ control: (base, state) => ({ ...base, padding: '0.4rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Calendar size={18} /></div>
                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-sky-500 outline-none transition-all font-bold" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Calendar size={18} /></div>
                    <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-sky-500 outline-none transition-all font-bold" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                  <Select 
                    options={academicYears} 
                    value={form.academic_year} 
                    onChange={(opt) => setForm({ ...form, academic_year: opt })} 
                    className="react-select-container text-sm font-semibold" 
                    classNamePrefix="react-select" 
                    placeholder="Select Year..." 
                    styles={{ control: (base, state) => ({ ...base, padding: '0.4rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: state.isFocused ? '#ffffff' : '#f8fafc', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Import Fees?</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Settings size={18} /></div>
                    <select value={form.import_fees_flag} onChange={(e) => setForm({ ...form, import_fees_flag: e.target.value })} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white focus:border-sky-500 outline-none transition-all font-bold appearance-none cursor-pointer">
                      <option value="Y">Yes (Y)</option>
                      <option value="N">No (N)</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); resetForm(); }}>Discard</button>
              <button onClick={showEditModal ? handleUpdate : handleAdd} className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm flex items-center gap-2"><Check size={18} /><span>{showEditModal ? 'Update Batch' : 'Save Batch'}</span></button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><MdDelete size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.batch_name}"</span>?</p>
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20" onClick={handleDeleteConfirm}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">Batch Profile</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2"><Calendar size={12} /> Academic Management System</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Batch Name" value={viewData.batch_name} className="col-span-full" />
                <InfoItem label="Course/Program" value={viewData.program_name} />
                <InfoItem label="Academic Year" value={viewData.academic_year} isMono={true} />
                <InfoItem label="Start Date" value={viewData.start_date ? new Date(viewData.start_date).toLocaleDateString() : '-'} />
                <InfoItem label="End Date" value={viewData.end_date ? new Date(viewData.end_date).toLocaleDateString() : '-'} />
                <InfoItem label="Fees Import Flag" value={viewData.import_fees_flag} />
                <InfoItem label="Status" value={viewData.status || 'Active'} />
                <InfoItem label="Created On" value={viewData.created_at ? new Date(viewData.created_at).toLocaleString() : '-'} />
              </div>
            </div>
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-sm uppercase tracking-widest">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
