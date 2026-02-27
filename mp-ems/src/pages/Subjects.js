import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';

const Subjects = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal & form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ subject_code: '', name: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/master-subjects', {
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

  // populate form when editing
  useEffect(() => {
    if (showEditModal && selected) {
      setForm({ subject_code: selected.subject_code || '', name: selected.name || '' });
    }
  }, [selected, showEditModal]);

  const handleAdd = async () => {
    if (!form.subject_code || !form.name) {
      return alert('Both code and name are required');
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/master-subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject_code: form.subject_code, name: form.name })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Save failed');
      }
      await fetchData();
      setShowAddModal(false);
      setForm({ subject_code: '', name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    if (!form.subject_code || !form.name) {
      return alert('Both code and name are required');
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject_code: form.subject_code, name: form.name })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Update failed');
      }
      await fetchData();
      setShowEditModal(false);
      setSelected(null);
      setForm({ subject_code: '', name: '' });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const loadForEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const item = await res.json();
      setSelected(item);
      setForm({ subject_code: item.subject_code, name: item.name });
      setShowEditModal(true);
    } catch (err) {
      console.error('loadForEdit error:', err);
      alert('Error loading record: ' + (err.message || err));
    }
  };

  const handleDelete = (item) => {
    setDeleteTarget(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/master-subjects/${deleteTarget.id}`, {
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
        <button className="btn-primary" onClick={() => { setSelected(null); setForm({ subject_code: '', name: '' }); setShowAddModal(true); }}>
          Add Subject
        </button>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Code</th>
            <th>Subject Name</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.subject_code}</td>
              <td>{item.name}</td>
              <td>{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</td>
              <td>
                <button className="btn-edit" onClick={() => loadForEdit(item.id)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(item)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add modal */}
      {showAddModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowAddModal(false); setSelected(null); }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <h3>Add Subject</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
              className="modal-form"
            >
              <div className="form-row">
                <label>Subject Code</label>
                <input
                  type="text"
                  value={form.subject_code}
                  onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                  placeholder="Enter code"
                />
              </div>
              <div className="form-row">
                <label>Subject Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { setShowAddModal(false); setSelected(null); setForm({ subject_code: '', name: '' }); }}
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
            <h3>Edit Subject</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}
              className="modal-form"
            >
              <div className="form-row">
                <label>ID</label>
                <input type="text" value={selected ? selected.id : ''} disabled />
              </div>
              <div className="form-row">
                <label>Subject Code</label>
                <input
                  type="text"
                  value={form.subject_code}
                  onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                />
              </div>
              <div className="form-row">
                <label>Subject Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => { setShowEditModal(false); setSelected(null); setForm({ subject_code: '', name: '' }); }}
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
            <p>Are you sure you want to delete "{deleteTarget?.name || deleteTarget?.subject_code}"?</p>
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

export default Subjects;
