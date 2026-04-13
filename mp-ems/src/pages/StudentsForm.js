import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
  GraduationCap, Check, User, BookOpen, Calendar, Layers, FileText,
  ShieldAlert, Building2, Mail, Phone, MapPin, IdCard, Droplet, Hash, Activity, Shield, ArrowLeft
} from "lucide-react";
import '../styles/FormPage.css';

const StudentsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [errorString, setErrorString] = useState('');
  const [fetchingUser, setFetchingUser] = useState(isEditing);

  const initialFormState = {
    id: null, name: '', rollnumber: '', email: '', contactNumber: '', address: '', fatherName: '',
    adharnumber: '', bloodgroup: '', policies: '', programName: '', admission_year: '', semister: '', collageName: '',
    admission_no: '', admission_date: '', first_name: '', middle_name: '', last_name: '', batch: '', section: '',
    date_of_birth: '', gender: '', student_status: '', rte: '', birth_place: '', hostel_or_day_scholar: '',
    country: '', state: '', city: '', pin_code: '', language: '', phone: '', sms_enabled: '', ems_enabled: '',
    address_line_1: '', father_first_name: '', father_last_name: '', father_mobile_phone: '', father_address_email: '',
    father_state: '', father_pin_code: '', mother_first_name: '', mother_last_name: '', mother_mobile_phone: '',
    mother_address_email: '', mother_state: '', mother_pin_code: ''
  };

  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const [academicYears, setAcademicYears] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [bloodGroups] = useState(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const [collegeSemesters, setCollegeSemesters] = useState([]);
  const [collegePrograms, setCollegePrograms] = useState([]);
  const [collegePolicies, setCollegePolicies] = useState([]);
  const [collegeAcademicYears, setCollegeAcademicYears] = useState([]);
  const [cascadingLoading, setCascadingLoading] = useState(false);

  useEffect(() => { fetchDropdownData().then((colls) => { if (isEditing) fetchStudentData(colls); }); }, [id]);

  const fetchDropdownData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [yearRes, policyRes, programRes, semesterRes, collegeRes] = await Promise.all([
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/master-policies', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/master-programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/master-semesters', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/colleges', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      let loadedColleges = [];
      if (yearRes.ok) setAcademicYears(await yearRes.json() || []);
      if (policyRes.ok) setPolicies(await policyRes.json() || []);
      if (programRes.ok) setPrograms(await programRes.json() || []);
      if (semesterRes.ok) setSemesters(await semesterRes.json() || []);
      if (collegeRes.ok) { loadedColleges = await collegeRes.json() || []; setColleges(loadedColleges); }
      return loadedColleges;
    } catch (err) { console.error('Error fetching dropdown data:', err); return []; }
    finally { setDropdownLoading(false); }
  };

  const fetchCollegeData = async (collegeId) => {
    try {
      if (!collegeId) { setCollegeSemesters([]); setCollegePrograms([]); setCollegePolicies([]); setCollegeAcademicYears([]); return; }
      setCascadingLoading(true);
      const token = localStorage.getItem('token');
      const [semesterRes, programRes, policyRes, yearRes] = await Promise.all([
        fetch(`http://localhost:8080/api/colleges/${collegeId}/semesters`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8080/api/colleges/${collegeId}/programs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8080/api/colleges/${collegeId}/policies`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`http://localhost:8080/api/colleges/${collegeId}/academic-years`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (semesterRes.ok) setCollegeSemesters(await semesterRes.json() || []);
      if (programRes.ok) setCollegePrograms(await programRes.json() || []);
      if (policyRes.ok) setCollegePolicies(await policyRes.json() || []);
      if (yearRes.ok) setCollegeAcademicYears(await yearRes.json() || []);
    } catch (err) { console.error('Error fetching college data:', err); }
    finally { setCascadingLoading(false); }
  };

  const fetchStudentData = async (colls) => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:8080/api/students`, { headers: { Authorization: `Bearer ${token}` } });
      if (resp.ok) {
        const dataList = await resp.json();
        const student = dataList.find(s => s.id.toString() === id.toString());
        if (student) {
          if(student.admission_date) student.admission_date = new Date(student.admission_date).toISOString().split('T')[0];
          if(student.date_of_birth) student.date_of_birth = new Date(student.date_of_birth).toISOString().split('T')[0];
          setForm({ ...initialFormState, ...student });
          if (student.collageName) {
            const collegeObj = colls.find(col => (col.college_name || col.name) === student.collageName);
            if (collegeObj) await fetchCollegeData(collegeObj.id);
          }
        } else { throw new Error("Student not found"); }
      }
    } catch(e) { toast.error("Failed to load student details"); navigate('/students'); }
    finally { setFetchingUser(false); }
  };

  const validate = (f) => {
    const errs = {};
    if (!f.first_name || !f.first_name.trim()) errs.first_name = 'First name is required';
    if (!f.admission_no || !f.admission_no.trim()) errs.admission_no = 'Admission No is required';
    if (!f.policies || !f.policies.trim()) errs.policies = 'Policy is required';
    if (!f.programName || !f.programName.trim()) errs.programName = 'Program is required';
    if (!f.admission_year) errs.admission_year = 'Admission year is required';
    if (!f.semister || !f.semister.trim()) errs.semister = 'Semester is required';
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = 'Invalid email';
    if (f.contactNumber && !/^\d{10}$/.test(f.contactNumber)) errs.contactNumber = 'Contact must be 10 digits';
    return errs;
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'collageName') {
      const collegeObj = colleges.find(col => (col.college_name || col.name) === value);
      if (collegeObj) {
        await fetchCollegeData(collegeObj.id);
        setForm(prev => ({ ...prev, policies: '', programName: '', admission_year: '', semister: '' }));
      } else {
        setForm(prev => ({ ...prev, policies: '', programName: '', admission_year: '', semister: '' }));
        setCollegeSemesters([]); setCollegePrograms([]); setCollegePolicies([]); setCollegeAcademicYears([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); setErrorString("Validation failed. Check required fields."); toast.error("Please fill all required fields correctly."); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setLoading(true); setErrorString('');
    const token = localStorage.getItem('token');
    try {
      const url = isEditing ? `http://localhost:8080/api/students/${id}` : 'http://localhost:8080/api/students';
      const method = isEditing ? 'PUT' : 'POST';
      const resp = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
      const text = await resp.text(); let respData = {}; try { respData = JSON.parse(text); } catch (e) { }
      if (!resp.ok) throw new Error(respData.message || text || `Failed to ${isEditing ? 'update' : 'enroll'}`);
      toast.success(respData.message || `Student ${isEditing ? 'updated' : 'enrolled'} successfully!`);
      navigate('/students');
    } catch (err) { setErrorString(err.message); toast.error(err.message); } finally { setLoading(false); }
  };

  // Field helper to reduce repetition
  const F = ({ label, name: n, type = 'text', icon: Icon, placeholder, req, err }) => (
    <div className="form-field">
      <label className={`form-label ${req ? 'form-label--required' : ''}`}>{label}</label>
      <div className="form-input-wrap">
        {Icon && <Icon size={16} className="form-input-wrap__icon" />}
        <input name={n} type={type} value={form[n] || ''} onChange={handleChange} placeholder={placeholder}
          className={`form-input ${Icon ? 'form-input--with-icon' : ''} ${(err || errors[n]) ? 'form-input--error' : ''}`} />
      </div>
      {errors[n] && <p className="form-field-error">{errors[n]}</p>}
    </div>
  );

  const Sel = ({ label, name: n, options, icon: Icon, req, disabled, placeholder }) => (
    <div className="form-field">
      <label className={`form-label ${req ? 'form-label--required' : ''}`}>{label}</label>
      <div className="form-input-wrap">
        {Icon && <Icon size={16} className="form-input-wrap__icon" />}
        <select name={n} value={form[n] || ''} onChange={handleChange} disabled={disabled}
          className={`form-select ${Icon ? 'form-select--with-icon' : ''} ${errors[n] ? 'form-input--error' : ''}`}>
          <option value="">{placeholder || `-- Select --`}</option>
          {options.map((opt, i) => <option key={i} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      {errors[n] && <p className="form-field-error">{errors[n]}</p>}
    </div>
  );

  if (fetchingUser || dropdownLoading) return (
    <div className="form-loading"><div className="form-loading__spinner"></div><p className="form-loading__text">Loading Student Profile...</p></div>
  );

  return (
    <div className="form-page form-page--wide">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/students')} className="form-header__back"><ArrowLeft size={20} /></button>
            <div className="form-header__icon"><GraduationCap size={22} /></div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Update Student Profile' : 'Student Enrollment'}</h2>
              <p>Administrative Academic Records</p>
            </div>
          </div>
          <div className="form-header__right">
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                 Draft Mode
               </span>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-body">
            {errorString && (
              <div className="form-error-banner">
                <ShieldAlert size={16} className="form-error-banner__icon" />
                <span className="form-error-banner__text">{errorString}</span>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              
              {/* Left Column: Core Identity */}
              <div className="space-y-10">
                
                <div className="form-section">
                  <div className="form-section__title"><span>Primary Identity</span></div>
                  <div className="form-grid form-grid--2">
                    <F label="First Name" name="first_name" icon={User} placeholder="e.g. Sriram" req />
                    <F label="Last Name" name="last_name" icon={User} placeholder="e.g. Kumar" />
                    <div className="form-field form-grid__full">
                      <label className="form-label">Full Name (Legacy System)</label>
                      <div className="form-input-wrap"><User size={16} className="form-input-wrap__icon" />
                        <input name="name" value={form.name || ''} onChange={handleChange} placeholder="e.g. Sriram Kumar" className="form-input form-input--with-icon" />
                      </div>
                    </div>
                    <F label="Middle Name" name="middle_name" icon={User} placeholder="e.g. Singh" />
                    <F label="Date of Birth" name="date_of_birth" type="date" icon={Calendar} />
                    <Sel label="Gender" name="gender" icon={User} options={[{value: 'Male', label: 'Male'}, {value: 'Female', label: 'Female'}, {value: 'Other', label: 'Other'}]} placeholder="Select Gender" />
                    <Sel label="Blood Group" name="bloodgroup" icon={Droplet} options={bloodGroups.map(b => ({ value: b, label: b }))} placeholder="Select Group" />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Academic Placement</span></div>
                  <div className="form-grid form-grid--2">
                    <F label="Admission No" name="admission_no" icon={Hash} placeholder="e.g. 25C00713" req />
                    <F label="Roll Number" name="rollnumber" icon={Hash} placeholder="e.g. 101" />
                    <Sel label="Institutional Context" name="collageName" icon={Building2} 
                      options={colleges.map(c => ({ value: c.college_name || c.name, label: c.college_name || c.name }))} placeholder="Select College" />
                    <Sel label="Governing Policy" name="policies" icon={FileText} req disabled={!form.collageName}
                      options={collegePolicies.map(p => ({ value: p.name, label: p.name }))} placeholder={form.collageName ? 'Select Policy' : 'Select College First'} />
                    <Sel label="Academic Program" name="programName" icon={BookOpen} req disabled={!form.collageName}
                      options={programs.map(p => ({ value: p.name, label: p.name }))} placeholder={form.collageName ? 'Select Program' : 'Select College First'} />
                    <Sel label="Admission Cycle" name="admission_year" icon={Calendar} req disabled={!form.collageName}
                      options={collegeAcademicYears.map(y => ({ value: y.year_name, label: y.year_name }))} placeholder={form.collageName ? 'Select Year' : 'Select College First'} />
                    <Sel label="Current Semester" name="semister" icon={Layers} req disabled={!form.collageName}
                      options={collegeSemesters.map(s => ({ value: s.semester_name, label: s.semester_name }))} placeholder={form.collageName ? 'Select Semester' : 'Select College First'} />
                    <F label="Batch Series" name="batch" icon={Layers} placeholder="e.g. I Year" />
                    <F label="Section" name="section" icon={BookOpen} placeholder="e.g. Economics" />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>National Registry & Demographics</span></div>
                  <div className="form-grid form-grid--2">
                    <F label="Aadhar ID" name="adharnumber" icon={IdCard} placeholder="e.g. 1234-5678-9012" />
                    <F label="Birth Place" name="birth_place" icon={MapPin} placeholder="e.g. Bhopal" />
                    <F label="Native Language" name="language" icon={FileText} placeholder="e.g. Hindi" />
                    <F label="RTE Status" name="rte" icon={Shield} placeholder="e.g. Yes/No" />
                  </div>
                </div>

              </div>

              {/* Right Column: Contact & Extended Details */}
              <div className="space-y-10">
                
                <div className="form-section">
                  <div className="form-section__title"><span>Communication Identity</span></div>
                  <div className="form-grid form-grid--2">
                    <F label="Primary Email" name="email" type="email" icon={Mail} placeholder="e.g. student@example.com" />
                    <F label="Primary Contact" name="contactNumber" icon={Phone} placeholder="e.g. 9876543210" />
                    <F label="Alternate Phone" name="phone" icon={Phone} placeholder="e.g. 9876543210" />
                    <Sel label="SMS Notifications" name="sms_enabled" icon={Mail} options={[{value: 'Yes', label: 'Enabled'}, {value: 'No', label: 'Disabled'}]} />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Geographic Profile</span></div>
                  <div className="form-grid form-grid--2">
                    <F label="Building/Street" name="address_line_1" icon={MapPin} placeholder="e.g. 123 Main St" />
                    <F label="City" name="city" icon={MapPin} placeholder="e.g. Bhopal" />
                    <F label="State/Province" name="state" icon={MapPin} placeholder="e.g. Madhya Pradesh" />
                    <F label="Postal Code" name="pin_code" icon={Hash} placeholder="e.g. 462001" />
                    <div className="form-field form-grid__full">
                      <label className="form-label">Extended Address Description</label>
                      <textarea name="address" value={form.address || ''} onChange={handleChange} placeholder="Physical mailing address details..." rows={3} className="form-textarea" />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Parental Registry</span></div>
                  <div className="form-grid form-grid--2">
                    <div className="form-field form-grid__full">
                      <F label="Father's Legal Name" name="fatherName" icon={User} placeholder="Full Name" />
                    </div>
                    <F label="Father Mobile" name="father_mobile_phone" icon={Phone} />
                    <F label="Mother Legal Name" name="mother_first_name" icon={User} placeholder="Full Name" />
                    <F label="Mother Mobile" name="mother_mobile_phone" icon={Phone} />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section__title"><span>Operational Status</span></div>
                  <div className="form-grid form-grid--2">
                    <Sel label="Academic Status" name="student_status" icon={Activity} options={[{value: 'Active', label: 'Active'}, {value: 'Inactive', label: 'Inactive'}]} />
                    <Sel label="Residancy Type" name="hostel_or_day_scholar" icon={Building2} options={[{value: 'Day Scholar', label: 'Day Scholar'}, {value: 'Hosteller', label: 'Hosteller'}]} />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" onClick={() => navigate('/students')} className="form-btn-cancel">Discard Changes</button>
            <button type="submit" disabled={loading} className="form-btn-submit">
              {loading ? <div className="form-spinner"></div> : <Check size={20} />}
              <span>{loading ? 'Committing...' : (isEditing ? 'Push Changes' : 'Initialize Enrollment')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentsForm;
