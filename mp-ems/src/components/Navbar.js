import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown
} from 'lucide-react';

/**
 * TopBar (Navbar) component with Tailwind CSS styling.
 * Featuring dynamic titles, search, and a refined user profile dropdown.
 */
const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const roleName = localStorage.getItem('roleName') || 'Guest';

  const getPageTitle = (path) => {
    const route = path.split('/')[1];
    if (!route) return 'Dashboard';
    
    // Convert kebab-case or path to Title Case
    return route
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('roleName');
    localStorage.removeItem('user');
    navigate('/');
    setShowDropdown(false);
  };

  const getInitials = () => {
    return roleName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between transition-all duration-300">
      {/* Left: Dynamic Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Middle: Search Bar (Decorative/Functionality-placeholder) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" 
            size={18} 
          />
          <input 
            type="text" 
            placeholder="Search anything..."
            className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500/20 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-1.5 pl-3 pr-2 hover:bg-slate-100 rounded-2xl transition-all duration-200 border border-transparent hover:border-slate-200 group"
          >
            <div className="flex flex-col items-end mr-1">
              <p className="text-xs font-bold text-slate-900 leading-none mb-1">{roleName}</p>
              <p className="text-[10px] font-semibold text-sky-500 uppercase tracking-wider leading-none">Admin Mode</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">
              {getInitials()}
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              ></div>
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-50 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
                      {getInitials()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-slate-900 truncate">{roleName}</p>
                      <p className="text-xs text-slate-500 truncate">Administrator Account</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors">
                    <User size={18} />
                    <span>My Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors">
                    <Settings size={18} />
                    <span>Account Settings</span>
                  </button>
                </div>

                <div className="p-2 border-t border-slate-50">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
