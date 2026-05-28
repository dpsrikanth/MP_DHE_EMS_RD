import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Building2, Users, AlertCircle, Loader2, Save, 
  ChevronLeft, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { toast } from 'react-toastify';
import { facultyApi } from '../../api/facultyApi';

const InvigilationDuty = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  const [duties, setDuties] = useState([]);
  const [selectedDuty, setSelectedDuty] = useState(null); // { exam_id, hall_id, exam_name, hall_name }
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: status }

  useEffect(() => {
    fetchDuties();
  }, []);

  useEffect(() => {
    if (selectedDuty) {
      fetchStudents(selectedDuty.exam_id, selectedDuty.hall_id);
      setIsSaved(false);
    }
  }, [selectedDuty]);

  const fetchDuties = async () => {
    setLoading(true);
    try {
      const data = await facultyApi.getInvigilationDuties();
      setDuties(data || []);
    } catch (error) {
      console.error("Failed to load duties", error);
      toast.error("Failed to load your invigilation duties");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (examId, hallId) => {
    setLoading(true);
    try {
      const response = await facultyApi.getInvigilationHallStudents(examId, hallId);
      // Support both old array format and new { students, attendance_already_saved } format
      const studentList = Array.isArray(response) ? response : (response.students || []);
      const alreadySaved = Array.isArray(response) ? false : (response.attendance_already_saved || false);

      setStudents(studentList);
      
      const initialAttendance = {};
      studentList.forEach(s => {
        initialAttendance[s.student_id] = s.status || 'Present';
      });
      setAttendance(initialAttendance);

      // Auto-disable save button if attendance was already submitted
      if (alreadySaved) {
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Failed to load students", error);
      toast.error("Failed to load hall students");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    setIsSaved(false);
  };

  const handleSaveAttendance = async () => {
    if (!selectedDuty) return;
    
    const attendanceData = Object.keys(attendance).map(studentId => ({
      student_id: studentId,
      status: attendance[studentId]
    }));

    setSaving(true);
    try {
      await facultyApi.saveExternalAttendance({
        exam_id: selectedDuty.exam_id,
        hall_id: selectedDuty.hall_id,
        attendance_data: attendanceData
      });
      toast.success("Attendance saved successfully");
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save attendance", error);
      toast.error(error.response?.data?.error || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {selectedDuty ? (
            <button 
              onClick={() => setSelectedDuty(null)}
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shadow-sm border border-slate-100"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-indigo-400 shadow-2xl">
              <ClipboardCheck size={32} />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none italic">
              {selectedDuty ? selectedDuty.hall_name : 'Invigilation Duties'}
            </h1>
            <p className="text-[12px] text-slate-400 font-black tracking-[0.2em] mt-2 uppercase">
              {selectedDuty 
                ? `${selectedDuty.exam_name} ${selectedDuty.subject_code ? `— ${selectedDuty.subject_code}` : ''} ${selectedDuty.exam_date ? `— ${formatDate(selectedDuty.exam_date)}` : ''}`
                : 'External Exam Attendance'}
            </p>
          </div>
        </div>
        
        {selectedDuty && (
          <button 
            onClick={handleSaveAttendance}
            disabled={saving || isSaved}
            className={`h-12 px-8 text-[12px] font-black tracking-widest rounded-2xl flex items-center gap-2 transition-all ${
              isSaved 
                ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-not-allowed opacity-100' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50'
            }`}
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : isSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
            {isSaved ? 'SAVED' : 'SAVE ATTENDANCE'}
          </button>
        )}
      </div>

      {loading && !selectedDuty && !duties.length ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-indigo-500">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-black tracking-widest text-[13px]">Loading Duties...</p>
        </div>
      ) : !selectedDuty ? (
        // Duties List View
        duties.length === 0 ? (
          <div className="bg-white rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <ClipboardCheck size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">No Duties Assigned</h3>
            <p className="text-slate-400 font-medium">You have not been assigned any invigilation duties for external exams.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {duties.map((duty, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedDuty(duty)}
                className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 hover:border-indigo-100 group flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-indigo-50 rounded-[1.5rem] flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-slate-100">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-[11px] font-black text-slate-600">{duty.allocated_students}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {duty.hall_name}
                </h3>
                <p className="text-sm font-semibold text-slate-500 line-clamp-2">
                  {duty.exam_name}
                </p>
                {duty.subject_code && (
                  <p className="text-xs font-bold text-slate-400 mt-2 flex-grow">
                    {duty.subject_code} - {duty.subject_name}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  {duty.exam_date && (
                    <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                      {formatDate(duty.exam_date)}
                    </span>
                  )}
                  <span className="text-[11px] font-black tracking-widest text-indigo-600 uppercase group-hover:gap-3 flex items-center gap-1 transition-all">
                    Take Attendance <ChevronLeft size={14} className="rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Attendance Marking View
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {loading ? (
             <div className="flex justify-center p-20 text-indigo-500">
                <Loader2 className="w-10 h-10 animate-spin" />
             </div>
          ) : students.length === 0 ? (
             <div className="p-20 text-center text-slate-400 font-bold">
                No students allocated to this hall for the selected exam.
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 tracking-widest uppercase w-48">Roll Number</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 tracking-widest uppercase">Student Name</th>
                    <th className="px-10 py-6 text-[11px] font-black text-slate-400 tracking-widest uppercase text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student) => {
                    const status = attendance[student.student_id];
                    return (
                      <tr key={student.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-5">
                          <span className="text-sm font-black text-slate-900 tracking-tighter">#{student.rollnumber}</span>
                        </td>
                        <td className="px-10 py-5">
                          <p className="font-black text-slate-700 text-sm tracking-tight">{student.student_name}</p>
                        </td>
                        <td className="px-10 py-5">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleStatusChange(student.student_id, 'Present')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all ${
                                status === 'Present' 
                                ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200' 
                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'
                              }`}
                            >
                              <CheckCircle2 size={14} /> PRESENT
                            </button>
                            
                            <button
                              onClick={() => handleStatusChange(student.student_id, 'Absent')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all ${
                                status === 'Absent' 
                                ? 'bg-rose-100 text-rose-700 border-2 border-rose-200' 
                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-rose-200 hover:text-rose-600'
                              }`}
                            >
                              <XCircle size={14} /> ABSENT
                            </button>
                            
                            <button
                              onClick={() => handleStatusChange(student.student_id, 'UFM')}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest transition-all ${
                                status === 'UFM' 
                                ? 'bg-amber-100 text-amber-700 border-2 border-amber-200' 
                                : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-amber-200 hover:text-amber-600'
                              }`}
                            >
                              <AlertTriangle size={14} /> UFM
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvigilationDuty;
