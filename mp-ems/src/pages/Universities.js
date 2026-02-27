import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import '../styles/DataTable.css';
import './Universities.css';
import { FaEdit, FaPlus } from "react-icons/fa";
import { MdDelete } from "react-icons/md";


const Universities = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', status: true });
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsType, setDetailsType] = useState(null);
  const [detailsList, setDetailsList] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [programForm, setProgramForm] = useState({ name: '', duration_years: 1 });
  const [yearForm, setYearForm] = useState({ year_name: '' });

  // Config State
  const [configLoading, setConfigLoading] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [policyOptions, setPolicyOptions] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);
  const [semesterOptions, setSemesterOptions] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedAcademicYears, setSelectedAcademicYears] = useState([]);
  const [selectedSemesters, setSelectedSemesters] = useState([]);

  useEffect(() => {
    fetchData();
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Fetch Masters
      const masterRes = await fetch('http://localhost:8080/api/masters', { headers });
      if (!masterRes.ok) throw new Error('Failed to fetch master data');
      const masterData = await masterRes.json();
      
      const pOptions = masterData.policies.map(p => ({ value: p.id, label: p.name }));
      const prgOptions = masterData.programs.map(p => ({ value: p.id, label: p.name }));
      const ayOptions = masterData.academicYears.map(ay => ({ value: ay.id, label: ay.year_name }));
      const semOptions = masterData.semesters.map(s => ({ value: s.id, label: s.semester_name }));
      
      setPolicyOptions(pOptions);
      setProgramOptions(prgOptions);
      setAcademicYearOptions(ayOptions);
      setSemesterOptions(semOptions);
    } catch (err) {
      console.error('Error loading master data:', err);
    }
  };

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
      loadRelatedData(selected.id);
      loadConfigData(selected.id);
    } else {
      setForm({ name: '', address: '', status: true });
      setPrograms([]);
      setAcademicYears([]);
      
      setSelectedPolicies([]);
      setSelectedPrograms([]);
      setSelectedAcademicYears([]);
      setSelectedSemesters([]);
    }
  }, [selected]);

  const loadConfigData = async (universityId) => {
    try {
      setConfigLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

      // Fetch Current mapped Config
      const configRes = await fetch(`http://localhost:8080/api/universities/${universityId}/config`, { headers });
      if (!configRes.ok) throw new Error('Failed to fetch university config');
      const configData = await configRes.json();

      setSelectedPolicies(policyOptions.filter(opt => configData.policies.includes(opt.value)));
      setSelectedPrograms(programOptions.filter(opt => configData.programs.includes(opt.value)));
      setSelectedAcademicYears(academicYearOptions.filter(opt => configData.academicYears.includes(opt.value)));
      setSelectedSemesters(semesterOptions.filter(opt => configData.semesters.includes(opt.value)));
    } catch (err) {
      console.error(err);
      alert('Error loading configuration: ' + err.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadRelatedData = async (universityId) => {
    try {
      const token = localStorage.getItem('token');
      const [pRes, aRes] = await Promise.all([
        fetch('http://localhost:8080/api/programs', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:8080/api/academic-years', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const p = pRes.ok ? (await pRes.json()).filter(x => x.university_id === universityId) : [];
      const a = aRes.ok ? (await aRes.json()).filter(x => x.university_id === universityId) : [];
      setPrograms(p);
      setAcademicYears(a);
    } catch (err) {
      console.error('Error loading related data:', err);
    }
  };

  // Removed handleAddCollege and handleDeleteCollege as they are now handled in Colleges.js

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

  const submitConfigPayload = async (univId) => {
    const token = localStorage.getItem('token');
    const payload = {
      policies: selectedPolicies.map(p => p.value),
      programs: selectedPrograms.map(p => p.value),
      academicYears: selectedAcademicYears.map(a => a.value),
      semesters: selectedSemesters.map(s => s.value)
    };
    const res = await fetch(`http://localhost:8080/api/universities/${univId}/config`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to update config');
  };

  const handleSaveConfig = async () => {
    if (!selected) return;
    try {
      setSavingConfig(true);
      await submitConfigPayload(selected.id);
      alert('Configuration updated successfully!');
    } catch (err) {
      alert('Error updating configuration: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.name) return alert('Name is required');
      let finalUniversityId = null;

      if (selected) {
        const res = await fetch(`http://localhost:8080/api/universities/${selected.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Update failed'); }
        finalUniversityId = selected.id;
      } else {
        const res = await fetch('http://localhost:8080/api/universities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(form)
        });
        if (!res.ok) { const t = await res.text(); throw new Error(t || 'Create failed'); }
        const createdUniv = await res.json();
        finalUniversityId = createdUniv.id;
        
        // Colleges are now handled separately on the Colleges page
        await submitConfigPayload(finalUniversityId);
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
      <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',marginBottom:12}}>
        {/* <h1>Universities</h1> */}
        <div>
          <button className="btn-primary" onClick={() => { setSelected(null); setShowModal(true); }} aria-label="Add University">Add University</button>
        </div>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>University Name</th>
            <th>Colleges</th>
            {/* <th>Programs</th>
            <th>Academic Years</th> */}
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
              {/* <td>
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
              </td> */}
              <td>
                <button className="btn-edit" onClick={() => { setSelected(item); setShowModal(true); }} aria-label="Edit"><FaEdit /></button>
                <button className="btn-delete" onClick={() => handleDelete(item.id)} aria-label="Delete"><MdDelete /></button>
                <button className="btn-primary" onClick={() => navigate('/colleges', { state: { universityId: item.id, addMode: true } })} aria-label="Add Colleges"><FaPlus /></button>
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
            
            <div style={{ maxHeight: '72vh', overflowY: 'auto', padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>University Info</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row">
                    <label>Full Name</label>
                    <input type="text" placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label>Address</label>
                    <input type="text" placeholder="Institution Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                  </div>
                  <div className="form-row" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                    <label style={{ marginBottom: 0 }}>Active</label>
                    <div style={{ position: 'relative', width: '44px', height: '24px', borderRadius: '12px', background: form.status ? '#6366f1' : '#e5e7eb', cursor: 'pointer', transition: 'background 0.3s' }} onClick={() => setForm({ ...form, status: !form.status })}>
                      <div style={{ position: 'absolute', top: '2px', left: form.status ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Removed Colleges section from university modal */}



              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Config Mapping</h3>
                {configLoading && selected ? (
                  <p style={{ color: '#6b7280' }}>Loading master mappings...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Policies</label>
                      <Select isMulti options={policyOptions} value={selectedPolicies} onChange={setSelectedPolicies} menuPosition="fixed" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Programs</label>
                      <Select isMulti options={programOptions} value={selectedPrograms} onChange={setSelectedPrograms} menuPosition="fixed" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Academic Years</label>
                      <Select isMulti options={academicYearOptions} value={selectedAcademicYears} onChange={setSelectedAcademicYears} menuPosition="fixed" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, marginBottom: '8px' }}>Semesters</label>
                      <Select isMulti options={semesterOptions} value={selectedSemesters} onChange={setSelectedSemesters} menuPosition="fixed" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f3f4f6', paddingTop: '20px', paddingBottom: '0', marginTop: '0', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                 {/* Empty div to push buttons to right if we don't have something on the left */}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '10px 24px', borderRadius: '6px', backgroundColor: '#f3f4f6', border: 'none', color: '#374151' }}>Cancel</button>
                <button className="btn-primary" onClick={() => handleSave()} style={{ padding: '10px 24px', backgroundColor: '#10b981', display: selected ? 'none' : 'block' }}>Save</button>
                {selected && (
                  <button className="btn-primary" onClick={() => { handleSave(); handleSaveConfig(); }} disabled={savingConfig} style={{ padding: '10px 24px', backgroundColor: '#10b981' }}>
                    {savingConfig ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
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
