import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { getApiUrl } from '../../config';

const SecrecyDashboard = () => {
  const [stats, setStats] = useState({
    total_paper_setters: 0,
    total_question_sets: 0,
    approved_papers: 0,
    pending_review: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchActivity()
      ]);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(getApiUrl('/secrecy/stats'), {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(getApiUrl('/secrecy/activity'), {
        headers: authUtils.getAuthHeader()
      });
      if (res.ok) setRecentActivity(await res.json());
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4 min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Synchronizing Secrecy Data...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/30 min-h-screen pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <TrendingUp size={32} className="text-sky-500" />
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic">Secrecy Department Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">Overview of secrecy operations and recent activity.</p>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Paper Setters', value: stats.total_paper_setters, icon: <Users size={24} className="text-blue-500" />, bg: 'bg-blue-50' },
            { label: 'Question Sets', value: stats.total_question_sets, icon: <FileText size={24} className="text-emerald-500" />, bg: 'bg-emerald-50' },
            { label: 'Approved Papers', value: stats.approved_papers, icon: <CheckCircle2 size={24} className="text-purple-500" />, bg: 'bg-purple-50' },
            { label: 'Pending Review', value: stats.pending_review, icon: <Clock size={24} className="text-orange-500" />, bg: 'bg-orange-50' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">{item.value}</h3>
              </div>
              <div className={`${item.bg} p-4 rounded-2xl`}>
                {item.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800 italic">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {recentActivity && recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
              <div key={idx} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'PAPER_APPROVED' ? 'bg-emerald-500' : 
                    activity.type === 'PAYMENT_PROCESSED' ? 'bg-blue-500' : 
                    activity.type === 'PAPER_UPLOADED' ? 'bg-sky-500' : 'bg-slate-300'
                  }`} />
                  <div>
                    <h4 className="font-bold text-slate-800">{activity.type.replace(/_/g, ' ')}</h4>
                    <p className="text-sm text-slate-500 font-medium">{activity.detail}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-400 capitalize whitespace-nowrap">{new Date(activity.activity_date).toLocaleString()}</span>
              </div>
            )) : (
              <div className="p-10 text-center text-slate-400 font-medium font-bold uppercase text-xs tracking-widest">No recent activity found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecrecyDashboard;
