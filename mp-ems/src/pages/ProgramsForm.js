import React, { useState, useEffect } from "react";
import { masterDataApi } from '../api/masterDataApi';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import Select, { components } from "react-select";
import { BookOpen, ArrowLeft, Check, Calendar, Hash, Layers, Settings, ListRestart } from "lucide-react";
import '../styles/FormPage.css';

const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className="mr-2 rounded border-indigo-500 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
        />{" "}
        <label>{props.label}</label>
      </components.Option>
    </div>
  );
};

const ProgramsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  
  const [form, setForm] = useState({ 
    name: '', duration_years: '', department_ids: [],
    section_name: '', code: '', grading_system_type: 'Normal',
    enable_elective_subjects_selection: 'N'
  });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const result = await masterDataApi.getDepartments();
      if (result) {
        const deptOptions = result.map(d => ({ value: d.id, label: d.department_name }));
        setDepartments(deptOptions);
        if (isEditing) loadProgram(id, deptOptions);
      }
    } catch (err) {
      console.error(err);
      if (isEditing) setLoading(false);
    }
  };

  const loadProgram = async (progId, currentDepartments) => {
    try {
      const data = await masterDataApi.getPrograms();
      const item = data.find(p => p.id.toString() === progId);
      
      if (item) {
        const selectedDepts = item.department_ids && currentDepartments.length > 0
          ? currentDepartments.filter(d => item.department_ids.includes(d.value))
          : [];
        setForm({
          name: item.name || '', duration_years: item.duration_years || '', 
          department_ids: selectedDepts, section_name: item.section_name || '',
          code: item.code || '', grading_system_type: item.grading_system_type || 'Normal',
          enable_elective_subjects_selection: item.enable_elective_subjects_selection || 'N'
        });
      } else {
        toast.error('Program not found');
        navigate('/programs');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.duration_years) return toast.warning('Program Name and Duration are required');
    
    try {
      setSaving(true);
      const payload = { 
        name: form.name, duration_years: parseInt(form.duration_years),
        department_ids: form.department_ids.map(d => d.value),
        section_name: form.section_name, code: form.code,
        grading_system_type: form.grading_system_type,
        enable_elective_subjects_selection: form.enable_elective_subjects_selection
      };

      let result;
      if (isEditing) {
        result = await masterDataApi.updateProgram(id, payload);
      } else {
        result = await masterDataApi.createProgram(payload);
      }
      
      toast.success(result.message || (isEditing ? 'Program updated successfully!' : 'Program added successfully!'));
      navigate('/programs');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Program Details...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/programs')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <BookOpen size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Academic Program Specification' : 'Initialize New Degree Program'}</h2>
              <p>Curriculum & Structural Mapping</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                Curriculum Module v2.5
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              
              {/* Left Column: Program Identity (5 cols) */}
              <div className="xl:col-span-5 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Strategic Identity</span></div>
                  <div className="space-y-6">
                    {isEditing && (
                      <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Registry Reference</p>
                            <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">PRG-SPEC-{id.padStart(4, '0')}</p>
                         </div>
                         <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm"><Hash size={18} /></div>
                      </div>
                    )}
                    
                    <div className="form-field">
                      <label className="form-label form-label--required">Title of Degree / Program</label>
                      <div className="form-input-wrap">
                        <BookOpen size={18} className="form-input-wrap__icon" />
                        <input type="text" placeholder="e.g. Bachelor of Technology" value={form.name} 
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="form-input form-input--with-icon" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="form-field">
                        <label className="form-label form-label--required">Duration (Academic Years)</label>
                        <div className="form-input-wrap">
                          <Calendar size={18} className="form-input-wrap__icon" />
                          <input type="number" placeholder="e.g. 4" value={form.duration_years} 
                            onChange={(e) => setForm({ ...form, duration_years: e.target.value })}
                            className="form-input form-input--with-icon" required />
                        </div>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Program Reference Code</label>
                        <div className="form-input-wrap">
                          <Hash size={18} className="form-input-wrap__icon" />
                          <input type="text" placeholder="e.g. BTECH-CS" value={form.code} 
                            onChange={(e) => setForm({ ...form, code: e.target.value })}
                            className="form-input form-input--with-icon font-mono uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-slate-900 rounded-[3rem] text-white relative overflow-hidden group">
                   <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mb-20 blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700" />
                   <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white"><Settings size={28} /></div>
                      <h4 className="text-xl font-black tracking-tight uppercase">Academic Logic</h4>
                      <p className="text-sm text-slate-400 font-medium leading-relaxed">
                        Defining program duration and grading systems will establish the base evaluation metrics for all students enrolled in this curriculum series.
                      </p>
                   </div>
                </div>
              </div>

              {/* Right Column: Configuration & Mapping (7 cols) */}
              <div className="xl:col-span-7 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Assessment & structural Control</span></div>
                  <div className="bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[3rem] p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="form-field">
                          <label className="form-label">Grading System Framework</label>
                          <div className="form-input-wrap">
                            <Settings size={18} className="form-input-wrap__icon" />
                            <select value={form.grading_system_type} 
                              onChange={(e) => setForm({ ...form, grading_system_type: e.target.value })}
                              className="form-select form-select--with-icon">
                              <option value="Normal">Standard (Traditional)</option>
                              <option value="CBCE">Choice Based (CBCE)</option>
                              <option value="Non-CBCE">Structural (Non-CBCE)</option>
                            </select>
                          </div>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Elective Selection Protocol</label>
                          <div className="form-input-wrap">
                            <ListRestart size={18} className="form-input-wrap__icon" />
                            <select value={form.enable_elective_subjects_selection} 
                              onChange={(e) => setForm({ ...form, enable_elective_subjects_selection: e.target.value })}
                              className="form-select form-select--with-icon">
                              <option value="Y">Active (Enabled)</option>
                              <option value="N">Restricted (Disabled)</option>
                            </select>
                          </div>
                        </div>
                     </div>

                     <div className="form-field">
                        <label className="form-label flex items-center gap-2">
                           Curriculum Section Designation
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">(Optional Branching)</span>
                        </label>
                        <div className="form-input-wrap">
                          <Layers size={18} className="form-input-wrap__icon" />
                          <input type="text" placeholder="e.g. Regular / Honors / Advanced" value={form.section_name} 
                            onChange={(e) => setForm({ ...form, section_name: e.target.value })}
                            className="form-input form-input--with-icon" />
                        </div>
                     </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Institutional Mapping</span></div>
                  <div className="bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[3rem] p-10">
                    <div className="form-field">
                      <label className="form-label mb-4 flex items-center gap-3 text-slate-400">
                         <div className="w-8 h-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><Layers size={16} /></div>
                         Associated Academic Departments
                      </label>
                      <Select
                        isMulti
                        options={[{value: 'all', label: 'Select All Departments'}, ...departments]}
                        value={form.department_ids}
                        onChange={(selected) => {
                          if (selected && selected.some(option => option.value === 'all')) {
                            setForm({ ...form, department_ids: departments });
                          } else {
                            setForm({ ...form, department_ids: selected || [] });
                          }
                        }}
                        components={{ Option }}
                        hideSelectedOptions={false}
                        closeMenuOnSelect={false}
                        className="form-react-select"
                        classNamePrefix="react-select"
                        placeholder="Link program to institutional departments..."
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/programs')}>
              Discard Configuration
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{saving ? 'Processing Program...' : (isEditing ? 'Modify Degree Profile' : 'Commit Program Policy')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramsForm;
