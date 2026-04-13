import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // handleSave removed as it's now in RolesForm.js

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
              onClick={() => navigate('/roles/add')}
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
                            <button onClick={() => navigate(`/roles/edit/${role.id}`)} className="p-2 text-slate-400 hover:text-amber-600 transition-colors"><Pencil size={18} /></button>
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

      {/* Role Modal removed - integrated into RolesForm.js */}

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
