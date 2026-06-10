import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, Building2, UserPlus, CheckCircle2, Trash2, Loader2, AlertCircle, ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { collegeAdminApi } from '../../api/collegeAdminApi';
import { milestoneApi } from '../../api/milestoneApi';
import { formatDate } from '../../utils/dateUtils';

const InvigilatorAssignment = () => {
  const [loadingExams, setLoadingExams]     = useState(true);
  const [loadingHalls, setLoadingHalls]     = useState(false);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [saving, setSaving]                 = useState(false);

  const [exams, setExams]           = useState([]);
  const [subjects, setSubjects]           = useState([]);
  const [halls, setHalls]           = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [assignments, setAssignments] = useState([]); // { exam_id, hall_id, faculty_user_id, name }

  const [selectedExamId,     setSelectedExamId]     = useState('');
  const [selectedSpecificExamId, setSelectedSpecificExamId] = useState('');
  const [selectedHallId,     setSelectedHallId]     = useState('');
  const [selectedFacultyId,  setSelectedFacultyId]  = useState('');

  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [milestones, setMilestones] = useState([]);
  const [isValidationEnabled, setIsValidationEnabled] = useState(true);

  // ── Load external exams and milestones on mount ──────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingExams(true);
      try {
        const [examsData, valData, milestonesData] = await Promise.all([
          collegeAdminApi.getExternalExams(),
          milestoneApi.getValidationSetting(),
          milestoneApi.getMilestones({})
        ]);
        setExams(examsData || []);
        setIsValidationEnabled(valData?.enabled ?? true);
        setMilestones(Array.isArray(milestonesData) ? milestonesData : []);
      } catch {
        toast.error('Failed to load initial data');
      } finally {
        setLoadingExams(false);
      }
    };
    load();
  }, []);

  // ── Load subjects when exam changes ──────────────────────────────────────
  useEffect(() => {
    if (!selectedExamId) {
      setSubjects([]);
      setSelectedSpecificExamId('');
      return;
    }
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setSelectedSpecificExamId('');
      try {
        const data = await collegeAdminApi.getExternalExamSubjects(selectedExamId);
        setSubjects(data || []);
      } catch {
        toast.error('Failed to load subjects for this exam');
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [selectedExamId]);

  // ── Load halls when specific subject exam changes ────────────────────────
  useEffect(() => {
    if (!selectedSpecificExamId) {
      setHalls([]);
      setSelectedHallId('');
      setAssignments([]);
      return;
    }
    const load = async () => {
      setLoadingHalls(true);
      setSelectedHallId('');
      try {
        const data = await collegeAdminApi.getExternalAttendanceHalls(selectedSpecificExamId);
        setHalls(data || []);
        // Build existing assignment list for the chosen specific exam
        const list = [];
        (data || []).forEach(hall => {
          (hall.invigilators || []).filter(Boolean).forEach(inv => {
            list.push({ exam_id: selectedSpecificExamId, hall_id: hall.hall_id, hall_name: hall.hall_name, faculty_user_id: inv.user_id, name: inv.name });
          });
        });
        setAssignments(list);
      } catch {
        toast.error('Failed to load halls');
      } finally {
        setLoadingHalls(false);
      }
    };
    load();
  }, [selectedSpecificExamId]);

  // ── Load faculty list once ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingFaculty(true);
      try {
        const data = await collegeAdminApi.getCollegeFaculty();
        setFacultyList(data || []);
      } catch {
        toast.error('Failed to load faculty list');
      } finally {
        setLoadingFaculty(false);
      }
    };
    load();
  }, []);

  // ── Assign handler ───────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedSpecificExamId || !selectedHallId || !selectedFacultyId) {
      toast.warning('Please select an exam, subject, hall and teacher first.');
      return;
    }

    const existingForHall = assignments.filter(a => a.hall_id.toString() === selectedHallId);
    
    if (existingForHall.length > 0) {
      toast.warning('An invigilator is already assigned to this hall for this subject. Please remove them first if you wish to change.');
      return;
    }

    setSaving(true);
    try {
      await collegeAdminApi.assignInvigilators({
        exam_id: parseInt(selectedSpecificExamId),
        hall_id: parseInt(selectedHallId),
        faculty_user_ids: [selectedFacultyId]
      });

      const faculty = facultyList.find(f => f.id.toString() === selectedFacultyId);
      const hall    = halls.find(h => h.hall_id.toString() === selectedHallId);
      setAssignments(prev => [...prev, {
        exam_id: selectedSpecificExamId,
        hall_id: parseInt(selectedHallId),
        hall_name: hall?.hall_name || selectedHallId,
        faculty_user_id: parseInt(selectedFacultyId),
        name: faculty?.name || 'Unknown'
      }]);
      setSelectedFacultyId('');
      toast.success('Invigilator assigned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign invigilator');
    } finally {
      setSaving(false);
    }
  };

  // ── Remove handler ───────────────────────────────────────────────────────
  const handleRemove = async (hallId, facultyUserId) => {
    setSaving(true);
    try {
      const remaining = assignments
        .filter(a => a.hall_id === hallId && a.faculty_user_id !== facultyUserId)
        .map(a => a.faculty_user_id.toString());

      await collegeAdminApi.assignInvigilators({
        exam_id: parseInt(selectedSpecificExamId),
        hall_id: hallId,
        faculty_user_ids: remaining
      });
      setAssignments(prev => prev.filter(a => !(a.hall_id === hallId && a.faculty_user_id === facultyUserId)));
      toast.success('Invigilator removed.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove invigilator');
    } finally {
      setSaving(false);
    }
  };

  // ── Grouped assignments for display ─────────────────────────────────────
  const groupedByHall = assignments.reduce((acc, a) => {
    const key = a.hall_id;
    if (!acc[key]) acc[key] = { hall_name: a.hall_name, hall_id: a.hall_id, faculty: [] };
    acc[key].faculty.push({ id: a.faculty_user_id, name: a.name });
    return acc;
  }, {});

  const selectedExam = exams.find(e => e.id.toString() === selectedExamId);
  const selectedSubject = subjects.find(s => s.specific_exam_id.toString() === selectedSpecificExamId);

  const getInvigilatorMilestone = () => {
    if (!Array.isArray(milestones) || milestones.length === 0) return null;
    
    let matches = milestones;
    if (selectedExam) {
      if (selectedExam.semester_id) matches = matches.filter(m => !m.semester_id || parseInt(m.semester_id) === parseInt(selectedExam.semester_id));
      if (selectedExam.program_id) matches = matches.filter(m => !m.program_id || parseInt(m.program_id) === parseInt(selectedExam.program_id));
      if (selectedExam.academic_year_id) matches = matches.filter(m => !m.academic_year_id || parseInt(m.academic_year_id) === parseInt(selectedExam.academic_year_id));
    }
    
    const today = new Date();
    const namedMatches = matches.filter(m => {
        const n = m.name.toUpperCase();
        return n.includes("ASSIGN INVIGILATOR") || n.includes("INVIGILATOR ASSIGNMENT");
    });

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
        const startDate = new Date(bestMatch.start_date);
        const endDate = new Date(bestMatch.end_date);
        endDate.setHours(23, 59, 59, 999);
        return {
            startFull: bestMatch.start_date,
            endFull: bestMatch.end_date,
            name: bestMatch.name,
            isActive: today >= startDate && today <= endDate
        };
    }
    return null;
  };

  const invigMilestone = getInvigilatorMilestone();

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">

      {/* ── Header ── */}
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
          <UserPlus size={26} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Invigilator Assignment</h1>
          <p className="text-sm text-slate-500 font-semibold mt-0.5">Assign teachers to exam halls as invigilators per subject</p>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
        <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Step 1 — Select Exam, Subject, Hall &amp; Teacher</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

          {/* Exam */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 tracking-widest uppercase">
              <BookOpen size={12} className="inline mr-1" />Exam
            </label>
            {loadingExams ? (
              <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">-- Select Exam --</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.exam_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 tracking-widest uppercase">
              <BookOpen size={12} className="inline mr-1" />Subject
            </label>
            {loadingSubjects ? (
              <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedSpecificExamId}
                onChange={e => setSelectedSpecificExamId(e.target.value)}
                disabled={!selectedExamId}
                className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Subject --</option>
                {subjects.map(sub => (
                  <option key={sub.specific_exam_id} value={sub.specific_exam_id}>
                    {sub.subject_code} - {sub.subject_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Hall */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 tracking-widest uppercase">
              <Building2 size={12} className="inline mr-1" />Hall
            </label>
            {loadingHalls ? (
              <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedHallId}
                onChange={e => setSelectedHallId(e.target.value)}
                disabled={!selectedSpecificExamId}
                className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Hall --</option>
                {halls.map(hall => (
                  <option key={hall.hall_id} value={hall.hall_id}>
                    {hall.hall_name} ({hall.allocated_students} students)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Teacher */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-500 tracking-widest uppercase">
              <Users size={12} className="inline mr-1" />Teacher
            </label>
            {loadingFaculty ? (
              <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ) : (
              <select
                value={selectedFacultyId}
                onChange={e => setSelectedFacultyId(e.target.value)}
                disabled={!selectedHallId}
                className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">-- Select Teacher --</option>
                {facultyList.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          {isValidationEnabled && invigMilestone && !invigMilestone.isActive ? (
            <div className="flex flex-col items-end gap-1.5">
              <button
                disabled
                className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-500 font-black px-8 py-3 rounded-2xl shadow-sm transition-all text-sm cursor-not-allowed"
              >
                <AlertCircle size={16} />
                Assignment Blocked
              </button>
              <span className="text-[10px] font-black text-slate-500 tracking-wider">
                Available {formatDate(invigMilestone.startFull, true)}
              </span>
            </div>
          ) : (
            <button
              onClick={handleAssign}
              disabled={saving || !selectedSpecificExamId || !selectedHallId || !selectedFacultyId}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black px-8 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Assign Invigilator
            </button>
          )}
        </div>
      </div>

      {/* ── Assignments Table ── */}
      {selectedSpecificExamId && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-indigo-500" />
            <p className="text-xs font-black text-slate-400 tracking-widest uppercase">
              Current Assignments — {selectedExam?.exam_name} ({selectedSubject?.subject_code})            </p>
          </div>

          {loadingHalls ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-50 rounded-xl animate-pulse" />)}
            </div>
          ) : Object.values(groupedByHall).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <AlertCircle size={48} className="mb-4" />
              <p className="font-black text-slate-400 text-lg">No invigilators assigned yet</p>
              <p className="text-sm text-slate-400 mt-1">Use the form above to assign teachers to halls</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(groupedByHall).map(group => (
                <div key={group.hall_id} className="border border-slate-100 rounded-2xl overflow-hidden">
                  {/* Hall header row */}
                  <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 border-b border-slate-100">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <Building2 size={15} className="text-indigo-600" />
                    </div>
                    <span className="font-black text-slate-800 text-sm">{group.hall_name}</span>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-xs font-bold text-slate-500">{group.faculty.length} invigilator{group.faculty.length !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Faculty rows */}
                  {group.faculty.map(fac => (
                    <div key={fac.id} className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black">
                          {fac.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{fac.name}</span>
                      </div>
                      {isValidationEnabled && invigMilestone && !invigMilestone.isActive ? (
                         <span className="text-[10px] font-black text-slate-400 italic">Locked</span>
                      ) : (
                        <button
                          onClick={() => handleRemove(group.hall_id, fac.id)}
                          disabled={saving}
                          className="flex items-center gap-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl text-xs font-black transition-all disabled:opacity-50"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvigilatorAssignment;
