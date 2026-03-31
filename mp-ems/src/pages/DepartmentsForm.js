import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { 
  Building, 
  ArrowLeft, 
  Check,
  Hash,
  Activity
} from "lucide-react";

const DepartmentsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [colleges, setColleges] = useState([]);
  
  const [form, setForm] = useState({ 
    department_name: '', 
    department_code: '', 
    college_id: '', 
    status: 'Active' 
  });

  useEffect(() => {
    fetchColleges();
    if (isEditing) {
      loadDepartment(id);
    }
  }, [id]);

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setColleges(await res.json());
      }
    } catch (err) {
      console.error('Error fetching colleges:', err);
    }
  };

  const loadDepartment = async (deptId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      const dept = data.find(d => d.id.toString() === deptId);
      
      if (dept) {
        setForm({
          department_name: dept.department_name || '',
          department_code: dept.department_code || '',
          college_id: dept.college_id || '',
          status: dept.status || 'Active'
        });
      } else {
        toast.error('Department not found');
        navigate('/departments');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.department_name) return toast.warning('Department name is required');
    if (!form.college_id) return toast.warning('College is required');

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const url = isEditing 
        ? `http://localhost:8080/api/master-departments/${id}` 
        : 'http://localhost:8080/api/master-departments';
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
      toast.success(result.message || (isEditing ? 'Department updated successfully!' : 'Department added successfully!'));
      navigate('/departments');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Department Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/departments')}
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner">
              <Building size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Department' : 'New Department'}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-70">
                College Configuration
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-8 space-y-6 bg-slate-50/30">
            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 transition-colors group hover:border-indigo-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-indigo-400 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">DEPT-{id.padStart(3, '0')}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Name (Required)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                  <Activity size={18} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. Computer Science" 
                  value={form.department_name} 
                  onChange={(e) => setForm({ ...form, department_name: e.target.value })}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Department Code</label>
              <input 
                type="text" 
                placeholder="Auto-generated if left blank" 
                value={form.department_code} 
                onChange={(e) => setForm({ ...form, department_code: e.target.value })}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned College (Required)</label>
              <select
                value={form.college_id}
                onChange={(e) => setForm({ ...form, college_id: e.target.value })}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 focus:border-indigo-500 outline-none transition-all font-bold tracking-tight appearance-none cursor-pointer shadow-sm"
                required
              >
                <option value="">-- Select College --</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.college_name || c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
              <div className="flex items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border-2 border-slate-100 shadow-sm">
                <span className="text-sm font-bold text-slate-600 flex-1">{form.status === 'Active' ? 'Active' : 'Inactive'}</span>
                <button type="button" onClick={() => setForm({...form, status: form.status === 'Active' ? 'Inactive' : 'Active'})} className={`relative w-12 h-6 rounded-full transition-all ${form.status === 'Active' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${form.status === 'Active' ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-4 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/departments')}
            >
              Discard
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>{isEditing ? 'Update Department' : 'Create Department'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentsForm;
