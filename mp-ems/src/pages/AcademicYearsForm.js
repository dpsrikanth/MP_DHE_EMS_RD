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
              <span className="text-[12px] font-black text-indigo-400  tracking-widest bg-indigo- px-4 py-2 rounded-xl border border-sky-100 shadow-sm">
                Chronos Module v1.0
              </span>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="form-body flex justify-center py-12">
            <div className="max-w-2xl w-full space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Session Identity</span></div>
                  <div className="bg-white border-2 border-slate-50 shadow-xl shadow-slate-200/20 rounded-[2rem] p-8 space-y-8">
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
                          <Calendar size={22} className="form-input-wrap__icon text-indigo-" />
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
                        <div className="mt-4 p-4 bg-indigo- border border-sky-100 rounded-2xl flex items-start gap-3">
                           <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center text-indigo- shadow-sm mt-0.5"><Calendar size={12} /></div>
                           <p className="text-[11px] font-medium text-sky-700 leading-relaxed">
                              <span className="font-extrabold ">Standard Format:</span> YYYY-YYYY (e.g., 2023-2024). This identifier represents the full academic lifecycle across all mapped semesters.
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl transition-all duration-500">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                   <div className="relative z-10 flex items-start gap-5">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 flex-shrink-0">
                         <Calendar size={24} className="group-hover:rotate-12 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                         <h4 className="text-lg font-black tracking-tight leading-none">Master Workflow Synchronization</h4>
                         <p className="text-xs text-indigo-100/70 font-medium leading-relaxed">
                            Academic years serve as the root parent for all institutional timelines. Initializing a session enables university-wide program scheduling and examination cycles.
                         </p>
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
