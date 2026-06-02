import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  Building, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  Activity,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  FileText,
  UploadCloud,
  DownloadCloud
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import Papa from 'papaparse';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import BulkImportModal from '../components/BulkImportModal';
import { masterDataApi } from '../api/masterDataApi';

const Departments = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [existingDepartments, setExistingDepartments] = useState([]);
  const [existingDeptNames, setExistingDeptNames] = useState([]);

  const availableColumns = [
    { key: 'id', label: 'ID Reference' },
    { key: 'department_code', label: 'Department Code', sortable: true },
    { key: 'department_name', label: 'Department Name', sortable: true },
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
    visibleColumns,
    toggleColumn
  } = useDataTable(data, { 
    searchFields: ['department_code', 'department_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await masterDataApi.getDepartments();
      setData(result || []);

      const codes = (result || []).map(d => (d.department_code || '').toLowerCase());
      const names = (result || []).map(d => (d.department_name || '').toLowerCase());
      setExistingDepartments(codes);
      setExistingDeptNames(names);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteDepartment(deleteTarget.id);
      toast.success('Department deleted successfully!');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.warning('No data available to export');
      return;
    }

    const fieldsToExclude = ['id', 'created_at', 'updated_at', 'deleteflag', 'college_id'];
    const exportData = data.map(item => {
      const row = {};
      Object.keys(item).forEach(key => {
        if (!fieldsToExclude.includes(key)) {
          row[key] = item[key];
        }
      });
      return row;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'departments_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  const handleDownloadTemplate = () => {
    const templateFields = ['Department Code', 'Department Name'];
    const csv = Papa.unparse({ fields: templateFields, data: [] });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'departments_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  const bulkValidate = (rows) => {
    const errors = [];
    rows.forEach((row, idx) => {
      const rowNumber = idx + 2;
      // Support both human-readable headers ("Department Code") and DB-style keys ("department_code")
      const deptCode = (row['Department Code'] || row['department_code'])?.toString()?.trim();
      const deptName = (row['Department Name'] || row['department_name'])?.toString()?.trim();

      if (!deptCode) {
        errors.push({ row: rowNumber, message: 'Department Code is required' });
      } else if (existingDepartments.includes(deptCode.toLowerCase())) {
        errors.push({ row: rowNumber, message: `Department Code '${deptCode}' already exists` });
      }

      if (!deptName) {
        errors.push({ row: rowNumber, message: 'Department Name is required' });
      } else if (existingDeptNames.includes(deptName.toLowerCase())) {
        errors.push({ row: rowNumber, message: `Department Name '${deptName}' already exists` });
      }
    });
    return errors;
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
    <div className="space-y-4">
      {/* Header Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Building size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Departments</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Configure and define college departments</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by department name or code..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <div className="flex gap-2 relative">
              <div className="relative">
                <button
                  onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                  className="inline-flex items-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-sm whitespace-nowrap"
                >
                  <span>Bulk Actions</span>
                  <ChevronDown size={16} className={`transition-transform ${showBulkDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showBulkDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <button 
                      onClick={handleDownloadTemplate}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <FileText size={16} className="text-slate-400" />
                      Download Template
                    </button>
                    <button 
                      onClick={() => { setShowImportModal(true); setShowBulkDropdown(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UploadCloud size={16} className="text-slate-400" />
                      Import CSV
                    </button>
                    <button 
                      onClick={handleExport}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <DownloadCloud size={16} className="text-slate-400" />
                      Export All
                    </button>
                  </div>
                )}
              </div>
              <button 
                onClick={() => navigate('/departments/add')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Create Department</span>
              </button>
            </div>
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
                  className="px-6" 
                  visible={visibleColumns.id}
                />
                <SortHeader 
                  label="Department Code" 
                  field="department_code" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.department_code}
                />
                <SortHeader 
                  label="Department Name" 
                  field="department_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.department_name}
                />
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-3.5 text-[12px] font-black  tracking-widest text-slate-400 text-center`}>Status</th>
                <th className="px-6 py-3.5 text-[12px] font-black  tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-6 py-4">
                        <span className="text-[12px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.department_code && (
                      <td className="px-4 py-4 font-black text-slate-800 tracking-tight">
                        {item.department_code}
                      </td>
                    )}
                    {visibleColumns.department_name && (
                      <td className="px-4 py-4 font-black text-slate-800 tracking-tight">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400">
                            <Activity size={16} />
                          </div>
                          {item.department_name}
                        </div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-4 text-center">
                        {(item.status === 'Active' || item.status === true) ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full  border border-emerald-100 tracking-tighter shadow-sm">
                            <ShieldCheck size={12} /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[12px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full  border border-slate-200 tracking-tighter">
                            <ShieldAlert size={12} /> Inactive
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/departments/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit Definition"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Remove Department"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No departments found matching your criteria</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-[13px] font-black text-indigo-500 hover:text-indigo-600 underline  tracking-tighter"
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

      {/* Add/Edit Modal removed — handled by /departments/add and /departments/edit/:id routes */}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <MdDelete size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{deleteTarget?.department_name}"</span>? This action cannot be reversed.
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

      {/* Bulk Import Modal */}
      {showImportModal && (
        <BulkImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchData}
          entityName="Department"
          endpoint="/master-departments/bulk-upload"
          expectedColumns={{ department_code: "Department Code", department_name: "Department Name", status: "Status" }}
          optionalColumns={[]}
          validate={bulkValidate}
        />
      )}
    </div>
  );
};

export default Departments;
