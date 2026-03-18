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

  // Calculate SGPA for each student
  const studentSGPA = marks.reduce((acc, curr) => {
    if (!acc[curr.student_id]) {
      acc[curr.student_id] = { totalCredits: 0, totalCreditPoints: 0 };
    }
    acc[curr.student_id].totalCredits += parseFloat(curr.credits || 0);
    acc[curr.student_id].totalCreditPoints += parseFloat(curr.credit_points || 0);
    return acc;
  }, {});

  // Group by Subject and inject SGPA
  const groupedData = marks.reduce((acc, curr) => {
    if (!acc[curr.subject_name]) {
      acc[curr.subject_name] = [];
    }
    const studentStats = studentSGPA[curr.student_id];
    const sgpa = studentStats.totalCredits > 0 
      ? (studentStats.totalCreditPoints / studentStats.totalCredits).toFixed(2) 
      : '0.00';
      
    acc[curr.subject_name].push({ ...curr, sgpa });
    return acc;
  }, {});

  const subjectNames = Object.keys(groupedData);

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
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mt-1">External Assessment Overview</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Students</p>
                  <p className="text-2xl font-black">{groupedData[activeSubject]?.length || 0}</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-3xl text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Average</p>
                  <p className="text-2xl font-black">
                    {(groupedData[activeSubject]?.reduce((acc, curr) => acc + parseFloat(curr.total_marks || 0), 0) / groupedData[activeSubject]?.length).toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-48">Roll Number</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Identity</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Internal</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">External</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total Score</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade Points</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credits</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credit Pts</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SGPA</th>
                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-48">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {groupedData[activeSubject]
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
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-slate-200">
                              {item.student_name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-black text-slate-800 text-sm tracking-tight">{item.student_name}</p>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.exam_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center font-bold text-slate-400">
                          {item.internal_marks || 0}
                        </td>
                        <td className="px-10 py-6 text-center font-black text-indigo-600">
                          {item.external_marks || 0}
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="text-xl font-black text-slate-900 flex flex-col items-center">
                            {item.total_marks || 0}
                            <div className="w-12 h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${Math.min(item.total_marks, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm border-2 ${
                            ['O', 'A+', 'A'].includes(item.grade) ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            ['B+', 'B'].includes(item.grade) ? 'bg-sky-50 text-sky-600 border-sky-100' :
                            ['C'].includes(item.grade) ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {item.grade}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center font-black text-slate-700">
                          {item.grade_point}
                        </td>
                        <td className="px-10 py-6 text-center font-bold text-slate-500">
                          {item.credits || 0}
                        </td>
                        <td className="px-10 py-6 text-center font-black text-indigo-500">
                          {item.credit_points || 0}
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs shadow-lg shadow-slate-200">
                            {item.sgpa}
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`inline-flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-wider border ${item.result_status === 'Pass'
                                ? 'text-emerald-500 bg-emerald-50 border-emerald-100'
                                : 'text-rose-500 bg-rose-50 border-rose-100'
                              }`}>
                              {item.result_status === 'Pass' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                              {item.result_status}
                            </div>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
                              {item.marks_status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityMarksView;
