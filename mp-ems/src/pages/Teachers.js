import React, { useState, useEffect, useCallback } from "react";
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
  ShieldAlert
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import authUtils from '../utils/authUtils';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

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
    { key: 'experience', label: 'Experience' },
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    college_id: '',
    designation_id: '',
    department_id: '',
    experience: '',
    status: true
  });
  const [addErrors, setAddErrors] = useState({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    email: '',
    college_id: '',
    designation_id: '',
    department_id: '',
    experience: '',
    status: true
  });
  const [editErrors, setEditErrors] = useState({});

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

  const openAddModal = () => {
    fetchDropdownOptions();
    setAddForm({ name: '', email: '', college_id: '', designation_id: '', department_id: '', experience: '', status: true });
    setAddErrors({});
    setAddError('');
    setShowAddModal(true);
  };
  const closeAddModal = () => setShowAddModal(false);

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(addForm);
    if (Object.keys(errs).length > 0) return setAddErrors(errs);
    
    setAddLoading(true);
    setAddError('');
    try {
      const payload = {
        ...addForm,
        college_id: addForm.college_id ? parseInt(addForm.college_id) : null,
        designation_id: addForm.designation_id ? parseInt(addForm.designation_id) : null,
        department_id: addForm.department_id ? parseInt(addForm.department_id) : null,
        experience: addForm.experience ? parseInt(addForm.experience) : 0,
        status: addForm.status ? 'Active' : 'Inactive'
      };
      const resp = await fetch('http://localhost:8080/api/master-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Failed to add teacher');
      
      const result = await resp.json();
      
      // Add the new record to the table
      if (result.data) {
        setData(prevData => [result.data, ...prevData]);
      }
      
      // Show success message
      alert(result.message || 'Teacher record created successfully!');
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  const openEditModal = async (item) => {
    try {
      // Fetch dropdown options and full teacher record in parallel
      await fetchDropdownOptions();
      
      const resp = await fetch(`http://localhost:8080/api/master-teachers/${item.id}`, {
        headers: authUtils.getAuthHeader()
      });
      
      if (!resp.ok) throw new Error('Failed to fetch teacher details');
      const teacherData = await resp.json();
      
      // Populate form with fetched data
      setEditForm({ 
        id: teacherData.id,
        name: teacherData.name,
        email: teacherData.email,
        college_id: teacherData.college_id || '',
        designation_id: teacherData.designation_id || '',
        department_id: teacherData.department_id || '',
        experience: teacherData.experience_years || teacherData.experience || '',
        status: teacherData.status === 'Active' || teacherData.status === true
      });
      setEditErrors({});
      setEditError('');
      setShowEditModal(true);
    } catch (err) {
      console.error('Failed to open edit modal:', err);
      setEditError('Failed to load teacher details');
    }
  };
  const closeEditModal = () => setShowEditModal(false);

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(editForm);
    if (Object.keys(errs).length > 0) return setEditErrors(errs);

    setEditLoading(true);
    setEditError('');
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        college_id: editForm.college_id ? parseInt(editForm.college_id) : null,
        designation_id: editForm.designation_id ? parseInt(editForm.designation_id) : null,
        department_id: editForm.department_id ? parseInt(editForm.department_id) : null,
        experience: editForm.experience ? parseInt(editForm.experience) : 0,
        status: editForm.status ? 'Active' : 'Inactive'
      };
      const resp = await fetch(`http://localhost:8080/api/master-teachers/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) throw new Error('Failed to update teacher');
      
      const result = await resp.json();
      
      // Update the table data with the returned record
      if (result.data) {
        setData(prevData => 
          prevData.map(item => item.id === editForm.id ? result.data : item)
        );
      }
      
      // Show success message
      alert(result.message || 'Teacher record updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleArchive = async (item) => {
    if (!window.confirm('Are you sure you want to delete this faculty member? This action cannot be undone.')) return;
    
    try {
      const resp = await fetch(`http://localhost:8080/api/master-teachers/${item.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeader() }
      });
      
      if (!resp.ok) throw new Error('Failed to delete teacher');
      
      const result = await resp.json();
      
      // Remove the record from the table
      setData(prevData => prevData.filter(t => t.id !== item.id));
      
      // Show success message
      alert(result.message || 'Teacher record deleted successfully!');
    } catch (err) {
      alert('Error: ' + err.message);
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
                onClick={openAddModal}
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
                <SortHeader
                  label="Experience"
                  field="experience"
                  currentSort={sortConfig}
                  onSort={handleSort}
                  visible={visibleColumns.experience}
                />
                <th className={`${visibleColumns.status ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center`}>Status</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
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
                        <p className="text-[11px] text-slate-700">{item.email}</p>
                      </td>
                    )}
                    {visibleColumns.college_name && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.college_name || 'Global'}</p>
                      </td>
                    )}
                    {visibleColumns.department && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{safeDisplay(item.department)}</p>
                      </td>
                    )}
                    {visibleColumns.designation && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{safeDisplay(item.designation)}</p>
                      </td>
                    )}
                    {visibleColumns.experience && (
                      <td className="px-4 py-5">
                        <p className="text-[11px] text-slate-700">{item.experience ?? '-'}</p>
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
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
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

      {/* Profile Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={showAddModal ? closeAddModal : closeEditModal} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-2xl font-black tracking-tight leading-none mb-1">
                  {showEditModal ? 'Edit Faculty Member' : 'New Teacher Profile'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                  <User size={12} /> Personnel Management System
                </p>
              </div>
              <button 
                onClick={showAddModal ? closeAddModal : closeEditModal}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {(addError || editError) && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                  <ShieldAlert size={18} /> {addError || editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="name" 
                      value={showAddModal ? addForm.name : editForm.name} 
                      onChange={showAddModal ? handleAddChange : handleEditChange} 
                      placeholder="e.g. Dr. Jane Doe"
                      className={`w-full bg-slate-50 border-2 ${ (addErrors.name || editErrors.name) ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  { (addErrors.name || editErrors.name) && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.name || editErrors.name}</p> }
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      name="email" 
                      type="email"
                      value={showAddModal ? addForm.email : editForm.email} 
                      onChange={showAddModal ? handleAddChange : handleEditChange} 
                      placeholder="faculty@college.edu"
                      className={`w-full bg-slate-50 border-2 ${ (addErrors.email || editErrors.email) ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  { (addErrors.email || editErrors.email) && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.email || editErrors.email}</p> }
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Institute / College</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select 
                      name="college_id" 
                      value={showAddModal ? addForm.college_id : editForm.college_id} 
                      onChange={showAddModal ? handleAddChange : handleEditChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                    >
                      <option value="">Select college</option>
                      {collegeOptions.map(college => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Designation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      name="designation_id"
                      value={showAddModal ? addForm.designation_id : editForm.designation_id}
                      onChange={showAddModal ? handleAddChange : handleEditChange}
                      className={`w-full bg-slate-50 border-2 ${ (addErrors.designation_id || editErrors.designation_id) ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    >
                      <option value="">Select designation</option>
                      {designationOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  { (addErrors.designation_id || editErrors.designation_id) && <p className="text-[10px] font-bold text-red-500 ml-1">{addErrors.designation_id || editErrors.designation_id}</p> }
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <select
                      name="department_id"
                      value={showAddModal ? addForm.department_id : editForm.department_id}
                      onChange={showAddModal ? handleAddChange : handleEditChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Years Experience</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="experience"
                      type="number"
                      min="0"
                      value={showAddModal ? addForm.experience : editForm.experience}
                      onChange={showAddModal ? handleAddChange : handleEditChange}
                      placeholder="0"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Status</label>
                  <div className="h-[62px] flex items-center justify-between px-6 bg-slate-50 rounded-2xl border-2 border-slate-100 group hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${ (showAddModal ? addForm.status : editForm.status) ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500' }`}>
                        { (showAddModal ? addForm.status : editForm.status) ? <ShieldCheck size={18} /> : <ShieldAlert size={18} /> }
                      </div>
                      <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">
                        { (showAddModal ? addForm.status : editForm.status) ? 'Active Faculty' : 'On Leave / Retired' }
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        name="status" 
                        type="checkbox" 
                        checked={showAddModal ? addForm.status : editForm.status} 
                        onChange={showAddModal ? handleAddChange : handleEditChange} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5">
              <button 
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={showAddModal ? closeAddModal : closeEditModal}
                disabled={addLoading || editLoading}
              >
                Discard Changes
              </button>
              <button 
                onClick={showAddModal ? handleAddSubmit : handleEditSubmit}
                disabled={addLoading || editLoading}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 disabled:scale-100"
              >
                { (addLoading || editLoading) ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
                <span>{showAddModal ? 'Save Record' : 'Confirm Update'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
