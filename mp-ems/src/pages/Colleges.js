import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Select, { components } from 'react-select';
import { 
  GraduationCap, 
  Plus, 
  Pencil, 
  X, 
  Check,
  Search,
  ChevronDown
} from "lucide-react";
import { MdDelete } from "react-icons/md";
import { useDataTable } from '../hooks/useDataTable';
import { TableSearch, TablePagination, SortHeader, ColumnVisibilitySelector } from '../components/TableControls';

const CheckboxOption = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.isSelected}
            onChange={() => null}
            className="w-4 h-4 text-sky-500 border-slate-300 rounded focus:ring-sky-500 pointer-events-none"
          />
          <span className="text-sm font-medium">{props.label}</span>
        </div>
      </components.Option>
    </div>
  );
};

const Colleges = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', college_code: '', address: '', university_id: '' });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'college_code', label: 'Code' },
    { key: 'college_name', label: 'College Name' },
    { key: 'university_name', label: 'University' }
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
    searchFields: ['id', 'college_code', 'college_name', 'university_name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // Config Mapping State
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({
    policies: [],
    programs: [],
    academicYears: [],
    semesters: []
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUniversities();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMasterData(data);
      }
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchUniversityConfig = async (uId) => {
    if (!uId) {
      setUniversityConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      return;
    }
    try {
      setIsConfigLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/universities/${uId}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUniversityConfig(data);
      }
    } catch (err) {
      console.error('Error fetching university config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/colleges/${cId}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConfig({
          policies: data.policies || [],
          programs: data.programs || [],
          academicYears: data.academicYears || [],
          semesters: data.semesters || []
        });
      }
    } catch (err) {
      console.error('Error fetching college config:', err);
    }
  };

  useEffect(() => {
    if (form.university_id) {
      fetchUniversityConfig(form.university_id);
    }
  }, [form.university_id]);

  useEffect(() => {
    if (selected) {
      fetchCollegeConfig(selected.id);
    } else {
      setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
    }
  }, [selected]);

  useEffect(() => {
    if (location.state && location.state.addMode && location.state.universityId) {
      setSelected(null);
      setForm({ name: '', college_code: '', address: '', university_id: location.state.universityId });
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUniversities(data || []);
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.name || !form.university_id) {
        return alert('College name and university are required');
      }

      const url = selected 
        ? `http://localhost:8080/api/colleges/${selected.id}` 
        : 'http://localhost:8080/api/colleges';
      const method = selected ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to save');
      const savedCollege = await response.json();
      const collegeId = selected ? selected.id : savedCollege.id;

      await fetch(`http://localhost:8080/api/colleges/${collegeId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedConfig)
      });
      
      setShowModal(false);
      setSelected(null);
      setForm({ name: '', college_code: '', address: '', university_id: '' });
      setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/colleges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openEditModal = (item) => {
    setSelected(item);
    setForm({
      name: item.college_name || item.name || '',
      college_code: item.college_code || '',
      address: item.address || '',
      university_id: item.university_id
    });
    setShowModal(true);
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
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Colleges</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Manage and configure college department mappings</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search by name, code or university..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => { 
                setSelected(null); 
                setForm({ name: '', college_code: '', address: '', university_id: '' }); 
                setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
                setShowModal(true); 
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add College</span>
            </button>
          </div>
        </div>

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
                  field="college_code" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.college_code}
                />
                <SortHeader 
                  label="College Name" 
                  field="college_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.college_name}
                />
                <SortHeader 
                  label="University" 
                  field="university_name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.university_name}
                />
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.college_code && (
                      <td className="px-4 py-5 text-sm font-bold text-indigo-600">
                        {item.college_code ? (
                          <span className="bg-indigo-50 px-2 py-1 rounded-md">{item.college_code}</span>
                        ) : (
                          <span className="text-slate-300 font-normal italic">N/A</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.college_name && (
                      <td className="px-4 py-5 text-sm font-semibold text-slate-900 leading-tight">
                        {item.college_name || item.name}
                      </td>
                    )}
                    {visibleColumns.university_name && (
                      <td className="px-4 py-5">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-slate-200">
                          {item.university_name || universities.find(u => u.id === item.university_id)?.name || 'Standalone'}
                        </span>
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="Edit College"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete College"
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
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No colleges match your search</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-indigo-500 hover:text-indigo-600 underline uppercase tracking-tighter"
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

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selected ? 'Edit College' : 'Register New College'}
                </h2>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Departmental settings and affiliation details</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200"></span> Identity
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1 space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">Code</label>
                      <input 
                        type="number" 
                        placeholder="000" 
                        value={form.college_code} 
                        onChange={(e) => setForm({ ...form, college_code: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">College Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Science College" 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Affiliated University</label>
                    <div className="relative">
                      <select 
                        value={form.university_id} 
                        onChange={(e) => setForm({ ...form, university_id: e.target.value })}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 focus:bg-white focus:border-indigo-500 outline-none appearance-none transition-all font-semibold"
                      >
                        <option value="">Choose Parent Institution</option>
                        {universities.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Address</label>
                    <textarea 
                      placeholder="Street, City, Pin Code" 
                      rows={2}
                      value={form.address} 
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6 bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-4 h-px bg-slate-200"></span> Capability Mapping
                  </h3>
                  
                  {!form.university_id ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-400">
                        <Search size={24} />
                      </div>
                      <p className="text-sm font-bold text-slate-400 max-w-[200px]">Select a university to see available configurations</p>
                    </div>
                  ) : isConfigLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Bridging Models...</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Policies</label>
                        <Select 
                          isMulti 
                          hideSelectedOptions={false}
                          closeMenuOnSelect={false}
                          components={{ Option: CheckboxOption }}
                          options={masterData.policies.filter(p => universityConfig.policies.includes(p.id)).map(p => ({ value: p.id, label: p.name }))} 
                          value={selectedConfig.policies.map(id => ({ value: id, label: masterData.policies.find(p => p.id === id)?.name || id }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, policies: vals.map(v => v.value) })}
                          styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', padding: '0.2rem', border: '2px solid #f1f5f9', boxShadow: 'none' }) }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Programs List</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.programs.filter(p => universityConfig.programs.includes(p.id)).map(p => ({ value: p.id, label: p.name }))} value={selectedConfig.programs.map(id => ({ value: id, label: masterData.programs.find(p => p.id === id)?.name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, programs: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Years</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.academicYears.filter(ay => universityConfig.academicYears.includes(ay.id)).map(ay => ({ value: ay.id, label: ay.year_name }))} value={selectedConfig.academicYears.map(id => ({ value: id, label: masterData.academicYears.find(ay => ay.id === id)?.year_name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, academicYears: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semesters Mapping</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={masterData.semesters.filter(s => universityConfig.semesters.includes(s.id)).map(s => ({ value: s.id, label: s.semester_name }))} value={selectedConfig.semesters.map(id => ({ value: id, label: masterData.semesters.find(s => s.id === id)?.semester_name || id }))} onChange={(vals) => setSelectedConfig({ ...selectedConfig, semesters: vals.map(v => v.value) })} styles={{ control: (base) => ({ ...base, borderRadius: '1.25rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
              <button className="text-sm font-bold text-slate-500 hover:text-slate-800" onClick={() => setShowModal(false)}>Discard changes</button>
              <button 
                onClick={handleSave}
                className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-2"
              >
                <Check size={20} />
                <span>{selected ? 'Update Record' : 'Create College'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Colleges;
