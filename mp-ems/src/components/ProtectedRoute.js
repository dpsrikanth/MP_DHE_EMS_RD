import { Navigate } from "react-router-dom";
import authUtils from "../utils/authUtils";

const ProtectedRoute = ({ element }) => {
  // Check if user has valid token and admin role
  if (!authUtils.isAuthenticated() || !authUtils.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
