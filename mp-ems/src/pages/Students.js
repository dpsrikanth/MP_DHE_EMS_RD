import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Plus,
  Pencil,
  User,
  BookOpen,
  Calendar,
  Layers,
  FileText,
  ShieldAlert,
  DownloadCloud,
  UploadCloud,
  ChevronDown,
  Search,
  Zap
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import authUtils from '../utils/authUtils';
import Papa from 'papaparse';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import BulkImportModal from '../components/BulkImportModal';
import { masterDataApi } from '../api/masterDataApi';


const Students = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'Student ID' },
    { key: 'admission_no', label: 'Admission Number', mandatory: true },
    { key: 'policies', label: 'Policy', mandatory: true },
    { key: 'programName', label: 'Program' },
    { key: 'admission_year', label: 'Academic Year' },
    { key: 'semister', label: 'Semester' }
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
    clearFilters,
    visibleColumns,
    toggleColumn
  } = useDataTable(data, {
    searchFields: ['id', 'name', 'policies', 'programName', 'admission_year', 'semister'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // legacy modal states removed

  // ---- Delete Confirmation Modal State ----
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [studentToDelete, setStudentToDelete] = useState(null);

  // ---- Bulk Import/Export States ----
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  // cascading states removed - logic moved to StudentsForm.js

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await masterDataApi.getStudents();
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatColumnName = (key) => {
    const customMap = {
      semister: 'Semester',
      collageName: 'College Name',
      programName: 'Program Name',
      adharnumber: 'Aadhaar Number',
      bloodgroup: 'Blood Group',
      rollnumber: 'Roll Number',
      contactnumber: 'Contact Number',
      fathername: 'Father Name',
      mothername: 'Mother Name',
      spousename: 'Spouse Name',
      admission_year: 'Admission Year',
      admission_date: 'Admission Date'
    };
    if (customMap[key.toLowerCase()]) return customMap[key.toLowerCase()];
    
    // Convert camelCase or snake_case to Space Case
    const spaced = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();
    
    // Capitalize every word
    return spaced.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleExport = () => {
    if (!data || data.length === 0) {
      toast.warning('No data available to export');
      return;
    }

    const fieldsToExclude = ['id', 'created_at', 'updated_at', 'delete_status', 'deleteStatus', 'created_by', 'updated_by', 'user_id', 'userId', 'deleted_at', 'deleted_by', 'password', 'collageName'];
    const exportData = data.map(item => {
      const row = {};
      Object.keys(item).forEach(key => {
        if (!fieldsToExclude.includes(key)) {
          row[formatColumnName(key)] = item[key];
        }
      });
      return row;
    });

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'students_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  const handleDownloadTemplate = () => {
    const templateFields = ['Name', 'Email', 'Program Name', 'Semester', 'Admission Year', 'Admission No', 'Roll Number', 'Department Code', 'College Name', 'Policies'];
    const csv = Papa.unparse({ fields: templateFields, data: [] });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  // modal submission handlers removed - logic moved to StudentsForm.js

  // ---- Delete Modal Handlers ----
  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => setShowDeleteModal(false);

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await masterDataApi.deleteStudent(studentToDelete.id);
      await fetchData();
      setShowDeleteModal(false);
      setStudentToDelete(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message);
    } finally {
      setDeleteLoading(false);
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
    <div className="space-y-4">
      {/* Page Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Student Directory</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage student profile, enrollment and affiliations</p>
            </div>
          </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/university/student-search')}
                className="hidden xl:inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all text-[13px] border border-indigo-100 whitespace-nowrap"
              >
                <Zap size={16} className="fill-indigo-700/20" />
                <span>360 Lookup</span>
              </button>

              <TableSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search..."
              />
              
              <ColumnVisibilitySelector
                columns={availableColumns}
                visibleColumns={visibleColumns}
                onToggle={toggleColumn}
              />
            </div>
            {!authUtils.isUniversityAdmin() && (
              <div className="flex gap-2 relative">
                <div className="relative">
                  <button
                    onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-slate-700 font-bold rounded-2xl transition-all text-sm whitespace-nowrap"
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
                  onClick={() => navigate('/students/add')}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
                >
                  <Plus size={20} />
                  <span>Enroll Student</span>
                </button>
              </div>
            )}
          </div>

        {/* Improved Data Table */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/20">
                <SortHeader
                  label="StudentId"
                  field="id"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="px-8 text-center"
                  visible={visibleColumns.id}
                />
                <SortHeader
                  label="Admission No"
                  field="admission_no"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.admission_no}
                />
                <SortHeader
                  label="Policy"
                  field="policies"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.policies}
                />
                <SortHeader
                  label="Program"
                  field="programName"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.programName}
                />
                <SortHeader
                  label="AcademicYear"
                  field="admission_year"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.admission_year}
                />
                <SortHeader
                  label="Semister"
                  field="semister"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.semister}
                />
                <th className="px-8 py-4 text-[11px] font-black tracking-widest text-slate-400 text-right uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-6 py-4 text-center">
                        <span className="text-[12px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          ID-{item.id.toString().padStart(4, '0')}
                        </span>
                      </td>
                    )}
                    {visibleColumns.admission_no && (
                      <td className="px-4 py-5 font-bold text-slate-900">
                        <span className="text-[13px]">{item.admission_no || '—'}</span>
                      </td>
                    )}
                    {visibleColumns.policies && (
                      <td className="px-4 py-5 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 font-bold group-hover:bg-indigo-100 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all duration-300">
                            <User size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{item.name?.trim() || '—'}</p>
                            <p className="text-[11px] font-black text-indigo-500 tracking-widest leading-none flex items-center gap-1"><FileText size={10} /> {item.policies || '—'}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.programName && (
                      <td className="px-4 py-5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={14} className="text-indigo-400" />
                          <span className="text-[13px] text-slate-700">{item.programName || '—'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.admission_year && (
                      <td className="px-4 py-5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-indigo-400" />
                          <span className="text-[13px] text-slate-700">{item.admission_year || '—'}</span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.semister && (
                      <td className="px-4 py-5 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Layers size={14} className="text-indigo-400" />
                          <span className="text-[13px] text-slate-700">{item.semister || '—'}</span>
                        </div>
                      </td>
                    )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/university/student-search?admissionNo=${item.admission_no}`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="View 360 Profile"
                          >
                            <Zap size={18} />
                          </button>
                          
                          {!authUtils.isUniversityAdmin() && (
                            <>
                              <button
                                onClick={() => navigate(`/students/edit/${item.id}`)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Edit Record"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => openDeleteModal(item)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Remove Record"
                              >
                                <MdDelete size={20} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No students found matching your query</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[13px] font-black text-indigo-500 hover:text-indigo-600 underline tracking-tighter"
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


      {/* Modals removed for page-based navigation */}

      {/* ===== Delete Confirmation Modal ===== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <MdDelete size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirm Removal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Are you sure you want to delete <span className="font-bold text-slate-900">"{studentToDelete?.name}"</span>? This action cannot be reversed.
              </p>

              {deleteError && (
                <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px] font-bold flex items-center gap-2 w-full text-left">
                  <ShieldAlert size={16} className="shrink-0" /> {deleteError}
                </div>
              )}

              <div className="flex gap-3 w-full">
                <button
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center disabled:opacity-50"
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Remove</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bulk Import Modal ===== */}
      <BulkImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onUploadSuccess={fetchData}
        endpoint="/students/bulk-upload"
        entityName="students"
        expectedColumns={{
          name: 'Name',
          email: 'Email',
          programName: 'Program Name',
          semister: 'Semester',
          admission_year: 'Admission Year',
          admission_no: 'Admission No',
          rollnumber: 'Roll Number',
          collageName: 'College Name',
          department: 'Department Code'
        }}
        optionalColumns={['collageName', 'department']}
        validate={(students) => {
          const errors = [];
          const emailsInBatch = new Set();
          const admissionNosInBatch = new Set();
          const rollNosInBatch = new Set();

          const admissionNoRegex = /^\d{4}[A-Za-z]{3}\d{3}$/;
          const rollNoRegex = /^\d{2}[A-Za-z]{2}\d{4}$/;
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

          students.forEach((s, idx) => {
            const rowNum = idx + 1;

            // Duplicate email in batch check
            if (s.email) {
              const emailLower = s.email.toString().trim().toLowerCase();
              if (!emailRegex.test(emailLower)) {
                errors.push({ row: rowNum, message: `Invalid email format for '${s.email}'.` });
              } else if (emailsInBatch.has(emailLower)) {
                errors.push({ row: rowNum, message: `Duplicate email '${s.email}' found in the upload file.` });
              } else {
                emailsInBatch.add(emailLower);
              }
            }

            // Format and duplicate Admission No in batch check
            if (s.admission_no) {
              const admTrim = s.admission_no.toString().trim();
              if (admTrim !== '') {
                if (!admissionNoRegex.test(admTrim)) {
                  errors.push({
                    row: rowNum,
                    message: `Admission No '${s.admission_no}' is invalid. It must strictly follow the format: 4 digits + 3 letters + 3 digits (e.g., 2024CSE011).`
                  });
                }
                if (admissionNosInBatch.has(admTrim.toUpperCase())) {
                  errors.push({ row: rowNum, message: `Duplicate Admission No '${s.admission_no}' found in the upload file.` });
                } else {
                  admissionNosInBatch.add(admTrim.toUpperCase());
                }
              }
            }

            // Format and duplicate Roll Number in batch check
            if (s.rollnumber) {
              const rollTrim = s.rollnumber.toString().trim();
              if (rollTrim !== '') {
                if (!rollNoRegex.test(rollTrim)) {
                  errors.push({
                    row: rowNum,
                    message: `Roll Number '${s.rollnumber}' is invalid. It must strictly follow the format: 2 digits + 2 letters + 4 digits (e.g., 25BT1311).`
                  });
                }
                if (rollNosInBatch.has(rollTrim.toUpperCase())) {
                  errors.push({ row: rowNum, message: `Duplicate Roll Number '${s.rollnumber}' found in the upload file.` });
                } else {
                  rollNosInBatch.add(rollTrim.toUpperCase());
                }
              }
            }
          });

          return errors;
        }}
      />
    </div>
  );
};

export default Students;
