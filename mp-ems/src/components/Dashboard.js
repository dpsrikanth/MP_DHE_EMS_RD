import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  School, 
  Building2, 
  Layers, 
  Book,
  User,
  Mail,
  TrendingUp,
  Activity,
  Award
} from "lucide-react";
import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeExams: 0,
    totalPrograms: 0,
    totalSemesters: 0,
    totalSubjects: 0,
    totalAcademicYears: 0,
    totalPolicies: 0,
  });

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [programsCount, setProgramsCount] = useState(0);
  const [examsCount, setExamsCount] = useState(0);
  const [collegesCount, setCollegesCount] = useState(0);
  const [universitiesCount, setUniversitiesCount] = useState(0);
  const [semestersCount, setSemestersCount] = useState(0);
  const [subjectsCount, setSubjectsCount] = useState(0);
  const [policiesCount, setPoliciesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        
        const response = await fetch("http://localhost:8080/api/dashboard/stats", authHeader);
        if (!response.ok) throw new Error("Failed to fetch dashboard stats");
        const data = await response.json();

        setStats({
          totalUsers: data.totalUsers || 0,
          activeExams: data.activeExams || 0,
          totalPrograms: data.totalPrograms || 0,
          totalSemesters: data.totalSemesters || 0,
          totalSubjects: data.totalSubjects || 0,
          totalAcademicYears: data.totalAcademicYears || 0,
          totalPolicies: data.totalPolicies || 0,
        });

        setProgramsCount(data.totalPrograms || 0);
        setExamsCount(data.activeExams || 0);
        setSemestersCount(data.totalSemesters || 0);
        setSubjectsCount(data.totalSubjects || 0);
        setPoliciesCount(data.totalPolicies || 0);

        const [tRes, sRes, cRes, uRes] = await Promise.all([
          fetch("http://localhost:8080/api/teachers", authHeader),
          fetch("http://localhost:8080/api/students", authHeader),
          fetch("http://localhost:8080/api/colleges", authHeader),
          fetch("http://localhost:8080/api/universities", authHeader)
        ]);

        if (tRes.ok) setTeachers(await tRes.json());
        if (sRes.ok) setStudents(await sRes.json());
        if (cRes.ok) {
          const cs = await cRes.json();
          setCollegesCount(Array.isArray(cs) ? cs.length : 0);
        }
        if (uRes.ok) {
          const us = await uRes.json();
          setUniversitiesCount(Array.isArray(us) ? us.length : 0);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-3xl text-red-600 font-bold">
      Error: {error}
    </div>
  );

  const totalStudents = students.length || stats.totalUsers || 0;
  const gradeLabels = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"];
  const gradeCounts = gradeLabels.map((_, i) => Math.floor(totalStudents / gradeLabels.length) + (i < (totalStudents % gradeLabels.length) ? 1 : 0));

  const dashboardStats = [
    { label: 'Total Teachers', value: teachers.length, icon: <Users size={24} />, color: 'bg-blue-500', shadow: 'shadow-blue-500/20' },
    { label: 'Total Students', value: totalStudents, icon: <GraduationCap size={24} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Programs', value: programsCount, icon: <BookOpen size={24} />, color: 'bg-amber-500', shadow: 'shadow-amber-500/20' },
    { label: 'Exams', value: examsCount, icon: <FileText size={24} />, color: 'bg-purple-500', shadow: 'shadow-purple-500/20' },
    { label: 'Colleges', value: collegesCount, icon: <Building2 size={24} />, color: 'bg-sky-500', shadow: 'shadow-sky-500/20' },
    { label: 'Universities', value: universitiesCount, icon: <School size={24} />, color: 'bg-indigo-500', shadow: 'shadow-indigo-500/20' },
    { label: 'Policies', value: policiesCount, icon: <Award size={24} />, color: 'bg-emerald-500', shadow: 'shadow-emerald-500/20' },
    { label: 'Semesters', value: semestersCount, icon: <Layers size={24} />, color: 'bg-rose-500', shadow: 'shadow-rose-500/20' },
    { label: 'Subjects', value: subjectsCount, icon: <Book size={24} />, color: 'bg-teal-500', shadow: 'shadow-teal-500/20' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Institutional management and real-time statistics</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm transition-transform hover:scale-105 duration-300">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Status</span>
        </div>
      </div>

      {/* Grid: Main Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, idx) => (
          <div 
            key={idx} 
            className="group relative bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl text-white ${stat.color} ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none tracking-tighter">{stat.value}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
              <TrendingUp size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">+ 12% growth</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Grade Distribution */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Activity size={20} className="text-rose-500" /> Grade Metrics
              </h4>
              <Award size={20} className="text-slate-300" />
            </div>
            
            <div className="space-y-5">
              {gradeLabels.map((label, idx) => {
                const count = gradeCounts[idx];
                const pct = totalStudents ? Math.round((count / Math.max(1, totalStudents)) * 100) : 0;
                return (
                  <div className="space-y-1.5 group" key={label}>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{label}</span>
                      <span className="text-xs font-black text-slate-900 tracking-tighter">{count}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-100/50">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Teacher Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users size={20} className="text-blue-500" /> Personnel Overview
                </h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Teaching Faculty Roster</p>
              </div>
              <button className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-colors">See all</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
              {teachers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 opacity-50 grayscale">
                  <User size={48} className="text-slate-300 mb-4" />
                  <p className="text-sm font-bold text-slate-400">No personnel records found</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teachers.map((t) => (
                  <div key={t.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-500 font-black text-lg shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                        {(t.teacher_name || t.name || 'U').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">{t.teacher_name || t.name || 'Unknown'}</p>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 truncate">
                          <Mail size={12} className="text-slate-300" /> {t.email || ''}
                        </p>
                      </div>
                      <div className="p-1.5 text-slate-200 group-hover:text-blue-400 transition-colors">
                        <trending-up className="lucide lucide-trending-up animate-pulse" />
                        <Activity size={18} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;