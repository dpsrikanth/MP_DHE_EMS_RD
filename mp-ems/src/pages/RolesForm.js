import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { 
  ShieldCheck, 
  X, 
  ArrowLeft
} from "lucide-react";

const RolesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ role_name: '' });

  useEffect(() => {
    if (isEditing) {
      fetchRoleData();
    }
  }, [id]);

  const fetchRoleData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch roles');
      const result = await response.json();
      
      const role = result.find(r => r.id.toString() === id.toString());
      if (role) {
        setForm({ role_name: role.role_name || '' });
      } else {
        throw new Error('Role not found');
      }
    } catch (err) {
      toast.error(err.message);
      navigate('/roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.role_name) {
      toast.warning('Role name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `http://localhost:8080/api/roles/${id}` 
        : 'http://localhost:8080/api/roles';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Operation failed');
      }

      toast.success(isEditing ? 'Role updated successfully' : 'Role created successfully');
      navigate('/roles');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Role Data...</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/roles')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center text-amber-600 shadow-inner">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Modify Role' : 'Create Identity Group'}
              </h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Permission Definition</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-6 bg-slate-50/30">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Name</label>
              <input 
                type="text" 
                value={form.role_name} 
                onChange={e => setForm({...form, role_name: e.target.value})} 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 outline-none focus:border-amber-500 transition-all font-bold text-slate-800 shadow-sm" 
                placeholder="e.g. Dean, Registrar, HOD" 
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-8 bg-white border-t border-slate-100 flex justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button" 
              onClick={() => navigate('/roles')} 
              className="px-6 py-4 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-10 py-4 bg-amber-600 border-b-4 border-amber-800 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl transition-all active:translate-y-1 active:border-b-0 uppercase text-xs tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Processing...' : (isEditing ? 'Apply Changes' : 'Initialize Role')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesForm;
