import React, { useState, useEffect } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertCircle, Clock, 
  BookOpen, ChevronRight, Download, Info, Calendar, 
  CheckCircle, XCircle, Loader2, FileUp, Shield
} from 'lucide-react';
import { toast } from 'react-toastify';
import authUtils from '../../utils/authUtils';

const PaperSetterDashboard = () => {
  const [activeTab, setActiveTab] = useState('assigned');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // stores assignment_id of currently uploading
  const [dashData, setDashData] = useState({ assignedExams: [], submittedPapers: [] });
  const [selectedFiles, setSelectedFiles] = useState({}); // state to track files for each assignment

  useEffect(() => {
    fetchDashData();
  }, []);

  const fetchDashData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/faculty/dash-data`, {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) {
        setDashData(await res.json());
      }
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, subjectId) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFiles(prev => ({ ...prev, [subjectId]: file }));
    }
  };

  const handleUpload = async (exam) => {
    const file = selectedFiles[exam.subject_id];
    if (!file) {
      toast.warning('Please select a file first');
      return;
    }

    setUploading(exam.subject_id);
    const formData = new FormData();
    formData.append('paperFile', selectedFiles[exam.subject_id]);
    formData.append('assignment_id', exam.assignment_id || 'null');
    formData.append('subject_id', exam.subject_id);
    formData.append('exam_id', exam.exam_id);
    formData.append('title', exam.subject_name + ' Question Paper');

    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/faculty/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authUtils.getAuth().token}` },
        body: formData
      });

      if (res.ok) {
        toast.success(`Successfully uploaded paper for ${exam.subject_name}`);
        setSelectedFiles(prev => {
          const newState = { ...prev };
          delete newState[exam.subject_id];
          return newState;
        });
        fetchDashData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Upload failed');
      }
    } catch (e) {
      toast.error('Network error during upload');
    } finally {
      setUploading(null);
    }
  };

  const renderAssignedExams = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-6">
        {dashData.assignedExams.length === 0 && !loading && (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
               <FileText size={32} />
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active assignments found</p>
          </div>
        )}

        {dashData.assignedExams.map((exam) => (
          <div key={`${exam.subject_id}-${exam.exam_id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div>
                   <div className="flex items-center gap-2 mb-1">
                     <h3 className="text-2xl font-black text-slate-800 tracking-tight">{exam.subject_name}</h3>
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${exam.sets_submitted >= exam.sets_required ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                       {exam.sets_submitted >= exam.sets_required ? 'Completed' : 'Pending'}
                     </span>
                   </div>
                   <p className="text-slate-400 text-sm font-bold uppercase tracking-tighter">Exam ID: {exam.exam_name || `EX${exam.exam_id}`} | Semester: {exam.semester || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Exam Date</label>
                    <p className="font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> {exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Deadline</label>
                    <p className="font-bold text-rose-500 flex items-center gap-1.5"><Clock size={14} className="text-rose-300" /> {exam.deadline || '2025-01-10'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sets Required</label>
                    <p className="font-bold text-slate-700">{exam.sets_required}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sets Submitted</label>
                    <p className="font-bold text-slate-700">{exam.sets_submitted}/{exam.sets_required}</p>
                  </div>
                </div>
              </div>

              {exam.sets_submitted < exam.sets_required && (
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                   <div className="relative group/input flex-1 sm:flex-none">
                      <input 
                        type="file" 
                        id={`file-${exam.subject_id}`}
                        onChange={(e) => handleFileChange(e, exam.subject_id)}
                        className="hidden" 
                      />
                      <label 
                        htmlFor={`file-${exam.subject_id}`}
                        className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-5 py-3 rounded-2xl cursor-pointer border-2 border-dashed border-slate-200 transition-all text-sm min-w-[180px]"
                      >
                         <Upload size={18} className="text-slate-400" />
                         {selectedFiles[exam.subject_id] ? selectedFiles[exam.subject_id].name : 'Choose File'}
                      </label>
                   </div>
                   <button 
                    onClick={() => handleUpload(exam)}
                    disabled={uploading === exam.subject_id || !selectedFiles[exam.subject_id]}
                    className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-sky-500/20 active:scale-95 text-sm uppercase tracking-widest min-w-[200px]"
                   >
                     {uploading === exam.subject_id ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                     {uploading === exam.subject_id ? 'Encrypting...' : 'Upload Question Paper'}
                   </button>
                </div>
              )}
            </div>
            
            <div className="px-8 pb-4">
               <p className="text-[10px] text-slate-400 font-bold italic tracking-tight">Accepted formats: PDF, DOC, DOCX (Max size: 10MB)</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSubmittedPapers = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 gap-4">
        {dashData.submittedPapers.length === 0 && (
           <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300 transition-colors group-hover:text-indigo-400">
                <Shield size={32} />
             </div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No papers submitted yet</p>
           </div>
        )}

        {dashData.submittedPapers.map((paper) => (
          <div key={paper.assignment_id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-black text-slate-800">{paper.subject_name}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Paper ID: QP00{paper.paper_id} | Set {paper.set_name} | Exam: EX00{paper.assignment_id}</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Submitted Date</label>
                    <p className="font-bold text-slate-700">{new Date(paper.submitted_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <p className={`font-black uppercase text-[11px] tracking-wider ${
                      paper.status === 'Approved' ? 'text-emerald-500' : 
                      paper.status === 'Rejected' ? 'text-rose-500' : 'text-amber-500'
                    }`}>{paper.status}</p>
                  </div>
                </div>

                {paper.feedback && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback:</p>
                    <p className="text-sm font-semibold text-slate-600 italic tracking-tight">{paper.feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                   <button className="text-sky-500 hover:text-sky-600 font-bold text-sm flex items-center gap-1.5 transition-colors">
                      <BookOpen size={16} /> View Paper
                   </button>
                   <button className="text-emerald-500 hover:text-emerald-600 font-bold text-sm flex items-center gap-1.5 transition-colors">
                      <Download size={16} /> Download
                   </button>
                </div>
              </div>

              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                paper.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                paper.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 
                'bg-blue-50 text-blue-600 border border-blue-100'
              }`}>
                {paper.status === 'Approved' ? <CheckCircle2 size={12} /> : 
                 paper.status === 'Rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                {paper.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGuidelines = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 text-slate-50 rotate-12 -z-0">
           <Info size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Question Paper Guidelines</h2>
          
          <div className="space-y-8 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-sm font-black text-sky-600 uppercase tracking-[0.2em] flex items-center gap-2">General Instructions</h3>
              <ul className="space-y-3">
                {[
                  'Each subject requires minimum 3 question paper sets (A, B, C)',
                  'Question papers must follow university format and syllabus',
                  'Submit papers at least 5 days before examination date',
                  'All papers must be reviewed and approved by secrecy department'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                     <div className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                     <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">Format Requirements</h3>
              <ul className="space-y-3">
                {[
                  'Use official university letterhead',
                  'Include subject code, name, and semester',
                  'Specify time duration and maximum marks',
                  'Include clear instructions for students'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                     <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                     <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">Quality Standards</h3>
              <ul className="space-y-3">
                {[
                  'Questions should cover entire syllabus appropriately',
                  'Maintain appropriate difficulty level distribution',
                  'Ensure no grammatical or factual errors',
                  'Provide clear marking scheme'
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3 group">
                     <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                     <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      {/* Header section */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500 p-2 rounded-xl text-white">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paper Setter <span className="text-sky-500">Portal</span></h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Secure Examination Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
             {[
               { id: 'assigned', label: 'Assigned Exams', icon: <BookOpen size={18} /> },
               { id: 'submitted', label: 'Submitted Papers', icon: <FileText size={18} /> },
               { id: 'guidelines', label: 'Guidelines', icon: <Shield size={18} /> }
             ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-all border-b-2 -mb-4 ${
                   activeTab === tab.id 
                   ? 'border-sky-500 text-sky-600' 
                   : 'border-transparent text-slate-400 hover:text-slate-600'
                 }`}
               >
                 {tab.icon}
                 {tab.label}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="text-sky-500 animate-spin" size={48} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Syncing Secure Data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'assigned' && renderAssignedExams()}
            {activeTab === 'submitted' && renderSubmittedPapers()}
            {activeTab === 'guidelines' && renderGuidelines()}
          </>
        )}
      </div>

      <footer className="pt-12 pb-8 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
        2025 Secure EMS Portal • End-to-End Encryption Enabled
      </footer>
    </div>
  );
};

export default PaperSetterDashboard;
