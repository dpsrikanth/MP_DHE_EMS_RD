import React from 'react';
import { Info, Shield } from 'lucide-react';

const Guidelines = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-sky-500 p-2 rounded-xl text-white">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Paper Setter <span className="text-sky-500">Portal</span></h1>
              <p className="text-slate-400 text-[12px] font-bold  tracking-widest">Guidelines</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-slate-50 rotate-12 -z-0">
              <Info size={120} />
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight">Question Paper Guidelines</h2>
              
              <div className="space-y-8 max-w-2xl">
                <section className="space-y-4">
                  <h3 className="text-sm font-black text-sky-600  tracking-[0.2em] flex items-center gap-2">General Instructions</h3>
                  <ul className="space-y-3">
                    {[
                      'Each subject requires minimum 3 question paper sets (A, B, C)',
                      'Question papers must follow university format and syllabus',
                      'Submit papers at least 5 days before examination date',
                      'All papers must be reviewed and approved by secrecy department'
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="w-5 h-5 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                        <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black text-emerald-600  tracking-[0.2em] flex items-center gap-2">Format Requirements</h3>
                  <ul className="space-y-3">
                    {[
                      'Use official university letterhead',
                      'Include subject code, name, and semester',
                      'Specify time duration and maximum marks',
                      'Include clear instructions for students'
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                        <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-black text-purple-600  tracking-[0.2em] flex items-center gap-2">Quality Standards</h3>
                  <ul className="space-y-3">
                    {[
                      'Questions should cover entire syllabus appropriately',
                      'Maintain appropriate difficulty level distribution',
                      'Ensure no grammatical or factual errors',
                      'Provide clear marking scheme'
                    ].map((text, i) => (
                      <li key={i} className="flex items-start gap-3 group">
                        <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0 group-hover:scale-110 transition-transform mt-0.5">•</div>
                        <p className="text-slate-600 font-bold tracking-tight text-sm leading-relaxed">{text}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="pt-12 pb-8 text-center text-slate-400 font-bold text-[12px]  tracking-widest">
        {new Date().getFullYear()} Secure EMS Portal • End-to-End Encryption Enabled
      </footer>
    </div>
  );
};

export default Guidelines;
