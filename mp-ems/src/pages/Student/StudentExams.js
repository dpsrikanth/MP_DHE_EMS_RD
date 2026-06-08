import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { Calendar, Clock, BookOpen, CreditCard, CheckCircle, AlertCircle, Printer, Search, X } from 'lucide-react';
import authUtils from '../../utils/authUtils';
import { formatDate } from '../../utils/dateUtils';
import { TableSearch } from '../../components/TableControls';
import { studentApi } from '../../api/studentApi';
import { masterDataApi } from '../../api/masterDataApi';
import { milestoneApi } from '../../api/milestoneApi';

const StudentExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(100);
  const [milestones, setMilestones] = useState([]);
  const [isValidationEnabled, setIsValidationEnabled] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const sems = await masterDataApi.getSemesters();
        // Sort semesters numerically by name (Semester 1, Semester 2, etc.)
        const sortedSems = [...sems].sort((a, b) => {
          const numA = parseInt(a.semester_name.match(/\d+/) || 0);
          const numB = parseInt(b.semester_name.match(/\d+/) || 0);
          return numA - numB;
        });
        setAvailableSemesters(sortedSems);
        
        // Try to get student's current semester from user object
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.semister) {
            setSelectedSemester(user.semister);
          }
        }
      } catch (err) {
        console.error('Error initializing semesters:', err);
      }
    };
    init();
    fetchMilestones();
  }, []);

  const fetchMilestones = async () => {
    try {
      const [valData, milestonesData] = await Promise.all([
        milestoneApi.getValidationSetting(),
        milestoneApi.getMilestones({})
      ]);
      setIsValidationEnabled(valData?.enabled ?? true);
      setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
    } catch (err) {
      console.error('Failed to load milestones');
    }
  };

  useEffect(() => {
    fetchExams();
  }, [selectedSemester]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const data = await studentApi.getExams({ semester: selectedSemester });
      setExams(data);

      if (selectedSemester) {
        try {
          const sems = await masterDataApi.getSemesters();
          const semObj = sems.find(s => s.semester_name.toLowerCase() === selectedSemester.toLowerCase() || s.semester_name.toLowerCase().includes(selectedSemester.toLowerCase()));
          if (semObj) {
            const attData = await studentApi.getAttendanceSummary({ semester_id: semObj.id });
            if (attData && attData.length > 0) {
              const avg = attData.reduce((acc, curr) => acc + parseFloat(curr.attendance_percentage), 0) / attData.length;
              setOverallAttendance(avg);
            } else {
              setOverallAttendance(100);
            }
          }
        } catch (attErr) {
          console.error("Error fetching attendance details for registration check:", attErr);
        }
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch exam schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (examIds) => {
    if (isValidationEnabled) {
      const regWindow = getRegistrationMilestone();
      if (regWindow) {
        const today = new Date();
        const startDate = new Date(regWindow.startFull);
        const endDate = new Date(regWindow.endFull);
        if (today < startDate || today > endDate) {
          toast.error(`Validation Error: Registration window is not active. Scheduled from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`);
          return;
        }
      }
    }

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
          seatingLocked: false,
          ids: []
        };
      }
      groups[key].subjects.push(exam);
      groups[key].ids.push(exam.id);
      if (exam.seating_locked) groups[key].seatingLocked = true;
      if (exam.exam_type !== 1 && exam.payment_status !== 'Paid') {
        groups[key].allRegistered = false;
      }
    });
    return Object.values(groups);
  }, [filteredExams]);

  const getRegistrationMilestone = () => {
    if (!Array.isArray(milestones) || milestones.length === 0) return null;
    
    let matches = milestones;
    
    // Find an external exam to extract precise IDs
    const externalExamGroup = examGroups.find(g => g.exam_type !== 1);
    if (externalExamGroup && externalExamGroup.subjects.length > 0) {
      const exam = externalExamGroup.subjects[0];
      if (exam.semester_id) {
        matches = matches.filter(m => !m.semester_id || parseInt(m.semester_id) === parseInt(exam.semester_id));
      }
      if (exam.program_id) {
        matches = matches.filter(m => !m.program_id || parseInt(m.program_id) === parseInt(exam.program_id));
      }
      if (exam.academic_year_id) {
        matches = matches.filter(m => !m.academic_year_id || parseInt(m.academic_year_id) === parseInt(exam.academic_year_id));
      }
    } else if (selectedSemester && availableSemesters.length > 0) {
      const semObj = availableSemesters.find(s => s.semester_name === selectedSemester);
      if (semObj) {
        matches = matches.filter(m => !m.semester_id || parseInt(m.semester_id) === parseInt(semObj.id));
      }
    }
    
    const today = new Date();
    
    // Prioritize "ENROLL" milestones since there are multiple overlapping ones
    let namedMatches = matches.filter(m => m.name.toUpperCase().includes("ENROLL"));
    if (namedMatches.length === 0) {
        namedMatches = matches.filter(m => {
            const name = m.name.toUpperCase();
            return name.includes("REGISTRATION") || name.includes("EXTERNAL EXAM");
        });
    }

    let bestMatch = namedMatches.find(m => new Date(m.start_date) <= today && new Date(m.end_date) >= today);
    
    if (!bestMatch && namedMatches.length > 0) {
        const futureMatches = namedMatches.filter(m => new Date(m.start_date) > today).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        if (futureMatches.length > 0) {
            bestMatch = futureMatches[0];
        } else {
            const pastMatches = namedMatches.sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
            bestMatch = pastMatches[0];
        }
    }

    if (bestMatch) {
        return {
            startFull: bestMatch.start_date,
            endFull: bestMatch.end_date,
            name: bestMatch.name
        };
    }
    return null;
  };

  const regWindow = getRegistrationMilestone();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Exam <span className="text-indigo-600">Schedule</span></h1>
          <p className="text-slate-500 font-bold text-sm tracking-tight italic">View and register for your {selectedSemester || 'current'} examinations</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {availableSemesters.length > 0 && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-[12px] font-black text-slate-400 tracking-widest whitespace-nowrap">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-[13px] font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer transition-all hover:bg-slate-50 min-w-[160px] w-full md:w-auto"
              >
                {availableSemesters.map(sem => (
                  <option key={sem.id} value={sem.semester_name}>{sem.semester_name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="w-full md:w-80">
            <TableSearch 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search subjects or dates..."
            />
          </div>
        </div>
      </div>

      {isValidationEnabled && regWindow && (
          <div className="flex flex-wrap items-center gap-6 px-1 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Clock size={20} />
                  </div>
                  <div>
                      <p className="text-[12px] font-black text-indigo-600 tracking-widest leading-none mb-1 text-left">Registration Window</p>
                      <p className="text-sm font-bold text-indigo-600 leading-none text-left">
                          {formatDate(regWindow.startFull, true)} to {formatDate(regWindow.endFull, true)}
                      </p>
                  </div>
              </div>
          </div>
      )}

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
              className="mt-4 text-[13px] font-black text-indigo-600 hover:text-indigo-700 underline  tracking-tighter"
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
                     <span className="text-indigo-600 text-[12px] font-black  tracking-[0.2em]">{group.semester_name}</span>
                     <span className="w-1 h-1 bg-slate-300 rounded-full" />
                     <span className="text-slate-400 text-[12px] font-black  tracking-widest">{group.subjects.length} Total Papers</span>
                     {/* Internal exam badge */}
                     {group.exam_type === 1 && (
                       <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 text-[9px] font-black  tracking-widest border border-violet-200">Internal</span>
                     )}
                   </div>
                </div>
                
                {/* Action: Internal = view-only notice | External = Register / Hall Ticket */}
                {group.exam_type === 1 ? (
                  <div className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-violet-50 border border-violet-200 rounded-2xl text-violet-700 font-bold text-[13px]">
                    <BookOpen size={14} />
                    <span>Timetable View Only — No registration required</span>
                  </div>
                ) : !group.allRegistered ? (
                  overallAttendance < 75 ? (
                    <div className="flex flex-col items-end gap-1.5 mt-4 md:mt-0">
                      <button
                        disabled
                        className="opacity-50 cursor-not-allowed inline-flex items-center gap-2 px-8 py-3.5 bg-rose-50 border border-rose-200 text-rose-600 font-black rounded-2xl text-[13px] tracking-widest shadow-sm"
                      >
                        <AlertCircle size={16} />
                        <span>Registration Blocked</span>
                      </button>
                      <span className="text-[10px] font-black text-rose-500 tracking-wider">Attendance ({overallAttendance.toFixed(1)}%) is below 75%</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRegister(group.ids)}
                      className="mt-4 md:mt-0 group relative inline-flex items-center gap-3 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-[13px]  tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CreditCard size={16} className="relative z-10" />
                      <span className="relative z-10">Register for Full Series</span>
                    </button>
                  )
                ) : group.seatingLocked ? (
                  <button
                    onClick={() => window.open(`/student/hall-ticket/${group.exam_name}/${group.subjects[0].semester_id}`, '_blank')}
                    className="mt-4 md:mt-0 group relative inline-flex items-center gap-3 bg-emerald-600 text-white px-8 py-3.5 rounded-2xl font-black text-[13px]  tracking-widest shadow-2xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Printer size={16} className="relative z-10" />
                    <span className="relative z-10">Download Hall Ticket</span>
                  </button>
                ) : (
                  <div className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 font-bold text-[13px]">
                    <Clock size={14} />
                    <span>Hall Ticket Pending (Seat Allocation in Progress)</span>
                  </div>
                )}
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.subjects.map((exam) => (
                  <div key={exam.id} className="group relative bg-white rounded-[2rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                    {/* Status Badge: Internal exams don't have registration */}
                    <div className="absolute top-6 right-6">
                      {group.exam_type === 1 ? (
                        <div className="flex items-center gap-1.5 bg-violet-50 text-violet-600 px-3 py-1 rounded-full border border-violet-100 font-black text-[8px]  tracking-widest">
                          <BookOpen size={10} />
                          Internal
                        </div>
                      ) : exam.payment_status === 'Paid' ? (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-black text-[8px]  tracking-widest">
                          <CheckCircle size={10} />
                          Enrolled
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-indigo- text-indigo- px-3 py-1 rounded-full border border-amber-100 font-black text-[8px]  tracking-widest">
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
                      <p className="text-[12px] font-black text-slate-400  tracking-widest">Code: {exam.subject_code || 'N/A'}</p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex flex-col items-center justify-center border border-indigo-100">
                             <span className="text-[13px] font-black">{new Date(exam.exam_date).getDate()}</span>
                             <span className="text-[7px] font-bold ">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-0.5">Examination Date</p>
                            <p className="text-[13px] font-bold text-slate-700">{formatDate(exam.exam_date)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-100">
                             <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[12px] font-black text-slate-400  tracking-widest mb-0.5">Session Timing</p>
                            <p className="text-[13px] font-bold text-slate-700">{exam.start_time} - {exam.end_time}</p>
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
        <p className="text-[12px] font-black  tracking-[0.2em] text-slate-500">
          Generated by Examination Management System • Modern Portal Architecture
        </p>
      </div>
    </div>
  );
};

export default StudentExams;
