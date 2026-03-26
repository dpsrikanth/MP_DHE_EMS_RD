import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, X } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { toast } from 'react-toastify';

const SecrecyQuestionPapers = () => {
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSelectSetsModal, setShowSelectSetsModal] = useState(false);
  const [selectedPaperForSets, setSelectedPaperForSets] = useState(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/papers`, {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) setQuestionPapers(await res.json());
    } catch (e) { 
      console.error(e); 
      toast.error('Failed to fetch question papers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (assignment_id, status, feedback = '') => {
    try {
      const res = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/papers/status`, {
        method: 'POST',
        headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignment_id, status, feedback })
      });
      if (res.ok) {
        toast.success(`Status updated to ${status}`);
        fetchPapers();
      } else {
        toast.error('Failed to update status');
      }
    } catch (e) { toast.error('Network error'); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Question Papers...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen pb-20 fade-in duration-500 animate-in">
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <FileText size={32} className="text-sky-500" />
        <div>
          <h2 className="text-2xl font-black text-slate-800 italic">Question Papers Review</h2>
          <p className="text-slate-500 text-sm font-medium">Review submitted papers and select sets for printing.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {questionPapers && questionPapers.map((paper) => (
          <div key={paper.assignment_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{paper.subject_name} — Set {paper.set_name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Paper ID: {paper.id || 'QP00' + paper.assignment_id} | Semester: {paper.semester_number || 4}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                    paper.status === 'Finalized' ? 'bg-emerald-100 text-emerald-700' : 
                    paper.status === 'Uploaded' ? 'bg-orange-100 text-orange-700' : 
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {paper.status === 'Finalized' ? 'Approved' : 
                     paper.status === 'Uploaded' ? 'Under Review' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Paper Setter</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{paper.setter_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Question Sets</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{paper.paper_id ? 1 : 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Submitted Date</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{paper.updated_at ? new Date(paper.updated_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Exam Date</p>
                    <p className="font-bold text-slate-700 text-sm mt-0.5">2025-01-15</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Feedback:</p>
                  <p className="text-sm text-slate-600 font-medium italic">{paper.feedback || 'None provided'}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {paper.status === 'Uploaded' && (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(paper.assignment_id, 'Finalized')}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2 px-6 rounded-lg text-xs uppercase tracking-widest transition-all"
                      >
                        Approve
                      </button>
                      <button 
                         onClick={() => handleUpdateStatus(paper.assignment_id, 'Rejected', 'Insufficient quality')}
                         className="bg-rose-500 hover:bg-rose-600 text-white font-black py-2 px-6 rounded-lg text-xs uppercase tracking-widest transition-all"
                      >
                        Reject
                      </button>
                      <button 
                         onClick={() => handleUpdateStatus(paper.assignment_id, 'Revision', 'Needs more variety')}
                         className="bg-amber-500 hover:bg-amber-600 text-white font-black py-2 px-6 rounded-lg text-xs uppercase tracking-widest transition-all"
                      >
                        Request Revision
                      </button>
                    </>
                  )}
                  {paper.status === 'Finalized' && (
                    <button 
                      onClick={() => {
                        setSelectedPaperForSets(paper);
                        setShowSelectSetsModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-lg text-xs uppercase tracking-widest transition-all shadow-md shadow-blue-500/20"
                    >
                      Select Sets for Printing
                    </button>
                  )}
                </div>
              </div>

              <div className="flex md:flex-col gap-2 justify-start items-center">
                 <button className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"><Eye size={20} /></button>
                 <button className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"><Download size={20} /></button>
              </div>
            </div>
          </div>
        ))}
        {questionPapers && questionPapers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 text-slate-400 font-bold uppercase">
            No question papers found.
          </div>
        )}
      </div>

      {showSelectSetsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic"><FileText size={22} className="text-sky-500" /> Select Question Sets - {selectedPaperForSets?.subject_name}</h3>
               <button onClick={() => setShowSelectSetsModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
             </div>
             
             <div className="p-8 space-y-6">
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
                   <h4 className="text-xs font-black text-blue-600 uppercase mb-4">Exam Details</h4>
                   <div className="grid grid-cols-2 gap-y-4 gap-x-10">
                     <div>
                       <span className="text-xs font-bold text-slate-400">Subject: </span>
                       <span className="text-sm font-black text-slate-700">{selectedPaperForSets?.subject_name}</span>
                     </div>
                     <div>
                       <span className="text-xs font-bold text-slate-400">Exam Date: </span>
                       <span className="text-sm font-black text-slate-700">Not Set</span>
                     </div>
                     <div>
                       <span className="text-xs font-bold text-slate-400">Semester: </span>
                       <span className="text-sm font-black text-slate-700">4</span>
                     </div>
                     <div>
                       <span className="text-xs font-bold text-slate-400">Students: </span>
                       <span className="text-sm font-black text-slate-700">Not Set</span>
                     </div>
                   </div>
                </div>

                <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                   <h4 className="text-xs font-black text-amber-600 uppercase mb-2">Selection Instructions</h4>
                   <ul className="text-xs font-bold text-amber-700 space-y-1 ml-4 list-disc">
                     <li>Select exactly 3 question sets for this examination</li>
                     <li>Selected sets will be used for printing and distribution</li>
                     <li>Ensure sets cover the complete syllabus appropriately</li>
                     <li className="text-amber-800 font-black pt-1 italic">Selected sets: 0/3</li>
                   </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 italic">Available Question Sets</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                           <div className="w-5 h-5 rounded border-2 border-slate-200 group-hover:border-sky-400 transition-colors" />
                           <span className="text-sm font-bold text-slate-700">Question Set {String.fromCharCode(64 + i)}</span>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-tighter">Uploaded • Dec 20, 2024</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                   <button onClick={() => setShowSelectSetsModal(false)} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
                   <button className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-slate-300 cursor-not-allowed transition-all shadow-sm">Approve Selected Sets</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecrecyQuestionPapers;
