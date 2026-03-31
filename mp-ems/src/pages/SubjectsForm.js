import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { 
  Book, 
  Check,
  Calendar,
  Layers,
  FileCheck,
  BookOpen,
  Code,
  ArrowLeft,
  X
} from "lucide-react";

const SubjectsForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errorString, setErrorString] = useState('');

  // Master Data
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState({
    name: '',
    subject_code: '',
    department_ids: [],
    program_id: null,
    semester_id: null,
    teacher_id: null,
    mapping_type: null,
    is_mandatory: null,
    has_examination: true,
    periods_per_week: 6,
    credit: 4
  });

  const mappingTypes = [
    { value: 'Major 1', label: 'Major 1' },
    { value: 'Major 2', label: 'Major 2' },
    { value: 'Major', label: 'Major' },
    { value: 'Minor', label: 'Minor' },
    { value: 'Elective', label: 'Elective' },
    { value: 'Vocational', label: 'Vocational' },
    { value: 'FC-1', label: 'FC-1' },
    { value: 'FC-2', label: 'FC-2' },
    { value: 'FP/Int/Appr', label: 'FP/Int/Appr' },
    { value: 'AEC', label: 'AEC' },
    { value: 'SEC', label: 'SEC' },
    { value: 'VBC', label: 'VBC' },
    { value: 'English Literature', label: 'English Literature' },
    { value: 'Hindi Literature', label: 'Hindi Literature' },
  ];

  const mandatoryOptions = [
    { value: 'M', label: 'Mandatory (M)' },
    { value: 'E', label: 'Elective (E)' }
  ];

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      const h = { Authorization: `Bearer ${token}` };
      
      const [progRes, semRes, teaRes, depRes] = await Promise.all([
        fetch('http://localhost:8080/api/master-programs', { headers: h }),
        fetch('http://localhost:8080/api/master-semesters', { headers: h }),
        fetch('http://localhost:8080/api/master-teachers', { headers: h }),
        fetch('http://localhost:8080/api/master-departments', { headers: h })
      ]);

      let depsData = [], progsData = [], semsData = [], teasData = [];

      if (progRes.ok) progsData = (await progRes.json()).map(p => ({ value: p.id, label: p.name }));
      if (semRes.ok) semsData = (await semRes.json()).map(s => ({ value: s.id, label: s.semester_name }));
      if (teaRes.ok) teasData = (await teaRes.json()).map(t => ({ value: t.id, label: t.name }));
      if (depRes.ok) depsData = (await depRes.json()).map(d => ({ value: d.id, label: d.department_name }));

      setPrograms(progsData);
      setSemesters(semsData);
      setTeachers(teasData);
      setDepartments(depsData);

      if (!isEditing) {
        setForm(prev => ({
          ...prev,
          mapping_type: mappingTypes[0],
          is_mandatory: mandatoryOptions[0]
        }));
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
      const token = localStorage.getItem('token');
      const resp = await fetch(`http://localhost:8080/api/master-subjects/${subjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!resp.ok) throw new Error('Failed to fetch subject details');

      const item = await resp.json();
      
      setForm({
        name: item.name,
        subject_code: item.subject_code,
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

    setSaving(true);
    setErrorString('');
    
    try {
      const token = localStorage.getItem('token');
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
      
      const url = isEditing 
        ? `http://localhost:8080/api/master-subjects/${id}` 
        : 'http://localhost:8080/api/master-subjects';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(isEditing ? 'Update failed' : 'Save failed');
      
      toast.success(isEditing ? 'Subject updated successfully!' : 'Subject added successfully!');
      navigate('/subjects');
    } catch (err) {
      setErrorString(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: '#f8fafc',
      borderColor: '#f1f5f9',
      borderWidth: '2px',
      borderRadius: '1rem',
      padding: '0.2rem',
      transition: 'all 0.2s ease',
      minHeight: '56px',
      '&:hover': {
        borderColor: '#e2e8f0',
        backgroundColor: '#fff'
      }
    }),
    option: (base, { isSelected, isFocused }) => ({
      ...base,
      backgroundColor: isSelected ? '#amber-600' : isFocused ? '#fff7ed' : 'white',
      color: isSelected ? 'white' : '#1e293b',
      padding: '0.75rem 1rem',
      fontSize: '0.875rem',
      fontWeight: '500',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#d97706'
      }
    })
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-12">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/subjects')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <BookOpen size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Subject' : 'New Subject Entry'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-70">
                Unified Subject Detail
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-10 bg-slate-50/30">
            {errorString && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
                <X size={18} /> {errorString}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Name</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Book size={20} /></div>
                    <input 
                      type="text" 
                      placeholder="e.g. Operating Systems" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      className="w-full bg-white shadow-sm border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-amber-500 outline-none transition-all font-semibold" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Code</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 z-10"><Code size={20} /></div>
                    <input 
                      type="text" 
                      placeholder="e.g. CS101" 
                      value={form.subject_code} 
                      onChange={(e) => setForm({ ...form, subject_code: e.target.value })} 
                      className="w-full bg-white shadow-sm border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-amber-500 outline-none transition-all font-bold uppercase" 
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Departments</label>
                  <Select 
                    isMulti 
                    options={departments} 
                    value={form.department_ids} 
                    onChange={(v) => setForm({ ...form, department_ids: v || [] })} 
                    styles={customSelectStyles} 
                    placeholder="Select Departments..." 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Teacher</label>
                  <Select 
                    options={teachers} 
                    isClearable 
                    value={form.teacher_id} 
                    onChange={(v) => setForm({ ...form, teacher_id: v })} 
                    styles={customSelectStyles} 
                    placeholder="Select Teacher (Optional)..." 
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Program / Course</label>
                  <Select 
                    options={programs} 
                    isClearable 
                    value={form.program_id} 
                    onChange={(v) => setForm({ ...form, program_id: v })} 
                    styles={customSelectStyles} 
                    placeholder="Select Program..." 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                  <Select 
                    options={semesters} 
                    isClearable 
                    value={form.semester_id} 
                    onChange={(v) => setForm({ ...form, semester_id: v })} 
                    styles={customSelectStyles} 
                    placeholder="Select Semester..." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Requirement</label>
                    <Select 
                      options={mandatoryOptions} 
                      value={form.is_mandatory} 
                      onChange={(v) => setForm({ ...form, is_mandatory: v })} 
                      styles={customSelectStyles} 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Mapping Type</label>
                    <Select 
                      options={mappingTypes} 
                      value={form.mapping_type} 
                      onChange={(v) => setForm({ ...form, mapping_type: v })} 
                      styles={customSelectStyles} 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Examination</label>
                    <button 
                      type="button"
                      onClick={() => setForm({...form, has_examination: !form.has_examination})}
                      className={`w-full py-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                        form.has_examination ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                      }`}
                    >
                      {form.has_examination ? <FileCheck size={20} /> : <X size={20} />}
                      <span className="text-[10px] font-bold uppercase">{form.has_examination ? 'Required' : 'None'}</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Periods/Week</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"><Calendar size={20} /></div>
                      <input 
                        type="number" 
                        value={form.periods_per_week} 
                        onChange={(e) => setForm({...form, periods_per_week: parseInt(e.target.value) || 0})}
                        className="w-full bg-white shadow-sm border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-amber-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Credits</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500"><Layers size={20} /></div>
                      <input 
                        type="number" 
                        value={form.credit} 
                        onChange={(e) => setForm({...form, credit: parseInt(e.target.value) || 0})}
                        className="w-full bg-white shadow-sm border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-amber-500 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/subjects')}
            >
              Discard changes
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-xl shadow-amber-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
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

export default SubjectsForm;
