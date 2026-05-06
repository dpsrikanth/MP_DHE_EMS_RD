import React, { useState, useEffect } from 'react';
import { User, Mail, GraduationCap, School, Calendar, BookOpen, AlertCircle, FileText } from 'lucide-react';
import authUtils from '../../utils/authUtils';

const StudentDashboard = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Student<span className="text-indigo- not-italic ml-1">Portal</span></h1>
        <p className="text-slate-500 font-medium">Welcome back, {user.name}!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-50">
            <div className="w-20 h-20 bg-indigo- rounded-3xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 leading-tight">{user.name}</h2>
              <p className="text-indigo- font-black text-sm  tracking-widest mt-1">Undergraduate Student</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Email Address</p>
                  <p className="text-slate-700 font-bold">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Roll Number</p>
                  <p className="text-slate-700 font-bold">{user.rollnumber || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <School size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Institution</p>
                  <p className="text-slate-700 font-bold">{user.collageName || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="text-[12px] font-black text-slate-400  tracking-widest leading-none mb-1">Current Program</p>
                  <p className="text-slate-700 font-bold">{user.programName || 'N/A'}{user.semister ? ` - ${user.semister}` : ''}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links / Actions */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[2rem] p-8 text-white relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo- rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
             <Calendar className="text-indigo-400 mb-4" size={32} />
             <h3 className="text-xl font-black mb-2 tracking-tight">Examinations</h3>
             <p className="text-slate-400 text-sm font-medium mb-6 leading-relaxed">View scheduled exams, register for seating, and download hall tickets.</p>
             <a href="/student/exams" className="inline-flex items-center gap-2 text-indigo-400 font-black text-[13px]  tracking-widest hover:text-sky-300 transition-colors">
               Access Exams <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
             </a>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-5 group-hover:opacity-10 transition-opacity" />
             <FileText className="text-emerald-500 mb-4" size={32} />
             <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight text-shadow-sm">Academic Results</h3>
             <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed text-shadow-sm">Check your finalized grades, SGPA, and download official marksheets.</p>
             <a href="/student/results" className="inline-flex items-center gap-2 text-emerald-600 font-black text-[13px]  tracking-widest hover:text-emerald-500 transition-colors">
               View Results <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             </a>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo- rounded-full blur-[60px] opacity-5 group-hover:opacity-10 transition-opacity" />
             <Calendar className="text-indigo- mb-4" size={32} />
             <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Attendance Record</h3>
             <p className="text-slate-500 text-sm font-medium mb-6 leading-relaxed">Track your subject-wise attendance and verify eligibility for examinations.</p>
             <a href="/student/attendance" className="inline-flex items-center gap-2 text-indigo- font-black text-[13px]  tracking-widest hover:text-indigo- transition-colors">
               Track Attendance <div className="w-2 h-2 rounded-full bg-indigo- animate-pulse" />
             </a>
          </div>

          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
            <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">Important Notice</h3>
            <div className="flex gap-4 p-4 bg-indigo- rounded-2xl border border-amber-100 italic">
              <AlertCircle className="text-indigo- shrink-0" size={20} />
              <p className="text-[13px] text-amber-800 font-medium leading-relaxed">
                Exam registration for Semester 1 (2026 Batch) is now open. Please complete your registration before March 20th.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
