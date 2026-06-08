import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import authUtils from "../utils/authUtils";
import { FileText, Plus, X, Check, Calendar, Book, Layers, Hash, AlertCircle, Globe, Users, BookOpen, Clock, ArrowLeft, Flag } from "lucide-react";
import '../styles/FormPage.css';
import { examApi } from '../api/examApi';
import { masterDataApi } from '../api/masterDataApi';
import { milestoneApi } from '../api/milestoneApi';


const ExamsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? parseInt(id) : null;

  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [colleges, setColleges] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectMappings, setSubjectMappings] = useState([]);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [activeExternalMilestone, setActiveExternalMilestone] = useState(null);
  const [schedulingExternalMilestone, setSchedulingExternalMilestone] = useState(null);
  const [isValidationEnabled, setIsValidationEnabled] = useState(true);

  const [formData, setFormData] = useState({
    name: '', semester_id: '', college_id: '', university_id: '',
    exam_type: authUtils.isCollegeAdmin() ? '1' : '',
    department_id: '', program_id: '', academic_year_id: '',
    subjects: [{ id: Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }],
    status: true
  });

  useEffect(() => { fetchDropdownData().then(() => { if (editingId) fetchExamDataToEdit(); }); }, [editingId]);

  useEffect(() => {
    const fetchValidation = async () => {
      try {
        const data = await milestoneApi.getValidationSetting();
        setIsValidationEnabled(data.enabled);
      } catch (err) {
        console.error("Failed to fetch roadmap validation setting:", err);
      }
    };
    fetchValidation();
  }, []);

  useEffect(() => {
    const fetchRoadmapMilestone = async () => {
      const { exam_type, semester_id, program_id, academic_year_id, college_id } = formData;
      if (Number(exam_type) !== 2 || !semester_id || !program_id || !academic_year_id) {
        setActiveExternalMilestone(null);
        setSchedulingExternalMilestone(null);
        return;
      }

      try {
        const params = {
          semester_id,
          program_id,
          academic_year_id,
        };
        const resolvedCollegeId = college_id === 'university_wide' ? '' : college_id;
        if (resolvedCollegeId) {
          params.college_id = resolvedCollegeId;
        }

        const data = await milestoneApi.getMilestones(params);
        if (Array.isArray(data)) {
          // Filter to match the External Exam milestone
          const matched = data.filter(m => {
            const mName = m.name.toUpperCase();
            return mName.includes("EXTERNAL") &&
                   mName.includes("EXAM") &&
                   !mName.includes("REGISTRATION") &&
                   !mName.includes("FACULTY") &&
                   !mName.includes("ENROLL");
          });

          // Sort: prefer program_id matching program_id, then college_id matching college_id
          const selected = matched.sort((a, b) => {
            if (a.program_id === parseInt(program_id) && b.program_id !== parseInt(program_id)) return -1;
            if (a.program_id !== parseInt(program_id) && b.program_id === parseInt(program_id)) return 1;
            if (a.college_id === parseInt(resolvedCollegeId) && b.college_id !== parseInt(resolvedCollegeId)) return -1;
            if (a.college_id !== parseInt(resolvedCollegeId) && b.college_id === parseInt(resolvedCollegeId)) return 1;
            return 0;
          })[0] || null;

          setActiveExternalMilestone(selected);

          // Filter to match the External Exam scheduling window (Registration / Schedule / Assignment)
          const matchedSched = data.filter(m => {
            const mName = m.name.toUpperCase();
            return mName.includes("EXTERNAL") &&
                   (mName.includes("REGISTRATION") || mName.includes("SCHEDULE") || mName.includes("ASSIGNMENT"));
          });

          const selectedSched = matchedSched.sort((a, b) => {
            const aName = a.name.toUpperCase();
            const bName = b.name.toUpperCase();
            if (aName.includes("REGISTRATION") && !bName.includes("REGISTRATION")) return -1;
            if (!aName.includes("REGISTRATION") && bName.includes("REGISTRATION")) return 1;
            if (aName.includes("SCHEDULE") && !bName.includes("SCHEDULE")) return -1;
            if (!aName.includes("SCHEDULE") && bName.includes("SCHEDULE")) return 1;
            if (a.program_id === parseInt(program_id) && b.program_id !== parseInt(program_id)) return -1;
            if (a.program_id !== parseInt(program_id) && b.program_id === parseInt(program_id)) return 1;
            return 0;
          })[0] || null;

          setSchedulingExternalMilestone(selectedSched);
        }
      } catch (err) {
        console.error("Failed to fetch roadmap milestone:", err);
        setActiveExternalMilestone(null);
        setSchedulingExternalMilestone(null);
      }
    };

    fetchRoadmapMilestone();
  }, [formData.exam_type, formData.semester_id, formData.program_id, formData.academic_year_id, formData.college_id]);

  const formatDateString = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchDropdownData = async () => {
    try {
      const [colData, uniData, semData, typeData, depData, progData, yearData, subData, mapData] = await Promise.all([
        masterDataApi.getColleges(),
        masterDataApi.getUniversities(),
        masterDataApi.getSemesters(),
        examApi.getExamTypes(),
        masterDataApi.getDepartments(),
        masterDataApi.getPrograms(),
        masterDataApi.getAcademicYears(),
        masterDataApi.getSubjects(),
        masterDataApi.getSubjectMappings()
      ]);
      setColleges(colData);
      setUniversities(uniData);
      setSemesters(semData.sort((a, b) => {
        const numA = parseInt(a.semester_name?.match(/\d+/)?.[0]) || 0;
        const numB = parseInt(b.semester_name?.match(/\d+/)?.[0]) || 0;
        return numA - numB;
      }));
      setExamTypes(typeData);
      setDepartments(depData);
      setPrograms(progData);
      setAcademicYears(yearData);
      setSubjects(subData);
      setSubjectMappings(mapData);
    } catch (err) { console.error("Failed to fetch dropdown data:", err); }
  };

  const fetchExamDataToEdit = async () => {
    try {
      const data = await examApi.getExams();
      const exam = data.find(e => e.id === editingId);
      if (!exam) throw new Error("Exam not found");
      const series = data.filter(item => item.exam_name === exam.exam_name && item.semester_id === exam.semester_id && (item.college_id === exam.college_id || (!item.college_id && !exam.college_id)) && item.exam_type === exam.exam_type && item.program_id === exam.program_id && item.academic_year_id === exam.academic_year_id);
      setFormData({
        name: exam.exam_name || '', semester_id: exam.semester_id || '', college_id: exam.college_id || 'university_wide',
        exam_type: exam.exam_type || '', department_id: exam.department_id || '', program_id: exam.program_id || '',
        academic_year_id: exam.academic_year_id || '', status: exam.status,
        subjects: series.map(s => {
          const d = s.exam_date ? new Date(s.exam_date) : null;
          const dateStr = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '';
          return {
            id: s.id,
            subject_id: s.subject_id,
            exam_date: dateStr,
            start_time: s.start_time || '',
            end_time: s.end_time || ''
          };
        }).sort((a, b) => {
          if (!a.exam_date) return 1;
          if (!b.exam_date) return -1;
          return a.exam_date.localeCompare(b.exam_date);
        })
      });
    } catch (err) { toast.error(err.message); navigate('/exams'); } finally { setLoading(false); }
  };

  const fetchComponents = async (context) => {
    const { college_id, department_id, program_id, semester_id, subject_id } = context;
    if (!college_id || !department_id || !program_id || !semester_id || !subject_id) { setAvailableComponents([]); if (!editingId) setFormData(prev => ({ ...prev, name: '' })); return; }
    try {
      const components = await examApi.getComponents({ college_id, department_id, program_id, semester_id, subject_id });
      setAvailableComponents(components);
      if (components.length === 1 && !formData.name) setFormData(prev => ({ ...prev, name: components[0] }));
    } catch (err) { setAvailableComponents([]); }
  };

  useEffect(() => { fetchComponents(formData); }, [formData.college_id, formData.department_id, formData.program_id, formData.semester_id, formData.subject_id]);

  const generateExamName = () => {
    const program = programs.find(p => p.id === parseInt(formData.program_id));
    const semester = semesters.find(s => s.id === parseInt(formData.semester_id));
    const examType = examTypes.find(t => t.id === parseInt(formData.exam_type));
    const academicYear = academicYears.find(ay => ay.id === parseInt(formData.academic_year_id));
    const college = colleges.find(c => c.id === parseInt(formData.college_id));
    const university = universities.find(u => u.id === parseInt(formData.university_id));
    const parts = [];
    if (program) parts.push(program.name);
    if (semester) { const semNum = semester.semester_name?.match(/\d+/)?.[0]; parts.push(semNum ? `Sem-${semNum}` : semester.semester_name); }
    if (formData.exam_type == 2 && !formData.college_id) { parts.push(university ? (university.name || 'University') : 'University'); }
    else { parts.push(college ? college.name || college.college_name : 'University'); }
    if (examType) parts.push(examType.type_name);
    parts.push('Exam');
    if (academicYear) parts.push(academicYear.year_name);
    return parts.join(' ');
  };

  useEffect(() => {
    if (editingId) return;
    const generated = generateExamName();
    if (generated && generated !== 'Exam') setFormData(prev => ({ ...prev, name: generated }));
  }, [formData.program_id, formData.semester_id, formData.college_id, formData.university_id, formData.exam_type, formData.academic_year_id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitLoading(true); setError(null);
    try {
      // Validations
      const dates = (formData.subjects || []).map(s => s.exam_date).filter(Boolean);

      // 1. Sunday Validation
      for (const dateStr of dates) {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getDay() === 0) {
          const formatted = `${day}-${month}-${year}`;
          toast.error(`Exams cannot be scheduled on Sundays (${formatted}). Sundays are institutional holidays.`);
          setSubmitLoading(false);
          return;
        }
      }

      // 2. Duplicate Date Validation
      if (new Set(dates).size !== dates.length) {
        toast.error("Duplicate exam dates detected. Each subject must be scheduled on a unique date.");
        setSubmitLoading(false);
        return;
      }

      // 3. Roadmap Validation
      if (Number(formData.exam_type) === 2 && isValidationEnabled) {
        const parseLocalDate = (dateVal) => {
          if (!dateVal) return null;
          if (typeof dateVal === 'string' && dateVal.includes('T')) {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
              return new Date(d.getFullYear(), d.getMonth(), d.getDate());
            }
          }
          const parts = String(dateVal).split('T')[0].split('-');
          if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          }
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
          }
          return null;
        };

        // Validate Scheduling Window (Registration / Scheduling window)
        if (schedulingExternalMilestone) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const sStart = schedulingExternalMilestone.start_date ? parseLocalDate(schedulingExternalMilestone.start_date) : null;
          const sEnd = schedulingExternalMilestone.end_date ? parseLocalDate(schedulingExternalMilestone.end_date) : null;

          if (sStart) sStart.setHours(0, 0, 0, 0);
          if (sEnd) sEnd.setHours(23, 59, 59, 999);

          if (sStart && today < sStart) {
            toast.error("Scheduling for this exam has not started yet. Please wait until the scheduling window opens.");
            setSubmitLoading(false);
            return;
          }
          if (sEnd && today > sEnd) {
            toast.error("Scheduling is closed for this exam. Deadline passed.");
            setSubmitLoading(false);
            return;
          }
        }

        // Validate Allowed Exam Dates
        if (activeExternalMilestone) {
          const mStart = activeExternalMilestone.start_date ? parseLocalDate(activeExternalMilestone.start_date) : null;
          const mEnd = activeExternalMilestone.end_date ? parseLocalDate(activeExternalMilestone.end_date) : null;
          
          if (mStart) mStart.setHours(0, 0, 0, 0);
          if (mEnd) mEnd.setHours(23, 59, 59, 999);

          for (const dateStr of dates) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(12, 0, 0, 0);

            if (mStart && date < mStart) {
              toast.error(`Exam date (${formatDateString(dateStr)}) is scheduled before the Institutional Roadmap start date (${formatDateString(activeExternalMilestone.start_date)}) for External Exams.`);
              setSubmitLoading(false);
              return;
            }
            if (mEnd && date > mEnd) {
              toast.error(`Exam date (${formatDateString(dateStr)}) is scheduled after the Institutional Roadmap deadline (${formatDateString(activeExternalMilestone.end_date)}) for External Exams.`);
              setSubmitLoading(false);
              return;
            }
          }
        }
      }

      const normalizedFormData = { ...formData, college_id: formData.college_id === 'university_wide' ? '' : formData.college_id };
      const payload = editingId ? { ...normalizedFormData } : { ...normalizedFormData, subjects: normalizedFormData.subjects };

      if (editingId) {
        await examApi.updateExam(editingId, payload);
      } else {
        await examApi.createExam(payload);
      }

      toast.success(editingId ? "Assessment updated" : "Exam successfully scheduled");
      navigate('/exams');
    } catch (err) { setError(err.response?.data?.message || err.message); } finally { setSubmitLoading(false); }
  };

  if (loading) return (
    <div className="form-loading"><div className="form-loading__spinner"></div><p className="form-loading__text">Loading Assessment...</p></div>
  );

  const disabledClass = !formData.exam_type ? 'opacity-40 pointer-events-none' : '';

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/exams')} className="form-header__back"><ArrowLeft size={20} /></button>
            <div className="form-header__icon"><FileText size={22} /></div>
            <div className="form-header__text">
              <h2>{editingId ? 'Modify Assessment Series' : 'Initialize Examination Schedule'}</h2>
              <p>{editingId ? 'Update Configurations & Timelines' : 'Define Institutional Assessment Framework'}</p>
            </div>
          </div>
          <div className="form-header__right">
            <div className="flex items-center gap-3">
              <span className="text-[12px] font-black text-slate-400  tracking-[0.2em] bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Assess-X Pro v2
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="form-body">
          {error && (
            <div className="form-error-banner">
              <AlertCircle size={16} className="form-error-banner__icon" />
              <span className="form-error-banner__text">{error}</span>
            </div>
          )}

          <form id="examForm" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

              {/* Left Column: Configuration (4 cols) */}
              <div className="xl:col-span-4 space-y-10">
                <div className="form-section">
                  <div className="form-section__title"><span>Administrative Identity</span></div>
                  <div className="space-y-6">
                    <div className="form-field">
                      <label className="form-label form-label--required">Exam Category</label>
                      <select required disabled={authUtils.isCollegeAdmin()} value={formData.exam_type}
                        onChange={(e) => setFormData({ ...formData, exam_type: e.target.value, college_id: '', university_id: '' })}
                        className="form-select">
                        <option value="" disabled>Select Category</option>
                        {examTypes.map(t => <option key={t.id} value={t.id}>{t.type_name}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label form-label--required">Assessment Designation</label>
                      <div className="form-input-wrap">
                        <input required disabled={!formData.exam_type} type="text" placeholder="Auto-generated designation..."
                          value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`form-input ${!formData.exam_type ? 'opacity-50' : ''}`} style={{ paddingRight: '2.5rem' }} />
                        <button type="button" disabled={!formData.exam_type} title="Regenerate name"
                          onClick={() => { const generated = generateExamName(); if (generated && generated !== 'Exam') setFormData(prev => ({ ...prev, name: generated })); }}
                          style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', width: '1.75rem', height: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: formData.exam_type ? '#eef2ff' : '#f1f5f9', color: formData.exam_type ? '#6366f1' : '#cbd5e1', border: 'none', cursor: formData.exam_type ? 'pointer' : 'not-allowed', fontSize: '0.82rem' }}>
                          ✨
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`form-section ${disabledClass} space-y-6`}>
                  <div className="form-section__title"><span>Academic Context</span></div>

                  {(!authUtils.isCollegeAdmin() && !authUtils.isHOD() && formData.exam_type == 2) ? (
                    <div className="form-field">
                      <label className="form-label form-label--required">Governing University</label>
                      <div className="form-input-wrap">
                        <Globe size={18} className="form-input-wrap__icon" />
                        <select required value={formData.university_id}
                          onChange={(e) => setFormData({ ...formData, university_id: e.target.value, college_id: '' })}
                          className="form-select form-select--with-icon">
                          <option value="" disabled>Select Authority</option>
                          {universities.map(u => <option key={u.id} value={u.id}>🌐 {u.name}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="form-field">
                      <label className="form-label form-label--required">Institutional Placement</label>
                      <select required={formData.exam_type != 2} disabled={authUtils.isCollegeAdmin() || authUtils.isHOD()}
                        value={formData.college_id}
                        onChange={(e) => setFormData({ ...formData, college_id: e.target.value, university_id: '' })}
                        className="form-select" style={{ opacity: (authUtils.isCollegeAdmin() || authUtils.isHOD()) ? 0.6 : 1 }}>
                        <option value="" disabled>Select College</option>
                        {colleges.map(c => <option key={c.id} value={c.id}>{c.name || c.college_name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="form-grid form-grid--2 gap-4">
                    <div className="form-field">
                      <label className="form-label form-label--required">Semester</label>
                      <select required value={formData.semester_id}
                        onChange={(e) => setFormData({ ...formData, semester_id: e.target.value, subject_id: '', name: '' })}
                        className="form-select">
                        <option value="" disabled>Select</option>
                        {semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name || `${s.id}`}</option>)}
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label form-label--required">Cycle</label>
                      <select required value={formData.academic_year_id}
                        onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
                        className="form-select">
                        <option value="" disabled>Year</option>
                        {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.year_name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="form-label form-label--required">Department Control</label>
                    <select required disabled={authUtils.isHOD()} value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value, program_id: '', subject_id: '', name: '' })}
                      className="form-select">
                      <option value="" disabled>Select Department</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.department_name || d.name}</option>)}
                    </select>
                  </div>

                  <div className="form-field">
                    <label className="form-label form-label--required">Academic Program</label>
                    <select required value={formData.program_id} disabled={!formData.department_id}
                      onChange={(e) => setFormData({ ...formData, program_id: e.target.value, subject_id: '', name: '' })}
                      className="form-select">
                      <option value="" disabled>{formData.department_id ? "Select Program" : "Department Required"}</option>
                      {programs.filter(p => p.department_ids && p.department_ids.includes(parseInt(formData.department_id))).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-toggle">
                    <div className="form-toggle__info">
                      <div className={`form-toggle__status ${formData.status ? 'form-toggle__status--active' : 'form-toggle__status--inactive'}`}>
                        {formData.status ? <Check size={14} /> : <X size={14} />}
                      </div>
                      <div>
                        <span className="form-toggle__label">Schedule Status</span>
                        <p style={{ fontSize: '0.68rem', fontWeight: 500, color: '#94a3b8', margin: '2px 0 0' }}>Make assessments active for the system</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                      className={`form-toggle__track ${formData.status ? 'form-toggle__track--on' : 'form-toggle__track--off'}`}>
                      <div className="form-toggle__thumb" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Schedule (8 cols) */}
              <div className="xl:col-span-8 space-y-10">
                <div className={`form-section ${disabledClass}`}>
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600"><Calendar size={20} /></div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900  tracking-tight">Timeline & Subject Mappings</h3>
                        <p className="text-[12px] text-slate-400 font-bold  tracking-widest">Construct the assessment series</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button"
                        onClick={() => {
                          const sorted = [...formData.subjects].sort((a, b) => {
                            if (!a.exam_date) return 1;
                            if (!b.exam_date) return -1;
                            return new Date(a.exam_date) - new Date(b.exam_date);
                          });
                          setFormData({ ...formData, subjects: sorted });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all text-[11px] tracking-widest shadow-sm">
                        Sort Chronologically
                      </button>
                      <button type="button"
                        onClick={() => setFormData({ ...formData, subjects: [...formData.subjects, { id: 'new-' + Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }] })}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all text-[11px]  tracking-widest shadow-sm">
                        <Plus size={16} /> Add Subject Row
                      </button>
                    </div>
                  </div>

                  {formData.exam_type == 2 && activeExternalMilestone && (
                    <div className="mb-8 flex flex-wrap items-center gap-6 p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                          <Flag size={20} />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-400 tracking-widest leading-none mb-1">Active Milestone</p>
                          <p className="text-sm font-black text-slate-900 leading-none">{activeExternalMilestone.name}</p>
                        </div>
                      </div>

                      <div className="h-10 w-px bg-slate-200 hidden md:block" />

                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                          <Calendar size={20} />
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-slate-400 tracking-widest leading-none mb-1">Allowed Exam Dates</p>
                          <p className="text-sm font-black text-indigo-600 leading-none italic font-mono">
                            {formatDateString(activeExternalMilestone.start_date)} to {formatDateString(activeExternalMilestone.end_date)}
                          </p>
                        </div>
                      </div>

                      {schedulingExternalMilestone && (
                        <>
                          <div className="h-10 w-px bg-slate-200 hidden md:block" />
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
                              <Clock size={20} />
                            </div>
                            <div>
                              <p className="text-[12px] font-black text-indigo-600 tracking-widest leading-none mb-1 text-left">Scheduling Window</p>
                              <p className="text-sm font-black text-indigo-600 leading-none italic font-mono text-left">
                                {formatDateString(schedulingExternalMilestone.start_date)} to {formatDateString(schedulingExternalMilestone.end_date)}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-6">
                    {formData.subjects.map((sub, index) => (
                      <div key={sub.id} className="group relative bg-white border-2 border-slate-50 hover:border-indigo-100 rounded-[2rem] p-8 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                        {formData.subjects.length > 1 && (
                          <button type="button"
                            onClick={() => setFormData({ ...formData, subjects: formData.subjects.filter(s => s.id !== sub.id) })}
                            className="absolute -top-3 -right-3 w-10 h-10 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:border-rose-100 hover:rotate-90 transition-all shadow-md">
                            <X size={18} />
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-end">
                          <div className="form-field lg:col-span-4">
                            <label className="form-label form-label--required">Subject Designation</label>
                            <select required value={sub.subject_id}
                              onChange={(e) => { const ns = [...formData.subjects]; ns[index].subject_id = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                              className="form-select bg-slate-50/50">
                              <option value="">Select Managed Subject</option>
                              {(() => {
                                const pId = parseInt(formData.program_id), sId = parseInt(formData.semester_id), dId = parseInt(formData.department_id);
                                if (!formData.program_id || !formData.semester_id) return [];
                                const mIds = subjectMappings.filter(m => m.program_id === pId && m.semester_id === sId).map(m => m.subject_id);
                                const direct = subjects.filter(s => s.program_id === pId && s.semester_id === sId && (!dId || (s.department_ids && Array.isArray(s.department_ids) && s.department_ids.includes(dId))));
                                const all = new Set([...mIds, ...direct.map(s => s.id)]);

                                // Filter out subjects already selected in other rows
                                const selectedInOtherRows = formData.subjects
                                  .filter((_, i) => i !== index)
                                  .map(s => parseInt(s.subject_id))
                                  .filter(id => !isNaN(id));

                                return subjects.filter(s => all.has(s.id) && !selectedInOtherRows.includes(s.id));
                              })().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>

                           <div className="form-field lg:col-span-3">
                            <label className="form-label form-label--required">Exam Date</label>
                            <div 
                              className="form-input-wrap relative cursor-pointer"
                              onClick={(e) => {
                                const input = e.currentTarget.querySelector('input[type="date"]');
                                if (input && typeof input.showPicker === 'function') {
                                  try { input.showPicker(); } catch (err) {}
                                }
                              }}
                            >
                              <Calendar size={16} className="form-input-wrap__icon text-indigo-500 z-30" />
                              <input required
                                type="date"
                                value={sub.exam_date}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value) {
                                    const [year, month, day] = value.split('-').map(Number);
                                    const date = new Date(year, month - 1, day);
                                    if (date.getDay() === 0) {
                                      const formatted = `${day}-${month}-${year}`;
                                      toast.error(`Exams cannot be scheduled on Sundays (${formatted}). Sundays are institutional holidays.`);
                                      return;
                                    }

                                    if (isValidationEnabled && activeExternalMilestone) {
                                      date.setHours(12, 0, 0, 0);
                                      const parseLocalDate = (dateVal) => {
                                        if (!dateVal) return null;
                                        if (typeof dateVal === 'string' && dateVal.includes('T')) {
                                          const d = new Date(dateVal);
                                          if (!isNaN(d.getTime())) {
                                            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                          }
                                        }
                                        const parts = String(dateVal).split('T')[0].split('-');
                                        if (parts.length === 3) {
                                          return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                                        }
                                        const d = new Date(dateVal);
                                        if (!isNaN(d.getTime())) {
                                          return new Date(d.getFullYear(), d.getMonth(), d.getDate());
                                        }
                                        return null;
                                      };

                                      const mStart = activeExternalMilestone.start_date ? parseLocalDate(activeExternalMilestone.start_date) : null;
                                      const mEnd = activeExternalMilestone.end_date ? parseLocalDate(activeExternalMilestone.end_date) : null;
                                      
                                      if (mStart) mStart.setHours(0, 0, 0, 0);
                                      if (mEnd) mEnd.setHours(23, 59, 59, 999);

                                      if (mStart && date < mStart) {
                                        toast.error(`Exam date (${formatDateString(value)}) is scheduled before the Institutional Roadmap start date (${formatDateString(activeExternalMilestone.start_date)}) for External Exams.`);
                                        return;
                                      }
                                      if (mEnd && date > mEnd) {
                                        toast.error(`Exam date (${formatDateString(value)}) is scheduled after the Institutional Roadmap deadline (${formatDateString(activeExternalMilestone.end_date)}) for External Exams.`);
                                        return;
                                      }
                                    }
                                  }
                                  const ns = [...formData.subjects];
                                  ns[index].exam_date = value;
                                  setFormData({ ...formData, subjects: ns });
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                              />
                              <div className="form-input form-input--with-icon flex items-center min-h-[44px] bg-white border border-slate-200 hover:border-indigo-300 rounded-xl transition-all shadow-sm pl-10">
                                <span className={sub.exam_date ? 'text-slate-800 font-bold text-sm' : 'text-slate-400 font-bold text-sm'}>
                                  {sub.exam_date ? (() => {
                                    const [y, m, d] = sub.exam_date.split('-');
                                    return `${d}-${m}-${y}`;
                                  })() : "DD-MM-YYYY"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-5">
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <label className="form-label">Start</label>
                                <input type="time" value={sub.start_time}
                                  onChange={(e) => { const ns = [...formData.subjects]; ns[index].start_time = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                                  className="form-input w-full px-2 py-2" style={{ fontSize: '0.85rem' }} />
                              </div>
                              <div className="flex-1">
                                <label className="form-label">End</label>
                                <input type="time" value={sub.end_time}
                                  onChange={(e) => { const ns = [...formData.subjects]; ns[index].end_time = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                                  className="form-input w-full px-2 py-2" style={{ fontSize: '0.85rem' }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {formData.subjects.length === 0 && (
                    <div className="py-20 text-center border-4 border-dashed border-slate-50 rounded-[3rem]">
                      <p className="text-sm font-black text-slate-300  tracking-widest">No subjects defined in schedule</p>
                    </div>
                  )}
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl transition-all duration-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="relative z-10 flex items-start gap-5">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20 flex-shrink-0">
                      <AlertCircle size={24} className="group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-lg font-black tracking-tight leading-none">Operational Readiness</h4>
                      <p className="text-xs text-indigo-100/70 font-medium leading-relaxed">
                        Finalizing this schedule will push these assessments into academic registries. Ensure all dates and subject-mappings are validated against institutional calendars.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="form-footer">
          <button type="button" onClick={() => navigate('/exams')} className="form-btn-cancel">Discard Changes</button>
          <button type="submit" form="examForm" disabled={submitLoading} className="form-btn-submit">
            {submitLoading ? <div className="form-spinner"></div> : <Check size={20} />}
            <span>{submitLoading ? 'Finalizing...' : (editingId ? 'Modify assessment' : 'Commit Schedule')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamsForm;
