import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Menu,
  X
} from "lucide-react";

/**
 * Sidebar component with Tailwind CSS styling.
 * Designed for a modern, premium EMS application.
 */
const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLinkClick = (path) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  const menuItems = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 2, name: 'Universities', path: '/universities', icon: <School size={20} /> },
    { id: 3, name: 'Colleges', path: '/colleges', icon: <GraduationCap size={20} /> },
    { id: 4, name: 'Programs', path: '/programs', icon: <BookOpen size={20} /> },
    { id: 5, name: 'Academic Years', path: '/academic-years', icon: <Calendar size={20} /> },
    { id: 6, name: 'Semesters', path: '/semesters', icon: <Layers size={20} /> },
    { id: 7, name: 'Subjects', path: '/subjects', icon: <Book size={20} /> },
    { id: 8, name: 'Teachers', path: '/teachers', icon: <Users size={20} /> },
    { id: 9, name: 'Students', path: '/students', icon: <UserCircle size={20} /> },
    { id: 10, name: 'Exams', path: '/exams', icon: <FileText size={20} /> },
    { id: 11, name: 'Marks', path: '/marks', icon: <BarChart3 size={20} /> },
    { id: 12, name: 'Policies', path: '/policies', icon: <ShieldCheck size={20} /> },
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 transition-transform duration-300 overflow-hidden border-r border-slate-800 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Brand Logo Section */}
      <div className="p-6 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-500/30">
            <School className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white italic">
            EMS<span className="text-sky-500 not-italic ml-1">Admin</span>
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
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.path)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-sky-500/10 text-sky-400 font-semibold' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'} transition-colors`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {isActive && <ChevronRight size={14} className="text-sky-500" />}
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