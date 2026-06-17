// ============================================================================
// AuthContext — lightweight user session for Vepay prototype
// Persisted to localStorage. In production this would integrate with
// Nomba's identity/KYC layer or a Supabase auth provider.
// ============================================================================

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
  preferredMode: 'EXPRESS' | 'PRO';
  joinedAt: number;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (name: string, email: string, mode: 'EXPRESS' | 'PRO') => void;
  signOut: () => void;
  updateUser: (patch: Partial<Pick<User, 'name' | 'email' | 'preferredMode'>>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_KEY = 'vepay.auth.v1';

const AVATAR_COLORS = [
  '#7c5cff', '#0f9d58', '#f5a623', '#e5484d',
  '#3fe0c5', '#ff5470', '#ffb950', '#0b8de5',
];

function colorFromString(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = s.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser);

  useEffect(() => {
    try {
      if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      else localStorage.removeItem(AUTH_KEY);
    } catch { /* ignore */ }
  }, [user]);

  const signIn = useCallback((name: string, email: string, mode: 'EXPRESS' | 'PRO') => {
    const trimmedName = name.trim() || 'User';
    const newUser: User = {
      id: `user_${Date.now().toString(36)}`,
      name: trimmedName,
      email: email.trim(),
      avatarColor: colorFromString(email || trimmedName),
      initials: getInitials(trimmedName),
      preferredMode: mode,
      joinedAt: Date.now(),
    };
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  }, []);

  const updateUser = useCallback((patch: Partial<Pick<User, 'name' | 'email' | 'preferredMode'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      if (patch.name) {
        updated.initials = getInitials(patch.name);
        updated.avatarColor = colorFromString(patch.email ?? prev.email ?? patch.name);
      }
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, signIn, signOut, updateUser }),
    [user, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
