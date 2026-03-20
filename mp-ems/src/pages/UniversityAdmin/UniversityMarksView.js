import React, { useState, useEffect } from "react";
import {
  CheckCircle2, AlertCircle, Loader2, BookOpen,
  Search, Users, GraduationCap, ClipboardCheck,
  TrendingUp, ArrowLeftRight, FileText
} from "lucide-react";
import { toast } from 'react-toastify';

const UniversityMarksView = () => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("subject"); // "subject" or "student"
  const [activeSubject, setActiveSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/university-admin/finalized-external-marks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMarks(data);
        if (data.length > 0 && !activeSubject) {
          setActiveSubject(data[0].subject_name);
        }
      }
    } catch (error) {
      console.error("Failed to fetch marks:", error);
      toast.error("Failed to load finalized marks");
    } finally {
      setLoading(false);
    }
  };

  // 1. Calculate SGPA and group by Student
  const studentWiseData = marks.reduce((acc, curr) => {
    if (!acc[curr.student_id]) {
      acc[curr.student_id] = {
        student_id: curr.student_id,
        student_name: curr.student_name,
        rollnumber: curr.rollnumber,
        college_name: curr.college_name,
        program_name: curr.program_name,
        exam_name: curr.exam_name,
        subjects: [],
        totalCredits: 0,
        totalCreditPoints: 0
      };
    }
    const credits = parseFloat(curr.credits || 0);
    const creditPoints = parseFloat(curr.credit_points || 0);

    acc[curr.student_id].subjects.push({ ...curr, credits, credit_points: creditPoints });
    acc[curr.student_id].totalCredits += credits;
    acc[curr.student_id].totalCreditPoints += creditPoints;
    return acc;
  }, {});

  // Inject SGPA and normalize
  const studentList = Object.values(studentWiseData).map(student => {
    const sgpa = student.totalCredits > 0 
      ? (student.totalCreditPoints / student.totalCredits).toFixed(2) 
      : '0.00';
    return { ...student, sgpa };
  });

  // 2. Group by Subject (Original View)
  const subjectWiseData = marks.reduce((acc, curr) => {
    if (!acc[curr.subject_name]) {
      acc[curr.subject_name] = [];
    }
    const credits = parseFloat(curr.credits || 0);
    const creditPoints = parseFloat(curr.credit_points || 0);
    
    acc[curr.subject_name].push({ ...curr, credits, credit_points: creditPoints });
    return acc;
  }, {});

  const subjectNames = Object.keys(subjectWiseData);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-indigo-500">
        <Loader2 className="w-12 h-12 animate-spin" />
        <p className="font-black uppercase tracking-widest text-xs italic">Aggregating University Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-indigo-400 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
            <ClipboardCheck size={40} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">External Results</h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-3">University Administration Portal</p>
          </div>
        </div>

        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by Roll or Student Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-16 bg-white border-4 border-slate-50 rounded-[1.5rem] shadow-sm pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 shadow-indigo-100/20"
          />
        </div>
      </div>

      {marks.length === 0 ? (
        <div className="bg-white rounded-[4rem] p-32 text-center border-4 border-dashed border-slate-100 flex flex-col items-center gap-10">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
            <FileText size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">No Data Available</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">No marks have been finalized by external faculty yet. Please check back later.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dashboard Actions & View Toggle */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
             <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
               <button 
                onClick={() => setViewMode("subject")}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'subject' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 By Subject
               </button>
               <button 
                onClick={() => setViewMode("student")}
                className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'student' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 By Student
               </button>
             </div>

             <div className="flex items-center gap-4 text-slate-400">
               <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                 <Users size={16} />
                 <span className="text-xs font-bold text-slate-600">{studentList.length} Students Total</span>
               </div>
             </div>
          </div>

          {viewMode === "subject" ? (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              {/* Tabs Navigation */}
              <div className="flex flex-wrap gap-3 pb-2 border-b-2 border-slate-50">
                {subjectNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSubject(name)}
                    className={`h-12 px-8 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSubject === name
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 scale-105'
                        : 'bg-white text-slate-400 border-2 border-slate-50 hover:border-indigo-200 hover:text-indigo-500'
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Active Subject Content */}
              <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                        <BookOpen size={24} className="text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight">{activeSubject}</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mt-1">Subject-wise Result Ledger</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Class Size</p>
                      <p className="text-2xl font-black">{subjectWiseData[activeSubject]?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-auto max-h-[600px] scrollbar-premium">
                  <table className="w-full text-left relative border-collapse">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Roll No</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Int</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ext</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic">Total</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GP</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credits</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cr. Pts</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {subjectWiseData[activeSubject]
                        ?.filter(s =>
                          s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.rollnumber.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                          <tr key={`${item.student_id}-${item.subject_id}`} className="hover:bg-slate-50/50 transition-all duration-300 group">
                            <td className="px-10 py-6">
                              <span className="text-sm font-black text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                #{item.rollnumber}
                              </span>
                            </td>
                            <td className="px-10 py-6">
                              <p className="font-black text-slate-800 text-sm tracking-tight">{item.student_name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.exam_name}</p>
                            </td>
                            <td className="px-10 py-6 text-center font-bold text-slate-400">
                              {item.internal_marks || 0}
                            </td>
                            <td className="px-10 py-6 text-center font-black text-indigo-600">
                              {item.external_marks || 0}
                            </td>
                            <td className="px-10 py-6 text-center">
                              <span className="text-lg font-black text-slate-900">{item.total_marks || 0}</span>
                            </td>
                            <td className="px-10 py-6 text-center font-black text-slate-700">
                              {item.grade}
                            </td>
                            <td className="px-10 py-6 text-center font-black text-slate-500 italic text-xs">
                              {item.grade_point}
                            </td>
                            <td className="px-10 py-6 text-center font-bold text-slate-600">
                              {item.credits || 0}
                            </td>
                            <td className="px-10 py-6 text-center font-black text-indigo-500">
                              {item.credit_points || 0}
                            </td>
                            <td className="px-10 py-6 text-center">
                              <div className={`inline-flex items-center gap-2 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border ${item.result_status === 'Pass'
                                  ? 'text-emerald-500 bg-emerald-50 border-emerald-100'
                                  : 'text-rose-500 bg-rose-50 border-rose-100'
                                }`}>
                                {item.result_status === 'Pass' ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {item.result_status}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-600 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-lg">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight italic">Student Ledger</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mt-1">Consolidated Student Performance & SGPA</p>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 px-8 py-4 rounded-3xl backdrop-blur-md">
                   <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Total Credits</p>
                   <p className="text-2xl font-black">{studentList.reduce((acc, s) => acc + s.totalCredits, 0)} Pts</p>
                </div>
              </div>

              <div className="overflow-auto max-h-[600px] scrollbar-premium">
                <table className="w-full text-left relative border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Information</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">College / Program</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Subject Count</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Earned Credits</th>
                      <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center bg-indigo-50 text-indigo-600">Final SGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentList
                      .filter(s =>
                        s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.rollnumber.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((student) => (
                        <tr key={student.student_id} className="hover:bg-indigo-50/20 transition-all duration-300 group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-900 rounded-[1.2rem] flex items-center justify-center text-white text-xs font-black group-hover:bg-indigo-600 group-hover:rotate-6 transition-all shadow-lg shadow-slate-200">
                                <GraduationCap size={18} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm tracking-tight capitalize">{student.student_name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-0.5 tracking-widest">Roll: {student.rollnumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                             <div className="flex items-center gap-2 mb-1">
                               <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                               <p className="text-[10px] font-bold text-slate-600 truncate max-w-[250px]">
                                 {student.college_name || "N/A"}
                               </p>
                             </div>
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-3.5 italic">
                               {student.program_name || "Unassigned"}
                             </p>
                          </td>
                          <td className="px-10 py-6 text-center">
                            <span className="px-4 py-1.5 bg-slate-100 rounded-xl text-xs font-black text-slate-500 border border-slate-200 shadow-sm">
                              {student.subjects.length}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-center font-bold text-slate-500">
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-black text-slate-700">{student.totalCredits}</span>
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Total</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-center bg-indigo-50/30">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-2xl font-black text-indigo-600 leading-none drop-shadow-sm">{student.sgpa}</span>
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="w-12 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(parseFloat(student.sgpa)/10)*100}%` }} />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversityMarksView;
