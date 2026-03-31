import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { 
  ShieldCheck, 
  X, 
  Check,
  Hash,
  FileText,
  ArrowLeft
} from "lucide-react";

const PoliciesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? parseInt(id) : null;
  const isEditing = Boolean(editingId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (isEditing) {
      fetchPolicyData();
    }
  }, [editingId]);

  const fetchPolicyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-policies', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      const item = (result || []).find(p => p.id === editingId);
      
      if (item) {
        setForm({ name: item.name, description: item.description || '' });
      } else {
        throw new Error("Policy not found");
      }
    } catch (err) {
      toast.error(err.message);
      navigate('/policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.warning('Policy name is required');
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `http://localhost:8080/api/master-policies/${editingId}`
        : 'http://localhost:8080/api/master-policies';
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isEditing ? 'Update failed' : 'Save failed'));
      }
      
      const result = await res.json();
      toast.success(result.message || (isEditing ? 'Policy updated successfully!' : 'Policy added successfully!'));
      navigate('/policies');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/policies')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-[1.5rem] flex items-center justify-center text-emerald-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Policy' : 'New Policy'}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70 flex items-center gap-2">
                <ShieldCheck size={12} /> Institutional Rules
              </p>
            </div>
          </div>
        </div>
        
        {/* Form Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-6 bg-slate-50/30">
            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 transition-colors group hover:border-emerald-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 group-hover:text-emerald-400 group-hover:shadow-emerald-500/5 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">POL-{editingId.toString().padStart(3, '0')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Anti-Ragging Policy" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all font-bold tracking-tight"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Description (Optional)</label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-slate-400 pointer-events-none group-focus-within:text-emerald-500 transition-colors">
                  <FileText size={18} />
                </div>
                <textarea 
                  placeholder="Details about this policy..." 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 outline-none transition-all font-medium tracking-tight h-28 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              disabled={saving}
              className="px-6 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/policies')}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] text-sm uppercase tracking-widest flex items-center gap-3 disabled:opacity-50"
            >
              {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                  <Check size={20} />
              )}
              <span>{isEditing ? 'Update Policy' : 'Register Policy'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoliciesForm;
