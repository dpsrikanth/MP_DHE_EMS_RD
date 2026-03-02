import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';
import { 
  School, 
  Plus, 
  Pencil, 
  X, 
  Check 
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

const Universities = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', status: true });
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState(null);
  const [detailsList, setDetailsList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [programForm, setProgramForm] = useState({ name: '', duration_years: 1 });
  const [yearForm, setYearForm] = useState({ year_name: '' });

  const availableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'University Name' },
    { key: 'colleges', label: 'Linked Colleges' }
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
    searchFields: ['id', 'name'],
    initialSort: { field: 'id', direction: 'desc' },
    initialPageSize: 10,
    availableColumns
  });

  // Config State
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [policyOptions, setPolicyOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Fetch Masters
      const masterRes = await fetch('http://localhost:8080/api/masters', { headers });
      if (!masterRes.ok) throw new Error('Failed to fetch master data');
      const masterData = await masterRes.json();
      
      const pOptions = masterData.policies.map(p => ({ value: p.id, label: p.name }));
      const prgOptions = masterData.programs.map(p => ({ value: p.id, label: p.name }));
      const ayOptions = masterData.academicYears.map(ay => ({ value: ay.id, label: ay.year_name }));
      const semOptions = masterData.semesters.map(s => ({ value: s.id, label: s.semester_name }));
      
      setPolicyOptions(pOptions);
      setProgramOptions(prgOptions);
      setAcademicYearOptions(ayOptions);
      setSemesterOptions(semOptions);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const data = await response.json();
      setData(data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      setForm({ name: selected.name || selected.university_name || '', address: selected.address || '', status: selected.status === undefined ? true : selected.status });
      loadRelatedData(selected.id);
      loadConfigData(selected.id);
    } else {
      setForm({ name: '', address: '', status: true });
      setPrograms([]);
      setAcademicYears([]);
      
      setSelectedPolicies([]);
      setSelectedPrograms([]);
      setSelectedAcademicYears([]);
      setSelectedSemesters([]);
    }
  }, [selected]);

  const loadConfigData = async (universityId) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Fetch Current mapped Config
      const configRes = await fetch(`http://localhost:8080/api/universities/${universityId}/config`, { headers });
      if (!configRes.ok) throw new Error('Failed to fetch university config');
      const configData = await configRes.json();

      setSelectedPolicies(policyOptions.filter(opt => configData.policies.includes(opt.value)));
      setSelectedPrograms(programOptions.filter(opt => configData.programs.includes(opt.value)));
      setSelectedAcademicYears(academicYearOptions.filter(opt => configData.academicYears.includes(opt.value)));
      setSelectedSemesters(semesterOptions.filter(opt => configData.semesters.includes(opt.value)));
    } catch (err) {
      console.error(err);
      alert('Error loading configuration: ' + err.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadRelatedData = async (universityId) => {
    try {
      const token = localStorage.getItem('token');
      const [pRes, aRes] = await Promise.all([
        fetch('http://localhost:8080/api/programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const p = pRes.ok ? (await pRes.json()).filter(x => x.university_id === universityId) : [];
      const a = aRes.ok ? (await aRes.json()).filter(x => x.university_id === universityId) : [];
      setPrograms(p);
      setAcademicYears(a);
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  };

  // Removed handleAddCollege and handleDeleteCollege as they are now handled in Colleges.js

  const handleAddProgram = async () => {
    if (!programForm.name || !programForm.duration_years) return alert('Name and duration are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...programForm, university_id: selected.id })
      });
      if (!res.ok) throw new Error('Failed to add program');
      const newProgram = await res.json();
      setPrograms([...programs, newProgram]);
      setProgramForm({ name: '', duration_years: 1 });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Delete this program?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/programs/${programId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setPrograms(programs.filter(p => p.id !== programId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddYear = async () => {
    if (!yearForm.year_name) return alert('Year name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...yearForm, university_id: selected.id })
      });
      if (!res.ok) throw new Error('Failed to add year');
      const newYear = await res.json();
      setAcademicYears([...academicYears, newYear]);
      setYearForm({ year_name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteYear = async (yearId) => {
    if (!window.confirm('Delete this academic year?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/academic-years/${yearId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAcademicYears(academicYears.filter(y => y.id !== yearId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const submitConfigPayload = async (univId) => {
    const token = localStorage.getItem('token');
    const payload = {
      policies: selectedPolicies.map(p => p.value),
      programs: selectedPrograms.map(p => p.value),
      academicYears: selectedAcademicYears.map(a => a.value),
      semesters: selectedSemesters.map(s => s.value)
    };
    const res = await fetch(`http://localhost:8080/api/universities/${univId}/config`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update config');
  };

  const handleSaveConfig = async () => {
    if (!selected) return;
    try {
      setSavingConfig(true);
      await submitConfigPayload(selected.id);
      alert('Configuration updated successfully!');
    } catch (err) {
      alert('Error updating configuration: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.name) return alert('Name is required');
      let finalUniversityId = null;

      if (selected) {
        const res = await fetch(`http://localhost:8080/api/universities/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Update failed'); }
        finalUniversityId = selected.id;
      } else {
        const res = await fetch('http://localhost:8080/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Create failed'); }
        const createdUniv = await res.json();
        finalUniversityId = createdUniv.id;
        
        // Colleges are now handled separately on the Colleges page
        await submitConfigPayload(finalUniversityId);
      }
      setShowModal(false);
      setSelected(null);
      await fetchData();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this university?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/universities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Delete failed'); }
      await fetchData();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const showDetails = async (university, type) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      if (type === 'colleges') url = 'http://localhost:8080/api/colleges';
      else if (type === 'programs') url = 'http://localhost:8080/api/programs';
      else if (type === 'academic_years') url = 'http://localhost:8080/api/academic-years';
      
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error: ${text}`);
      }
      const allData = await res.json();
      console.log(`Fetched ${type}:`, allData);
      console.log(`Filtering for university_id: ${university.id}`);
      
      const filtered = allData.filter(item => {
        const match = item.university_id === university.id;
        console.log(`Item:`, item, `Match: ${match}`);
        return match;
      });
      
      console.log(`Filtered results:`, filtered);
      setDetailsList(filtered);
      setDetailsType(type);
      setDetailsModal(true);
    } catch (err) {
      console.error('Error in showDetails:', err);
      alert('Error: ' + (err.message || err));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Page Header Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600">
              <School size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 leading-none">Universities</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Manage and configure institution profiles</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <TableSearch 
              value={searchQuery} 
              onChange={setSearchQuery} 
              placeholder="Search universities by name or ID..."
            />
            <ColumnVisibilitySelector 
              columns={availableColumns} 
              visibleColumns={visibleColumns} 
              onToggle={toggleColumn} 
            />
            <button 
              onClick={() => { setSelected(null); setShowModal(true); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <Plus size={20} />
              <span>Add University</span>
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
                  label="University Name" 
                  field="name" 
                  currentSort={sortConfig} 
                  onSort={handleSort} 
                  visible={visibleColumns.name}
                />
                <th className={`${visibleColumns.colleges ? '' : 'hidden'} px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400`}>Linked Colleges</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Settings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    {visibleColumns.id && <td className="px-8 py-5 text-sm font-bold text-slate-400">#{item.id}</td>}
                    {visibleColumns.name && (
                      <td className="px-4 py-5 text-sm font-semibold text-slate-900 leading-tight">
                        {item.name}
                      </td>
                    )}
                    {visibleColumns.colleges && (
                      <td className="px-4 py-5">
                        {item.colleges_count > 0 ? (
                          <button 
                            onClick={() => showDetails(item, 'colleges')}
                            className="inline-flex items-center px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-bold hover:bg-sky-100 transition-colors"
                          >
                            {item.colleges_count} Colleges
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">No colleges</span>
                        )}
                      </td>
                    )}
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => { setSelected(item); setShowModal(true); }}
                          className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all"
                          title="Edit University"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete University"
                        >
                          <MdDelete size={20} />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => navigate('/colleges', { state: { universityId: item.id, addMode: true } })}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white rounded-xl text-xs font-bold transition-all"
                          title="Manage Colleges"
                        >
                          <Plus size={14} />
                          <span>Colleges</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No universities match your search</p>
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 underline uppercase tracking-tighter"
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

      {/* Main Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  {selected ? 'Edit University' : 'Register New University'}
                </h2>
                <p className="text-sm text-slate-500 font-medium">Please fill in the details below</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-3 bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-2xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
              {/* Row 1: Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Primary Information</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">University Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Barkatullah University" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Address</label>
                    <textarea 
                      placeholder="Physical address of the main campus" 
                      rows={3}
                      value={form.address} 
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Activation Status</p>
                      <p className="text-[11px] text-slate-500 font-medium">Enable or disable this university record</p>
                    </div>
                    <button 
                      onClick={() => setForm({ ...form, status: !form.status })}
                      className={`relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner ${form.status ? 'bg-sky-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${form.status ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="space-y-6 bg-slate-50/50 rounded-3xl p-8 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Master Mappings</h3>
                  
                  {configLoading && selected ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-slate-400">Loading Configuration...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 ml-1 uppercase">Mapped Policies</label>
                        <Select 
                          isMulti 
                          hideSelectedOptions={false}
                          closeMenuOnSelect={false}
                          components={{ Option: CheckboxOption }}
                          options={policyOptions} 
                          value={selectedPolicies} 
                          onChange={setSelectedPolicies} 
                          className="text-sm font-medium"
                          styles={{
                            control: (base) => ({
                              ...base,
                              borderRadius: '1rem',
                              padding: '0.25rem',
                              border: '2px solid #f1f5f9',
                              backgroundColor: 'white',
                              boxShadow: 'none',
                              '&:hover': { border: '2px solid #0ea5e9' }
                            })
                          }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 ml-1 uppercase">Available Programs</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={programOptions} value={selectedPrograms} onChange={setSelectedPrograms} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 ml-1 uppercase">Academic Years</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={academicYearOptions} value={selectedAcademicYears} onChange={setSelectedAcademicYears} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-500 ml-1 uppercase">Semesters Mapping</label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={semesterOptions} value={selectedSemesters} onChange={setSelectedSemesters} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9' }) }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 sticky bottom-0 z-10">
              <button 
                className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={() => setShowModal(false)}
              >
                Discard Changes
              </button>
              <button 
                onClick={() => { handleSave(); if(selected) handleSaveConfig(); }}
                disabled={savingConfig}
                className="inline-flex items-center gap-2 px-10 py-3.5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
              >
                {savingConfig ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    <span>{selected ? 'Update Profile' : 'Register Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {detailsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-md animate-in fade-in" onClick={() => setDetailsModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {detailsType === 'colleges' ? 'Colleges List' : detailsType === 'programs' ? 'Programs Overview' : 'Academic Calendar'}
              </h3>
              <button onClick={() => setDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-2 divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
              {detailsList.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No entries found</p>
                </div>
              ) : (
                detailsList.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                    <span className="text-sm font-semibold text-slate-700">
                      {item.college_name || item.name || item.year_name || 'Anonymous Entry'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universities;
