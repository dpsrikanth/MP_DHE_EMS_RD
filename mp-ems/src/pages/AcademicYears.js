import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  History
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import Select from "react-select";
import authUtils from "../utils/authUtils";

const AcademicYears = () => {
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
    { key: 'id', label: 'ID' },
    { key: 'year_name', label: 'Session Name' },
    { key: 'timeline', label: 'Timeline' }
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
    searchFields: ['id', 'year_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
    if (authUtils.isUniversityAdmin()) {
      fetchAvailableMasters();
    }
  }, [navigate]);

  const fetchAvailableMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAvailableMasters(result.academicYears.map(ay => ({ value: ay.id, label: ay.year_name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/academic-years', {
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

  // Removed handleAddClick in favor of route-based Form page

  // Removed handleEditClick in favor of route-based Form page

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleMap = async () => {
    if (!mappingSelection) return toast.warning('Please select an academic year');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-academic-years/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ academic_year_id: mappingSelection.value })
      });
      if (!res.ok) throw new Error('Mapping failed');
      toast.success('Academic session assigned successfully');
      setShowAssignModal(false);
      setMappingSelection(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleUnmap = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-academic-years/unmap/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unmapping failed');
      toast.success('Academic session removed from your university');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/academic-years/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  // Removed handleInputChange

  // Removed handleSubmit in favor of route-based Form page

  // Removed handleCloseModal

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
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Academic Years</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Setup and manage chronological session cycles</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by session name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            {authUtils.isSuperAdmin() ? (
              <button 
                onClick={() => navigate('/academic-years/add')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Add Session</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Assign from Master</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <SortHeader 
                  label="ID" 
                  field="id" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  className="px-8" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Session Name" 
                  field="year_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.year_name}
                />
                <th className={`${visibleColumns.timeline ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Timeline</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.year_name && (
                      <td className="px-4 py-5 font-bold text-slate-900">
                        <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-lg border border-sky-100 font-mono italic">
                          {item.year_name}
                        </span>
                      </td>
                    )}
                    {visibleColumns.timeline && (
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Initialization</p>
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <History size={12} /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/academic-years/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                          title="Edit Session"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => authUtils.isSuperAdmin() ? handleDeleteClick(item) : handleUnmap(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title={authUtils.isSuperAdmin() ? "Delete Session" : "Un-assign Session"}
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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No academic years found</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 underline uppercase tracking-tighter"
                      >
                        Reset Search
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

      {/* Add/Edit Modal was removed in favor of route-based Form page */}

      {/* Assign Modal for University Admin */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col mb-20 animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Assign Session</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Master Catalog</p>
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
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select from Master</label>
                <Select
                  options={availableMasters.filter(m => !data.some(d => d.id === m.value))}
                  value={mappingSelection}
                  onChange={setMappingSelection}
                  placeholder="Choose session..."
                  className="react-select-container text-sm font-semibold"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      padding: '0.4rem',
                      borderRadius: '1.25rem',
                      borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9',
                      borderWidth: '2px',
                      backgroundColor: '#f8fafc',
                      boxShadow: 'none',
                      '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' }
                    })
                  }}
                />
                <p className="text-[10px] text-slate-400 font-medium px-1">If the session you need is not in the list, please contact the System Administrator.</p>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleMap}
                disabled={!mappingSelection}
                className="px-10 py-4 bg-sky-600 disabled:opacity-50 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3"
              >
                <Check size={20} />
                <span>Assign Session</span>
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
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.year_name}"</span>? This action cannot be reversed.
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

export default AcademicYears;
