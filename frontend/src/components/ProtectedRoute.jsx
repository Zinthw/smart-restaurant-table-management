import { Navigate } from "react-router-dom";
import { hasValidToken, isAdmin } from "../utils/authHelper";
import Loading from "./Loading";
import { useState, useEffect } from "react";

/**
 * ProtectedRoute Component
 * Kiểm tra xem user đã đăng nhập và là admin chưa trước khi render component
 */
export default function ProtectedRoute({ children }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Kiểm tra token và role
    const hasToken = hasValidToken();
    const isAdminRole = isAdmin();

    if (hasToken && isAdminRole) {
      setIsAuthorized(true);
    }
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return <Loading />;
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
