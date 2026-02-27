import React, { useState, useEffect } from 'react';
import '../styles/DataTable.css';
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

const Marks = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/marks', {
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
    <div className="page-container">
      <h1>Marks</h1>
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Student ID</th>
            <th>Exam ID</th>
            <th>Marks Obtained</th>
            <th>Max Marks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.student_id}</td>
              <td>{item.exam_id}</td>
              <td>{item.marks_obtained}</td>
              <td>{item.max_marks}</td>
              <td>
                <button className="btn-edit" aria-label="Edit"><FaEdit /></button>
                <button className="btn-delete" aria-label="Delete"><MdDelete /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Marks;
