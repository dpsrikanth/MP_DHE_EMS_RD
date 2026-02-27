import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Select from 'react-select';
import '../styles/DataTable.css';
import './Universities.css'; // Reusing modal styles
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const Colleges = () => {
  const location = useLocation();
  const [data, setData] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', college_code: '', address: '', university_id: '' });

  // Config Mapping State
  const [masterData, setMasterData] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [universityConfig, setUniversityConfig] = useState({ policies: [], programs: [], academicYears: [], semesters: [] });
  const [selectedConfig, setSelectedConfig] = useState({
    policies: [],
    programs: [],
    academicYears: [],
    semesters: []
  });
  const [isConfigLoading, setIsConfigLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchUniversities();
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/masters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMasterData(data);
      }
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  };

  const fetchUniversityConfig = async (uId) => {
    if (!uId) {
      setUniversityConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      return;
    }
    try {
      setIsConfigLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/universities/${uId}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUniversityConfig(data);
      }
    } catch (err) {
      console.error('Error fetching university config:', err);
    } finally {
      setIsConfigLoading(false);
    }
  };

  const fetchCollegeConfig = async (cId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/colleges/${cId}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConfig({
          policies: data.policies || [],
          programs: data.programs || [],
          academicYears: data.academicYears || [],
          semesters: data.semesters || []
        });
      }
    } catch (err) {
      console.error('Error fetching college config:', err);
    }
  };

  useEffect(() => {
    if (form.university_id) {
      fetchUniversityConfig(form.university_id);
    }
  }, [form.university_id]);

  useEffect(() => {
    if (selected) {
      fetchCollegeConfig(selected.id);
    } else {
      setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
    }
  }, [selected]);

  useEffect(() => {
    if (location.state && location.state.addMode && location.state.universityId) {
      setSelected(null);
      setForm({ college_name: '', college_code: '', address: '', university_id: location.state.universityId });
      setShowModal(true);
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/universities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUniversities(data || []);
      }
    } catch (err) {
      console.error('Error fetching universities:', err);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!form.name || !form.university_id) {
        return alert('College name and university are required');
      }

      const url = selected 
        ? `http://localhost:8080/api/colleges/${selected.id}` 
        : 'http://localhost:8080/api/colleges';
      const method = selected ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
      });

      if (!response.ok) throw new Error('Failed to save');
      const savedCollege = await response.json();
      const collegeId = selected ? selected.id : savedCollege.id;

      // Save Config Mapping
      await fetch(`http://localhost:8080/api/colleges/${collegeId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(selectedConfig)
      });
      
      setShowModal(false);
      setSelected(null);
      setForm({ name: '', college_code: '', address: '', university_id: '' });
      setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this college?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/colleges/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Delete failed');
      fetchData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const openEditModal = (item) => {
    setSelected(item);
    setForm({
      name: item.college_name || item.name || '',
      college_code: item.college_code || '',
      address: item.address || '',
      university_id: item.university_id
    });
    setShowModal(true);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',marginBottom:12}}>
        {/* <h1>Colleges</h1> */}
        <button className="btn-primary" onClick={() => { 
          setSelected(null); 
          setForm({ name: '', college_code: '', address: '', university_id: '' }); 
          setSelectedConfig({ policies: [], programs: [], academicYears: [], semesters: [] });
          setShowModal(true); 
        }}>
          Add College
        </button>
      </div>
      
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>College Code</th>
            <th>College Name</th>
            <th>University</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.college_code || '-'}</td>
              <td>{item.college_name || item.name}</td>
              <td>{item.university_name || universities.find(u => u.id === item.university_id)?.name || item.university_id}</td>
              <td>
                <button className="btn-edit" onClick={() => openEditModal(item)} aria-label="Edit"><FaEdit /></button>
                <button className="btn-delete" onClick={() => handleDelete(item.id)} aria-label="Delete"><MdDelete /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">{selected ? 'Edit College' : 'Add College'}</div>
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div className="form-row">
                <label>College Name</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  placeholder="Enter college name"
                />
              </div>
              <div className="form-row">
                <label>College Code</label>
                <input 
                  type="number" 
                  value={form.college_code} 
                  onChange={(e) => setForm({ ...form, college_code: e.target.value })} 
                  placeholder="Enter college code"
                />
              </div>
              <div className="form-row">
                <label>Address</label>
                <input 
                  type="text" 
                  value={form.address} 
                  onChange={(e) => setForm({ ...form, address: e.target.value })} 
                  placeholder="Enter address"
                />
              </div>
              <div className="form-row">
                <label>University</label>
                <select 
                  value={form.university_id} 
                  onChange={(e) => setForm({ ...form, university_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                >
                  <option value="">Select University</option>
                  {universities.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {form.university_id && (
                <div style={{ gridColumn: 'span 2', marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Config Mapping (Filtered by University)</h3>
                  
                  {isConfigLoading ? (
                    <p>Loading university mappings...</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-row">
                        <label>Policies</label>
                        <Select
                          isMulti
                          options={masterData.policies
                            .filter(p => universityConfig.policies.includes(p.id))
                            .map(p => ({ value: p.id, label: p.name }))}
                          value={selectedConfig.policies.map(id => ({
                            value: id,
                            label: masterData.policies.find(p => p.id === id)?.name || id
                          }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, policies: vals.map(v => v.value) })}
                        />
                      </div>

                      <div className="form-row">
                        <label>Programs</label>
                        <Select
                          isMulti
                          options={masterData.programs
                            .filter(p => universityConfig.programs.includes(p.id))
                            .map(p => ({ value: p.id, label: p.name }))}
                          value={selectedConfig.programs.map(id => ({
                            value: id,
                            label: masterData.programs.find(p => p.id === id)?.name || id
                          }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, programs: vals.map(v => v.value) })}
                        />
                      </div>

                      <div className="form-row">
                        <label>Academic Years</label>
                        <Select
                          isMulti
                          options={masterData.academicYears
                            .filter(ay => universityConfig.academicYears.includes(ay.id))
                            .map(ay => ({ value: ay.id, label: ay.year_name }))}
                          value={selectedConfig.academicYears.map(id => ({
                            value: id,
                            label: masterData.academicYears.find(ay => ay.id === id)?.year_name || id
                          }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, academicYears: vals.map(v => v.value) })}
                        />
                      </div>

                      <div className="form-row">
                        <label>Semesters</label>
                        <Select
                          isMulti
                          options={masterData.semesters
                            .filter(s => universityConfig.semesters.includes(s.id))
                            .map(s => ({ value: s.id, label: s.semester_name }))}
                          value={selectedConfig.semesters.map(id => ({
                            value: id,
                            label: masterData.semesters.find(s => s.id === id)?.semester_name || id
                          }))}
                          onChange={(vals) => setSelectedConfig({ ...selectedConfig, semesters: vals.map(v => v.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {selected ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Colleges;

