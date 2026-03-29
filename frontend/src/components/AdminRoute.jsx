// src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function AdminRoute({ user, children }) {
  // 1. If no one is logged in, kick them to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. If a normal user tries to access this, kick them to the dashboard
  if (user.email !== 'admin@gmail.com') {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. If it IS the admin, let them see the page!
  return children;
}