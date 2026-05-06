import React, { useState, useEffect } from 'react';
import { PieChart, CheckCircle2, XCircle, FileText, Filter, LayoutDashboard } from 'lucide-react';
import { collegeAdminApi } from '../../api/collegeAdminApi';

const CollegePerformance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const data = await collegeAdminApi.getCollegePerformance();
      setData(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching performance:', error);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutDashboard className="text-indigo-" /> Institution Performance Report
          </h1>
          <p className="text-slate-500">Subject-wise Pass/Fail Statistics and Academic Efficiency</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-bold  tracking-widest animate-pulse">Analyzing Statistics...</div>
        ) : data.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
            No examination results found for this institution yet.
          </div>
        ) : data.map((item, index) => {
          const passRate = item.total_appeared === 0 ? 0 : Math.round((item.passed / item.total_appeared) * 100);
          
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col sm:flex-row gap-8 items-center group hover:border-indigo- transition-colors">
              <div className="relative size-32 shrink-0">
                <svg className="size-full" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${passRate >= 75 ? 'text-emerald-500' : 'text-indigo-'} stroke-current`}
                    strokeWidth="4"
                    strokeDasharray={`${passRate}, 100`}
                    strokeLinecap="round"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-slate-800">{passRate}%</span>
                  <span className="text-[8px] text-slate-400  font-black tracking-tighter">Pass Rate</span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                    {item.subject_name}
                  </h3>
                  <p className="text-[13px] text-slate-400 font-medium  tracking-wider">{item.program_name}</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-3 rounded-xl text-center shadow-sm">
                    <span className="block text-[12px] text-slate-400  font-bold mb-1">Total</span>
                    <span className="block text-xl font-black text-slate-700">{item.total_appeared}</span>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-xl text-center shadow-sm">
                    <span className="block text-[12px] text-emerald-600  font-bold mb-1">Passed</span>
                    <span className="block text-xl font-black text-emerald-700">{item.passed}</span>
                  </div>
                  <div className="bg-rose-50 p-3 rounded-xl text-center shadow-sm">
                    <span className="block text-[12px] text-rose-600  font-bold mb-1">Failed</span>
                    <span className="block text-xl font-black text-rose-700">{item.failed}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${passRate >= 75 ? 'bg-emerald-500' : 'bg-indigo-'}`}
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollegePerformance;
