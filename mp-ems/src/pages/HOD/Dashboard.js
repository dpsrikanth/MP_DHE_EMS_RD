import {
    Users,
    GraduationCap,
    BookOpen,
    FileText,
    LayoutDashboard,
    Activity,
    Award,
    CheckCircle,
    AlertCircle,
    Clock
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authUtils from "../../utils/authUtils";
import { hodApi } from "../../api/hodApi";
import { masterDataApi } from "../../api/masterDataApi";

const HODDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingApprovals: 0,
        totalStudents: 0,
        totalFaculty: 0,
        activeSubjects: 0
    });

    const [departmentName, setDepartmentName] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHODData = async () => {
            try {
                const { collegeId, departmentId } = authUtils.getAuth();
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                setDepartmentName(user.department_name || "Department");

                // 1. Fetch Stats (Approvals)
                const approvals = await hodApi.getPendingApprovals({ college_id: collegeId, department_id: departmentId });
                setStats(prev => ({ ...prev, pendingApprovals: approvals.length }));

                // 2. Fetch Department Teacher Count
                const teachers = await masterDataApi.getTeachers({ college_id: collegeId, department_id: departmentId });
                setStats(prev => ({ ...prev, totalFaculty: teachers.length }));

                // 3. Fetch Department Student Count
                const students = await masterDataApi.getStudents({ college_id: collegeId, department_id: departmentId });
                setStats(prev => ({ ...prev, totalStudents: students.length }));

            } catch (err) {
                console.error("Dashboard error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHODData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    const dashboardStats = [
        { label: 'Pending Approvals', value: stats.pendingApprovals, icon: <Clock size={24} />, color: 'bg-indigo-', shadow: 'shadow-indigo-500/20' },
        { label: 'Total Faculty', value: stats.totalFaculty, icon: <Users size={24} />, color: 'bg-indigo-', shadow: 'shadow-indigo-500/20' },
        { label: 'Total Students', value: stats.totalStudents, icon: <GraduationCap size={24} />, color: 'bg-emerald-500', shadow: 'shadow-indigo-500/20' },
        { label: 'Active Subjects', value: stats.activeSubjects || '---', icon: <BookOpen size={24} />, color: 'bg-indigo-', shadow: 'shadow-indigo-500/20' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-700 p-6 bg-slate-50/50 min-h-screen">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">HOD Dashboard</h1>
                    <p className="text-slate-500 font-medium tracking-tight mt-1">Management Overview for <span className="text-indigo- font-bold">{departmentName}</span></p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Admin Active</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="group relative bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-sky-200/50 hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                            <div className={`p-4 rounded-2xl text-white ${stat.color} ${stat.shadow} group-hover:scale-110 transition-all duration-500`}>
                                {stat.icon}
                            </div>
                            <div className="text-right">
                                <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Activity size={24} className="text-indigo-" /> Quick Actions
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => navigate('/hod/marks-approval')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-indigo- hover:text-white transition-all duration-300 border border-slate-100 font-bold group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white text-indigo- flex items-center justify-center shadow-sm group-hover:text-indigo-600">
                                <CheckCircle size={20} />
                            </div>
                            <span className="text-sm">Approve Pending Marks</span>
                        </button>
                        <button 
                            onClick={() => navigate('/college-admin/faculty-assign')}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-slate-100 font-bold group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm group-hover:text-black">
                                <Users size={20} />
                            </div>
                            <span className="text-sm">Manage Faculty</span>
                        </button>
                    </div>
                </div>

                {/* Notifications/Alerts */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">Recent Activity</h2>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo- border border-amber-100">
                            <AlertCircle size={20} className="text-indigo- mt-1" />
                            <div>
                                <p className="text-sm font-bold text-slate-900">Marks Submission Overdue</p>
                                <p className="text-[13px] text-slate-500">Physics 1st Sem Internal marks are still pending from Prof. Sharma.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-indigo- border border-sky-100">
                            <FileText size={20} className="text-indigo- mt-1" />
                            <div>
                                <p className="text-sm font-bold text-slate-900">New Result Template</p>
                                <p className="text-[13px] text-slate-500">A new template for marksheets has been uploaded by College Admin.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HODDashboard;
