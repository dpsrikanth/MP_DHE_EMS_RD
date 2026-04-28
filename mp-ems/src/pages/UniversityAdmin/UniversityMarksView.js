import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2, AlertCircle, Loader2, BookOpen,
  Search, Users, GraduationCap, ClipboardCheck,
  TrendingUp, Download, Eye, EyeOff,
  BarChart3
} from "lucide-react";
import { toast } from 'react-toastify';
import { useGradingPolicy } from "../../hooks/useGradingPolicy";
import { getGradeAndPoints, isPass, calculateSGPA } from "../../utils/gradingUtils";

const API = window.config?.api_base_url || 'http://localhost:8080/api';

const UniversityMarksView = () => {
  // Data
  const [marks, setMarks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter data
  const [exams, setExams] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Filter selections
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  // View state
  const [viewMode, setViewMode] = useState("subject");
  const [activeSubject, setActiveSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [publishing, setPublishing] = useState(false);

  const { config: gradingConfig } = useGradingPolicy();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [exRes, colRes, progRes] = await Promise.all([
          fetch(`${API}/exams`, { headers }),
          fetch(`${API}/colleges`, { headers }),
          fetch(`${API}/master-programs`, { headers })
        ]);
        if (exRes.ok) setExams(await exRes.json());
        if (colRes.ok) setColleges(await colRes.json());
        if (progRes.ok) setPrograms(await progRes.json());
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };
    fetchFilters();
  }, []);

  const uniqueExams = useMemo(() => {
    const map = new Map();
    exams.filter(e => e.exam_type === 2).forEach(e => {
      const name = e.exam_name || e.name;
      if (!name) return;
      if (!map.has(name)) map.set(name, []);
      map.get(name).push(e.id);
    });
    return map;
  }, [exams]);

  const fetchData = useCallback(async () => {
    if (!selectedExam) {
      toast.info("Please select an exam to load results.");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedExam) params.append('exam_name', selectedExam);
      if (selectedCollege) params.append('college_id', selectedCollege);
      if (selectedProgram) params.append('program_id', selectedProgram);

      const res = await fetch(`${API}/university-admin/result-hub-data?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMarks(data.marks || []);
        setSummary(data.summary || null);
        if (data.marks?.length > 0 && !activeSubject) {
          setActiveSubject(data.marks[0].subject_name);
        }
      } else {
        toast.error("Failed to load result data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Network error loading results");
    } finally {
      setLoading(false);
    }
  }, [selectedExam, selectedCollege, selectedProgram, activeSubject]);

  // Toggle results published
  const togglePublish = async () => {
    if (!selectedExam) return;
    setPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const newState = !summary?.resultsPublished;
      const ids = uniqueExams.get(selectedExam) || [];

      // Update all IDs in the series
      await Promise.all(ids.map(id => 
        fetch(`${API}/exams/${id}/publish-results`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ results_published: newState })
        })
      ));

      toast.success(`Results ${newState ? 'published' : 'unpublished'} successfully for the entire series!`);
      setSummary(prev => ({ ...prev, resultsPublished: newState }));
    } catch (err) {
      toast.error("Network error");
    } finally {
      setPublishing(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (marks.length === 0) return;
    const isInternalOnly = summary?.examType === 1;
    const headers = ["Roll No", "Student Name", "College", "Program", "Subject", "Internal"];
    if (!isInternalOnly) headers.push("External");
    headers.push("Total", "Grade", "GP", "Credits", "Credit Pts", "Result");
    
    const csvRows = [headers.join(",")];
    marks.forEach(row => {
      if (!gradingConfig) return;
      
      const internal = Number(row.internal_marks || 0);
      const external = Number(row.external_marks || 0);
      const total = isInternalOnly ? internal : (internal + external);
      
      const { grade, gradePoint } = getGradeAndPoints(total, gradingConfig.grade_scale);
      const pass = isPass(total, gradingConfig.pass_threshold) ? 'Pass' : 'Fail';
      const subjectId = row.subject_id || row.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(row.credits || 0);
      const creditPoints = gradePoint * credits;
      
      const rowData = [
        row.rollnumber, `"${row.student_name}"`, `"${row.college_name || ''}"`, `"${row.program_name || ''}"`,
        `"${row.subject_name}"`, internal
      ];
      if (!isInternalOnly) rowData.push(external);
      rowData.push(total, grade, gradePoint, credits, creditPoints, pass);
      
      csvRows.push(rowData.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const examName = selectedExam || 'results';
    a.download = `${examName}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Build graded data grouped by subject
  const subjectWiseData = useMemo(() => {
    if (!gradingConfig) return {};
    const isInternalOnly = summary?.examType === 1;
    return marks.reduce((acc, curr) => {
      if (!acc[curr.subject_name]) acc[curr.subject_name] = [];
      const internal = Number(curr.internal_marks || 0);
      const external = Number(curr.external_marks || 0);
      const totalMarks = isInternalOnly ? internal : (internal + external);
      
      const { grade, gradePoint } = getGradeAndPoints(totalMarks, gradingConfig.grade_scale);
      const subjectIsPass = isPass(totalMarks, gradingConfig.pass_threshold);
      const subjectId = curr.subject_id || curr.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(curr.credits || 0);
      acc[curr.subject_name].push({
        ...curr, total_marks: totalMarks, grade, grade_point: gradePoint,
        credits, credit_points: gradePoint * credits,
        result_status: subjectIsPass ? 'Pass' : 'Fail'
      });
      return acc;
    }, {});
  }, [marks, gradingConfig, summary]);

  // Build student-wise data with SGPA
  const studentList = useMemo(() => {
    if (!gradingConfig) return [];
    const isInternalOnly = summary?.examType === 1;
    const grouped = marks.reduce((acc, curr) => {
      if (!acc[curr.student_id]) {
        acc[curr.student_id] = {
          student_id: curr.student_id, student_name: curr.student_name,
          rollnumber: curr.rollnumber, college_name: curr.college_name,
          program_name: curr.program_name, exam_name: curr.exam_name,
          subjects: []
        };
      }
      const internal = Number(curr.internal_marks || 0);
      const external = Number(curr.external_marks || 0);
      const totalMarks = isInternalOnly ? internal : (internal + external);
      
      const { grade, gradePoint } = getGradeAndPoints(totalMarks, gradingConfig.grade_scale);
      const subjectId = curr.subject_id || curr.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(curr.credits || 0);
      acc[curr.student_id].subjects.push({
        ...curr, total_marks: totalMarks, grade, grade_point: gradePoint,
        credits, credit_points: gradePoint * credits,
        result_status: isPass(totalMarks, gradingConfig.pass_threshold) ? 'Pass' : 'Fail'
      });
      return acc;
    }, {});
    return Object.values(grouped).map(student => {
      const sgpa = calculateSGPA(student.subjects, gradingConfig);
      const totalCredits = student.subjects.reduce((sum, s) => sum + s.credits, 0);
      return { ...student, sgpa, totalCredits };
    });
  }, [marks, gradingConfig, summary]);

  const subjectNames = Object.keys(subjectWiseData);

  const passRate = summary && summary.totalRecords > 0
    ? ((summary.passCount / summary.totalRecords) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 rotate-3 hover:rotate-0 transition-transform">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Result <span className="text-indigo-600">Hub</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Official Results • Locked Records Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {marks.length > 0 && (
            <>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={togglePublish}
                disabled={publishing || (!summary?.canPublish && !summary?.resultsPublished)}
                title={!summary?.canPublish && !summary?.resultsPublished ? "Results cannot be published until all subjects are 'Locked' by colleges and external marks are submitted." : ""}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${
                  summary?.resultsPublished
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                    : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
                }`}
              >
                {summary?.resultsPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                {summary?.resultsPublished ? 'Published' : 'Publish Results'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="stitch-card p-6 rounded-[2rem]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam Series *</label>
            <select
              value={selectedExam}
              onChange={(e) => { setSelectedExam(e.target.value); setMarks([]); setSummary(null); setActiveSubject(null); }}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-all outline-none"
            >
              <option value="">Select Exam...</option>
              {Array.from(uniqueExams.keys()).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">College (Optional)</label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-all outline-none"
            >
              <option value="">All Colleges</option>
              {colleges.map(c => <option key={c.id} value={c.id}>{c.college_name || c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Program (Optional)</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:ring-0 transition-all outline-none"
            >
              <option value="">All Programs</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <button
            onClick={fetchData}
            disabled={loading || !selectedExam}
            className="h-[50px] bg-indigo-600 text-white px-8 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span>Load Results</span>
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-sky-500 transition-transform group-hover:scale-110"><Users size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Students</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalStudents}</p>
          </div>
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500"><BookOpen size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subjects</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalSubjects}</p>
          </div>
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><CheckCircle2 size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pass Rate</p>
            </div>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{passRate}%</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{summary.passCount} pass / {summary.failCount} fail</p>
          </div>
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500"><TrendingUp size={20} /></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Marks</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.avgMarks}</p>
           </div>
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.resultsPublished ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                {summary.resultsPublished ? <Eye size={20} /> : <EyeOff size={20} />}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
            </div>
            <p className={`text-lg font-black tracking-tight ${summary.resultsPublished ? 'text-emerald-600' : 'text-slate-500'}`}>
              {summary.resultsPublished ? 'Published' : 'Unpublished'}
            </p>
          </div>
        </div>
      )}

      {/* ─── No Data State ─── */}
      {!loading && marks.length === 0 && (
        <div className="bg-white rounded-[3rem] p-24 text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-8">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
            <BarChart3 size={48} />
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Select an Exam to Begin</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto">
              Choose an exam series from the filter above to load results.
              <span className="block mt-2 font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg inline-block">Note: Only marks officially "Locked" by colleges are visible here.</span>
            </p>
          </div>
        </div>
      )}

      {/* ─── Loading ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4 text-indigo-500">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-black uppercase tracking-widest text-xs">Aggregating Result Data...</p>
        </div>
      )}

      {/* ─── Results Content ─── */}
      {!loading && marks.length > 0 && (
        <div className="space-y-6">
          {/* View Toggle + Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 stitch-card p-5">
            <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setViewMode("subject")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'subject' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                By Subject
              </button>
              <button
                onClick={() => setViewMode("student")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'student' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                By Student
              </button>
            </div>

            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          {/* ─── Subject View ─── */}
          {viewMode === "subject" && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* Subject Tabs */}
              <div className="flex flex-wrap gap-2 pb-2">
                {subjectNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => setActiveSubject(name)}
                    className={`h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeSubject === name
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105'
                      : 'bg-white text-slate-400 border-2 border-slate-50 hover:border-indigo-200 hover:text-indigo-500'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Subject Table */}
              <div className="stitch-card rounded-[2rem] shadow-xl shadow-slate-200/30 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                      <BookOpen size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{activeSubject}</h2>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/80 mt-1">Subject-wise Result Ledger</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Students</p>
                      <p className="text-xl font-black">{subjectWiseData[activeSubject]?.length || 0}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pass</p>
                      <p className="text-xl font-black text-emerald-400">
                        {subjectWiseData[activeSubject]?.filter(s => s.result_status === 'Pass').length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-auto max-h-[550px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-36">Roll No</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Int</th>
                        {summary?.examType !== 1 && (
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ext</th>
                        )}
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">GP</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credits</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cr. Pts</th>
                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {subjectWiseData[activeSubject]
                        ?.filter(s =>
                          s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.rollnumber?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((item) => (
                          <tr key={`${item.student_id}-${item.subject_id}`} className="hover:bg-slate-50/50 transition-all group">
                            <td className="px-8 py-5">
                              <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                #{item.rollnumber}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <p className="font-black text-slate-800 text-sm tracking-tight">{item.student_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{item.college_name}</p>
                            </td>
                            <td className="px-8 py-5 text-center font-bold text-slate-400">{item.internal_marks || 0}</td>
                            {summary?.examType !== 1 && (
                              <td className="px-8 py-5 text-center font-black text-indigo-600">{item.external_marks || 0}</td>
                            )}
                            <td className="px-8 py-5 text-center">
                              <span className="text-lg font-black text-slate-900">{item.total_marks || 0}</span>
                            </td>
                            <td className="px-8 py-5 text-center font-black text-slate-700">{item.grade}</td>
                            <td className="px-8 py-5 text-center font-bold text-slate-500 text-xs italic">{item.grade_point}</td>
                            <td className="px-8 py-5 text-center font-bold text-slate-600">{item.credits || 0}</td>
                            <td className="px-8 py-5 text-center font-black text-indigo-500">{item.credit_points || 0}</td>
                            <td className="px-8 py-5 text-center">
                              <div className={`inline-flex items-center gap-1.5 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                                item.result_status === 'Pass'
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
          )}

          {/* ─── Student View ─── */}
          {viewMode === "student" && (
            <div className="stitch-card rounded-[2rem] shadow-xl shadow-slate-200/30 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-600 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Student Ledger</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 mt-1">Consolidated Performance & SGPA</p>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Total Students</p>
                  <p className="text-xl font-black">{studentList.length}</p>
                </div>
              </div>

              <div className="overflow-auto max-h-[550px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">College / Program</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Subjects</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Credits</th>
                      <th className="px-8 py-5 text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center bg-indigo-50">SGPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentList
                      .filter(s =>
                        s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.rollnumber?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((student) => (
                        <tr key={student.student_id} className="hover:bg-indigo-50/20 transition-all group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-900 rounded-[1rem] flex items-center justify-center text-white text-xs font-black group-hover:bg-indigo-600 transition-all shadow-md">
                                <GraduationCap size={16} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm tracking-tight capitalize">{student.student_name}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Roll: {student.rollnumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <p className="text-[10px] font-bold text-slate-600 truncate max-w-[220px]">{student.college_name || "N/A"}</p>
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-3.5 italic">{student.program_name || "Unassigned"}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-500 border border-slate-200">
                              {student.subjects.length}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="text-sm font-black text-slate-700">{student.totalCredits}</span>
                          </td>
                          <td className="px-8 py-5 text-center bg-indigo-50/30">
                            <div className="inline-flex flex-col items-center">
                              <span className="text-xl font-black text-indigo-600 leading-none">{student.sgpa}</span>
                              <div className="flex items-center gap-1 mt-1">
                                <div className="w-10 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(parseFloat(student.sgpa) / 10) * 100}%` }} />
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
