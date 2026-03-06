import { Navigate, Outlet } from 'react-router-dom';

// Route guard chỉ cho phép admin truy cập
// Phải dùng sau ProtectedRoute (đã kiểm tra token)
const AdminRoute = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
