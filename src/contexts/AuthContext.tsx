import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '@/types';
import api from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    insuranceProviderId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('xcyber_user');
    const token = localStorage.getItem('xcyber_token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      api.getProfile().then((response) => {
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('xcyber_user', JSON.stringify(response.data));
        } else {
          // Token invalid, clear session
          localStorage.removeItem('xcyber_user');
          localStorage.removeItem('xcyber_token');
          setUser(null);
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    const response = await api.login({ email, password, role });
    
    if (response.success && response.data) {
      setUser(response.data.user);
      localStorage.setItem('xcyber_user', JSON.stringify(response.data.user));
      return { success: true };
    }
    
    return { success: false, error: response.error || 'Login failed' };
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    insuranceProviderId?: string;
  }) => {
    const response = await api.register(data);
    
    if (response.success && response.data) {
      setUser(response.data.user);
      localStorage.setItem('xcyber_user', JSON.stringify(response.data.user));
      return { success: true };
    }
    
    return { success: false, error: response.error || 'Registration failed' };
  };

  const logout = () => {
    api.logout();
    setUser(null);
    localStorage.removeItem('xcyber_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
