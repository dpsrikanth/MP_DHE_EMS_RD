import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { Layers, ArrowLeft, Check, Hash, Activity } from "lucide-react";
import { getApiUrl } from '../config';
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
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/master-semesters'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch semesters');
      const data = await response.json();
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
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? getApiUrl(`/master-semesters/${id}`)
        : getApiUrl('/master-semesters');
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Operation failed');
      }
      
      const result = await res.json();
      toast.success(result.message || (isEditing ? 'Semester updated successfully!' : 'Semester added successfully!'));
      navigate('/semesters');
    } catch (err) {
      toast.error('Error: ' + err.message);
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
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 shadow-sm">
                Framework Module v2.0
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              
              {/* Left Column: Core Identity (5 cols) */}
              <div className="xl:col-span-5 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Tier Identity</span></div>
                  <div className="space-y-8">
                    {isEditing && (
                      <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                         <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Structural Entry</p>
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
                            <span className="font-extrabold uppercase block mb-1">Architectural Hint:</span> 
                            Define a title that clearly identifies the semester rank or periodic nature within the academic program framework.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Summary (7 cols) */}
              <div className="xl:col-span-7 space-y-10">
                 <div className="h-full bg-indigo-950 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-white/10 transition-all duration-1000" />
                    
                    <div className="relative z-10 space-y-6">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-300 shadow-2xl shadow-black/50"><Layers size={32} /></div>
                       <h3 className="text-3xl font-black tracking-tight leading-loose">Curriculum Tier<br/>Master Profile</h3>
                       <p className="text-indigo-200 font-medium leading-relaxed max-w-sm opacity-60">
                          Semester definitions are synchronized across all department programs to maintain institutional academic structural integrity. 
                       </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/5 mt-10 flex items-center justify-between">
                       <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                          Global Tier Logic Active
                       </div>
                       <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">v2.01 // Tier-C</div>
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
