import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Check } from "lucide-react";
import '../styles/FormPage.css';

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

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Role Data...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/roles')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <ShieldCheck size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Configure Role' : 'Define Security Group'}</h2>
              <p>System Permissions & Access Hierarchies</p>
            </div>
          </div>
          <div className="form-header__right">
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                 System Profile
               </span>
             </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              
              {/* Left Column: Basic Config */}
              <div className="space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Group Identity</span></div>
                  <div className="form-field">
                    <label className="form-label form-label--required">Official Role Designation</label>
                    <div className="form-input-wrap">
                      <ShieldCheck size={18} className="form-input-wrap__icon" />
                      <input 
                        type="text" 
                        value={form.role_name} 
                        onChange={e => setForm({...form, role_name: e.target.value})} 
                        className="form-input form-input--with-icon" 
                        placeholder="e.g. Dean, Registrar, HOD" 
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Maximum clarity for administrative logging</p>
                  </div>
                </div>

                <div className="p-8 bg-amber-50 border border-amber-100 rounded-[2rem] space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><ShieldCheck size={24} /></div>
                  <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Security Implications</h4>
                  <p className="text-xs text-amber-600/80 leading-relaxed font-bold">
                    Roles act as the root for all user permissions. Removing or renaming roles could impact access for hundreds of users simultaneously.
                  </p>
                </div>
              </div>

              {/* Right Column: Visual Preview/Helper */}
              <div className="space-y-10">
                 <div className="form-section">
                    <div className="form-section__title"><span>Role Preview</span></div>
                    <div className="form-section-card bg-slate-900 text-white p-8">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white"><ShieldCheck size={20} /></div>
                          <div>
                             <h4 className="text-lg font-black tracking-tight">{form.role_name || 'Designation Pending'}</h4>
                             <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Global Administrative Role</p>
                          </div>
                       </div>
                       <div className="space-y-2 border-t border-slate-800 pt-6">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                             <span>Default Status</span>
                             <span className="text-emerald-400">Authorized</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                             <span>Inheritance</span>
                             <span className="text-slate-500">None</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" onClick={() => navigate('/roles')} className="form-btn-cancel" disabled={saving}>
              Discard Changes
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{saving ? 'Committing...' : (isEditing ? 'Push Changes' : 'Initialize Role')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolesForm;
