// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/signuppage';
import CustomerPage from './pages/CustomerPage';
import { AdminDashboard } from './pages/adminPage';

// Simple guard to protect pages based on login status and roles
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');

  if (!token) {
    // Not logged in -> send to login page
    return <Navigate to="/" replace />;
  }

  if (allowedRole && userRole !== allowedRole) {
    // Logged in but wrong role -> send back to an unauthorized message or fallback
    return <div className="p-8 text-center text-red-500 font-medium">Unauthorized Access.</div>;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />

      {/* Protected Customer Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="Customer">
            <CustomerPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Route */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Placeholder Fallback for safety */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}