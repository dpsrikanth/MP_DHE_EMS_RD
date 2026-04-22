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
  const [error, setError] = useState(null);
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
    description: ''
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/milestones', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setData(result || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setFormData({ id: null, name: '', start_date: '', end_date: '', responsibility: '', type: 'General', description: '' });
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
      description: item.description || ''
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
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase text-xs tracking-widest"
          >
            <Plus size={20} />
            <span>Add Milestone</span>
          </button>
        )}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Search milestones, roles..." />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 mb-1 uppercase tracking-tight">{item.name}</span>
                      <span className={`text-[9px] font-black w-fit px-2 py-0.5 rounded-full border 
                        ${item.type === 'Internal' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                          item.type === 'External' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-200'} uppercase`}>
                        {item.type}
                      </span>
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
