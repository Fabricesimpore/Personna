import React from 'react';
import { Navigate } from 'react-router-dom';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/signup" replace />;
  }
  
  return <>{children}</>;
};

export default RequireAuth; 