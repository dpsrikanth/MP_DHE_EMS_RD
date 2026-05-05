import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { Building, ArrowLeft, Check, Hash, Activity, ShieldCheck, ShieldAlert } from "lucide-react";
import '../styles/FormPage.css';
import { masterDataApi } from '../api/masterDataApi';

const DepartmentsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState([]);
  
  const [form, setForm] = useState({ 
    department_name: '', 
    department_code: '', 
    college_id: '', 
    status: 'Active' 
  });

  useEffect(() => {
    fetchColleges();
    if (isEditing) loadDepartment(id);
  }, [id]);

  const fetchColleges = async () => {
    try {
      const res = await masterDataApi.getColleges();
      if (res) setColleges(res);
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  const loadDepartment = async (deptId) => {
    try {
      const data = await masterDataApi.getDepartments();
      const dept = data.find(d => d.id.toString() === deptId);
      
      if (dept) {
        setForm({
          department_name: dept.department_name || '',
          department_code: dept.department_code || '',
          college_id: dept.college_id || '',
          status: dept.status || 'Active'
        });
      } else {
        toast.error('Department not found');
        navigate('/departments');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.department_name) return toast.warning('Department name is required');
    if (!form.college_id) return toast.warning('College is required');

    try {
      setSaving(true);
      
      let result;
      if (isEditing) {
        result = await masterDataApi.updateDepartment(id, form);
      } else {
        result = await masterDataApi.createDepartment(form);
      }
      
      toast.success(result?.message || (isEditing ? 'Department updated successfully!' : 'Department added successfully!'));
      navigate('/departments');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Department Details...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/departments')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <Building size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Structural Departmental Profile' : 'Initialize New Academic Department'}</h2>
              <p>Organizational Mapping within Campus Framework</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[12px] font-black text-emerald-400  tracking-widest bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">
                Structural Module v1.2
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              
              {/* Left Column: Department Identity (5 cols) */}
              <div className="xl:col-span-5 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Administrative Identity</span></div>
                  <div className="space-y-6">
                    {isEditing && (
                      <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] flex items-center justify-between">
                         <div>
                            <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-2">Entity Reference</p>
                            <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">DEPT-REF-{id.padStart(3, '0')}</p>
                         </div>
                         <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm"><Hash size={18} /></div>
                      </div>
                    )}
                    
                    <div className="form-field">
                      <label className="form-label form-label--required">Official Department Name</label>
                      <div className="form-input-wrap">
                        <Activity size={18} className="form-input-wrap__icon" />
                        <input type="text" placeholder="e.g. Computer Science & Engineering" value={form.department_name} 
                          onChange={(e) => setForm({ ...form, department_name: e.target.value })}
                          className="form-input form-input--with-icon" required />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Departmental Alpha Code</label>
                      <input type="text" placeholder="e.g. CSE" value={form.department_code} 
                        onChange={(e) => setForm({ ...form, department_code: e.target.value })}
                        className="form-input font-bold tracking-widest " />
                    </div>
                  </div>
                </div>

                <div className="p-10 bg-emerald-950 rounded-[3rem] text-white relative overflow-hidden group shadow-xl shadow-emerald-900/10">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-emerald-400/20 transition-all duration-700" />
                   <h4 className="relative z-10 text-xl font-black tracking-tight  mb-4">Institutional Logic</h4>
                   <p className="relative z-10 text-sm font-medium leading-relaxed text-emerald-200/80">
                     Establishing dedicated departments allows for granular curriculum management and precise student categorization within the broader institutional framework.
                   </p>
                </div>
              </div>

              {/* Right Column: Hierarchy & Lifecycle (7 cols) */}
              <div className="xl:col-span-7 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Placement Hierarchy</span></div>
                  <div className="bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[3rem] p-10">
                    <div className="form-field">
                      <label className="form-label form-label--required">Governing Institution (College)</label>
                      <select value={form.college_id} onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                        className="form-select border-2 border-slate-100 bg-slate-50 focus:bg-white" required >
                        <option value="">Select Parent College</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name || c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Operational Lifecycle</span></div>
                  <div className="bg-slate-50/50 p-10 rounded-[3rem] border-2 border-slate-100">
                    <div className="form-toggle">
                      <div className="form-toggle__info">
                        <div className={`form-toggle__status ${form.status === 'Active' ? 'form-toggle__status--active' : 'form-toggle__status--inactive'}`}>
                          {form.status === 'Active' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                        </div>
                        <div>
                           <span className="form-toggle__label text-sm  tracking-widest">{form.status === 'Active' ? 'Operational' : 'Restricted'}</span>
                           <p className="text-[12px] text-slate-400 font-bold  mt-1">Control visibility for program mapping and enrollments</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setForm({...form, status: form.status === 'Active' ? 'Inactive' : 'Active'})} 
                        className={`form-toggle__track ${form.status === 'Active' ? 'form-toggle__track--on' : 'form-toggle__track--off'}`} >
                        <div className="form-toggle__thumb" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="py-12 px-10 border-4 border-dashed border-slate-50 rounded-[3rem] flex items-center justify-center text-center">
                   <div>
                      <Building size={32} className="mx-auto text-slate-100 mb-4" />
                      <p className="text-[12px] font-black text-slate-300  tracking-[0.3em]">Structural Integrity Framework</p>
                   </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/departments')}>Discard Structural Changes</button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{saving ? 'Processing Entry...' : (isEditing ? 'Modify Department Profile' : 'Finalize Structural Entry')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentsForm;
