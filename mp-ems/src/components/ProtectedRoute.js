import { Navigate } from "react-router-dom";
import authUtils from "../utils/authUtils";

const ProtectedRoute = ({ element }) => {
  // Check if user has valid token and some authorized role (admin, college_admin, faculty)
  if (!authUtils.isAuthenticated() || !(authUtils.isAdmin() || authUtils.isCollegeAdmin() || authUtils.isFaculty())) {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
