import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  BookOpen, 
  Info,
  Layers,
  Globe,
  Plus,
  Flag,
  User,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import { formatDate } from '../utils/dateUtils';
import { examApi } from '../api/examApi';

const InternalCalendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exams, setExams] = useState([]);
  const [internalSchedules, setInternalSchedules] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [examsData, milestonesData, internalData] = await Promise.all([
        examApi.getExams(),
        examApi.getMilestones(),
        examApi.getInternalSchedules()
      ]);

      if (examsData) {
        setExams(Array.isArray(examsData) ? examsData.filter(e => e.exam_type === 1) : []);
      }
      
      if (milestonesData) {
        setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
      }

      if (internalData) {
        setInternalSchedules(Array.isArray(internalData) ? internalData : []);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar Logic
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const numDays = daysInMonth(month, year);
    const firstDay = firstDayOfMonth(month, year);
    
    const days = [];
    
    // Padding for previous month
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevMonthDaysCount = daysInMonth(prevMonth, prevYear);
    
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDaysCount - i, month: prevMonth, year: prevYear, currentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= numDays; i++) {
       const cellDate = new Date(year, month, i);
       
       // Find exams on this day
       const dayExams = exams.filter(e => {
         const examDate = new Date(e.exam_date);
         return examDate.getFullYear() === year && 
                examDate.getMonth() === month && 
                examDate.getDate() === i;
       });

       const dayInternal = internalSchedules.filter(s => {
         const examDate = new Date(s.exam_date);
         return examDate.getFullYear() === year && 
                examDate.getMonth() === month && 
                examDate.getDate() === i;
       });

       // Find milestones active on this day
       const dayMilestones = milestones.filter(m => {
         const start = new Date(m.start_date);
         const end = new Date(m.end_date);
         // Reset time to 00:00 for comparison
         start.setHours(0,0,0,0);
         end.setHours(23,59,59,999);
         return cellDate >= start && cellDate <= end;
       });

       days.push({ 
         day: i, 
         month, 
         year, 
         currentMonth: true, 
         exams: dayExams,
         milestones: dayMilestones,
         isToday: formatDate(new Date()) === formatDate(cellDate)
       });
    }
    
    // Padding for next month
    const remainingSlots = 42 - days.length;
    const nextYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, month: nextMonth, year: nextYear, currentMonth: false });
    }
    
    return days;
  }, [currentDate, exams, milestones]);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleDayClick = (dayData) => {
    if ((dayData.exams && dayData.exams.length > 0) || 
        (dayData.internalExams && dayData.internalExams.length > 0) ||
        (dayData.milestones && dayData.milestones.length > 0)) {
      setSelectedDayEvents(dayData);
    } else {
      setSelectedDayEvents(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 shadow-sm border border-sky-100">
            <CalendarIcon size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Academic<span className="text-sky-500 not-italic ml-2">Calendar</span></h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Institutional Roadmap & Exam Schedules</p>
          </div>
        </div>

        <div className="flex items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={prevMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-sky-500">
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 text-center min-w-[200px]">
            <span className="text-lg font-black text-slate-800 uppercase tracking-widest">{monthNames[currentDate.getMonth()]}</span>
            <span className="text-lg font-bold text-sky-500 ml-2">{currentDate.getFullYear()}</span>
          </div>
          <button onClick={nextMonth} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 hover:text-sky-500">
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Calendar Grid */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{d}</div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[140px] p-2 border-r border-b border-slate-100 transition-all cursor-pointer group relative overflow-y-hidden
                    ${!day.currentMonth ? 'bg-slate-50/30' : 'bg-white hover:bg-sky-50/30'}
                    ${day.isToday ? 'bg-sky-50/50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-colors
                      ${!day.currentMonth ? 'text-slate-200' : 'text-slate-600 group-hover:text-sky-600'}
                      ${day.isToday ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30' : ''}`}>
                      {day.day}
                    </span>
                    {(day.exams?.length > 0 || day.internalExams?.length > 0 || day.milestones?.length > 0) && (
                       <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse mt-3 mr-2" />
                    )}
                  </div>

                  <div className="space-y-1">
                    {/* Render Milestones as bars */}
                    {day.milestones && day.milestones.slice(0, 2).map((m, mIdx) => (
                      <div key={mIdx} className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase truncate border 
                        ${m.type === 'Internal' ? 'bg-sky-500 text-white border-sky-600' : 
                          m.type === 'External' ? 'bg-amber-500 text-white border-amber-600' : 
                          'bg-indigo-600 text-white border-indigo-700'}`}>
                        {m.name}
                      </div>
                    ))}
                    
                    {/* Render University Exams */}
                    {day.exams && day.exams.slice(0, 2).map((exam, eIdx) => (
                      <div key={eIdx} className="px-2 py-0.5 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-wider truncate shadow-sm">
                        {exam.subject_name}
                      </div>
                    ))}

                    {/* Render Internal Exams */}
                    {day.internalExams && day.internalExams.slice(0, 1).map((s, sIdx) => (
                      <div key={sIdx} className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase tracking-wider truncate shadow-sm">
                        {s.subject_name} (INT)
                      </div>
                    ))}
                    
                    {(day.exams?.length + day.internalExams?.length + day.milestones?.length > 4) && (
                      <div className="text-[7px] font-black text-slate-400 pl-2 uppercase tracking-widest">
                        + {day.exams.length + day.internalExams.length + day.milestones.length - 4} More
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info & Side Panel */}
        <div className="space-y-6">
          {selectedDayEvents ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl p-6 animate-in slide-in-from-right-8 duration-500 bg-gradient-to-br from-white to-sky-50/30">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                  <Info size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Day Details</h3>
                    {formatDate(new Date(selectedDayEvents.year, selectedDayEvents.month, selectedDayEvents.day))}
                </div>
              </div>

              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-sky-200">
                {/* Milestones in Detail */}
                {selectedDayEvents.milestones?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Milestones</p>
                    {selectedDayEvents.milestones.map((m, idx) => (
                      <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border 
                             ${m.type === 'Internal' ? 'bg-sky-50 text-sky-600 border-sky-100' : 
                               m.type === 'External' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'} uppercase`}>
                             {m.type}
                           </span>
                           <Flag size={14} className="text-slate-300" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-3">{m.name}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                            <div className="w-5 h-5 bg-slate-50 rounded-lg flex items-center justify-center text-indigo-500">
                              <User size={12} />
                            </div>
                            <span> {m.responsibility}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Internal Exams in Detail */}
                {selectedDayEvents.internalExams?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Assessments</p>
                    {selectedDayEvents.internalExams.map((s, idx) => (
                      <div key={idx} className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                          <BookOpen size={48} />
                        </div>
                        <div className="relative z-10">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="w-5 h-5 bg-emerald-600 rounded-md flex items-center justify-center text-white">
                               <CalendarIcon size={12} />
                             </div>
                             <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">Scheduled</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900 mb-2">{s.subject_name}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase">
                             <div className="flex items-center gap-1">
                               <Clock size={12} className="text-emerald-600" />
                               <span>{s.start_time} - {s.end_time}</span>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* University Exams in Detail */}
                {selectedDayEvents.exams?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Scheduled Exams</p>
                    {selectedDayEvents.exams.map((exam, idx) => (
                      <div key={idx} className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm group">
                        <h4 className="text-sm font-black mb-3">{exam.subject_name}</h4>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                             <Clock size={12} className="text-sky-400" />
                             <span>{exam.start_time} - {exam.end_time}</span>
                           </div>
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                             <Layers size={12} className="text-sky-400" />
                             <span>{exam.exam_name}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setSelectedDayEvents(null)}
                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
              >
                Close Panel
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20 group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/20 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100" />
              
              <div className="relative z-10">
                <Globe className="text-sky-400 mb-6" size={32} />
                <h3 className="text-xl font-black mb-4 tracking-tight leading-tight italic uppercase">Institutional<br/>Roadmap</h3>
                <p className="text-slate-400 text-[10px] leading-relaxed font-medium mb-8">
                  Visualize the high-level academic cycle including marks entry windows, commencement dates, and final assessment timelines.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                      <Flag size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Active Milestones</p>
                      <p className="text-sm font-bold text-white">{milestones.length} Events</p>
                    </div>
                  </div>

                  {authUtils.isUniversityAdmin() && (
                    <button 
                      onClick={() => navigate('/milestones')}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-sky-500/20"
                    >
                      <Plus size={18} />
                      Manage Roadmap
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Legend */}
          {!selectedDayEvents && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Color Legend</h4>
              <div className="space-y-3 text-[9px] font-black uppercase tracking-wide">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                  <span className="text-slate-600">General Milestone</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-sky-500 rounded-full" />
                  <span className="text-slate-600">Internal Process</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-slate-600">External Timeline</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-slate-900 rounded-full" />
                  <span className="text-slate-600">Specific Exams</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InternalCalendar;
