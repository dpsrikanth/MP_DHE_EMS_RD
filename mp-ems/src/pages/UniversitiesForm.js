import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { School, ArrowLeft, Check } from "lucide-react";

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

const UniversitiesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({ name: '', address: '', status: true });
  const [dataLoading, setDataLoading] = useState(isEditing);

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
    fetchMasterData();
    if (isEditing) {
      loadUniversity(id);
    }
  }, [id]);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

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

      if (isEditing) {
        loadConfigData(id, pOptions, prgOptions, ayOptions, semOptions);
      }
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

  const loadUniversity = async (univId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch universities');
      const data = await response.json();
      const university = data.find(u => u.id.toString() === univId);
      
      if (university) {
        setForm({ 
          name: university.name || university.university_name || '', 
          address: university.address || '', 
          status: university.status === undefined ? true : university.status 
        });
      } else {
        toast.error('University not found');
        navigate('/universities');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  const loadConfigData = async (universityId, pOpts, prgOpts, ayOpts, semOpts) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      const configRes = await fetch(`http://localhost:8080/api/universities/${universityId}/config`, { headers });
      if (!configRes.ok) throw new Error('Failed to fetch university config');
      const configData = await configRes.json();

      setSelectedPolicies((pOpts || policyOptions).filter(opt => configData.policies.includes(opt.value)));
      setSelectedPrograms((prgOpts || programOptions).filter(opt => configData.programs.includes(opt.value)));
      setSelectedAcademicYears((ayOpts || academicYearOptions).filter(opt => configData.academicYears.includes(opt.value)));
      setSelectedSemesters((semOpts || semesterOptions).filter(opt => configData.semesters.includes(opt.value)));
    } catch (err) {
      console.error(err);
      toast.error('Error loading configuration: ' + err.message);
    } finally {
      setConfigLoading(false);
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

  const handleSave = async () => {
    try {
      setSavingConfig(true);
      const token = localStorage.getItem('token');
      if (!form.name) {
        setSavingConfig(false);
        return toast.warning('Name is required');
      }

      let finalUniversityId = null;
      let toastMessage = '';

      if (isEditing) {
        const res = await fetch(`http://localhost:8080/api/universities/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Update failed'); }
        const updatedUniv = await res.json();
        toastMessage = updatedUniv.message || 'University updated successfully!';
        finalUniversityId = id;
      } else {
        const res = await fetch('http://localhost:8080/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Create failed'); }
        const createdUniv = await res.json();
        finalUniversityId = createdUniv.data ? createdUniv.data.id : createdUniv.id;
        toastMessage = createdUniv.message || 'University added successfully!';
      }
      
      await submitConfigPayload(finalUniversityId);
      
      toast.success(toastMessage);
      navigate('/universities');
    } catch (err) {
      toast.error('Error: ' + (err.message || err));
    } finally {
      setSavingConfig(false);
    }
  };

  if (dataLoading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading University Profile...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/universities')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-sky-500/10 rounded-[1.5rem] flex items-center justify-center text-sky-600 shadow-inner">
              <School size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isEditing ? 'Edit University' : 'Register New University'}
              </h2>
              <p className="text-sm text-slate-500 font-medium">Please fill in the details below</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="flex-1 px-10 py-10 space-y-10 bg-slate-50/30">
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
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Full Address</label>
                <textarea 
                  placeholder="Physical address of the main campus" 
                  rows={3}
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border-2 border-slate-100">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Activation Status</p>
                  <p className="text-[11px] text-slate-500 font-medium">Enable or disable this university record</p>
                </div>
                <button type="button"
                  onClick={() => setForm({ ...form, status: !form.status })}
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 shadow-inner ${form.status ? 'bg-sky-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${form.status ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            {/* Configuration Section */}
            <div className="space-y-6 bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Master Mappings</h3>
              
              {configLoading ? (
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
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={programOptions} value={selectedPrograms} onChange={setSelectedPrograms} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9', boxShadow: 'none' }) }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1 uppercase">Academic Years</label>
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={academicYearOptions} value={selectedAcademicYears} onChange={setSelectedAcademicYears} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9', boxShadow: 'none' }) }} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-500 ml-1 uppercase">Semesters Mapping</label>
                    <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false} components={{ Option: CheckboxOption }} options={semesterOptions} value={selectedSemesters} onChange={setSelectedSemesters} styles={{ control: (base) => ({ ...base, borderRadius: '1rem', border: '2px solid #f1f5f9', boxShadow: 'none' }) }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-4 sticky bottom-0 z-10">
          <button 
            type="button"
            className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors"
            onClick={() => navigate('/universities')}
          >
            Discard Changes
          </button>
          <button 
            type="button"
            onClick={handleSave}
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
                <span>{isEditing ? 'Update Profile' : 'Register Now'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversitiesForm;
