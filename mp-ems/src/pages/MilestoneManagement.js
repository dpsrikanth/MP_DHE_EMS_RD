import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import { 
  Flag, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Calendar,
  Layers,
  User,
  Info
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { formatDate } from '../utils/dateUtils';
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader } from '../components/TableControls';

const MilestoneManagement = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isValidationEnabled, setIsValidationEnabled] = useState(true);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const roleName = localStorage.getItem('roleName');
  const canEdit = roleName === 'university_admin';
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    start_date: '',
    end_date: '',
    responsibility: '',
    type: 'General',
    description: '',
    semester_id: '',
    program_id: '',
    academic_year_id: ''
  });

  const [filters, setFilters] = useState({
    academic_year_id: '',
    program_id: '',
    semester_id: ''
  });

  const [metadata, setMetadata] = useState({
    academicYears: [],
    programs: [],
    semesters: []
  });

  const availableColumns = [
    { key: 'name', label: 'Milestone Name' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'responsibility', label: 'Responsibility' },
    { key: 'type', label: 'Type' }
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
    totalItems
  } = useDataTable(data, { 
    searchFields: ['name', 'responsibility', 'type'],
    initialSort: { field: 'start_date', direction: 'asc' },
    initialPageSize: 10
  });

  useEffect(() => {
    fetchMetadata();
    fetchData();
    fetchValidationSetting();
  }, [filters]);

  const fetchValidationSetting = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/settings/roadmap_validation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsValidationEnabled(data.enabled);
      }
    } catch (err) {
      console.error("Failed to fetch validation setting", err);
    }
  };

  const toggleValidation = async () => {
    try {
      setUpdatingSettings(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/settings/roadmap_validation', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ value: { enabled: !isValidationEnabled } })
      });
      
      if (response.ok) {
        setIsValidationEnabled(!isValidationEnabled);
        toast.success(`Roadmap validation ${!isValidationEnabled ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error('Failed to update setting');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const API_URL = 'http://localhost:8080/api';

      const [yearsRes, programsRes, semestersRes] = await Promise.all([
        fetch(`${API_URL}/academic-years`, { headers }),
        fetch(`${API_URL}/programs`, { headers }),
        fetch(`${API_URL}/semesters`, { headers })
      ]);

      setMetadata({
        academicYears: await yearsRes.json(),
        programs: await programsRes.json(),
        semesters: await semestersRes.json()
      });
    } catch (err) {
      console.error("Metadata fetch error:", err);
    }
  };

  const fetchData = async () => {
    try {
      if (!loading) setRefreshing(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filters.academic_year_id) queryParams.append('academic_year_id', filters.academic_year_id);
      if (filters.program_id) queryParams.append('program_id', filters.program_id);
      if (filters.semester_id) queryParams.append('semester_id', filters.semester_id);
      
      const response = await fetch(`http://localhost:8080/api/milestones?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resolveMetadataName = (type, id) => {
    if (!id) return null;
    const items = metadata[type] || [];
    const item = items.find(i => String(i.id) === String(id));
    if (!item) return null;
    
    if (type === 'academicYears') return item.year_name || `${item.start_year}-${item.end_year}`;
    if (type === 'programs') return item.name;
    if (type === 'semesters') return item.semester_name;
    return null;
  };

  const handleAddClick = () => {
    setFormData({ 
      id: null, 
      name: '', 
      start_date: '', 
      end_date: '', 
      responsibility: '', 
      type: 'General', 
      description: '',
      semester_id: filters.semester_id || '',
      program_id: filters.program_id || '',
      academic_year_id: filters.academic_year_id || ''
    });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      start_date: item.start_date.split('T')[0],
      end_date: item.end_date.split('T')[0],
      responsibility: item.responsibility,
      type: item.type,
      description: item.description || '',
      semester_id: item.semester_id || '',
      program_id: item.program_id || '',
      academic_year_id: item.academic_year_id || ''
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `http://localhost:8080/api/milestones/${formData.id}` 
        : 'http://localhost:8080/api/milestones';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Action failed');
      
      toast.success(`Milestone ${formData.id ? 'updated' : 'created'} successfully`);
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/milestones/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      toast.success('Milestone removed');
      setShowDeleteModal(false);
      fetchData();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleCloneSubmit = async (e) => {
    // Hidden per request
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <Flag size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Institutional<span className="text-indigo-500 not-italic ml-2">Milestones</span></h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight uppercase tracking-widest">Global Academic roadmap & administrative deadlines</p>
          </div>
        </div>
        {canEdit && (
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end gap-1.5 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule Validation</span>
              <button 
                onClick={toggleValidation}
                disabled={updatingSettings}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isValidationEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isValidationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button 
              onClick={handleAddClick}
              className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-xs tracking-widest"
            >
              <Plus size={20} />
              <span>Add Milestone</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end mb-8">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Year</label>
          <select name="academic_year_id" value={filters.academic_year_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
            <option value="">All Years</option>
            {metadata.academicYears.map(y => (
              <option key={y.id} value={y.id}>{y.year_name || `${y.start_year}-${y.end_year}`}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Program</label>
          <select name="program_id" value={filters.program_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
            <option value="">All Programs</option>
            {metadata.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Semester</label>
          <select name="semester_id" value={filters.semester_id} onChange={handleFilterChange} className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-700">
            <option value="">All Semesters</option>
            {metadata.semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search milestones, roles..." />
        </div>

        <div className="overflow-x-auto relative">
          {refreshing && (
            <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all duration-300">
               <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg"></div>
            </div>
          )}
          <table className={`w-full text-left border-collapse transition-opacity duration-300 ${refreshing ? 'opacity-40 select-none' : 'opacity-100'}`}>
            <thead>
              <tr className="bg-slate-50/50">
                <SortHeader label="Activity" field="name" currentSort={sortConfig} onSort={handleSort} className="px-8 py-5" visible={true} />
                <SortHeader label="Timeline" field="start_date" currentSort={sortConfig} onSort={handleSort} className="px-4 py-5" visible={true} />
                <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Responsibility</th>
                {canEdit && <th className="px-4 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group text-[11px] font-bold">
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</span>
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className={`text-[9px] font-black w-fit px-2 py-0.5 rounded-md border 
                          ${item.type === 'Internal' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                            item.type === 'External' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'} uppercase`}>
                          {item.type}
                        </span>
                        
                        {/* Scope Badges */}
                        {resolveMetadataName('academicYears', item.academic_year_id) && (
                          <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-md uppercase">
                            {resolveMetadataName('academicYears', item.academic_year_id)}
                          </span>
                        )}
                        {resolveMetadataName('programs', item.program_id) && (
                          <span className="text-[9px] font-black bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-md uppercase">
                            {resolveMetadataName('programs', item.program_id)}
                          </span>
                        )}
                        {resolveMetadataName('semesters', item.semester_id) && (
                          <span className="text-[9px] font-black bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-md uppercase">
                            {resolveMetadataName('semesters', item.semester_id)}
                          </span>
                        )}
                        {!item.academic_year_id && !item.program_id && !item.semester_id && (
                          <span className="text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md uppercase italic">
                            Global
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 font-mono text-xs font-bold text-slate-500 italic lowercase tracking-tighter">
                     {formatDate(item.start_date)} - {formatDate(item.end_date)}
                  </td>
                  <td className="px-4 py-5">
                    <div className="flex items-center gap-2">
                       <User size={14} className="text-indigo-400" />
                       <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{item.responsibility}</span>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Pencil size={18} /></button>
                        <button onClick={() => handleDeleteClick(item)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><MdDelete size={20} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={totalItems} pageSize={pageSize} onPageSizeChange={setPageSize} />
      </div>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <form onSubmit={handleSubmit} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">{formData.id ? 'Edit' : 'New'} Milestone</h2>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2">Institutional Roadmap Data</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-3 bg-white text-slate-400 hover:bg-slate-100 rounded-2xl transition-all shadow-sm border border-slate-100"><X size={20} /></button>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Activity Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                  <input required type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                  <input required type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Responsibility</label>
                  <input required type="text" name="responsibility" placeholder="e.g. Faculty, HOD" value={formData.responsibility} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Type</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all">
                    <option value="General">General</option>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-50 pt-6">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none">Milestone Scope (Leave blank for global)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Year</label>
                    <select name="academic_year_id" value={formData.academic_year_id} onChange={handleInputChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all">
                      <option value="">Global</option>
                      {metadata.academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name || `${y.start_year}-${y.end_year}`}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                    <select name="program_id" value={formData.program_id} onChange={handleInputChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all">
                      <option value="">Global</option>
                      {metadata.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                    <select name="semester_id" value={formData.semester_id} onChange={handleInputChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all">
                      <option value="">Global</option>
                      {metadata.semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="text-sm font-bold text-slate-400 hover:text-slate-600 px-4">Cancel</button>
              <button type="submit" className="px-10 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 transition-all uppercase text-xs tracking-widest flex items-center gap-2">
                <Check size={20} />
                <span>{formData.id ? 'Save Changes' : 'Create Milestone'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clone Semester Modal removed per request */}
      
      {/* Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-10 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 border border-red-100 shadow-sm"><MdDelete size={40} /></div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Delete Milestone?</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-10 italic">This activity will be removed from the institutional roadmap permanently.</p>
              <div className="flex gap-4 w-full">
                <button className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl transition-all uppercase text-[10px] tracking-widest" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-500/20 transition-all uppercase text-[10px] tracking-widest" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilestoneManagement;
