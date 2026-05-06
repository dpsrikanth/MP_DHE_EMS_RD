import React, { useState, useEffect } from "react";
import { 
  Save, Send, AlertCircle, Info, 
  Search, FileEdit, CheckCircle2,
  GraduationCap, BookOpen, Loader2, Filter,
  UserCircle, ClipboardCheck, Unlock,
  Download, Upload, FileSpreadsheet, ChevronDown
} from "lucide-react";
import { toast } from 'react-toastify';
import Papa from 'papaparse';
import { marksApi } from '../../api/marksApi';
import BulkImportModal from "../../components/BulkImportModal";

const ExternalMarksEntry = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modifiedMarks, setModifiedMarks] = useState({}); // { student_id_subject_id_exam_id: marks }
  const [showImportModal, setShowImportModal] = useState(false);
  const [activeSubjectForImport, setActiveSubjectForImport] = useState(null);
  const [showBulkMenu, setShowBulkMenu] = useState(null); // subject_id

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await marksApi.getExternalAssignments();
      if (data) {
        setAssignments(data);
        
        // Populate initial marks
        const initials = {};
        data.forEach(a => {
          const key = `${a.student_id}_${a.subject_id}_${a.exam_id}`;
          initials[key] = a.external_marks !== null ? a.external_marks : "";
        });
        setModifiedMarks(initials);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
      if (!silent) toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to load assignments");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleMarkChange = (studentId, subjectId, examId, value) => {
    const key = `${studentId}_${subjectId}_${examId}`;
    setModifiedMarks(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSubjectDraft = async (subjectGroup, examName) => {
    const marksToSave = subjectGroup.students.map(s => {
      const key = `${s.student_id}_${s.subject_id}_${s.exam_id}`;
      return {
        student_id: s.student_id,
        exam_id: s.exam_id,
        subject_id: s.subject_id,
        external_marks: modifiedMarks[key],
        academic_year_id: s.academic_year_id
      };
    });

    setSubmitting(true);
    try {
      await marksApi.saveExternalMarks({ marksData: marksToSave });

      toast.success(`Draft saved for ${subjectGroup.subject_name}`);
      fetchAssignments(true); // Silent refresh
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred during saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSubject = async (subjectGroup, examName) => {
    toast.info(`Finalizing marks for ${subjectGroup.subject_name} in ${examName}...`);

    setSubmitting(true);
    try {
      // 1. First Save the current marks as draft
      const marksToSave = subjectGroup.students.map(s => {
        const key = `${s.student_id}_${s.subject_id}_${s.exam_id}`;
        return {
          student_id: s.student_id,
          exam_id: s.exam_id,
          subject_id: s.subject_id,
          external_marks: modifiedMarks[key],
          academic_year_id: s.academic_year_id
        };
      });

      await marksApi.saveExternalMarks({ marksData: marksToSave });

      const uniqueExamIds = [...new Set(subjectGroup.students.map(s => s.exam_id))];

      // 2. Then Finalize
      await marksApi.finalizeExternalMarks({ 
          exam_ids: uniqueExamIds,
          subject_ids: [subjectGroup.subject_id] 
      });

      toast.success(`Marks for ${subjectGroup.subject_name} submitted successfully`);
      fetchAssignments(true); // Silent refresh
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || error.message || "An error occurred during finalization");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlockSubject = async (subjectGroup, examName) => {
    if (!window.confirm(`Are you sure you want to unlock ${subjectGroup.subject_name} for corrections?`)) return;

    setSubmitting(true);
    try {
      const uniqueExamIds = [...new Set(subjectGroup.students.map(s => s.exam_id))];

      await marksApi.unlockExternalSubject({ 
          exam_ids: uniqueExamIds,
          subject_ids: [subjectGroup.subject_id] 
      });

      toast.success(`Subject ${subjectGroup.subject_name} is now enabled for editing`);
      fetchAssignments(true); // Silent refresh
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data?.error || "An error occurred during unlock");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = (subject) => {
    const csv = Papa.unparse([
      {
        "Roll Number": "SAMPLE123",
        "Student Name": "Sample Student",
        "External Marks": "55",
        "Attendance": "PRESENT"
      }
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `External_Marks_Template_${subject.subject_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = (subject) => {
    const data = subject.students.map(s => {
      const key = `${s.student_id}_${s.subject_id}_${s.exam_id}`;
      return {
        "Roll Number": s.rollnumber,
        "Student Name": s.student_name,
        "External Marks": modifiedMarks[key] || "",
        "Attendance": s.is_absent ? "ABSENT" : "PRESENT",
        "Status": s.marks_status || "Draft"
      };
    });
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `External_Marks_${subject.subject_name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nested Grouping by Exam -> Subject
  const rawGrouped = assignments.reduce((acc, curr) => {
    const eKey = curr.exam_name;
    const sKey = curr.subject_name;

    if (!acc[eKey]) {
      acc[eKey] = {
        exam_name: curr.exam_name,
        subjects: {}
      };
    }

    if (!acc[eKey].subjects[sKey]) {
      acc[eKey].subjects[sKey] = {
        subject_id: curr.subject_id,
        subject_name: curr.subject_name,
        // Mark statuses of all students in this subject to derive subject-level status
        student_marks_statuses: [], 
        students: []
      };
    }

    acc[eKey].subjects[sKey].students.push(curr);
    acc[eKey].subjects[sKey].student_marks_statuses.push(curr.marks_status);
    return acc;
  }, {});

  // Derive consolidated status for each subject group from STUDENT MARKS
  // This ensures subject isolation even if assignment ID is shared (Series level)
  const groupedData = Object.keys(rawGrouped).reduce((acc, eKey) => {
    const exam = rawGrouped[eKey];
    const processedSubjects = Object.keys(exam.subjects).reduce((sAcc, sKey) => {
      const subject = exam.subjects[sKey];
      const marksStatuses = [...new Set(subject.student_marks_statuses)];
      
      // If ALL students' marks are 'Pending Approval' (submitted to university), 
      // then the subject group is considered 'Submitted'
      let consolidatedStatus = 'Assigned';
      if (marksStatuses.length > 0 && marksStatuses.every(st => st === 'Pending Approval')) {
        consolidatedStatus = 'Submitted';
      } else if (marksStatuses.includes('Draft') || marksStatuses.includes('Pending Approval')) {
        // If some are draft and some are pending, it's 'Evaluated' (Draft Saved)
        consolidatedStatus = 'Evaluated'; 
      }

      sAcc[sKey] = { 
        ...subject, 
        assignment_status: consolidatedStatus 
      };
      return sAcc;
    }, {});

    acc[eKey] = { ...exam, subjects: processedSubjects };
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-indigo-500">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-black  tracking-widest text-[13px]">Initializing Evaluation Space...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic">External Portal</h1>
            <p className="text-[12px] text-slate-400 font-black  tracking-[0.2em] mt-2">Subject-Wise Evaluation Hub</p>
          </div>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search by Roll, Name, or Subject..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 bg-white border-2 border-slate-100 rounded-2x shadow-sm pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {Object.values(groupedData).length > 0 ? (
        Object.values(groupedData).map((exam, examIdx) => (
          <div key={examIdx} className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="h-px flex-1 bg-slate-100"></div>
              <h2 className="text-sm font-black text-slate-400  tracking-[0.3em] italic">{exam.exam_name}</h2>
              <div className="h-px flex-1 bg-slate-100"></div>
            </div>

            <div className="grid grid-cols-1 gap-12">
              {Object.values(exam.subjects).map((subject, subIdx) => {
                // Check if any student matches the search
                const filteredStudents = subject.students.filter(s => 
                  s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  s.rollnumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (filteredStudents.length === 0) return null;

                return (
                  <div key={subIdx} className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden group hover:border-indigo-200 transition-all duration-500">
                    <div className="bg-indigo-600 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 group-hover:bg-slate-950 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/20 rounded-xl"><BookOpen size={20} className="text-indigo-400" /></div>
                          <h3 className="text-2xl font-black tracking-tight">{subject.subject_name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[12px] font-black  tracking-widest px-4 py-1.5 rounded-full border ${
                            subject.assignment_status === 'Submitted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
                            'bg-indigo-/20 text-indigo-400 border-indigo-/20'
                          }`}>
                            {subject.assignment_status === 'Evaluated' ? 'Draft Saved' : subject.assignment_status}
                          </span>
                          <span className="text-[12px] font-black text-slate-500  tracking-widest">
                            {filteredStudents.length} Students Registered
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Bulk Actions Menu */}
                        {subject.assignment_status !== 'Submitted' && (
                          <div className="relative">
                            <button 
                              onClick={() => setShowBulkMenu(showBulkMenu === subject.subject_id ? null : subject.subject_id)}
                              className="h-14 px-6 bg-white/10 hover:bg-white/20 text-white text-[12px] font-black tracking-[0.2em] rounded-2xl border border-white/10 flex items-center gap-3 transition-all"
                            >
                              <FileSpreadsheet size={18} /> Bulk Actions <ChevronDown size={14} />
                            </button>
                            
                            {showBulkMenu === subject.subject_id && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in zoom-in duration-200">
                                <button 
                                  onClick={() => {
                                    setActiveSubjectForImport(subject);
                                    setShowImportModal(true);
                                    setShowBulkMenu(null);
                                  }}
                                  className="w-full px-6 py-3 text-left text-[12px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 tracking-wider transition-colors"
                                >
                                  <Upload size={16} className="text-indigo-500" /> Import CSV
                                </button>
                                <button 
                                  onClick={() => {
                                    downloadTemplate(subject);
                                    setShowBulkMenu(null);
                                  }}
                                  className="w-full px-6 py-3 text-left text-[12px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 tracking-wider transition-colors"
                                >
                                  <Download size={16} className="text-blue-500" /> Download Template
                                </button>
                                <div className="h-px bg-slate-50 mx-4 my-2"></div>
                                <button 
                                  onClick={() => {
                                    exportToCSV(subject);
                                    setShowBulkMenu(null);
                                  }}
                                  className="w-full px-6 py-3 text-left text-[12px] font-black text-slate-700 hover:bg-slate-50 flex items-center gap-3 tracking-wider transition-colors"
                                >
                                  <FileSpreadsheet size={16} className="text-emerald-500" /> Export CSV
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {subject.assignment_status === 'Submitted' ? (
                          <button 
                            onClick={() => handleUnlockSubject(subject, exam.exam_name)}
                            disabled={submitting}
                            className="h-14 px-8 bg-indigo-500 hover:bg-indigo-600 text-white text-[12px] font-black  tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-900/20 flex items-center gap-3 transition-all disabled:opacity-30"
                          >
                            <Unlock size={16} /> Enable / Unlock
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleSaveSubjectDraft(subject, exam.exam_name)}
                              disabled={submitting || subject.assignment_status === 'Submitted'}
                              className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white text-[12px] font-black  tracking-[0.2em] rounded-2xl border border-white/10 flex items-center gap-3 transition-all disabled:opacity-30"
                            >
                              <Save size={16} /> Save Draft
                            </button>
                            <button 
                              onClick={() => handleFinalizeSubject(subject, exam.exam_name)}
                              disabled={submitting || subject.assignment_status === 'Submitted'}
                              className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-black  tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center gap-3 transition-all disabled:opacity-30"
                            >
                              <Send size={16} /> Finalize Subject
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 border-b">
                            <th className="px-10 py-5 text-[13px] font-black text-slate-400  tracking-widest w-48">Roll Number</th>
                            <th className="px-10 py-5 text-[13px] font-black text-slate-400  tracking-widest">Student Information</th>
                            <th className="px-10 py-5 text-[13px] font-black text-slate-400  tracking-widest text-center w-64">External Marks (Max: 70)</th>
                            <th className="px-10 py-5 text-[13px] font-black text-slate-400  tracking-widest text-center w-40">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filteredStudents.map((item) => {
                            const key = `${item.student_id}_${item.subject_id}_${item.exam_id}`;
                            const extVal = parseFloat(modifiedMarks[key] || 0);
                            const isPass = extVal >= 28;

                            return (
                              <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-10 py-5">
                                  <span className="text-sm font-black text-slate-900 tracking-tighter">#{item.rollnumber}</span>
                                </td>
                                <td className="px-10 py-5">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-[13px] ">
                                      {item.student_name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <p className="font-black text-slate-700 text-sm tracking-tight">{item.student_name}</p>
                                  </div>
                                </td>
                                <td className="px-10 py-5 text-center">
                                  <div className="flex flex-col items-center">
                                    <input 
                                      type="number"
                                      max="70"
                                      disabled={subject.assignment_status === 'Submitted' || submitting}
                                      value={modifiedMarks[key] || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || (Number(val) >= 0 && Number(val) <= 70)) {
                                          handleMarkChange(item.student_id, item.subject_id, item.exam_id, val);
                                        }
                                      }}
                                      placeholder="00"
                                      className="w-24 h-11 bg-white border-2 border-slate-100 rounded-xl px-4 text-center text-lg font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all disabled:opacity-30"
                                    />
                                    <p className="text-[8px] font-black text-slate-300 mt-1  tracking-tighter">Subject Pass: 28</p>
                                  </div>
                                </td>
                                <td className="px-10 py-5 text-center">
                                  {modifiedMarks[key] !== "" ? (
                                    <div className={`inline-flex items-center gap-2 text-[12px] font-black px-3 py-1.5 rounded-full  tracking-wider ${
                                      isPass ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'
                                    }`}>
                                      {isPass ? (<><CheckCircle2 size={12} /> Pass</>) : (<><AlertCircle size={12} /> Fail</>)}
                                    </div>
                                  ) : (
                                    <span className="text-[12px] font-black text-slate-300  tracking-wider">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-[4rem] p-32 text-center border-4 border-dashed border-slate-100 flex flex-col items-center gap-10 shadow-inner">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
            <AlertCircle size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-900  tracking-tighter italic">Awaiting Assignments</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">Your evaluation dashboard will populate automatically once the University Administrator assigns exams to your profile.</p>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && activeSubjectForImport && (
        <BulkImportModal 
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setActiveSubjectForImport(null);
          }}
          onSuccess={() => {
            fetchAssignments(true);
            setShowImportModal(false);
            setActiveSubjectForImport(null);
          }}
          entityName="marks"
          endpoint="/external-faculty/bulk-upload"
          extraPayload={{
            subject_id: activeSubjectForImport.subject_id,
            exam_id: activeSubjectForImport.students[0]?.exam_id,
            academic_year_id: activeSubjectForImport.students[0]?.academic_year_id
          }}
          expectedColumns={{
            enrollment_number: 'Roll Number',
            external_marks: 'External Marks',
            is_absent: 'Attendance'
          }}
        />
      )}
    </div>
  );
};

export default ExternalMarksEntry;
