import React, { useState, useEffect } from 'react';
import { Upload, FileText, Lock, Users, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import authUtils from '../../utils/authUtils';

const PaperSetterDashboard = () => {
  const [role, setRole] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form Data (Subjects & Faculties)
  const [formDataLookup, setFormDataLookup] = useState({ subjects: [], faculties: [], chiefs: [] });

  // Forms
  const [assignForm, setAssignForm] = useState({ subject_id: '', exam_id: '1', set_name: 'A', assigned_faculty_id: '', assigned_chief_id: '' });
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    const userRole = localStorage.getItem('roleName');
    setRole(userRole);
    fetchData(userRole);
  }, []);

  const fetchData = async (currentRole) => {
    try {
      let endpoint = '';
      if (['HOD', 'admin', 'college_admin'].includes(currentRole)) endpoint = '/paper-setter/hod/assignments';
      if (['Faculty', 'Teacher', 'External Faculty'].includes(currentRole)) endpoint = '/paper-setter/faculty/assignments';
      if (['admin', 'SUPER_ADMIN'].includes(currentRole)) endpoint = '/paper-setter/chief/dashboard';
      
      if (!endpoint) return;

      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}${endpoint}`, {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        if (endpoint.includes('chief')) setDashboardData(data);
        else setAssignments(data);
      }

      // If HOD, also fetch the form lookup lists
      if (['HOD', 'admin', 'college_admin'].includes(currentRole)) {
        const fRes = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/hod/form-data`, {
          headers: authUtils.getAuthHeader()
        });
        if (fRes.ok) {
           const fData = await fRes.json();
           setFormDataLookup(fData);
           if(fData.subjects?.length > 0 && !assignForm.subject_id) setAssignForm(prev => ({...prev, subject_id: fData.subjects[0].id}));
           if(fData.faculties?.length > 0 && !assignForm.assigned_faculty_id) setAssignForm(prev => ({...prev, assigned_faculty_id: fData.faculties[0].id}));
           if(fData.chiefs?.length > 0 && !assignForm.assigned_chief_id) setAssignForm(prev => ({...prev, assigned_chief_id: fData.chiefs[0].id}));
        }
      }
    } catch(e) { console.error('Fetch error:', e); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/hod/assign`, {
        method: 'POST',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(assignForm)
      });
      if(res.ok) {
        alert("Assigned successfully!");
        fetchData(role);
      } else alert("Failed to assign.");
    } catch(e) { alert("Network Error"); }
  };

  const handleUpload = async (assignment_id) => {
    if(!uploadFile) return alert("Select a file");
    setLoading(true);
    const formData = new FormData();
    formData.append('paperFile', uploadFile);
    formData.append('assignment_id', assignment_id);
    formData.append('title', `Paper Set - Uploaded`);

    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/faculty/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authUtils.getAuth().token}` },
        body: formData
      });
      if(res.ok) {
        alert("Uploaded Privately and Encrypted");
        setUploadFile(null);
        fetchData(role);
      } else alert("Failed to upload.");
    } catch(e) {}
    setLoading(false);
  };

  const handleFinalize = async (assignment_id) => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/chief/finalize`, {
        method: 'POST',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id })
      });
      if(res.ok) {
        alert("Paper Set Approved and Finalized!");
        fetchData(role);
      } else {
        const errData = await res.json();
        alert(errData.message || "Approval Failed securely.");
      }
    } catch(e) {
      alert("Network Error");
    }
  };

  const downloadPaper = async (paper_id) => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/download/${paper_id}`, {
        headers: authUtils.getAuthHeader()
      });
      if(!res.ok) return alert('Failed to download paper.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Secure_Paper_${paper_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) { console.error(e) }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Paper Setter Modules</h1>
          <p className="text-slate-500 font-medium">Secured Role: <span className="text-indigo-600 font-bold uppercase">{role}</span></p>
        </div>
      </div>

      {['HOD', 'admin', 'college_admin'].includes(role) && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Users size={20} className="text-sky-500"/> Assign Faculty to Paper Sets</h2>
            <form className="flex gap-4 items-end" onSubmit={handleAssign}>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1 font-bold text-slate-700" value={assignForm.subject_id} onChange={e => setAssignForm({...assignForm, subject_id: e.target.value})} required>
                  <option value="">Select Subject...</option>
                  {formDataLookup.subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.subject_code})</option>)}
                </select>
              </div>
              <div className="w-32">
                <label className="text-xs font-bold text-slate-500 uppercase">Set Name</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1 font-bold text-slate-700" value={assignForm.set_name} onChange={e => setAssignForm({...assignForm, set_name: e.target.value})}>
                  <option value="A">Set A</option>
                  <option value="B">Set B</option>
                  <option value="C">Set C</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Faculty Name</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1 font-bold text-slate-700" value={assignForm.assigned_faculty_id} onChange={e => setAssignForm({...assignForm, assigned_faculty_id: e.target.value})} required>
                  <option value="">Select Faculty...</option>
                  {formDataLookup.faculties.map(f => <option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Reviewing Chief Examiner</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mt-1 font-bold text-slate-700" value={assignForm.assigned_chief_id} onChange={e => setAssignForm({...assignForm, assigned_chief_id: e.target.value})} required>
                  <option value="">Select Chief Examiner...</option>
                  {formDataLookup.chiefs?.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                </select>
              </div>
              <button className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded-xl h-[42px] transition-colors shadow-sm">Assign</button>
            </form>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h2 className="text-lg font-bold flex items-center gap-2 mb-4">Recent Assignments</h2>
             <div className="space-y-3">
               {assignments.length === 0 && <p className="text-slate-400 font-medium">No sets assigned yet.</p>}
               {assignments.map(a => (
                 <div key={a.id} className="p-4 border rounded-xl bg-slate-50 flex items-center justify-between">
                   <div>
                     <h3 className="font-bold text-slate-800 text-sm">{a.subject_name || `Subject ${a.subject_id}`} — Set {a.set_name}</h3>
                     <p className="text-xs font-medium text-slate-500 mt-1">
                       Assigned to: <span className="font-bold text-slate-700">{a.faculty_name}</span> | 
                       Chief Reviewer: <span className="font-bold text-sky-600">{a.chief_name || 'Unassigned'}</span> • {new Date(a.assign_date).toLocaleDateString()}
                     </p>
                   </div>
                   <span className="font-bold text-xs bg-slate-200 text-slate-600 px-3 py-1 rounded-full">{a.status}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {['Faculty', 'Teacher', 'External Faculty'].includes(role) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><Upload size={20} className="text-indigo-500"/> My Assignments (Uploader Portal)</h2>
          <div className="space-y-4">
            {assignments.length === 0 && <p className="text-slate-400 font-medium">No sets assigned to you yet.</p>}
            {assignments.map(a => (
              <div key={a.assignment_id} className="p-4 border rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800">{a.subject_name || `Subject ${a.subject_id}`} — Set {a.set_name}</h3>
                  <p className="text-sm font-medium text-slate-500">Status: <span className="text-indigo-600">{a.status}</span></p>
                </div>
                {a.status === 'Pending' ? (
                  <div className="flex items-center gap-2">
                    <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="text-sm"/>
                    <button onClick={() => handleUpload(a.assignment_id)} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">{loading ? 'Encrypting...' : 'Upload & Encrypt'}</button>
                  </div>
                ) : (
                  <button onClick={() => downloadPaper(a.paper_id)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-4 rounded-lg text-sm flex gap-2"><Lock size={16}/> View Secure Upload</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {['admin', 'SUPER_ADMIN'].includes(role) && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><ShieldCheck size={20} className="text-green-500"/> Chief Examiner Approval Dashboard</h2>
          <div className="space-y-4">
            {dashboardData.length === 0 && <p className="text-slate-400 font-medium">No uploaded papers pending review.</p>}
            {dashboardData.map(d => (
              <div key={d.assignment_id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex gap-3 items-center">
                    <h3 className="font-bold text-slate-800">{d.subject_name || `Subject ${d.subject_id}`} — Set {d.set_name}</h3>
                    {d.status === 'Finalized' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs font-bold flex items-center gap-1"><CheckCircle2 size={12}/> Approved</span>}
                  </div>
                  <p className="text-sm text-slate-500 font-medium mt-1">Setter: <span className="font-bold">{d.setter_name}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPaper(d.paper_id)} className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm flex items-center gap-2"><Lock size={14}/> Decrypt & View</button>
                  {d.status !== 'Finalized' && (
                     <button onClick={() => handleFinalize(d.assignment_id)} className="bg-green-500 hover:bg-green-600 text-white border-green-600 font-bold py-2 px-4 rounded-lg text-sm">Approve Final</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default PaperSetterDashboard;
