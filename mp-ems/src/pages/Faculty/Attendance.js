import useAuthStore from '../../store/useAuthStore';
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
import { milestoneApi } from '../../api/milestoneApi';


const Attendance = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'analytics'
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendanceDraft, setAttendanceDraft] = useState({});
    const [existingAttendance, setExistingAttendance] = useState([]);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodNumber, setPeriodNumber] = useState(1);
    
    // Analytics specific state
    const [analyticsFilter, setAnalyticsFilter] = useState('all'); // 'all', 'week', 'month', 'year'
    const [summaryStats, setSummaryStats] = useState({ totalSessions: 0, studentMap: {} });
    const [roadmapDates, setRoadmapDates] = useState({ start: '', end: '' });

    // Bulk Entry specific states
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [totalSessions, setTotalSessions] = useState(20);
    const [attendedSessions, setAttendedSessions] = useState(15);
    const [clearExisting, setClearExisting] = useState(false);
    const [isBulkSaving, setIsBulkSaving] = useState(false);

    const studentOptions = useMemo(() => {
        return students.map(st => ({
            value: st.id,
            label: `${st.name} (${st.rollnumber || 'ID: ' + st.id})`
        }));
    }, [students]);

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
        } else {
            setStudents([]);
            setSummaryStats({ totalSessions: 0, studentMap: {} });
        }
    }, [selectedAssignment, attendanceDate, periodNumber, analyticsFilter, activeTab]);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const userStr = JSON.stringify(useAuthStore.getState().user || null);
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
            const studentsData = await facultyApi.getStudentsForSubject({
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                program_id: assignment.program_id,
                subject_id: assignment.subject_id,
                academic_year_id: assignment.academic_year_id
            });
            setStudents(studentsData || []);

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

            // 4. Fetch Roadmap Milestones
            try {
                const milestones = await milestoneApi.getMilestones({
                    college_id: assignment.college_id,
                    program_id: assignment.program_id,
                    semester_id: assignment.semester_id,
                    academic_year_id: assignment.academic_year_id
                });
                
                const startMs = milestones.find(m => m.name.toLowerCase().includes('commencement of classes'));
                const endMs = milestones.find(m => m.name.toLowerCase().includes('last working day'));
                
                const formatDatePart = (dateInput) => {
                    if (!dateInput) return '';
                    const d = new Date(dateInput);
                    if (isNaN(d.getTime())) return '';
                    
                    // Use local date methods to correctly interpret dates shifted by UTC storage
                    // (e.g. 2024-07-13 18:30 UTC is 2024-07-14 local in India)
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                };

                if (startMs && endMs) {
                    const start = formatDatePart(startMs.start_date);
                    const end = formatDatePart(endMs.end_date);
                    setRoadmapDates({ start, end });
                    
                    // If current date is outside range, adjust it to the start of classes
                    if (attendanceDate < start || attendanceDate > end) {
                        setAttendanceDate(start);
                    }
                } else {
                    setRoadmapDates({ start: '', end: '' });
                }
            } catch (err) {
                console.error("Error fetching roadmap:", err);
            }

            // 5. Prepare Draft
            setExistingAttendance(existingAtt);
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
            } else if (filter === 'all' && roadmapDates.start) {
                // If "All-Time" is selected, scope it to the Roadmap dates
                startDate = roadmapDates.start;
                endDate = roadmapDates.end;
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
                const studentsData = await facultyApi.getStudentsForSubject({
                    college_id: assignment.college_id,
                    semester_id: assignment.semester_id,
                    program_id: assignment.program_id,
                    subject_id: assignment.subject_id,
                    academic_year_id: assignment.academic_year_id
                });
                setStudents(studentsData || []);
            }
        } catch (err) {
            toast.error('Error fetching analytics');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAttendance = async () => {
        const assignment = assignedSubjects.find(a => a.id === selectedAssignment?.value);
        if (!assignment) return;
        setIsSaving(true);
        try {
            const userStr = JSON.stringify(useAuthStore.getState().user || null);
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

    const handleCommitBulkAttendance = async () => {
        const assignment = assignedSubjects.find(a => a.id === selectedAssignment?.value);
        if (!assignment || !selectedStudent) return;
        
        setIsBulkSaving(true);
        try {
            await facultyApi.bulkGenerateAttendance({
                student_id: selectedStudent.value,
                subject_id: assignment.subject_id,
                college_id: assignment.college_id,
                semester_id: assignment.semester_id,
                academic_year_id: assignment.academic_year_id,
                section: assignment.section,
                teacher_id: assignment.teacher_id,
                total_sessions: totalSessions,
                attended_sessions: attendedSessions,
                clear_existing: clearExisting
            });
            toast.success("Summary attendance committed successfully!");
            
            // Clear inputs / reset
            setSelectedStudent(null);
            setClearExisting(false);
            
            // Refresh details in other tabs and summary stats!
            fetchSubjectDetails(assignment, attendanceDate, periodNumber);
            
        } catch (err) {
            const errMsg = err.response?.data?.error || "Error committing summary attendance.";
            toast.error(errMsg);
        } finally {
            setIsBulkSaving(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery.trim()) return students;
        const q = searchQuery.toLowerCase();
        return students.filter(s => 
            (s.name || "").toLowerCase().includes(q) || 
            (s.rollnumber || "").toLowerCase().includes(q)
        );
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
                        className={`px-4 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all ${activeTab === 'mark' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}
                    >
                        Mark Attendance
                    </button>
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all ${activeTab === 'analytics' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}
                    >
                        Attendance Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('bulk')}
                        className={`px-4 py-2.5 rounded-xl text-[13px] font-black tracking-widest transition-all ${activeTab === 'bulk' ? 'bg-white text-emerald-600 shadow-lg' : 'text-slate-500'}`}
                    >
                        Bulk/Summary Entry
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
                            <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic flex justify-between">
                                Attendance Date
                                {roadmapDates.start && (
                                    <span className="text-[10px] text-emerald-600 opacity-60">Roadmap: {roadmapDates.start} to {roadmapDates.end}</span>
                                )}
                            </label>
                            <input 
                                type="date"
                                value={attendanceDate}
                                min={roadmapDates.start}
                                max={roadmapDates.end}
                                onChange={(e) => setAttendanceDate(e.target.value)}
                                className={`w-full px-5 py-3 bg-slate-50 border rounded-2xl outline-none focus:bg-white focus:ring-2 transition-all font-bold text-sm ${
                                    roadmapDates.start && (attendanceDate < roadmapDates.start || attendanceDate > roadmapDates.end)
                                    ? 'border-red-300 focus:ring-red-500/20' 
                                    : 'border-slate-100 focus:ring-indigo-500/20'
                                }`}
                            />
                        </div>
                        <div className="md:col-span-6 lg:col-span-3 space-y-2">
                            <label className="text-[12px] font-black text-slate-400  tracking-widest ml-1 italic">Period Number</label>
                            <input 
                                type="number"
                                min="1"
                                value={periodNumber}
                                onChange={(e) => setPeriodNumber(parseInt(e.target.value) || 1)}
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold text-sm"
                            />
                        </div>
                    </>
                ) : activeTab === 'analytics' ? (
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
                                    className={`flex-1 py-3 rounded-2xl text-[12px] font-black  tracking-widest transition-all ${analyticsFilter === filter.id ? 'bg-emerald-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                         </div>
                    </div>
                ) : (
                    <div className="md:col-span-12 lg:col-span-7 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-800">
                        <Info size={18} className="text-emerald-600 shrink-0" />
                        <span className="text-xs font-semibold leading-relaxed">
                            <strong>Summary Override:</strong> This allocates attendance backward from today, bypassing the need to enter date-by-date records.
                        </span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : selectedAssignment ? (
                activeTab === 'bulk' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* LEFT: Premium styled Bulk Entry Form */}
                        <div className="lg:col-span-7 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                                <Users size={24} className="text-emerald-500" />
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight italic">Bulk Summary Attendance Generator</h2>
                                    <p className="text-xs text-slate-400 font-bold">Generate cumulative session logs directly</p>
                                </div>
                            </div>

                            {/* Select Student */}
                            <div className="space-y-2">
                                <label className="text-[12px] font-black text-slate-400 tracking-widest uppercase block">Select Student</label>
                                <Select
                                    options={studentOptions}
                                    value={selectedStudent}
                                    onChange={setSelectedStudent}
                                    placeholder="Search student by name or roll number..."
                                    isSearchable
                                    styles={{ 
                                        control: (base) => ({ 
                                            ...base, 
                                            borderRadius: '1.25rem', 
                                            padding: '0.3rem',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: 'none'
                                        }) 
                                    }}
                                />
                            </div>

                            {/* Sessions Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 tracking-widest uppercase block">Total Sessions</label>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={totalSessions}
                                        onChange={(e) => setTotalSessions(Math.max(1, parseInt(e.target.value) || 0))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[12px] font-black text-slate-400 tracking-widest uppercase block">Attended Sessions</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        max={totalSessions}
                                        value={attendedSessions}
                                        onChange={(e) => setAttendedSessions(Math.min(totalSessions, Math.max(0, parseInt(e.target.value) || 0)))}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold text-sm"
                                    />
                                </div>
                            </div>

                            {/* Stylish Toggle for Clear Existing */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-800">Clear existing daily logs</h4>
                                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                                        Delete previous session records for this student and subject before overriding.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={clearExisting} 
                                        onChange={(e) => setClearExisting(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>

                            {/* Commit Button */}
                            <button
                                onClick={handleCommitBulkAttendance}
                                disabled={isBulkSaving || !selectedStudent}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-black text-sm tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none flex items-center justify-center gap-3"
                            >
                                {isBulkSaving ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <Save size={18} />
                                )}
                                {isBulkSaving ? 'COMMITTING OVERRIDE...' : 'COMMIT SUMMARY ATTENDANCE'}
                            </button>
                        </div>

                        {/* RIGHT: Live Preview & Status Warning Panel */}
                        <div className="lg:col-span-5 space-y-6">
                            {/* Card 1: Calculated Live Preview */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                                <h3 className="text-xs font-black tracking-[0.2em] text-emerald-400 uppercase">Live Output Preview</h3>
                                
                                <div className="mt-8 flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tighter italic">
                                        {totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 100}%
                                    </span>
                                    <span className="text-slate-400 text-sm font-bold">attendance rate</span>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="flex justify-between text-xs font-bold text-slate-300 border-b border-white/5 pb-2">
                                        <span>Student Identity:</span>
                                        <span className="text-white font-extrabold">{selectedStudent ? selectedStudent.label : 'None Selected'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-300 border-b border-white/5 pb-2">
                                        <span>Sessions Present:</span>
                                        <span className="text-white font-extrabold">{attendedSessions} sessions</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-300 border-b border-white/5 pb-2">
                                        <span>Total Sessions:</span>
                                        <span className="text-white font-extrabold">{totalSessions} sessions</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-300">
                                        <span>Sessions Absent:</span>
                                        <span className="text-white font-extrabold">{totalSessions - attendedSessions} sessions</span>
                                    </div>
                                </div>

                                <div className="mt-6 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            (attendedSessions / totalSessions) >= 0.75 ? 'bg-emerald-500' : 'bg-red-500'
                                        }`} 
                                        style={{ width: `${totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Card 2: Warning Banner if attendance rate is below 75% */}
                            {(attendedSessions / totalSessions) < 0.75 ? (
                                <div className="bg-red-50 border border-red-100 rounded-3xl p-6 flex items-start gap-4">
                                    <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                                        <XCircle size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-red-900 tracking-tight">Eligibility Shortage Detected</h4>
                                        <p className="text-xs text-red-700 leading-relaxed font-semibold">
                                            The proposed attendance rate of <strong>{Math.round((attendedSessions / totalSessions) * 100)}%</strong> is below the mandatory <strong>75% threshold</strong>. This student will be flagged as restricted from exam eligibility.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-start gap-4">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-black text-emerald-900 tracking-tight">Standard Eligibility Met</h4>
                                        <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                                            This student's attendance rate is <strong>{Math.round((attendedSessions / totalSessions) * 100)}%</strong>, which meets the standard <strong>75% compliance level</strong> for course credits.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
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
                         <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2rem] text-white md:col-span-2 flex items-center gap-4 relative overflow-hidden shadow-xl">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-8 -mt-8 blur-xl" />
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                                <Info size={18} className="text-indigo-300" />
                            </div>
                            <div className="relative z-10 space-y-0.5">
                                <h4 className="text-[10px] font-black opacity-60 tracking-widest uppercase">Engagement Alert</h4>
                                <p className="text-[11px] font-bold leading-relaxed opacity-80">System identifies students with <span className="text-red-400 font-black">below 75% attendance</span> in the selected period.</p>
                            </div>
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
                                        const isEdit = existingAttendance.length > 0;
                                        const currentStatus = attendanceDraft[st.id] || 'Present';

                                        // Total sessions if we include the current one (if it's new)
                                        const virtualTotal = isEdit ? summaryStats.totalSessions : summaryStats.totalSessions + 1;

                                        // Current present count adjusted for the draft
                                        let virtualPresent = presentCount;
                                        if (isEdit) {
                                            const wasPresent = existingAttendance.find(e => e.student_id === st.id)?.status === 'Present';
                                            if (wasPresent && currentStatus === 'Absent') virtualPresent -= 1;
                                            if (!wasPresent && currentStatus === 'Present') virtualPresent += 1;
                                        } else {
                                            if (currentStatus === 'Present') virtualPresent += 1;
                                        }

                                        const percentage = virtualTotal > 0 ? Math.round((virtualPresent / virtualTotal) * 100) : 100;
                                        
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
                                                            attendanceDraft[st.id] === 'Present' ? 'bg-emerald-500 text-white shadow-indigo-500/20' : 'bg-red-500 text-white shadow-red-500/20'
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
                                                            <div className={`h-full rounded-full transition-all duration-1000 ${percentage >= 75 ? 'bg-emerald-500' : (percentage >= 60 ? 'bg-indigo-600' : 'bg-red-500')}`} style={{ width: `${percentage}%` }} />
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
                                    className="px-10 py-4 bg-indigo-600 hover:bg-slate-800 text-white rounded-2xl font-black text-[13px]  tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:bg-slate-400 flex items-center gap-3"
                                >
                                    {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                                    {isSaving ? 'Processing...' : 'Commit Session Log'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) ) : (
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
