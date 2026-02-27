import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const Semesters = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ semester_name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-semesters', {
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


  // whenever selected changes (for edit), populate form
  useEffect(() => {
    if (showEditModal && selected) {
      setForm({ semester_name: selected.semester_name || '' });
    }
  }, [selected, showEditModal]);

  const handleAdd = async () => {
    if (!form.semester_name) {
      return alert('Semester name is required');
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ semester_name: form.semester_name })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Save failed');
      }
      await fetchData();
      setShowAddModal(false);
      setForm({ semester_name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!form.semester_name) {
      return alert('Semester name is required');
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-semesters/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ semester_name: form.semester_name })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Update failed');
      }
      await fetchData();
      setShowEditModal(false);
      setSelected(null);
      setForm({ semester_name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const loadForEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-semesters/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const item = await res.json();
      setSelected(item);
      setForm({ semester_name: item.semester_name });
      setShowEditModal(true);
    } catch (err) {
      console.error('loadForEdit error:', err);
      alert('Error loading record: ' + (err.message || err));
    }
  };

  const handleDelete = (item) => {
    // open confirmation modal
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-semesters/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      setData(prev => prev.filter(x => x.id !== deleteTarget.id));
      setShowDeleteModal(false);
      setDeleteTarget(null);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div style={{display:'flex',justifyContent:'flex-end',alignItems:'center',marginBottom:12}}>
        <button className="btn-primary" onClick={() => { setSelected(null); setForm({ semester_name: '' }); setShowAddModal(true); }}>
          Add Semester
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Semester Name</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.semester_name}</td>
              <td>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</td>
              <td>
                <button className="btn-edit" onClick={() => loadForEdit(item.id)} aria-label="Edit"><FaEdit /></button>
                <button className="btn-delete" onClick={() => handleDelete(item)} aria-label="Delete"><MdDelete /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add modal */}
      {showAddModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowAddModal(false); setSelected(null); }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Add Semester</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
              className="modal-form"
            >
              <div className="form-row">
                <label>Semester Name</label>
                <input
                  type="text"
                  value={form.semester_name}
                  onChange={(e) => setForm({ ...form, semester_name: e.target.value })}
                  placeholder="Enter semester name"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { setShowAddModal(false); setSelected(null); setForm({ semester_name: '' }); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowEditModal(false); setSelected(null); }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Edit Semester</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
              className="modal-form"
            >
              <div className="form-row">
                <label>ID</label>
                <input type="text" value={selected ? selected.id : ''} disabled />
              </div>
              <div className="form-row">
                <label>Semester Name</label>
                <input
                  type="text"
                  value={form.semester_name}
                  onChange={(e) => setForm({ ...form, semester_name: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { setShowEditModal(false); setSelected(null); setForm({ semester_name: '' }); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{deleteTarget?.semester_name}"?</p>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => { setShowDeleteModal(false); setDeleteTarget(null); }}>
                No
              </button>
              <button type="button" className="btn-delete" onClick={handleDeleteConfirm}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Semesters;
