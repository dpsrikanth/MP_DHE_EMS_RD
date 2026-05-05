import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  ShieldCheck, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  Activity,
  FileText
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { formatDate } from '../utils/dateUtils';
import Select from 'react-select';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import { masterDataApi } from "../api/masterDataApi";
import authUtils from "../utils/authUtils";

const Policies = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableMasters, setAvailableMasters] = useState([]);
  const [mappingSelection, setMappingSelection] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'name', label: 'Policy Name' },
    { key: 'description', label: 'Description' },
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
    searchFields: ['id', 'name', 'description'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    if (authUtils.isUniversityAdmin()) {
      fetchAvailableMasters();
    }
  }, []);

  const fetchAvailableMasters = async () => {
    try {
      const result = await masterDataApi.getMasters();
      setAvailableMasters(result.policies.map(p => ({ value: p.id, label: p.name })));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const result = await masterDataApi.getPolicies();
      const activeData = (result || []).filter(item => item.status === true || item.status === 1 || item.status === '1' || item.status === 'true');
      setData(activeData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add/Update handled by /policies/add and /policies/edit/:id routes

  // Edit handled by navigate('/policies/edit/:id')
  const handleMap = async () => {
    if (!mappingSelection) return toast.warning('Please select a policy');
    try {
      await masterDataApi.mapPolicy({ policy_id: mappingSelection.value });
      toast.success('Policy assigned successfully');
      setShowAssignModal(false);
      setMappingSelection(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUnmap = async (id) => {
    try {
      await masterDataApi.unmapPolicy(id);
      toast.success('Policy removed from your university');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deletePolicy(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Info Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-60"></div>
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Institutional Policies</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Configure and define university and college policies</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by policy name or description..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            {authUtils.isSuperAdmin() ? (
              <button 
                onClick={() => navigate('/policies/add')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Create Policy</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Assign from Master</span>
              </button>
            )}
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
                  label="Policy Name" 
                  field="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.name}
                />
                <SortHeader 
                  label="Description" 
                  field="description" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.description}
                />
                <th className={`${visibleColumns.log ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>System Log</th>
                <th className="px-8 py-4 text-[13px] font-black  tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-8 py-5">
                        <span className="text-[12px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-4 py-5 font-black text-slate-800 tracking-tight">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                            <ShieldCheck size={16} />
                          </div>
                          {item.name}
                        </div>
                      </td>
                    )}
                    {visibleColumns.description && (
                      <td className="px-4 py-5">
                        <p className="text-sm font-medium text-slate-500 max-w-md truncate">
                          {item.description || <span className="text-slate-300 italic">No description</span>}
                        </p>
                      </td>
                    )}
                    {visibleColumns.log && (
                      <td className="px-4 py-5">
                        <p className="text-[12px] font-black text-slate-300  tracking-widest mb-1">Registered On</p>
                        <p className="text-[13px] font-semibold text-slate-500">
                          {formatDate(item.created_at)}
                        </p>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/policies/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Edit Policy"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => authUtils.isSuperAdmin() ? handleDelete(item) : handleUnmap(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title={authUtils.isSuperAdmin() ? "Remove Policy" : "Un-assign Policy"}
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No policies found matching your criteria</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-[13px] font-black text-emerald-500 hover:text-emerald-600 underline  tracking-tighter"
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

      {/* Add/Edit Modal removed — handled by /policies/add and /policies/edit/:id routes */}

      {/* Assign Modal for University Admin */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col mb-20 animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Assign Policy</h2>
                <p className="text-[12px] font-black text-slate-400  tracking-widest opacity-70">Master Catalog</p>
              </div>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400  tracking-widest ml-1">Select from Master</label>
                <Select
                  options={availableMasters.filter(m => !data.some(d => d.id === m.value))}
                  value={mappingSelection}
                  onChange={setMappingSelection}
                  placeholder="Choose policy..."
                  className="react-select-container text-sm font-semibold"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      padding: '0.4rem',
                      borderRadius: '1.25rem',
                      borderColor: state.isFocused ? '#10b981' : '#f1f5f9',
                      borderWidth: '2px',
                      backgroundColor: '#f8fafc',
                      boxShadow: 'none',
                      '&:hover': { borderColor: state.isFocused ? '#10b981' : '#f1f5f9' }
                    })
                  }}
                />
                <p className="text-[12px] text-slate-400 font-medium px-1">If the policy you need is not in the list, please contact the System Administrator.</p>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleMap}
                disabled={!mappingSelection}
                className="px-10 py-4 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm  tracking-widest flex items-center gap-3"
              >
                <Check size={20} />
                <span>Assign Policy</span>
              </button>
            </div>
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
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.name}"</span>? This action cannot be reversed.
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

export default Policies;
