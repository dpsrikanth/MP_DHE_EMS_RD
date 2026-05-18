import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ClipboardCheck, CheckCircle2, XCircle, Users, ChevronDown, BookOpen } from 'lucide-react';
import apiClient from '../../api/client';

const FacultyInternalAttendance = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);
    // Group by semester
    const [expandedSemester, setExpandedSemester] = useState(null);

    useEffect(() => {
        apiClient.get('/faculty/internal-exam-attendance')
            .then(res => {
                const rows = res.data || [];
                setData(rows);
                // auto-expand first semester
                const sems = [...new Set(rows.map(r => r.semester_name))];
                if (sems.length > 0) setExpandedSemester(sems[0]);
            })
            .catch(() => toast.error('Failed to load internal exam attendance'))
            .finally(() => setLoading(false));
    }, []);

    // Group subjects by semester
    const semesterGroups = React.useMemo(() => {
        const map = {};
        data.forEach(sub => {
            const sem = sub.semester_name;
            if (!map[sem]) map[sem] = { semester_name: sem, semester_id: sub.semester_id, subjects: [] };
            map[sem].subjects.push(sub);
        });
        return Object.values(map).sort((a, b) => a.semester_id - b.semester_id);
    }, [data]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-600">
                    <ClipboardCheck size={26} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Internal Exam Attendance</h1>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">Student attendance summary across all your assigned subjects and semesters.</p>
                </div>
            </div>

            {semesterGroups.length === 0 ? (
                <div className="bg-white rounded-3xl p-20 text-center border border-slate-200">
                    <BookOpen size={40} className="text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-900">No Data Available</h3>
                    <p className="text-slate-400 mt-2">Internal exam marks haven't been entered for your assigned subjects yet.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {semesterGroups.map(sem => (
                        <div key={sem.semester_name} className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                            {/* Semester accordion header */}
                            <button
                                onClick={() => setExpandedSemester(expandedSemester === sem.semester_name ? null : sem.semester_name)}
                                className="w-full px-8 py-5 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50/30 hover:from-violet-100/60 transition-all border-b border-violet-100/50"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
                                        <ClipboardCheck size={16} className="text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-black text-slate-900 text-base">{sem.semester_name}</p>
                                        <p className="text-[12px] font-bold text-slate-400">{sem.subjects.length} subject{sem.subjects.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${expandedSemester === sem.semester_name ? 'rotate-180' : ''}`} />
                            </button>

                            {expandedSemester === sem.semester_name && (
                                <div className="divide-y divide-slate-50">
                                    {sem.subjects.map(sub => (
                                        <div key={sub.subject_id} className="px-8 py-6">
                                            {/* Subject row header */}
                                            <button
                                                onClick={() => setExpandedSubject(expandedSubject === sub.subject_id ? null : sub.subject_id)}
                                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                                        sub.overall_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                                        sub.overall_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                    }`}>{sub.overall_percentage}%</div>
                                                    <div>
                                                        <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 tracking-wider">{sub.subject_code}</span>
                                                        <p className="font-black text-slate-900 mt-0.5">{sub.subject_name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                                                        <Users size={14} /> {sub.total_entries > 0 ? `${sub.total_entries / sub.components.length | 0} students` : '—'}
                                                    </div>
                                                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                        <CheckCircle2 size={10} /> {sub.total_present} Present
                                                    </span>
                                                    <span className="flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                        <XCircle size={10} /> {sub.total_absent} Absent
                                                    </span>
                                                    <ChevronDown size={16} className={`text-slate-300 transition-transform duration-300 group-hover:text-slate-500 ${expandedSubject === sub.subject_id ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            {/* Component breakdown */}
                                            {expandedSubject === sub.subject_id && sub.components.length > 0 && (
                                                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                                                    <table className="w-full text-left text-[13px]">
                                                        <thead>
                                                            <tr className="bg-slate-50 text-[11px] font-black text-slate-400 tracking-widest uppercase">
                                                                <th className="px-5 py-3">Component</th>
                                                                <th className="px-4 py-3 text-center">Present</th>
                                                                <th className="px-4 py-3 text-center">Absent</th>
                                                                <th className="px-4 py-3 text-center">Total</th>
                                                                <th className="px-5 py-3 text-right">Attendance %</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {sub.components.map(comp => (
                                                                <tr key={comp.component_name} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-5 py-3 font-black text-slate-800">{comp.component_name}</td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className="flex items-center justify-center gap-1 font-black text-emerald-600">
                                                                            <CheckCircle2 size={13} /> {comp.present_count}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className="flex items-center justify-center gap-1 font-black text-red-500">
                                                                            <XCircle size={13} /> {comp.absent_count}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center font-bold text-slate-500">{comp.total_students}</td>
                                                                    <td className="px-5 py-3 text-right">
                                                                        <span className={`px-3 py-1 rounded-full text-[11px] font-black ${
                                                                            comp.attendance_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                                                            comp.attendance_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                                        }`}>{comp.attendance_percentage}%</span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {expandedSubject === sub.subject_id && sub.components.length === 0 && (
                                                <p className="mt-3 text-[13px] text-slate-400 italic">No internal exam marks entered yet for this subject.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FacultyInternalAttendance;
