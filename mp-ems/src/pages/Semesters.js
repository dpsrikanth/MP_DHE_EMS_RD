import React, { useState, useEffect } from "react";
import { 
  Layers, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  Activity
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Semesters = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ semester_name: '' });

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'semester_name', label: 'Semester Title' },
    { key: 'log', label: 'System Log' }
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
    searchFields: ['id', 'semester_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-semesters', {
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
    if (!form.semester_name) return alert('Semester name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Save failed');
      setShowAddModal(false);
      setForm({ semester_name: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!form.semester_name) return alert('Semester name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-semesters/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Update failed');
      setShowEditModal(false);
      setSelected(null);
      setForm({ semester_name: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const loadForEdit = (id) => {
    const item = data.find(x => x.id === id);
    if (item) {
      setSelected(item);
      setForm({ semester_name: item.semester_name });
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
      const res = await fetch(`http://localhost:8080/api/master-semesters/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
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
    <div className="space-y-6">
      {/* Header Info Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Layers size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Academic Semesters</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Configure and define curriculum subdivisions and tiers</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by semester name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => { setSelected(null); setForm({ semester_name: '' }); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Create Semester</span>
            </button>
          </div>
        </div>

        {/* Data Presentation Table */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/30">
                <SortHeader 
                  label="ID Reference" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-8" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Semester Title" 
                  field="semester_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.semester_name}
                />
                <th className={`${visibleColumns.log ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>System Log</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
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
                    {visibleColumns.semester_name && (
                      <td className="px-4 py-5 font-black text-slate-800 tracking-tight">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400">
                            <Activity size={16} />
                          </div>
                          {item.semester_name}
                        </div>
                      </td>
                    )}
                    {visibleColumns.log && (
                      <td className="px-4 py-5">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Registered On</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'System Default'}
                        </p>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => loadForEdit(item.id)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit Definition"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove Semester"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No semesters found matching your criteria</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-indigo-500 hover:text-indigo-600 underline uppercase tracking-tighter"
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

      {/* Unified Modal (Add/Edit) */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                  {showEditModal ? 'Update Tier' : 'New Semester'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <Layers size={12} /> Curriculum Configuration
                </p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={(e) => { e.preventDefault(); showEditModal ? handleUpdate() : handleAdd(); }}>
              <div className="p-10 space-y-8">
                {showEditModal && selected && (
                  <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 transition-colors group hover:border-indigo-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-indigo-400 group-hover:shadow-indigo-500/5 transition-all">
                      <Hash size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity ID</p>
                      <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">SEM-{selected.id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester Designation</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                      <Activity size={18} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="e.g. Semester 01 or Odd Semester" 
                      value={form.semester_name} 
                      onChange={(e) => setForm({ ...form, semester_name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold tracking-tight"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
                <button 
                  type="button"
                  className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }}
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3"
                >
                  <Check size={20} />
                  <span>{showEditModal ? 'Update Rank' : 'Register Tier'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <MdDelete size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.semester_name}"</span>? This action cannot be reversed.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all"
                  onClick={handleDeleteConfirm}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Semesters;
