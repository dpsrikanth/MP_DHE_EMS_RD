import React, { useState, useEffect } from "react";
import { masterDataApi } from '../api/masterDataApi';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { User, Check, Mail, Building, Briefcase, ShieldCheck, ShieldAlert, ArrowLeft, Hash, Phone, Calendar, MapPin, FileText } from "lucide-react";
import authUtils from '../utils/authUtils';
import '../styles/FormPage.css';

// Move Field helper outside to prevent focus loss during re-renders
const Field = ({ label, name, type = 'text', icon: Icon, placeholder, required, half, className = '', form, errors, handleChange }) => (
  <div className={`form-field ${half ? '' : 'form-grid__full'} ${className}`}>
    <label className={`form-label ${required ? 'form-label--required' : ''}`}>{label}</label>
    <div className="form-input-wrap">
      {Icon && <Icon size={18} className="form-input-wrap__icon" />}
      <input 
        name={name} 
        type={type} 
        value={form[name] || ''} 
        onChange={handleChange} 
        placeholder={placeholder}
        className={`form-input ${Icon ? 'form-input--with-icon' : ''} ${errors[name] ? 'form-input--error' : ''}`}
        maxLength={name === 'pan_no' ? 10 : name === 'aadhaar_no' ? 12 : name === 'phone' ? 14 : undefined} 
      />
    </div>
    {errors[name] && <p className="form-field-error">{errors[name]}</p>}
  </div>
);

const TeachersForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorString, setErrorString] = useState('');

  const [designationOptions, setDesignationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);

  const [form, setForm] = useState({
    name: '', email: '', college_id: '', designation_id: '', department_id: '',
    qualification: '', experience: '', specialization: '', pan_no: '', aadhaar_no: '',
    dob: '', gender: '', joining_date: '', phone: '', address: '', status: true,
    employee_category_name: '', first_name: '', middle_name: '', last_name: '',
    job_title: '', employee_position_name: '', employee_department_name: '',
    employee_grade_name: '', experience_detail: '', experience_months: '',
    marital_status: '', father_name: '', mother_name: '', spouse_name: '',
    blood_group: '', country_name: '', home_address_line1: '', home_city: '',
    home_state: '', home_country_name: '', office_phone1: '', office_phone2: '',
    office_state: '', home_phone1: '', fax: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => { fetchFormData(); }, [id]);

  const fetchFormData = async () => {
    try {
      await fetchDropdownOptions();
      if (!isEditing) {
        const auth = authUtils.getAuth();
        setForm(prev => ({ ...prev, college_id: auth.roleName === 'HOD' ? auth.collegeId : '', department_id: auth.roleName === 'HOD' ? auth.departmentId : '' }));
      } else { await loadTeacher(id); }
    } catch (err) { console.error(err); if (isEditing) setLoading(false); }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [designResp, deptResp, collegeResp] = await Promise.all([
        masterDataApi.getDesignations(),
        masterDataApi.getDepartments(),
        masterDataApi.getColleges()
      ]);
      if (designResp) setDesignationOptions(designResp.map(d => ({ id: d.id, name: d.designation_name })));
      if (deptResp) setDepartmentOptions(deptResp.map(d => ({ id: d.id, name: d.department_name })));
      if (collegeResp) setCollegeOptions(collegeResp.map(c => ({ id: c.id, name: c.college_name })));
    } catch (err) { console.error('Failed to fetch options:', err); }
  };

  const loadTeacher = async (teacherId) => {
    try {
      const td = await masterDataApi.getTeacherById(teacherId);
      const fmt = (d) => d ? d.toString().slice(0, 10) : '';
      setForm({
        name: td.name || '', email: td.email || '', college_id: td.college_id || '',
        designation_id: td.designation_id || '', department_id: td.department_id || '',
        qualification: td.qualification || '', experience: td.experience_years || td.experience || '',
        specialization: td.specialization || '', pan_no: td.pan_no || '', aadhaar_no: td.aadhaar_no || '',
        dob: fmt(td.dob), gender: td.gender || '', joining_date: fmt(td.joining_date),
        phone: td.phone || '', address: td.address || '',
        status: td.status === 'Active' || td.status === true,
        employee_category_name: td.employee_category_name || '', first_name: td.first_name || '',
        middle_name: td.middle_name || '', last_name: td.last_name || '', job_title: td.job_title || '',
        employee_position_name: td.employee_position_name || '', employee_department_name: td.employee_department_name || '',
        employee_grade_name: td.employee_grade_name || '', experience_detail: td.experience_detail || '',
        experience_months: td.experience_months || '', marital_status: td.marital_status || '',
        father_name: td.father_name || '', mother_name: td.mother_name || '', spouse_name: td.spouse_name || '',
        blood_group: td.blood_group || '', country_name: td.country_name || '',
        home_address_line1: td.home_address_line1 || '', home_city: td.home_city || '',
        home_state: td.home_state || '', home_country_name: td.home_country_name || '',
        office_phone1: td.office_phone1 || '', office_phone2: td.office_phone2 || '',
        office_state: td.office_state || '', home_phone1: td.home_phone1 || '', fax: td.fax || ''
      });
    } catch (err) { toast.error(err.message); navigate('/teachers'); } finally { setLoading(false); }
  };

  const validate = (f) => {
    const errs = {};
    if (!f.name) errs.name = 'Name is required';
    if (!f.email) errs.email = 'Email is required';
    if (!f.designation_id) errs.designation_id = 'Designation is required';
    if (!f.college_id) errs.college_id = 'College is required';
    if (!f.department_id) errs.department_id = 'Department is required';
    if (!f.qualification) errs.qualification = 'Qualification is required';
    if (f.experience === '' || f.experience === null) errs.experience = 'Experience is required';
    if (!f.specialization) errs.specialization = 'Specialization is required';
    if (!f.pan_no) { errs.pan_no = 'PAN is required'; } else { if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(f.pan_no.toUpperCase())) errs.pan_no = 'Invalid PAN format'; }
    if (!f.aadhaar_no) { errs.aadhaar_no = 'Aadhaar is required'; } else { if (!/^\d{12}$/.test(f.aadhaar_no.replace(/\s/g, ''))) errs.aadhaar_no = 'Aadhaar must be 12 digits'; }
    if (!f.dob) errs.dob = 'Date of birth is required';
    if (!f.gender) errs.gender = 'Gender is required';
    if (!f.joining_date) errs.joining_date = 'Joining date is required';
    if (!f.phone) { errs.phone = 'Phone is required'; } else if (!/^(\+91[-\s]?|0)?[6-9]\d{9}$/.test(f.phone)) { errs.phone = 'Invalid phone number'; }
    if (!f.address) errs.address = 'Address is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'pan_no') val = val.toUpperCase();
    if (name === 'aadhaar_no') val = val.replace(/\D/g, '');
    if (name === 'phone') val = val.replace(/[^\d\+\-\s]/g, '');
    setForm(prev => ({ ...prev, [name]: val }));
    if (errors[name]) setErrors(prev => { const { [name]: omit, ...rest } = prev; return rest; });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); setErrorString('Please correct the highlighted errors.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setSaving(true); setErrorString('');
    try {
      const payload = { ...form, college_id: form.college_id ? parseInt(form.college_id) : null, designation_id: form.designation_id ? parseInt(form.designation_id) : null, department_id: form.department_id ? parseInt(form.department_id) : null, experience: form.experience ? parseInt(form.experience) : 0, status: form.status ? 'Active' : 'Inactive' };
      
      let result;
      if (isEditing) {
        result = await masterDataApi.updateTeacher(id, payload);
      } else {
        result = await masterDataApi.createTeacher(payload);
      }
      toast.success(result.message || (isEditing ? 'Teacher updated successfully!' : 'Teacher created successfully!'));
      navigate('/teachers');
    } catch (err) { setErrorString(err.response?.data?.message || err.message); toast.error('Error: ' + (err.response?.data?.message || err.message)); } finally { setSaving(false); }
  };



  if (loading) return (
    <div className="form-loading"><div className="form-loading__spinner"></div><p className="form-loading__text">Loading Faculty Details...</p></div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/teachers')} className="form-header__back"><ArrowLeft size={20} /></button>
            <div className="form-header__icon"><User size={22} /></div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Edit Faculty Member' : 'New Teacher Profile'}</h2>
              <p>Personnel Management</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            {errorString && (
              <div className="form-error-banner">
                <ShieldAlert size={16} className="form-error-banner__icon" />
                <span className="form-error-banner__text">{errorString}</span>
              </div>
            )}

            {isEditing && (
              <div className="form-badge" style={{ marginBottom: '1.5rem' }}>
                <div className="form-badge__icon"><Hash size={18} /></div>
                <div>
                  <div className="form-badge__label">Teacher ID</div>
                  <div className="form-badge__value">TCH-{id.padStart(4, '0')}</div>
                </div>
              </div>
            )}

            <div className="form-section">
              <div className="form-section__title"><span>Personal Information</span></div>
              <div className="form-grid form-grid--2">
                <Field label="Full Name" name="name" icon={User} placeholder="e.g. Dr. Jane Doe" required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Official Email" name="email" type="email" icon={Mail} placeholder="faculty@college.edu" required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="First Name" name="first_name" icon={User} placeholder="First" half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Last Name" name="last_name" icon={User} placeholder="Last" half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Date of Birth" name="dob" type="date" icon={Calendar} required half form={form} errors={errors} handleChange={handleChange} />
                <div className="form-field">
                  <label className={`form-label form-label--required`}>Gender</label>
                  <div className={`form-radio-group ${errors.gender ? 'form-radio-group--error' : ''}`}>
                    {['Male', 'Female', 'Other'].map(g => (
                      <label key={g} className="form-radio-item">
                        <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={handleChange} />
                        <span>{g}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="form-field-error">{errors.gender}</p>}
                </div>
                <Field label="Mobile Number" name="phone" type="tel" icon={Phone} placeholder="+91 XXXXX XXXXX" required half form={form} errors={errors} handleChange={handleChange} />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Employment Details</span></div>
              <div className="form-grid form-grid--2">
                {authUtils.getAuth().roleName !== 'HOD' && (
                  <div className="form-field form-grid__full">
                    <label className="form-label form-label--required">Institute / College</label>
                    <div className="form-input-wrap">
                      <Building size={18} className="form-input-wrap__icon" />
                      <select name="college_id" value={form.college_id} onChange={handleChange}
                        className={`form-select form-select--with-icon ${errors.college_id ? 'form-input--error' : ''}`}>
                        <option value="">Select college</option>
                        {collegeOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {errors.college_id && <p className="form-field-error">{errors.college_id}</p>}
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label form-label--required">Designation</label>
                  <div className="form-input-wrap">
                    <Briefcase size={18} className="form-input-wrap__icon" />
                    <select name="designation_id" value={form.designation_id} onChange={handleChange}
                      className={`form-select form-select--with-icon ${errors.designation_id ? 'form-input--error' : ''}`}>
                      <option value="">Select designation</option>
                      {designationOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                    </select>
                  </div>
                  {errors.designation_id && <p className="form-field-error">{errors.designation_id}</p>}
                </div>
                {authUtils.getAuth().roleName !== 'HOD' && (
                  <div className="form-field">
                    <label className="form-label form-label--required">Department</label>
                    <div className="form-input-wrap">
                      <Building size={18} className="form-input-wrap__icon" />
                      <select name="department_id" value={form.department_id} onChange={handleChange}
                        className={`form-select form-select--with-icon ${errors.department_id ? 'form-input--error' : ''}`}>
                        <option value="">Select department</option>
                        {departmentOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                      </select>
                    </div>
                    {errors.department_id && <p className="form-field-error">{errors.department_id}</p>}
                  </div>
                )}
                <Field label="Qualification" name="qualification" icon={FileText} placeholder="e.g. M.Sc., Ph.D." required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Years Experience" name="experience" type="number" icon={Calendar} placeholder="0" required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Specialization" name="specialization" icon={FileText} placeholder="e.g. Computer Science" required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Joining Date" name="joining_date" type="date" icon={Calendar} required half form={form} errors={errors} handleChange={handleChange} />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Identity Documents</span></div>
              <div className="form-grid form-grid--2">
                <Field label="PAN Number" name="pan_no" icon={FileText} placeholder="AAAAA0000A" required half form={form} errors={errors} handleChange={handleChange} />
                <Field label="Aadhaar Number" name="aadhaar_no" icon={FileText} placeholder="XXXX XXXX XXXX" required half form={form} errors={errors} handleChange={handleChange} />
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Address & Status</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field form-grid__full">
                  <label className="form-label form-label--required">Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter complete address..." rows={3}
                    className={`form-textarea ${errors.address ? 'form-input--error' : ''}`} />
                  {errors.address && <p className="form-field-error">{errors.address}</p>}
                </div>
                <div className="form-field">
                  <label className="form-label">Personnel Status</label>
                  <div className="form-toggle">
                    <div className="form-toggle__info">
                      <div className={`form-toggle__status ${form.status ? 'form-toggle__status--active' : 'form-toggle__status--inactive'}`}>
                        {form.status ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                      </div>
                      <span className="form-toggle__label">{form.status ? 'Active Faculty' : 'Inactive'}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input name="status" type="checkbox" checked={form.status} onChange={handleChange} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
                      <div className={`form-toggle__track ${form.status ? 'form-toggle__track--on' : 'form-toggle__track--off'}`}>
                        <div className="form-toggle__thumb" />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/teachers')}>Discard</button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={16} />}
              {saving ? 'Processing...' : (isEditing ? 'Confirm Update' : 'Save Record')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeachersForm;
