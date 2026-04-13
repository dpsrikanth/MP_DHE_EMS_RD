import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users as UsersIcon, ArrowLeft, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import '../styles/FormPage.css';

const UsersForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [colleges, setColleges] = useState([]);

  const [form, setForm] = useState({ 
    name: '', email: '', password: '', role_id: '', 
    university_id: '', college_id: '', is_active: true 
  });

  useEffect(() => {
    fetchMasterData();
    if (isEditing) fetchUser(id);
  }, [id]);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [rRes, uRes, cRes] = await Promise.all([
        fetch('http://localhost:8080/api/roles', { headers }),
        fetch('http://localhost:8080/api/universities', { headers }),
        fetch('http://localhost:8080/api/colleges', { headers })
      ]);
      if (rRes.ok) setRoles(await rRes.json());
      if (uRes.ok) setUniversities(await uRes.json());
      if (cRes.ok) setColleges(await cRes.json());
    } catch (err) {
      console.error("Error fetching masters:", err);
    }
  };

  const fetchUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user data');
      const users = await res.json();
      const user = users.find(u => u.id.toString() === userId);
      if (user) {
        setForm({ 
          name: user.name || '', email: user.email || '', password: '',
          role_id: user.role_id || '', university_id: user.university_id || '', 
          college_id: user.college_id || '', 
          is_active: user.is_active === undefined ? true : user.is_active 
        });
      } else {
        toast.error('User not found');
        navigate('/users');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!form.name || !form.email || (!isEditing && !form.password) || !form.role_id) {
        setSaving(false);
        return toast.warning('Missing required fields');
      }

      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? `http://localhost:8080/api/users/${id}` 
        : 'http://localhost:8080/api/users';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Operation failed');
      }

      toast.success(isEditing ? 'User updated successfully' : 'User created successfully');
      navigate('/users');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading User Profile...</p>
    </div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button onClick={() => navigate('/users')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <UsersIcon size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Modify Identity' : 'Initialize New Identity'}</h2>
              <p>System Access & Security Credentials</p>
            </div>
          </div>
          <div className="form-header__right">
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                 {isEditing ? `User ID: #${id}` : 'New Profile'}
               </span>
             </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="form-body">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            
            {/* Left Column: Essential Identity */}
            <div className="space-y-10">
              <div className="form-section">
                <div className="form-section__title"><span>Core Identity</span></div>
                <div className="form-grid form-grid--2">
                  <div className="form-field">
                    <label className="form-label form-label--required">Official Full Name</label>
                    <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="form-input" placeholder="e.g. John Doe" />
                  </div>
                  <div className="form-field">
                    <label className="form-label form-label--required">Primary Email Access</label>
                    <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="form-input" placeholder="john@example.com" />
                  </div>
                  <div className="form-field form-grid__full">
                    <label className="form-label form-label--required">
                      {isEditing ? 'Credential Reset (Leave blank to maintain current)' : 'Access Password'}
                    </label>
                    <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-input" placeholder={isEditing ? "Enter new password..." : "Define secure password (min 8 chars)"} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section__title"><span>Security Attributes</span></div>
                <div className="form-grid form-grid--2">
                  <div className="form-field">
                    <label className="form-label form-label--required">Assigned Permission Role</label>
                    <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} className="form-select">
                      <option value="">Select Security Role</option>
                      {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Administrative Status</label>
                    <div className="form-toggle">
                      <div className="form-toggle__info">
                        <div className={`form-toggle__status ${form.is_active ? 'form-toggle__status--active' : 'form-toggle__status--inactive'}`}>
                          {form.is_active ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                        </div>
                        <span className="form-toggle__label">{form.is_active ? 'Identity Active' : 'Identity Suspended'}</span>
                      </div>
                      <button type="button" onClick={() => setForm({...form, is_active: !form.is_active})} className={`form-toggle__track ${form.is_active ? 'form-toggle__track--on' : 'form-toggle__track--off'}`}>
                        <div className="form-toggle__thumb" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Organizational Context */}
            <div className="space-y-10">
              <div className="form-section">
                <div className="form-section__title"><span>Institutional Hierarchy</span></div>
                <div className="form-section-card space-y-6">
                  <div className="form-field">
                    <label className="form-label">University Branch (Optional)</label>
                    <select value={form.university_id} onChange={e => setForm({...form, university_id: e.target.value, college_id: ''})} className="form-select">
                      <option value="">Global Administration / Select University</option>
                      {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Determines top-level data visibility</p>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Affiliated College (Optional)</label>
                    <select value={form.college_id} onChange={e => setForm({...form, college_id: e.target.value})} className="form-select">
                      <option value="">None / Specific College Placement</option>
                      {colleges.filter(c => !form.university_id || c.university_id.toString() === form.university_id.toString()).map(c => <option key={c.id} value={c.id}>{c.college_name}</option>)}
                    </select>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Narrows access to institutional data</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm"><ShieldCheck size={24} /></div>
                 <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Access Control Warning</h4>
                 <p className="text-xs text-indigo-600/80 leading-relaxed font-bold">
                   Changing organizational mapping will immediately alter this user's data scope. Ensure roles and institutions are correctly paired to prevent security breaches.
                 </p>
              </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={() => navigate('/users')} className="form-btn-cancel">
            Discard Changes
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="form-btn-submit">
            {saving ? <div className="form-spinner"></div> : <Check size={20} />}
            <span>{saving ? 'Syncing...' : (isEditing ? 'Commit Profile' : 'Initialize Identity')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersForm;
