import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import authUtils from '../utils/authUtils';
const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [userInfo, setUserInfo] = useState(() => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  });

  const roleName = localStorage.getItem('roleName');

  const roleNmeee = authUtils.getAuth().roleName;

  console.log( roleName,roleNmeee)

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('roleName');
    
    // Redirect to login
    navigate('/');
    
    // Close dropdown
    setShowDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleProfileClick = () => {
    // You can add profile page later
    console.log('Profile clicked');
  };

  const getInitials = () => {
    if (roleName ) {
      return roleName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const getRoleColor = () => {
    if (!roleName) return '#667eea';
    
    const role = roleName?.toUpperCase();
    switch (role) {
      case 'SUPER_ADMIN':
      case 'SUPERADMIN':
        return '#ef4444';
      case 'ADMIN':
        return '#f59e0b';
      case 'STUDENT':
        return '#10b981';
      case 'TEACHER':
        return '#3b82f6';
      default:
        return '#667eea';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">EMS</span>
        </div>

        {/* Navbar Title */}
        <div className="navbar-title">
          <h2>Education Management System</h2>
        </div>

        {/* Profile Section */}
        <div className="navbar-profile">
          <div className="profile-container">
            {/* Avatar */}
            <div 
              className="avatar"
              style={{ backgroundColor: getRoleColor() }}
              onClick={toggleDropdown}
            >
              {getInitials()}
            </div>

            {/* User Info */}
            <div className="user-info">
              <div className="user-name">{roleName}</div>
              <div className="user-role">{roleName|| 'Guest'}</div>
            </div>

            {/* Dropdown Arrow */}
            <button 
              className={`dropdown-toggle ${showDropdown ? 'active' : ''}`}
              onClick={toggleDropdown}
              aria-label="Toggle profile menu"
            >
              ▼
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar" style={{ backgroundColor: getRoleColor() }}>
                    {getInitials()}
                  </div>
                  <div className="dropdown-user-info">
                    <div className="dropdown-name">{roleName}</div>
                    <div className="dropdown-email">{'No email'}</div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

              

                <div className="dropdown-divider"></div>

                <button 
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <span className="item-icon">🚪</span>
                  <span className="item-text">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
