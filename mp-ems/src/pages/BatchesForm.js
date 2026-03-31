import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import Select from "react-select";
import { 
  Calendar, 
  ArrowLeft, 
  Check,
  Hash,
  Layers,
  Settings
} from "lucide-react";

const batchNameOptions = [
  { value: 'July-November', label: 'July-November' },
  { value: 'January-June', label: 'January-June' },
  { value: 'Annual', label: 'Annual' },
  { value: 'September-May', label: 'September-May' },
  { value: 'October-February', label: 'October-February' },
  { value: 'March-August', label: 'March-August' }
];

const BatchesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  
  const [form, setForm] = useState({ 
    batch_name: null, 
    start_date: '', 
    end_date: '',
    academic_year: null,
    import_fees_flag: 'N',
    program_id: null
  });

  useEffect(() => {
    fetchFormData();
  }, [id]);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [progRes, yearRes] = await Promise.all([
        fetch('http://localhost:8080/api/master-programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      let progsData = [];
      let yearsData = [];

      if (progRes.ok) {
        const result = await progRes.json();
        progsData = result.map(p => ({ value: p.id, label: p.name }));
        setPrograms(progsData);
      }
      if (yearRes.ok) {
        const result = await yearRes.json();
        yearsData = result.map(y => ({ value: y.year_name, label: y.year_name }));
        setAcademicYears(yearsData);
      }

      if (isEditing) {
        await loadBatch(id, progsData, yearsData);
      }
    } catch (err) {
      console.error(err);
      if (isEditing) setLoading(false);
    }
  };

  const loadBatch = async (batchId, loadedPrograms, loadedYears) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch batches');
      const data = await response.json();
      const item = data.find(p => p.id.toString() === batchId);
      
      if (item) {
        const selectedProg = loadedPrograms.find(p => p.value === item.program_id) || null;
        const selectedBatch = batchNameOptions.find(b => b.value === item.batch_name) || { value: item.batch_name, label: item.batch_name };
        const selectedAY = loadedYears.find(y => y.value === item.academic_year) || { value: item.academic_year, label: item.academic_year };
        
        setForm({ 
          batch_name: selectedBatch, 
          start_date: item.start_date ? item.start_date.split('T')[0] : '', 
          end_date: item.end_date ? item.end_date.split('T')[0] : '',
          academic_year: selectedAY,
          import_fees_flag: item.import_fees_flag || 'N',
          program_id: selectedProg
        });
      } else {
        toast.error('Batch not found');
        navigate('/batches');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.batch_name || !form.program_id) return toast.warning('Batch Name and Program are required');
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const url = isEditing 
        ? `http://localhost:8080/api/master-batches/${id}` 
        : 'http://localhost:8080/api/master-batches';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          ...form,
          batch_name: form.batch_name?.value,
          academic_year: form.academic_year?.value,
          program_id: form.program_id?.value
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Operation failed');
      }
      
      const result = await res.json();
      toast.success(result.message || (isEditing ? 'Batch updated successfully!' : 'Batch added successfully!'));
      navigate('/batches');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center font-bold text-slate-400 animate-pulse">Loading Batch Details...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-5">
            <button 
              type="button"
              onClick={() => navigate('/batches')}
              className="w-12 h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 transition-all"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-14 h-14 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 shadow-inner">
              <Layers size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">
                {isEditing ? 'Update Batch' : 'New Batch'}
              </h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-70">
                Configuration
              </p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col">
          <div className="p-10 space-y-8 bg-slate-50/30">
            {isEditing && (
              <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-100 transition-colors group hover:border-sky-100 shadow-sm max-w-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 group-hover:text-sky-400 transition-all">
                  <Hash size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Internal ID</p>
                  <p className="text-lg font-black text-slate-800 leading-none tracking-tighter">BATCH-{id.padStart(4, '0')}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Name (Required)</label>
                <Select 
                  options={batchNameOptions} 
                  value={form.batch_name} 
                  onChange={(opt) => setForm({ ...form, batch_name: opt })} 
                  className="react-select-container text-base font-semibold shadow-sm" 
                  classNamePrefix="react-select" 
                  placeholder="Select Batch..." 
                  styles={{ control: (base, state) => ({ ...base, padding: '0.6rem', paddingLeft: '0.8rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: '#ffffff', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Course/Program (Required)</label>
                <Select 
                  options={programs} 
                  value={form.program_id} 
                  onChange={(opt) => setForm({ ...form, program_id: opt })} 
                  className="react-select-container text-base font-semibold shadow-sm" 
                  classNamePrefix="react-select" 
                  placeholder="Select Program..." 
                  styles={{ control: (base, state) => ({ ...base, padding: '0.6rem', paddingLeft: '0.8rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: '#ffffff', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-sky-500 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <input 
                    type="date" 
                    value={form.start_date} 
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-sky-500 outline-none transition-all font-bold shadow-sm" 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-sky-500 transition-colors">
                    <Calendar size={20} />
                  </div>
                  <input 
                    type="date" 
                    value={form.end_date} 
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-sky-500 outline-none transition-all font-bold shadow-sm" 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                <Select 
                  options={academicYears} 
                  value={form.academic_year} 
                  onChange={(opt) => setForm({ ...form, academic_year: opt })} 
                  className="react-select-container text-base font-semibold shadow-sm" 
                  classNamePrefix="react-select" 
                  placeholder="Select Year..." 
                  styles={{ control: (base, state) => ({ ...base, padding: '0.6rem', paddingLeft: '0.8rem', borderRadius: '1rem', borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9', borderWidth: '2px', backgroundColor: '#ffffff', boxShadow: 'none', '&:hover': { borderColor: state.isFocused ? '#0ea5e9' : '#f1f5f9' } }) }} 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Import Fees?</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-sky-500 transition-colors">
                    <Settings size={20} />
                  </div>
                  <select 
                    value={form.import_fees_flag} 
                    onChange={(e) => setForm({ ...form, import_fees_flag: e.target.value })} 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-slate-800 focus:border-sky-500 outline-none transition-all font-bold appearance-none cursor-pointer shadow-sm"
                  >
                    <option value="Y">Yes (Y)</option>
                    <option value="N">No (N)</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-end gap-5 sticky bottom-0 z-10">
            <button 
              type="button"
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
              onClick={() => navigate('/batches')}
            >
              Discard changes
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-10 py-4 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-2xl shadow-xl shadow-sky-600/20 transition-all hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 text-sm uppercase tracking-widest flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check size={20} />
                  <span>{isEditing ? 'Update Batch' : 'Create Batch'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchesForm;
