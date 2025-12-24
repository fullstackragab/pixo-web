'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { UserType, AuthResponse, UserResponse } from '@/types';

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerCandidate: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  registerCompany: (email: string, password: string, companyName: string, industry: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to normalize userType from API (may be string or number) to UserType enum
function normalizeUserType(userType: string | number): UserType {
  if (typeof userType === 'number') {
    return userType as UserType;
  }
  const typeMap: Record<string, UserType> = {
    'candidate': UserType.Candidate,
    'company': UserType.Company,
    'admin': UserType.Admin,
  };
  return typeMap[userType.toLowerCase()] ?? UserType.Candidate;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get<UserResponse>('/auth/me');
      if (response.success && response.data) {
        // Normalize userType from API (may be string like "Company" or number like 1)
        const normalizedUser = {
          ...response.data,
          userType: normalizeUserType(response.data.userType as unknown as string | number),
        };
        setUser(normalizedUser);
      }
    } catch {
      // Not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', { email, password });
      console.log('Login response:', response);

      if (response.success && response.data) {
        api.setTokens(response.data.accessToken, response.data.refreshToken, response.data.expiresAt);
        await checkAuth();

        console.log('User type from response:', response.data.userType);

        // Normalize user type to number (API may return string like "Candidate" or number like 0)
        const userType = response.data.userType as string | number;
        let userTypeNum: number;

        if (typeof userType === 'number') {
          userTypeNum = userType;
        } else if (typeof userType === 'string') {
          // Map string names to numbers (case insensitive)
          const typeMap: Record<string, number> = {
            'candidate': 0,
            'company': 1,
            'admin': 2,
          };
          userTypeNum = typeMap[userType.toLowerCase()] ?? -1;
        } else {
          userTypeNum = -1;
        }

        if (userTypeNum === 0) {
          router.push('/candidate/dashboard');
        } else if (userTypeNum === 1) {
          router.push('/company/dashboard');
        } else if (userTypeNum === 2) {
          router.push('/admin/dashboard');
        } else {
          console.warn('Unknown user type:', userType, '- redirecting to home');
          router.push('/');
        }

        return { success: true };
      }

      // Handle both 'error' and 'message' fields from API
      const errorMsg = response.error || (response as unknown as { message?: string }).message || 'Login failed';
      return { success: false, error: errorMsg };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error - is the backend running?' };
    }
  };

  const registerCandidate = async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await api.post<AuthResponse>('/auth/register/candidate', {
      email,
      password,
      firstName,
      lastName
    });

    if (response.success && response.data) {
      api.setTokens(response.data.accessToken, response.data.refreshToken, response.data.expiresAt);
      await checkAuth();
      router.push('/candidate/onboard');
      return { success: true };
    }

    // Handle both 'error' and 'message' fields from API
    const errorMsg = response.error || (response as unknown as { message?: string }).message || 'Registration failed';
    return { success: false, error: errorMsg };
  };

  const registerCompany = async (email: string, password: string, companyName: string, industry: string) => {
    const response = await api.post<AuthResponse>('/auth/register/company', {
      email,
      password,
      companyName,
      industry
    });

    if (response.success && response.data) {
      api.setTokens(response.data.accessToken, response.data.refreshToken, response.data.expiresAt);
      await checkAuth();
      router.push('/company/dashboard');
      return { success: true };
    }

    // Handle both 'error' and 'message' fields from API
    const errorMsg = response.error || (response as unknown as { message?: string }).message || 'Registration failed';
    return { success: false, error: errorMsg };
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerCandidate,
        registerCompany,
        logout
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
