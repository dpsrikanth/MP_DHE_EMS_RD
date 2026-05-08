import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { Layers, ArrowLeft, Check, Hash, Activity } from "lucide-react";
import { masterDataApi } from '../api/masterDataApi';
import '../styles/FormPage.css';

const SemestersForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ semester_name: '' });

  useEffect(() => {
    if (isEditing) loadSemester(id);
  }, [id]);

  const loadSemester = async (semesterId) => {
    try {
      const data = await masterDataApi.getSemesters();
      const item = data.find(p => p.id.toString() === semesterId);
      
      if (item) {
        setForm({ semester_name: item.semester_name || '' });
      } else {
        toast.error('Semester not found');
        navigate('/semesters');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.semester_name) return toast.warning('Semester name is required');
    
    try {
      setSaving(true);
      setSaving(true);
      let result;
      if (isEditing) {
        result = await masterDataApi.updateSemester(id, form);
      } else {
        result = await masterDataApi.createSemester(form);
      }
      
      toast.success(result.message || (isEditing ? 'Semester updated successfully!' : 'Semester added successfully!'));
      navigate('/semesters');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Semester Details...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/semesters')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <Layers size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Academic Tier Specification' : 'Initialize Curriculum Semester'}</h2>
              <p>Curriculum Architecture & Periodic Mapping</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[12px] font-black text-indigo-400  tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                Framework Module v2.0
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body flex justify-center py-12">
            <div className="max-w-2xl w-full space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Tier Identity</span></div>
                  <div className="bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[2rem] p-8 space-y-8">
                    <div className="space-y-8">
                      {isEditing && (
                        <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                           <div>
                              <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-2">Structural Entry</p>
                              <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">SEM-SPEC-{id.padStart(3, '0')}</p>
                           </div>
                           <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm"><Hash size={20} /></div>
                        </div>
                      )}
                      
                      <div className="form-field">
                        <label className="form-label form-label--required">Official Semester Designation</label>
                        <div className="form-input-wrap h-16">
                          <Activity size={22} className="form-input-wrap__icon text-indigo-500" />
                          <input 
                            type="text" 
                            placeholder="e.g. Semester 01 or Odd Semester" 
                            value={form.semester_name} 
                            onChange={(e) => setForm({ ...form, semester_name: e.target.value })}
                            className="form-input form-input--with-icon text-xl font-bold tracking-tight"
                            required
                          />
                        </div>
                        <div className="mt-4 p-5 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-start gap-4">
                           <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mt-0.5"><Layers size={14} /></div>
                           <p className="text-[11px] font-medium text-indigo-700 leading-relaxed">
                              <span className="font-extrabold  block mb-1">Architectural Hint:</span> 
                              Define a title that clearly identifies the semester rank or periodic nature within the academic program framework.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl transition-all duration-500">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                   <div className="relative z-10 flex items-start gap-5">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 flex-shrink-0">
                         <Layers size={24} className="group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                         <h4 className="text-lg font-black tracking-tight leading-none">Curriculum Tier Master Profile</h4>
                         <p className="text-xs text-indigo-100/70 font-medium leading-relaxed">
                            Semester definitions are synchronized across all department programs to maintain institutional academic structural integrity.
                         </p>
                      </div>
                   </div>
                </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/semesters')}>Discard Profile Changes</button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{saving ? 'Processing Entry...' : (isEditing ? 'Commit Structural Updates' : 'Authorize Tier Entry')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemestersForm;
