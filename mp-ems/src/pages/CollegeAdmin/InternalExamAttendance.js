import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ClipboardCheck, Search, Filter, CheckCircle2, XCircle, Users, TrendingUp, AlertCircle,
  Building2, UserCheck, ChevronRight, Ban
} from 'lucide-react';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const selectStyles = {
  control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', minHeight: '45px', fontSize: '14px' }),
  option: (base, state) => ({ ...base, fontSize: '13px', backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white' })
};

const InternalExamAttendance = () => {
  const [activeTab, setActiveTab] = useState('internal'); // 'internal' | 'external'
  const [loading, setLoading] = useState(false);

  // ── Internal Exam States ────────────────────────────────────────────────
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [internalStudents, setInternalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);

  // ── External Exam States ────────────────────────────────────────────────
  const [externalExams, setExternalExams] = useState([]);
  const [selectedExternalExamId, setSelectedExternalExamId] = useState('');
  const [externalHalls, setExternalHalls] = useState([]);

  // Load initial data
  useEffect(() => {
    // 1. Load masters for internal exams
    masterDataApi.getMasters().then(data => {
      setSemesters((data.semesters || [])
        .sort((a, b) => {
          const n = s => parseInt(s.semester_name.replace(/\D/g, '')) || 0;
          return n(a) - n(b);
        })
        .map(s => ({ value: s.id, label: s.semester_name }))
      );
      setSubjects((data.subjects || []).map(s => ({
        value: s.id,
        label: `${s.subject_code} — ${s.name}`,
        semester_id: s.semester_id
      })));
    }).catch(() => toast.error('Failed to load internal metadata'));

    // 2. Load external exams
    collegeAdminApi.getExternalExams().then(data => {
      setExternalExams(data || []);
    }).catch(() => toast.error('Failed to load external exams'));
  }, []);

  // Fetch Internal Report
  const fetchInternalReport = async () => {
    if (!selectedSemester) { toast.warning('Please select a semester'); return; }
    setLoading(true);
    setInternalStudents([]);
    setExpandedStudent(null);
    try {
      const params = { semester_id: selectedSemester.value };
      if (selectedSubject) params.subject_id = selectedSubject.value;
      const data = await collegeAdminApi.getInternalExamAttendance(params);
      setInternalStudents(data || []);
      if (!data || data.length === 0) toast.info('No internal exam records found.');
    } catch (err) {
      toast.error('Failed to fetch internal report');
    } finally {
      setLoading(false);
    }
  };

  // Fetch External Report
  const fetchExternalReport = async () => {
    if (!selectedExternalExamId) { toast.warning('Please select an external exam'); return; }
    setLoading(true);
    setExternalHalls([]);
    try {
      const data = await collegeAdminApi.getExternalExamAttendance(selectedExternalExamId);
      setExternalHalls(data || []);
      if (!data || data.length === 0) toast.info('No attendance reports found for this exam.');
    } catch (err) {
      toast.error('Failed to fetch external report');
    } finally {
      setLoading(false);
    }
  };

  // Internal Stats
  const internalStats = React.useMemo(() => {
    if (!internalStudents.length) return null;
    const avgPct = Math.round(internalStudents.reduce((a, s) => a + s.overall_percentage, 0) / internalStudents.length);
    const below75 = internalStudents.filter(s => s.overall_percentage < 75).length;
    const perfect = internalStudents.filter(s => s.overall_percentage === 100).length;
    return { avgPct, below75, perfect, total: internalStudents.length };
  }, [internalStudents]);

  // External Stats
  const externalStats = React.useMemo(() => {
    if (!externalHalls.length) return null;
    let total = 0;
    let present = 0;
    let absent = 0;
    let ufm = 0;
    let notMarked = 0;

    externalHalls.forEach(hall => {
      (hall.students || []).forEach(s => {
        total++;
        if (s.status === 'Present') present++;
        else if (s.status === 'Absent') absent++;
        else if (s.status === 'UFM') ufm++;
        else notMarked++;
      });
    });

    return { total, present, absent, ufm, notMarked };
  }, [externalHalls]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Attendance Report</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Track student present/absent status across internal and external exams.</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveTab('internal'); setExternalHalls([]); }}
            className={`px-5 py-2 text-xs font-black tracking-wider uppercase rounded-xl transition-all ${
              activeTab === 'internal'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Internal Exams
          </button>
          {/* <button
            onClick={() => { setActiveTab('external'); setInternalStudents([]); }}
            className={`px-5 py-2 text-xs font-black tracking-wider uppercase rounded-xl transition-all ${
              activeTab === 'external'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            External Exams
          </button> */}
        </div>
      </div>

      {/* ── Tab: Internal Exams ────────────────────────────────────────────── */}
      {activeTab === 'internal' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">Semester <span className="text-red-400">*</span></label>
              <Select
                options={semesters}
                value={selectedSemester}
                onChange={opt => { setSelectedSemester(opt); setSelectedSubject(null); setInternalStudents([]); }}
                placeholder="Select Semester..."
                styles={selectStyles}
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">Subject <span className="text-slate-300">(Optional)</span></label>
              <Select
                options={subjects}
                value={selectedSubject}
                onChange={setSelectedSubject}
                isClearable
                placeholder="All Subjects"
                styles={selectStyles}
              />
            </div>
            <button
              onClick={fetchInternalReport}
              disabled={loading}
              className="px-8 h-[45px] bg-indigo-600 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 shrink-0"
            >
              <Search size={18} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Stats */}
          {internalStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Students', value: internalStats.total, icon: <Users size={22} />, color: 'text-slate-700', bg: 'bg-slate-50' },
                { label: 'Average Attendance', value: `${internalStats.avgPct}%`, icon: <TrendingUp size={22} />, color: internalStats.avgPct >= 75 ? 'text-emerald-600' : 'text-amber-500', bg: internalStats.avgPct >= 75 ? 'bg-emerald-50' : 'bg-amber-50' },
                { label: 'Below 75%', value: internalStats.below75, icon: <AlertCircle size={22} />, color: internalStats.below75 > 0 ? 'text-red-600' : 'text-slate-400', bg: internalStats.below75 > 0 ? 'bg-red-50' : 'bg-slate-50' },
                { label: '100% Attendance', value: internalStats.perfect, icon: <CheckCircle2 size={22} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl border border-slate-100 p-5 flex items-center gap-4 shadow-sm`}>
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-[11px] font-black text-slate-400 tracking-widest">{s.label}</p>
                    <p className={`text-2xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : internalStudents.length > 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <h2 className="text-base font-black text-slate-900 tracking-tight">Student Attendance Roster</h2>
                <span className="text-[12px] font-bold text-slate-400">{internalStudents.length} students</span>
              </div>
              <div className="divide-y divide-slate-50">
                {internalStudents.map(stu => (
                  <div key={stu.student_id}>
                    <button
                      onClick={() => setExpandedStudent(expandedStudent === stu.student_id ? null : stu.student_id)}
                      className="w-full px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                          stu.overall_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                          stu.overall_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stu.overall_percentage}%
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{stu.student_name}</p>
                          <p className="text-[12px] font-bold text-slate-400 tracking-wider">{stu.enrollment_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[12px] font-bold text-slate-400">{stu.overall_present}/{stu.overall_total} Exams Present</span>
                        <div className="flex items-center gap-1">
                          <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            <CheckCircle2 size={10} /> {stu.overall_present}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                            <XCircle size={10} /> {stu.overall_absent}
                          </span>
                        </div>
                      </div>
                    </button>

                    {expandedStudent === stu.student_id && (
                      <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-3">
                          {stu.subjects.map(sub => (
                            <div key={sub.subject_id} className="bg-slate-50/60 rounded-2xl border border-slate-100 p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                <div>
                                  <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 tracking-wider">{sub.subject_code}</span>
                                  <p className="text-sm font-black text-slate-800 mt-1">{sub.subject_name}</p>
                                </div>
                                <span className={`text-[12px] font-black px-3 py-1 rounded-full shrink-0 ${
                                  sub.attendance_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                  sub.attendance_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                }`}>{sub.attendance_percentage}% — {sub.present_count}/{sub.total_components}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {sub.components.map(comp => (
                                  <span key={comp.component_name} className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-[11px] font-black ${
                                    comp.status === 'Present'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                      : 'bg-red-50 border-red-200 text-red-700'
                                  }`}>
                                    {comp.status === 'Present' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                                    {comp.component_name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !loading && (
            <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
              <Filter size={40} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900">No Data</h3>
              <p className="text-slate-400 mt-2">Select a semester and subject to search report.</p>
            </div>
          )}
        </>
      )}

      {/* ── Tab: External Exams ────────────────────────────────────────────── */}
      {activeTab === 'external' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 min-w-[200px] space-y-2">
              <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">External Exam <span className="text-red-400">*</span></label>
              <select
                value={selectedExternalExamId}
                onChange={e => { setSelectedExternalExamId(e.target.value); setExternalHalls([]); }}
                className="w-full h-[45px] bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select External Exam --</option>
                {externalExams.map(exam => {
                  const dateStr = exam.exam_date
                    ? new Date(exam.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                  return (
                    <option key={exam.id} value={exam.id}>
                      {exam.exam_name}{dateStr ? ` — ${dateStr}` : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            <button
              onClick={fetchExternalReport}
              disabled={loading}
              className="px-8 h-[45px] bg-indigo-600 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 shrink-0"
            >
              <Search size={18} />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Stats */}
          {externalStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in duration-300">
              {[
                { label: 'Total Allocated', value: externalStats.total, icon: <Users size={20} />, color: 'text-slate-700', bg: 'bg-slate-50' },
                { label: 'Present Students', value: externalStats.present, icon: <CheckCircle2 size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Absent Students', value: externalStats.absent, icon: <XCircle size={20} />, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'UFM Cases', value: externalStats.ufm, icon: <Ban size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Not Marked Yet', value: externalStats.notMarked, icon: <AlertCircle size={20} />, color: 'text-slate-400', bg: 'bg-slate-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl border border-slate-100 p-4 flex items-center gap-3.5 shadow-sm`}>
                  <span className={s.color}>{s.icon}</span>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 tracking-widest">{s.label}</p>
                    <p className={`text-xl font-black tracking-tighter ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : externalHalls.length > 0 ? (
            <div className="space-y-6">
              {externalHalls.map(hall => (
                <div key={hall.hall_id} className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Hall Header */}
                  <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Building2 size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <span className="font-black text-slate-800 text-sm">{hall.hall_name}</span>
                        <p className="text-[11px] text-slate-400 font-black tracking-wider">ROOM ALLOCATION</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-500 bg-slate-200/60 px-3 py-1 rounded-xl">
                      {hall.students?.length} Allocated Student{hall.students?.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Student Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Seat</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Roll Number</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Student Name</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Attendance Status</th>
                          <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 tracking-widest uppercase">Marked By (Invigilator)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(hall.students || []).map(stu => (
                          <tr key={stu.student_id} className="hover:bg-slate-50/45 transition-colors">
                            <td className="px-6 py-3.5 text-xs font-black text-slate-500">
                              Row {stu.row_no} — Seat {stu.seat_no}
                            </td>
                            <td className="px-6 py-3.5 text-xs font-bold text-slate-800">{stu.rollnumber}</td>
                            <td className="px-6 py-3.5 text-xs font-bold text-slate-700">{stu.student_name}</td>
                            <td className="px-6 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-black border ${
                                stu.status === 'Present' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                stu.status === 'Absent' ? 'bg-red-50 border-red-100 text-red-700' :
                                stu.status === 'UFM' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                                {stu.status === 'Present' && <CheckCircle2 size={12} />}
                                {stu.status === 'Absent' && <XCircle size={12} />}
                                {stu.status === 'UFM' && <Ban size={12} />}
                                {stu.status === 'Not Marked' && <AlertCircle size={12} />}
                                {stu.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-xs font-bold text-slate-500">
                              {stu.marked_by ? (
                                <span className="flex items-center gap-1.5">
                                  <UserCheck size={13} className="text-indigo-500" />
                                  {stu.marked_by}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic font-medium">Pending marking</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && (
            <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
              <Filter size={40} className="text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900">No Data</h3>
              <p className="text-slate-400 mt-2">Select an external exam and search to generate the attendance report.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InternalExamAttendance;
