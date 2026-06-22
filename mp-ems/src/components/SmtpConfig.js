import React, { useState, useEffect } from "react";
import { Server, Hash, Mail, Lock, User, Eye, EyeOff, Send, CheckCircle2, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";
import { systemConfigApi } from "../api/systemConfigApi";

const SmtpConfig = () => {
  const [config, setConfig] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [testEmail, setTestEmail] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState({ type: null, message: "" });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await systemConfigApi.getSmtpConfig();
      setConfig(data);
    } catch (error) {
      console.error("Fetch config error:", error);
      setLoadError(error.response?.data?.message || "Failed to load SMTP configuration");
    } finally {
      setIsLoading(false);
    }
  };

  // sendTest=false -> verify connection only; sendTest=true -> send a real email
  const runTest = async (sendTest) => {
    setIsTesting(true);
    setResult({ type: null, message: "" });
    try {
      const payload = sendTest ? { testEmail: testEmail.trim() } : {};
      const data = await systemConfigApi.testSmtpConfig(payload);
      setResult({ type: "success", message: data.message || "SMTP test succeeded." });
    } catch (error) {
      console.error("SMTP test error:", error);
      setResult({ type: "error", message: error.response?.data?.message || "SMTP test failed." });
    } finally {
      setIsTesting(false);
    }
  };

  const maskedPassword = config?.password
    ? "•".repeat(Math.min(config.password.length, 16))
    : "—";

  const fields = config
    ? [
        { label: "SMTP Host", value: config.host || "—", icon: Server },
        { label: "SMTP Port", value: config.port || "—", icon: Hash },
        { label: "SMTP User", value: config.user || "—", icon: Mail },
        {
          label: "SMTP Password",
          value: showPassword ? (config.password || "—") : maskedPassword,
          icon: Lock,
          isPassword: true
        },
        { label: "Sender Display Name", value: config.displayName || "—", icon: User },
        { label: "From Email Address", value: config.fromEmail || "—", icon: Mail }
      ]
    : [];

  if (isLoading) {
    return (
      <div className="bg-white p-20 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse">Loading configuration...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-white p-12 rounded-[2.5rem] border border-rose-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-3 bg-rose-50 rounded-2xl text-rose-500">
          <AlertCircle size={28} />
        </div>
        <p className="text-slate-700 font-bold">{loadError}</p>
        <button
          onClick={fetchConfig}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Email Server Configuration</h2>
          <p className="text-slate-500 font-medium tracking-tight mt-1 text-sm">
            Active outgoing email settings (read-only). Edit them in the server <code className="text-slate-600 font-bold">config/.env</code> file.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-[12px] font-black text-emerald-600 tracking-widest">Read Only</span>
        </div>
      </div>

      {/* Read-only details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {fields.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.label} className="space-y-2">
              <label className="text-[12px] font-black text-slate-400 tracking-[0.15em] ml-1">{f.label}</label>
              <div className="relative flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 min-h-[3.5rem]">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Icon size={18} />
                </div>
                <span className="text-slate-800 font-semibold break-all">{f.value}</span>
                {f.isPassword && config.password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="my-8 border-t border-slate-100" />

      {/* Test section */}
      <div>
        <h3 className="text-lg font-black text-slate-900 tracking-tight">Test Email Client</h3>
        <p className="text-slate-500 font-medium text-sm mt-1">
          Verify the server can reach the mail provider, or send a real test email to confirm delivery.
        </p>

        <div className="mt-5 flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail size={18} />
            </div>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => { setTestEmail(e.target.value); if (result.message) setResult({ type: null, message: "" }); }}
              placeholder="Recipient email for test message"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 outline-none transition-all font-semibold"
            />
          </div>

          <button
            type="button"
            onClick={() => runTest(true)}
            disabled={isTesting || !testEmail.trim()}
            className="px-7 bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm tracking-wide shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isTesting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} /> Send Test Email
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => runTest(false)}
            disabled={isTesting}
            className="px-7 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl py-4 font-black text-sm tracking-wide hover:border-slate-300 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <ShieldCheck size={18} /> Verify Connection
          </button>
        </div>

        {/* Result */}
        {result.message && (
          <div
            className={`mt-5 flex items-start gap-2.5 p-4 rounded-2xl font-bold text-sm ${
              result.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}
          >
            {result.type === "success" ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
            <span className="break-words">{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmtpConfig;
