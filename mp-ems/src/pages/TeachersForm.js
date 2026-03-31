import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  User,
  Check,
  Mail,
  Building,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Hash
} from "lucide-react";
import authUtils from '../utils/authUtils';

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
    name: '',
    email: '',
    college_id: '',
    designation_id: '',
    department_id: '',
    qualification: '',
    experience: '',
    specialization: '',
    pan_no: '',
    aadhaar_no: '',
    dob: '',
    gender: '',
    joining_date: '',
    phone: '',
    address: '',
    status: true,
    employee_category_name: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    job_title: '',
    employee_position_name: '',
    employee_department_name: '',
    employee_grade_name: '',
    experience_detail: '',
    experience_months: '',
    marital_status: '',
    father_name: '',
    mother_name: '',
    spouse_name: '',
    blood_group: '',
    country_name: '',
    home_address_line1: '',
    home_city: '',
    home_state: '',
    home_country_name: '',
    office_phone1: '',
    office_phone2: '',
    office_state: '',
    home_phone1: '',
    fax: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    try {
      await fetchDropdownOptions();
      
      if (!isEditing) {
        const auth = authUtils.getAuth();
        setForm(prev => ({
          ...prev,
          college_id: auth.roleName === 'HOD' ? auth.collegeId : '',
          department_id: auth.roleName === 'HOD' ? auth.departmentId : '',
        }));
      } else {
        await loadTeacher(id);
      }
    } catch (err) {
      console.error(err);
      if (isEditing) setLoading(false);
    }
  };

  const fetchDropdownOptions = async () => {
    try {
      const [designResp, deptResp, collegeResp] = await Promise.all([
        fetch('http://localhost:8080/api/master-designations', { headers: authUtils.getAuthHeader() }),
        fetch('http://localhost:8080/api/master-departments', { headers: authUtils.getAuthHeader() }),
        fetch('http://localhost:8080/api/colleges', { headers: authUtils.getAuthHeader() })
      ]);

      if (designResp.ok) {
        const designations = await designResp.json();
        setDesignationOptions(designations.map(d => ({ id: d.id, name: d.designation_name })));
      }
      if (deptResp.ok) {
        const departments = await deptResp.json();
        setDepartmentOptions(departments.map(d => ({ id: d.id, name: d.department_name })));
      }
      if (collegeResp.ok) {
        const colleges = await collegeResp.json();
        setCollegeOptions(colleges.map(c => ({ id: c.id, name: c.college_name })));
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
    }
  };

  const loadTeacher = async (teacherId) => {
    try {
      const resp = await fetch(`http://localhost:8080/api/master-teachers/${teacherId}`, {
        headers: authUtils.getAuthHeader()
      });
      if (!resp.ok) throw new Error('Failed to fetch teacher details');

      const teacherData = await resp.json();
      const formatDate = (d) => d ? d.toString().slice(0, 10) : '';
      
      setForm({
        name: teacherData.name || '',
        email: teacherData.email || '',
        college_id: teacherData.college_id || '',
        designation_id: teacherData.designation_id || '',
        department_id: teacherData.department_id || '',
        qualification: teacherData.qualification || '',
        experience: teacherData.experience_years || teacherData.experience || '',
        specialization: teacherData.specialization || '',
        pan_no: teacherData.pan_no || '',
        aadhaar_no: teacherData.aadhaar_no || '',
        dob: formatDate(teacherData.dob),
        gender: teacherData.gender || '',
        joining_date: formatDate(teacherData.joining_date),
        phone: teacherData.phone || '',
        address: teacherData.address || '',
        status: teacherData.status === 'Active' || teacherData.status === true,
        employee_category_name: teacherData.employee_category_name || '',
        first_name: teacherData.first_name || '',
        middle_name: teacherData.middle_name || '',
        last_name: teacherData.last_name || '',
        job_title: teacherData.job_title || '',
        employee_position_name: teacherData.employee_position_name || '',
        employee_department_name: teacherData.employee_department_name || '',
        employee_grade_name: teacherData.employee_grade_name || '',
        experience_detail: teacherData.experience_detail || '',
        experience_months: teacherData.experience_months || '',
        marital_status: teacherData.marital_status || '',
        father_name: teacherData.father_name || '',
        mother_name: teacherData.mother_name || '',
        spouse_name: teacherData.spouse_name || '',
        blood_group: teacherData.blood_group || '',
        country_name: teacherData.country_name || '',
        home_address_line1: teacherData.home_address_line1 || '',
        home_city: teacherData.home_city || '',
        home_state: teacherData.home_state || '',
        home_country_name: teacherData.home_country_name || '',
        office_phone1: teacherData.office_phone1 || '',
        office_phone2: teacherData.office_phone2 || '',
        office_state: teacherData.office_state || '',
        home_phone1: teacherData.home_phone1 || '',
        fax: teacherData.fax || ''
      });
    } catch (err) {
      toast.error(err.message);
      navigate('/teachers');
    } finally {
      setLoading(false);
    }
  };

  const validate = (formData) => {
    const errs = {};
    if (!formData.name) errs.name = 'Name is required';
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.designation_id) errs.designation_id = 'Designation is required';
    if (!formData.college_id) errs.college_id = 'College is required';
    if (!formData.department_id) errs.department_id = 'Department is required';

    if (!formData.qualification) errs.qualification = 'Qualification is required';
    if (formData.experience === '' || formData.experience === null) errs.experience = 'Experience is required';
    if (!formData.specialization) errs.specialization = 'Specialization is required';

    if (!formData.pan_no) {
      errs.pan_no = 'PAN is required';
    } else {
      const pan = formData.pan_no.toString().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        errs.pan_no = 'PAN must be 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)';
      }
    }

    if (!formData.aadhaar_no) {
      errs.aadhaar_no = 'Aadhaar is required';
    } else {
      const cleanAadhaar = formData.aadhaar_no.toString().replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanAadhaar)) {
        errs.aadhaar_no = 'Aadhaar must be 12 digits';
      }
    }

    if (!formData.dob) errs.dob = 'Date of birth is required';
    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.joining_date) errs.joining_date = 'Joining date is required';

    if (!formData.phone) {
      errs.phone = 'Phone number is required';
    } else if (!/^(\+91[-\s]?|0)?[6-9]\d{9}$/.test(formData.phone)) {
      errs.phone = 'Invalid Indian phone number';
    }

    if (!formData.address) errs.address = 'Address is required';

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    if (name === 'pan_no') {
      val = val.toUpperCase();
    }
    if (name === 'aadhaar_no') {
      val = val.replace(/\D/g, '');
    }
    if (name === 'phone') {
      val = val.replace(/[^\d\+\-\s]/g, '');
    }
    
    setForm(prev => ({ ...prev, [name]: val }));
    
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: omit, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorString('Please correct the highlighted errors in the form.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setErrorString('');
    
    try {
      const payload = {
        ...form,
        college_id: form.college_id ? parseInt(form.college_id) : null,
        designation_id: form.designation_id ? parseInt(form.designation_id) : null,
        department_id: form.department_id ? parseInt(form.department_id) : null,
        experience: form.experience ? parseInt(form.experience) : 0,
        status: form.status ? 'Active' : 'Inactive'
      };

      const url = isEditing 
        ? `http://localhost:8080/api/master-teachers/${id}` 
        : 'http://localhost:8080/api/master-teachers';
      const method = isEditing ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authUtils.getAuthHeader() },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) throw new Error('Failed to save teacher record');

      const result = await resp.json();
      toast.success(result.message || (isEditing ? 'Teacher record updated successfully!' : 'Teacher record created successfully!'));
      navigate('/teachers');
    } catch (err) {
      setErrorString(err.message);
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Provider Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/teachers')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Edit Faculty Member' : 'New Teacher Profile'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-70">
                Personnel Management System
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-8 bg-slate-50/30">
            {errorString && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <ShieldAlert size={18} /> {errorString}
              </div>
            )}

            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 transition-colors group hover:border-blue-100 shadow-sm max-w-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-blue-400 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Teacher ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">TCH-{id.padStart(4, '0')}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Jane Doe"
                    className={`w-full bg-white shadow-sm border-2 ${errors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="faculty@college.edu"
                    className={`w-full bg-white shadow-sm border-2 ${errors.email ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
              </div>

              {authUtils.getAuth().roleName !== 'HOD' && (
                <div className="space-y-3 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Institute / College</label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      name="college_id"
                      value={form.college_id}
                      onChange={handleChange}
                      className={`w-full bg-white shadow-sm border-2 ${errors.college_id ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold appearance-none`}
                    >
                      <option value="">Select college</option>
                      {collegeOptions.map(college => (
                        <option key={college.id} value={college.id}>{college.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.college_id && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.college_id}</p>}
                </div>
              )}

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Designation</label>
                <div className="relative">
                  <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <select
                    name="designation_id"
                    value={form.designation_id}
                    onChange={handleChange}
                    className={`w-full bg-white shadow-sm border-2 ${errors.designation_id ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold appearance-none`}
                  >
                    <option value="">Select designation</option>
                    {designationOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
                {errors.designation_id && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.designation_id}</p>}
              </div>

              {authUtils.getAuth().roleName !== 'HOD' && (
                <div className="space-y-3 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <div className="relative">
                    <Building className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      name="department_id"
                      value={form.department_id}
                      onChange={handleChange}
                      className={`w-full bg-white shadow-sm border-2 ${errors.department_id ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold appearance-none`}
                    >
                      <option value="">Select department</option>
                      {departmentOptions.map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department_id && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.department_id}</p>}
                </div>
              )}

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Qualification</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="qualification"
                    type="text"
                    value={form.qualification}
                    onChange={handleChange}
                    placeholder="e.g. M.Sc., Ph.D."
                    className={`w-full bg-white shadow-sm border-2 ${errors.qualification ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.qualification && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.qualification}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Years Experience</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="experience"
                    type="number"
                    min="0"
                    value={form.experience}
                    onChange={handleChange}
                    placeholder="0"
                    className={`w-full bg-white shadow-sm border-2 ${errors.experience ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.experience && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.experience}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="specialization"
                    type="text"
                    value={form.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Computer Science"
                    className={`w-full bg-white shadow-sm border-2 ${errors.specialization ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.specialization && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.specialization}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">PAN Number</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="pan_no"
                    type="text"
                    value={form.pan_no}
                    onChange={handleChange}
                    placeholder="AAAAA0000A"
                    maxLength={10}
                    className={`w-full bg-white shadow-sm border-2 ${errors.pan_no ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.pan_no && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.pan_no}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="aadhaar_no"
                    type="text"
                    value={form.aadhaar_no}
                    onChange={handleChange}
                    placeholder="XXXX XXXX XXXX"
                    maxLength={12}
                    className={`w-full bg-white shadow-sm border-2 ${errors.aadhaar_no ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.aadhaar_no && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.aadhaar_no}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="dob"
                    type="date"
                    value={form.dob}
                    onChange={handleChange}
                    className={`w-full bg-white shadow-sm border-2 ${errors.dob ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.dob && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.dob}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                <div className={`flex items-center gap-8 h-[62px] px-6 bg-white shadow-sm rounded-2xl border-2 ${errors.gender ? 'border-red-200' : 'border-slate-100'}`}>
                  {['Male', 'Female', 'Other'].map(gender => (
                    <label key={gender} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={form.gender === gender}
                        onChange={handleChange}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-700">{gender}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.gender}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="joining_date"
                    type="date"
                    value={form.joining_date}
                    onChange={handleChange}
                    className={`w-full bg-white shadow-sm border-2 ${errors.joining_date ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.joining_date && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.joining_date}</p>}
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 XXXXX XXXXX"
                    maxLength={14}
                    className={`w-full bg-white shadow-sm border-2 ${errors.phone ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl pl-14 pr-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold`}
                  />
                </div>
                {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.phone}</p>}
              </div>

              <div className="space-y-3 col-span-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <div className="relative">
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter complete address..."
                    rows="3"
                    className={`w-full bg-white shadow-sm border-2 ${errors.address ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-blue-500'} rounded-2xl px-6 py-4 text-slate-800 placeholder:text-slate-300 focus:bg-white outline-none transition-all font-bold resize-none`}
                  />
                </div>
                {errors.address && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.address}</p>}
              </div>
              
              {/* Additional Detail Fields (Optional) */}
              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full bg-white shadow-sm border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-14 pr-6 py-4 text-slate-800 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full bg-white shadow-sm border-2 border-slate-100 focus:border-blue-500 rounded-2xl pl-14 pr-6 py-4 text-slate-800 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-3 col-span-2 md:col-span-1">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Personnel Status</label>
                <div className="h-[62px] flex items-center justify-between px-6 bg-white shadow-sm rounded-2xl border-2 border-slate-100 group hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${form.status ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {form.status ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                    </div>
                    <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">
                      {form.status ? 'Active Faculty' : 'Inactive'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      name="status"
                      type="checkbox"
                      checked={form.status}
                      onChange={handleChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/teachers')}
            >
              Discard changes
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>{isEditing ? 'Confirm Update' : 'Save Record'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeachersForm;
