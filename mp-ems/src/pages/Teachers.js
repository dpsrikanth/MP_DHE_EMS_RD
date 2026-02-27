import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import authUtils from '../utils/authUtils';

const Teachers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const [addForm, setAddForm] = useState({
    teacher_name: '',
    email: '',
    college_name: '',
    designation: '',
    status: true
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editForm, setEditForm] = useState({
    id: null,
    teacher_name: '',
    email: '',
    college_name: '',
    designation: '',
    status: true
  });

  const total = data.length;
  const activeCount = data.filter(d => d.status).length;
  const inactiveCount = total - activeCount;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('🎨 DATA STATE CHANGED - Component should re-render | Current data:', data);
  }, [data]);

  const fetchData = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/teachers', {
        headers: authUtils.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Request failed`);
      }
      const text = await response.text();
      if (!text) throw new Error('Empty response from server');
      const data = JSON.parse(text);
      console.log('✅ Fetched fresh teachers data from API:', data);
      console.log('� API response has', data.length, 'items');
      const newDataArray = Array.isArray(data) ? [...data] : [];
      console.log('🔧 Creating new array reference with', newDataArray.length, 'items:', newDataArray);
      setData(newDataArray);
      console.log('📊 setData() called - state should update now');
      setLoading(false);
    } catch (err) {
      const msg = err.message.includes('JSON') ? 'Invalid server response' : err.message;
      setError(msg);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setAddError(null);
    setAddErrors({});
    setAddForm({ teacher_name: '', email: '', college_name: '', designation: '', status: true });
    setShowAddModal(true);
  };

  const closeAddModal = () => setShowAddModal(false);

  const openEditModal = (teacher) => {
    setEditError(null);
    setEditErrors({});
    setEditForm({
      id: teacher.id,
      teacher_name: teacher.teacher_name,
      email: teacher.email,
      college_name: teacher.college_name,
      designation: teacher.designation,
      status: teacher.status
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => setShowEditModal(false);

  const handleAddChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (addErrors[name]) setAddErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    console.log(`✏️ Edit field "${name}" changed to:`, newValue);
    setEditForm(prev => {
      const updated = { ...prev, [name]: newValue };
      console.log('📋 EditForm state after update:', updated);
      return updated;
    });
    if (editErrors[name]) setEditErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddLoading(true);
    // client-side validation
    const errors = {};
    if (!addForm.teacher_name || !addForm.teacher_name.trim()) errors.teacher_name = 'Full name is required';
    if (!addForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errors.email = 'Valid email is required';
    if (!addForm.designation || !addForm.designation.trim()) errors.designation = 'Designation is required';
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) { setAddLoading(false); return; }
    try {
      const response = await fetch('http://localhost:8080/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader()
        },
        body: JSON.stringify(addForm)
      });

      const text = await response.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add teacher');
      }

      await fetchData();
      setShowAddModal(false);
    } catch (err) {
      setAddError(err.message || 'Add failed');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError(null);
    setEditLoading(true);
    const errors = {};
    if (!editForm.teacher_name || !editForm.teacher_name.trim()) errors.teacher_name = 'Full name is required';
    if (!editForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) errors.email = 'Valid email is required';
    if (!editForm.designation || !editForm.designation.trim()) errors.designation = 'Designation is required';
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) { setEditLoading(false); return; }
    try {
        const payload = {
      name: editForm.teacher_name,   // 🔥 convert here
      email: editForm.email,
      college_id: 1, // or editForm.college_id if available
      designation: editForm.designation,
      status: editForm.status
    };
      console.log('📤 Sending edit payload:', JSON.parse(JSON.stringify(editForm)));
      const response = await fetch(`http://localhost:8080/api/teachers/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authUtils.getAuthHeader()
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let result = {};
      try {
        result = JSON.parse(text);
      } catch (e) {
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update teacher');
      }

      console.log('✅ Teacher updated successfully! Refreshing list...');
      await fetchData();
      console.log('✅ List refreshed, closing modal');
      setShowEditModal(false);
    } catch (err) {
      console.error('❌ Edit error:', err.message);
      setEditError(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  console.log('🎬 RENDER: Teachers component rendering with', data.length, 'teachers:', data);

  return (
  <div className="teachers-container">
    <div className="teachers-top">
      <div className="teachers-header">
        <h2>Teachers</h2>
        <button className="btn-add" onClick={openAddModal}>+ Add Teacher</button>
      </div>

      {/* <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total Teachers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inactiveCount}</div>
          <div className="stat-label">Inactive</div>
        </div>
      </div> */}
    </div>

    <div className="table-card">
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>College</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.teacher_name}</td>
                <td>{item.email}</td>
                <td>{item.college_name}</td>
                <td>{item.designation}</td>
                <td>
                  <span
                    className={
                      item.status ? "status active" : "status inactive"
                    }
                  >
                    {item.status ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="btn-edit" onClick={() => openEditModal(item)} aria-label="Edit"><FaEdit /></button>
                  <button className="btn-delete" aria-label="Delete"><MdDelete /></button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="no-data">
                No Teachers Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {showAddModal && (
      <div className="modal-overlay" onMouseDown={closeAddModal}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <h3>Add Teacher</h3>
          {addError && <div className="error" style={{ marginBottom: 10 }}>{addError}</div>}
          <form onSubmit={handleAddSubmit} className="modal-form">
            <div className="form-row">
              <label>Full Name</label>
              <input name="teacher_name" value={addForm.teacher_name} onChange={handleAddChange} placeholder="Enter full name" />
              {addErrors.teacher_name && <span className="input-error">{addErrors.teacher_name}</span>}
            </div>
            <div className="form-row">
              <label>Email</label>
              <input name="email" type="email" value={addForm.email} onChange={handleAddChange} placeholder="name@example.com" />
              {addErrors.email && <span className="input-error">{addErrors.email}</span>}
            </div>
            <div className="form-row">
              <label>College</label>
              <input name="college_name" value={addForm.college_name} onChange={handleAddChange} placeholder="College / Institution" />
            </div>
            <div className="form-row">
              <label>Designation</label>
              <input name="designation" value={addForm.designation} onChange={handleAddChange} placeholder="Professor / Lecturer" />
              {addErrors.designation && <span className="input-error">{addErrors.designation}</span>}
            </div>
            <div className="form-row inline" style={{ alignItems: 'center' }}>
              <label style={{ marginRight: 8 }}>Active</label>
              <label className="switch">
                <input name="status" type="checkbox" checked={addForm.status} onChange={handleAddChange} />
                <span className="slider" />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeAddModal} disabled={addLoading}>Cancel</button>
              <button type="submit" className="btn-save" disabled={addLoading}>{addLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showEditModal && (
      <div className="modal-overlay" onMouseDown={closeEditModal}>
        <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
          <h3>Edit Teacher</h3>
          {editError && <div className="error" style={{ marginBottom: 10 }}>{editError}</div>}
          <form onSubmit={handleEditSubmit} className="modal-form">
            <div className="form-row">
              <label>Full Name</label>
              <input name="teacher_name" value={editForm.teacher_name} onChange={handleEditChange} placeholder="Enter full name" />
              {editErrors.teacher_name && <span className="input-error">{editErrors.teacher_name}</span>}
            </div>
            <div className="form-row">
              <label>Email</label>
              <input name="email" type="email" value={editForm.email} onChange={handleEditChange} placeholder="name@example.com" />
              {editErrors.email && <span className="input-error">{editErrors.email}</span>}
            </div>
            <div className="form-row">
              <label>College</label>
              <input name="college_name" value={editForm.college_name} onChange={handleEditChange} placeholder="College / Institution" />
            </div>
            <div className="form-row">
              <label>Designation</label>
              <input name="designation" value={editForm.designation} onChange={handleEditChange} placeholder="Professor / Lecturer" />
              {editErrors.designation && <span className="input-error">{editErrors.designation}</span>}
            </div>
            <div className="form-row inline" style={{ alignItems: 'center' }}>
              <label style={{ marginRight: 8 }}>Active</label>
              <label className="switch">
                <input name="status" type="checkbox" checked={editForm.status} onChange={handleEditChange} />
                <span className="slider" />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeEditModal} disabled={editLoading}>Cancel</button>
              <button type="submit" className="btn-save" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
};

export default Teachers;
