import React, { useState, useEffect } from 'react';
import { FileCheck, Users, CheckCircle, XCircle, BarChart2 } from 'lucide-react';

const ExamAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchStats(selectedExam);
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await fetch(`${window.config?.api_base_url || 'http://localhost:8080/api'}/exams`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setExams(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const fetchStats = async (examId = '') => {
    setLoading(true);
    try {
      const url = new URL(`${window.config?.api_base_url || 'http://localhost:8080/api'}/reports/global-exam-stats`);
      if (examId) url.searchParams.append('exam_id', examId);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await response.json();
      setStats(result);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading university stats...</div>;
  if (!stats) return <div className="p-10 text-center text-slate-400">No stats available</div>;

  const passRate = stats.total_passed === 0 ? 0 : Math.round((stats.total_passed / (parseInt(stats.total_passed) + parseInt(stats.total_failed))) * 100);

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <FileCheck className="text-indigo-600" size={32} /> Global Exam Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-1">University-wide Examination Performance Metrics</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="w-full md:w-80 px-4 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/20 cursor-pointer appearance-none transition-all"
          >
            <option value="">All Exams (Aggregate)</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({new Date(exam.exam_date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2 text-slate-500">
            <FileCheck size={20} />
            <span className="text-sm font-medium">Total Exams</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.total_exams}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2 text-slate-500">
            <Users size={20} />
            <span className="text-sm font-medium">Total Students</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.total_students}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2 text-emerald-500">
            <CheckCircle size={20} />
            <span className="text-sm font-medium text-slate-500">Global Passed</span>
          </div>
          <div className="text-3xl font-bold text-emerald-600">{stats.total_passed}</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2 text-rose-500">
            <XCircle size={20} />
            <span className="text-sm font-medium text-slate-500">Global Failed</span>
          </div>
          <div className="text-3xl font-bold text-rose-600">{stats.total_failed}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 className="text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Overall Performance Distribution</h2>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="relative size-48">
            <svg className="size-full" viewBox="0 0 36 36">
              <path
                className="text-slate-100 stroke-current"
                strokeWidth="3.8"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500 stroke-current"
                strokeWidth="3.8"
                strokeDasharray={`${passRate}, 100`}
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">{passRate}%</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Passing Rate</span>
            </div>
          </div>

          <div className="flex-1 space-y-6 w-full">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Academic Efficiency</span>
                <span className="text-indigo-600 font-bold">{passRate}% Pass Rate</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 font-medium">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Successful Candidates</span>
                <span className="text-xl text-slate-800">{stats.total_passed}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Unsuccessful Candidates</span>
                <span className="text-xl text-slate-800">{stats.total_failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAnalytics;
