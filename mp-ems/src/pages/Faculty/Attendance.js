import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { 
    Users, Save, Search, Calendar, Hash, 
    CheckCircle, XCircle, FileText, BarChart3, 
    Filter, Info, Download, ArrowLeft, ArrowRight
} from "lucide-react";
import { useLocation } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';
import { facultyApi } from '../../api/facultyApi';


const Attendance = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'analytics'
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendanceDraft, setAttendanceDraft] = useState({});
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodNumber, setPeriodNumber] = useState(1);
    
    // Analytics specific state
    const [analyticsFilter, setAnalyticsFilter] = useState('all'); // 'all', 'week', 'month', 'year'
    const [summaryStats, setSummaryStats] = useState({ totalSessions: 0, studentMap: {} });

    useEffect(() => {
        fetchAssignedSubjects();
    }, []);

    useEffect(() => {
        if (assignedSubjects.length > 0 && location.state?.assignmentId && !selectedAssignment) {
            const assignment = assignedSubjects.find(a => a.id === location.state.assignmentId);
            if (assignment) {
                const option = {
                    value: assignment.id,
                    label: `${assignment.subject_code} - ${assignment.subject_name} (Sec: ${assignment.section})`
                };
                setSelectedAssignment(option);
            }
        }
    }, [assignedSubjects, location.state, selectedAssignment]);

    useEffect(() => {
        if (selectedAssignment) {
            const assignment = assignedSubjects.find(a => a.id === selectedAssignment.value);
            if (assignment) {
                if (activeTab === 'mark') {
                    fetchSubjectDetails(assignment, attendanceDate, periodNumber);
                } else {
                    fetchAnalytics(assignment, analyticsFilter);
                }
            }
        }
    }, [selectedAssignment, attendanceDate, periodNumber, analyticsFilter, activeTab]);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;
            const data = await facultyApi.getAssignedSubjects(teacherId);
            setAssignedSubjects(data || []);
        } catch (err) {
            toast.error('Failed to load assigned subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectDetails = async (assignment, dateStr, periodNum) => {
        try {
            setLoading(true);
            
            // 1. Fetch Students
            const studentsData = await facultyApi.getStudentsByAssignment({
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                program_id: assignment.program_id
            });
            setStudents(studentsData);

            // 2. Fetch Existing Attendance
            const existingAtt = await facultyApi.getAttendance({
                subject_id: assignment.subject_id,
                section: assignment.section,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id,
                attendance_date: dateStr,
                period_number: periodNum
            });

            // 3. Fetch Overall Summary
            const sData = await facultyApi.getAttendanceSummary({
                subject_id: assignment.subject_id,
                section: assignment.section,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id
            });

            const map = {};
            sData.summary.forEach(s => map[s.student_id] = parseInt(s.present_count));
            setSummaryStats({ totalSessions: sData.totalSessions, studentMap: map });

            // 4. Prepare Draft
            const draft = {};
            studentsData.forEach(st => {
                const rec = existingAtt.find(e => e.student_id === st.id);
                draft[st.id] = rec ? rec.status : 'Present';
            });
            setAttendanceDraft(draft);

        } catch (err) {
            toast.error('Error fetching details');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async (assignment, filter) => {
        try {
            setLoading(true);
            const now = new Date();
            let startDate = null;
            let endDate = now.toISOString().split('T')[0];

            if (filter === 'week') {
                const d = new Date();
                d.setDate(d.getDate() - 7);
                startDate = d.toISOString().split('T')[0];
            } else if (filter === 'month') {
                const d = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate = d.toISOString().split('T')[0];
            } else if (filter === 'year') {
                const d = new Date(now.getFullYear(), 0, 1);
                startDate = d.toISOString().split('T')[0];
            }

            const params = {
                subject_id: assignment.subject_id,
                section: assignment.section,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id,
            };
            if (startDate) {
                params.startDate = startDate;
                params.endDate = endDate;
            }

            const sData = await facultyApi.getAttendanceSummary(params);
            const map = {};
            sData.summary.forEach(s => map[s.student_id] = parseInt(s.present_count));
            setSummaryStats({ totalSessions: sData.totalSessions, studentMap: map });

            // Also fetch student list if not loaded
            if (students.length === 0) {
                const studentsData = await facultyApi.getStudentsByAssignment({
                    college_id: assignment.college_id,
                    semester_id: assignment.semester_id,
                    program_id: assignment.program_id
                });
                setStudents(studentsData);
            }
        } catch (err) {
            toast.error('Error fetching analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAttendance = async () => {
        const assignment = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignment) return;
        setIsSaving(true);
        try {
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;
            const payload = Object.entries(attendanceDraft).map(([studentId, status]) => ({
                student_id: parseInt(studentId),
                status
            }));
            await facultyApi.saveAttendance({
                attendanceData: payload,
                subject_id: assignment.subject_id,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id,
                section: assignment.section,
                teacher_id: teacherId,
                attendance_date: attendanceDate,
                period_number: periodNumber
            });
            toast.success("Attendance saved!");
            fetchSubjectDetails(assignment, attendanceDate, periodNumber);
        } catch (err) {
            toast.error("Error saving.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s => s.name.toLowerCase().includes(q) || s.rollnumber?.toLowerCase().includes(q));
    }, [students, searchQuery]);

    const options = assignedSubjects.map(a => ({
        value: a.id,
        label: `${a.subject_code} - ${a.subject_name} (Sec: ${a.section})`
    }));

    return (
        <div className="p-8 space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Faculty <span className="text-emerald-500 not-italic">Attendance</span></h1>
                        <p className="text-[13px] text-slate-400 font-black tracking-[0.2em] mt-1 ">Track & Analyze engagement in real-time</p>
                    </div>
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
                    <button 
                        onClick={() => setActiveTab('mark')}
                        className={`px-6 py-2.5 rounded-xl text-[13px] font-black  tracking-widest transition-all ${activeTab === 'mark' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}
                    >
                        Mark Attendance
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-2.5 rounded-xl text-[13px] font-black  tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}
                    >
                        Attendance Analytics
                    </button>
                </div>
            </div>

            {/* Selector Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-12 lg:col-span-5 space-y-2">
                    <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic">Assigned Subject & Section</label>
                    <Select
                        options={options}
                        value={selectedAssignment}
                        onChange={setSelectedAssignment}
                        placeholder="Choose a class..."
                        styles={{ 
                            control: (base) => ({ 
                                ...base, 
                                borderRadius: '1.25rem', 
                                padding: '0.2rem',
                                border: '1px solid #f1f5f9',
                                boxShadow: 'none'
                            }) 
                        }}
                    />
                </div>
                
                {activeTab === 'mark' ? (
                    <>
                        <div className="md:col-span-6 lg:col-span-4 space-y-2">
                            <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic">Attendance Date</label>
                            <input 
                                type="date"
                                value={attendanceDate}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                            />
                        </div>
                        <div className="md:col-span-6 lg:col-span-3 space-y-2">
                            <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic">Period Number</label>
                            <input 
                                type="number"
                                min="1"
                                value={periodNumber}
                                onChange={(e) => setPeriodNumber(parseInt(e.target.value) || 1)}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                            />
                        </div>
                    </>
                ) : (
                    <div className="md:col-span-12 lg:col-span-7 space-y-2">
                         <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic">Time Range Analytics</label>
                         <div className="flex gap-2">
                            {[
                                { id: 'all', label: 'All-Time' },
                                { id: 'week', label: 'Past 7 Days' },
                                { id: 'month', label: 'This Month' },
                                { id: 'year', label: 'This Academic Year' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setAnalyticsFilter(filter.id)}
                                    className={`flex-1 py-3 rounded-2xl text-[12px] font-black  tracking-widest transition-all ${analyticsFilter === filter.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                         </div>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : selectedAssignment ? (
                <div className="space-y-6">
                    {/* Top Analytics Bar (Unified) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[12px] font-black text-slate-400  tracking-[0.2em] mb-2">Total Students</h4>
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{students.length}</p>
                         </div>
                         <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="text-[12px] font-black text-slate-400  tracking-[0.2em] mb-2">Sessions Held</h4>
                            <p className="text-2xl font-black text-emerald-600 tracking-tighter">{summaryStats.totalSessions}</p>
                         </div>
                         <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/10 text-white md:col-span-2 flex items-center justify-between">
                            <div>
                                <h4 className="text-[12px] font-black opacity-50  tracking-[0.2em] mb-2 italic">Engagement Alert</h4>
                                <p className="text-[13px] font-bold leading-relaxed">System identifies students with <span className="text-red-400 font-black underline decoration-red-400/50 underline-offset-4">below 75% attendance</span> in the selected period.</p>
                            </div>
                            <Info className="text-slate-700" size={32} />
                         </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-emerald-500" />
                                <h2 className="text-lg font-black text-slate-900 tracking-tight  tracking-tighter italic">
                                    {activeTab === 'mark' ? 'Daily Attendance Registry' : 'Period Analytics Report'}
                                </h2>
                            </div>
                            <div className="w-64">
                                <TableSearch value={searchQuery} onChange={setSearchQuery} placeholder="Filter students..." />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50">
                                    <tr className="text-[12px] font-black text-slate-400  tracking-widest">
                                        <th className="px-8 py-5">Student Identity</th>
                                        <th className="px-6 py-5 text-center">{activeTab === 'mark' ? 'Status' : 'Sessions Attended'}</th>
                                        <th className="px-8 py-5 text-right">{activeTab === 'mark' ? 'Cumulative' : 'Period %'}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map((st) => {
                                        const presentCount = summaryStats.studentMap[st.id] || 0;
                                        const percentage = summaryStats.totalSessions > 0 ? Math.round((presentCount / summaryStats.totalSessions) * 100) : 0;
                                        
                                        return (
                                            <tr key={st.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => activeTab === 'mark' && setAttendanceDraft(p => ({ ...p, [st.id]: p[st.id] === 'Present' ? 'Absent' : 'Present' }))}>
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300 italic">
                                                            {(st.name || st.rollnumber || "?").charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900">{st.name}</p>
                                                            <p className="text-[12px] font-bold text-slate-400  tracking-widest">{st.rollnumber || 'ID:' + st.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    {activeTab === 'mark' ? (
                                                        <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-black  text-[12px] shadow-sm transition-all ${
                                                            attendanceDraft[st.id] === 'Present' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-red-500 text-white shadow-red-500/20'
                                                        }`}>
                                                            {attendanceDraft[st.id] === 'Present' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                            {attendanceDraft[st.id]}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-sm font-black text-slate-900 tracking-tighter italic">{presentCount}</span>
                                                            <span className="text-[9px] font-black text-slate-400  tracking-[0.2em] -mt-1">Presence Log</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className={`text-lg font-black italic tracking-tighter ${percentage >= 75 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {percentage}%
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${percentage >= 75 ? 'bg-emerald-500' : (percentage >= 60 ? 'bg-amber-500' : 'bg-red-500')}`} style={{ width: `${percentage}%` }} />
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {activeTab === 'mark' && (
                            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="text-[13px] font-black text-slate-400  tracking-widest">
                                        Present: <span className="text-emerald-600 text-sm ml-1">{Object.values(attendanceDraft).filter(v => v === 'Present').length}</span>
                                    </div>
                                    <div className="text-[13px] font-black text-slate-400  tracking-widest">
                                        Absent: <span className="text-red-500 text-sm ml-1">{Object.values(attendanceDraft).filter(v => v === 'Absent').length}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveAttendance}
                                    disabled={isSaving}
                                    className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[13px]  tracking-[0.2em] shadow-xl shadow-slate-900/20 transition-all active:scale-[0.98] disabled:bg-slate-400 flex items-center gap-3"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                                    {isSaving ? 'Processing...' : 'Commit Session Log'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-20 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                    <BarChart3 className="mx-auto text-slate-200 mb-4" size={48} />
                    <h3 className="text-lg font-black text-slate-900  italic tracking-tighter">Class Identification Required</h3>
                    <p className="text-sm text-slate-400 mt-2">Please select a subject and section from the menu above to begin.</p>
                </div>
            )}
        </div>
    );
};

export default Attendance;
