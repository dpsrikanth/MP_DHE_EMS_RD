import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import Select, { components } from "react-select";
import { 
  BookOpen, 
  ArrowLeft, 
  Check,
  Calendar,
  Hash,
  Layers,
  Settings,
  ListRestart
} from "lucide-react";

const Option = (props) => {
  return (
    <div>
      <components.Option {...props}>
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className="mr-2 rounded border-emerald-500 text-emerald-600 focus:ring-emerald-500 pointer-events-none"
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
    name: '', 
    duration_years: '', 
    department_ids: [],
    section_name: '',
    code: '',
    grading_system_type: 'Normal',
    enable_elective_subjects_selection: 'N'
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        const deptOptions = result.map(d => ({ value: d.id, label: d.department_name }));
        setDepartments(deptOptions);
        
        if (isEditing) {
          loadProgram(id, deptOptions);
        }
      }
    } catch (err) {
      console.error(err);
      if (isEditing) setLoading(false);
    }
  };

  const loadProgram = async (progId, currentDepartments) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-programs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch programs');
      const data = await response.json();
      const item = data.find(p => p.id.toString() === progId);
      
      if (item) {
        const selectedDepts = item.department_ids && currentDepartments.length > 0
          ? currentDepartments.filter(d => item.department_ids.includes(d.value))
          : [];
          
        setForm({
          name: item.name || '', 
          duration_years: item.duration_years || '', 
          department_ids: selectedDepts,
          section_name: item.section_name || '',
          code: item.code || '',
          grading_system_type: item.grading_system_type || 'Normal',
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
      const token = localStorage.getItem('token');
      
      const url = isEditing 
        ? `http://localhost:8080/api/master-programs/${id}` 
        : 'http://localhost:8080/api/master-programs';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          name: form.name, 
          duration_years: parseInt(form.duration_years),
          department_ids: form.department_ids.map(d => d.value),
          section_name: form.section_name,
          code: form.code,
          grading_system_type: form.grading_system_type,
          enable_elective_subjects_selection: form.enable_elective_subjects_selection
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Operation failed');
      }
      
      const result = await res.json();
      toast.success(result.message || (isEditing ? 'Program updated successfully!' : 'Program added successfully!'));
      navigate('/programs');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Program Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/programs')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <BookOpen size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Program' : 'New Program'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-70">
                Configuration
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-8 bg-slate-50/30">
            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 transition-colors group hover:border-emerald-100 shadow-sm max-w-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-emerald-400 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Internal ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">REF-{id.padStart(4, '0')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Title of Degree (Required)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                  <BookOpen size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Bachelor of Technology" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all font-semibold shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration in Years (Required)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <input 
                    type="number" 
                    placeholder="e.g. 4" 
                    value={form.duration_years} 
                    onChange={(e) => setForm({ ...form, duration_years: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all font-black shadow-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Section Name</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                    <Layers size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. A" 
                    value={form.section_name} 
                    onChange={(e) => setForm({ ...form, section_name: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all font-bold shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program Code</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                    <Hash size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="e.g. BAG1" 
                    value={form.code} 
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 outline-none transition-all font-bold shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Grading System</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                    <Settings size={20} />
                  </div>
                  <select 
                    value={form.grading_system_type} 
                    onChange={(e) => setForm({ ...form, grading_system_type: e.target.value })}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="Normal">Normal</option>
                    <option value="CBCE">CBCE</option>
                    <option value="Non-CBCE">Non-CBCE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Enable Elective Selection</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                  <ListRestart size={20} />
                </div>
                <select 
                  value={form.enable_elective_subjects_selection} 
                  onChange={(e) => setForm({ ...form, enable_elective_subjects_selection: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer shadow-sm"
                >
                  <option value="Y">Yes (Enabled)</option>
                  <option value="N">No (Disabled)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Departments Mapping</label>
              <div className="relative">
                <Select
                  isMulti
                  options={[{value: 'all', label: 'Select All'}, ...departments]}
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
                  className="react-select-container text-base font-semibold"
                  classNamePrefix="react-select"
                  placeholder="Link to departments..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      padding: '0.6rem',
                      borderRadius: '1rem',
                      borderColor: state.isFocused ? '#10b981' : '#f1f5f9',
                      borderWidth: '2px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                      '&:hover': {
                        borderColor: state.isFocused ? '#10b981' : '#f1f5f9'
                      }
                    })
                  }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/programs')}
            >
              Discard changes
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>{isEditing ? 'Update Program' : 'Create Program'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramsForm;
