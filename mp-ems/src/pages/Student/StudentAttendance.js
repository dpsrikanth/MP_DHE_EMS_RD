import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, BookOpen, Clock, AlertCircle, 
  CheckCircle2, XCircle, ChevronRight, LayoutDashboard,
  Filter, BarChart3, Info, ChevronDown, CalendarDays,
  History, Search
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { getApiUrl } from '../../config';

const AttendanceDetail = ({ subjectId, dateFilter }) => {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(getApiUrl(`/student/attendance-detail/${subjectId}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setDetails(data);
                }
            } catch (error) {
                console.error("Error fetching details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [subjectId]);

    const filteredDetails = useMemo(() => {
        if (dateFilter === 'all') return details;
        const now = new Date();
        return details.filter(item => {
            const date = new Date(item.attendance_date);
            if (dateFilter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            }
            if (dateFilter === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            if (dateFilter === 'year') {
                return date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [details, dateFilter]);

    if (loading) {
        return (
            <div className="py-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (filteredDetails.length === 0) {
        return <div className="py-4 text-center text-xs text-slate-400 font-bold uppercase italic">No session history found for this period</div>;
    }

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
            <table className="w-full text-left text-xs">
                <thead>
                    <tr className="bg-slate-100/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <th className="px-5 py-3">Date</th>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-5 py-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredDetails.map((row, i) => (
                        <tr key={i} className="hover:bg-white transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-700">
                                {formatDate(row.attendance_date)}
                            </td>
                            <td className="px-4 py-3 font-black text-slate-400">P{row.period_number}</td>
                            <td className="px-4 py-3 font-bold text-slate-500 italic">{row.section || 'N/A'}</td>
                            <td className="px-5 py-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[9px] ${
                                    row.status === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                }`}>
                                    {row.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const CombinedHistory = ({ dateFilter }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(getApiUrl('/student/attendance-history'), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredHistory = useMemo(() => {
        if (dateFilter === 'all') return history;
        const now = new Date();
        return history.filter(item => {
            const date = new Date(item.attendance_date);
            if (dateFilter === 'week') {
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(now.getDate() - 7);
                return date >= oneWeekAgo;
            }
            if (dateFilter === 'month') {
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
            }
            if (dateFilter === 'year') {
                return date.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [history, dateFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px]">
                <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (filteredHistory.length === 0) {
        return (
            <div className="p-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <CalendarDays size={48} className="mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-black text-slate-800">No Combined Records</h3>
                <p className="text-sm text-slate-400 mt-2">No attendance entries found for the selected time period.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5">Date & Time</th>
                        <th className="px-6 py-5">Subject</th>
                        <th className="px-6 py-5">Section & Period</th>
                        <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {filteredHistory.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-black group-hover:bg-sky-500 group-hover:text-white transition-colors duration-300">
                                        <div className="text-[10px] italic">{formatDate(row.attendance_date)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-none">Session Entry</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <p className="text-xs font-black text-slate-900 group-hover:text-sky-600 transition-colors">{row.subject_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.subject_code}</p>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase">Period {row.period_number}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase italic">{row.section || 'N/A'}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black uppercase text-[10px] shadow-sm ${
                                    row.status === 'Present' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                }`}>
                                    {row.status === 'Present' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                    {row.status}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [activeTab, setActiveTab] = useState('subject'); // 'subject' | 'history'
    const [dateFilter, setDateFilter] = useState('all'); // 'all', 'week', 'month', 'year'

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(getApiUrl('/student/attendance'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAttendance(data);
            } else {
                toast.error("Failed to fetch attendance records");
            }
        } catch (error) {
            toast.error("Network error fetching attendance");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (percentage >= 60) return 'text-amber-600 bg-amber-50 border-amber-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 75) return 'bg-emerald-500';
        if (percentage >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const overallAttendance = attendance.length > 0
        ? (attendance.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage), 0) / attendance.length).toFixed(1)
        : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
                        <History size={26} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Attendance <span className="text-sky-500 not-italic">Analytics</span></h1>
                        <p className="text-xs text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Advanced academic engagement tracking</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('subject')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'subject' ? 'bg-white text-sky-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        By Subject
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'history' ? 'bg-white text-sky-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Combined History
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 whitespace-nowrap">Time Filter:</p>
                    {[
                        { id: 'all', label: 'All Time' },
                        { id: 'week', label: 'This Week' },
                        { id: 'month', label: 'This Month' },
                        { id: 'year', label: 'This Year' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setDateFilter(f.id)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                dateFilter === f.id ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 text-sky-600 text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                    <Info size={12} /> Live synchronization enabled
                </div>
            </div>

            {activeTab === 'subject' ? (
                <>
                    {/* Top Metrics (only shown in subject view) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
                            <BarChart3 className="text-sky-500 mb-4" size={32} />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Overall Percentage</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{overallAttendance}%</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${parseFloat(overallAttendance) >= 75 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {parseFloat(overallAttendance) >= 75 ? 'On Track' : 'Below Target'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <BookOpen className="text-indigo-500 mb-4" size={32} />
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Courses Enrolled</h3>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{attendance.length} Subjects</span>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full blur-[60px] opacity-20" />
                             <AlertCircle className="text-amber-400 mb-4" size={32} />
                             <h3 className="text-sm font-black opacity-60 uppercase tracking-widest mb-1 italic">Exam Eligibility</h3>
                             <p className="text-xs font-bold leading-relaxed">Ensure a minimum of <span className="text-amber-400 font-black">75%</span> engagement per course for hall ticket validation.</p>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-tighter">Subject-wise Summary</h2>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Clock size={12} /> Refreshed: Just now
                            </div>
                        </div>

                        {attendance.length === 0 ? (
                            <div className="p-20 text-center">
                                <Info size={32} className="text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-800">No Enrolled Courses</h3>
                                <p className="text-sm text-slate-400">Your registered subjects will appear here once faculty starts the session log.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {attendance.map((sub, idx) => (
                                    <div key={idx} className="p-8 hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => setExpandedSubject(expandedSubject === sub.subject_id ? null : sub.subject_id)}>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${getStatusColor(sub.attendance_percentage)}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded uppercase tracking-wider border border-sky-100">
                                                            {sub.subject_code}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight uppercase">{sub.subject_name}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <div className="flex items-center gap-1.5 underline decoration-emerald-500/30 underline-offset-4">
                                                            <CheckCircle2 size={12} className="text-emerald-500" /> {sub.attended_sessions} Attended
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <BarChart3 size={12} className="text-slate-400" /> {sub.total_sessions} Total Sessions
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-900 italic tracking-tighter">{sub.attendance_percentage}%</span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presence</span>
                                                    </div>
                                                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner relative">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${getProgressColor(sub.attendance_percentage)}`}
                                                            style={{ width: `${sub.attendance_percentage}%` }}
                                                        />
                                                        {sub.attendance_percentage < 75 && (
                                                            <div className="absolute right-0 top-0 bottom-0 w-[25%] border-l-2 border-red-400/30 bg-red-400/5 shadow-[inset_-4px_0_10px_rgba(239,68,68,0.05)]" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`text-slate-300 transition-transform duration-300 ${expandedSubject === sub.subject_id ? 'rotate-180 text-sky-500' : ''}`}>
                                                    <ChevronDown size={24} />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {expandedSubject === sub.subject_id && (
                                            <div className="animate-in slide-in-from-top-2 duration-300" onClick={(e) => e.stopPropagation()}>
                                                <AttendanceDetail subjectId={sub.subject_id} dateFilter={dateFilter} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <CombinedHistory dateFilter={dateFilter} />
            )}
            
            <div className="flex items-center justify-center gap-2 p-6 bg-slate-100/50 rounded-[2rem] border border-slate-200/50">
                <Info size={14} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">
                    Contact your department HOD for any attendance discrepancies in the log.
                </p>
            </div>
        </div>
    );
};

export default StudentAttendance;
