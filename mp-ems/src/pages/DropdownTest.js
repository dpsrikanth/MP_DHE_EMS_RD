import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DataTable.css';

const DropdownTest = () => {
  const navigate = useNavigate();
  const [dropdownData, setDropdownData] = useState({
    policies: [],
    programs: [],
    academicYears: [],
    semesters: []
  });

  const [selectedValues, setSelectedValues] = useState({
    policy: '',
    program: '',
    academicYear: '',
    semester: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No authentication token found. Redirecting to login.");
      alert("Please login to access this page");
      navigate('/');
      return;
    }
    fetchDropdownOptions();
  }, [navigate]);

  const fetchDropdownOptions = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log("Fetching dropdown options with token:", token ? "Present" : "Missing");
      
      const response = await fetch('http://localhost:8080/api/masterDetails', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`Failed to fetch dropdown options: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Dropdown data received:", data);
      
      setDropdownData({
        policies: data.policies || [],
        programs: data.programs || [],
        academicYears: data.academicYears || [],
        semesters: data.semesters || []
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dropdown options:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setSelectedValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Selected values:", selectedValues);
    alert(`Selected:\n${JSON.stringify(selectedValues, null, 2)}`);
  };

  const handleReset = () => {
    setSelectedValues({
      policy: '',
      program: '',
      academicYear: '',
      semester: ''
    });
  };

  if (loading) return <div className="loading">Loading dropdown options...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Dropdown Options Test</h1>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '8px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSubmit}>
          {/* Policy Dropdown */}
          <div className="form-group">
            <label htmlFor="policy">Policy</label>
            <select
              id="policy"
              name="policy"
              value={selectedValues.policy}
              onChange={handleSelectChange}
            >
              <option value="">-- Select Policy --</option>
              {Array.isArray(dropdownData.policies) && dropdownData.policies.map((policy, idx) => (
                <option key={idx} value={policy}>{policy || 'N/A'}</option>
              ))}
            </select>
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Total: {dropdownData.policies.length} options
            </small>
          </div>

          {/* Program Dropdown */}
          <div className="form-group">
            <label htmlFor="program">Program</label>
            <select
              id="program"
              name="program"
              value={selectedValues.program}
              onChange={handleSelectChange}
            >
              <option value="">-- Select Program --</option>
              {Array.isArray(dropdownData.programs) && dropdownData.programs.map((program, idx) => (
                <option key={idx} value={program}>{program || 'N/A'}</option>
              ))}
            </select>
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Total: {dropdownData.programs.length} options
            </small>
          </div>

          {/* Academic Year Dropdown */}
          <div className="form-group">
            <label htmlFor="academicYear">Academic Year</label>
            <select
              id="academicYear"
              name="academicYear"
              value={selectedValues.academicYear}
              onChange={handleSelectChange}
            >
              <option value="">-- Select Academic Year --</option>
              {Array.isArray(dropdownData.academicYears) && dropdownData.academicYears.map((year, idx) => (
                <option key={idx} value={year}>{year || 'N/A'}</option>
              ))}
            </select>
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Total: {dropdownData.academicYears.length} options
            </small>
          </div>

          {/* Semester Dropdown */}
          <div className="form-group">
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              name="semester"
              value={selectedValues.semester}
              onChange={handleSelectChange}
            >
              <option value="">-- Select Semester --</option>
              {Array.isArray(dropdownData.semesters) && dropdownData.semesters.map((semester, idx) => (
                <option key={idx} value={semester}>{semester || 'N/A'}</option>
              ))}
            </select>
            <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
              Total: {dropdownData.semesters.length} options
            </small>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginTop: '30px',
            justifyContent: 'center'
          }}>
            <button 
              type="submit" 
              className="btn-submit"
              style={{ 
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Show Selected Values
            </button>
            <button 
              type="button" 
              onClick={handleReset}
              className="btn-cancel"
              style={{ 
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Reset
            </button>
            <button 
              type="button" 
              onClick={fetchDropdownOptions}
              style={{ 
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: '600',
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              Refresh Data
            </button>
          </div>
        </form>

        {/* Display Summary */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>📊 Data Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '6px' }}>
              <strong>Policies:</strong> {dropdownData.policies?.length || 0} items
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '6px' }}>
              <strong>Programs:</strong> {dropdownData.programs?.length || 0} items
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '6px' }}>
              <strong>Academic Years:</strong> {dropdownData.academicYears?.length || 0} items
            </div>
            <div style={{ padding: '10px', backgroundColor: '#f0f7ff', borderRadius: '6px' }}>
              <strong>Semesters:</strong> {dropdownData.semesters?.length || 0} items
            </div>
          </div>
        </div>

        {/* Current Selection Display */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginTop: 0, color: '#333' }}>🔍 Current Selection</h3>
          <pre style={{
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '6px',
            border: '1px solid #e0e0e0',
            overflow: 'auto',
            maxHeight: '300px'
          }}>
            {JSON.stringify(selectedValues, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DropdownTest;
