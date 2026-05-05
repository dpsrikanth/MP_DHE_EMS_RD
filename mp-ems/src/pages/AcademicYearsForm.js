import React, { useState, useEffect } from "react";
import { masterDataApi } from '../api/masterDataApi';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { Calendar, ArrowLeft, Check, Hash } from "lucide-react";
import '../styles/FormPage.css';

const AcademicYearsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ year_name: '' });

  useEffect(() => {
    if (isEditing) fetchAcademicYear();
  }, [id]);

  const fetchAcademicYear = async () => {
    try {
      const data = await masterDataApi.getAcademicYears();
      const item = data.find(y => y.id.toString() === id);
      
      if (item) {
        setFormData({ year_name: item.year_name });
      } else {
        toast.error('Academic year not found');
        navigate('/academic-years');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.year_name.trim()) return toast.warning('Year name is required');
    
    try {
      setSaving(true);
      let result;
      if (isEditing) {
        result = await masterDataApi.updateAcademicYear(id, { year_name: formData.year_name });
      } else {
        result = await masterDataApi.createAcademicYear({ year_name: formData.year_name });
      }
      
      toast.success(result.message || (isEditing ? 'Academic year updated successfully!' : 'Academic year added successfully!'));
      navigate('/academic-years');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Academic Year...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/academic-years')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <Calendar size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Chronological Session Matrix' : 'Initialize Academic Session Cycle'}</h2>
              <p>Chronological Framework for Institutional Operations</p>
            </div>
          </div>
          <div className="form-header__right">
              <span className="text-[12px] font-black text-sky-400  tracking-widest bg-sky-50 px-4 py-2 rounded-xl border border-sky-100 shadow-sm">
                Chronos Module v1.0
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="form-body">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
              
              {/* Left Column: Essential Configuration (5 cols) */}
              <div className="xl:col-span-5 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Session Identity</span></div>
                  <div className="space-y-8">
                    {isEditing && (
                      <div className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                         <div>
                            <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-2">Chronological Hash</p>
                            <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">SEC-CYCLE-{id.padStart(3, '0')}</p>
                         </div>
                         <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm"><Hash size={20} /></div>
                      </div>
                    )}
                    
                    <div className="form-field">
                      <label className="form-label form-label--required">Official Session Reference</label>
                      <div className="form-input-wrap h-16">
                        <Calendar size={22} className="form-input-wrap__icon text-sky-500" />
                        <input 
                          type="text" 
                          id="year_name"
                          placeholder="e.g. 2024-2025" 
                          value={formData.year_name} 
                          onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                          className="form-input form-input--with-icon text-xl font-bold tracking-tight"
                          required
                        />
                      </div>
                      <div className="mt-4 p-4 bg-sky-50 border border-sky-100 rounded-2xl flex items-start gap-3">
                         <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-sky-600 shadow-sm mt-0.5"><Calendar size={12} /></div>
                         <p className="text-[11px] font-medium text-sky-700 leading-relaxed">
                            <span className="font-extrabold ">Standard Format:</span> YYYY-YYYY (e.g., 2023-2024). This identifier represents the full academic lifecycle across all mapped semesters.
                         </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Summary / Context (7 cols) */}
              <div className="xl:col-span-7 space-y-10">
                 <div className="h-full bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden flex flex-col justify-between group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-sky-400/20 transition-all duration-1000" />
                    
                    <div className="relative z-10 space-y-6">
                       <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-sky-400"><Calendar size={32} /></div>
                       <h3 className="text-3xl font-black tracking-tight leading-tight">Master Workflow<br/>Synchronization</h3>
                       <p className="text-slate-400 font-medium leading-relaxed max-w-md">
                          Academic years serve as the root parent for all institutional timelines. Initializing a session enables university-wide program scheduling and examination cycles.
                       </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/5 mt-10">
                       <div className="flex items-center gap-4 text-[12px] font-black  tracking-[0.2em] text-sky-400 opacity-60">
                          <span className="w-1 h-1 bg-sky-400 rounded-full"></span>
                          Chronological Consistency Control active
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/academic-years')}>Discard Lifecycle Segment</button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{saving ? 'Processing Matrix...' : (isEditing ? 'Commit Session Updates' : 'Authorize Session Initialization')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcademicYearsForm;
