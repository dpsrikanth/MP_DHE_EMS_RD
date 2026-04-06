import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Users, Save, Search, Calendar, Hash, CheckCircle, XCircle, FileText } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';

const Attendance = () => {
    const location = useLocation();
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendanceDraft, setAttendanceDraft] = useState({});
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodNumber, setPeriodNumber] = useState(1);
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
                fetchSubjectDetails(assignment, attendanceDate, periodNumber);
            }
        }
    }, [assignedSubjects, location.state, selectedAssignment]);

    // Refetch when date or period changes
    useEffect(() => {
        if (selectedAssignment) {
            const assignment = assignedSubjects.find(a => a.id === selectedAssignment.value);
            if (assignment) fetchSubjectDetails(assignment, attendanceDate, periodNumber);
        }
    }, [attendanceDate, periodNumber]);

    const fetchAssignedSubjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            const res = await fetch(`http://localhost:8080/api/faculty-marks/assigned-subjects/${teacherId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAssignedSubjects(data || []);
            }
        } catch (err) {
            toast.error('Failed to load assigned subjects');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectDetails = async (assignment, dateStr, periodNum) => {
        if (!assignment) return;
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // 1. Fetch Students
            const studentsRes = await fetch(`http://localhost:8080/api/faculty-marks/students?college_id=${assignment.college_id}&semester_id=${assignment.semester_id}&program_id=${assignment.program_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let studentsData = [];
            if (studentsRes.ok) {
                studentsData = await studentsRes.json();
                // Filter by section if we had section grouping in students, but for now we assume they apply.
            }
            setStudents(studentsData);

            // 2. Fetch specific attendance for date + period
            const attRes = await fetch(`http://localhost:8080/api/faculty-marks/attendance?subject_id=${assignment.subject_id}&section=${assignment.section}&college_id=${assignment.college_id}&semester_id=${assignment.semester_id}&academic_year_id=${assignment.academic_year_id}&attendance_date=${dateStr}&period_number=${periodNum}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let existingAtt = [];
            if (attRes.ok) {
                existingAtt = await attRes.json();
            }

            // 3. Fetch summary stats
            const summaryRes = await fetch(`http://localhost:8080/api/faculty-marks/attendance-summary?subject_id=${assignment.subject_id}&section=${assignment.section}&college_id=${assignment.college_id}&semester_id=${assignment.semester_id}&academic_year_id=${assignment.academic_year_id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (summaryRes.ok) {
                const sData = await summaryRes.json();
                const map = {};
                sData.summary.forEach(s => map[s.student_id] = parseInt(s.present_count));
                setSummaryStats({ totalSessions: sData.totalSessions, studentMap: map });
            }

            // 4. Merge into draft state (Default 'Present' if no record for the day, but we only create records on Save)
            const draft = {};
            studentsData.forEach(st => {
                const rec = existingAtt.find(e => e.student_id === st.id);
                // If the record exists, use it, else default to 'Present' for unsaved days to make it easy
                draft[st.id] = rec ? rec.status : 'Present';
            });
            setAttendanceDraft(draft);

        } catch (err) {
            toast.error('Error fetching details for attendance');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignmentSelect = (selectedOption) => {
        setSelectedAssignment(selectedOption);
        const assignment = assignedSubjects.find(a => a.id === selectedOption.value);
        if (assignment) {
            fetchSubjectDetails(assignment, attendanceDate, periodNumber);
        }
    };

    const toggleAttendance = (studentId) => {
        setAttendanceDraft(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'Present' ? 'Absent' : 'Present'
        }));
    };

    const markAll = (status) => {
        const draft = { ...attendanceDraft };
        students.forEach(st => draft[st.id] = status);
        setAttendanceDraft(draft);
    };

    const handleSaveAttendance = async () => {
        const assignmentStr = assignedSubjects.find(a => a.id === selectedAssignment.value);
        if (!assignmentStr) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            const teacherId = userStr ? JSON.parse(userStr).teacher_id : 1;

            const payload = Object.entries(attendanceDraft).map(([studentId, status]) => ({
                student_id: parseInt(studentId),
                status
            }));

            const res = await fetch('http://localhost:8080/api/faculty-marks/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    attendanceData: payload,
                    subject_id: assignmentStr.subject_id,
                    college_id: assignmentStr.college_id,
                    semester_id: assignmentStr.semester_id,
                    academic_year_id: assignmentStr.academic_year_id,
                    section: assignmentStr.section,
                    teacher_id: teacherId,
                    attendance_date: attendanceDate,
                    period_number: periodNumber
                })
            });

            const responseData = await res.json();

            if (res.ok) {
                toast.success("Attendance saved successfully!");
                fetchSubjectDetails(assignmentStr, attendanceDate, periodNumber);
            } else {
                toast.error(responseData.error || "Failed to save attendance");
            }
        } catch (err) {
            toast.error("Error saving attendance");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredStudents = React.useMemo(() => {
        if (!searchQuery.trim()) return students;
        
        const query = searchQuery.toLowerCase().trim();
        return students.filter(student => {
            const sName = (student.name || "").toLowerCase();
            const sRoll = (student.rollnumber || "").toLowerCase();
            return sName.includes(query) || sRoll.includes(query);
        });
    }, [students, searchQuery]);

    const options = assignedSubjects.map(a => ({
        value: a.id,
        label: `${a.subject_code} - ${a.subject_name} (Sec: ${a.section})`
    }));

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Calendar size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-none">Class Attendance</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1.5">Track and manage daily student attendance.</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                <div className="md:col-span-6 space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Assigned Subject</label>
                    <Select
                        options={options}
                        value={selectedAssignment}
                        onChange={handleAssignmentSelect}
                        placeholder="Select Subject & Section..."
                        styles={{ control: (base) => ({ ...base, borderRadius: '1rem', borderColor: '#e2e8f0' }) }}
                    />
                </div>
                
                <div className="md:col-span-4 space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                        <Calendar size={14} className="text-slate-400" /> Date
                    </label>
                    <input 
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2 ml-1">
                        <Hash size={14} className="text-slate-400" /> Period
                    </label>
                    <input 
                        type="number"
                        min="1"
                        max="10"
                        value={periodNumber}
                        onChange={(e) => setPeriodNumber(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl outline-none focus:border-emerald-500 transition-colors"
                    />
                </div>
            </div>

            {loading && (
                <div className="flex justify-center items-center h-32">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {!loading && selectedAssignment && students.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-emerald-500" />
                            <h3 className="text-lg font-bold text-slate-900">Student Enrollment</h3>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="w-full md:w-64">
                                <TableSearch 
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search by name or roll no..."
                                />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => markAll('Present')} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-bold border border-emerald-200 hover:bg-emerald-100">
                                    Mark All Present
                                </button>
                                <button onClick={() => markAll('Absent')} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-100">
                                    Mark All Absent
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50 border-y border-slate-200">
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest w-1/2">Student Details</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Cummulative Attendance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map((student) => {
                                        const status = attendanceDraft[student.id];
                                        const pastPresentBytes = summaryStats.studentMap[student.id] || 0;
                                        // Include current day's saved status realistically might require recalculating, but this is a close hint
                                        const aggPct = summaryStats.totalSessions > 0 ? Math.round((pastPresentBytes / summaryStats.totalSessions) * 100) : 0;

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => toggleAttendance(student.id)}>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-800">{student.name}</p>
                                                    <p className="text-xs text-slate-500">Reg: {student.rollnumber || student.id}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold border transition-colors ${
                                                        status === 'Present' 
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                        {status === 'Present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                                        {status}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm font-medium">
                                                    {summaryStats.totalSessions > 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className={aggPct >= 75 ? 'text-emerald-600' : 'text-amber-600'}>{aggPct}%</span>
                                                            <span className="text-[10px] text-slate-400">({pastPresentBytes}/{summaryStats.totalSessions})</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs">No records</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-sm">
                                            No students found for this subject.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center sticky bottom-0 z-20">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 text-left">
                            <FileText size={16} className="text-emerald-500"/>
                            Total Students Present: <span className="font-black text-slate-800 ml-1">{Object.values(attendanceDraft).filter(s => s === 'Present').length}</span>
                        </div>
                        <button
                            disabled={isSaving}
                            onClick={handleSaveAttendance}
                            className={`inline-flex items-center gap-2 px-10 py-3.5 text-white font-black rounded-xl shadow-xl transition-all uppercase tracking-widest text-sm
                                ${isSaving ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] shadow-emerald-600/20 active:scale-[0.98]'}`}
                        >
                            <Save size={20} />
                            <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
                        </button>
                    </div>
                </div>
            )}
            
            {!loading && selectedAssignment && students.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-800">
                    <p className="font-bold">No students found.</p>
                    <p className="text-sm mt-1">There are no students enrolled in the college/semester for this subject.</p>
                </div>
            )}
        </div>
    );
};

export default Attendance;
