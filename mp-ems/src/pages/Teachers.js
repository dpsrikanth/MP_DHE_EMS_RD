import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';

const Teachers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const total = data.length;
  const activeCount = data.filter(d => d.status).length;
  const inactiveCount = total - activeCount;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/teachers', {
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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

return (
  <div className="teachers-container">
    <div className="teachers-top">
      <div className="teachers-header">
        <h2>Teachers</h2>
        <button className="btn-add">+ Add Teacher</button>
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
                  <button className="btn-edit">Edit</button>
                  <button className="btn-delete">Delete</button>
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
  </div>
);
};

export default Teachers;
