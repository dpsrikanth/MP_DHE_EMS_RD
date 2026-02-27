import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DataTable.css';

const AcademicYears = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    year_name: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No authentication token found. Redirecting to login.");
      alert("Please login to access this page");
      navigate('/');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/academic-years', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const result = await response.json();
      setData(result || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setFormData({ year_name: '' });
    setShowModal(true);
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setFormData({ year_name: item.year_name });
    setShowModal(true);
    // Store the ID in a ref or state for update
    setFormData(prev => ({ ...prev, id: item.id }));
  };

  const handleDeleteClick = (id) => {
    if (window.confirm('Are you sure you want to delete this academic year?')) {
      deleteAcademicYear(id);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.year_name.trim()) {
      alert('Year name is required');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:8080/api/academic-years/${formData.id}`
        : 'http://localhost:8080/api/academic-years';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          year_name: formData.year_name
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed: ${errorText}`);
      }

      await response.json();
      alert(isEditing ? 'Academic year updated successfully' : 'Academic year created successfully');
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Submit error:', err);
    }
  };

  const deleteAcademicYear = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/academic-years/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed: ${errorText}`);
      }

      alert('Academic year deleted successfully');
      fetchData();
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error('Delete error:', err);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({ year_name: '' });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📅 Academic Years</h1>
        <button className="btn-add-main" onClick={handleAddClick}>
          + Add Academic Year
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{isEditing ? 'Edit' : 'Create'} Academic Year</h2>
              <button 
                className="close-btn" 
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <div className="modal-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="year_name">Year Name *</label>
                  <input
                    type="text"
                    id="year_name"
                    name="year_name"
                    value={formData.year_name}
                    onChange={handleInputChange}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-submit"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Year Name</th>
              <th>Created At</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.year_name}</td>
                  <td>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</td>
                  <td>{item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'}</td>
                  <td className="action-buttons">
                    <button 
                      className="btn-edit"
                      onClick={() => handleEditClick(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  No academic years found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcademicYears;
