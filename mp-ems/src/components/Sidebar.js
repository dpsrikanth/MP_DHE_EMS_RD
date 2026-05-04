import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authUtils from "../utils/authUtils";
import { facultyApi } from "../api/facultyApi";
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
  ChevronDown,
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
  Hash,
  ClipboardCheck,
  Briefcase,
  Monitor
} from "lucide-react";

/**
 * Sidebar component with Tailwind CSS styling.
 * Designed for a hierarchical, organized EMS navigation experience.
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAssignedPaperSetter, setIsAssignedPaperSetter] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const roleName = localStorage.getItem('roleName');
    if (['Faculty', 'Teacher', 'External Faculty'].includes(roleName)) {
      facultyApi.checkAssigned()
        .then(data => setIsAssignedPaperSetter(data.isAssigned))
        .catch(err => console.error(err));
    } else {
      setIsAssignedPaperSetter(true);
    }
  }, []);

  // Initialize expanded state based on current location
  useEffect(() => {
    const items = renderMenuByRole();
    const newExpanded = { ...expandedMenus };
    items.forEach(item => {
      if (item.type === 'parent' && item.children.some(child => location.pathname === child.path)) {
        newExpanded[item.id] = true;
      }
    });
    setExpandedMenus(newExpanded);
  }, [location.pathname]);

  const toggleMenu = (id) => {
    setExpandedMenus(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLinkClick = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const renderMenuByRole = () => {
    const roleName = localStorage.getItem('roleName');

    if (roleName === 'college_admin') {
      return [
        { id: 1, name: 'Dashboard', path: '/college-admin/dashboard', icon: <LayoutDashboard size={20} /> },
        {
          id: 'academic',
          name: 'Academic Management',
          type: 'parent',
          icon: <GraduationCap size={20} />,
          children: [
            { id: 6, name: 'Faculty', path: '/teachers', icon: <Users size={18} /> },
            { id: 7, name: 'Students', path: '/students', icon: <UserCircle size={18} /> },
            { id: 12, name: 'Batches', path: '/batches', icon: <Layers size={18} /> },
            { id: 13, name: 'Subjects', path: '/subjects', icon: <Book size={18} /> },
            { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={18} /> },
            { id: 26, name: 'Institutional Roadmap', path: '/milestones', icon: <Flag size={18} /> },
          ]
        },
        {
          id: 'exams',
          name: 'Examination System',
          type: 'parent',
          icon: <FileText size={20} />,
          children: [
            { id: 4, name: 'Exams', path: '/exams', icon: <FileText size={18} /> },
            { id: 8, name: 'Exam Halls', path: '/college-admin/examination-halls', icon: <Building2 size={18} /> },
            { id: 11, name: 'Seat Allocation', path: '/college-admin/seating-arrangement', icon: <Monitor size={18} /> },
            { id: 50, name: 'Internal Schedule', path: '/college-admin/internal-exams/schedules', icon: <Calendar size={18} /> },
          ]
        },
        {
          id: 'results',
          name: 'Results & Governance',
          type: 'parent',
          icon: <BarChart3 size={20} />,
          children: [
            { id: 2, name: 'Policy Config', path: '/college-admin/policies', icon: <Settings size={18} /> },
            { id: 3, name: 'Marks Structure', path: '/college-admin/marks-config', icon: <BarChart3 size={18} /> },
            { id: 5, name: 'Verify & Lock', path: '/college-admin/marks-approval', icon: <Lock size={18} /> },
            { id: 17, name: 'Marks Verification', path: '/admin/marks-verification', icon: <ShieldCheck size={18} /> },
            { id: 15, name: 'Faculty Status', path: '/college-admin/faculty-status', icon: <CheckCircle2 size={18} /> },
            { id: 16, name: 'College Performance', path: '/college-admin/performance', icon: <TrendingUp size={18} /> },
          ]
        }
      ];
    }

    if (authUtils.isUniversityAdmin()) {
      return [
        { id: 1, name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
        {
          id: 'academic',
          name: 'Academic Setup',
          type: 'parent',
          icon: <School size={20} />,
          children: [
            { id: 8, name: 'Departments', path: '/departments', icon: <Building2 size={18} /> },
            { id: 4, name: 'Programs', path: '/programs', icon: <BookOpen size={18} /> },
            { id: 5, name: 'Academic Years', path: '/academic-years', icon: <Calendar size={18} /> },
            { id: 6, name: 'Semesters', path: '/semesters', icon: <Layers size={18} /> },
            { id: 9, name: 'Faculty', path: '/teachers', icon: <Users size={18} /> },
            { id: 10, name: 'Students', path: '/students', icon: <UserCircle size={18} /> },
          ]
        },
        {
          id: 'exams',
          name: 'Exam Operations',
          type: 'parent',
          icon: <FileText size={20} />,
          children: [
            { id: 11, name: 'Exams', path: '/exams', icon: <FileText size={18} /> },
            { id: 16, name: 'External Assignment', path: '/university/external-assignment', icon: <UserPlus size={18} /> },
            { id: 23, name: 'Hall Approvals', path: '/university/hall-approvals', icon: <Building2 size={18} /> },
            { id: 24, name: 'Student Allocations', path: '/university/student-allocations', icon: <UserPlus size={18} /> },
          ]
        },
        {
          id: 'results',
          name: 'Results & Analytics',
          type: 'parent',
          icon: <PieChart size={20} />,
          children: [
            { id: 17, name: 'Result Hub', path: '/university/external-marks', icon: <BarChart3 size={18} /> },
            { id: 18, name: 'Grading Policy', path: '/university/grading-policy', icon: <ShieldCheck size={18} /> },
            { id: 19, name: 'Manage Credits', path: '/university/manage-credits', icon: <BookOpen size={18} /> },
            { id: 29, name: 'Exam Analytics', path: '/university/exam-analytics', icon: <PieChart size={18} /> },
            { id: 30, name: 'Institutional Ranking', path: '/university/institutional-ranking', icon: <Trophy size={18} /> },
            { id: 28, name: 'Infrastructure', path: '/university/infrastructure-analytics', icon: <Map size={18} /> },
          ]
        },
        {
          id: 'admin',
          name: 'Administration',
          type: 'parent',
          icon: <Settings size={20} />,
          children: [
            { id: 3, name: 'Colleges', path: '/colleges', icon: <GraduationCap size={18} /> },
            { id: 20, name: 'Users', path: '/users', icon: <Users size={18} /> },
            { id: 13, name: 'Policies', path: '/policies', icon: <ShieldCheck size={18} /> },
            { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={18} /> },
            { id: 26, name: 'Institutional Roadmap', path: '/milestones', icon: <Flag size={18} /> },
          ]
        }
      ];
    }

    if (roleName === 'Faculty' || roleName === 'Teacher') {
      const items = [
        { id: 1, name: 'Dashboard', path: '/faculty/dashboard', icon: <LayoutDashboard size={20} /> },
        { 
          id: 'marks', 
          name: 'Marks & Assessment', 
          type: 'parent', 
          icon: <ClipboardCheck size={20} />,
          children: [
            { id: 2, name: 'General Marks', path: '/faculty/marks-entry', icon: <BarChart3 size={18} /> },
            { id: 50, name: 'Internal Exam Entry', path: '/faculty/internal-marks', icon: <ClipboardCheck size={18} /> },
          ]
        },
        { id: 4, name: 'Attendance', path: '/faculty/attendance', icon: <Calendar size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ];
      if (isAssignedPaperSetter) {
        items.push({ id: 3, name: 'Paper Setter', path: '/paper-setter/dashboard', icon: <FileText size={20} /> });
      }
      return items;
    }

    if (roleName === 'Paper Setter' || roleName === 'PAPER_SETTER' || authUtils.isPaperSetter()) {
      return [
        { id: 1, name: 'Dashboard', path: '/paper-setter/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Guidelines', path: '/paper-setter/guidelines', icon: <ClipboardCheck size={20} /> },
        { id: 3, name: 'Submitted Papers', path: '/paper-setter/submitted-papers', icon: <FileText size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ];
    }

    if (roleName === 'Secrecy' || authUtils.isSecrecy()) {
      return [
        { id: 1, name: 'Dashboard', path: '/secrecy/dashboard', icon: <LayoutDashboard size={20} /> },
        { id: 2, name: 'Paper Setters', path: '/secrecy/paper-setters', icon: <Users size={20} /> },
        { id: 3, name: 'Question Papers', path: '/secrecy/question-papers', icon: <BookOpen size={20} /> },
        { id: 4, name: 'Payments', path: '/secrecy/payments', icon: <CreditCard size={20} /> },
      ];
    }

    if (roleName === 'External Faculty') {
      return [
        { id: 2, name: 'Marks Entry', path: '/external-faculty/marks-entry', icon: <FileText size={18} /> },
      ];
    }

    if (roleName === 'HOD') {
      return [
        { id: 1, name: 'Dashboard', path: '/hod/dashboard', icon: <LayoutDashboard size={20} /> },
        {
          id: 'governance',
          name: 'Department Governance',
          type: 'parent',
          icon: <ShieldCheck size={20} />,
          children: [
            { id: 10, name: 'Assessments', path: '/hod/assessment-acceptance', icon: <ClipboardCheck size={18} /> },
            { id: 2, name: 'Marks Approval', path: '/hod/marks-approval', icon: <FileText size={18} /> },
            { id: 3, name: 'Faculty Assign', path: '/college-admin/faculty-assign', icon: <Users size={18} /> },
            { id: 4, name: 'Staff List', path: '/teachers', icon: <Users size={18} /> },
          ]
        },
        { id: 5, name: 'Assign Sets (HOD)', path: '/paper-setter/dashboard', icon: <FileText size={20} /> },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ];
    }

    if (roleName === 'Student') {
      return [
        { id: 1, name: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard size={20} /> },
        {
          id: 'academic',
          name: 'My Academic',
          type: 'parent',
          icon: <BookOpen size={20} />,
          children: [
            { id: 2, name: 'Exam Schedule', path: '/student/exams', icon: <FileText size={18} /> },
            { id: 3, name: 'Results', path: '/student/results', icon: <BarChart3 size={18} /> },
            { id: 4, name: 'Attendance', path: '/student/attendance', icon: <Calendar size={18} /> },
          ]
        },
        { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> }
      ];
    }

    // Default Admin / SuperAdmin Menu fallback
    const defaultItems = [
      { id: 1, name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
      {
        id: 'setup',
        name: 'System Setup',
        type: 'parent',
        icon: <Settings size={20} />,
        children: [
          { id: 2, name: 'Universities', path: '/universities', icon: <School size={18} /> },
          { id: 3, name: 'Colleges', path: '/colleges', icon: <GraduationCap size={18} /> },
          { id: 4, name: 'Programs', path: '/programs', icon: <BookOpen size={18} /> },
          { id: 5, name: 'Academic Years', path: '/academic-years', icon: <Calendar size={18} /> },
          { id: 6, name: 'Semesters', path: '/semesters', icon: <Layers size={18} /> },
        ]
      },
      {
        id: 'access',
        name: 'Access Control',
        type: 'parent',
        icon: <ShieldCheck size={20} />,
        children: [
          { id: 20, name: 'Users', path: '/users', icon: <Users size={18} /> },
          { id: 21, name: 'Roles', path: '/roles', icon: <ShieldCheck size={18} /> },
          { id: 13, name: 'Policies', path: '/policies', icon: <ShieldCheck size={18} /> },
        ]
      },
      { id: 25, name: 'Academic Calendar', path: '/internal-calendar', icon: <Calendar size={20} /> },
    ];

    if (authUtils.isSystemAdmin()) {
      defaultItems.push({ id: 100, name: 'SMTP Settings', path: '/smtp-settings', icon: <Mail size={20} /> });
    }

    return defaultItems;
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
            Intense
          </h1>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-400 hover:text-white transition-colors lg:hidden"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Main Menu</p>
        
        {menuItems.map((item) => {
          if (item.type === 'parent') {
            const isExpanded = expandedMenus[item.id];
            const hasActiveChild = item.children.some(child => location.pathname === child.path);

            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isExpanded || hasActiveChild ? 'text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className={`shrink-0 ${isExpanded || hasActiveChild ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-400/70'} transition-colors duration-300`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-black tracking-tight text-left">{item.name}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>

                {isExpanded && (
                  <div className="space-y-1 ml-4 border-l border-slate-800/50 pl-2 animate-in slide-in-from-top-2 duration-300">
                    {item.children.map(child => {
                      const isChildActive = location.pathname === child.path;
                      return (
                        <button
                          key={child.id}
                          onClick={() => handleLinkClick(child.path)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                            isChildActive
                              ? 'bg-indigo-500/10 text-indigo-400 font-black'
                              : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span className={`shrink-0 transition-colors ${isChildActive ? 'text-indigo-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                            {child.icon}
                          </span>
                          <span className="text-xs font-bold text-left">{child.name}</span>
                          {isChildActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // Simple Link Item
          const isActive = item.path && (
            location.pathname === item.path || 
            (item.path.includes('?') && (location.pathname + location.search) === item.path)
          );

          return (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 text-left">
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400/70'} transition-colors duration-300`}>
                  {item.icon}
                </span>
                <span className="text-sm font-black tracking-tight text-left">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={16} />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;