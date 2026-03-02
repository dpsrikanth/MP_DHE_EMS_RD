import React, { useState, useEffect } from "react";
import { 
  Book, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Code,
  Hash
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const Subjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', subject_code: '' });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'subject_code', label: 'Code' },
    { key: 'name', label: 'Subject Name' },
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
    searchFields: ['id', 'name', 'subject_code'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-subjects', {
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

  const handleAdd = async () => {
    if (!form.name || !form.subject_code) return alert('Both fields are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Save failed');
      setShowAddModal(false);
      setForm({ name: '', subject_code: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!form.name || !form.subject_code) return alert('Both fields are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Update failed');
      setShowEditModal(false);
      setSelected(null);
      setForm({ name: '', subject_code: '' });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const loadForEdit = (id) => {
    const item = data.find(x => x.id === id);
    if (item) {
      setSelected(item);
      setForm({ name: item.name, subject_code: item.subject_code });
      setShowEditModal(true);
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
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
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
              <Book size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Subjects</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium tracking-tight">Catalog of courses and core subject mappings</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by subject name or code..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => { setSelected(null); setForm({ subject_code: '', name: '' }); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add Subject</span>
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
                  label="Code" 
                  field="subject_code" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.subject_code}
                />
                <SortHeader 
                  label="Subject Name" 
                  field="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.name}
                />
                <th className={`${visibleColumns.created_at ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Created On</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.subject_code && (
                      <td className="px-4 py-5">
                        <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-100 uppercase">
                          {item.subject_code}
                        </span>
                      </td>
                    )}
                    {visibleColumns.name && (
                      <td className="px-4 py-5 text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </td>
                    )}
                    {visibleColumns.created_at && (
                      <td className="px-4 py-5 text-xs font-medium text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => loadForEdit(item.id)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"
                          title="Edit Subject"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Subject"
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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No subjects found matching your search</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-amber-500 hover:text-amber-600 underline uppercase tracking-tighter"
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

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }} />
          
          <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white text-slate-900">
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  {showEditModal ? 'Update Subject' : 'New Subject'}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">Catalog Entry</p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }}
                className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Code size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. CS101" 
                    value={form.subject_code} 
                    onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 outline-none transition-all font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Book size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. Operating Systems" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-500 outline-none transition-all font-semibold"
                  />
                </div>
              </div>

              {showEditModal && selected && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                    <Hash size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal ID</p>
                    <p className="text-sm font-bold text-slate-900">SUB-{selected.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setSelected(null); }}
              >
                Discard
              </button>
              <button 
                onClick={showEditModal ? handleUpdate : handleAdd}
                className="px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm flex items-center gap-2"
              >
                <Check size={18} />
                <span>{showEditModal ? 'Update Record' : 'Save Subject'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md animate-in fade-in" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-3xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <MdDelete size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Remove Subject?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Delete <span className="font-bold text-slate-900 font-mono italic">"{deleteTarget?.name || deleteTarget?.subject_code}"</span>? 
                This will remove all associated data mappings.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all"
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
