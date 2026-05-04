import React, { useState, useEffect } from "react";
import { Server, Hash, Mail, Lock, User, Eye, EyeOff, Save, CheckCircle2, AlertCircle } from "lucide-react";
import { systemConfigApi } from "../api/systemConfigApi";

const SmtpConfig = () => {
  const [formData, setFormData] = useState({
    host: "",
    port: "",
    user: "",
    password: "",
    displayName: "",
    fromEmail: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: null, message: "" });



  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const data = await systemConfigApi.getSmtpConfig();
      setFormData(data);
    } catch (error) {
      console.error("Fetch config error:", error);
      setStatus({ type: 'error', message: "Failed to load SMTP configuration" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (status.message) setStatus({ type: null, message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      await systemConfigApi.updateSmtpConfig(formData);
      setStatus({ type: 'success', message: "Configuration updated successfully!" });
      setTimeout(() => setStatus({ type: null, message: "" }), 3000);
    } catch (error) {
      console.error("Update config error:", error);
      setStatus({ type: 'error', message: error.response?.data?.message || "Failed to update configuration" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">SMTP Configuration</h2>
          <p className="text-slate-500 font-medium tracking-tight mt-1 text-sm">Configure your outgoing email server settings</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 rounded-xl border border-sky-100">
          <Server size={14} className="text-sky-500" />
          <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Server Settings</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SMTP Host */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">SMTP Host</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Server size={18} />
              </div>
              <input
                type="text"
                name="host"
                value={formData.host}
                onChange={handleChange}
                placeholder="smtp.example.com"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* SMTP Port */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">SMTP Port</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Hash size={18} />
              </div>
              <input
                type="text"
                name="port"
                value={formData.port}
                onChange={handleChange}
                placeholder="465"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* SMTP User */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">SMTP User (Email)</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="user"
                value={formData.user}
                onChange={handleChange}
                placeholder="sender@example.com"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          {/* SMTP Password */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">SMTP Password</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Sender Display Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">Sender Display Name</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <User size={18} />
              </div>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Institution Name"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">From Email Address</label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-500 transition-colors pointer-events-none">
                <Mail size={18} />
              </div>
              <input
                type="email"
                name="fromEmail"
                value={formData.fromEmail}
                onChange={handleChange}
                placeholder="noreply@example.com"
                required
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-sky-500 outline-none transition-all font-semibold shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
          {status.message && (
            <div className={`flex items-center gap-2 font-bold text-sm animate-in fade-in slide-in-from-left-4 ${status.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.message}
            </div>
          )}
          {!status.message && <div />}
          
          <button
            type="submit"
            disabled={isSaving}
            className="w-full md:w-auto px-10 group relative overflow-hidden bg-slate-900 text-white rounded-2xl py-4 font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-slate-900/10 hover:shadow-sky-500/20 active:scale-[0.98] transition-all disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-2">
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  <span>Update Configuration</span>
                </>
              )}
            </div>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SmtpConfig;
