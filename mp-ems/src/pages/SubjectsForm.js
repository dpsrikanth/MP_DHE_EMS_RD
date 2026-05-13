import React, { useState, useEffect } from "react";
import { masterDataApi } from '../api/masterDataApi';
import Select from "react-select";
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { Book, Check, Calendar, Layers, FileCheck, BookOpen, Code, ArrowLeft, X, Hash } from "lucide-react";
import '../styles/FormPage.css';

const SubjectsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorString, setErrorString] = useState('');

  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    name: '', subject_code: '', department_ids: [], program_id: null,
    semester_id: null, teacher_id: null, mapping_type: null, is_mandatory: null,
    has_examination: true, periods_per_week: 6, credit: 4
  });

  const mappingTypes = [
    { value: 'Major 1', label: 'Major 1' }, { value: 'Major 2', label: 'Major 2' },
    { value: 'Major', label: 'Major' }, { value: 'Minor', label: 'Minor' },
    { value: 'Elective', label: 'Elective' }, { value: 'Vocational', label: 'Vocational' },
    { value: 'FC-1', label: 'FC-1' }, { value: 'FC-2', label: 'FC-2' },
    { value: 'FP/Int/Appr', label: 'FP/Int/Appr' }, { value: 'AEC', label: 'AEC' },
    { value: 'SEC', label: 'SEC' }, { value: 'VBC', label: 'VBC' },
    { value: 'English Literature', label: 'English Literature' },
    { value: 'Hindi Literature', label: 'Hindi Literature' },
  ];

  const mandatoryOptions = [
    { value: 'M', label: 'Mandatory (M)' },
    { value: 'E', label: 'Elective (E)' }
  ];

  useEffect(() => { fetchFormData(); }, [id]);

  const fetchFormData = async () => {
    try {
      const [progRes, semRes, teaRes, depRes] = await Promise.all([
        masterDataApi.getPrograms(),
        masterDataApi.getSemesters(),
        masterDataApi.getTeachers(),
        masterDataApi.getDepartments()
      ]);

      let depsData = [], progsData = [], semsData = [], teasData = [];
      if (progRes) progsData = progRes.map(p => ({ value: p.id, label: p.name }));
      if (semRes) semsData = semRes.map(s => ({ value: s.id, label: s.semester_name }));
      if (teaRes) teasData = teaRes.map(t => ({ value: t.id, label: t.name }));
      if (depRes) depsData = depRes.map(d => ({ value: d.id, label: d.department_name }));
      setPrograms(progsData); setSemesters(semsData); setTeachers(teasData); setDepartments(depsData);

      if (!isEditing) {
        setForm(prev => ({ ...prev, mapping_type: mappingTypes[0], is_mandatory: mandatoryOptions[0] }));
      } else {
        await loadSubject(id, { depsData, progsData, semsData, teasData });
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
      if (isEditing) setLoading(false);
    }
  };

  const loadSubject = async (subjectId, masters) => {
    try {
      const item = await masterDataApi.getSubjectById(subjectId);
      
      setForm({
        name: item.name, subject_code: item.subject_code,
        department_ids: masters.depsData.filter(d => item.department_ids?.includes(d.value)) || [],
        program_id: masters.progsData.find(p => p.value === item.program_id) || null,
        semester_id: masters.semsData.find(s => s.value === item.semester_id) || null,
        teacher_id: masters.teasData.find(t => t.value === item.teacher_id) || null,
        mapping_type: mappingTypes.find(m => m.value === item.mapping_type) || mappingTypes[0],
        is_mandatory: mandatoryOptions.find(m => m.value === item.is_mandatory) || mandatoryOptions[0],
        has_examination: item.has_examination,
        periods_per_week: item.periods_per_week || 1,
        credit: item.credit || 0
      });
    } catch (err) {
      toast.error(err.message);
      navigate('/subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.subject_code) {
      setErrorString('Name and Code are required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true); setErrorString('');
    try {
      const payload = {
        ...form,
        department_ids: form.department_ids?.map(d => d.value) || [],
        program_id: form.program_id?.value || null,
        semester_id: form.semester_id?.value || null,
        teacher_id: form.teacher_id?.value || null,
        mapping_type: form.mapping_type?.value || 'Major',
        is_mandatory: form.is_mandatory?.value || 'M',
        credit: form.credit
      };
      
      if (isEditing) {
        await masterDataApi.updateSubject(id, payload);
      } else {
        await masterDataApi.createSubject(payload);
      }
      
      toast.success(isEditing ? 'Subject updated successfully!' : 'Subject added successfully!');
      navigate('/subjects');
    } catch (err) {
      setErrorString(err.response?.data?.message || err.message);
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Subject Details...</p>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/subjects')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <BookOpen size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Edit Subject' : 'New Subject'}</h2>
              <p>Subject Configuration</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {errorString && (
              <div className="form-error-banner">
                <X size={16} className="form-error-banner__icon" />
                <span className="form-error-banner__text">{errorString}</span>
              </div>
            )}

            <div className="form-section">
              <div className="form-section__title"><span>Subject Identity</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label form-label--required">Subject Name</label>
                  <div className="form-input-wrap">
                    <Book size={18} className="form-input-wrap__icon" />
                    <input type="text" placeholder="e.g. Operating Systems" value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label form-label--required">Subject Code</label>
                  <div className="form-input-wrap">
                    <Code size={18} className="form-input-wrap__icon" />
                    <input type="text" placeholder="e.g. CS101" value={form.subject_code} 
                      onChange={(e) => setForm({ ...form, subject_code: e.target.value })} 
                      className="form-input form-input--with-icon" style={{ textTransform: '' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Academic Mapping</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label">Program / Course</label>
                  <Select options={programs} isClearable value={form.program_id} 
                    onChange={(v) => setForm({ ...form, program_id: v })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Program..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Semester</label>
                  <Select options={semesters} isClearable value={form.semester_id} 
                    onChange={(v) => setForm({ ...form, semester_id: v })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Semester..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Departments</label>
                  <Select isMulti options={departments} value={form.department_ids} 
                    onChange={(v) => setForm({ ...form, department_ids: v || [] })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Departments..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Assigned Teacher</label>
                  <Select options={teachers} isClearable value={form.teacher_id} 
                    onChange={(v) => setForm({ ...form, teacher_id: v })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Teacher..." />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Classification & Credits</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label">Requirement</label>
                  <Select options={mandatoryOptions} value={form.is_mandatory} 
                    onChange={(v) => setForm({ ...form, is_mandatory: v })} 
                    className="form-react-select" classNamePrefix="react-select" />
                </div>
                <div className="form-field">
                  <label className="form-label">Mapping Type</label>
                  <Select options={mappingTypes} value={form.mapping_type} 
                    onChange={(v) => setForm({ ...form, mapping_type: v })} 
                    className="form-react-select" classNamePrefix="react-select" />
                </div>
                <div className="form-field">
                  <label className="form-label">Examination</label>
                  <button type="button"
                    onClick={() => setForm({...form, has_examination: !form.has_examination})}
                    className="form-toggle" style={{ justifyContent: 'center', gap: '0.5rem', cursor: 'pointer', borderColor: form.has_examination ? '#c7d2fe' : '#e2e8f0' }}>
                    {form.has_examination ? <FileCheck size={18} style={{ color: '#6366f1' }} /> : <X size={18} style={{ color: '#94a3b8' }} />}
                    <span className="form-toggle__label">{form.has_examination ? 'Required' : 'None'}</span>
                  </button>
                </div>
                <div className="form-field">
                  <label className="form-label">Periods / Week</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <input type="number" value={form.periods_per_week} 
                      onChange={(e) => setForm({...form, periods_per_week: parseInt(e.target.value) || 0})}
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Credits</label>
                  <div className="form-input-wrap">
                    <Layers size={18} className="form-input-wrap__icon" />
                    <input type="number" value={form.credit} 
                      onChange={(e) => setForm({...form, credit: parseInt(e.target.value) || 0})}
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/subjects')}>
              Discard
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={16} />}
              {saving ? 'Saving...' : (isEditing ? 'Update Subject' : 'Save Subject')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectsForm;
