import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UnauthorizedAccess } from '../layout/UnauthorizedAccess';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
}
export const RequireAuth: React.FC<RequireAuthProps> = ({ children, roles }) => {
    const { user } = useAuth();
  
    if (!user) {
      return <UnauthorizedAccess />;
    }
  
    if (roles && !roles.includes(user.role.name)) {
      // For role-specific access, you might want to create a different component
      // or modify UnauthorizedAccess to handle insufficient permissions
      return <UnauthorizedAccess />;
    }
  
    return <>{children}</>;
  };