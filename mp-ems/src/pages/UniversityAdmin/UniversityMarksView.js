import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2, AlertCircle, Loader2, BookOpen,
  Search, Users, GraduationCap, ClipboardCheck,
  TrendingUp, Download, Eye, EyeOff,
  BarChart3
} from "lucide-react";
import { toast } from 'react-toastify';
import { getGradeAndPoints, isPass, calculateSGPA } from "../../utils/gradingUtils";
import { universityAdminApi } from "../../api/universityAdminApi";
import { masterDataApi } from "../../api/masterDataApi";
import { examApi } from "../../api/examApi";
import { useGradingPolicy } from "../../hooks/useGradingPolicy";

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

  // Moderation state
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [moderationForm, setModerationForm] = useState({ marks: 0, reason: "" });
  const [savingModeration, setSavingModeration] = useState(false);

  const { config: gradingConfig } = useGradingPolicy();

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [exRes, colRes, progRes] = await Promise.all([
          examApi.getExams(),
          masterDataApi.getColleges(),
          masterDataApi.getPrograms()
        ]);
        if (exRes) setExams(exRes);
        if (colRes) setColleges(colRes);
        if (progRes) setPrograms(progRes);
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };
    fetchFilters();
  }, []);

  const uniqueExams = useMemo(() => {
    const map = new Map();
    if (!exams) return map;
    
    exams.filter(e => 
      e.exam_type == 2 || 
      e.exam_type_name?.toLowerCase().includes('external') || 
      e.exam_type_name?.toLowerCase().includes('semester')
    ).forEach(e => {
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
      const params = {
        ...(selectedExam && { exam_name: selectedExam }),
        ...(selectedCollege && { college_id: selectedCollege }),
        ...(selectedProgram && { program_id: selectedProgram })
      };

      const data = await universityAdminApi.getResultHubData(params);
      if (data) {
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
      const newState = !summary?.resultsPublished;
      const ids = uniqueExams.get(selectedExam) || [];

      // Update all IDs in the series
      await Promise.all(ids.map(id =>
        universityAdminApi.publishResults(id, { results_published: newState })
      ));

      toast.success(`Results ${newState ? 'published' : 'unpublished'} successfully for the entire series!`);
      setSummary(prev => ({ ...prev, resultsPublished: newState }));
    } catch (err) {
      toast.error("Network error");
    } finally {
      setPublishing(false);
    }
  };

  const handleApplyModeration = async (marksOverride = null) => {
    const subjectData = subjectWiseData[activeSubject];
    if (!subjectData || subjectData.length === 0) return;
    
    const examId = subjectData[0].exam_id;
    if (!examId) {
      toast.error("Paper context not found.");
      return;
    }

    const marks = marksOverride !== null ? marksOverride : Number(moderationForm.marks);
    const reason = marksOverride !== null ? "" : moderationForm.reason;

    setSavingModeration(true);
    try {
      await universityAdminApi.updateModerationMarks({
        exam_id: examId,
        moderation_marks: marks,
        moderation_reason: reason
      });
      toast.success(marks === 0 ? "Moderation marks cleared!" : "Moderation marks applied successfully!");
      setShowModerationModal(false);
      fetchData(); // Refresh data
    } catch (err) {
      console.error(err);
      toast.error("Failed to update moderation.");
    } finally {
      setSavingModeration(false);
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (marks.length === 0) return;
    const isInternalOnly = summary?.examType === 1;
    const headers = ["Roll No", "Student Name", "College", "Program", "Subject", "Internal"];
    if (!isInternalOnly) headers.push("External");
    const budget = marks[0]?.grace_budget ? ` (${marks[0].grace_budget})` : '';
    headers.push("Total", `Grace${budget}`, "Grade", "GP", "Credits", "Credit Pts", "Result");

    const csvRows = [headers.join(",")];
    marks.forEach(row => {
      if (!gradingConfig) return;

      const internal = Number(row.internal_marks || 0);
      const external = Number(row.external_marks || 0);
      const total = Number(row.total_marks || 0);
      const grace = Number(row.grace_marks || 0);
      let pass = row.result_status || (isPass(total, gradingConfig.pass_threshold) ? 'Pass' : 'Fail');
      if (grace > 0 && pass.includes('Pass')) pass += ' (G)';

      const { grade, gradePoint } = getGradeAndPoints(total, gradingConfig.grade_scale);
      const subjectId = row.subject_id || row.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(row.credits || 0);
      const creditPoints = gradePoint * credits;

      const rowData = [
        row.rollnumber, `"${row.student_name}"`, `"${row.college_name || ''}"`, `"${row.program_name || ''}"`,
        `"${row.subject_name}"`, internal
      ];
      if (!isInternalOnly) rowData.push(external);
      const graceDisplay = grace > 0 ? `+${grace}` : '0';
      rowData.push(total, graceDisplay, grade, gradePoint, credits, creditPoints, `"${pass}"`);

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
      // Use backend calculated values to respect grace marks
      const totalMarks = curr.total_marks !== undefined ? Number(curr.total_marks) : (isInternalOnly ? internal : (internal + external));
      const grade = curr.grade || getGradeAndPoints(totalMarks, gradingConfig.grade_scale).grade;
      const gradePoint = curr.grade_point !== undefined ? Number(curr.grade_point) : getGradeAndPoints(totalMarks, gradingConfig.grade_scale).gradePoint;
      const subjectIsPass = curr.result_status ? (curr.result_status === 'Pass') : isPass(totalMarks, gradingConfig.pass_threshold);

      const subjectId = curr.subject_id || curr.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(curr.credits || 0);

      acc[curr.subject_name].push({
        ...curr,
        total_marks: totalMarks,
        grade,
        grade_point: gradePoint,
        credits,
        credit_points: curr.credit_points !== undefined ? Number(curr.credit_points) : (gradePoint * credits),
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
      // Use backend calculated values to respect grace marks
      const totalMarks = curr.total_marks !== undefined ? Number(curr.total_marks) : (isInternalOnly ? internal : (internal + external));
      const grade = curr.grade || getGradeAndPoints(totalMarks, gradingConfig.grade_scale).grade;
      const gradePoint = curr.grade_point !== undefined ? Number(curr.grade_point) : getGradeAndPoints(totalMarks, gradingConfig.grade_scale).gradePoint;
      const subjectIsPass = curr.result_status ? (curr.result_status === 'Pass') : isPass(totalMarks, gradingConfig.pass_threshold);

      const subjectId = curr.subject_id || curr.id;
      const overrideCredits = gradingConfig.subject_credits?.[subjectId];
      const credits = overrideCredits !== undefined ? Number(overrideCredits) : Number(curr.credits || 0);

      acc[curr.student_id].subjects.push({
        ...curr,
        total_marks: totalMarks,
        grade,
        grade_point: gradePoint,
        credits,
        credit_points: curr.credit_points !== undefined ? Number(curr.credit_points) : (gradePoint * credits),
        result_status: subjectIsPass ? 'Pass' : 'Fail'
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
    <div className="max-w-[1600px] mx-auto p-4 sm:p-5 space-y-4 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 rotate-3 hover:rotate-0 transition-transform">
            <ClipboardCheck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Result <span className="text-indigo-600">Hub</span></h1>
            <p className="text-slate-500 font-bold text-sm tracking-widest  flex items-center gap-2">
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
                className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 text-slate-600 rounded-xl font-bold text-[13px]  tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm"
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={togglePublish}
                disabled={publishing || (!summary?.canPublish && !summary?.resultsPublished)}
                title={!summary?.canPublish && !summary?.resultsPublished ? "Results cannot be published until all subjects are 'Locked' by colleges and external marks are submitted." : ""}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[13px]  tracking-widest transition-all shadow-lg disabled:opacity-50 ${summary?.resultsPublished
                  ? 'bg-emerald-500 text-white shadow-indigo-500/20 hover:bg-emerald-600'
                  : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-slate-800'
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
      <div className="stitch-card p-5 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[12px] font-black text-slate-400  tracking-widest mb-2">Exam Series *</label>
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
            <label className="block text-[12px] font-black text-slate-400  tracking-widest mb-2">College (Optional)</label>
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
            <label className="block text-[12px] font-black text-slate-400  tracking-widest mb-2">Program (Optional)</label>
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
            className="h-[50px] bg-indigo-600 text-white px-8 rounded-xl font-bold text-sm  tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            <span>Load Results</span>
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stitch-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110"><Users size={20} /></div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">Students</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalStudents}</p>
          </div>
          <div className="stitch-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center text-violet-500"><BookOpen size={20} /></div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">Subjects</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.totalSubjects}</p>
          </div>
          <div className="stitch-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><CheckCircle2 size={20} /></div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">Pass Rate</p>
            </div>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{passRate}%</p>
            <p className="text-[9px] font-bold text-slate-400 mt-1  tracking-tighter">{summary.passCount} pass / {summary.failCount} fail</p>
          </div>
          <div className="stitch-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><TrendingUp size={20} /></div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">Avg Marks</p>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{summary.avgMarks}</p>
          </div>
          <div className="stitch-card p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.resultsPublished ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                {summary.resultsPublished ? <Eye size={20} /> : <EyeOff size={20} />}
              </div>
              <p className="text-[9px] font-black text-slate-400  tracking-widest">Status</p>
            </div>
            <p className={`text-lg font-black tracking-tight ${summary.resultsPublished ? 'text-emerald-600' : 'text-slate-500'}`}>
              {summary.resultsPublished ? 'Published' : 'Unpublished'}
            </p>
          </div>
        </div>
      )}

      {/* ─── No Data State ─── */}
      {!loading && marks.length === 0 && (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
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
          <p className="font-black  tracking-widest text-[13px]">Aggregating Result Data...</p>
        </div>
      )}

      {/* ─── Results Content ─── */}
      {!loading && marks.length > 0 && (
        <div className="space-y-6">
          {/* View Toggle + Search */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 stitch-card p-4">
            <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
              <button
                onClick={() => setViewMode("subject")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[12px] font-black  tracking-widest transition-all ${viewMode === 'subject' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                By Subject
              </button>
              <button
                onClick={() => setViewMode("student")}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[12px] font-black  tracking-widest transition-all ${viewMode === 'student' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
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
                    className={`h-10 px-6 rounded-full text-[12px] font-black  tracking-widest transition-all ${activeSubject === name
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105'
                      : 'bg-white text-slate-400 border-2 border-slate-50 hover:border-indigo-200 hover:text-indigo-500'
                      }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Subject Table */}
              <div className="stitch-card rounded-2xl shadow-xl shadow-slate-200/30 overflow-hidden">
                <div className="bg-indigo-600 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                      <BookOpen size={20} className="text-indigo-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">{activeSubject}</h2>
                      <p className="text-[12px] font-black  tracking-[0.2em] text-indigo-400/80 mt-1">Subject-wise Result Ledger</p>
                    </div>
                  </div>
                    <div className="flex gap-3">
                      <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center min-w-[80px]">
                        <p className="text-[10px] font-black tracking-widest text-indigo-200 uppercase mb-0.5">Students</p>
                        <p className="text-xl font-black">{subjectWiseData[activeSubject]?.length || 0}</p>
                      </div>
                      <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl text-center min-w-[80px]">
                        <p className="text-[10px] font-black tracking-widest text-indigo-200 uppercase mb-0.5">Pass</p>
                        <p className="text-xl font-black text-emerald-400">
                          {subjectWiseData[activeSubject]?.filter(s => s.result_status === 'Pass').length || 0}
                        </p>
                      </div>
                      <button
                      onClick={() => {
                        const firstItem = subjectWiseData[activeSubject]?.[0];
                        setModerationForm({ 
                          marks: firstItem?.moderation_marks || 0, 
                          reason: firstItem?.moderation_reason || "" 
                        });
                        setShowModerationModal(true);
                      }}
                      className="bg-white/10 border border-white/20 px-5 py-3 rounded-2xl text-[11px] font-black  tracking-widest hover:bg-white hover:text-indigo-600 transition-all"
                    >
                      Apply Moderation
                    </button>
                  </div>
                </div>

                <div className="overflow-auto max-h-[500px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest w-36">Roll No</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest">Student</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Int</th>
                        {summary?.examType !== 1 && (
                          <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Ext</th>
                        )}
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Total</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-violet-500  tracking-widest text-center">Mod</th>
                        {summary?.isGraceEnabled && (
                          <th className="px-6 py-3.5 text-[11px] font-black text-indigo-500  tracking-widest text-center">Grace {subjectWiseData[activeSubject]?.[0]?.grace_budget ? `(${subjectWiseData[activeSubject][0].grace_budget})` : ''}</th>
                        )}
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Grade</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">GP</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Credits</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Cr. Pts</th>
                        <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Result</th>
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
                            <td className="px-6 py-3.5">
                              <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                #{item.rollnumber}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="font-black text-slate-800 text-sm tracking-tight">{item.student_name}</p>
                              <p className="text-[9px] font-bold text-slate-400 ">{item.college_name}</p>
                            </td>
                            <td className="px-8 py-5 text-center font-bold text-slate-400">{item.internal_marks || 0}</td>
                            {summary?.examType !== 1 && (
                              <td className="px-8 py-5 text-center font-black text-indigo-600">{item.external_marks || 0}</td>
                            )}
                            <td className="px-8 py-5 text-center">
                              <span className="text-lg font-black text-slate-900">{item.total_marks || 0}</span>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className={`text-[13px] font-black ${Number(item.moderation_marks) > 0 ? 'text-violet-500 bg-violet-50 px-2 py-0.5 rounded-md' : 'text-slate-300 opacity-30'}`}>
                                {item.moderation_marks > 0 ? `+${item.moderation_marks}` : '—'}
                              </span>
                            </td>
                            {summary?.isGraceEnabled && (
                              <td className="px-8 py-5 text-center">
                                <span className={`text-[13px] font-black ${Number(item.grace_marks) > 0 ? 'text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md' : 'text-slate-300 opacity-30'}`}>
                                  {item.grace_marks > 0 ? `+${item.grace_marks}` : '—'}
                                </span>
                              </td>
                            )}
                            <td className="px-8 py-5 text-center font-black text-slate-700">{item.grade}</td>
                            <td className="px-8 py-5 text-center font-bold text-slate-500 text-[13px] italic">{item.grade_point}</td>
                            <td className="px-8 py-5 text-center font-bold text-slate-600">{item.credits || 0}</td>
                            <td className="px-8 py-5 text-center font-black text-indigo-500">{item.credit_points || 0}</td>
                            <td className="px-8 py-5 text-center">
                              <div className={`inline-flex items-center gap-1.5 text-[8px] font-black px-2.5 py-1 rounded-full  tracking-wider border ${item.result_status?.includes('Pass')
                                ? 'text-emerald-500 bg-emerald-50 border-emerald-100'
                                : 'text-rose-500 bg-rose-50 border-rose-100'
                                }`}>
                                {item.result_status?.includes('Pass') ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {item.result_status}{item.grace_marks > 0 ? ' (G)' : ''}
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
            <div className="stitch-card rounded-2xl shadow-xl shadow-slate-200/30 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-indigo-600 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-white/10 rounded-xl border border-white/20">
                    <TrendingUp size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Student Ledger</h2>
                    <p className="text-[12px] font-black  tracking-[0.2em] text-white/70 mt-1">Consolidated Performance & SGPA</p>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black  tracking-widest text-indigo-200">Total Students</p>
                  <p className="text-xl font-black">{studentList.length}</p>
                </div>
              </div>

              <div className="overflow-auto max-h-[550px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-100">
                      <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest">Student</th>
                      <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest">College / Program</th>
                      <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Subjects</th>
                      <th className="px-6 py-3.5 text-[11px] font-black text-slate-400  tracking-widest text-center">Credits</th>
                      <th className="px-6 py-3.5 text-[11px] font-black text-indigo-600  tracking-widest text-center bg-indigo-50">SGPA</th>
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
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-600 rounded-[1rem] flex items-center justify-center text-white text-[13px] font-black group-hover:bg-indigo-600 transition-all shadow-md">
                                <GraduationCap size={16} />
                              </div>
                              <div>
                                <p className="font-black text-slate-800 text-sm tracking-tight capitalize">{student.student_name}</p>
                                <p className="text-[9px] font-black text-slate-400  tracking-widest">Roll: {student.rollnumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <p className="text-[12px] font-bold text-slate-600 truncate max-w-[220px]">{student.college_name || "N/A"}</p>
                            </div>
                            <p className="text-[9px] font-black text-slate-400  tracking-tighter ml-3.5 italic">{student.program_name || "Unassigned"}</p>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-[13px] font-black text-slate-500 border border-slate-200">
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
      {/* ─── Moderation Modal ─── */}
      {showModerationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-8 text-white">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Subject Moderation</h3>
              <p className="text-indigo-200 text-sm font-bold mt-1">Apply extra marks for entire paper</p>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 tracking-widest uppercase mb-2">Subject</label>
                <p className="text-lg font-black text-slate-900">{activeSubject}</p>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 tracking-widest uppercase mb-2">Moderation Marks</label>
                <input
                  type="number"
                  value={moderationForm.marks}
                  onChange={(e) => setModerationForm(prev => ({ ...prev, marks: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-lg font-black text-slate-900 focus:border-indigo-500 transition-all outline-none"
                  placeholder="e.g. 5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 tracking-widest uppercase mb-2">Reason</label>
                <select
                  value={moderationForm.reason}
                  onChange={(e) => setModerationForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 transition-all outline-none appearance-none"
                >
                  <option value="">Select a reason...</option>
                  <option value="Question Paper Difficult">Question Paper Difficult</option>
                  <option value="Question Out of Syllabus">Question Out of Syllabus</option>
                  <option value="Other">Other Policy Adjustment</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModerationModal(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-black text-[13px] tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApplyModeration()}
                    disabled={savingModeration}
                    className="flex-[2] bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[13px] tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingModeration ? <Loader2 className="animate-spin" size={18} /> : "Save Changes"}
                  </button>
                </div>
                {subjectWiseData[activeSubject]?.[0]?.moderation_marks > 0 && (
                  <button
                    onClick={() => handleApplyModeration(0)}
                    disabled={savingModeration}
                    className="w-full px-6 py-3 rounded-2xl font-black text-[11px] tracking-widest text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                  >
                    Clear Existing Moderation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversityMarksView;
