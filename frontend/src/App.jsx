// frontend/src/App.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import API from './api';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CustomerPage from './pages/CustomerPage';
import { AdminDashboard } from './pages/AdminPage';
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children, allowedRole }) {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, role: null });

  useEffect(() => {
    API.get('profile/')
      .then(res => setAuth({loading: false, authenticated: true, role: res.data.role}))
      .catch(() => setAuth({ loading: false, authenticated: false }));
  }, []);

  if (auth.loading) return <div>Loading...</div>;
  if (!auth.authenticated) return <Navigate to="/" replace />;
  if (allowedRole && auth.role !== allowedRole) return <NotFound />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Customer Route */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="Customer">
            <CustomerPage />
          </ProtectedRoute>
        }
      />
      
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Admin Route */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}