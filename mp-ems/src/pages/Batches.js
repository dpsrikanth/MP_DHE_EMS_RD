import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { formatDate } from '../utils/dateUtils';
import Select, { components } from "react-select";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import { masterDataApi } from '../api/masterDataApi';

const InfoItem = ({ label, value, isMono = false, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none ml-0.5">{label}</p>
    <div className={`bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl ${isMono ? 'font-mono' : 'font-bold'} text-slate-700 text-sm`}>
      {value || '-'}
    </div>
  </div>
);

const Batches = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  
  const batchNameOptions = [
    { value: 'July-November', label: 'July-November' },
    { value: 'January-June', label: 'January-June' },
    { value: 'Annual', label: 'Annual' },
    { value: 'September-May', label: 'September-May' },
    { value: 'October-February', label: 'October-February' },
    { value: 'March-August', label: 'March-August' }
  ];
  // Removed form state and fetch functions that are now in BatchesForm.js

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'batch_name', label: 'Batch Name' },
    { key: 'policy_name', label: 'Policy' },
    { key: 'start_date', label: 'Start Date' },
    { key: 'end_date', label: 'End Date' },
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
    searchFields: ['id', 'batch_name', 'policy_name', 'program_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Removed fetchAcademicYears and fetchPrograms as they are now in BatchesForm.js

  const fetchData = async () => {
    try {
      const result = await masterDataApi.getBatches();
      setData(result || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Removed handleAdd and handleUpdate in favor of route-based Form page

  // Removed resetForm and loadForEdit in favor of route-based Form page

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteBatch(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
      toast.success('Batch deleted successfully');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
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
    <div className="space-y-4">
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              onClick={() => navigate('/batches/add')}
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
                <SortHeader label="ID" field="id" currentSort={sortConfig} onSort={handleSort} className="px-6" visible={visibleColumns.id} />
                <SortHeader label="Batch Name" field="batch_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.batch_name} />
                <SortHeader label="Start Date" field="start_date" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.start_date} />
                <SortHeader label="End Date" field="end_date" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.end_date} />
                <SortHeader label="Policy" field="policy_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.policy_name} />
                <SortHeader label="Program" field="program_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.program_name} />
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400 text-center`}>Status</th>
                <th className={`${visibleColumns.created_at ? '' : 'hidden'} px-4 py-3.5 text-[12px] font-black  tracking-widest text-slate-400`}>Created On</th>
                <th className="px-6 py-3.5 text-[12px] font-black  tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.batch_name && <td className="px-4 py-4 text-sm font-semibold text-slate-900 leading-tight">{item.batch_name}</td>}
                    {visibleColumns.start_date && <td className="px-4 py-4 text-sm text-slate-600">{formatDate(item.start_date)}</td>}
                    {visibleColumns.end_date && <td className="px-4 py-4 text-sm text-slate-600">{formatDate(item.end_date)}</td>}
                    {visibleColumns.policy_name && <td className="px-4 py-4 text-sm font-bold text-indigo-600"><span className="bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{item.policy_name || 'No Policy'}</span></td>}
                    {visibleColumns.program_name && <td className="px-4 py-4 text-sm font-medium text-slate-600">{item.program_name}</td>}
                    {visibleColumns.status && (
                      <td className="px-4 py-4 text-center">
                        {item.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full  border border-emerald-100 tracking-tighter shadow-sm"><ShieldCheck size={12} /> Active</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full  border border-slate-200 tracking-tighter"><ShieldAlert size={12} /> Inactive</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.created_at && <td className="px-4 py-4 text-[13px] font-medium text-slate-400">{formatDate(item.created_at)}</td>}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setViewData(item); setShowViewModal(true); }} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
                        <button onClick={() => navigate(`/batches/edit/${item.id}`)} className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all" title="Edit Batch"><Pencil size={18} /></button>
                        <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete Batch"><MdDelete size={20} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="px-6 py-8 text-center text-sm font-bold text-slate-400  tracking-widest">No batches found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* Add/Edit Modal was removed in favor of route-based Form page */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">Batch Profile</h2>
                <p className="text-[12px] font-black text-slate-400  tracking-widest opacity-70 flex items-center gap-2"><Calendar size={12} /> Academic Management System</p>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"><X size={20} /></button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoItem label="Batch Name" value={viewData.batch_name} className="col-span-full" />
                <InfoItem label="Course/Program" value={viewData.program_name} />
                <InfoItem label="Policy" value={viewData.policy_name || 'None'} />
                <InfoItem label="Start Date" value={formatDate(viewData.start_date)} />
                <InfoItem label="End Date" value={formatDate(viewData.end_date)} />
                <InfoItem label="Fees Import Flag" value={viewData.import_fees_flag} />
                <InfoItem label="Status" value={viewData.status || 'Active'} />
                <InfoItem label="Created On" value={formatDate(viewData.created_at)} />
              </div>
            </div>
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-sm  tracking-widest">Close Details</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
