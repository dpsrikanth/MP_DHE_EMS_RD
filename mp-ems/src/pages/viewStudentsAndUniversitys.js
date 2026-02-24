import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const ViewStudentsAndUniversities = () => {
  
  const [students, setStudents] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

 
  useEffect(() => {
    const fetchData = async () => {
      try {
       
        const studentRes = await fetch("http://localhost:8080/api/students");
        const universityRes = await fetch("http://localhost:8080/api/universities");
        const studentData = await studentRes.json();
        const universityData = await universityRes.json();
        setStudents(studentData);
        setUniversities(universityData);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Error fetching data. Check console for details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ padding: "20px", flexGrow: 1 }}>
        <h1>Data Overview</h1>

        {loading ? (
          <p>Loading records...</p>
        ) : (
          <div style={{ display: "flex", gap: "20px" }}>
           
            <div>
              <label htmlFor="student-select">Select Student: </label>
              <select id="student-select">
                <option value="">-- Please choose a student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.student_name}
                  </option>
                ))}
              </select>
            </div>

            
            <div>
              <label htmlFor="university-select">Select University: </label>
              <select id="university-select">
                <option value="">-- Please choose a university --</option>
                {universities.map((uni) => (
                  <option key={uni.id} value={uni.id}>
                    {uni.university_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewStudentsAndUniversities;