import React, { useState, useEffect } from 'react';
import { Users, Eye, Edit3, X, UserPlus, FileText, Smartphone, HardDrive, GraduationCap } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { toast } from 'react-toastify';

const SecrecyPaperSetters = () => {
  const [paperSetters, setPaperSetters] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddSetterModal, setShowAddSetterModal] = useState(false);
  const [showViewSetterModal, setShowViewSetterModal] = useState(false);
  const [showEditSetterModal, setShowEditSetterModal] = useState(false);
  const [selectedSetter, setSelectedSetter] = useState(null);
  const [setterType, setSetterType] = useState('existing'); // 'existing' or 'new'
  
  const [newSetterForm, setNewSetterForm] = useState({
    name: '', email: '', phone: '', department: '',
    designation: '', experience: '', qualification: '', subjects: []
  });
  
  const [editSetterForm, setEditSetterForm] = useState({
    name: '', email: '', phone: '', department: '',
    designation: '', experience: '', qualification: '', status: 'Active', subjects: []
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchSetters(), fetchDepartments(), fetchDesignations(), fetchAvailableSubjects()
      ]);
      setLoading(false);
    };

    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/master-departments`, {
          headers: authUtils.getAuthHeader()
        });
        if (res.ok) setDepartments(await res.json());
      } catch (e) { console.error(e); }
    };

    const fetchDesignations = async () => {
      try {
        const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/master-designations`, {
          headers: authUtils.getAuthHeader()
        });
        if (res.ok) setDesignations(await res.json());
      } catch (e) { console.error(e); }
    };

    const fetchAvailableSubjects = async () => {
      try {
        const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/master-subjects`, {
          headers: authUtils.getAuthHeader()
        });
        if (res.ok) setAvailableSubjects(await res.json());
      } catch (e) { console.error(e); }
    };

    fetchInitialData();
  }, []);

  const fetchSetters = async () => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/setters`, {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) setPaperSetters(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleDepartmentChange = (deptId) => {
    setNewSetterForm(prev => ({ ...prev, department: deptId, subjects: [] }));
    if (!deptId) {
      setFilteredSubjects([]);
      return;
    }
    const filtered = availableSubjects.filter(sub => 
      sub.department_ids && sub.department_ids.includes(parseInt(deptId))
    );
    setFilteredSubjects(filtered);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewSetterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subId) => {
    setNewSetterForm(prev => {
      const subjects = prev.subjects.includes(subId)
        ? prev.subjects.filter(s => s !== subId)
        : [...prev.subjects, subId];
      return { ...prev, subjects };
    });
  };

  const handleEditSubjectToggle = (subId) => {
    setEditSetterForm(prev => {
      const subjects = prev.subjects.includes(subId)
        ? prev.subjects.filter(s => s !== subId)
        : [...prev.subjects, subId];
      return { ...prev, subjects };
    });
  };

  const handleSaveNewSetter = async () => {
    if (!newSetterForm.name || !newSetterForm.email || !newSetterForm.department) {
      toast.warning('Please fill Name, Email and Department');
      return;
    }
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/setters/new`, {
        method: 'POST',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetterForm)
      });
      if (res.ok) {
        toast.success('New paper setter created');
        setShowAddSetterModal(false);
        setNewSetterForm({
          name: '', email: '', phone: '', department: '',
          designation: '', experience: '', qualification: '', subjects: []
        });
        fetchSetters();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to create setter');
      }
    } catch (e) { toast.error('Network error'); }
  };

  const handleEditSave = async () => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/setters/${selectedSetter.id}`, {
        method: 'PUT',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(editSetterForm)
      });
      if (res.ok) {
        toast.success('Paper setter updated');
        setShowEditSetterModal(false);
        fetchSetters();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to update setter');
      }
    } catch (e) { toast.error('Network error'); }
  };

  const renderViewSetterModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic"><Users size={22} className="text-sky-500" /> Paper Setter Details</h3>
          <button onClick={() => setShowViewSetterModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
          {/* Personal Information */}
          <div className="bg-blue-50/30 p-6 rounded-2xl border border-blue-100/50 space-y-4">
            <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Users size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Full Name</p>
                  <p className="font-bold text-slate-700">{selectedSetter?.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><FileText size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Email</p>
                  <p className="font-bold text-slate-700">{selectedSetter?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Smartphone size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Phone</p>
                  <p className="font-bold text-slate-700">{selectedSetter?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><HardDrive size={18} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Employee ID</p>
                  <p className="font-bold text-slate-700">EMP{String(selectedSetter?.id).padStart(3, '0')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-emerald-50/30 p-6 rounded-2xl border border-emerald-100/50 space-y-4">
            <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest">Professional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Department</p>
                <p className="font-bold text-emerald-700">{selectedSetter?.department || 'General'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Designation</p>
                <p className="font-bold text-emerald-700">{selectedSetter?.designation || 'Faculty'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Experience</p>
                <p className="font-bold text-emerald-700">{selectedSetter?.experience || 0} years</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Status</p>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${selectedSetter?.teacher_status ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {selectedSetter?.teacher_status ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Qualification */}
          <div className="bg-purple-50/30 p-6 rounded-2xl border border-purple-100/50 space-y-4">
            <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest">Qualification</h4>
            <div className="flex items-center gap-3">
               <GraduationCap size={20} className="text-purple-500" />
               <p className="font-bold text-slate-700">{selectedSetter?.qualification || 'Not specified'}</p>
            </div>
          </div>

          {/* Assigned Subjects */}
          <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100/50 space-y-4">
            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest">Assigned Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSetter?.subjects && selectedSetter.subjects[0] ? selectedSetter.subjects.map((sub, i) => (
                <span key={i} className="text-xs font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{sub}</span>
              )) : <p className="text-slate-400 italic text-sm font-medium">No subjects assigned yet.</p>}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={() => setShowViewSetterModal(false)} className="bg-slate-800 hover:bg-slate-900 text-white font-black py-2.5 px-8 rounded-xl text-sm transition-all shadow-lg shadow-slate-200 active:scale-95">Close</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditSetterModal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic"><Edit3 size={22} className="text-sky-500" /> Edit Paper Setter</h3>
          <button onClick={() => setShowEditSetterModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white"><X size={24} /></button>
        </div>
        <div className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input 
                type="text" 
                value={editSetterForm.name}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, name: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
              <input 
                type="email" 
                value={editSetterForm.email}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, email: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
              <input 
                type="text" 
                value={editSetterForm.phone}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, phone: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
              <select 
                value={editSetterForm.department}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, department: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
              >
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Designation</label>
              <select 
                value={editSetterForm.designation}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, designation: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
              >
                <option value="">Select Designation</option>
                {designations.map(d => <option key={d.id} value={d.id}>{d.designation_name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Experience (Years)</label>
              <input 
                type="number" 
                value={editSetterForm.experience}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, experience: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
              <select 
                value={editSetterForm.status}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, status: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qualification</label>
              <input 
                type="text" 
                value={editSetterForm.qualification}
                onChange={(e) => setEditSetterForm({ ...editSetterForm, qualification: e.target.value })}
                className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subjects</label>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl max-h-40 overflow-y-auto">
               {availableSubjects.filter(sub => !editSetterForm.department || (sub.department_ids && sub.department_ids.includes(parseInt(editSetterForm.department)))).length > 0 ? 
                 availableSubjects.filter(sub => !editSetterForm.department || (sub.department_ids && sub.department_ids.includes(parseInt(editSetterForm.department)))).map((sub, i) => (
                 <label key={i} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={editSetterForm.subjects.includes(sub.id)}
                      onChange={() => handleEditSubjectToggle(sub.id)}
                      className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 transition-all" 
                    />
                    <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{sub.name}</span>
                 </label>
               )) : (
                 <p className="col-span-2 text-center py-4 text-xs font-bold text-slate-400 uppercase italic">Select a department first</p>
               )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setShowEditSetterModal(false)} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
            <button onClick={handleEditSave} className="px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Update Paper Setter</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Paper Setters...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen pb-20 fade-in duration-500 animate-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Users size={32} className="text-sky-500" />
          <div>
            <h2 className="text-2xl font-black text-slate-800 italic">Paper Setters Management</h2>
            <p className="text-slate-500 text-sm font-medium">Manage and assign subjects to paper setters.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddSetterModal(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all active:scale-95"
        >
          <UserPlus size={18} />
          Add Paper Setter
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Name</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Role</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Subjects</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paperSetters.map((setter) => (
              <tr key={setter.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{setter.name}</div>
                  <div className="text-xs text-slate-500 font-medium">{setter.email}</div>
                </td>
                <td className="px-6 py-4 text-sm font-bold text-slate-600">{setter.role_name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {setter.subjects && setter.subjects[0] ? setter.subjects.map((sub, i) => (
                      <span key={i} className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-tighter">{sub}</span>
                    )) : <span className="text-slate-400 italic text-xs">No subjects assigned</span>}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedSetter(setter);
                        setShowViewSetterModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedSetter(setter);
                        setEditSetterForm({
                          name: setter.name,
                          email: setter.email,
                          phone: setter.phone || '',
                          department: setter.department_id || '',
                          designation: setter.designation_id || '',
                          experience: setter.experience || 0,
                          qualification: setter.qualification || '',
                          status: setter.teacher_status ? 'Active' : 'Inactive',
                          subjects: setter.subject_ids || []
                        });
                        setShowEditSetterModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paperSetters.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400 font-bold text-sm">No paper setters found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddSetterModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-white w-full ${setterType === 'new' ? 'max-w-2xl' : 'max-w-md'} rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300 transition-all`}>
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic"><Users size={22} className="text-sky-500" /> Add Paper Setter</h3>
               <button onClick={() => setShowAddSetterModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-white"><X size={24} /></button>
             </div>
             <div className="p-8 space-y-6 overflow-y-auto max-h-[85vh]">
               <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Paper Setter Selection</p>
                 <div className="flex gap-6">
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="setterType" 
                        checked={setterType === 'existing'} 
                        onChange={() => setSetterType('existing')}
                        className="w-4 h-4 text-sky-500 focus:ring-sky-500" 
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-sky-600 transition-colors">Select Existing Paper Setter</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="setterType" 
                        checked={setterType === 'new'} 
                        onChange={() => setSetterType('new')}
                        className="w-4 h-4 text-sky-500 focus:ring-sky-500" 
                      />
                      <span className="text-sm font-bold text-slate-700 group-hover:text-sky-600 transition-colors">Add New Paper Setter</span>
                   </label>
                 </div>
               </div>

               {setterType === 'existing' ? (
                 <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Select Paper Setter</label>
                     <div className="relative">
                       <select className="w-full bg-slate-100 border border-transparent focus:border-sky-500 focus:bg-white rounded-2xl px-5 py-4 font-bold text-slate-700 appearance-none outline-none transition-all">
                         <option>Select a paper setter</option>
                         {paperSetters.map(s => (
                           <option key={s.id} value={s.id}>{s.name} - {s.subjects?.join(', ') || 'General'}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                   <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">
                     Assign Paper Setter
                   </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        value={newSetterForm.name}
                        onChange={handleFormChange}
                        placeholder="Dr. John Smith" 
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        value={newSetterForm.email}
                        onChange={handleFormChange}
                        placeholder="john.smith@university.edu" 
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone Number</label>
                      <input 
                        type="text" 
                        name="phone"
                        value={newSetterForm.phone}
                        onChange={handleFormChange}
                        placeholder="+91-9876543210" 
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department</label>
                      <select 
                        value={newSetterForm.department}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Designation</label>
                      <select 
                        name="designation"
                        value={newSetterForm.designation}
                        onChange={handleFormChange}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm appearance-none"
                      >
                        <option value="">Select Designation</option>
                        {designations.map(d => (
                          <option key={d.id} value={d.id}>{d.designation_name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Experience (years)</label>
                      <input 
                        type="number" 
                        name="experience"
                        value={newSetterForm.experience}
                        onChange={handleFormChange}
                        placeholder="5" 
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Qualification</label>
                      <input 
                        type="text" 
                        name="qualification"
                        value={newSetterForm.qualification}
                        onChange={handleFormChange}
                        placeholder="Ph.D. in Computer Science" 
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-500 focus:bg-white rounded-xl px-4 py-3 font-semibold text-slate-700 outline-none transition-all shadow-sm" 
                      />
                    </div>
                    <div className="space-y-3 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Subjects</label>
                      <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl max-h-40 overflow-y-auto">
                         {filteredSubjects.length > 0 ? filteredSubjects.map((sub, i) => (
                           <label key={i} className="flex items-center gap-2 cursor-pointer group">
                              <input 
                                type="checkbox" 
                                checked={newSetterForm.subjects.includes(sub.id)}
                                onChange={() => handleSubjectToggle(sub.id)}
                                className="w-4 h-4 rounded text-sky-500 focus:ring-sky-500 border-slate-300 transition-all" 
                              />
                              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors uppercase tracking-tight">{sub.name}</span>
                           </label>
                         )) : (
                           <p className="col-span-2 text-center py-4 text-xs font-bold text-slate-400 uppercase italic">
                             {newSetterForm.department ? 'No subjects found for this department' : 'Select a department first'}
                           </p>
                         )}
                      </div>
                    </div>
                    <div className="col-span-2 flex justify-end gap-3 pt-4">
                      <button onClick={() => setShowAddSetterModal(false)} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
                      <button 
                        onClick={handleSaveNewSetter}
                        className="px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
               )}
             </div>
          </div>
        </div>
      )}

      {showViewSetterModal && renderViewSetterModal()}

      {showEditSetterModal && renderEditSetterModal()}
    </div>
  );
};

export default SecrecyPaperSetters;
