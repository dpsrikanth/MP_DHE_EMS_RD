import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, School, GraduationCap, MapPin, Globe, History, Laptop, Smartphone } from 'lucide-react';
import { authApi } from '../api/authApi';

/**
 * Profile Page Component
 * Shows details for the currently logged-in user Based on their role.
 */
const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = localStorage.getItem('roleName') || 'User';

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await authApi.getLoginHistory();
        setHistory(data);
      } catch (err) {
        console.error('Failed to load login history', err);
        setError('Failed to load login history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getInitials = (name) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'U';
  };

  const isStudent = roleName.toLowerCase() === 'student';
  const isFaculty = roleName.toLowerCase() === 'faculty' || roleName.toLowerCase() === 'teacher' || roleName === 'HOD';



  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Profile Section */}
      <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center gap-10">
        <div className="relative">
          <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-600/30">
            {getInitials(user.name)}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full border-4 border-white shadow-lg animate-pulse" />
        </div>
        
        <div className="text-center md:text-left flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{user.name}</h1>
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[12px] font-black  tracking-widest rounded-full border border-indigo-100 w-fit mx-auto md:mx-0">
              {roleName.replace('_', ' ')} Account
            </span>
          </div>
          <p className="text-slate-500 font-medium text-lg">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Personal/Account Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <User size={20} className="text-indigo-600" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1">
                <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Full Name</p>
                <p className="text-slate-800 font-bold">{user.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-slate-800 font-bold">{user.email}</p>
                  <Shield size={14} className="text-emerald-500" />
                </div>
              </div>
              {isStudent && (
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Roll Number</p>
                  <p className="text-slate-800 font-bold">{user.rollnumber || 'Not Assigned'}</p>
                </div>
              )}
              {isFaculty && (
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Department</p>
                  <p className="text-slate-800 font-bold">{user.department_name || 'Not Assigned'}</p>
                </div>
              )}
              <div className="space-y-1">
                <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none">Account Status</p>
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Active
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <School size={20} className="text-indigo-600" />
              Institutional Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
              <div className="space-y-1 flex items-start gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">College / Institution</p>
                  <p className="text-slate-800 font-bold">{user.collageName || user.college_name || 'Associated Institution'}</p>
                </div>
              </div>
              {isStudent && (
                <>
                <div className="space-y-1 flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Enrolled Program</p>
                    <p className="text-slate-800 font-bold">{user.programName || 'Not Available'}</p>
                  </div>
                </div>
                <div className="space-y-1 flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Current Semester</p>
                    <p className="text-slate-800 font-bold">{user.semister || 'Freshman'}</p>
                  </div>
                </div>
                </>
              )}
            </div>
          </div>

          {/* Login History Card */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm mt-8">
            <h3 className="text-lg font-black text-slate-900 mb-8 flex items-center gap-3">
              <History size={20} className="text-indigo-600" />
              Recent Login History
            </h3>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : error ? (
              <div className="text-red-500 font-medium py-4 text-center">{error}</div>
            ) : history.length === 0 ? (
              <div className="text-slate-400 font-medium py-8 text-center">No recent login records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 text-[12px] font-black text-slate-400 tracking-widest uppercase">Date & Time</th>
                      <th className="pb-4 text-[12px] font-black text-slate-400 tracking-widest uppercase">Device / Browser</th>
                      <th className="pb-4 text-[12px] font-black text-slate-400 tracking-widest uppercase">IP Address</th>
                      <th className="pb-4 text-[12px] font-black text-slate-400 tracking-widest uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 15).map((log) => {
                      // Parse user agent to be user friendly
                      const ua = log.user_agent || '';
                      let device = 'Desktop';
                      let browser = 'Unknown';
                      
                      if (/mobile|android|iphone|ipad/i.test(ua)) {
                        device = 'Mobile';
                      }
                      
                      if (/chrome|crios/i.test(ua)) {
                        browser = 'Chrome';
                      } else if (/firefox|fxios/i.test(ua)) {
                        browser = 'Firefox';
                      } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
                        browser = 'Safari';
                      } else if (/edge|edg/i.test(ua)) {
                        browser = 'Edge';
                      } else if (/postman/i.test(ua)) {
                        browser = 'Postman';
                      }

                      const isSuccess = log.status?.toUpperCase() === 'SUCCESS';

                      return (
                        <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 text-sm font-semibold text-slate-600">
                            {new Date(log.login_time).toLocaleString(undefined, {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })}
                          </td>
                          <td className="py-4 text-sm font-semibold text-slate-700">
                            <div className="flex items-center gap-2">
                              {device === 'Mobile' ? <Smartphone size={16} className="text-slate-400" /> : <Laptop size={16} className="text-slate-400" />}
                              <span>{browser} ({device})</span>
                            </div>
                          </td>
                          <td className="py-4 text-sm font-semibold text-slate-600 font-mono">
                            {log.ip_address || '127.0.0.1'}
                          </td>
                          <td className="py-4 text-sm">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              isSuccess 
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Secondary Info */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <Shield className="text-indigo-400 mb-6" size={32} />
            <h3 className="text-xl font-black mb-2 tracking-tight">Login Security</h3>
            <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">
              Your account is protected with enterprise-grade encryption. Ensure your password is kept confidential.
            </p>
          </div>
        

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
                <Globe size={20} className="text-slate-400" />
                <h4 className="text-sm font-black text-slate-900  tracking-widest">Connect</h4>
             </div>
             <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-6">
                Need to update your professional details? Please contact the administration office for official records modernization.
             </p>
             <a href="mailto:support@intense.cms" className="text-indigo-600 font-black text-[13px]  tracking-widest hover:text-indigo-700 transition-colors">
                Contact Admin &rarr;
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
