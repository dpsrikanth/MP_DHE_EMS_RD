import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, BookOpen, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import authUtils from '../../utils/authUtils';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const apiBase = window.config?.api_base_url || window.config?.login_url?.replace('/login', '') || 'http://localhost:8080/api';
      const response = await fetch(`${apiBase}/student/exams`, {
        headers: {
          ...authUtils.getAuthHeader()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      } else {
        toast.error('Failed to fetch exam schedule');
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (examIds) => {
    try {
      const apiBase = window.config?.api_base_url || window.config?.login_url?.replace('/login', '') || 'http://localhost:8080/api';
      const response = await fetch(`${apiBase}/student/exams/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader()
        },
        body: JSON.stringify({ exam_ids: examIds }) // Sending array of IDs
      });

      if (response.ok) {
        toast.success('Registration successful!');
        fetchExams(); // Refresh list
      } else {
        const data = await response.json();
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Network error');
    }
  };

  // Group exams by series
  const examGroups = React.useMemo(() => {
    const groups = {};
    exams.forEach(exam => {
      const key = `${exam.exam_name}_${exam.semester_id}`;
      if (!groups[key]) {
        groups[key] = {
          exam_name: exam.exam_name,
          semester_name: exam.semester_name,
          subjects: [],
          allRegistered: true,
          ids: []
        };
      }
      groups[key].subjects.push(exam);
      groups[key].ids.push(exam.id);
      if (exam.payment_status !== 'Paid') {
        groups[key].allRegistered = false;
      }
    });
    return Object.values(groups);
  }, [exams]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Exam Schedule</h1>
          <p className="text-slate-500 font-medium">View and register for your upcoming examinations</p>
        </div>
        <div className="bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100 flex items-center gap-2 text-sky-700 font-bold text-sm">
          <Calendar size={18} />
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {examGroups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Exams Scheduled</h3>
          <p className="text-slate-500">There are no exams currently open for registration in your program.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {examGroups.map((group, gIdx) => (
            <div key={gIdx} className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
              <div className="bg-slate-900 p-6 flex justify-between items-center">
                <div>
                   <h2 className="text-white text-lg font-black tracking-tight">{group.exam_name}</h2>
                   <p className="text-sky-400 text-xs font-bold uppercase tracking-widest">{group.semester_name}</p>
                </div>
                {group.allRegistered ? (
                   <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest border border-emerald-500/20">
                     <CheckCircle size={14} />
                     Registered
                   </div>
                ) : (
                  <button
                    onClick={() => handleRegister(group.ids)}
                    className="group relative overflow-hidden bg-white text-slate-900 px-8 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:shadow-sky-500/20 active:scale-[0.98] transition-all flex items-center gap-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="relative flex items-center gap-2">
                      <CreditCard size={14} className="text-sky-500" />
                      Pay Now (Full Series)
                    </span>
                  </button>
                )}
              </div>
              
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 w-48">Date & Day</th>
                    <th className="px-4 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Subject & Details</th>
                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.subjects.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-base font-black text-slate-900">
                            {new Date(exam.exam_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </span>
                          <span className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                            {new Date(exam.exam_date).toLocaleDateString('en-GB', { weekday: 'long' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <BookOpen size={18} />
                          </div>
                          <div>
                            <span className="text-base font-bold text-slate-900 block leading-tight">
                              {exam.subject_name}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 block">
                              Code: {exam.subject_code || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="inline-flex items-center gap-2 text-slate-600 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-sm">{exam.start_time} - {exam.end_time}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center border-t border-slate-100 pt-8 opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          Generated by Examination Management System • Modern Portal Architecture
        </p>
      </div>
    </div>
  );
};

export default StudentExams;
