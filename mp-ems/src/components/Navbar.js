import useAuthStore from '../store/useAuthStore';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Menu,
  HelpCircle,
  X
} from 'lucide-react';
import ChangePasswordModal from './ChangePasswordModal';
import { getHelpContent } from '../utils/helpContent';
import { createPortal } from 'react-dom';

/**
 * TopBar (Navbar) component with Tailwind CSS styling.
 * Featuring dynamic titles, search, and a refined user profile dropdown.
 */
const Navbar = ({ toggleSidebar, isSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsHelpOpen(false);
      }
    };
    if (isHelpOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Prevent body scrolling when help drawer is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isHelpOpen]);

  const roleName = useAuthStore.getState().roleName || 'Guest';
  const user = (useAuthStore.getState().user || {});
  const displayName = user.name || roleName;

  const getPageTitle = (path) => {
    const route = path.split('/')[1];
    if (!route) return 'Dashboard';
    if (route === 'teachers') return 'Faculty';
    
    // Convert kebab-case or path to Title Case
    return route
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
navigate('/');
    setShowDropdown(false);
  };

  const getInitials = () => {
    return displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
    <header className={`sticky top-0 w-full h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between transition-all duration-300 ${(isHelpOpen || isPasswordModalOpen) ? 'z-[100]' : 'z-30'}`}>
      {/* Left: Dynamic Title */}
      <div className="flex items-center gap-4">
        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Menu size={24} />
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
            {getPageTitle(location.pathname)}
          </h1>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 group relative"
            title="Page Information & Guide"
          >
            <HelpCircle size={20} className="transition-transform group-hover:scale-110" />
            
            {/* Tooltip on hover */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-44 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 bg-slate-900/95 text-white text-[12px] font-medium py-1.5 px-2.5 rounded-lg shadow-xl text-center z-50">
              How does this page work?
            </span>
          </button>
        </div>
      </div>

      {/* Middle: Search Bar (Decorative/Functionality-placeholder) */}
      {/* <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full group">
          <Search 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors" 
            size={18} 
          />
          <input 
            type="text" 
            placeholder="Search anything..."
            className="w-full bg-slate-100 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
          />
        </div>
      </div> */}

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
              <p className="text-[13px] font-bold text-slate-900 leading-none mb-1">{displayName}</p>
              <p className="text-[12px] font-semibold text-sky-500  tracking-wider leading-none">
                {roleName.replace('_', ' ')}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
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
                      <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                      <p className="text-[13px] text-slate-500 truncate">{roleName.replace('_', ' ')} Profile</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2">
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors"
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowDropdown(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-sky-600 rounded-xl transition-colors"
                  >
                    <Settings size={18} />
                    <span>Change Password</span>
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
      
    <ChangePasswordModal 
      isOpen={isPasswordModalOpen} 
      onClose={() => setIsPasswordModalOpen(false)} 
    />

    {/* Help System Drawer */}
    {isHelpOpen && createPortal(
      (() => {
        const help = getHelpContent(location.pathname);
        return (
          <>
            {/* Backdrop with transition */}
            <div 
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[9999] transition-opacity duration-300 animate-in fade-in"
              onClick={() => setIsHelpOpen(false)}
            />
            
            {/* Drawer Container */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[10000] flex flex-col h-full animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-none">Page Guide</h3>
                    <p className="text-[12px] text-slate-400 font-semibold mt-1 tracking-wider uppercase">Help & Info</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Title and Description */}
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-indigo-600 leading-tight">
                    {help.title}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {help.description}
                  </p>
                </div>
                
                {/* Key Features Section */}
                {help.features && help.features.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-[13px] font-bold text-slate-400 tracking-wider uppercase">
                      What you can do here:
                    </h5>
                    <ul className="space-y-3">
                      {help.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </span>
                          <span className="text-[14px] text-slate-600 font-medium leading-normal">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Tips Section */}
                {help.tips && (
                  <div className="mt-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex gap-3">
                    <div className="text-indigo-500 mt-0.5 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                      </svg>
                    </div>
                    <div>
                      <h6 className="text-sm font-bold text-indigo-900 mb-0.5">Pro Tip</h6>
                      <p className="text-[13px] text-indigo-700 leading-relaxed font-semibold">
                        {help.tips}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[14px] transition-colors shadow-lg shadow-indigo-600/10"
                >
                  Got It
                </button>
              </div>
            </div>
          </>
        );
      })(),
      document.body
    )}
    </>
  );
};

export default Navbar;
