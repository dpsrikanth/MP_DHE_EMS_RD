import React from "react";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 1, name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { id: 2, name: 'Universities', path: '/universities', icon: '🏫' },
    { id: 3, name: 'Colleges', path: '/colleges', icon: '🎓' },
    { id: 4, name: 'Programs', path: '/programs', icon: '📚' },
    { id: 5, name: 'Academic Years', path: '/academic-years', icon: '📅' },
    { id: 6, name: 'Semesters', path: '/semesters', icon: '⏱️' },
    { id: 7, name: 'Subjects', path: '/subjects', icon: '📖' },
    { id: 8, name: 'Teachers', path: '/teachers', icon: '👨‍🏫' },
    { id: 9, name: 'Students', path: '/students', icon: '👨‍🎓' },
    { id: 10, name: 'Exams', path: '/exams', icon: '✏️' },
    { id: 11, name: 'Marks', path: '/marks', icon: '📊' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar">
      <h2>EMS</h2>
      <ul>
        {menuItems.map((item) => (
          <li 
            key={item.id} 
            onClick={() => handleMenuClick(item.path)}
            style={{ cursor: 'pointer' }}
          >
            <span>{item.icon}</span> {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;