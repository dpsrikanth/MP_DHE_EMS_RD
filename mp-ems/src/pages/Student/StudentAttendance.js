import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, BookOpen, Clock, AlertCircle, 
  CheckCircle2, XCircle, ChevronRight, LayoutDashboard,
  Filter, BarChart3, Info, ChevronDown, CalendarDays,
  History, Search, ClipboardCheck, Target
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';
import { studentApi } from '../../api/studentApi';
import { masterDataApi } from '../../api/masterDataApi';

const AttendanceDetail = ({ subjectId, dateFilter }) => {
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await studentApi.getAttendanceDetail(subjectId);
                if (data) {
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
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (filteredDetails.length === 0) {
        return <div className="py-4 text-center text-[13px] text-slate-400 font-bold  italic">No session history found for this period</div>;
    }

    return (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/50">
            <table className="w-full text-left text-[13px]">
                <thead>
                    <tr className="bg-slate-100/50 text-[12px] font-black text-slate-500  tracking-widest">
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
                                <span className={`px-2 py-0.5 rounded-full font-black  text-[9px] ${
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
                const data = await studentApi.getAttendanceHistory();
                if (data) {
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
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
                    <tr className="text-[12px] font-black text-slate-400  tracking-widest">
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
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex flex-col items-center justify-center font-black group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                        <div className="text-[12px] italic">{formatDate(row.attendance_date)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-900 leading-none">Session Entry</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <p className="text-[13px] font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{row.subject_name}</p>
                                <p className="text-[12px] font-bold text-slate-400  tracking-widest">{row.subject_code}</p>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black ">Period {row.period_number}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black  italic">{row.section || 'N/A'}</span>
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-black  text-[12px] shadow-sm ${
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
    const [activeTab, setActiveTab] = useState('subject'); // 'subject' | 'history' | 'internal'
    const [dateFilter, setDateFilter] = useState('all');
    const [internalExamData, setInternalExamData] = useState([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [expandedSemester, setExpandedSemester] = useState(null);

    // Semester-wise states
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [semestersList, setSemestersList] = useState([]);
    const [selectedSemester, setSelectedSemester] = useState('');

    useEffect(() => {
        const loadSemestersAndAttendance = async () => {
            try {
                // Fetch active semesters
                const sems = await masterDataApi.getSemesters();
                setSemestersList(sems || []);
                
                // Find matching semester ID for the user's current semester
                const studentSemName = user.semister?.trim() || '';
                let defaultSem = null;
                
                if (sems && sems.length > 0 && studentSemName) {
                    // Try exact match
                    defaultSem = sems.find(s => s.semester_name.toLowerCase() === studentSemName.toLowerCase());
                    // Try matching numbers if not found (e.g. "Semester 3" vs "3")
                    if (!defaultSem) {
                        const numMatch = studentSemName.match(/\d+/);
                        if (numMatch) {
                            defaultSem = sems.find(s => s.semester_name.includes(numMatch[0]));
                        }
                    }
                    // Fallback to first if still not found
                    if (!defaultSem) {
                        defaultSem = sems[0];
                    }
                } else if (sems && sems.length > 0) {
                    defaultSem = sems[0];
                }

                if (defaultSem) {
                    setSelectedSemester(defaultSem.id.toString());
                    fetchAttendance(defaultSem.id.toString());
                } else {
                    fetchAttendance();
                }
            } catch (error) {
                console.error("Failed to load semesters:", error);
                fetchAttendance();
            }
        };
        loadSemestersAndAttendance();
    }, []);

    const fetchInternalExamAttendance = async () => {
        if (internalExamData.length > 0) return; // already loaded
        setInternalLoading(true);
        try {
            const data = await studentApi.getInternalExamAttendance();
            setInternalExamData(data || []);
            if (data && data.length > 0) setExpandedSemester(data[0].semester_name);
        } catch (err) {
            toast.error('Failed to load internal exam attendance');
        } finally {
            setInternalLoading(false);
        }
    };

    const fetchAttendance = async (semesterId) => {
        setLoading(true);
        try {
            const params = {};
            if (semesterId) {
                params.semester_id = semesterId;
            }
            const data = await studentApi.getAttendanceSummary(params);
            if (data) {
                setAttendance(data);
            } else {
                toast.error("Failed to fetch attendance records");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.response?.data?.error || "Network error fetching attendance");
        } finally {
            setLoading(false);
        }
    };

    const handleSemesterChange = (semesterId) => {
        setSelectedSemester(semesterId);
        fetchAttendance(semesterId);
    };

    const getStatusColor = (percentage) => {
        if (percentage >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
        if (percentage >= 60) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
        return 'text-red-600 bg-red-50 border-red-100';
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 75) return 'bg-emerald-500';
        if (percentage >= 60) return 'bg-indigo-600';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
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
                    <div className="w-14 h-14 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                        <History size={26} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Attendance <span className="text-indigo-600 not-italic">Analytics</span></h1>
                        <p className="text-[13px] text-slate-400 font-black tracking-[0.2em] mt-1 ">Advanced academic engagement tracking</p>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 gap-1">
                    <button 
                        onClick={() => setActiveTab('subject')}
                        className={`px-5 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all duration-300 ${activeTab === 'subject' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        By Subject
                    </button>
                    <button 
                        onClick={() => setActiveTab('history')}
                        className={`px-5 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all duration-300 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        History
                    </button>
                    <button 
                        onClick={() => { setActiveTab('internal'); fetchInternalExamAttendance(); }}
                        className={`px-5 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all duration-300 flex items-center gap-1.5 ${activeTab === 'internal' ? 'bg-white text-violet-600 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <ClipboardCheck size={14} /> Internal Exams
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-6">
                    {/* Semester Dropdown */}
                    {semestersList.length > 0 && (
                        <div className="flex items-center gap-2">
                            <p className="text-[12px] font-black text-slate-400 tracking-widest mr-2 whitespace-nowrap uppercase">Semester:</p>
                            <div className="relative">
                                <select 
                                    value={selectedSemester}
                                    onChange={(e) => handleSemesterChange(e.target.value)}
                                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2 px-4 pr-10 rounded-xl text-[12px] font-black tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer shadow-sm hover:bg-slate-100"
                                >
                                    {semestersList.map((sem) => (
                                        <option key={sem.id} value={sem.id}>
                                            {sem.semester_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                                    <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Divider (visible on md screens) */}
                    {semestersList.length > 0 && (
                        <div className="hidden md:block w-px h-6 bg-slate-200" />
                    )}

                    {/* Time Filter */}
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
                        <p className="text-[12px] font-black text-slate-400 tracking-widest mr-2 whitespace-nowrap uppercase">Time Filter:</p>
                        {[
                            { id: 'all', label: 'All Time' },
                            { id: 'week', label: 'This Week' },
                            { id: 'month', label: 'This Month' },
                            { id: 'year', label: 'This Year' }
                        ].map(f => (
                            <button
                                key={f.id}
                                onClick={() => setDateFilter(f.id)}
                                className={`px-4 py-1.5 rounded-full text-[12px] font-black tracking-widest transition-all whitespace-nowrap ${
                                    dateFilter === f.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 text-[12px] font-black tracking-widest italic animate-pulse">
                    <Info size={12} /> Live synchronization enabled
                </div>
            </div>

            {activeTab === 'subject' ? (
                <>
                    {/* Top Metrics (only shown in subject view) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity" />
                            <BarChart3 className="text-indigo-600 mb-4" size={32} />
                            <h3 className="text-sm font-black text-slate-400  tracking-widest mb-1">Overall Percentage</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-slate-900 tracking-tighter">{overallAttendance}%</span>
                                <span className={`text-[12px] font-black  px-2 py-0.5 rounded-full ${parseFloat(overallAttendance) >= 75 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                    {parseFloat(overallAttendance) >= 75 ? 'On Track' : 'Below Target'}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                            <BookOpen className="text-indigo-500 mb-4" size={32} />
                            <h3 className="text-sm font-black text-slate-400  tracking-widest mb-1">Courses Enrolled</h3>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">{attendance.length} Subjects</span>
                        </div>

                        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20" />
                             <AlertCircle className="text-indigo-200 mb-4" size={32} />
                             <h3 className="text-sm font-black opacity-60  tracking-widest mb-1 italic">Exam Eligibility</h3>
                             <p className="text-[13px] font-bold leading-relaxed">Ensure a minimum of <span className="text-indigo-400 font-black">75%</span> engagement per course for hall ticket validation.</p>
                        </div>
                    </div>

                    {/* Attendance List */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight  tracking-tighter">Subject-wise Summary</h2>
                            <div className="flex items-center gap-2 text-[12px] font-black text-slate-400  tracking-widest">
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
                                                        <span className="text-[12px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded  tracking-wider border border-indigo-100">
                                                            {sub.subject_code}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-xl font-black text-slate-900 leading-tight tracking-tight ">{sub.subject_name}</h3>
                                                    <div className="flex items-center gap-4 mt-2 text-[12px] font-black text-slate-400  tracking-widest">
                                                        <div className="flex items-center gap-1.5 underline decoration-emerald-500/30 underline-offset-4">
                                                            <CheckCircle2 size={12} className="text-emerald-500" /> {sub.attended_sessions} Attended
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <BarChart3 size={12} className="text-slate-400" /> {sub.total_sessions} Total Sessions
                                                        </div>
                                                    </div>
                                                    {parseFloat(sub.attendance_percentage) < 75 && (
                                                        <div className="flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-[11px] font-black text-amber-700 max-w-fit shadow-sm">
                                                            <Target size={11} className="text-amber-500 animate-pulse" />
                                                            Need to attend the next <span className="text-amber-900 underline font-black">{Math.max(0, Math.ceil((75 * Number(sub.total_sessions) - 100 * Number(sub.attended_sessions)) / 25))}</span> classes consecutively to recover target 75%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-8">
                                                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-2xl font-black text-slate-900 italic tracking-tighter">{sub.attendance_percentage}%</span>
                                                        <span className="text-[12px] font-black text-slate-400  tracking-widest">Presence</span>
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
                                                <div className={`text-slate-300 transition-transform duration-300 ${expandedSubject === sub.subject_id ? 'rotate-180 text-indigo-600' : ''}`}>
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
            ) : activeTab === 'history' ? (
                <CombinedHistory dateFilter={dateFilter} />
            ) : (
                /* ── Internal Exam Attendance Tab ── */
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Summary Header */}
                    {internalExamData.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {internalExamData.map((sem) => (
                                <div key={sem.semester_name} className="bg-white rounded-2xl border border-slate-100 shadow-md p-5 text-center hover:shadow-lg transition-shadow">
                                    <p className="text-[11px] font-black text-slate-400 tracking-widest mb-1">{sem.semester_name}</p>
                                    <p className={`text-3xl font-black tracking-tighter ${
                                        sem.semester_percentage >= 75 ? 'text-emerald-600' :
                                        sem.semester_percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>{sem.semester_percentage}%</p>
                                    <p className="text-[11px] text-slate-400 font-bold mt-1">{sem.semester_present}/{sem.semester_total} Present</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {internalLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : internalExamData.length === 0 ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
                            <ClipboardCheck size={40} className="text-slate-200 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-slate-800">No Internal Exam Records</h3>
                            <p className="text-sm text-slate-400 mt-1">Your exam attendance will appear here once faculty enters marks.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {internalExamData.map((sem) => (
                                <div key={sem.semester_name} className="bg-white rounded-[1.5rem] border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
                                    {/* Semester Header */}
                                    <button
                                        onClick={() => setExpandedSemester(expandedSemester === sem.semester_name ? null : sem.semester_name)}
                                        className="w-full px-8 py-5 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50/30 border-b border-violet-100/50 hover:from-violet-100/60 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                                                <ClipboardCheck size={18} className="text-white" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-base font-black text-slate-900 tracking-tight">{sem.semester_name}</p>
                                                <p className="text-[12px] font-bold text-slate-400">{sem.subjects.length} Subjects · {sem.semester_present}/{sem.semester_total} Exams Attended</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[13px] font-black ${
                                                sem.semester_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                                sem.semester_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>{sem.semester_percentage}% Attendance</span>
                                            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${expandedSemester === sem.semester_name ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>

                                    {/* Subject rows */}
                                    {expandedSemester === sem.semester_name && (
                                        <div className="divide-y divide-slate-50">
                                            {sem.subjects.map((sub) => (
                                                <div key={sub.subject_id} className="px-8 py-6">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                        <div>
                                                            <span className="text-[11px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded border border-violet-100 tracking-wider">{sub.subject_code}</span>
                                                            <h4 className="text-base font-black text-slate-900 mt-1">{sub.subject_name}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[12px] font-bold text-slate-400">{sub.present_count}/{sub.total_components}</span>
                                                            <span className={`px-3 py-1 rounded-full text-[12px] font-black ${
                                                                sub.attendance_percentage >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                                                sub.attendance_percentage >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                                            }`}>{sub.attendance_percentage}%</span>
                                                        </div>
                                                    </div>
                                                    {/* Component Pills */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {sub.components.map((comp) => (
                                                            <div key={comp.component_name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-black ${
                                                                comp.status === 'Present'
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                                    : 'bg-red-50 border-red-200 text-red-700'
                                                            }`}>
                                                                {comp.status === 'Present'
                                                                    ? <CheckCircle2 size={12} />
                                                                    : <XCircle size={12} />}
                                                                {comp.component_name}
                                                                {comp.marks_obtained !== null && comp.status === 'Present' && (
                                                                    <span className="ml-1 text-[10px] opacity-70">({comp.marks_obtained})</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex items-center justify-center gap-2 p-6 bg-slate-100/50 rounded-[2rem] border border-slate-200/50">
                <Info size={14} className="text-slate-400" />
                <p className="text-[12px] font-black text-slate-400  tracking-[0.2em] italic">
                    Contact your department HOD for any attendance discrepancies in the log.
                </p>
            </div>
        </div>
    );
};

export default StudentAttendance;
