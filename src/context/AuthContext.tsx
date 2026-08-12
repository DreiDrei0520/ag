import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { AppUser } from '../types';
import { auth as authApi, isDemoMode } from '../backend';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  isDemo: boolean;
  refreshUser: () => void | Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isDemo: false,
  refreshUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const latestUser = useRef<AppUser | null>(null);

  useEffect(() => {
    const unsubscribe = authApi.subscribe((nextUser) => {
      latestUser.current = nextUser;
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const nextUser = await authApi.getCurrentUser();
      latestUser.current = nextUser;
      setUser(nextUser);
    } catch {
      /* keep the last known user if the refresh fails */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo: isDemoMode, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
