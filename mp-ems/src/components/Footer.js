import React from 'react';
import { School, Github, Twitter, Linkedin } from 'lucide-react';

/**
 * Modern Footer component with Tailwind CSS styling.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-slate-200 pt-12 pb-8 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-sky-500 p-1.5 rounded-lg">
                <School className="text-white" size={18} />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">EMS<span className="text-sky-500">Admin</span></span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Empowering education through advanced management tools. Streamlined, efficient, and data-driven solutions for modern institutions.
            </p>
            <div className="flex gap-4">
              <button className="text-slate-400 hover:text-sky-500 transition-colors"><Twitter size={18} /></button>
              <button className="text-slate-400 hover:text-sky-500 transition-colors"><Github size={18} /></button>
              <button className="text-slate-400 hover:text-sky-500 transition-colors"><Linkedin size={18} /></button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Quick Links</h4>
            <ul className="space-y-4">
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">Documentation</button></li>
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">Support Center</button></li>
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">API Status</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4">
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">Privacy Policy</button></li>
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">Terms of Service</button></li>
              <li><button className="text-sm text-slate-500 hover:text-sky-500 transition-colors">Cookie Policy</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="text-sm text-slate-500">support@ems.edu.in</li>
              <li className="text-sm text-slate-500">+91 0123 456 789</li>
              <li className="text-sm text-slate-500">Madhya Pradesh, India</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400">
            &copy; {currentYear} Education Management System. Built with ❤️ for better learning.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">System Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
