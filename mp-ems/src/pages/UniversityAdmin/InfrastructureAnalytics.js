import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, AlertTriangle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { masterDataApi } from '../../api/masterDataApi';
import { universityAdminApi } from '../../api/universityAdminApi';

const InfrastructureAnalytics = () => {
  const [data, setData] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalSeats: 0, totalStudents: 0, shortages: 0 });
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpansion = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchInfrastructureData(selectedExam);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const data = await masterDataApi.getExams();
      if (data) {
        setExams(data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchInfrastructureData = async (examId) => {
    setLoading(true);
    try {
      const result = await universityAdminApi.getInfrastructureAnalytics(examId);
      if (result) {
        setData(Array.isArray(result) ? result : []);

        // Calculate global summary stats
        if (Array.isArray(result)) {
          const totalSeats = result.reduce((acc, curr) => acc + (parseInt(curr.approved_capacity) || 0), 0);
          const totalStudents = result.reduce((acc, curr) => acc + (parseInt(curr.total_students) || 0), 0);
          const shortages = result.reduce((acc, curr) => acc + Math.max(0, (parseInt(curr.total_students) || 0) - (parseInt(curr.approved_capacity) || 0)), 0);
          setStats({ totalSeats, totalStudents, shortages });
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const filteredData = data.filter(item =>
    item.college_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Building2 className="text-blue-600" size={32} /> Infrastructure Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-1">College-wise Capacity vs Student Distribution</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
            <input
              type="text"
              placeholder="Search colleges..."
              className="pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 outline-none w-full font-medium transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full md:w-64 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/20 cursor-pointer appearance-none transition-all"
          >
            <option value="">All Exams (Aggregate)</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({formatDate(exam.exam_date)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Stats Bar */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-1">Total Capacity</p>
            <p className="text-xl font-black text-slate-800">{stats.totalSeats.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-1">Total Students</p>
            <p className="text-xl font-black text-slate-800">{stats.totalStudents.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-1">Overall Shortage</p>
            <p className="text-xl font-black text-rose-600">{stats.shortages.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-1">Status</p>
            <p className="text-xl font-black text-emerald-600">{stats.shortages === 0 ? 'Optimal' : 'Shortage'}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400">Loading analytics...</div>
        ) : filteredData.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400">No colleges found</div>
        ) : filteredData.map((item) => {
          const occupancy = item.approved_capacity === 0 ? 0 : Math.round((item.total_students / item.approved_capacity) * 100);
          const isDeficit = item.total_students > item.approved_capacity;

          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 truncate" title={item.college_name}>
                    {item.college_name}
                  </h3>
                  <span className="text-[13px] text-slate-400  font-medium tracking-wider">Institution ID: {item.id}</span>
                </div>
                {isDeficit && (
                  <div className="bg-rose-50 text-rose-600 p-2 rounded-lg" title="Seat Deficit Detected">
                    <AlertTriangle size={18} />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={16} /> Students
                  </div>
                  <span className="font-bold text-slate-800">{item.total_students}</span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 size={16} />
                      <span className="text-[13px] font-black  tracking-widest text-slate-400">Total Infrastructure</span>
                    </div>
                    <span className="font-bold text-slate-800">{item.approved_capacity} seats</span>
                  </div>

                  {item.approved_halls_details && item.approved_halls_details.length > 0 && (
                    <div className="space-y-1.5 p-2 bg-slate-50/50 rounded-xl border border-slate-200/60">
                      {(expandedIds[item.id] ? item.approved_halls_details : item.approved_halls_details.slice(0, 3)).map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-lg border border-slate-100 shadow-sm animate-in fade-in duration-300">
                          <span className="text-[12px] font-black text-slate-500  tracking-wider">{h.code}</span>
                          <span className="text-[11px] font-black text-slate-800 tabular-nums">{h.capacity}</span>
                        </div>
                      ))}

                      {item.approved_halls_details.length > 3 && (
                        <button
                          onClick={() => toggleExpansion(item.id)}
                          className="w-full py-1.5 text-[12px] font-black text-blue-600 hover:text-blue-700  tracking-widest transition-colors flex items-center justify-center gap-1.5"
                        >
                          {expandedIds[item.id] ? (
                            <>Show Less <ChevronUp size={12} /></>
                          ) : (
                            <>+ {item.approved_halls_details.length - 3} More Halls <ChevronDown size={12} /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="text-slate-500 font-medium">Capacity Coverage</span>
                    <span className={isDeficit ? 'text-rose-600 font-bold' : 'text-blue-600 font-bold'}>
                      {occupancy}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${isDeficit ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>

                {isDeficit && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex gap-2 items-center">
                    <TrendingUp className="text-rose-500" size={16} />
                    <span className="text-[13px] text-rose-700 font-medium">
                      Requires {item.total_students - item.approved_capacity} additional seats
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InfrastructureAnalytics;
