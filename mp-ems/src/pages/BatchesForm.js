import React, { useState, useEffect } from "react";
import { masterDataApi } from '../api/masterDataApi';
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import Select from "react-select";
import { Calendar, ArrowLeft, Check, Hash, Layers, Settings } from "lucide-react";
import '../styles/FormPage.css';

const BatchesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [policies, setPolicies] = useState([]);
  
  const [form, setForm] = useState({ 
    batch_name: '', start_date: '', end_date: '',
    start_year: '', end_year: '',
    policy_id: null, import_fees_flag: 'N', program_id: null
  });

  useEffect(() => { fetchFormData(); }, [id]);

  useEffect(() => {
    // Dynamic batch name calculation
    if (form.start_year && form.program_id && form.program_id.duration_years) {
      const endYear = parseInt(form.start_year) + parseInt(form.program_id.duration_years);
      setForm(prev => ({
        ...prev,
        end_year: endYear,
        batch_name: `${form.start_year}-${endYear}`
      }));
    } else {
      setForm(prev => ({ ...prev, end_year: '', batch_name: '' }));
    }
  }, [form.start_year, form.program_id]);

  const fetchFormData = async () => {
    try {
      const [progRes, polRes] = await Promise.all([
        masterDataApi.getPrograms(),
        masterDataApi.getPolicies()
      ]);
      
      let progsData = [], polsData = [];
      if (progRes) {
        progsData = progRes.map(p => ({ value: p.id, label: p.name, duration_years: p.duration_years }));
        setPrograms(progsData);
      }
      if (polRes) {
        polsData = polRes.map(p => ({ value: p.id, label: p.name }));
        setPolicies(polsData);
      }
      
      if (isEditing) await loadBatch(id, progsData, polsData);
    } catch (err) {
      console.error(err);
      if (isEditing) setLoading(false);
    }
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadBatch = async (batchId, loadedPrograms, loadedPolicies) => {
    try {
      const data = await masterDataApi.getBatches();
      const item = data.find(p => p.id.toString() === batchId);
      
      if (item) {
        const selectedProg = loadedPrograms.find(p => p.value === item.program_id) || null;
        const selectedPol = loadedPolicies.find(p => p.value === item.policy_id) || null;
        
        setForm({ 
          batch_name: item.batch_name || '', 
          start_year: item.start_year || '',
          end_year: item.end_year || '',
          start_date: toInputDate(item.start_date), 
          end_date: toInputDate(item.end_date),
          policy_id: selectedPol,
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
      const payload = { 
        ...form,
        batch_name: form.batch_name,
        program_id: form.program_id?.value,
        policy_id: form.policy_id?.value,
        academic_year: null
      };

      let result;
      if (isEditing) {
        result = await masterDataApi.updateBatch(id, payload);
      } else {
        result = await masterDataApi.createBatch(payload);
      }
      
      toast.success(result.message || (isEditing ? 'Batch updated successfully!' : 'Batch added successfully!'));
      navigate('/batches');
    } catch (err) {
      toast.error('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const DateInput = ({ value, onChange, className }) => {
    const [isFocused, setIsFocused] = useState(false);
  
    const displayValue = value && !isFocused ? 
      `${value.split('-')[2]}-${value.split('-')[1]}-${value.split('-')[0]}` : 
      value;
  
    return (
      <input 
        type={isFocused ? "date" : (value ? "text" : "date")}
        value={displayValue}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={className}
      />
    );
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Batch Details...</p>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/batches')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <Layers size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Edit Batch' : 'New Batch'}</h2>
              <p>Batch Configuration</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            {isEditing && (
              <div className="form-badge" style={{ marginBottom: '1.5rem' }}>
                <div className="form-badge__icon"><Hash size={18} /></div>
                <div>
                  <div className="form-badge__label">Internal ID</div>
                  <div className="form-badge__value">BATCH-{id.padStart(4, '0')}</div>
                </div>
              </div>
            )}

            <div className="form-section">
              <div className="form-section__title"><span>Batch Identity</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label form-label--required">Course / Program</label>
                  <Select options={programs} value={form.program_id} 
                    onChange={(opt) => setForm({ ...form, program_id: opt })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Program..." />
                </div>
                <div className="form-field">
                  <label className="form-label form-label--required">Start Year (Admission Year)</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <input type="number" value={form.start_year} min="1990" max="2100"
                      onChange={(e) => setForm({ ...form, start_year: e.target.value })} 
                      placeholder="e.g. 2016"
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Calculated End Year</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <input type="number" value={form.end_year} readOnly
                      placeholder="Auto-calculated from program"
                      className="form-input form-input--with-icon bg-slate-50 text-slate-500 font-medium" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label form-label--required">Batch Name</label>
                  <div className="form-input-wrap">
                    <Hash size={18} className="form-input-wrap__icon" />
                    <input type="text" value={form.batch_name} readOnly
                      placeholder="Auto-generated (e.g. 2016-2020)"
                      className="form-input form-input--with-icon bg-slate-50 text-slate-500 font-bold" />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Configuration & Settings</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label form-label--required">Educational Policy</label>
                  <Select options={policies} value={form.policy_id} 
                    onChange={(opt) => setForm({ ...form, policy_id: opt })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Policy..." />
                </div>
                <div className="form-field">
                  <label className="form-label">Start Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <DateInput value={form.start_date} 
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">End Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <DateInput value={form.end_date} 
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                {/* <div className="form-field">
                  <label className="form-label">Import Fees?</label>
                  <div className="form-input-wrap">
                    <Settings size={18} className="form-input-wrap__icon" />
                    <select value={form.import_fees_flag} 
                      onChange={(e) => setForm({ ...form, import_fees_flag: e.target.value })} 
                      className="form-select form-select--with-icon">
                      <option value="Y">Yes (Y)</option>
                      <option value="N">No (N)</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                </div> */}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" className="form-btn-cancel" onClick={() => navigate('/batches')}>
              Discard
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={16} />}
              {saving ? 'Saving...' : (isEditing ? 'Update Batch' : 'Create Batch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BatchesForm;
