import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ClipboardCheck, Search, Filter, CheckCircle2, XCircle, Users, Building2, UserCheck, Ban, AlertCircle, Loader2
} from 'lucide-react';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const selectStyles = {
  control: (base) => ({
    ...base,
    borderRadius: '0.75rem',
    borderColor: '#e2e8f0',
    minHeight: '45px',
    fontSize: '14px',
    boxShadow: 'none',
    '&:hover': { borderColor: '#cbd5e1' }
  }),
  option: (base, state) => ({
    ...base,
    fontSize: '13px',
    backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white',
    color: state.isSelected ? 'white' : '#334155'
  })
};

const UniversityExamAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [loadingFilters, setLoadingFilters] = useState(true);

  // Filter lists
  const [colleges, setColleges] = useState([]);
  const [externalExams, setExternalExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected filters
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Roster results
  const [externalHalls, setExternalHalls] = useState([]);

  // Load initial filters
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingFilters(true);
        const [collegesData, examsData] = await Promise.all([
          masterDataApi.getColleges(),
          collegeAdminApi.getExternalExams()
        ]);

        setColleges((collegesData || []).map(c => ({
          value: c.id,
          label: c.college_name || c.name
        })));

        setExternalExams((examsData || []).map(e => {
          const dateStr = e.exam_date
            ? new Date(e.exam_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
          return {
            value: e.id,
            label: `${e.exam_name}${dateStr ? ` — ${dateStr}` : ''}`
          };
        }));
      } catch (err) {
        console.error('Failed to load filters:', err);
        toast.error('Failed to load initial search filters.');
      } finally {
        setLoadingFilters(false);
      }
    };

    loadInitialData();
  }, []);

  // Load subjects when exam changes
  useEffect(() => {
    if (!selectedExam) {
      setSubjects([]);
      setSelectedSubject(null);
      setExternalHalls([]);
      return;
    }
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setSelectedSubject(null);
      setExternalHalls([]);
      try {
        const data = await collegeAdminApi.getExternalExamSubjects(selectedExam.value);
        setSubjects((data || []).map(s => ({
          value: s.specific_exam_id,
          label: `${s.subject_code} - ${s.subject_name}`
        })));
      } catch (err) {
        toast.error('Failed to load subjects for this exam');
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [selectedExam]);

  // Fetch Attendance Report
  const fetchReport = async () => {
    if (!selectedCollege) {
      toast.warning('Please select a college.');
      return;
    }
    if (!selectedExam) {
      toast.warning('Please select an external exam.');
      return;
    }
    if (!selectedSubject) {
      toast.warning('Please select a subject.');
      return;
    }

    setLoading(true);
    setExternalHalls([]);

    try {
      const data = await collegeAdminApi.getExternalExamAttendance(selectedSubject.value, selectedCollege.value);
      setExternalHalls(data || []);
      if (!data || data.length === 0) {
        toast.info('No attendance reports found for this college and subject.');
      }
    } catch (err) {
      console.error('Failed to fetch attendance report:', err);
      toast.error('Failed to fetch external exam attendance report.');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
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
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3 hover:rotate-0 transition-transform duration-300">
            <ClipboardCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">External Exam Attendance</h1>
            <p className="text-sm text-slate-400 font-medium mt-0.5">Track student present, absent, and UFM statuses across exam centers.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">College / Center <span className="text-red-400">*</span></label>
          <Select
            options={colleges}
            value={selectedCollege}
            onChange={opt => { setSelectedCollege(opt); setExternalHalls([]); }}
            placeholder={loadingFilters ? "Loading colleges..." : "Select College Center..."}
            isLoading={loadingFilters}
            styles={selectStyles}
            isClearable
          />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">External Exam <span className="text-red-400">*</span></label>
          <Select
            options={externalExams}
            value={selectedExam}
            onChange={opt => { setSelectedExam(opt); setExternalHalls([]); }}
            placeholder={loadingFilters ? "Loading exams..." : "Select External Exam..."}
            isLoading={loadingFilters}
            styles={selectStyles}
            isClearable
          />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">Subject <span className="text-red-400">*</span></label>
          <Select
            options={subjects}
            value={selectedSubject}
            onChange={opt => { setSelectedSubject(opt); setExternalHalls([]); }}
            placeholder={loadingSubjects ? "Loading subjects..." : "Select Subject..."}
            isLoading={loadingSubjects}
            isDisabled={!selectedExam}
            styles={selectStyles}
            isClearable
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading || loadingFilters || !selectedSubject}
          className="px-8 h-[45px] bg-indigo-600 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 shrink-0"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
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

      {/* Results Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-indigo-500 space-y-4">
          <Loader2 size={40} className="animate-spin" />
          <p className="font-bold text-sm tracking-widest uppercase">Fetching Attendance Data...</p>
        </div>
      ) : externalHalls.length > 0 ? (
        <div className="space-y-6">
          {externalHalls.map(hall => (
            <div key={hall.hall_id} className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/40 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          <p className="text-slate-400 mt-2">Select a college center and an external exam to query the attendance report.</p>
        </div>
      )}
    </div>
  );
};

export default UniversityExamAttendance;
