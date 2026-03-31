import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate, useParams } from "react-router-dom";
import {
  GraduationCap, Plus, Pencil, X, Check, User, BookOpen, Calendar, Layers, FileText,
  ShieldAlert, Building2, Eye, Mail, Phone, MapPin, IdCard, Droplet, Hash, Activity, Shield, ArrowLeft
} from "lucide-react";

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

  useEffect(() => {
    fetchDropdownData().then((colls) => {
      if (isEditing) {
        fetchStudentData(colls);
      }
    });
  }, [id]);

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
      if (collegeRes.ok) {
          loadedColleges = await collegeRes.json() || [];
          setColleges(loadedColleges);
      }
      return loadedColleges;
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
      return [];
    } finally {
      setDropdownLoading(false);
    }
  };

  const fetchCollegeData = async (collegeId) => {
    try {
      if (!collegeId) {
        setCollegeSemesters([]); setCollegePrograms([]); setCollegePolicies([]); setCollegeAcademicYears([]);
        return;
      }
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
    } catch (err) {
      console.error('Error fetching college data:', err);
    } finally {
      setCascadingLoading(false);
    }
  };

  const fetchStudentData = async (colls) => {
      try {
          const token = localStorage.getItem('token');
          const resp = await fetch(`http://localhost:8080/api/students`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          if (resp.ok) {
              const dataList = await resp.json();
              const student = dataList.find(s => s.id.toString() === id.toString());
              if (student) {
                  // Re-format dates
                  if(student.admission_date) student.admission_date = new Date(student.admission_date).toISOString().split('T')[0];
                  if(student.date_of_birth) student.date_of_birth = new Date(student.date_of_birth).toISOString().split('T')[0];

                  setForm({ ...initialFormState, ...student });

                  if (student.collageName) {
                      const collegeObj = colls.find(col => (col.college_name || col.name) === student.collageName);
                      if (collegeObj) await fetchCollegeData(collegeObj.id);
                  }
              } else {
                  throw new Error("Student not found");
              }
          }
      } catch(e) {
          toast.error("Failed to load student details");
          navigate('/students');
      } finally {
          setFetchingUser(false);
      }
  };

  const validate = (f) => {
    const errs = {};
    if (!f.first_name || !f.first_name.trim()) errs.first_name = 'First name is required';
    if (!f.admission_no || !f.admission_no.trim()) errs.admission_no = 'Admission No is required';
    if (!f.policies || !f.policies.trim()) errs.policies = 'Policy is required';
    if (!f.programName || !f.programName.trim()) errs.programName = 'Program is required';
    if (!f.admission_year) errs.admission_year = 'Admission year is required';
    if (!f.semister || !f.semister.trim()) errs.semister = 'Semester is required';

    if (f.email && !/^[^s@]+@[^s@]+.[^s@]+$/.test(f.email)) errs.email = 'Invalid email';
    if (f.contactNumber && !/^d{10}$/.test(f.contactNumber)) errs.contactNumber = 'Contact must be 10 digits';
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
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setErrorString("Validation failed. Please check the form.");
      toast.error("Please fill all required fields correctly.");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setErrorString('');
    const token = localStorage.getItem('token');
    try {
      const url = isEditing ? `http://localhost:8080/api/students/${id}` : 'http://localhost:8080/api/students';
      const method = isEditing ? 'PUT' : 'POST';
      const resp = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });

      const text = await resp.text();
      let respData = {};
      try { respData = JSON.parse(text); } catch (e) { }

      if (!resp.ok) throw new Error(respData.message || text || `Failed to ${isEditing ? 'update' : 'enroll'}`);

      toast.success(respData.message || `Student ${isEditing ? 'updated' : 'enrolled'} successfully!`);
      navigate('/students');
    } catch (err) {
      setErrorString(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUser || dropdownLoading) {
      return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigate('/students')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <GraduationCap size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Student Details' : 'Enroll New Student'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <GraduationCap size={16} /> Student Enrollment System
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
              {errorString && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2">
                  <ShieldAlert size={18} /> {errorString}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name (Req)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="first_name"
                      value={form.first_name}
                      onChange={handleChange}
                      placeholder="e.g. Sriram"
                      className={`w-full bg-slate-50 border-2 ${errors.first_name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.first_name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.first_name}</p>}
                </div>

                {/* Last Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="last_name"
                      value={form.last_name}
                      onChange={handleChange}
                      placeholder="e.g. Kumar"
                      className={`w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                </div>

                {/* Student Full Name (Legacy) */}
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name (Legacy)</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Sriram Kumar"
                      className={`w-full bg-slate-50 border-2 ${errors.name ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
                </div>

                {/* Admission No */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission No</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="admission_no"
                      value={form.admission_no}
                      onChange={handleChange}
                      placeholder="e.g. 25C00713"
                      className={`w-full bg-slate-50 border-2 ${errors.admission_no ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.admission_no && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.admission_no}</p>}
                </div>

                {/* Date of Birth */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={form.date_of_birth}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Batch */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      name="batch"
                      value={form.batch}
                      onChange={handleChange}
                      placeholder="e.g. I Year"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Section */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <input
                      name="section"
                      value={form.section}
                      onChange={handleChange}
                      placeholder="e.g. Economics"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* College */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">College Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="collageName"
                      value={form.collageName}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="">-- Select College --</option>
                      {colleges.map((college) => (
                        <option key={college.id} value={college.college_name || college.name}>
                          {college.college_name || college.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Policy */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Policy</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="policies"
                      value={form.policies}
                      onChange={handleChange}
                      disabled={!form.collageName}
                      className={`w-full bg-slate-50 border-2 ${errors.policies ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">{form.collageName ? '-- Select Policy --' : '-- Select College First --'}</option>
                      {collegePolicies.map((policy) => (
                        <option key={policy.id} value={policy.name}>
                          {policy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.policies && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.policies}</p>}
                </div>

                {/* Program */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program</label>
                  <div className="relative">
                    <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="programName"
                      value={form.programName}
                      onChange={handleChange}
                      disabled={!form.collageName}
                      className={`w-full bg-slate-50 border-2 ${errors.programName ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">{form.collageName ? '-- Select Program --' : '-- Select College First --'}</option>
                      {collegePrograms.map((program) => (
                        <option key={program.id} value={program.name}>
                          {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.programName && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.programName}</p>}
                </div>

                {/* Admission Year */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Admission Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="admission_year"
                      value={form.admission_year}
                      onChange={handleChange}
                      disabled={!form.collageName}
                      className={`w-full bg-slate-50 border-2 ${errors.admission_year ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">{form.collageName ? '-- Select Academic Year --' : '-- Select College First --'}</option>
                      {collegeAcademicYears.map((year) => (
                        <option key={year.id} value={year.year_name}>
                          {year.year_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.admission_year && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.admission_year}</p>}
                </div>

                {/* Semester */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="semister"
                      value={form.semister}
                      onChange={handleChange}
                      disabled={!form.collageName}
                      className={`w-full bg-slate-50 border-2 ${errors.semister ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">{form.collageName ? '-- Select Semester --' : '-- Select College First --'}</option>
                      {collegeSemesters.map((semester) => (
                        <option key={semester.id} value={semester.semester_name}>
                          {semester.semester_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.semister && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.semister}</p>}
                </div>



                {/* Roll Number */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Roll Number</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="rollnumber"
                      value={form.rollnumber}
                      onChange={handleChange}
                      placeholder="e.g. 101"
                      className={`w-full bg-slate-50 border-2 ${errors.rollnumber ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.rollnumber && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.rollnumber}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="e.g. student@example.com"
                      className={`w-full bg-slate-50 border-2 ${errors.email ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
                </div>

                {/* Contact Number */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className={`w-full bg-slate-50 border-2 ${errors.contactNumber ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.contactNumber && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.contactNumber}</p>}
                </div>

                {/* Father Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father's Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="fatherName"
                      value={form.fatherName}
                      onChange={handleChange}
                      placeholder="e.g. Raj Kumar"
                      className={`w-full bg-slate-50 border-2 ${errors.fatherName ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.fatherName && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.fatherName}</p>}
                </div>

                {/* Aadhar Number */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhar Number</label>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      name="adharnumber"
                      value={form.adharnumber}
                      onChange={handleChange}
                      placeholder="e.g. 1234-5678-9012"
                      className={`w-full bg-slate-50 border-2 ${errors.adharnumber ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold`}
                    />
                  </div>
                  {errors.adharnumber && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.adharnumber}</p>}
                </div>

                {/* Blood Group */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                  <div className="relative">
                    <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    <select
                      name="bloodgroup"
                      value={form.bloodgroup}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 focus:bg-white outline-none transition-all font-bold appearance-none cursor-pointer"
                    >
                      <option value="">-- Select Blood Group --</option>
                      {bloodGroups.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>


                {/* Middle Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Middle Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="middle_name"
                      value={form.middle_name}
                      onChange={handleChange}
                      placeholder="e.g. Singh"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      placeholder="e.g. Male/Female"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="relative">
                    <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="student_status"
                      value={form.student_status}
                      onChange={handleChange}
                      placeholder="e.g. Active"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* RTE */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">RTE</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="rte"
                      value={form.rte}
                      onChange={handleChange}
                      placeholder="e.g. Yes/No"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Birth Place */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Place</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="birth_place"
                      value={form.birth_place}
                      onChange={handleChange}
                      placeholder="e.g. Bhopal"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Hostel/Day Scholar */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Hostel/Day Scholar</label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="hostel_or_day_scholar"
                      value={form.hostel_or_day_scholar}
                      onChange={handleChange}
                      placeholder="e.g. Day/Hostel"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Language</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="language"
                      value={form.language}
                      onChange={handleChange}
                      placeholder="e.g. Hindi"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Secondary Phone */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Secondary Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* SMS Enabled */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">SMS Enabled</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="sms_enabled"
                      value={form.sms_enabled}
                      onChange={handleChange}
                      placeholder="e.g. Yes/No"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* EMS Enabled */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">EMS Enabled</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="ems_enabled"
                      value={form.ems_enabled}
                      onChange={handleChange}
                      placeholder="e.g. Yes/No"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Address Line 1 */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Address Line 1</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="address_line_1"
                      value={form.address_line_1}
                      onChange={handleChange}
                      placeholder="e.g. 123 Main St"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* City */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Bhopal"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* State */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="e.g. Madhya Pradesh"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Country */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      placeholder="e.g. India"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Pin Code */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Pin Code</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="pin_code"
                      value={form.pin_code}
                      onChange={handleChange}
                      placeholder="e.g. 462001"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father First Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="father_first_name"
                      value={form.father_first_name}
                      onChange={handleChange}
                      placeholder="e.g. Raj"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father Last Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="father_last_name"
                      value={form.father_last_name}
                      onChange={handleChange}
                      placeholder="e.g. Kumar"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father Mobile */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="father_mobile_phone"
                      value={form.father_mobile_phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father Email */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      name="father_address_email"
                      value={form.father_address_email}
                      onChange={handleChange}
                      placeholder="e.g. father@example.com"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father State */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father State</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="father_state"
                      value={form.father_state}
                      onChange={handleChange}
                      placeholder="e.g. MP"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Father Pin Code */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Father Pin Code</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="father_pin_code"
                      value={form.father_pin_code}
                      onChange={handleChange}
                      placeholder="e.g. 462001"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother First Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother First Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="mother_first_name"
                      value={form.mother_first_name}
                      onChange={handleChange}
                      placeholder="e.g. Sita"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother Last Name */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother Last Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="mother_last_name"
                      value={form.mother_last_name}
                      onChange={handleChange}
                      placeholder="e.g. Devi"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother Mobile */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother Mobile</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="mother_mobile_phone"
                      value={form.mother_mobile_phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother Email */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      name="mother_address_email"
                      value={form.mother_address_email}
                      onChange={handleChange}
                      placeholder="e.g. mother@example.com"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother State */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother State</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="mother_state"
                      value={form.mother_state}
                      onChange={handleChange}
                      placeholder="e.g. MP"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>

                {/* Mother Pin Code */}
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mother Pin Code</label>
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input

                      name="mother_pin_code"
                      value={form.mother_pin_code}
                      onChange={handleChange}
                      placeholder="e.g. 462001"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-500 rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                {/* Address */}
                <div className="space-y-2 col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="e.g. 123 Main Street, City, State 12345"
                      className={`w-full bg-slate-50 border-2 ${errors.address ? 'border-red-200 focus:border-red-500' : 'border-slate-100 focus:border-emerald-500'} rounded-2xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:bg-white outline-none transition-all font-bold resize-none`}
                      rows="3"
                    />
                  </div>
                  {errors.address && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.address}</p>}
                </div>

              </div>
            </div>

            {/* Footer */}
            
        </form>
      </div>
    </div>
  );
};
export default StudentsForm;
