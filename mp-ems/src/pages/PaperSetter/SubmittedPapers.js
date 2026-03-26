import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, BookOpen, Download, AlertCircle, Shield, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import authUtils from '../../utils/authUtils';

const SubmittedPapers = () => {
  const [loading, setLoading] = useState(true);
  const [submittedPapers, setSubmittedPapers] = useState([]);

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
        const data = await res.json();
        setSubmittedPapers(data.submittedPapers || []);
      }
    } catch (e) {
      toast.error('Failed to load submitted papers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (paperId, actionName, fallbackTitle) => {
    let newWindow = null;
    if (actionName === 'view') {
      // Open window immediately to bypass popup blockers
      newWindow = window.open('about:blank', '_blank');
    }
    
    const loadingToast = toast.loading(`${actionName === 'view' ? 'Opening' : 'Downloading'} secure paper...`);
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/download/${paperId}`, {
        headers: authUtils.getAuthHeader()
      });
      
      if (res.ok) {
        let blob = await res.blob();
        
        if (actionName === 'view') {
          // Cast blob object to PDF so browsers render it inline instead of strictly downloading
          blob = new Blob([blob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(blob);
          if (newWindow) {
            newWindow.location.href = url;
          } else {
            window.open(url, '_blank');
          }
        } else {
          // download
          if (newWindow) newWindow.close(); // just in case
          const url = window.URL.createObjectURL(blob);
          let filename = `${fallbackTitle}_Question_Paper`;
          const disposition = res.headers.get('content-disposition');
          if (disposition && disposition.indexOf('filename=') !== -1) {
             const matches = /filename="([^"]*)"/.exec(disposition);
             if (matches != null && matches[1]) filename = matches[1];
          }
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }
        toast.update(loadingToast, { render: 'Success!', type: 'success', isLoading: false, autoClose: 2000 });
      } else {
        if (newWindow) newWindow.close();
        const err = await res.json();
        toast.update(loadingToast, { render: err.message || 'Failed to retrieve paper', type: 'error', isLoading: false, autoClose: 3000 });
      }
    } catch (e) {
      if (newWindow) newWindow.close();
      toast.update(loadingToast, { render: 'Network error occurred', type: 'error', isLoading: false, autoClose: 3000 });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500 p-2 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paper Setter <span className="text-sky-500">Portal</span></h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Submitted Papers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="text-sky-500 animate-spin" size={48} />
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Loading secure data...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-4">
              {submittedPapers.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300 transition-colors group-hover:text-indigo-400">
                      <Shield size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No papers submitted yet</p>
                </div>
              )}

              {submittedPapers.map((paper) => (
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
                        <button 
                            onClick={() => handleAction(paper.paper_id, 'view', paper.subject_name)}
                            className="text-sky-500 hover:text-sky-600 font-bold text-sm flex items-center gap-1.5 transition-colors"
                        >
                            <BookOpen size={16} /> View Paper
                        </button>
                        <button 
                            onClick={() => handleAction(paper.paper_id, 'download', paper.subject_name)}
                            className="text-emerald-500 hover:text-emerald-600 font-bold text-sm flex items-center gap-1.5 transition-colors"
                        >
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
        )}
      </div>
      
      <footer className="pt-12 pb-8 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">
        2025 Secure EMS Portal • End-to-End Encryption Enabled
      </footer>
    </div>
  );
};

export default SubmittedPapers;
