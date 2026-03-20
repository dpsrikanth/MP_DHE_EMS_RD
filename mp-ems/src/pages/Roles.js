import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  ShieldCheck, 
  Plus, 
  Pencil, 
  X, 
  ShieldPlus,
  Lock,
  Search
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader } from '../components/TableControls';

const Roles = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [form, setForm] = useState({ role_name: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'role_name', label: 'Role Name' }
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
    totalItems
  } = useDataTable(data, { 
    searchFields: ['role_name'],
    initialSort: { field: 'id', direction: 'asc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      setForm({ role_name: selected.role_name || '' });
    } else {
      setForm({ role_name: '' });
    }
  }, [selected]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.role_name) return toast.warning('Role name is required');

      const method = selected ? 'PUT' : 'POST';
      const url = selected 
        ? `http://localhost:8080/api/roles/${selected.id}` 
        : 'http://localhost:8080/api/roles';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Operation failed');
      }

      toast.success(selected ? 'Role updated' : 'Role created');
      setShowModal(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/roles/${deleteTarget.id}`, { 
        method: 'DELETE', 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Role deleted');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Synchronizing Permissions...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security Roles</h1>
              <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Permission Hierarchies</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Filter roles..." />
            <button 
              onClick={() => { setSelected(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap text-sm uppercase tracking-widest"
            >
              <ShieldPlus size={20} />
              <span>New Role</span>
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="px-8 pb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedData.map((role) => (
                    <div key={role.id} className="group bg-slate-50 hover:bg-white border-2 border-slate-50 hover:border-amber-100 rounded-[1.5rem] p-6 transition-all duration-300 flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-amber-900/5">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:rotate-12 transition-all">
                                <Lock size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 group-hover:text-amber-600 transition-colors uppercase tracking-tight">{role.role_name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{role.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelected(role); setShowModal(true); }} className="p-2 text-slate-400 hover:text-amber-600 transition-colors"><Pencil size={18} /></button>
                            <button onClick={() => { setDeleteTarget(role); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><MdDelete size={20} /></button>
                        </div>
                    </div>
                ))}
            </div>
            {data.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Plus size={32} /></div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No roles defined in system</p>
                </div>
            )}
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selected ? 'Modify Role' : 'Create Identity Group'}</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Permission Definition</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Name</label>
                  <input type="text" value={form.role_name} onChange={e => setForm({...form, role_name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-amber-500 transition-all font-bold text-slate-800" placeholder="e.g. Dean, Registrar, HOD" />
                </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleSave} className="px-10 py-3.5 bg-amber-600 border-b-4 border-amber-800 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl transition-all active:translate-y-1 active:border-b-0 uppercase text-xs tracking-widest">
                {selected ? 'Apply Changes' : 'Initialize Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[2rem] shadow-3xl w-full max-w-sm overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><MdDelete size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Delete Role?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">System entities assigned to <span className="text-slate-900 font-bold">"{deleteTarget?.role_name}"</span> may lose access. Proceed with caution.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Abort</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
