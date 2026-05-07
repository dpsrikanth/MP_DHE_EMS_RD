import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Star, Percent, BarChart3, Search } from 'lucide-react';
import { universityAdminApi } from '../../api/universityAdminApi';

const InstitutionalRanking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    try {
      const data = await universityAdminApi.getInstitutionalRanking();
      if (data) {
        setRanking(Array.isArray(data) ? data : []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ranking:', error);
      setLoading(false);
    }
  };

  const filteredRanking = ranking.filter(item => 
    item.college_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-screen space-y-4">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-indigo-600" /> Institutional Rankings
          </h1>
          <p className="text-slate-500">Comparative Analysis of College Passing Percentages</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
          <input 
            type="text" 
            placeholder="Search institutions..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-[13px] font-bold  text-slate-500 tracking-wider w-20">Rank</th>
              <th className="px-6 py-4 text-[13px] font-bold  text-slate-500 tracking-wider">Institution Name</th>
              <th className="px-6 py-4 text-[13px] font-bold  text-slate-500 tracking-wider">Total Marks Entries</th>
              <th className="px-6 py-4 text-[13px] font-bold  text-slate-500 tracking-wider">Passed Count</th>
              <th className="px-6 py-4 text-[13px] font-bold  text-slate-500 tracking-wider">Performance (Pass %)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400">Calculating rankings...</td></tr>
            ) : filteredRanking.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400">No data available</td></tr>
            ) : filteredRanking.map((item, index) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              
              return (
                <tr key={index} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center">
                      {rank === 1 ? <Medal className="text-indigo-400" /> : 
                       rank === 2 ? <Medal className="text-slate-300" /> : 
                       rank === 3 ? <Medal className="text-orange-400" /> : 
                       <span className="font-bold text-slate-400">#{rank}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`font-semibold ${isTopThree ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                      {item.college_name}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500 font-medium">{item.total_marks_entered || 0}</td>
                  <td className="px-6 py-3 text-emerald-600 font-semibold">{item.passed_count || 0}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden w-32 border border-slate-50 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            item.pass_percentage >= 75 ? 'bg-emerald-500' :
                             item.pass_percentage >= 50 ? 'bg-indigo-500' :
                            'bg-indigo-400'
                          }`}
                          style={{ width: `${item.pass_percentage || 0}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-800 text-sm whitespace-nowrap">
                        {item.pass_percentage || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-start gap-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
            <div className="text-2xl font-black text-emerald-800 mt-2">
              {ranking.filter(r => r.pass_percentage >= 75).length}
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <h4 className="text-indigo-800 font-bold">Average Efficiency</h4>
            <p className="text-indigo-600 text-[13px] mt-1">Institutions with Pass Rate 50-75%</p>
            <div className="text-2xl font-black text-indigo-800 mt-2">
              {ranking.filter(r => r.pass_percentage >= 50 && r.pass_percentage < 75).length}
            </div>
          </div>
        </div>

        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-start gap-4">
          <div className="p-3 bg-rose-100 rounded-xl text-rose-600">
            <Percent size={24} />
          </div>
          <div>
            <h4 className="text-rose-800 font-bold">Needs Support</h4>
            <p className="text-rose-600 text-[13px] mt-1">Institutions with Pass Rate {'<'} 50%</p>
            <div className="text-2xl font-black text-rose-800 mt-2">
              {ranking.filter(r => r.pass_percentage < 50).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionalRanking;
