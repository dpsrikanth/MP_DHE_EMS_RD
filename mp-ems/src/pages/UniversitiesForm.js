import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { masterDataApi } from '../api/masterDataApi';
import { toast } from 'react-toastify';
import Select, { components } from 'react-select';
import { School, ArrowLeft, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import '../styles/FormPage.css';

const CheckboxOption = (props) => (
  <components.Option {...props}>
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={props.isSelected} onChange={() => null}
        className="w-4 h-4 rounded border-indigo-400 text-indigo-600 focus:ring-indigo-500 pointer-events-none" />
      <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{props.label}</span>
    </div>
  </components.Option>
);

const UniversitiesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({ name: '', address: '', status: true, university_type: '' });
  const [dataLoading, setDataLoading] = useState(isEditing);

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
    if (isEditing) loadUniversity(id);
  }, [id]);

  const fetchMasterData = async () => {
    try {
      const masterData = await masterDataApi.getMasters();
      
      const pOptions = masterData.policies.map(p => ({ value: p.id, label: p.name }));
      const prgOptions = masterData.programs.map(p => ({ value: p.id, label: p.name }));
      const ayOptions = masterData.academicYears.map(ay => ({ value: ay.id, label: ay.year_name }));
      const semOptions = masterData.semesters.map(s => ({ value: s.id, label: s.semester_name }));
      
      setPolicyOptions(pOptions); 
      setProgramOptions(prgOptions); 
      setAcademicYearOptions(ayOptions); 
      setSemesterOptions(semOptions);
      
      if (isEditing) loadConfigData(id, pOptions, prgOptions, ayOptions, semOptions);
    } catch (err) { 
      console.error('Error loading master data:', err); 
    }
  };

  const loadUniversity = async (univId) => {
    try {
      const university = await masterDataApi.getUniversityById(univId);
      if (university) {
        setForm({ 
          name: university.name || university.university_name || '', 
          address: university.address || '', 
          status: university.status === undefined ? true : university.status,
          university_type: university.university_type || ''
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
      const configData = await masterDataApi.getUniversityConfig(universityId);
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
    const payload = {
      policies: selectedPolicies.map(p => p.value), 
      programs: selectedPrograms.map(p => p.value),
      academicYears: selectedAcademicYears.map(a => a.value), 
      semesters: selectedSemesters.map(s => s.value)
    };
    await masterDataApi.updateUniversityConfig(univId, payload);
  };

  const handleSave = async () => {
    try {
      setSavingConfig(true);
      if (!form.name) { setSavingConfig(false); return toast.warning('Name is required'); }
      let finalUniversityId = null, toastMessage = '';
      
      if (isEditing) {
        const updatedUniv = await masterDataApi.updateUniversity(id, form);
        toastMessage = updatedUniv.message || 'University updated successfully!'; 
        finalUniversityId = id;
      } else {
        const createdUniv = await masterDataApi.createUniversity(form);
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

  if (dataLoading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading University Profile...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button onClick={() => navigate('/universities')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <School size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Institutional Governance Profile' : 'Institutional Authority Registration'}</h2>
              <p>Top-Level University Configuration</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                Governance Central v4.0
              </span>
          </div>
        </div>

        {/* Body */}
        <div className="form-body">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            {/* Left Column: Core Identity (5 cols) */}
            <div className="xl:col-span-5 space-y-10">
              <div className="form-section">
                <div className="form-section__title"><span>Strategic Identity</span></div>
                <div className="space-y-8">
                  <div className="form-field">
                    <label className="form-label form-label--required">Institutional Name</label>
                    <input type="text" placeholder="e.g. Barkatullah University" value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input text-lg font-black tracking-tight" />
                  </div>
                  <div className="form-field">
                    <label className="form-label form-label--required">University Type</label>
                    <select 
                      value={form.university_type} 
                      onChange={(e) => setForm({ ...form, university_type: e.target.value })} 
                      className="form-input font-bold"
                    >
                      <option value="">Select University Type</option>
                      <option value="Regular">Regular (Full-time On-campus)</option>
                      <option value="Night">Night (Evening Classes)</option>
                      <option value="Distance">Distance (Remote Learning)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Determines the mode of delivery for academic programs</p>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Administrative Headquarters</label>
                    <textarea placeholder="Full physical address of the governing body" rows={4} value={form.address} 
                      onChange={(e) => setForm({ ...form, address: e.target.value })} className="form-textarea resize-none" />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__title"><span>Operational Status</span></div>
                <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border-2 border-slate-100">
                  <div className="form-toggle">
                    <div className="form-toggle__info">
                      <div className={`form-toggle__status ${form.status ? 'form-toggle__status--active' : 'form-toggle__status--inactive'}`}>
                        {form.status ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                      </div>
                      <div>
                         <span className="form-toggle__label text-sm uppercase tracking-widest">{form.status ? 'Authority Active' : 'Authority Restricted'}</span>
                         <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Control visibility and access across the ecosystem</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setForm({ ...form, status: !form.status })} 
                      className={`form-toggle__track ${form.status ? 'form-toggle__track--on' : 'form-toggle__track--off'}`}>
                      <div className="form-toggle__thumb" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-indigo-950 rounded-[3rem] text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-400/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-indigo-400/20 transition-all duration-700" />
                 <h4 className="relative z-10 text-lg font-black uppercase tracking-tight mb-4">Governance Notice</h4>
                 <p className="relative z-10 text-sm font-medium leading-relaxed text-indigo-200/80">
                   Changes to top-level university profiles may impact all affiliated collegiate institutions and their mapped academic frameworks.
                 </p>
              </div>
            </div>

            {/* Right Column: Master Mapping Hub (7 cols) */}
            <div className="xl:col-span-7 space-y-10">
              <div className="form-section h-full">
                <div className="form-section__title"><span>Institutional Master Mapping</span></div>
                <div className="form-section-card bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/10 rounded-[3rem] p-12 h-full">
                  {configLoading ? (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest">Synchronizing Configuration...</p>
                    </div>
                  ) : (
                    <div className="space-y-10 py-4">
                      <div className="form-field">
                        <label className="form-label flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                           Policy Framework Master
                        </label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false}
                          components={{ Option: CheckboxOption }} options={policyOptions} 
                          value={selectedPolicies} onChange={setSelectedPolicies} 
                          className="form-react-select" classNamePrefix="react-select" placeholder="Allocate policies..." />
                      </div>
                      <div className="form-field">
                        <label className="form-label flex items-center gap-2">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                           Institutional Program Portfolio
                        </label>
                        <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false}
                          components={{ Option: CheckboxOption }} options={programOptions} 
                          value={selectedPrograms} onChange={setSelectedPrograms} 
                          className="form-react-select" classNamePrefix="react-select" placeholder="Allocate programs..." />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="form-field">
                          <label className="form-label flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                             Academic Year Control
                          </label>
                          <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false}
                            components={{ Option: CheckboxOption }} options={academicYearOptions} 
                            value={selectedAcademicYears} onChange={setSelectedAcademicYears}
                            className="form-react-select" classNamePrefix="react-select" placeholder="Control years..." />
                        </div>
                        <div className="form-field">
                          <label className="form-label flex items-center gap-2">
                             <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                             Semester Matrix
                          </label>
                          <Select isMulti hideSelectedOptions={false} closeMenuOnSelect={false}
                            components={{ Option: CheckboxOption }} options={semesterOptions} 
                            value={selectedSemesters} onChange={setSelectedSemesters}
                            className="form-react-select" classNamePrefix="react-select" placeholder="Define semesters..." />
                        </div>
                      </div>

                      <div className="py-12 px-10 border-4 border-dashed border-slate-50 rounded-[3rem] text-center">
                         <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Institutional Configuration Matrix</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={() => navigate('/universities')} className="form-btn-cancel">
            Discard Profile Updates
          </button>
          <button type="button" onClick={handleSave} disabled={savingConfig} className="form-btn-submit">
            {savingConfig ? <div className="form-spinner"></div> : <Check size={20} />}
            <span>{savingConfig ? 'Finalizing Authority...' : (isEditing ? 'Commit Governance profile' : 'Initialize Authority')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversitiesForm;
