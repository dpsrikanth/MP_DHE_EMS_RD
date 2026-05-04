import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { BookOpen, CheckCircle, Clock, ShieldAlert, ChevronRight, User, Search, X } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { TableSearch } from '../../components/TableControls';
import { facultyApi } from '../../api/facultyApi';
import { collegeAdminApi } from '../../api/collegeAdminApi';

const FacultyDashboard = () => {
    const [assignedSubjects, setAssignedSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [workflowStatus, setWorkflowStatus] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const teacherId = user ? user.teacher_id : 1;
            const collegeId = user ? user.college_id : 1;

            // 1. Fetch Assigned Subjects
            const subjects = await facultyApi.getAssignedSubjects(teacherId);
            setAssignedSubjects(subjects || []);

            // 2. Fetch Workflow Status for overall tracking
            if (subjects && subjects.length > 0) {
                const statusData = await collegeAdminApi.getMarksTracking({ college_id: collegeId });
                // Create a lookup map: { subjectId_section: status }
                const statusMap = {};
                if (Array.isArray(statusData)) {
                    statusData.forEach(item => {
                        statusMap[`${item.subject_id}_${item.section}`] = item.status;
                    });
                }
                setWorkflowStatus(statusMap);
            }
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const filteredAssignments = useMemo(() => {
        if (!searchQuery.trim()) return assignedSubjects;
        
        const query = searchQuery.toLowerCase().trim();
        return assignedSubjects.filter(item => {
            const sName = (item.subject_name || "").toLowerCase();
            const sCode = (item.subject_code || "").toLowerCase();
            const semName = (item.semester_name || "").toLowerCase();
            
            return sName.includes(query) || sCode.includes(query) || semName.includes(query);
        });
    }, [assignedSubjects, searchQuery]);

    const getStatusConfig = (subjectId, section) => {
        const status = workflowStatus[`${subjectId}_${section}`] || 'Pending';
        switch (status) {
            case 'Submitted': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock, label: 'Submitted' };
            case 'Locked': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle, label: 'Locked' };
            default: return { color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', icon: ShieldAlert, label: 'Pending' };
        }
    };

    const handleEnterMarks = (assignment) => {
        // We navigate to marks entry. The MarksEntry component handles selection, 
        // but we could optionally pass the selected assignment via state.
        navigate('/faculty/marks-entry', { state: { assignmentId: assignment.id } });
    };

    const handleTakeAttendance = (assignment) => {
        navigate('/faculty/attendance', { state: { assignmentId: assignment.id } });
    };

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : { name: 'Faculty' };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-none tracking-tight">Faculty Dashboard</h1>
                        <p className="text-slate-500 mt-2 font-medium">Welcome back, <span className="text-indigo-600 font-bold">{user.name}</span>. Grouping your assigned subjects.</p>
                    </div>
                </div>
            </div>

            {/* Quick Stats or Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Assignments</p>
                    <p className="text-3xl font-black text-slate-900">{assignedSubjects.length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-amber-600">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pending Submissions</p>
                    <p className="text-3xl font-black">{assignedSubjects.filter(a => (workflowStatus[`${a.subject_id}_${a.section}`] || 'Pending') === 'Pending').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-emerald-600">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Completed / Locked</p>
                    <p className="text-3xl font-black">{assignedSubjects.filter(a => workflowStatus[`${a.subject_id}_${a.section}`] === 'Locked').length}</p>
                </div>
            </div>

            {/* Assignments Grid */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                    <div className="flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-500" />
                        <h2 className="text-xl font-bold text-slate-800">My Subject Assignments</h2>
                    </div>
                    <div className="w-full md:w-80">
                        <TableSearch 
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search subjects, codes, or semesters..."
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredAssignments.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-200 shadow-inner group">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                           <Search size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            {searchQuery ? "No matching subjects" : "Awaiting Assignments"}
                        </h3>
                        <p className="text-slate-500 font-medium max-w-sm mx-auto">
                            {searchQuery ? "Try searching with a different subject name or code." : "No subjects have been assigned specifically to your faculty profile yet."}
                        </p>
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="mt-6 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20"
                            >
                                Clear All Searches
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAssignments.map((item) => {
                            const statusConfig = getStatusConfig(item.subject_id, item.section);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div key={item.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
                                    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 ${statusConfig.bg}`}></div>
                                    
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}>
                                            <StatusIcon size={14} />
                                            {statusConfig.label}
                                        </span>
                                        <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">
                                            SEC: {item.section}
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{item.subject_code}</div>
                                        <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem]">{item.subject_name}</h3>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            {item.semester_name}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleTakeAttendance(item)}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl hover:bg-emerald-100 transition-all text-sm"
                                        >
                                            Attendance
                                        </button>
                                        <button 
                                            onClick={() => handleEnterMarks(item)}
                                            className="w-full flex items-center justify-center px-4 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all text-sm"
                                        >
                                            Enter Marks
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyDashboard;
