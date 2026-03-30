import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, X, Search } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { toast } from 'react-toastify';
import { TableSearch } from '../../components/TableControls';

const SecrecyQuestionPapers = () => {
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSelectSetsModal, setShowSelectSetsModal] = useState(false);
  const [selectedPaperForSets, setSelectedPaperForSets] = useState(null);
  const [selectedSets, setSelectedSets] = useState([]);
  const [examFilter, setExamFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleDownload = async (paper_id, viewOnly = false) => {
    if (!paper_id) return;
    try {
      const response = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/download/${paper_id}`, {
        headers: authUtils.getAuthHeader()
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      if (viewOnly) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        // Try to get filename from content-disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'question_paper.pdf';
        if (contentDisposition && contentDisposition.includes('filename=')) {
          filename = contentDisposition.split('filename=')[1].replace(/["']/g, '');
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      toast.error('Failed to download paper');
    }
  };

  const toggleSetSelection = (assignment_id) => {
    setSelectedSets(prev => {
      if (prev.includes(assignment_id)) {
        return prev.filter(id => id !== assignment_id);
      }
      if (prev.length < 3) {
        return [...prev, assignment_id];
      }
      return prev;
    });
  };

  const handleApproveSelectedSets = async () => {
    try {
      setLoading(true);
      for (const assignment_id of selectedSets) {
        await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/secrecy/papers/status`, {
          method: 'POST',
          headers: { ...authUtils.getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignment_id, status: 'Printed', feedback: 'Approved for Printing' })
        });
      }
      toast.success('Selected sets approved for printing');
      setShowSelectSetsModal(false);
      setSelectedSets([]);
      fetchPapers();
    } catch (e) { 
      toast.error('Failed to approve sets');
      setLoading(false);
    }
  };

  // Unique exams derived from loaded papers (group by normalized exam_name)
  const examOptions = React.useMemo(() => {
    const seen = new Set();
    const options = [];
    questionPapers.forEach(p => {
      if (p.exam_name) {
        // Normalize: trim, lowercase, remove extra spaces
        const normName = p.exam_name.trim().replace(/\s+/g, ' ').toLowerCase();
        if (!seen.has(normName)) {
          seen.add(normName);
          options.push({ id: normName, name: p.exam_name.trim().replace(/\s+/g, ' ') });
        }
      }
    });
    return options;
  }, [questionPapers]);

  // Papers filtered by exam filter and search query
  const filteredPapers = React.useMemo(() => {
    let result = questionPapers;

    // 1. Apply Exam Filter (Dropdown)
    if (examFilter) {
      result = result.filter(p => {
        if (!p.exam_name) return false;
        const normName = p.exam_name.trim().replace(/\s+/g, ' ').toLowerCase();
        return normName === examFilter;
      });
    }

    // 2. Apply Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const sName = (p.subject_name || "").toLowerCase();
        const setter = (p.setter_name || "").toLowerCase();
        const sem = (p.semester || "").toLowerCase();
        const exam = (p.exam_name || "").toLowerCase();
        const sDate = p.updated_at ? new Date(p.updated_at).toLocaleDateString().toLowerCase() : "";
        const eDate = p.exam_date && !isNaN(new Date(p.exam_date)) ? new Date(p.exam_date).toLocaleDateString().toLowerCase() : "";

        return sName.includes(query) || 
               setter.includes(query) || 
               sem.includes(query) || 
               exam.includes(query) || 
               sDate.includes(query) ||
               eDate.includes(query);
      });
    }

    return result;
  }, [questionPapers, examFilter, searchQuery]);

  const availableSets = filteredPapers.filter(p => 
    selectedPaperForSets && 
    p.subject_id === selectedPaperForSets.subject_id && 
    p.exam_id === selectedPaperForSets.exam_id &&
    p.status === 'Finalized'
  );

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
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <FileText size={32} className="text-sky-500" />
          <div>
            <h2 className="text-2xl font-black text-slate-800 italic">Question Papers Review</h2>
            <p className="text-slate-500 text-sm font-medium">Review submitted papers and select sets for printing.</p>
          </div>
        </div>
        {/* Exam Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Exam</label>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="h-10 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 px-4 outline-none cursor-pointer min-w-[220px]"
          >
            <option value="">All Exams</option>
            {examOptions.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
            <div className="w-64">
                <TableSearch 
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search papers..."
                />
            </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredPapers && filteredPapers.map((paper) => (
          <div key={paper.assignment_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{paper.subject_name} — Set {paper.set_name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      Exam: {paper.exam_name || `EX00${paper.exam_id}`}
                      {paper.exam_type_name && <span className="ml-2 px-2 py-0.5 bg-sky-50 text-sky-600 rounded-md">{paper.exam_type_name}</span>}
                      {' '}| Semester: {paper.semester || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${
                    paper.status === 'Finalized' ? 'bg-emerald-100 text-emerald-700' : 
                    paper.status === 'Uploaded' ? 'bg-orange-100 text-orange-700' : 
                    paper.status === 'Rejected' ? 'bg-rose-100 text-rose-700' :
                    paper.status === 'Revision' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {paper.status === 'Finalized' ? 'Approved' : 
                     paper.status === 'Uploaded' ? 'Under Review' : 
                     paper.status === 'Rejected' ? 'Rejected' :
                     paper.status === 'Revision' ? 'Revision' : 
                     'Pending'}
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
                    <p className="font-bold text-slate-700 text-sm mt-0.5">{paper.exam_date && !isNaN(new Date(paper.exam_date)) ? new Date(paper.exam_date).toLocaleDateString() : 'TBD'}</p>
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
                 <button 
                   onClick={() => handleDownload(paper.paper_id, true)}
                   disabled={!paper.paper_id}
                   className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors disabled:opacity-50"
                 >
                   <Eye size={20} />
                 </button>
                 <button 
                   onClick={() => handleDownload(paper.paper_id, false)}
                   disabled={!paper.paper_id}
                   className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors disabled:opacity-50"
                 >
                   <Download size={20} />
                 </button>
              </div>
            </div>
          </div>
        ))}
        {filteredPapers && filteredPapers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 flex flex-col items-center gap-4">
             <div className="p-4 bg-slate-50 text-slate-300 rounded-2xl">
                 <Search size={48} />
             </div>
             <div className="space-y-1">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                    {searchQuery || examFilter ? "No matching records found" : "No question papers found"}
                </p>
                {(searchQuery || examFilter) && (
                    <button 
                        onClick={() => { setSearchQuery(''); setExamFilter(''); }}
                        className="text-xs font-black text-sky-500 hover:text-sky-600 underline uppercase tracking-widest"
                    >
                        Reset All Filters
                    </button>
                )}
             </div>
          </div>
        )}
      </div>

      {showSelectSetsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 italic"><FileText size={22} className="text-sky-500" /> Select Question Sets - {selectedPaperForSets?.subject_name}</h3>
               <button onClick={() => { setShowSelectSetsModal(false); setSelectedSets([]); }} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
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
                       <span className="text-sm font-black text-slate-700">{selectedPaperForSets?.exam_date && !isNaN(new Date(selectedPaperForSets.exam_date)) ? new Date(selectedPaperForSets.exam_date).toLocaleDateString() : 'TBD'}</span>
                     </div>
                     <div>
                       <span className="text-xs font-bold text-slate-400">Semester: </span>
                       <span className="text-sm font-black text-slate-700">{selectedPaperForSets?.semester || 'N/A'}</span>
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
                     <li>Select exactly {Math.min(3, availableSets.length)} question sets for this examination</li>
                     <li>Selected sets will be used for printing and distribution</li>
                     <li>Ensure sets cover the complete syllabus appropriately</li>
                     <li className="text-amber-800 font-black pt-1 italic">Selected sets: {selectedSets.length}/{Math.min(3, availableSets.length)}</li>
                   </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 italic">Available Question Sets</h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                    {availableSets.map(p => (
                      <div 
                        key={p.assignment_id} 
                        onClick={() => toggleSetSelection(p.assignment_id)}
                        className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                             selectedSets.includes(p.assignment_id) ? 'bg-sky-500 border-sky-500' : 'border-slate-200 group-hover:border-sky-400'
                           }`}>
                             {selectedSets.includes(p.assignment_id) && <div className="w-2 h-2 bg-white rounded-full" />}
                           </div>
                           <div>
                              <span className="text-sm font-bold text-slate-700 block">Question Set {p.set_name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.setter_name}</span>
                           </div>
                        </div>
                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-tighter">
                          Uploaded • {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    ))}
                    {availableSets.length === 0 && (
                      <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                        No approved sets available for this subject.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                   <button onClick={() => { setShowSelectSetsModal(false); setSelectedSets([]); }} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
                   <button 
                     onClick={handleApproveSelectedSets}
                     disabled={selectedSets.length !== Math.min(3, availableSets.length)}
                     className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${
                       selectedSets.length === Math.min(3, availableSets.length) ? 'bg-sky-500 hover:bg-sky-600 text-white cursor-pointer' : 'bg-slate-300 text-white cursor-not-allowed'
                     }`}
                   >
                     Approve Selected Sets
                   </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecrecyQuestionPapers;
