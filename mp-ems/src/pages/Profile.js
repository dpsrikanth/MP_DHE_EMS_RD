import React, { useState } from 'react';
import { User, Mail, Shield, Building2, School, GraduationCap, MapPin, Globe } from 'lucide-react';
import { authApi } from '../api/authApi';

/**
 * Profile Page Component
 * Shows details for the currently logged-in user Based on their role.
 */
const Profile = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = localStorage.getItem('roleName') || 'User';

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
