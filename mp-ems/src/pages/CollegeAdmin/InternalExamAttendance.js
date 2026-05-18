import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ClipboardCheck, Search, Filter, CheckCircle2, XCircle, Users, TrendingUp, AlertCircle } from 'lucide-react';
import Select from 'react-select';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const selectStyles = {
    control: (base) => ({ ...base, borderRadius: '0.75rem', borderColor: '#e2e8f0', minHeight: '45px', fontSize: '14px' }),
    option: (base, state) => ({ ...base, fontSize: '13px', backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#eef2ff' : 'white' })
};

const InternalExamAttendance = () => {
    const [semesters, setSemesters] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedStudent, setExpandedStudent] = useState(null);

    useEffect(() => {
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
        }).catch(() => toast.error('Failed to load metadata'));
    }, []);

    const filteredSubjects = subjects;

    const fetchReport = async () => {
        if (!selectedSemester) { toast.warning('Please select a semester'); return; }
        setLoading(true);
        setStudents([]);
        setExpandedStudent(null);
        try {
            const params = { semester_id: selectedSemester.value };
            if (selectedSubject) params.subject_id = selectedSubject.value;
            const data = await collegeAdminApi.getInternalExamAttendance(params);
            setStudents(data || []);
            if (!data || data.length === 0) toast.info('No internal exam records found for the selected criteria.');
        } catch (err) {
            toast.error('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    // Aggregate all component names across all subjects (for dynamic columns in table view)
    const allComponents = React.useMemo(() => {
        const compSet = new Set();
        students.forEach(stu => stu.subjects.forEach(sub => sub.components.forEach(c => compSet.add(c.component_name))));
        return Array.from(compSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    }, [students]);

    // Stats summary
    const stats = React.useMemo(() => {
        if (!students.length) return null;
        const avgPct = Math.round(students.reduce((a, s) => a + s.overall_percentage, 0) / students.length);
        const below75 = students.filter(s => s.overall_percentage < 75).length;
        const perfect = students.filter(s => s.overall_percentage === 100).length;
        return { avgPct, below75, perfect, total: students.length };
    }, [students]);

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600">
                        <ClipboardCheck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Internal Exam Attendance</h1>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">View exam-wise present/absent status for every student, per semester.</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">Semester <span className="text-red-400">*</span></label>
                    <Select
                        options={semesters}
                        value={selectedSemester}
                        onChange={opt => { setSelectedSemester(opt); setSelectedSubject(null); setStudents([]); }}
                        placeholder="Select Semester..."
                        styles={selectStyles}
                    />
                </div>
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[13px] font-black text-slate-500 tracking-widest ml-1">Subject <span className="text-slate-300">(Optional)</span></label>
                    <Select
                        options={filteredSubjects}
                        value={selectedSubject}
                        onChange={setSelectedSubject}
                        isClearable
                        placeholder="All Subjects"
                        styles={selectStyles}
                    />
                </div>
                <button
                    onClick={fetchReport}
                    disabled={loading}
                    className="px-8 h-[45px] bg-violet-600 text-white font-black rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-violet-500/20 disabled:opacity-50 shrink-0"
                >
                    <Search size={18} />
                    {loading ? 'Loading...' : 'Search'}
                </button>
            </div>

            {/* Stats Strip */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Students', value: stats.total, icon: <Users size={22} />, color: 'text-slate-700', bg: 'bg-slate-50' },
                        { label: 'Average Attendance', value: `${stats.avgPct}%`, icon: <TrendingUp size={22} />, color: stats.avgPct >= 75 ? 'text-emerald-600' : 'text-amber-500', bg: stats.avgPct >= 75 ? 'bg-emerald-50' : 'bg-amber-50' },
                        { label: 'Below 75%', value: stats.below75, icon: <AlertCircle size={22} />, color: stats.below75 > 0 ? 'text-red-600' : 'text-slate-400', bg: stats.below75 > 0 ? 'bg-red-50' : 'bg-slate-50' },
                        { label: '100% Attendance', value: stats.perfect, icon: <CheckCircle2 size={22} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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

            {/* Results */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : students.length > 0 ? (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-base font-black text-slate-900 tracking-tight">Student Attendance Roster</h2>
                        <span className="text-[12px] font-bold text-slate-400">{students.length} students</span>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {students.map(stu => (
                            <div key={stu.student_id}>
                                {/* Student Row */}
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

                                {/* Expanded: subject details */}
                                {expandedStudent === stu.student_id && (
                                    <div className="px-8 pb-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-3">
                                            {stu.subjects.map(sub => (
                                                <div key={sub.subject_id} className="bg-slate-50/60 rounded-2xl border border-slate-100 p-4">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <div>
                                                            <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 tracking-wider">{sub.subject_code}</span>
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
                    <p className="text-slate-400 mt-2">Select a semester and click Search to generate the report.</p>
                </div>
            )}
        </div>
    );
};

export default InternalExamAttendance;
