import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  Users as UsersIcon, 
  Pencil, 
  X, 
  UserPlus,
  Shield,
  Building,
  School
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader } from '../components/TableControls';
import { masterDataApi } from '../api/masterDataApi';

const Users = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [roles, setRoles] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', mandatory: true },
    { key: 'email', label: 'Email' },
    { key: 'role_name', label: 'Role' },
    { key: 'institution', label: 'Institution' },
    { key: 'status', label: 'Status' }
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
    visibleColumns
  } = useDataTable(data, { 
    searchFields: ['name', 'email', 'role_name', 'college_name', 'university_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [rRes, uRes, cRes] = await Promise.all([
        masterDataApi.getRoles(),
        masterDataApi.getUniversities(),
        masterDataApi.getColleges()
      ]);

      if (rRes) setRoles(rRes);
      if (uRes) setUniversities(uRes);
      if (cRes) setColleges(cRes);
    } catch (err) {
      console.error("Error fetching masters:", err);
    }
  };

  const fetchData = async () => {
    try {
      const result = await masterDataApi.getUsers();
      setData(result);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  // handleSave removed - logic moved to UsersForm.js

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteUser(deleteTarget.id);
      toast.success('User removed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Initializing User Matrix...</div>;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
              <UsersIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
              <p className="text-[13px] text-slate-500 mt-1 font-bold  tracking-widest">Access Control & Identities</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search users..." />
            <button 
              onClick={() => navigate('/users/add')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap text-sm  tracking-widest"
            >
              <UserPlus size={20} />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-50 bg-slate-50/30">
                <SortHeader label="ID" field="id" currentSort={sortConfig} onSort={handleSort} className="px-6 py-4" visible={visibleColumns.id} />
                <SortHeader label="User Info" field="name" currentSort={sortConfig} onSort={handleSort} className="px-4 py-4" visible={visibleColumns.name} />
                <SortHeader label="Role" field="role_name" currentSort={sortConfig} onSort={handleSort} className="px-4 py-4" visible={visibleColumns.role_name} />
                <th className="px-4 py-4 text-[13px] font-black  tracking-widest text-slate-400">Institution</th>
                <th className="px-4 py-4 text-[13px] font-black  tracking-widest text-slate-400 text-center">Status</th>
                <th className="px-6 py-4 text-[13px] font-black  tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((user) => (
                <tr key={user.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">#{user.id}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-[15px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors  tracking-tight">{user.name}</span>
                      <span className="text-[13px] font-bold text-indigo-500/80">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black  tracking-wider border border-indigo-100">
                      <Shield size={12} />
                      {user.role_name}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex flex-col gap-1.5">
                      {user.university_name && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                          <School size={12} className="text-slate-400" />
                          {user.university_name}
                        </div>
                      )}
                      {user.college_name && (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 italic">
                          <Building size={12} className="text-slate-400" />
                          {user.college_name}
                        </div>
                      )}
                      {!user.university_name && !user.college_name && (
                        <span className="text-[11px] font-black text-indigo-400  tracking-widest bg-indigo-50/50 px-2 py-0.5 rounded w-fit">Global Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 text-center">
                    <span className={`inline-flex h-2 w-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => navigate(`/users/edit/${user.id}`)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={18} /></button>
                       <button onClick={() => { setDeleteTarget(user); setShowDeleteModal(true); }} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><MdDelete size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* User Modal removed - logic moved to UsersForm.js */}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-3xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><MdDelete size={32} /></div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Purge Identity?</h3>
            <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">This will permanently remove <span className="text-slate-900 font-bold">"{deleteTarget?.name}"</span> from the system records. This operation is irreversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Abort</button>
              <button onClick={handleDeleteConfirm} className="flex-1 py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
