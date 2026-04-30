import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate, useParams } from "react-router-dom";
import { ShieldCheck, Check, Hash, FileText, ArrowLeft } from "lucide-react";
import { getApiUrl } from '../config';
import '../styles/FormPage.css';

const PoliciesForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const editingId = id ? parseInt(id) : null;
  const isEditing = Boolean(editingId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (isEditing) fetchPolicyData();
  }, [editingId]);

  const fetchPolicyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/master-policies'), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const item = (result || []).find(p => p.id === editingId);
      
      if (item) {
        setForm({ name: item.name, description: item.description || '' });
      } else {
        throw new Error("Policy not found");
      }
    } catch (err) {
      toast.error(err.message);
      navigate('/policies');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.warning('Policy name is required');
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing 
        ? getApiUrl(`/master-policies/${editingId}`)
        : getApiUrl('/master-policies');
        
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || (isEditing ? 'Update failed' : 'Save failed'));
      }
      
      const result = await res.json();
      toast.success(result.message || (isEditing ? 'Policy updated successfully!' : 'Policy added successfully!'));
      navigate('/policies');
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="form-loading">
      <div className="form-loading__spinner"></div>
      <p className="form-loading__text">Loading Policy Data...</p>
    </div>
  );

  return (
    <div className="form-page">
      <div className="form-card">
        {/* Header */}
        <div className="form-header">
          <div className="form-header__left">
            <button type="button" onClick={() => navigate('/policies')} className="form-header__back">
              <ArrowLeft size={20} />
            </button>
            <div className="form-header__icon">
              <ShieldCheck size={22} />
            </div>
            <div className="form-header__text">
              <h2>{isEditing ? 'Edit Policy' : 'New Policy'}</h2>
              <p>Institutional Rules</p>
            </div>
          </div>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSave}>
          <div className="form-body">
            <div className="form-section">
              <div className="form-section__title"><span>Policy Details</span></div>

              {isEditing && (
                <div className="form-badge" style={{ marginBottom: '1.25rem' }}>
                  <div className="form-badge__icon"><Hash size={18} /></div>
                  <div>
                    <div className="form-badge__label">Entity ID</div>
                    <div className="form-badge__value">POL-{editingId.toString().padStart(3, '0')}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-field">
                  <label className="form-label form-label--required">Policy Name</label>
                  <div className="form-input-wrap">
                    <ShieldCheck size={18} className="form-input-wrap__icon" />
                    <input 
                      type="text" 
                      placeholder="e.g. Anti-Ragging Policy" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="form-input form-input--with-icon"
                      required
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Description (Optional)</label>
                  <div className="form-input-wrap">
                    <FileText size={18} className="form-input-wrap__icon" style={{ top: '1.2rem', transform: 'none' }} />
                    <textarea 
                      placeholder="Details about this policy..." 
                      value={form.description} 
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="form-textarea form-textarea--with-icon"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="form-footer">
            <button type="button" disabled={saving} className="form-btn-cancel" onClick={() => navigate('/policies')}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="form-btn-submit">
              {saving ? <div className="form-spinner"></div> : <Check size={16} />}
              {saving ? 'Saving...' : (isEditing ? 'Update Policy' : 'Create Policy')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoliciesForm;
