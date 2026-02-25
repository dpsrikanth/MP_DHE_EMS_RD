import { Navigate } from "react-router-dom";
import authUtils from "../utils/authUtils";
import Sidebar from "./Sidebar";
import Header from "./Header";

const ProtectedRoute = ({ element }) => {
  // Check if user has valid token and admin role
  if (!authUtils.isAuthenticated() || !authUtils.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Derive a title from the wrapped element if possible
  const title = element?.type?.displayName || element?.type?.name || "Admin Panel";

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        {element}
      </div>
    </div>
  );
};

export default ProtectedRoute;
