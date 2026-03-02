import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Hash,
  History
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const AcademicYears = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    year_name: ''
  });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'year_name', label: 'Session Name' },
    { key: 'timeline', label: 'Timeline' }
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
    searchFields: ['id', 'year_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/academic-years', {
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

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ year_name: '' });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setFormData({ year_name: item.year_name, id: item.id });
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/academic-years/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.year_name.trim()) return alert('Year name is required');
    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:8080/api/academic-years/${formData.id}`
        : 'http://localhost:8080/api/academic-years';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ year_name: formData.year_name })
      });

      if (!response.ok) throw new Error('Submit failed');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ year_name: '' });
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
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Academic Years</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Setup and manage chronological session cycles</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by session name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={handleAddClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Session</span>
            </button>
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
                  label="Session Name" 
                  field="year_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.year_name}
                />
                <th className={`${visibleColumns.timeline ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Timeline</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.year_name && (
                      <td className="px-4 py-5 font-bold text-slate-900">
                        <span className="bg-sky-50 text-sky-700 px-3 py-1 rounded-lg border border-sky-100 font-mono italic">
                          {item.year_name}
                        </span>
                      </td>
                    )}
                    {visibleColumns.timeline && (
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Initialization</p>
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <History size={12} /> {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-all"
                          title="Edit Session"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Session"
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No academic years found</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 underline uppercase tracking-tighter"
                      >
                        Reset Search
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

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={handleCloseModal} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {isEditing ? 'Update Session' : 'New Academic Cycle'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Chronology Settings</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="year_name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Year Reference</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Calendar size={18} />
                    </div>
                    <input 
                      type="text" 
                      id="year_name"
                      name="year_name"
                      placeholder="e.g. 2024-2025" 
                      value={formData.year_name} 
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-bold tracking-tight"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 italic ml-1">* Format: YYYY-YYYY (e.g., 2023-2024)</p>
                </div>

                {isEditing && formData.id && (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                      <Hash size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Session ID</p>
                      <p className="text-sm font-bold text-slate-900 leading-none">CYCLE-{formData.id.toString().padStart(3, '0')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800"
                  onClick={handleCloseModal}
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-8 py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm flex items-center gap-2"
                >
                  <Check size={18} />
                  <span>{isEditing ? 'Update Session' : 'Initialize Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicYears;
