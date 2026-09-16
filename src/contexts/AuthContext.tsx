// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { pb, UserRecord, getCurrentUser, isAuthenticated, logout, onAuthChange } from '@/lib/pocketbase';
import { captureEvent, identifyUser, resetPosthog } from '@/lib/analytics';

interface AuthContextType {
  user: UserRecord | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há um usuário autenticado ao inicializar
    const currentUser = getCurrentUser();
    setUser(currentUser || null);
    setIsLoading(false);

    // Listener para mudanças no estado de autenticação
    const unsubscribe = onAuthChange((token, model) => {
      setUser(model);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (user) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      captureEvent('teacher_user_authenticated', {
        role: user.role,
      });
      return;
    }

    resetPosthog();
    captureEvent('teacher_user_signed_out');
  }, [user, isLoading]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      setUser(authData.record as UserRecord);
      captureEvent('teacher_login_success', {
        role: (authData.record as UserRecord)?.role,
      });
    } catch (error) {
      captureEvent('teacher_login_error');
      throw error;
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      // Derivar username obrigatório no PocketBase
      const baseUser = (data.name?.trim() || data.email.split('@')[0] || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9_\-]+/g, '_')
        .slice(0, 24);
      const username = baseUser || `user_${Math.random().toString(36).slice(2, 8)}`;

      await pb.collection('users').create({
        username,
        email: data.email,
        emailVisibility: true,
        password: data.password,
        passwordConfirm: data.passwordConfirm,
        name: data.name,
        role: data.role,
      });
      captureEvent('teacher_register_success', { role: data.role });
    } catch (error) {
      captureEvent('teacher_register_error', { role: data.role });
      throw error;
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    captureEvent('teacher_logout');
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: isAuthenticated(),
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
