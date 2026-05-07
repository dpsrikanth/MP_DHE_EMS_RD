import React, { useState, useEffect } from "react";
import { 
  Users, UserPlus, CheckCircle, Clock, AlertCircle, 
  Search, Filter, BookOpen, UserCheck, GraduationCap, 
  Building, Calendar, Info, ShieldCheck, Hash
} from "lucide-react";
import { toast } from 'react-toastify';
import { universityAdminApi } from '../../api/universityAdminApi';

const ExternalAssignment = () => {
  const [faculties, setFaculties] = useState([]);
  const [pendingExams, setPendingExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [facultyData, pendingData, assignmentData] = await Promise.all([
        universityAdminApi.getExternalFaculties(),
        universityAdminApi.getPendingExternalAssignments(),
        universityAdminApi.getExternalAssignments()
      ]);

      if (facultyData) setFaculties(facultyData);
      if (pendingData) setPendingExams(pendingData);
      if (assignmentData) setAssignments(assignmentData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) ? prev.filter(i => i !== examId) : [...prev, examId]
    );
  };

  const handleAssign = async () => {
    if (!selectedFaculty) {
      toast.warning("Please select an external faculty");
      return;
    }
    if (selectedExams.length === 0) {
      toast.warning("Please select at least one exam");
      return;
    }

    setSubmitting(true);
    try {
      for (const examId of selectedExams) {
        await universityAdminApi.assignExternalFaculty({
          faculty_user_id: selectedFaculty,
          exam_id: examId,
          subject_ids: [] // Empty means Exam-level assignment
        });
      }

      toast.success("External faculty assigned to exams successfully");
      setSelectedExams([]);
      setSelectedFaculty("");
      fetchData();
    } catch (error) {
      console.error("Assignment error:", error);
      toast.error(error.message || "An error occurred during assignment");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPending = pendingExams.filter(e => 
    e.exam_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = assignments.filter(a => 
    a.faculty_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.exam_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading assignment modules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-5 space-y-4 animate-in fade-in duration-500">
      <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic text-indigo-400">Exam Evaluation Control</h1>
            <p className="text-slate-400 max-w-xl text-lg font-medium leading-relaxed">
              Assign external faculty to Exams. Assigned faculty will see all registered students and all their subjects for that exam.
            </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl">
            <GraduationCap size={40} className="text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("pending")} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "pending" ? "bg-white text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-700"}`}>Pending Exams</button>
          <button onClick={() => setActiveTab("history")} className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === "history" ? "bg-white text-slate-900 shadow-lg" : "text-slate-500 hover:text-slate-700"}`}>Assignment History</button>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search exams or faculty..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-medium" />
        </div>
      </div>

      {activeTab === "pending" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-3.5 border-b bg-slate-50/30 flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-900  tracking-tight">Available Exams</h3>
                <span className="text-[13px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full  tracking-widest">{selectedExams.length} selected</span>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                {filteredPending.map((ex) => (
                  <div key={ex.exam_id} onClick={() => handleSelectExam(ex.exam_id)} className={`p-3.5 flex items-center gap-4 cursor-pointer transition-all hover:bg-slate-50 ${selectedExams.includes(ex.exam_id) ? 'bg-indigo-50/50' : ''}`}>
                    <input type="checkbox" checked={selectedExams.includes(ex.exam_id)} readOnly className="w-5 h-5 rounded-lg border-slate-300 text-indigo-500" />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black"><Building size={20} /></div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{ex.exam_name}</p>
                          <p className="text-[12px] font-black text-slate-400  tracking-widest mt-1">ID: {ex.exam_id}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-slate-400  tracking-widest mb-1">Subjects</p>
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-slate-400" />
                          <p className="text-sm font-bold text-slate-700">{ex.subject_count} assigned subjects</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="inline-flex flex-col items-end">
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                                <Users size={12} />
                                <p className="text-sm font-black">{ex.student_count}</p>
                            </div>
                            <p className="text-[9px] font-black text-slate-400  mt-1 tracking-widest">Registered Students</p>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 sticky top-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
               <div className="p-5 bg-indigo-600 text-white"><h3 className="text-xl font-black  tracking-tight">Assign Evaluator</h3></div>
               <div className="p-5 space-y-4">
                  <div className="space-y-3">
                    <label className="text-[13px] font-black text-slate-400  tracking-widest">External Faculty</label>
                    <select value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-5 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10">
                      <option value="">Select Faculty...</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 flex gap-3 text-amber-700">
                    <Info size={18} className="shrink-0" />
                    <p className="text-[12px] font-bold leading-relaxed tracking-tight">
                      Selected faculty will evaluate ALL subjects for all {selectedExams.reduce((acc, id) => acc + (pendingExams.find(e => e.exam_id === id)?.student_count || 0), 0)} registered students across the selected exams.
                    </p>
                  </div>
                  <button onClick={handleAssign} disabled={submitting || selectedExams.length === 0} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3">
                    {submitting ? <Clock size={18} className="animate-spin" /> : <UserCheck size={20} />}
                    {submitting ? "Processing..." : "Confirm Assignment"}
                  </button>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left font-medium">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-6 py-3.5 text-[13px] font-black text-slate-400  tracking-widest">Evaluator</th>
                <th className="px-6 py-3.5 text-[13px] font-black text-slate-400  tracking-widest">Scope</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-400 tracking-widest">Evaluator</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-400 tracking-widest">Scope</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-400 tracking-widest">Exam</th>
                <th className="px-6 py-3 text-[11px] font-black text-slate-400 tracking-widest text-center">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y">
               {filteredAssignments.map((row) => (
                <tr key={row.assignment_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-900">{row.faculty_name}</p>
                    <p className="text-[10px] font-black text-indigo-500 tracking-widest bg-indigo-50 px-1.5 py-0.5 rounded w-fit mt-0.5">External Faculty</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{row.subject_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-600">{row.exam_name}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-slate-100 text-slate-900 px-2 py-0.5 rounded-md font-black text-xs">{row.student_count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExternalAssignment;
