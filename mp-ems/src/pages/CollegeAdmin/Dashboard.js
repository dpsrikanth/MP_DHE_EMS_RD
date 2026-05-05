import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  FileCheck, 
  BarChart3, 
  LayoutDashboard,
  Calendar,
  Layers,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';
import { collegeAdminApi } from '../../api/collegeAdminApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    totalHalls: 0,
    totalCapacity: 0,
    pendingApprovals: 0,
    activeExams: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchNotifications();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const data = await collegeAdminApi.getDashboardStats();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await collegeAdminApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await collegeAdminApi.markNotificationAsRead(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error("Failed to dismiss notification");
    }
  };

  const kpis = [
    { 
      label: 'Total Students', 
      value: stats.totalStudents, 
      icon: <GraduationCap className="text-blue-500" />, 
      color: 'blue',
      path: '/students'
    },
    { 
      label: 'Staff Members', 
      value: stats.totalFaculty, 
      icon: <Users className="text-indigo-500" />, 
      color: 'indigo',
      path: '/teachers'
    },
    { 
      label: 'Exam Capacity', 
      value: stats.totalCapacity, 
      subValue: `${stats.totalHalls} Halls`,
      icon: <Building2 className="text-emerald-500" />, 
      color: 'emerald',
      path: '/college-admin/examination-halls'
    },
    { 
      label: 'Active Exams', 
      value: stats.activeExams, 
      icon: <Calendar className="text-purple-500" />, 
      color: 'purple',
      path: '/exams'
    }
  ];

  const quickLinks = [
    { name: 'Policy Configuration', path: '/college-admin/policies', icon: <Layers size={20} /> },
    { name: 'Marks Structure', path: '/college-admin/marks-config', icon: <BarChart3 size={20} /> },
    { name: 'Verify & Lock Marks', path: '/college-admin/marks-approval', icon: <FileCheck size={20} /> },
    { name: 'Seating Arrangement', path: '/college-admin/seating-arrangement', icon: <LayoutDashboard size={20} /> },
    { name: 'Performance Reports', path: '/college-admin/performance', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-blue-600 size-8" /> 
            College <span className="text-blue-600">Admin</span> Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-2">Institution oversight, logistics, and academic performance tracking.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div className="bg-slate-100 p-2 rounded-xl text-slate-400">
                <Clock size={16} />
            </div>
            <p className="text-sm font-bold text-slate-700 pr-3">
                {formatDate(new Date())}
            </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(kpi.path)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 -mt-8 -mr-8 bg-${kpi.color}-500/5 rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`p-3 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-600 group-hover:scale-110 transition-transform duration-500`}>
                    {kpi.icon}
                  </div>
                  <ArrowRight className="text-slate-200 group-hover:text-slate-400 size-5 transition-colors" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-[13px] font-black text-slate-400  tracking-widest mb-1">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-slate-800">{kpi.value}</h3>
                    {kpi.subValue && <span className="text-[13px] font-bold text-slate-400">{kpi.subValue}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Status & Alerts */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <FileCheck size={24} className="text-blue-600" />
                    Pending Task Summary
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-3xl border ${stats.pendingApprovals > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'} transition-all`}>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest mb-3">Marks Approval Status</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-2xl font-black ${stats.pendingApprovals > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {stats.pendingApprovals}
                        </p>
                        <p className="text-[13px] font-bold text-slate-500 mt-1">Pending verification</p>
                      </div>
                      <button 
                        onClick={() => navigate('/college-admin/marks-approval')}
                        className={`px-4 py-2 rounded-xl text-[12px] font-black  tracking-widest transition-all ${stats.pendingApprovals > 0 ? 'bg-amber-200 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}
                      >
                        Action Required
                      </button>
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl border bg-slate-50 border-slate-100 hover:bg-slate-100 transition-all cursor-pointer" onClick={() => navigate('/college-admin/examination-halls')}>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest mb-3">Infrastructure Overview</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-slate-800">{stats.totalHalls}</p>
                        <p className="text-[13px] font-bold text-slate-500 mt-1">Total Approved Halls</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm">
                        <Building2 size={18} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-blue-600 rounded-3xl text-white shadow-lg shadow-blue-500/30 flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-lg">Infrastructure Readiness</h4>
                    <p className="text-blue-100 text-sm font-medium mt-1">Total exam capacity of {stats.totalCapacity} students approved.</p>
                  </div>
                  <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                    <TrendingUp size={24} />
                  </button>
                </div>
              </div>

              {/* Performance Teaser */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                <div className={`absolute top-0 right-0 w-64 h-64 -mt-20 -mr-20 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000`}></div>
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <h3 className="text-2xl font-black">Performance Analytics</h3>
                    <p className="text-slate-400 font-medium text-sm mt-1">Subject-wise pass rate and institutional metrics.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/college-admin/performance')}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl font-black text-[13px]  tracking-widest transition-all shadow-xl shadow-blue-600/20"
                  >
                    View Report
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-slate-500  tracking-[0.2em] mb-1">Efficiency</p>
                    <p className="text-xl font-black">94%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-slate-500  tracking-[0.2em] mb-1">Avg Pass %</p>
                    <p className="text-xl font-black">82.5%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-slate-500  tracking-[0.2em] mb-1">Active Labs</p>
                    <p className="text-xl font-black">12</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[9px] font-black text-slate-500  tracking-[0.2em] mb-1">Completion</p>
                    <p className="text-xl font-black">100%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Sidebar */}
            <div className="space-y-6">
              <h4 className="text-[12px] font-black text-slate-400  tracking-[0.3em] ml-2">Quick Access</h4>
              <div className="grid grid-cols-1 gap-4">
                {quickLinks.map((link, idx) => (
                  <button 
                    key={idx}
                    onClick={() => navigate(link.path)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {link.icon}
                    </div>
                    <span className="font-bold text-slate-700 text-sm">{link.name}</span>
                  </button>
                ))}
              </div>
              
              <div className="p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100 mt-10">
                <h4 className="font-black text-indigo-900 text-sm  tracking-widest mb-3">Correction Requests</h4>
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm relative group overflow-hidden">
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <Clock size={16} />
                          </div>
                          <div className="flex-1">
                            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-1">
                              {notif.subject_code} - Section {notif.section}
                            </p>
                            <p className="text-[13px] text-slate-700 font-bold leading-tight">
                              {notif.message}
                            </p>
                            <div className="mt-3 flex gap-2">
                              <button 
                                onClick={() => navigate('/admin/marks-verification')}
                                className="text-[9px] font-black text-indigo-600  tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                Review & Reject
                              </button>
                              <button 
                                onClick={() => markAsRead(notif.id)}
                                className="text-[9px] font-black text-slate-400  tracking-widest hover:text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-[13px] text-indigo-400 font-medium">No pending correction requests from HODs.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
