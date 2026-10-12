import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole } from '../types';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  isLoggedIn: boolean;
  loginType: 'user' | 'doctor' | null;
  authProvider?: 'password' | 'google' | 'facebook';
  photoUrl?: string;
}

const ROLE_TITLES: Record<UserRole, string> = {
  patient: 'Patient',
  caregiver: 'Caregiver',
  pharmacist: 'Licensed Clinical Pharmacist',
  physician: 'Attending Physician',
};

interface AuthContextType {
  user: UserProfile;
  setRole: (role: UserRole) => void;
  login: (params: {
    name: string;
    email: string;
    role: UserRole;
    loginType: 'user' | 'doctor';
    authProvider?: 'password' | 'google' | 'facebook';
    photoUrl?: string;
  }) => void;
  logout: () => void;
  availableRoles: UserRole[];
}

const DEFAULT_USER: UserProfile = {
  id: 'guest',
  name: 'Guest',
  email: '',
  role: 'patient',
  roleTitle: 'Patient',
  isLoggedIn: false,
  loginType: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);

  const login = ({
    name,
    email,
    role,
    loginType,
    authProvider = 'password',
    photoUrl,
  }: {
    name: string;
    email: string;
    role: UserRole;
    loginType: 'user' | 'doctor';
    authProvider?: 'password' | 'google' | 'facebook';
    photoUrl?: string;
  }) => {
    setUser({
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      roleTitle: ROLE_TITLES[role],
      isLoggedIn: true,
      loginType,
      authProvider,
      photoUrl,
    });
  };

  const logout = () => {
    setUser(DEFAULT_USER);
  };

  const setRole = (role: UserRole) => {
    // Single-role constraint: Once logged in, user cannot switch or tamper with roles
    if (user.isLoggedIn) {
      console.warn(`[Security] Role switching is prohibited. ${user.name} is permanently locked to role '${user.role}' for this session.`);
      return;
    }
    setUser((prev) => ({
      ...prev,
      role,
      roleTitle: ROLE_TITLES[role],
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setRole,
        login,
        logout,
        availableRoles: ['patient', 'caregiver', 'pharmacist', 'physician'],
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
