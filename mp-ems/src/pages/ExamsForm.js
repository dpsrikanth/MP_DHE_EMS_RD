import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import authUtils from "../utils/authUtils";
import { FileText, Plus, X, Check, Calendar, Book, Layers, Hash, AlertCircle, Globe, Users, BookOpen, Clock, ArrowLeft } from "lucide-react";
import '../styles/FormPage.css';
import { examApi } from '../api/examApi';
import { masterDataApi } from '../api/masterDataApi';


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

  const [formData, setFormData] = useState({
    name: '', semester_id: '', college_id: '', university_id: '',
    exam_type: authUtils.isCollegeAdmin() ? '1' : '',
    department_id: '', program_id: '', academic_year_id: '',
    subjects: [{ id: Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }],
    status: true
  });

  useEffect(() => { fetchDropdownData().then(() => { if (editingId) fetchExamDataToEdit(); }); }, [editingId]);

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
        subjects: series.map(s => ({ id: s.id, subject_id: s.subject_id, exam_date: s.exam_date ? new Date(s.exam_date).toISOString().split('T')[0] : '', start_time: s.start_time || '', end_time: s.end_time || '' }))
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
                    <button type="button"
                      onClick={() => setFormData({ ...formData, subjects: [...formData.subjects, { id: 'new-' + Date.now(), subject_id: '', exam_date: '', start_time: '', end_time: '' }] })}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 text-indigo-600 font-black rounded-2xl hover:bg-indigo-50 hover:border-indigo-100 transition-all text-[11px]  tracking-widest shadow-sm">
                      <Plus size={16} /> Add Subject Row
                    </button>
                  </div>

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
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="form-field lg:col-span-2">
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
                                return subjects.filter(s => all.has(s.id));
                              })().map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                          </div>
                          
                          <div className="form-field">
                            <label className="form-label form-label--required">Exam Date</label>
                            <div className="form-input-wrap">
                              <Calendar size={16} className="form-input-wrap__icon" />
                              <input required type="date" value={sub.exam_date}
                                onChange={(e) => { const ns = [...formData.subjects]; ns[index].exam_date = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                                className="form-input form-input--with-icon" />
                            </div>
                          </div>

                          <div className="form-field">
                             <div className="grid grid-cols-2 gap-2">
                                <div>
                                   <label className="form-label">Start</label>
                                   <input type="text" placeholder="09:00 AM" value={sub.start_time}
                                      onChange={(e) => { const ns = [...formData.subjects]; ns[index].start_time = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                                      className="form-input px-3" style={{ fontSize: '0.75rem' }} />
                                </div>
                                <div>
                                   <label className="form-label">End</label>
                                   <input type="text" placeholder="12:00 PM" value={sub.end_time}
                                      onChange={(e) => { const ns = [...formData.subjects]; ns[index].end_time = e.target.value; setFormData({ ...formData, subjects: ns }); }}
                                      className="form-input px-3" style={{ fontSize: '0.75rem' }} />
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
