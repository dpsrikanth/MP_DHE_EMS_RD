import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DataTable.css';

const Students = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    user_id: '',
    college_id: '',
    program_id: '',
    current_semester_id: '',
    status: true
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
    fetchUsers();
    fetchColleges();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/students', {
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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  const fetchColleges = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Fetching colleges with token:", token ? "Present" : "Missing");
      const response = await fetch('http://localhost:8080/api/colleges', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("Colleges response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Colleges error response:", errorText);
        throw new Error(`Failed to fetch colleges: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log("Colleges data received:", data);
      setColleges(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching colleges:", err);
      setColleges([]);
    }
  };

  const handleAddClick = () => {
    setFormData({
      id: null,
      user_id: '',
      college_id: '',
      program_id: '',
      current_semester_id: '',
      status: true
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleEditClick = (student) => {
    setFormData({
      id: student.id,
      user_id: student.user_id || '',
      college_id: student.college_id || '',
      program_id: student.program_id || '',
      current_semester_id: student.current_semester_id || '',
      status: student.status !== undefined ? student.status : true
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/students/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          setData(data.filter(item => item.id !== id));
          alert('Student deleted successfully');
        } else {
          alert('Error deleting student');
        }
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Error deleting student');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? value === 'true' : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.user_id || !formData.college_id) {
      alert('Please fill in all required fields (User and College)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = isEditing 
        ? `http://localhost:8080/api/students/${formData.id}`
        : 'http://localhost:8080/api/students';
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: parseInt(formData.user_id),
          college_id: parseInt(formData.college_id),
          program_id: formData.program_id ? parseInt(formData.program_id) : null,
          current_semester_id: formData.current_semester_id ? parseInt(formData.current_semester_id) : null,
          status: formData.status
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (isEditing) {
          setData(data.map(item => item.id === formData.id ? result.student : item));
          alert('Student updated successfully');
        } else {
          fetchData();
          alert('Student created successfully');
        }
        setShowModal(false);
      } else {
        const errorData = await response.json();
        alert('Error saving student: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error saving student:', err);
      alert('Error saving student: ' + err.message);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Show warning if colleges are empty
  if (data.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Students Management</h1>
          <button className="btn-add-main" onClick={handleAddClick}>+ Add New Student</button>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
          <p>⚠️ Colleges: {colleges.length} records loaded</p>
          <p>⚠️ Users: {users.length} records loaded</p>
          <p>No students found. Click "Add New Student" to create one.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Students Management</h1>
        <button className="btn-add-main" onClick={handleAddClick}>+ Add New Student</button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student Name</th>
            <th>Email</th>
            <th>College ID</th>
            <th>Program ID</th>
            <th>Semester</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.student_name || 'N/A'}</td>
              <td>{item.email || 'N/A'}</td>
              <td>{item.college_id}</td>
              <td>{item.program_id || 'N/A'}</td>
              <td>{item.current_semester_id || 'N/A'}</td>
              <td><span className={`status ${item.status === true ? 'active' : 'inactive'}`}>{item.status === true ? 'Active' : 'Inactive'}</span></td>
              <td>
                <button className="btn-edit" onClick={() => handleEditClick(item)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDeleteClick(item.id)}>Delete</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No students found</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Student' : 'Add New Student'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="user_id">User *</label>
                <select 
                  id="user_id" 
                  name="user_id" 
                  value={formData.user_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select User --</option>
                  {Array.isArray(users) && users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="college_id">College *</label>
                <select 
                  id="college_id" 
                  name="college_id" 
                  value={formData.college_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- Select College --</option>
                  {Array.isArray(colleges) && colleges.map(college => (
                    <option key={college.id} value={college.id}>{college.college_name || college.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="program_id">Program ID</label>
                <input 
                  type="number" 
                  id="program_id" 
                  name="program_id" 
                  value={formData.program_id}
                  onChange={handleInputChange}
                  placeholder="Enter Program ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="current_semester_id">Current Semester ID</label>
                <input 
                  type="number" 
                  id="current_semester_id" 
                  name="current_semester_id" 
                  value={formData.current_semester_id}
                  onChange={handleInputChange}
                  placeholder="Enter Current Semester ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value={true}>Active (True)</option>
                  <option value={false}>Inactive (False)</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-submit">{isEditing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
