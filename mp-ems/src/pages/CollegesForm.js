import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { GraduationCap, ArrowLeft, Check, Search, ChevronDown } from "lucide-react";

const CheckboxOption = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={props.isSelected}
            onChange={() => null}
            className="w-4 h-4 text-indigo-500 border-slate-300 rounded focus:ring-indigo-500 pointer-events-none"
          />
          <span className="text-sm font-medium">{props.label}</span>
        </div>
      </components.Option>
    </div>
  );
};

const CollegesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [dataLoading, setDataLoading] = useState(false);
  
  const [universities, setUniversities] = useState([]);
  const [form, setForm] = useState({ name: '', college_code: '', address: '', university_id: '' });

  // Config Mapping State
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [isConfigLoading, setIsConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    fetchUniversities();
    fetchMasters();
    if (isEditing) {
      loadCollege(id);
    } else if (location.state && location.state.universityId) {
      setForm(prev => ({ ...prev, university_id: location.state.universityId }));
    }
  }, [id]);

  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMasterData(await res.json());
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUniversities((data || []).filter(u => u.status === true || u.status === 1 || u.status === '1' || u.status === 'true'));
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const loadCollege = async (collegeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/colleges', { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to fetch colleges');
      const data = await response.json();
      const college = data.find(c => c.id.toString() === collegeId);
      
      if (college) {
        setForm({
          name: college.college_name || college.name || '',
          college_code: college.college_code || '',
          address: college.address || '',
          university_id: college.university_id || ''
        });
        fetchCollegeConfig(collegeId);
      } else {
        toast.error('College not found');
        navigate('/colleges');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
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
      const res = await fetch(`http://localhost:8080/api/universities/${uId}/config`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUniversityConfig(await res.json());
    } catch (err) {
      console.error('Error fetching university config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/colleges/${cId}/config`, { headers: { Authorization: `Bearer ${token}` } });
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

  const handleSave = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('token');
      if (!form.name || !form.university_id) {
        setSavingConfig(false);
        return toast.warning('College name and university are required');
      }

      const url = isEditing ? `http://localhost:8080/api/colleges/${id}` : 'http://localhost:8080/api/colleges';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to save');
      const savedCollege = await response.json();
      const collegeId = isEditing ? id : savedCollege.id;

      await fetch(`http://localhost:8080/api/colleges/${collegeId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedConfig)
      });
      
      toast.success(savedCollege.message || (isEditing ? 'College updated successfully!' : 'College added successfully!'));
      navigate('/colleges');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Identity Configuration...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/colleges')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEditing ? 'Edit College' : 'Register New College'}
              </h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Departmental settings and affiliation details</p>
            </div>
          </div>
        </div>
            
        {/* Body */}
        <div className="flex-1 px-10 py-10 space-y-10 bg-slate-50/30">
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
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">College Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Science College" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Affiliated University</label>
                <div className="relative">
                  <select 
                    value={form.university_id} 
                    onChange={(e) => setForm({ ...form, university_id: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 focus:bg-white focus:border-indigo-500 outline-none appearance-none transition-all font-semibold"
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
                  rows={3}
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                />
              </div>
            </div>

            <div className="space-y-6 bg-white rounded-[2.5rem] p-8 border-2 border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-slate-200"></span> Capability Mapping
              </h3>
              
              {!form.university_id ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
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

        {/* Footer */}
        <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
          <button className="text-sm font-bold text-slate-500 hover:text-slate-800" onClick={() => navigate('/colleges')}>Discard changes</button>
          <button 
            onClick={handleSave}
            disabled={savingConfig}
            className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
          >
            {savingConfig ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={20} />
                <span>{isEditing ? 'Update Record' : 'Create College'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollegesForm;
