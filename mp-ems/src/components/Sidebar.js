import {React} from "react";
import { useNavigate } from "react-router-dom";


const Sidebar = () => {
  const navigate = useNavigate();

  const handleStudentsClick = () => {
    navigate("/viewStudentsAndUniversitys");
  };

  return (
    <div className="sidebar">
      <h2>EMS</h2>
      <ul>
        <li>Dashboard</li>
        <li onClick={handleStudentsClick} style={{ cursor: 'pointer' }}>Students</li>
        <li>Exams</li>
        <li>Marks Entry</li>
        <li>Results</li>
        <li>Reports</li>
      </ul>
    </div>
  );
};

export default Sidebar;