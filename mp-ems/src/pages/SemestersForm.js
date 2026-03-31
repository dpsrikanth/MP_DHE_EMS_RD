import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  Layers, 
  ArrowLeft, 
  Check,
  Hash,
  Activity
} from "lucide-react";

const SemestersForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({ 
    semester_name: '' 
  });

  useEffect(() => {
    if (isEditing) {
      loadSemester(id);
    }
  }, [id]);

  const loadSemester = async (semesterId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-semesters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch semesters');
      const data = await response.json();
      const item = data.find(p => p.id.toString() === semesterId);
      
      if (item) {
        setForm({ 
          semester_name: item.semester_name || ''
        });
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
        ? `http://localhost:8080/api/master-semesters/${id}` 
        : 'http://localhost:8080/api/master-semesters';
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

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Semester Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/semesters')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Layers size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Tier' : 'New Semester'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-70">
                Curriculum Configuration
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-8 bg-slate-50/30">
            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 transition-colors group hover:border-indigo-100 shadow-sm max-w-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-indigo-400 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">SEM-{id.padStart(3, '0')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester Designation (Required)</label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                  <Activity size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Semester 01 or Odd Semester" 
                  value={form.semester_name} 
                  onChange={(e) => setForm({ ...form, semester_name: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight shadow-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/semesters')}
            >
              Discard changes
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>{isEditing ? 'Update Rank' : 'Register Tier'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SemestersForm;
