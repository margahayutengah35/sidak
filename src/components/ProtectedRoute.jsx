// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute({ allowedRole }) {
  // ambil userRole dari localStorage
  const userRole = localStorage.getItem("userRole");

  // jika belum login atau role tidak sesuai, redirect ke login
  if (!userRole || (allowedRole && userRole !== allowedRole)) {
    return <Navigate to="/" replace />;
  }

  // jika sudah login dan role sesuai, render halaman
  return <Outlet />;
}

export default ProtectedRoute;
