import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Calendar, Clock, Loader2, FileUp, BookOpen, X, Search, AlertCircle, CheckCircle2, GraduationCap } from 'lucide-react';

import { toast } from 'react-toastify';
import authUtils from '../../utils/authUtils';
import { formatDate } from '../../utils/dateUtils';
import { paperSetterApi } from '../../api/paperSetterApi';
import { masterDataApi } from '../../api/masterDataApi';
import { TableSearch } from '../../components/TableControls';


const PaperSetterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [dashData, setDashData] = useState({ assignedExams: [], submittedPapers: [] });
  const [selectedFiles, setSelectedFiles] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSemester, setFilterSemester] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [roadmapWindow, setRoadmapWindow] = useState(null);

  useEffect(() => {
    fetchDashData();
    fetchRoadmapWindow();
  }, []);

  // Re-fetch roadmap window when program or semester filter changes
  useEffect(() => {
    fetchRoadmapWindow(filterProgram, filterSemester);
  }, [filterProgram, filterSemester]);


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

  const fetchRoadmapWindow = async (programFilter = 'all', semesterFilter = 'all') => {
    try {
      const params = new URLSearchParams();
      if (programFilter && programFilter !== 'all') params.set('program_name', programFilter);
      if (semesterFilter && semesterFilter !== 'all') params.set('semester_name', semesterFilter);
      const data = await paperSetterApi.getRoadmapWindow(params.toString());
      setRoadmapWindow(data);
    } catch (e) {
      console.warn('Could not fetch roadmap window');
    }
  };


  const MAX_FILE_SIZE_MB = 10;
  const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

  const handleFileChange = (e, subjectId) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Invalid file type. Only PDF, DOC, and DOCX files are accepted.`);
      e.target.value = '';
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File too large! "${file.name}" is ${fileSizeMB.toFixed(1)} MB. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }

    setSelectedFiles(prev => ({ ...prev, [subjectId]: file }));
  };

  const handleUpload = async (exam) => {
    const file = selectedFiles[exam.subject_id];
    if (!file) {
      toast.warning('Please select a file first');
      return;
    }

    // Double-check size before sending to server
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File too large! "${file.name}" is ${fileSizeMB.toFixed(1)} MB. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`);
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
    let exams = dashData.assignedExams;

    if (filterProgram !== 'all') {
      exams = exams.filter(exam => (exam.program_name || "").toLowerCase() === filterProgram.toLowerCase());
    }

    if (filterSemester !== 'all') {
      exams = exams.filter(exam => (exam.semester || "").toLowerCase() === filterSemester.toLowerCase());
    }

    if (!searchQuery.trim()) return exams;
    const query = searchQuery.toLowerCase().trim();
    
    return exams.filter(exam => {
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
  }, [dashData.assignedExams, searchQuery, filterSemester, filterProgram]);

  const uniquePrograms = useMemo(() => {
    const progs = new Set();
    dashData.assignedExams.forEach(exam => {
      if (exam.program_name) progs.add(exam.program_name);
    });
    return Array.from(progs).sort();
  }, [dashData.assignedExams]);

  const uniqueSemesters = useMemo(() => {
    const sems = new Set();
    dashData.assignedExams.forEach(exam => {
      if (exam.semester) sems.add(exam.semester);
    });
    return Array.from(sems).sort();
  }, [dashData.assignedExams]);

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
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* Program Dropdown */}
            <div className="relative w-full md:w-44">
              <select
                value={filterProgram}
                onChange={(e) => setFilterProgram(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 pr-10 text-[13px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Programs</option>
                {uniquePrograms.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <GraduationCap size={14} />
              </div>
            </div>
            {/* Semester Dropdown */}
            <div className="relative w-full md:w-44">
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full appearance-none bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 pr-10 text-[13px] font-bold text-slate-600 focus:border-indigo-500 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Semesters</option>
                {uniqueSemesters.map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <Calendar size={14} />
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
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* Approval Window Banner */}
        {roadmapWindow && roadmapWindow.milestone && (() => {
          const ms = roadmapWindow.milestone;
          const fmtDate = (d) => {
            if (!d) return 'N/A';
            const dt = new Date(d);
            return `${String(dt.getDate()).padStart(2,'0')}-${String(dt.getMonth()+1).padStart(2,'0')}-${dt.getFullYear()} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
          };
          const isOpen = roadmapWindow.status === 'open';
          const isNotYet = roadmapWindow.status === 'not_yet_open';
          const isClosed = roadmapWindow.status === 'closed';
          const noMilestone = roadmapWindow.status === 'no_milestone';
          if (noMilestone) return null;

          return (
            <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border ${
              isOpen ? 'bg-indigo-50/60 border-indigo-100' :
              isNotYet ? 'bg-amber-50/60 border-amber-100' :
              'bg-red-50/60 border-red-100'
            } animate-in fade-in duration-500`}>
              {/* Clock icon box */}
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${
                isOpen ? 'bg-indigo-100/80 text-indigo-500' :
                isNotYet ? 'bg-amber-100/80 text-amber-500' :
                'bg-red-100/80 text-red-500'
              }`}>
                <Clock size={20} />
              </div>
              {/* Label + dates */}
              <div>
                <p className={`text-[11px] font-black tracking-widest uppercase mb-0.5 ${
                  isOpen ? 'text-indigo-400' : isNotYet ? 'text-amber-500' : 'text-red-400'
                }`}>
                  {isClosed ? 'Submission Window Closed' : isNotYet ? 'Submission Window Not Yet Open' : 'Approval Window'}
                </p>
                <p className={`font-black text-sm ${
                  isOpen ? 'text-indigo-700' : isNotYet ? 'text-amber-700' : 'text-red-600'
                }`}>
                  {fmtDate(ms.start_date)} to {fmtDate(ms.end_date)}
                </p>
              </div>
              {/* Validation disabled note */}
              {!roadmapWindow.validationEnabled && (
                <span className="ml-auto text-[11px] font-black text-slate-400 tracking-widest bg-slate-100 px-3 py-1 rounded-full">Validation Off</span>
              )}
            </div>
          );
        })()}

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
                  { (searchQuery || filterSemester !== 'all') && (
                    <button 
                      onClick={() => { setSearchQuery(''); setFilterSemester('all'); }}
                      className="text-[12px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-widest"
                    >
                      Clear All Filters
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
                             (roadmapWindow && roadmapWindow.validationEnabled && roadmapWindow.milestone?.end_date)
                               ? formatDate(roadmapWindow.milestone.end_date)
                               : (exam.exam_date && !isNaN(new Date(exam.exam_date)) 
                                   ? formatDate(new Date(new Date(exam.exam_date).getTime() - 20 * 24 * 60 * 60 * 1000)) 
                                   : 'TBD')
                          }</p>
                        </div>
                      </div>
                    </div>

                    {(Number(exam.sets_submitted) === 0 || exam.latest_status === 'Revision') && (() => {
                      const uploadBlocked = roadmapWindow && roadmapWindow.validationEnabled && roadmapWindow.milestone && roadmapWindow.status !== 'open';
                      return (
                        <div className="flex flex-col sm:flex-row items-center gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-slate-50">
                          {uploadBlocked ? (
                            <div className="flex items-center gap-2 px-5 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold min-w-[200px] justify-center">
                              <AlertCircle size={16} className="text-amber-400" />
                              {roadmapWindow.status === 'not_yet_open' ? 'Window Not Open' : 'Window Closed'}
                            </div>
                          ) : (
                            <>
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
                               className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 text-white font-black px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 text-sm tracking-widest min-w-[200px]"
                              >
                               {uploading === exam.subject_id ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                               {uploading === exam.subject_id ? 'Encrypting...' : 'Upload Question Paper'}
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}

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
