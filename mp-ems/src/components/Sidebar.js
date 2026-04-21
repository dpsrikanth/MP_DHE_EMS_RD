import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authUtils from "../utils/authUtils";
import {
  LayoutDashboard,
  School,
  GraduationCap,
  BookOpen,
  Calendar,
  Layers,
  Book,
  Users,
  UserCircle,
  FileText,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  Building2,
  Flag,
  Menu,
  X,
  UserPlus,
  TrendingUp,
  Mail,
  CreditCard,
  CheckCircle2,
  Trophy,
  PieChart,
  Map,
  Lock,
  Settings,
  Hash
} from "lucide-react";

/**
 * Sidebar component with Tailwind CSS styling.
 * Designed for a modern, premium EMS application.
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAssignedPaperSetter, setIsAssignedPaperSetter] = useState(false);

  useEffect(() => {
    const roleName = localStorage.getItem('roleName');
    if (['Faculty', 'Teacher', 'External Faculty'].includes(roleName)) {
      fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/paper-setter/faculty/check-assigned`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })
        .then(res => res.json())
        .then(data => setIsAssignedPaperSetter(data.isAssigned))
        .catch(err => console.error(err));
    } else {
      setIsAssignedPaperSetter(true);
    }
  }, []);

  const handleLinkClick = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const renderMenuByRole = () => {
    const roleName = localStorage.getItem('roleName');

    // Default Admin / SuperAdmin Menu
    let menuItems = [
      { id: 1, name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 2, name: 'Universities', path: '/universities', icon: <School size={20} /> },
      { id: 3, name: 'Colleges', path: '/colleges', icon: <GraduationCap size={20} /> },
      { id: 4, name: 'Programs', path: '/programs', icon: <BookOpen size={20} /> },
      { id: 5, name: 'Academic Years', path: '/academic-years', icon: <Calendar size={20} /> },
      { id: 6, name: 'Semesters', path: '/semesters', icon: <Layers size={20} /> },
      { id: 20, name: 'Users', path: '/users', icon: <Users size={20} /> },
      { id: 21, name: 'Roles', path: '/roles', icon: <ShieldCheck size={20} /> },
      { id: 13, name: 'Policies', path: '/policies', icon: <ShieldCheck size={20} /> },
      { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> },
      { id: 26, name: 'Institutional Roadmap', path: '/milestones', icon: <Flag size={20} /> },
    ];

    if (authUtils.isUniversityAdmin()) {
      // Remove Universities and Roles — not needed at university level
      // Note: Users IS kept — the backend already scopes /api/users to only show users within this university
      menuItems = menuItems.filter(item => item.name !== 'Universities' && item.name !== 'Roles');
      menuItems.push(
        { id: 9, name: 'Faculty', path: '/teachers', icon: <Users size={20} /> },
        { id: 10, name: 'Students', path: '/students', icon: <UserCircle size={20} /> },
        { id: 11, name: 'Exams', path: '/exams', icon: <FileText size={20} /> },
        { id: 8, name: 'Departments', path: '/departments', icon: <Building2 size={20} /> },
        // Verify & Unlock removed — marks verification is an internal exam feature handled by college admin
        { id: 16, name: 'External Assignment', path: '/university/external-assignment', icon: <UserPlus size={20} /> },
        { id: 17, name: 'Result Hub', path: '/university/external-marks', icon: <BarChart3 size={20} /> },
        { id: 18, name: 'Grading Policy', path: '/university/grading-policy', icon: <ShieldCheck size={20} /> },
        { id: 19, name: 'Manage Credits', path: '/university/manage-credits', icon: <BookOpen size={20} /> },
        { id: 23, name: 'Hall Approvals', path: '/university/hall-approvals', icon: <Building2 size={20} /> },
        { id: 24, name: 'Student Allocations', path: '/university/student-allocations', icon: <UserPlus size={20} /> },
        { id: 28, name: 'Infrastructure Analytics', path: '/university/infrastructure-analytics', icon: <Map size={20} /> },
        { id: 29, name: 'Exam Analytics', path: '/university/exam-analytics', icon: <PieChart size={20} /> },
        { id: 30, name: 'Institutional Ranking', path: '/university/institutional-ranking', icon: <Trophy size={20} /> }
      );
    }

    if (authUtils.isSystemAdmin()) {
      menuItems.push({ id: 100, name: 'SMTP Settings', path: '/smtp-settings', icon: <Mail size={20} /> });
    }

    if (roleName === 'college_admin') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/college-admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Policy Config', path: '/college-admin/policies', icon: <Settings size={20} /> },
        { id: 3, name: 'Marks Structure', path: '/college-admin/marks-config', icon: <BarChart3 size={20} /> },
        { id: 4, name: 'Exams', path: '/exams', icon: <FileText size={20} /> },
        { id: 5, name: 'Verify & Lock', path: '/college-admin/marks-approval', icon: <Lock size={20} /> },
        { id: 8, name: 'Exam Halls', path: '/college-admin/examination-halls', icon: <Building2 size={20} /> },
        { id: 6, name: 'Teachers', path: '/teachers', icon: <Users size={20} /> },
        { id: 7, name: 'Students', path: '/students', icon: <UserCircle size={20} /> },
        { id: 12, name: 'Batches', path: '/batches', icon: <Layers size={20} /> },
        { id: 13, name: 'Subjects', path: '/subjects', icon: <Book size={20} /> },
        { id: 10, name: 'Roll Generator', path: '/college-admin/generate-roll-numbers', icon: <Hash size={20} /> },
        { id: 11, name: 'Seat Allocation', path: '/college-admin/seating-arrangement', icon: <LayoutDashboard size={20} /> },
        { id: 15, name: 'Faculty Status', path: '/college-admin/faculty-status', icon: <CheckCircle2 size={20} /> },
        { id: 16, name: 'College Performance', path: '/college-admin/performance', icon: <TrendingUp size={20} /> },
        { id: 17, name: 'Marks Verification', path: '/admin/marks-verification', icon: <ShieldCheck size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> },
        { id: 26, name: 'Institutional Roadmap', path: '/milestones', icon: <Flag size={20} /> },
        { 
          id: 50, 
          name: 'Internal Exams', 
          type: 'parent',
          icon: <FileText size={20} />,
          children: [
            { id: 51, name: 'Exam Rounds', path: '/college-admin/internal-exams/rounds', icon: <Layers size={16} /> },
            { id: 52, name: 'Exam Schedule', path: '/college-admin/internal-exams/schedules', icon: <Calendar size={16} /> },
          ]
        },
      ];
    } else if (roleName === 'Faculty' || roleName === 'Teacher') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Marks Entry', path: '/faculty/marks-entry', icon: <BarChart3 size={20} /> },
        { id: 52, name: 'Internal Schedule', path: '/college-admin/internal-exams/schedules', icon: <Calendar size={20} /> },
        { id: 4, name: 'Attendance', path: '/faculty/attendance', icon: <Calendar size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ];
      if (isAssignedPaperSetter) {
        menuItems.push({ id: 3, name: 'Paper Setter', path: '/paper-setter/dashboard', icon: <FileText size={20} /> });
      }
    } else if (roleName === 'HOD') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/hod/dashboard', icon: <LayoutDashboard size={20} /> },
        // { id: 5, name: 'Exams', path: '/exams', icon: <FileText size={20} /> },
        { id: 2, name: 'Marks Approval', path: '/hod/marks-approval', icon: <FileText size={20} /> },
        { id: 3, name: 'Faculty Assign', path: '/college-admin/faculty-assign', icon: <Users size={20} /> },
        { id: 4, name: 'Department Faculty', path: '/teachers', icon: <Users size={20} /> },
        { id: 5, name: 'Assign Sets (HOD)', path: '/paper-setter/dashboard', icon: <FileText size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ]
    } else if (roleName === 'Student') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Exam Schedule', path: '/student/exams', icon: <FileText size={20} /> },
        { id: 3, name: 'Results', path: '/student/results', icon: <BarChart3 size={20} /> },
        { id: 4, name: 'Attendance', path: '/student/attendance', icon: <Calendar size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ]
    } else if (roleName === 'External Faculty') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/external-faculty/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'External Marking', path: '/external-faculty/marks-entry', icon: <BarChart3 size={20} /> }
      ];
      if (isAssignedPaperSetter) {
        menuItems.push({ id: 3, name: 'Paper Setter', path: '/paper-setter/dashboard', icon: <FileText size={20} /> });
      }
    } else if (roleName === 'Secrecy') {
      menuItems = [
        { id: 1, name: 'Dashboard', path: '/secrecy/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Paper Setters', path: '/secrecy/paper-setters', icon: <Users size={20} /> },
        { id: 3, name: 'Question Papers', path: '/secrecy/question-papers', icon: <FileText size={20} /> },
        { id: 4, name: 'Payments', path: '/secrecy/payments', icon: <CreditCard size={20} /> },
      ];
    } else if (roleName === 'PAPER_SETTER') {
      menuItems = [
        { id: 2, name: 'Assigned Exams', path: '/paper-setter/dashboard', icon: <FileText size={20} /> },
        { id: 3, name: 'Submitted Papers', path: '/paper-setter/submitted-papers', icon: <CheckCircle2 size={20} /> },
        { id: 4, name: 'Guidelines', path: '/paper-setter/guidelines', icon: <BookOpen size={20} /> },
      ];
    }

    return menuItems;
  };

  const menuItems = renderMenuByRole();

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 transition-transform duration-300 overflow-hidden border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Logo Section */}
      <div className="p-6 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/30">
            <School className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white italic">
            EMS<span className="text-indigo-500 not-italic ml-1">Admin</span>
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {isOpen && window.innerWidth < 1024 ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Main Menu</p>
        {menuItems.map((item) => {
          let isActive = false;
          if (item.path && item.path.includes('?')) {
            isActive = (location.pathname + location.search) === item.path || (location.pathname === item.path.split('?')[0] && !location.search && (item.path.includes('tab=overview') || item.path.includes('tab=assigned')) && (item.name === 'Dashboard'));
          } else {
            isActive = location.pathname === item.path;
          }

          if (item.type === 'parent') {
            return (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center gap-3 px-4 py-2 mt-2 font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-loose">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.children.map(child => {
                  const isChildActive = location.pathname === child.path;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleLinkClick(child.path)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ml-2 ${isChildActive
                        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`${isChildActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                          {child.icon}
                        </span>
                        <span className="text-xs font-bold">{child.name}</span>
                      </div>
                      {isChildActive && <ChevronRight size={12} className="text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="text-sm font-bold">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-500" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Profile/Status Section */}
      {/* <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">Administrator</p>
            <p className="text-[10px] text-slate-500 truncate lowercase">admin@ems.edu</p>
          </div>
        </div>
      </div> */}
    </aside>
  );
};

export default Sidebar;