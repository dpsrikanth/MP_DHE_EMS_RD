import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Users,
  Plus,
  Pencil,
  X,
  Check,
  Mail,
  Building,
  Briefcase,
  User,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Shield,
  Building2,
  Eye,
  Phone,
  MapPin,
  IdCard,
  Droplet,
  Hash,
  DownloadCloud,
  UploadCloud,
  ChevronDown,
  FileText
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import authUtils from '../utils/authUtils';
import { formatDate } from '../utils/dateUtils';
import Papa from 'papaparse';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';
import BulkImportModal from '../components/BulkImportModal';
import { masterDataApi } from '../api/masterDataApi';



const InfoItem = ({ label, value, isMono = false, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none ml-0.5">{label}</p>
    <div className={`bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl ${isMono ? 'font-mono' : 'font-bold'} text-slate-700 text-sm`}>
      {value || '-'}
    </div>
  </div>
);

const Teachers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [existingEmails, setExistingEmails] = useState([]);
  const [error, setError] = useState(null);
  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', mandatory: true },
    { key: 'email', label: 'Email' },
    ...(authUtils.isUniversityAdmin() ? [{ key: 'college_name', label: 'College' }] : []),
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'qualification', label: 'Qualification' },
    { key: 'experience', label: 'Experience' },
    { key: 'specialization', label: 'Specialization' },
    { key: 'pan_no', label: 'PAN Number' },
    { key: 'aadhaar_no', label: 'Aadhaar Number' },
    { key: 'dob', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'joining_date', label: 'Joining Date' },
    { key: 'phone', label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'status', label: 'Status' }
  ];

  const [staffType, setStaffType] = useState('Teaching');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [designationOptions, setDesignationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);

  // apply designation filter ahead of the table hook
  // teachers data may include a designation object or string depending on API
  const filteredData = data.filter(d => {
    // 1. Staff Type Filter
    const type = d.designation_type || 'Teaching';
    if (staffType === 'Teaching' && type !== 'Teaching') return false;
    if (staffType === 'Non-Teaching' && type === 'Teaching') return false;

    // 2. Designation Filter
    if (designationFilter && designationFilter !== 'All') {
      let des = d.designation;
      if (des && typeof des === 'object') {
        des = des.designation_name || des.name || '';
      }
      if (des !== designationFilter) return false;
    }
    return true;
  });

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
  } = useDataTable(filteredData, {
    searchFields: ['id', 'name', 'email', 'college_name', 'department', 'designation'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);
  const navigate = useNavigate();

  // Fetch designations and departments
  const fetchDropdownOptions = async () => {
    try {
      const [designResp, deptResp, collegeResp] = await Promise.all([
        masterDataApi.getDesignations(),
        masterDataApi.getDepartments(),
        masterDataApi.getColleges()
      ]);

      if (designResp) {
        setDesignationOptions(designResp.map(d => ({
          id: d.id,
          name: d.designation_name,
          type: d.designation_type
        })));
      }

      if (deptResp) {
        setDepartmentOptions(deptResp.map(d => ({
          id: d.id,
          name: d.department_name
        })));
      }

      if (collegeResp) {
        setCollegeOptions(collegeResp.map(c => ({

          id: c.id,
          name: c.college_name
        })));
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const validate = (form) => {
    const errs = {};
    if (!form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    if (!form.designation_id) errs.designation_id = 'Designation is required';
    if (!form.college_id) errs.college_id = 'College is required';
    if (!form.department_id) errs.department_id = 'Department is required';

    if (!form.qualification) errs.qualification = 'Qualification is required';
    if (form.experience === '' || form.experience === null) errs.experience = 'Experience is required';
    if (!form.specialization) errs.specialization = 'Specialization is required';

    if (!form.pan_no) {
      errs.pan_no = 'PAN is required';
    } else {
      const pan = form.pan_no.toString().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        errs.pan_no = 'PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
      }
    }

    if (!form.aadhaar_no) {
      errs.aadhaar_no = 'Aadhaar is required';
    } else {
      const cleanAadhaar = form.aadhaar_no.toString().replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        errs.aadhaar_no = 'Aadhaar must be 12 digits';
      }
    }

    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.joining_date) errs.joining_date = 'Joining date is required';

    if (!form.phone) {
      errs.phone = 'Phone number is required';
    } else if (!/^(\+91[-\s]?|0)?[6-9]\d{9}$/.test(form.phone)) {
      errs.phone = 'Invalid Indian phone number';
    }

    if (!form.address) errs.address = 'Address is required';

    return errs;
  };

  // Validation for bulk import rows (email format)
  const bulkValidate = (rows) => {
    const errors = [];
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    rows.forEach((row, idx) => {
      const email = row.email?.toString()?.trim();
      const rowNumber = idx + 2; // accounting for header row
      if (!email) {
        errors.push({ row: rowNumber, message: 'Email is required' });
      } else {
        if (!emailRegex.test(email)) {
          errors.push({ row: rowNumber, message: `Invalid email format: ${email}` });
        }
        // Duplicate check against existing emails (case‑insensitive)
        if (existingEmails.includes(email.toLowerCase())) {
          errors.push({ row: rowNumber, message: `Email already exists: ${email}` });
        }
      }
    });
    return errors;
  };

  const fetchData = useCallback(async () => {
    try {
      const result = await masterDataApi.getTeachers();
      const teachers = result || [];
      setData(teachers);
      // Populate existing emails for duplicate check (lowercased)
      const emails = teachers.map(t => (t.email || '').toLowerCase());
      setExistingEmails(emails);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // load master designation list immediately for both filter and forms
    fetchDropdownOptions();
  }, [fetchData]);

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

    const fieldsToExclude = ['id', 'created_at', 'updated_at', 'delete_status', 'deleteStatus', 'created_by', 'updated_by', 'user_id', 'userId', 'deleted_at', 'deleted_by', 'password', 'college_name', 'department'];
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
    link.setAttribute('download', 'teachers_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  const handleDownloadTemplate = () => {
    const templateFields = ['Name', 'Email', 'Department Code'];
    const csv = Papa.unparse({ fields: templateFields, data: [] });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'teachers_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowBulkDropdown(false);
  };

  // Removed handleAddChange and handleEditChange


  // Removed handleAddSubmit

  // Removed Edit modal handlers

  // Removed handleEditSubmit

  const handleArchive = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await masterDataApi.deleteTeacher(deleteTarget.id);

      // Remove the record from the table
      setData(prevData => prevData.filter(t => t.id !== deleteTarget.id));

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
      console.error('Delete error', err);
    }
  };

  const total = data.length;
  const activeCount = data.filter(t => t.status === 'Active' || t.status === true).length;

  // Helper function to safely convert values to strings
  const safeDisplay = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') {
      if (value.designation_name) return value.designation_name;
      if (value.department_name) return value.department_name;
      if (value.name) return value.name;
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Header Statistics Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Staff Management</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage teaching and administrative personnel across the college</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 px-5 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-center">
                <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Total</p>
                <p className="text-xl font-black text-slate-900 leading-none">{total}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center text-emerald-600">
                <p className="text-[12px] font-black text-emerald-400  tracking-widest leading-none mb-1 text-center">Active</p>
                <p className="text-xl font-black leading-none">{activeCount}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <TableSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, email, college or department..."
              />

              <div className="flex items-center gap-2">
                <label className="text-[13px] font-black text-slate-600">Designation:</label>
                <select
                  value={designationFilter}
                  onChange={e => setDesignationFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none"
                >
                  <option value="All">All</option>
                  {designationOptions
                    .filter(opt => {
                      const type = opt.type || 'Teaching';
                      if (staffType === 'Teaching') return type === 'Teaching';
                      return type !== 'Teaching';
                    })
                    .map(opt => (
                      <option key={opt.id} value={opt.name}>{opt.name}</option>
                    ))}
                </select>
              </div>

              <ColumnVisibilitySelector
                columns={availableColumns}
                visibleColumns={visibleColumns}
                onToggle={toggleColumn}
              />
              {!authUtils.isUniversityAdmin() && (
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
                    onClick={() => navigate('/teachers/add')}
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
                  >
                    <Plus size={20} />
                    <span>Add Staff</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Staff Category Tabs */}
        <div className="px-5 pb-2 flex items-center gap-2 border-b border-slate-100">
          <button
            onClick={() => {
              setStaffType('Teaching');
              setDesignationFilter('All');
            }}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              staffType === 'Teaching'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Teaching Staff
          </button>
          <button
            onClick={() => {
              setStaffType('Non-Teaching');
              setDesignationFilter('All');
            }}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              staffType === 'Non-Teaching'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Non-Teaching Staff
          </button>
        </div>

        {/* Improved Table Layout */}
        <div className="overflow-x-auto text-slate-700">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-y border-slate-100 bg-slate-50/20">
                <SortHeader
                  label="ID"
                  field="id"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  className="text-center"
                  visible={visibleColumns.id}
                />
                <SortHeader
                  label="Name"
                  field="name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.name}
                />
                <th className={`${visibleColumns.email ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Email</th>
                {authUtils.isUniversityAdmin() && (
                  <SortHeader
                    label="College"
                    field="college_name"
                    currentSort={sortConfig}
                    onSort={handleSort}
                    visible={visibleColumns.college_name}
                  />
                )}
                <SortHeader
                  label="Department"
                  field="department"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.department}
                />
                <SortHeader
                  label="Designation"
                  field="designation"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.designation}
                />
                {/* <th className={`${visibleColumns.qualification ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Qualification</th>
                <SortHeader
                  label="Experience"
                  field="experience"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.experience}
                />
                <th className={`${visibleColumns.specialization ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Specialization</th>
                <th className={`${visibleColumns.pan_no ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>PAN</th>
                <th className={`${visibleColumns.aadhaar_no ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Aadhaar</th>
                <th className={`${visibleColumns.dob ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>DOB</th>
                <th className={`${visibleColumns.gender ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Gender</th>
                <th className={`${visibleColumns.joining_date ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Joining Date</th>
                <th className={`${visibleColumns.phone ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Phone</th>
                <th className={`${visibleColumns.address ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400`}>Address</th> */}
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-4 text-[12px] font-black  tracking-widest text-slate-400 text-center`}>Status</th>
                {!authUtils.isUniversityAdmin() && <th className="px-6 py-4 text-[13px] font-black  tracking-widest text-slate-400 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-4 py-5 text-center">
                        <span className="text-[12px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{item.name}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="px-4 py-4">
                        <p className="text-[13px] text-slate-700 font-medium">{item.email}</p>
                      </td>
                    )}
                    {authUtils.isUniversityAdmin() && visibleColumns.college_name && (
                      <td className="px-4 py-4">
                        <p className="text-[13px] text-slate-700 font-medium">{item.college_name || 'Global'}</p>
                      </td>
                    )}
                    {visibleColumns.department && (
                      <td className="px-4 py-4">
                        <p className="text-[13px] text-slate-700 font-medium">{safeDisplay(item.department)}</p>
                      </td>
                    )}
                    {visibleColumns.designation && (
                      <td className="px-4 py-4">
                        <p className="text-[13px] text-slate-700 font-bold text-indigo-600/80">{safeDisplay(item.designation)}</p>
                      </td>
                    )}
                    {/* ... omitted commented out cells ... */}
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
                    {!authUtils.isUniversityAdmin() && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/teachers/edit/${item.id}`)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Modify Profile"
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            onClick={() => handleArchive(item)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Archive Staff"
                          >
                            <MdDelete size={20} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400  tracking-widest">No faculty members found</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-[13px] font-black text-indigo-500 hover:text-indigo-600 underline  tracking-tighter"
                      >
                        Clear Search
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-6 text-center flex flex-col items-center">
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-600/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <User size={30} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Staff Profile</h2>
                  <p className="text-sm text-slate-500 mt-1 font-bold  tracking-wider">{viewData.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowViewModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Personal Information Section */}
                <div className="col-span-full mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><User size={18} /></span>
                    Personal Information
                  </h3>
                </div>

                <InfoItem label="Full Name" value={viewData.name} />
                <InfoItem label="Email Address" value={viewData.email} />
                <InfoItem label="Phone Number" value={viewData.phone} />
                <InfoItem label="Date of Birth" value={formatDate(viewData.dob)} />
                <InfoItem label="Gender" value={viewData.gender} />
                <InfoItem label="Blood Group" value={viewData.blood_group} />
                <InfoItem label="Marital Status" value={viewData.marital_status} />
                <InfoItem label="Father Name" value={viewData.father_name} />
                <InfoItem label="Mother Name" value={viewData.mother_name} />
                <InfoItem label="Spouse Name" value={viewData.spouse_name} />

                {/* Professional Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><Briefcase size={18} /></span>
                    Professional Affiliation
                  </h3>
                </div>

                <InfoItem label="Designation" value={safeDisplay(viewData.designation)} />
                <InfoItem label="Department" value={safeDisplay(viewData.department)} />
                <InfoItem label="College" value={viewData.college_name || 'Global'} />
                <InfoItem label="Job Title" value={viewData.job_title} />
                <InfoItem label="Position" value={viewData.employee_position_name} />
                <InfoItem label="Employee Grade" value={viewData.employee_grade_name} />
                <InfoItem label="Category" value={viewData.employee_category_name} />
                <InfoItem label="Joining Date" value={formatDate(viewData.joining_date)} />
                <InfoItem label="Experience" value={viewData.experience ? `${viewData.experience} Years` : '-'} />
                <InfoItem label="Experience Detail" value={viewData.experience_detail} />
                <InfoItem label="Exp Months" value={viewData.experience_months} />
                <InfoItem label="Qualification" value={viewData.qualification} />
                <InfoItem label="Specialization" value={viewData.specialization} />

                {/* Documents Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><IdCard size={18} /></span>
                    Identification & Tax
                  </h3>
                </div>
                <InfoItem label="PAN Card" value={viewData.pan_no} isMono={true} />
                <InfoItem label="Aadhaar Number" value={viewData.aadhaar_no} isMono={true} />
                <InfoItem label="Fax" value={viewData.fax} />

                {/* Address Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center"><MapPin size={18} /></span>
                    Contact & Address Details
                  </h3>
                </div>
                <InfoItem label="Residential Address" value={viewData.address} className="col-span-2" />
                <InfoItem label="Home Address" value={viewData.home_address_line1} />
                <InfoItem label="Home City" value={viewData.home_city} />
                <InfoItem label="Home State" value={viewData.home_state} />
                <InfoItem label="Home Country" value={viewData.home_country_name} />
                <InfoItem label="Home Phone" value={viewData.home_phone1} />
                <InfoItem label="Office Phone 1" value={viewData.office_phone1} />
                <InfoItem label="Office Phone 2" value={viewData.office_phone2} />
                <InfoItem label="Office State" value={viewData.office_state} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-8 py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-sm  tracking-widest"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Bulk Import Modal ===== */}
      <BulkImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onUploadSuccess={fetchData}
        endpoint="/teachers/bulk-upload"
        entityName="teachers"
        expectedColumns={{
          name: 'Name',
          email: 'Email',
          departmentCode: ['Department Code', 'Department'],
          designation: 'Designation',
          designation_type: ['Designation Type', 'Staff Type', 'Category'],
          qualification: 'Qualification',
          experience: 'Experience',
          specialization: 'Specialization',
          pan_no: ['PAN Number', 'PAN No', 'PAN'],
          aadhaar_no: ['Aadhaar Number', 'Aadhaar No', 'Aadhaar'],
          dob: ['Date of Birth', 'DOB'],
          gender: 'Gender',
          joining_date: ['Joining Date', 'Date of Joining'],
          phone: ['Phone Number', 'Phone', 'Contact Number', 'Mobile'],
          address: 'Address',
          status: 'Status'
        }}
        optionalColumns={[
          'designation',
          'designation_type',
          'qualification',
          'experience',
          'specialization',
          'pan_no',
          'aadhaar_no',
          'dob',
          'gender',
          'joining_date',
          'phone',
          'address',
          'status'
        ]}
      validate={bulkValidate} />
    </div>
  );
};

export default Teachers;
