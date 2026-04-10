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
  Hash
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import authUtils from '../utils/authUtils';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';


const InfoItem = ({ label, value, isMono = false, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none ml-0.5">{label}</p>
    <div className={`bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl ${isMono ? 'font-mono' : 'font-bold'} text-slate-700 text-sm`}>
      {value || '-'}
    </div>
  </div>
);

const Teachers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'college_name', label: 'College' },
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

  const [designationFilter, setDesignationFilter] = useState('All');
  const [designationOptions, setDesignationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);

  // apply designation filter ahead of the table hook
  // teachers data may include a designation object or string depending on API
  const filteredByDesignation = designationFilter && designationFilter !== 'All'
    ? data.filter(d => {
      let des = d.designation;
      if (des && typeof des === 'object') {
        // API might return { designation_name: 'Professor' }
        des = des.designation_name || des.name || '';
      }
      return des === designationFilter;
    })
    : data;

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
  } = useDataTable(filteredByDesignation, {
    searchFields: ['id', 'name', 'email', 'college_name', 'department', 'designation'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewData, setViewData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();

  // Fetch designations and departments
  const fetchDropdownOptions = async () => {
    try {
      const [designResp, deptResp, collegeResp] = await Promise.all([
        fetch('http://localhost:8080/api/master-designations', {
          headers: authUtils.getAuthHeader()
        }),
        fetch('http://localhost:8080/api/master-departments', {
          headers: authUtils.getAuthHeader()
        }),
        fetch('http://localhost:8080/api/colleges', {
          headers: authUtils.getAuthHeader()
        })
      ]);

      if (designResp.ok) {
        const designations = await designResp.json();
        setDesignationOptions(designations.map(d => ({
          id: d.id,
          name: d.designation_name
        })));
      }

      if (deptResp.ok) {
        const departments = await deptResp.json();
        setDepartmentOptions(departments.map(d => ({
          id: d.id,
          name: d.department_name
        })));
      }

      if (collegeResp.ok) {
        const colleges = await collegeResp.json();
        console.log("college", colleges);
        setCollegeOptions(colleges.map(c => ({

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

  const fetchData = useCallback(async () => {
    try {
      const resp = await fetch('http://localhost:8080/api/master-teachers', {
        headers: authUtils.getAuthHeader()
      });
      if (!resp.ok) throw new Error('Failed to fetch teachers');
      const result = await resp.json();
      setData(result || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // load master designation list immediately for both filter and forms
    fetchDropdownOptions();
  }, [fetchData]);


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
      const resp = await fetch(`http://localhost:8080/api/master-teachers/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeader() }
      });

      if (!resp.ok) throw new Error('Failed to delete teacher');

      const result = await resp.json();

      // Remove the record from the table
      setData(prevData => prevData.filter(t => t.id !== deleteTarget.id));

      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error('Error: ' + err.message);
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
    <div className="space-y-6">
      {/* Header Statistics Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
              <Users size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Faculty Members</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Manage teaching staff, their affiliations and active status</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-xl font-black text-slate-900 leading-none">{total}</p>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center text-emerald-600">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1 text-center">Active</p>
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
                <label className="text-xs font-black text-slate-600">Designation:</label>
                <select
                  value={designationFilter}
                  onChange={e => setDesignationFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none"
                >
                  <option value="All">All</option>
                  {designationOptions.map(opt => (
                    <option key={opt.id} value={opt.name}>{opt.name}</option>
                  ))}
                </select>
              </div>

              <ColumnVisibilitySelector
                columns={availableColumns}
                visibleColumns={visibleColumns}
                onToggle={toggleColumn}
              />
              <button
                onClick={() => navigate('/teachers/add')}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm whitespace-nowrap"
              >
                <Plus size={20} />
                <span>Add Teacher</span>
              </button>
            </div>
          </div>
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
                <th className={`${visibleColumns.email ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Email</th>
                <SortHeader
                  label="College"
                  field="college_name"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.college_name}
                />
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
                {/* <th className={`${visibleColumns.qualification ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Qualification</th>
                <SortHeader
                  label="Experience"
                  field="experience"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.experience}
                />
                <th className={`${visibleColumns.specialization ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Specialization</th>
                <th className={`${visibleColumns.pan_no ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>PAN</th>
                <th className={`${visibleColumns.aadhaar_no ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Aadhaar</th>
                <th className={`${visibleColumns.dob ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>DOB</th>
                <th className={`${visibleColumns.gender ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Gender</th>
                <th className={`${visibleColumns.joining_date ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Joining Date</th>
                <th className={`${visibleColumns.phone ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Phone</th>
                <th className={`${visibleColumns.address ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Address</th> */}
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center`}>Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && (
                      <td className="px-4 py-5 text-center">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          #{item.id}
                        </span>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight mb-0.5">{item.name}</p>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.email && (
                      <td className="px-4 py-5">
                        <p className="text-[13px] text-slate-700 font-medium">{item.email}</p>
                      </td>
                    )}
                    {visibleColumns.college_name && (
                      <td className="px-4 py-5">
                        <p className="text-[13px] text-slate-700 font-medium">{item.college_name || 'Global'}</p>
                      </td>
                    )}
                    {visibleColumns.department && (
                      <td className="px-4 py-5">
                        <p className="text-[13px] text-slate-700 font-medium">{safeDisplay(item.department)}</p>
                      </td>
                    )}
                    {visibleColumns.designation && (
                      <td className="px-4 py-5">
                        <p className="text-[13px] text-slate-700 font-bold text-blue-600/80">{safeDisplay(item.designation)}</p>
                      </td>
                    )}
                    {/* {visibleColumns.qualification && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.qualification ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.experience && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.experience ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.specialization && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.specialization ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.pan_no && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700 font-mono">{item.pan_no ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.aadhaar_no && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700 font-mono">{item.aadhaar_no ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.dob && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.dob ? new Date(item.dob).toLocaleDateString('en-IN') : '-'}</p>
                      </td>
                    )}
                    {visibleColumns.gender && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.gender ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.joining_date && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.joining_date ? new Date(item.joining_date).toLocaleDateString('en-IN') : '-'}</p>
                      </td>
                    )}
                    {visibleColumns.phone && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700 font-mono">{item.phone ?? '-'}</p>
                      </td>
                    )}
                    {visibleColumns.address && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700 max-w-xs truncate">{item.address ?? '-'}</p>
                      </td>
                    )} */}
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
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/teachers/edit/${item.id}`)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Modify Profile"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleArchive(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Archive Teacher"
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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No faculty members found</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-blue-500 hover:text-blue-600 underline uppercase tracking-tighter"
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 flex flex-col">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                  <User size={30} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-none">Faculty Profile</h2>
                  <p className="text-sm text-slate-500 mt-1 font-bold uppercase tracking-wider">{viewData.name}</p>
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
            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                <InfoItem label="Date of Birth" value={viewData.dob ? new Date(viewData.dob).toLocaleDateString('en-IN') : '-'} />
                <InfoItem label="Gender" value={viewData.gender} />
                <InfoItem label="Blood Group" value={viewData.blood_group} />
                <InfoItem label="Marital Status" value={viewData.marital_status} />
                <InfoItem label="Father Name" value={viewData.father_name} />
                <InfoItem label="Mother Name" value={viewData.mother_name} />
                <InfoItem label="Spouse Name" value={viewData.spouse_name} />

                {/* Professional Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center"><Briefcase size={18} /></span>
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
                <InfoItem label="Joining Date" value={viewData.joining_date ? new Date(viewData.joining_date).toLocaleDateString('en-IN') : '-'} />
                <InfoItem label="Experience" value={viewData.experience ? `${viewData.experience} Years` : '-'} />
                <InfoItem label="Experience Detail" value={viewData.experience_detail} />
                <InfoItem label="Exp Months" value={viewData.experience_months} />
                <InfoItem label="Qualification" value={viewData.qualification} />
                <InfoItem label="Specialization" value={viewData.specialization} />

                {/* Documents Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"><IdCard size={18} /></span>
                    Identification & Tax
                  </h3>
                </div>
                <InfoItem label="PAN Card" value={viewData.pan_no} isMono={true} />
                <InfoItem label="Aadhaar Number" value={viewData.aadhaar_no} isMono={true} />
                <InfoItem label="Fax" value={viewData.fax} />

                {/* Address Section */}
                <div className="col-span-full mt-6 mb-2">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center"><MapPin size={18} /></span>
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
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-8 py-3 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-[1.03] active:scale-[0.97] transition-all text-sm uppercase tracking-widest"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Teachers;
