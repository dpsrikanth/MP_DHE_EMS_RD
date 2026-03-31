import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  BookOpen, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Calendar,
  Hash,
  ShieldCheck,
  ShieldAlert,
  Eye,
  Layers,
  Settings,
  ListRestart
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import Select, { components } from "react-select";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import authUtils from "../utils/authUtils";

const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className="mr-2 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500"
        />{" "}
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

const InfoItem = ({ label, value, isMono = false, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-0.5">{label}</p>
    <div className={`bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl ${isMono ? 'font-mono' : 'font-bold'} text-slate-700 text-sm`}>
      {value || '-'}
    </div>
  </div>
);

const Programs = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableMasters, setAvailableMasters] = useState([]);
  const [mappingSelection, setMappingSelection] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    duration_years: '', 
    department_ids: [],
    section_name: '',
    code: '',
    grading_system_type: 'Normal',
    enable_elective_subjects_selection: 'N'
  });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Program Name' },
    { key: 'duration_years', label: 'Duration' },
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
    searchFields: ['id', 'name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
    fetchDepartments();
    if (authUtils.isUniversityAdmin()) {
      fetchAvailableMasters();
    }
  }, []);

  const fetchAvailableMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setAvailableMasters(result.programs.map(p => ({ value: p.id, label: p.name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setDepartments(result.map(d => ({ value: d.id, label: d.department_name })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-programs', {
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

  // Removed handleAdd and handleUpdate in favor of route-based Form page

  const handleMap = async () => {
    if (!mappingSelection) return toast.warning('Please select a program');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-programs/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ program_id: mappingSelection.value })
      });
      if (!res.ok) throw new Error('Mapping failed');
      toast.success('Program assigned successfully');
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
      const res = await fetch(`http://localhost:8080/api/master-programs/unmap/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Unmapping failed');
      toast.success('Program removed from your university');
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  // Removed loadForEdit in favor of route-based Form page

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-programs/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
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
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Programs</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Academic curricula and duration definitions</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search programs by name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            {authUtils.isSuperAdmin() ? (
              <button 
                onClick={() => navigate('/programs/add')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Add Program</span>
              </button>
            ) : (
              <button 
                onClick={() => setShowAssignModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
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
                  label="Program Name" 
                  field="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.name}
                />
                <SortHeader 
                  label="Duration" 
                  field="duration_years" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.duration_years}
                />
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
                    {visibleColumns.name && (
                      <td className="px-4 py-5 text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </td>
                    )}
                    {visibleColumns.duration_years && (
                      <td className="px-4 py-5 text-sm font-bold text-emerald-600 uppercase tracking-tighter">
                        <span className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                          {item.duration_years} Years
                        </span>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-5 text-center">
                        {(item.status === 'Active' || item.status === true) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase border border-emerald-100 tracking-tighter shadow-sm">
                            <ShieldCheck size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase border border-slate-200 tracking-tighter">
                            <ShieldAlert size={12} /> Inactive
                          </span>
                        )}
                      </td>
                    )}
                    {visibleColumns.created_at && (
                      <td className="px-4 py-5 text-xs font-medium text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setViewData(item); setShowViewModal(true); }}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => navigate(`/programs/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Edit Program"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => authUtils.isSuperAdmin() ? handleDelete(item) : handleUnmap(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title={authUtils.isSuperAdmin() ? "Delete Program" : "Un-assign Program"}
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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No programs found matching your search</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-emerald-500 hover:text-emerald-600 underline uppercase tracking-tighter"
                      >
                        Clear Filters
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

      {/* Assign Modal for University Admin */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col mb-20 animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none mb-1">Assign Program</h2>
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
                  placeholder="Choose program..."
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
                <p className="text-[10px] text-slate-400 font-medium px-1">If the program you need is not in the list, please contact the System Administrator.</p>
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
                className="px-10 py-4 bg-emerald-600 disabled:opacity-50 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3"
              >
                <Check size={20} />
                <span>Assign Program</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal was removed in favor of route-based Form page */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
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
      {/* View Details Modal */}
      {showViewModal && viewData && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowViewModal(false)} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                  Program Profile
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <BookOpen size={12} /> Academic Management System
                </p>
              </div>
              <button 
                onClick={() => setShowViewModal(false)}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Program Name" value={viewData.name} className="col-span-full" />
                <InfoItem label="Program Code" value={viewData.code} isMono={true} />
                <InfoItem label="Duration" value={`${viewData.duration_years} Years`} />
                <InfoItem label="Section" value={viewData.section_name} />
                <InfoItem label="Grading System" value={viewData.grading_system_type} />
                <InfoItem label="Elective Selection" value={viewData.enable_elective_subjects_selection === 'Y' ? 'Enabled' : 'Disabled'} />
                <InfoItem label="Status" value={viewData.status || 'Active'} />
                <InfoItem label="Created On" value={viewData.created_at ? new Date(viewData.created_at).toLocaleString() : '-'} />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><Layers size={18}/></span>
                  Associated Departments
                </h3>
                <div className="flex flex-wrap gap-2">
                  {viewData.department_ids && viewData.department_ids.length > 0 ? (
                    viewData.department_ids.map(deptId => {
                      const dept = departments.find(d => d.value === deptId);
                      return (
                        <span key={deptId} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                          {dept ? dept.label : `ID: ${deptId}`}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-slate-400 font-medium italic">No departments associated</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-sm uppercase tracking-widest"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Programs;
