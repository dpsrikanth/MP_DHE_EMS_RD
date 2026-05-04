import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, CheckCircle2, AlertCircle, Calendar, Filter } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { masterDataApi } from '../../api/masterDataApi';

const FacultyStatus = () => {
  const [data, setData] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSemesters();
    fetchFacultyStatus();
  }, [selectedSemester]);

  const fetchSemesters = async () => {
    try {
      const data = await masterDataApi.getMasters();
      setSemesters(data.semesters || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    }
  };

  const fetchFacultyStatus = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSemester) params.semester_id = selectedSemester;

      const data = await collegeAdminApi.getFacultyGradingStatus(params);
      setData(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching status:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'locked': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'draft': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="text-indigo-600" /> Faculty Grading Status
          </h1>
          <p className="text-slate-500">Track and monitor marks submission progress by faculty</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <Filter size={18} className="text-slate-400 ml-2" />
          <select 
            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 pr-4"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">All Semesters</option>
            {semesters.map(sem => (
              <option key={sem.id} value={sem.id}>{sem.semester_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Faculty Member</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Subject & Program</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Semester / Sec</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Grading Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 tracking-wider">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400">Loading faculty data...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-20 text-center text-slate-400">No faculty assignments found</td></tr>
            ) : data.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{item.faculty_name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tight">Teacher Code: {item.allocation_id}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col">
                    <span>{item.subject_name}</span>
                    <span className="text-xs text-slate-400">{item.program_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    <span>{item.semester_name}</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold">SEC: {item.section}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.grading_status)}`}>
                    {item.grading_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {item.last_updated ? formatDate(item.last_updated) : 'Never'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacultyStatus;
