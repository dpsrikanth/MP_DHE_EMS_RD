import React, { useState, useEffect } from "react";
import { 
  Save, Send, AlertCircle, Info, 
  Search, FileEdit, CheckCircle2,
  GraduationCap, BookOpen, Loader2, Filter,
  UserCircle, ClipboardCheck
} from "lucide-react";
import { toast } from 'react-toastify';

const ExternalMarksEntry = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [modifiedMarks, setModifiedMarks] = useState({}); // { student_id_subject_id_exam_id: marks }

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/external-faculty/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
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
      toast.error("Failed to load assignments");
    } finally {
      setLoading(false);
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
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/external-faculty/save-marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ marksData: marksToSave })
      });

      if (res.ok) {
        toast.success(`Draft saved for ${subjectGroup.subject_name}`);
        fetchAssignments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save marks");
      }
    } catch (error) {
      toast.error("An error occurred during saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizeSubject = async (subjectGroup, examName) => {
    toast.info(`Finalizing marks for ${subjectGroup.subject_name} in ${examName}...`);

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
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

      const saveRes = await fetch('http://localhost:8080/api/external-faculty/save-marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ marksData: marksToSave })
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        throw new Error(saveData.error || "Failed to save marks before finalization");
      }

      // 2. Then Finalize
      const res = await fetch('http://localhost:8080/api/external-faculty/finalize-marks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          exam_id: subjectGroup.students[0].exam_id,
          subject_ids: [subjectGroup.subject_id] 
        })
      });

      if (res.ok) {
        toast.success(`Marks for ${subjectGroup.subject_name} submitted successfully`);
        fetchAssignments();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to finalize marks");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during finalization");
    } finally {
      setSubmitting(false);
    }
  };

  // Nested Grouping by Exam -> Subject
  const groupedData = assignments.reduce((acc, curr) => {
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
        assignment_status: curr.assignment_status, // This is at least one assignment status
        students: []
      };
    }

    acc[eKey].subjects[sKey].students.push(curr);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-indigo-500">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs">Initializing Evaluation Space...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic">External Portal</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Subject-Wise Evaluation Hub</p>
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
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] italic">{exam.exam_name}</h2>
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
                    <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 group-hover:bg-slate-950 transition-colors">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/20 rounded-xl"><BookOpen size={20} className="text-indigo-400" /></div>
                          <h3 className="text-2xl font-black tracking-tight">{subject.subject_name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                            subject.assignment_status === 'Submitted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
                            'bg-amber-500/20 text-amber-400 border-amber-500/20'
                          }`}>
                            {subject.assignment_status === 'Evaluated' ? 'Draft Saved' : subject.assignment_status}
                          </span>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {filteredStudents.length} Students Registered
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         <button 
                          onClick={() => handleSaveSubjectDraft(subject, exam.exam_name)}
                          disabled={submitting || subject.assignment_status === 'Submitted'}
                          className="h-14 px-8 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl border border-white/10 flex items-center gap-3 transition-all disabled:opacity-30"
                        >
                          <Save size={16} /> Save Draft
                        </button>
                        <button 
                          onClick={() => handleFinalizeSubject(subject, exam.exam_name)}
                          disabled={submitting || subject.assignment_status === 'Submitted'}
                          className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center gap-3 transition-all disabled:opacity-30"
                        >
                          <Send size={16} /> Finalize Subject
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 border-b">
                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Roll Number</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-64">External Marks (Max: 70)</th>
                            <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-40">Status</th>
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
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase">
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
                                    <p className="text-[8px] font-black text-slate-300 mt-1 uppercase tracking-tighter">Subject Pass: 28</p>
                                  </div>
                                </td>
                                <td className="px-10 py-5 text-center">
                                  {modifiedMarks[key] !== "" ? (
                                    <div className={`inline-flex items-center gap-2 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                                      isPass ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50'
                                    }`}>
                                      {isPass ? (<><CheckCircle2 size={12} /> Pass</>) : (<><AlertCircle size={12} /> Fail</>)}
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Pending</span>
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
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Awaiting Assignments</h3>
            <p className="text-slate-400 font-medium max-w-md mx-auto">Your evaluation dashboard will populate automatically once the University Administrator assigns exams to your profile.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalMarksEntry;
