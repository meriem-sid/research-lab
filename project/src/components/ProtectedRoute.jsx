import { Navigate } from "react-router-dom";

function getUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const user = getUserFromStorage();

  if (!user?.id) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
