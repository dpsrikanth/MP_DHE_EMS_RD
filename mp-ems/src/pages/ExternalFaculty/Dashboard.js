import React, { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, Users, CheckCircle, Clock, 
  ArrowRight, FileText, LayoutDashboard,
  Calendar, Award, ListChecks, Search, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { externalFacultyApi } from "../../api/externalFacultyApi";
import { TableSearch } from '../../components/TableControls';

const ExternalFacultyDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    evaluated: 0,
    submitted: 0
  });
  const [allAssignments, setAllAssignments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await externalFacultyApi.getAssignments();
      setAllAssignments(data);
      
      const counts = data.reduce((acc, curr) => {
        acc.total++;
        if (curr.assignment_status === 'Assigned') acc.pending++;
        else if (curr.assignment_status === 'Evaluated') acc.evaluated++;
        else if (curr.assignment_status === 'Submitted') acc.submitted++;
        return acc;
      }, { total: 0, pending: 0, evaluated: 0, submitted: 0 });
      
      setStats(counts);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = useMemo(() => {
    if (!allAssignments.length) return [];
    if (!searchQuery.trim()) return allAssignments.slice(0, 5);
    
    const query = searchQuery.toLowerCase().trim();
    return allAssignments.filter(item => {
      const sName = (item.student_name || "").toLowerCase();
      const sRoll = (item.rollnumber || "").toLowerCase();
      const subName = (item.subject_name || "").toLowerCase();
      const exName = (item.exam_name || "").toLowerCase();
      const status = (item.assignment_status || "").toLowerCase();

      return sName.includes(query) || 
             sRoll.includes(query) || 
             subName.includes(query) || 
             exName.includes(query) || 
             status.includes(query);
    });
  }, [allAssignments, searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-tighter animate-pulse">Synchronizing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Banner */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-xs font-black uppercase tracking-widest text-indigo-100">
            <LayoutDashboard size={14} />
            Faculty Portal
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
              Hello, <span className="italic text-indigo-200">Evaluator</span>
            </h1>
            <p className="text-indigo-100/80 text-lg font-medium max-w-lg leading-relaxed">
              Your expertise ensures academic integrity. Review and submit marks for your assigned external examinations today.
            </p>
          </div>
          <button 
            onClick={() => navigate('/external-faculty/marks-entry')}
            className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl hover:bg-slate-50 transition-all hover:scale-[1.03] active:scale-[0.98] flex items-center gap-3 w-fit"
          >
            <ListChecks size={20} />
            Start Marking Now
            <ArrowRight size={18} />
          </button>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/20 skew-x-12 translate-x-1/4 transition-transform group-hover:translate-x-1/3 duration-1000"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-700/50 rounded-full blur-3xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Assigned Requests', value: stats.total, icon: <Users />, color: 'slate' },
          { label: 'Pending Action', value: stats.pending, icon: <Clock />, color: 'amber' },
          { label: 'Evaluation Done', value: stats.evaluated, icon: <CheckCircle />, color: 'blue' },
          { label: 'Submitted to Uni', value: stats.submitted, icon: <Award />, color: 'emerald' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center 
              ${stat.color === 'slate' ? 'bg-slate-100 text-slate-600' : ''}
              ${stat.color === 'amber' ? 'bg-amber-100 text-amber-600' : ''}
              ${stat.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
              ${stat.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : ''}
            `}>
              {React.cloneElement(stat.icon, { size: 24 })}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Assignments Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">Recent Assignments</h3>
          <div className="flex-1 w-full sm:max-w-md">
            <TableSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search student, subject or status..."
            />
          </div>
          <button 
            onClick={() => navigate('/external-faculty/marks-entry')}
            className="text-xs font-black text-indigo-600 hover:text-indigo-700 underline uppercase tracking-tighter"
          >
            View All Assignments
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Exam & Subject</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((row) => (
                  <tr key={row.assignment_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                          {row.student_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{row.student_name}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.rollnumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-indigo-600 mb-1">
                        <FileText size={14} />
                        <p className="text-xs font-black uppercase tracking-tight">{row.subject_name}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} />
                        <p className="text-[10px] font-bold">{row.exam_name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                        ${row.assignment_status === 'Submitted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          row.assignment_status === 'Evaluated' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                          'bg-amber-50 text-amber-600 border-amber-100'}
                      `}>
                        {row.assignment_status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        disabled={row.assignment_status === 'Submitted'}
                        onClick={() => navigate('/external-faculty/marks-entry')}
                        className={`p-2 rounded-xl transition-all ${row.assignment_status === 'Submitted' ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      >
                        <ArrowRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-8 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-slate-400 text-sm font-bold uppercase tracking-widest text-center">
                        {searchQuery ? "No matching assignments found" : "No recent assignments found"}
                      </p>
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className="text-xs font-black text-indigo-600 hover:text-indigo-700 underline uppercase mt-2"
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExternalFacultyDashboard;
