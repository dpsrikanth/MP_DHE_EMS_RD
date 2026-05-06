import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Calendar, Clock, Loader2, FileUp, BookOpen, X, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import authUtils from '../../utils/authUtils';
import { formatDate } from '../../utils/dateUtils';
import { paperSetterApi } from '../../api/paperSetterApi';
import { TableSearch } from '../../components/TableControls';

const PaperSetterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [dashData, setDashData] = useState({ assignedExams: [], submittedPapers: [] });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashData();
  }, []);

  const fetchDashData = async () => {
    setLoading(true);
    try {
      const data = await paperSetterApi.getDashData();
      setDashData(data);
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
    formData.append('paperFile', file);
    formData.append('assignment_id', exam.assignment_id || 'null');
    formData.append('subject_id', exam.subject_id);
    formData.append('exam_id', exam.exam_id);
    formData.append('title', exam.subject_name + ' Question Paper');

    try {
      await paperSetterApi.uploadPaper(formData);
      toast.success(`Successfully uploaded paper for ${exam.subject_name}`);
      setSelectedFiles(prev => {
        const newState = { ...prev };
        delete newState[exam.subject_id];
        return newState;
      });
      fetchDashData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return dashData.assignedExams;
    const query = searchQuery.toLowerCase().trim();
    
    return dashData.assignedExams.filter(exam => {
      const sName = (exam.subject_name || "").toLowerCase();
      const eName = (exam.exam_name || "").toLowerCase();
      const eId = `ex${exam.exam_id}`.toLowerCase();
      const sem = (exam.semester || "").toLowerCase();
      const eDate = exam.exam_date && !isNaN(new Date(exam.exam_date)) 
        ? formatDate(exam.exam_date).toLowerCase() 
        : "";
      
      return sName.includes(query) || 
             eName.includes(query) || 
             eId.includes(query) || 
             sem.includes(query) || 
             eDate.includes(query);
    });
  }, [dashData.assignedExams, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-indigo- p-2 rounded-xl text-white">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paper Setter <span className="text-indigo-">Portal</span></h1>
              <p className="text-slate-400 text-[12px] font-bold  tracking-widest">Assigned Exams Dashboard</p>
            </div>
          </div>
          <div className="w-full md:w-80">
            <TableSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subjects, exams, or dates..."
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="text-indigo- animate-spin" size={48} />
            <p className="text-slate-400 font-black  tracking-widest text-sm animate-pulse">Syncing Secure Data...</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 gap-6">
              {filteredExams.length === 0 && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                     {searchQuery ? <Search size={32} /> : <FileText size={32} />}
                  </div>
                  <p className="text-slate-400 font-bold  tracking-widest text-[12px] mb-2">
                    {searchQuery ? "No matching assignments" : "No active assignments found"}
                  </p>
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-[12px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-widest"
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              )}

              {filteredExams.map((exam) => (
                <div key={`${exam.subject_id}-${exam.exam_id}`} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                  <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                         <div className="flex items-center gap-2 mb-1">
                           <h3 className="text-2xl font-black text-slate-800 tracking-tight">{exam.subject_name}</h3>
                           <span className={`px-3 py-1 rounded-full text-[12px] font-black  tracking-wider ${exam.latest_status === 'Revision' ? 'bg-rose-100 text-rose-600' : exam.sets_submitted > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo- text-indigo-'}`}>
                             {exam.latest_status === 'Revision' ? 'Revision Needed' : exam.sets_submitted > 0 ? 'Completed' : 'Pending'}
                           </span>
                         </div>
                         <p className="text-slate-400 text-sm font-bold  tracking-tighter">Exam ID: {exam.exam_name || `EX${exam.exam_id}`} | Semester: {exam.semester || 'N/A'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mt-4">
                        <div>
                          <label className="text-[12px] font-black text-slate-400  tracking-widest block mb-1">Exam Date</label>
                          <p className="font-bold text-slate-700 flex items-center gap-1.5"><Calendar size={14} className="text-slate-300" /> {exam.exam_date && !isNaN(new Date(exam.exam_date)) ? formatDate(exam.exam_date) : 'TBD'}</p>
                        </div>
                        <div>
                          <label className="text-[12px] font-black text-slate-400  tracking-widest block mb-1">Deadline</label>
                          <p className="font-bold text-rose-500 flex items-center gap-1.5"><Clock size={14} className="text-rose-300" /> {
                             exam.exam_date && !isNaN(new Date(exam.exam_date)) 
                               ? formatDate(new Date(new Date(exam.exam_date).getTime() - 20 * 24 * 60 * 60 * 1000)) 
                               : 'TBD'
                          }</p>
                        </div>
                      </div>
                    </div>

                    {(Number(exam.sets_submitted) === 0 || exam.latest_status === 'Revision') && (
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
                            {selectedFiles[exam.subject_id] && (
                              <button
                                 onClick={() => {
                                   setSelectedFiles(prev => {
                                     const newState = { ...prev };
                                     delete newState[exam.subject_id];
                                     return newState;
                                   });
                                   // Clear the actual input so selecting the same file again triggers onChange
                                   const inputEl = document.getElementById(`file-${exam.subject_id}`);
                                   if (inputEl) inputEl.value = '';
                                 }}
                                 className="absolute -top-2 -right-2 bg-rose-100 hover:bg-rose-500 text-rose-600 hover:text-white rounded-full p-1 transition-colors shadow-sm"
                                 title="Cancel Selection"
                              >
                                 <X size={14} strokeWidth={3} />
                              </button>
                            )}
                         </div>
                         <button 
                          onClick={() => handleUpload(exam)}
                          disabled={uploading === exam.subject_id || !selectedFiles[exam.subject_id]}
                          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm  tracking-widest min-w-[200px]"
                         >
                           {uploading === exam.subject_id ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                           {uploading === exam.subject_id ? 'Encrypting...' : 'Upload Question Paper'}
                         </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-8 pb-4">
                     <p className="text-[12px] text-slate-400 font-bold italic tracking-tight">Accepted formats: PDF, DOC, DOCX (Max size: 10MB)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="pt-12 pb-8 text-center text-slate-400 font-bold text-[12px]  tracking-widest">
        {new Date().getFullYear()} Secure EMS Portal • End-to-End Encryption Enabled
      </footer>
    </div>
  );
};

export default PaperSetterDashboard;
