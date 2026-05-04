import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, BookOpen, CreditCard, CheckCircle, AlertCircle, Printer, Search, X } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { studentApi } from '../../api/studentApi';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await studentApi.getExams();
      setExams(data);
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch exam schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (examIds) => {
    try {
      await studentApi.registerExams({ exam_ids: examIds });

      toast.success('Registration successful!');
      fetchExams(); // Refresh list
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Registration failed');
    }
  };

  const filteredExams = useMemo(() => {
    if (!searchQuery.trim()) return exams;
    
    const query = searchQuery.toLowerCase().trim();
    return exams.filter(exam => {
      const sName = (exam.subject_name || "").toLowerCase();
      const sCode = (exam.subject_code || "").toLowerCase();
      const eDate = formatDate(exam.exam_date).toLowerCase();
      
      return sName.includes(query) || sCode.includes(query) || eDate.includes(query);
    });
  }, [exams, searchQuery]);

  // Group exams by series (exam_name + semester + exam_type)
  const examGroups = React.useMemo(() => {
    const groups = {};
    filteredExams.forEach(exam => {
      const key = `${exam.exam_name}_${exam.semester_id}_${exam.exam_type}`;
      if (!groups[key]) {
        groups[key] = {
          exam_name: exam.exam_name,
          semester_name: exam.semester_name,
          exam_type: exam.exam_type,        // 1 = Internal, 2 = External
          subjects: [],
          allRegistered: true,
          ids: []
        };
      }
      groups[key].subjects.push(exam);
      groups[key].ids.push(exam.id);
      if (exam.exam_type !== 1 && exam.payment_status !== 'Paid') {
        groups[key].allRegistered = false;
      }
    });
    return Object.values(groups);
  }, [filteredExams]);

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
        <div className="flex items-center gap-6">
          <div className="w-full md:w-80">
            <TableSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subjects or dates..."
            />
          </div>
          <div className="bg-sky-50 px-4 py-2 rounded-2xl border border-sky-100 flex items-center gap-2 text-sky-700 font-bold text-sm h-12">
            <Calendar size={18} />
            {formatDate(new Date())}
          </div>
        </div>
      </div>

      {examGroups.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {searchQuery ? "No matching exams found" : "No Exams Scheduled"}
          </h3>
          <p className="text-slate-500">
            {searchQuery ? "Try searching with a different keyword." : "There are no exams currently open for registration in your program."}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-xs font-black text-sky-600 hover:text-sky-700 underline uppercase tracking-tighter"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {examGroups.map((group, gIdx) => (
            <div key={gIdx} className="animate-premium-fade" style={{ animationDelay: `${gIdx * 0.1}s` }}>
              {/* Group Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 px-4">
                <div>
                   <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{group.exam_name}</h2>
                   <div className="flex items-center gap-3">
                     <span className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em]">{group.semester_name}</span>
                     <span className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{group.subjects.length} Total Papers</span>
                     {/* Internal exam badge */}
                     {group.exam_type === 1 && (
                       <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 text-[9px] font-black uppercase tracking-widest border border-violet-200">Internal</span>
                     )}
                   </div>
                </div>
                
                {/* Action: Internal = view-only notice | External = Register / Hall Ticket */}
                {group.exam_type === 1 ? (
                  <div className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-violet-50 border border-violet-200 rounded-2xl text-violet-700 font-bold text-xs">
                    <BookOpen size={14} />
                    <span>Timetable View Only — No registration required</span>
                  </div>
                ) : !group.allRegistered ? (
                  <button
                    onClick={() => handleRegister(group.ids)}
                    className="mt-4 md:mt-0 group relative inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CreditCard size={16} className="relative z-10" />
                    <span className="relative z-10">Register for Full Series</span>
                  </button>
                ) : (
                  <button
                    onClick={() => window.open(`/student/hall-ticket/${group.exam_name}/${group.subjects[0].semester_id}`, '_blank')}
                    className="mt-4 md:mt-0 group relative inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Printer size={16} className="relative z-10" />
                    <span className="relative z-10">Download Hall Ticket</span>
                  </button>
                )}
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.subjects.map((exam) => (
                  <div key={exam.id} className="group relative bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                    {/* Status Badge: Internal exams don't have registration */}
                    <div className="absolute top-6 right-6">
                      {group.exam_type === 1 ? (
                        <div className="flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1 rounded-full border border-violet-100 font-black text-[8px] uppercase tracking-widest">
                          <BookOpen size={10} />
                          Internal
                        </div>
                      ) : exam.payment_status === 'Paid' ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-black text-[8px] uppercase tracking-widest">
                          <CheckCircle size={10} />
                          Enrolled
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100 font-black text-[8px] uppercase tracking-widest">
                          <Clock size={10} />
                          Pending
                        </div>
                      )}
                    </div>

                    <div className="mb-8">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner">
                        <BookOpen size={24} />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                        {exam.subject_name}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code: {exam.subject_code || 'N/A'}</p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex flex-col items-center justify-center border border-indigo-100">
                             <span className="text-xs font-black">{new Date(exam.exam_date).getDate()}</span>
                             <span className="text-[7px] font-bold uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Examination Date</p>
                            <p className="text-xs font-bold text-slate-700">{formatDate(exam.exam_date)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                             <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Session Timing</p>
                            <p className="text-xs font-bold text-slate-700">{exam.start_time} - {exam.end_time}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
