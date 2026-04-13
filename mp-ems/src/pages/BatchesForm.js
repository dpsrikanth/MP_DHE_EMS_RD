import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from 'react-toastify';
import Select from "react-select";
import { Calendar, ArrowLeft, Check, Hash, Layers, Settings } from "lucide-react";
import '../styles/FormPage.css';

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
    batch_name: null, start_date: '', end_date: '',
    academic_year: null, import_fees_flag: 'N', program_id: null
  });

  useEffect(() => { fetchFormData(); }, [id]);

  const fetchFormData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [progRes, yearRes] = await Promise.all([
        fetch('http://localhost:8080/api/master-programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      let progsData = [], yearsData = [];
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
      if (isEditing) await loadBatch(id, progsData, yearsData);
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
                  <label className="form-label form-label--required">Batch Name</label>
                  <Select options={batchNameOptions} value={form.batch_name} 
                    onChange={(opt) => setForm({ ...form, batch_name: opt })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Batch..." />
                </div>
                <div className="form-field">
                  <label className="form-label form-label--required">Course / Program</label>
                  <Select options={programs} value={form.program_id} 
                    onChange={(opt) => setForm({ ...form, program_id: opt })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Program..." />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section__title"><span>Schedule</span></div>
              <div className="form-grid form-grid--2">
                <div className="form-field">
                  <label className="form-label">Start Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <input type="date" value={form.start_date} 
                      onChange={(e) => setForm({ ...form, start_date: e.target.value })} 
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">End Date</label>
                  <div className="form-input-wrap">
                    <Calendar size={18} className="form-input-wrap__icon" />
                    <input type="date" value={form.end_date} 
                      onChange={(e) => setForm({ ...form, end_date: e.target.value })} 
                      className="form-input form-input--with-icon" />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Academic Year</label>
                  <Select options={academicYears} value={form.academic_year} 
                    onChange={(opt) => setForm({ ...form, academic_year: opt })} 
                    className="form-react-select" classNamePrefix="react-select" placeholder="Select Year..." />
                </div>
                <div className="form-field">
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
                </div>
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
