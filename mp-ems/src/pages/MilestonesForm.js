import React, { useState, useEffect } from "react";
import { milestoneApi } from '../api/milestoneApi';
import { masterDataApi } from '../api/masterDataApi';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import { Calendar, ArrowLeft, Check, Flag, User, Type } from "lucide-react";
import '../styles/FormPage.css';

const DateInput = ({ value, name, onChange, required, className }) => {
  const [isFocused, setIsFocused] = useState(false);

  const displayValue = value && !isFocused ? 
    `${value.split('-')[2]}-${value.split('-')[1]}-${value.split('-')[0]}` : 
    value;

  return (
    <input 
      required={required}
      type={isFocused ? "date" : (value ? "text" : "date")}
      name={name}
      value={displayValue}
      onChange={onChange}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      className={className}
    />
  );
};

const toInputDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const MilestonesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [metadata, setMetadata] = useState({
    academicYears: [],
    programs: [],
    semesters: []
  });

  const [form, setForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    responsibility: '',
    type: 'General',
    description: '',
    semester_id: '',
    program_id: '',
    academic_year_id: ''
  });

  useEffect(() => { fetchFormData(); }, [id]);

  const fetchFormData = async () => {
    try {
      const [years, programs, semesters] = await Promise.all([
        masterDataApi.getAcademicYears(),
        masterDataApi.getPrograms(),
        masterDataApi.getSemesters()
      ]);

      setMetadata({
        academicYears: years.sort((a, b) => {
          const yearA = a.start_year || parseInt(a.year_name?.split('-')[0]) || 0;
          const yearB = b.start_year || parseInt(b.year_name?.split('-')[0]) || 0;
          return yearB - yearA; 
        }),
        programs: programs,
        semesters: semesters.sort((a, b) => {
          const numA = parseInt(a.semester_name.replace(/\\D/g, '')) || 0;
          const numB = parseInt(b.semester_name.replace(/\\D/g, '')) || 0;
          return numA - numB;
        })
      });

      if (isEditing) {
        await loadMilestone(id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load prerequisite data");
      setLoading(false);
    }
  };

  const loadMilestone = async (milestoneId) => {
    try {
      const data = await milestoneApi.getMilestones({});
      const item = data.find(m => m.id.toString() === milestoneId);
      
      if (item) {
        setForm({ 
          name: item.name || '',
          start_date: toInputDate(item.start_date),
          end_date: toInputDate(item.end_date),
          responsibility: item.responsibility || '',
          type: item.type || 'General',
          description: item.description || '',
          semester_id: item.semester_id || '',
          program_id: item.program_id || '',
          academic_year_id: item.academic_year_id || ''
        });
      } else {
        toast.error('Milestone not found');
        navigate('/milestones', { state: { preserveFilters: true } });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (isEditing) {
        await milestoneApi.updateMilestone(id, form);
      } else {
        await milestoneApi.createMilestone(form);
      }
      toast.success(`Milestone ${isEditing ? 'updated' : 'created'} successfully`);
      navigate('/milestones', { state: { preserveFilters: true } });
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Milestone Details...</p>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/milestones', { state: { preserveFilters: true } })} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <Flag size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Edit Milestone' : 'New Milestone'}</h2>
              <p>Institutional Roadmap Data</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="form-section">
              <div className="form-section__title"><span>Basic Details</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label form-label--required">Activity Name</label>
                  <div className="form-input-wrap">
                    <Flag size={18} className="form-input-wrap__icon" />
                    <input required type="text" name="name" value={form.name} onChange={handleInputChange} className="form-input form-input--with-icon" placeholder="e.g. Internal Exam 1 (Mid-1)" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label form-label--required">Start Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <DateInput required name="start_date" value={form.start_date} onChange={handleInputChange} className="form-input form-input--with-icon" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label form-label--required">End Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <DateInput required name="end_date" value={form.end_date} onChange={handleInputChange} className="form-input form-input--with-icon" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label form-label--required">Responsibility</label>
                  <div className="form-input-wrap">
                    <User size={18} className="form-input-wrap__icon" />
                    <input required type="text" name="responsibility" value={form.responsibility} onChange={handleInputChange} className="form-input form-input--with-icon" placeholder="e.g. Faculty, HOD" />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label form-label--required">Event Type</label>
                  <div className="form-input-wrap">
                    <Type size={18} className="form-input-wrap__icon" />
                    <select name="type" value={form.type} onChange={handleInputChange} className="form-select form-select--with-icon">
                      <option value="General">General</option>
                      <option value="Internal">Internal</option>
                      <option value="External">External</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Milestone Scope (Leave blank for global)</span></div>
              <div className="form-grid form-grid--3">
                <div className="form-field">
                  <label className="form-label">Academic Year</label>
                  <select name="academic_year_id" value={form.academic_year_id} onChange={handleInputChange} className="form-select">
                    <option value="">Global</option>
                    {metadata.academicYears.map(y => <option key={y.id} value={y.id}>{y.year_name || `${y.start_year}-${y.end_year}`}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Program</label>
                  <select name="program_id" value={form.program_id} onChange={handleInputChange} className="form-select">
                    <option value="">Global</option>
                    {metadata.programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Semester</label>
                  <select name="semester_id" value={form.semester_id} onChange={handleInputChange} className="form-select">
                    <option value="">Global</option>
                    {metadata.semesters.map(s => <option key={s.id} value={s.id}>{s.semester_name}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/milestones', { state: { preserveFilters: true } })}>
              Discard
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={16} />}
              {saving ? 'Saving...' : (isEditing ? 'Update Milestone' : 'Create Milestone')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MilestonesForm;
