import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Users as UsersIcon, ArrowLeft, Check } from "lucide-react";

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
    name: '', 
    email: '', 
    password: '', 
    role_id: '', 
    university_id: '', 
    college_id: '', 
    is_active: true 
  });

  useEffect(() => {
    fetchMasterData();
    if (isEditing) {
      fetchUser(id);
    }
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
      // Fetch all users and find the one (since there is no specific /api/users/:id GET endpoint generally unless it's defined, but we can just use the list or assume a specific endpoint exists)
      const res = await fetch(`http://localhost:8080/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user data');
      const users = await res.json();
      const user = users.find(u => u.id.toString() === userId);
      if (user) {
        setForm({ 
          name: user.name || '', 
          email: user.email || '', 
          password: '', // Don't show password hash
          role_id: user.role_id || '', 
          university_id: user.university_id || '', 
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

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Initializing Identity Module...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => navigate('/users')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center text-indigo-600 shadow-inner">
              <UsersIcon size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {isEditing ? 'Edit User Profile' : 'Register New Identity'}
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">System Access Configuration</p>
            </div>
          </div>
        </div>
        
        {/* Form Body */}
        <div className="p-10 border-t border-slate-100 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800" placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800" placeholder="john@example.com" />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {isEditing ? 'Reset Password (Leave blank to keep current)' : 'Initial Password'}
              </label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800" placeholder={isEditing ? "New password..." : "Minimum 8 characters"} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Type</label>
              <select value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800 appearance-none cursor-pointer">
                <option value="">Select Role</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <div className="flex items-center justify-between gap-4 bg-white px-5 py-3.5 rounded-2xl border-2 border-slate-100">
                <span className="text-sm font-bold text-slate-600 flex-1">{form.is_active ? 'Active' : 'Inactive'}</span>
                <button type="button" onClick={() => setForm({...form, is_active: !form.is_active})} className={`relative w-12 h-6 rounded-full transition-all ${form.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${form.is_active ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">University (Optional)</label>
              <select value={form.university_id} onChange={e => setForm({...form, university_id: e.target.value, college_id: ''})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800 appearance-none cursor-pointer">
                <option value="">Global / Select Unv.</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">College (Optional)</label>
              <select value={form.college_id} onChange={e => setForm({...form, college_id: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-500 transition-all font-bold text-slate-800 appearance-none cursor-pointer">
                <option value="">None / Select College</option>
                {colleges.filter(c => !form.university_id || c.university_id.toString() === form.university_id.toString()).map(c => <option key={c.id} value={c.id}>{c.college_name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={() => navigate('/users')}
            className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Discard
          </button>
          <button 
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-10 py-3.5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check size={16} />
            {saving ? 'Processing...' : (isEditing ? 'Update Profile' : 'Initialize Identity')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersForm;
