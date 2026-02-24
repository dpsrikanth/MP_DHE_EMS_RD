import { useNavigate } from "react-router-dom";
import authUtils from "../utils/authUtils";

const Header = ({ title }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication data
    authUtils.logout();
    
    // Redirect to login page
    navigate("/");
  };

  return (
    <div className="header">
      <h1>{title}</h1>
      <button className="logout-btn" onClick={handleLogout} style={{ cursor: 'pointer' }}>Logout</button>
    </div>
  );
};

export default Header;