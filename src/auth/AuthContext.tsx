import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { TOKEN_KEY } from '../api/axios';
import { authService } from '../services/auth.service';
import type { User } from '../types';

const USER_KEY = 'viralstan_admin_user';

interface AuthValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

const readUser = (): User | null => {
  try {
    const stored = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readUser);

  const login = useCallback(async (email: string, password: string, remember = false) => {
    const result = await authService.login(email, password);
    if (result.user.role !== 'admin') throw new Error('This account does not have administrator access.');
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY);
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, result.accessToken);
    storage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, isAuthenticated: Boolean(user && (sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY))), login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
