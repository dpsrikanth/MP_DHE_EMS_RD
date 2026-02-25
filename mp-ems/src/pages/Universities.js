import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';
import './Universities.css';

const Universities = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', status: true });
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState(null);
  const [detailsList, setDetailsList] = useState([]);
  const [modalTab, setModalTab] = useState('info');
  const [colleges, setColleges] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [collegeForm, setCollegeForm] = useState({ name: '', address: '' });
  const [programForm, setProgramForm] = useState({ name: '', duration_years: 1 });
  const [yearForm, setYearForm] = useState({ year_name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const data = await response.json();
      setData(data || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selected) {
      setForm({ name: selected.name || selected.university_name || '', address: selected.address || '', status: selected.status === undefined ? true : selected.status });
      setModalTab('info');
      loadRelatedData(selected.id);
    } else {
      setForm({ name: '', address: '', status: true });
      setColleges([]);
      setPrograms([]);
      setAcademicYears([]);
    }
  }, [selected]);

  const loadRelatedData = async (universityId) => {
    try {
      const token = localStorage.getItem('token');
      const [cRes, pRes, aRes] = await Promise.all([
        fetch('http://localhost:8080/api/colleges', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const c = cRes.ok ? (await cRes.json()).filter(x => x.university_id === universityId) : [];
      const p = pRes.ok ? (await pRes.json()).filter(x => x.university_id === universityId) : [];
      const a = aRes.ok ? (await aRes.json()).filter(x => x.university_id === universityId) : [];
      setColleges(c);
      setPrograms(p);
      setAcademicYears(a);
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  };

  const handleAddCollege = async () => {
    if (!collegeForm.name) return alert('College name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...collegeForm, university_id: selected.id })
      });
      if (!res.ok) throw new Error('Failed to add college');
      const newCollege = await res.json();
      setColleges([...colleges, newCollege]);
      setCollegeForm({ name: '', address: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!window.confirm('Delete this college?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/colleges/${collegeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setColleges(colleges.filter(c => c.id !== collegeId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddProgram = async () => {
    if (!programForm.name || !programForm.duration_years) return alert('Name and duration are required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...programForm, university_id: selected.id })
      });
      if (!res.ok) throw new Error('Failed to add program');
      const newProgram = await res.json();
      setPrograms([...programs, newProgram]);
      setProgramForm({ name: '', duration_years: 1 });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (!window.confirm('Delete this program?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/programs/${programId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setPrograms(programs.filter(p => p.id !== programId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAddYear = async () => {
    if (!yearForm.year_name) return alert('Year name is required');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...yearForm, university_id: selected.id })
      });
      if (!res.ok) throw new Error('Failed to add year');
      const newYear = await res.json();
      setAcademicYears([...academicYears, newYear]);
      setYearForm({ year_name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDeleteYear = async (yearId) => {
    if (!window.confirm('Delete this academic year?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/academic-years/${yearId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete');
      setAcademicYears(academicYears.filter(y => y.id !== yearId));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.name) return alert('Name is required');
      if (selected) {
        const res = await fetch(`http://localhost:8080/api/universities/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Update failed'); }
      } else {
        const res = await fetch('http://localhost:8080/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Create failed'); }
      }
      setShowModal(false);
      setSelected(null);
      await fetchData();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this university?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/universities/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { const t = await res.text(); throw new Error(t || 'Delete failed'); }
      await fetchData();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const showDetails = async (university, type) => {
    try {
      const token = localStorage.getItem('token');
      let url = '';
      if (type === 'colleges') url = 'http://localhost:8080/api/colleges';
      else if (type === 'programs') url = 'http://localhost:8080/api/programs';
      else if (type === 'academic_years') url = 'http://localhost:8080/api/academic-years';
      
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API Error: ${text}`);
      }
      const allData = await res.json();
      console.log(`Fetched ${type}:`, allData);
      console.log(`Filtering for university_id: ${university.id}`);
      
      const filtered = allData.filter(item => {
        const match = item.university_id === university.id;
        console.log(`Item:`, item, `Match: ${match}`);
        return match;
      });
      
      console.log(`Filtered results:`, filtered);
      setDetailsList(filtered);
      setDetailsType(type);
      setDetailsModal(true);
    } catch (err) {
      console.error('Error in showDetails:', err);
      alert('Error: ' + (err.message || err));
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <h1>Universities</h1>
        <div>
          <button className="btn-primary" onClick={() => { setSelected(null); setShowModal(true); }}>Add University</button>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>University Name</th>
            <th>Colleges</th>
            <th>Programs</th>
            <th>Academic Years</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.name}</td>
              <td>
                {item.colleges_count > 0 ? (
                  <button className="btn-link" onClick={() => showDetails(item, 'colleges')}>
                    {item.colleges_count} Colleges
                  </button>
                ) : (
                  <span>-</span>
                )}
              </td>
              <td>
                {item.programs_count > 0 ? (
                  <button className="btn-link" onClick={() => showDetails(item, 'programs')}>
                    {item.programs_count} Programs
                  </button>
                ) : (
                  <span>-</span>
                )}
              </td>
              <td>
                {item.academic_years_count > 0 ? (
                  <button className="btn-link" onClick={() => showDetails(item, 'academic_years')}>
                    {item.academic_years_count} Years
                  </button>
                ) : (
                  <span>-</span>
                )}
              </td>
              <td>
                <button className="btn-edit" onClick={() => { setSelected(item); setShowModal(true); }}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div className="modal-title">{selected ? 'Edit University' : 'Add University'}</div>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '12px' }}>
              <button 
                onClick={() => setModalTab('info')}
                style={{ padding: '10px 16px', borderBottom: modalTab === 'info' ? '2px solid #2563eb' : 'none', color: modalTab === 'info' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
              >
                University Info
              </button>
              <button 
                onClick={() => setModalTab('colleges')}
                style={{ padding: '10px 16px', borderBottom: modalTab === 'colleges' ? '2px solid #2563eb' : 'none', color: modalTab === 'colleges' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', opacity: selected ? 1 : 0.5 }}
              >
                Colleges ({colleges.length})
              </button>
              <button 
                onClick={() => setModalTab('programs')}
                style={{ padding: '10px 16px', borderBottom: modalTab === 'programs' ? '2px solid #2563eb' : 'none', color: modalTab === 'programs' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', opacity: selected ? 1 : 0.5 }}
              >
                Programs ({programs.length})
              </button>
              <button 
                onClick={() => setModalTab('years')}
                style={{ padding: '10px 16px', borderBottom: modalTab === 'years' ? '2px solid #2563eb' : 'none', color: modalTab === 'years' ? '#2563eb' : '#6b7280', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600', opacity: selected ? 1 : 0.5 }}
              >
                Academic Years ({academicYears.length})
              </button>
            </div>

            {modalTab === 'info' && (
              <div className="modal-body">
                <div className="form-row">
                  <label>University Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-row">
                  <label>Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-row">
                  <label>Status</label>
                  <select value={form.status ? 'true' : 'false'} onChange={(e) => setForm({ ...form, status: e.target.value === 'true' })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {modalTab === 'colleges' && (
              <div style={{ padding: '14px' }}>
                {!selected ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Please save the university first to add colleges</p>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div className="form-row">
                        <label>Add College</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder="College Name" value={collegeForm.name} onChange={(e) => setCollegeForm({ ...collegeForm, name: e.target.value })} style={{ flex: 1 }} />
                          <input type="text" placeholder="Address" value={collegeForm.address} onChange={(e) => setCollegeForm({ ...collegeForm, address: e.target.value })} style={{ flex: 1 }} />
                          <button className="btn-primary" onClick={handleAddCollege}>Add</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      {colleges.length === 0 ? <div>No colleges added yet</div> : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {colleges.map(c => (
                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                              <div>
                                <div style={{ fontWeight: '600' }}>{c.college_name || c.name}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{c.address}</div>
                              </div>
                              <button className="btn-delete" onClick={() => handleDeleteCollege(c.id)}>Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {modalTab === 'programs' && (
              <div style={{ padding: '14px' }}>
                {!selected ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Please save the university first to add programs</p>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div className="form-row">
                        <label>Add Program</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder="Program Name" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} style={{ flex: 1 }} />
                          <input type="number" placeholder="Duration (years)" value={programForm.duration_years} onChange={(e) => setProgramForm({ ...programForm, duration_years: parseInt(e.target.value) })} style={{ width: '120px' }} />
                          <button className="btn-primary" onClick={handleAddProgram}>Add</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      {programs.length === 0 ? <div>No programs added yet</div> : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {programs.map(p => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                              <div>
                                <div style={{ fontWeight: '600' }}>{p.name}</div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>{p.duration_years} years</div>
                              </div>
                              <button className="btn-delete" onClick={() => handleDeleteProgram(p.id)}>Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {modalTab === 'years' && (
              <div style={{ padding: '14px' }}>
                {!selected ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>Please save the university first to add academic years</p>
                ) : (
                  <>
                    <div style={{ marginBottom: '12px' }}>
                      <div className="form-row">
                        <label>Add Academic Year</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input type="text" placeholder="Year Name (e.g., 2023-24)" value={yearForm.year_name} onChange={(e) => setYearForm({ ...yearForm, year_name: e.target.value })} style={{ flex: 1 }} />
                          <button className="btn-primary" onClick={handleAddYear}>Add</button>
                        </div>
                      </div>
                    </div>
                    <div>
                      {academicYears.length === 0 ? <div>No academic years added yet</div> : (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {academicYears.map(y => (
                            <div key={y.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                              <div style={{ fontWeight: '600' }}>{y.year_name}</div>
                              <button className="btn-delete" onClick={() => handleDeleteYear(y.id)}>Delete</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              {modalTab === 'info' && (
                <button className="btn-primary" onClick={() => handleSave()}>{selected ? 'Update' : 'Create'}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {detailsModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">
                {detailsType === 'colleges' ? 'Colleges' : detailsType === 'programs' ? 'Programs' : 'Academic Years'}
              </div>
              <button className="btn-secondary" onClick={() => setDetailsModal(false)}>Close</button>
            </div>
            <div style={{ padding: '14px', maxHeight: '400px', overflowY: 'auto' }}>
              {detailsList.length === 0 ? (
                <div>No data available</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {detailsList.map((item) => (
                    <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                      {item.college_name || item.name || item.year_name || 'Unknown'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Universities;
