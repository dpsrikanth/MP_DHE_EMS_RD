import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import { 
  Plus, 
  Pencil,
  User,
  BookOpen,
  DownloadCloud,
  UploadCloud,
  ChevronDown,
  FileText
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import BulkImportModal from '../components/BulkImportModal';
import { masterDataApi } from '../api/masterDataApi';

const Subjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const bulkDropdownRef = useRef(null);
  const navigate = useNavigate();

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'program_name', label: 'Course Name' },
    { key: 'class_name', label: 'Class' },
    { key: 'batch', label: 'Batch' },
    { key: 'name', label: 'Subject', mandatory: true },
    { key: 'mapping_type', label: 'Type' },
    { key: 'credit', label: 'Credits' },
    { key: 'teacher_name', label: 'Faculty' },
    { key: 'periods_per_week', label: 'PPW' }
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
    searchFields: ['program_name', 'name', 'teacher_name', 'semester_name', 'mapping_type', 'subject_code'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target)) {
        setShowBulkDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchData = async () => {
    try {
      const result = await masterDataApi.getSubjects();
      const processed = result.map(item => {
        const batchNum = item.semester_name?.match(/\d+/)?.[0] || item.semester_name?.match(/[IVXLCDM]+/)?.[0] || '';
        return {
          ...item,
          class_name: item.program_name ? `${item.program_name} ${item.semester_name}` : 'Not Mapped',
          batch: batchNum
        };
      });
      setData(processed);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteSubject(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // --- Export CSV ---
  const handleExport = () => {
    setShowBulkDropdown(false);
    if (data.length === 0) { toast.info('No subjects to export.'); return; }
    const rows = data.map(s => ({
      id: s.id,
      subject_code: s.subject_code || '',
      name: s.name || '',
      program_name: s.program_name || '',
      semester_name: s.semester_name || '',
      mapping_type: s.mapping_type || '',
      is_mandatory: s.is_mandatory || 'M',
      has_examination: s.has_examination !== undefined ? s.has_examination : true,
      periods_per_week: s.periods_per_week || 6,
      credit: s.credit || '',
      teacher_name: s.teacher_name || '',
      status: s.status || 'Active'
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `subjects_export_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Subjects exported successfully!');
  };

  // --- Download Template ---
  const handleDownloadTemplate = () => {
    setShowBulkDropdown(false);
    const headers = ['subject_code', 'name', 'program_name', 'semester_name', 'mapping_type', 'is_mandatory', 'has_examination', 'periods_per_week', 'credit'];
    const sample = ['CS101', 'Introduction to Programming', 'BTech', 'Semester 1', 'Major', 'M', 'true', '6', '6'];
    const csv = Papa.unparse({ fields: headers, data: [sample] });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'subjects_import_template.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  // --- Bulk Import column definitions for BulkImportModal ---
  // expectedColumns: { dbKey: 'Human Readable Label' }
  // optionalColumns: array of optional db keys
  const bulkExpectedColumns = {
    subject_code: 'Subject Code',
    name: 'Subject Name',
    program_name: 'Program Name',
    semester_name: 'Semester Name',
    mapping_type: 'Type',
    is_mandatory: 'Mandatory (M/E)',
    periods_per_week: 'PPW',
    credit: 'Credits',
  };
  const bulkOptionalColumns = ['program_name', 'semester_name', 'mapping_type', 'is_mandatory', 'periods_per_week', 'credit'];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Subjects</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage subjects and curriculum mappings</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search subjects..." />
            <ColumnVisibilitySelector columns={availableColumns} visibleColumns={visibleColumns} onToggle={toggleColumn} />

            {/* Bulk Actions Dropdown */}
            <div className="relative" ref={bulkDropdownRef}>
              <button
                id="subjects-bulk-actions-btn"
                onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all border border-slate-200 whitespace-nowrap"
              >
                <FileText size={18} />
                <span>Bulk Actions</span>
                <ChevronDown size={16} className={`transition-transform ${showBulkDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showBulkDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95">
                  <button
                    id="subjects-export-btn"
                    onClick={handleExport}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <DownloadCloud size={16} />
                    Export CSV
                  </button>
                  <button
                    id="subjects-template-btn"
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    <FileText size={16} />
                    Download Template
                  </button>
                  <div className="border-t border-slate-100" />
                  <button
                    id="subjects-import-btn"
                    onClick={() => { setShowBulkDropdown(false); setShowBulkImportModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                  >
                    <UploadCloud size={16} />
                    Import CSV / Excel
                  </button>
                </div>
              )}
            </div>

            <button 
              id="subjects-add-btn"
              onClick={() => navigate('/subjects/add')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Subject</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/50">
                <SortHeader label="ID" field="id" currentSort={sortConfig} onSort={handleSort} className="px-6" visible={visibleColumns.id} />
                <SortHeader label="Course Name" field="program_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.program_name} />
                <SortHeader label="Class" field="class_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.class_name} />
                <SortHeader label="Batch" field="batch" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.batch} />
                <SortHeader label="Subject" field="name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.name} />
                <SortHeader label="Type" field="mapping_type" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.mapping_type} />
                <SortHeader label="Credits" field="credit" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.credit} className="text-center" />
                <SortHeader label="Faculty" field="teacher_name" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.teacher_name} />
                <SortHeader label="PPW" field="periods_per_week" currentSort={sortConfig} onSort={handleSort} visible={visibleColumns.periods_per_week} className="text-center" />
                <th className="px-6 py-3.5 text-[12px] font-black tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  {visibleColumns.id && <td className="px-6 py-4 text-sm font-bold text-slate-400">#{item.id}</td>}
                  {visibleColumns.program_name && <td className="px-4 py-5 text-sm font-semibold text-slate-900">{item.program_name || '—'}</td>}
                  {visibleColumns.class_name && (
                    <td className="px-4 py-5 font-bold">
                      <span className={`px-3 py-1.5 rounded-xl border text-[13px] ${item.program_name ? 'text-indigo-700 bg-indigo-50 border-amber-100' : 'text-slate-400 bg-slate-50 border-slate-100'}`}>
                        {item.class_name}
                      </span>
                    </td>
                  )}
                  {visibleColumns.batch && <td className="px-4 py-5 text-sm font-bold text-slate-500 text-center">{item.batch || '—'}</td>}
                  {visibleColumns.name && (
                    <td className="px-4 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{item.name}</span>
                        <span className="text-[12px] font-black text-slate-400 tracking-tighter">{item.subject_code}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.mapping_type && (
                    <td className="px-4 py-5">
                      <span className={`inline-flex px-2 py-1 rounded-md text-[12px] font-black border ${
                        item.is_mandatory === 'M' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {item.mapping_type} {item.is_mandatory === 'M' ? '(M)' : '(E)'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.credit && <td className="px-4 py-5 text-center text-sm font-black text-indigo-700">{item.credit !== null && item.credit !== undefined ? item.credit : '-'}</td>}
                  {visibleColumns.teacher_name && (
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-medium text-slate-600">{item.teacher_name || 'Not Assigned'}</span>
                      </div>
                    </td>
                  )}
                  {visibleColumns.periods_per_week && <td className="px-4 py-5 text-center text-sm font-black text-slate-900">{item.periods_per_week}</td>}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/subjects/edit/${item.id}`)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={18} /></button>
                      <button onClick={() => { setDeleteTarget(item); setShowDeleteModal(true); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><MdDelete size={20} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onSuccess={() => { setShowBulkImportModal(false); fetchData(); }}
          endpoint="/master-subjects/bulk-upload"
          entityName="subjects"
          expectedColumns={bulkExpectedColumns}
          optionalColumns={bulkOptionalColumns}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><MdDelete size={32} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">Permanently remove this subject entry? This cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all" onClick={handleDeleteConfirm}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
