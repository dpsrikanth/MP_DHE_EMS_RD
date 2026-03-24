import React from "react";
import SmtpConfig from "../components/SmtpConfig";
import { Mail } from "lucide-react";

const SmtpSettings = () => {
  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Mail size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Manage global email and communication configuration</p>
        </div>
      </div>

      <div className="max-w-5xl">
        <SmtpConfig />
      </div>
    </div>
  );
};

export default SmtpSettings;
