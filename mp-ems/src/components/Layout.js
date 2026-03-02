import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Global Layout component to wrap protected pages.
 * Implements a side-navigation and top-bar structure using Tailwind CSS.
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen min-w-0 transition-all duration-300">
        <Navbar />
        
        {/* Page Content */}
        <main className="flex-1 p-8 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;
