import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api';
import { TOKEN_KEY } from '../api/http';
import { userFromToken, type SessionUser } from './token';

interface AuthValue {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() =>
    userFromToken(localStorage.getItem(TOKEN_KEY)),
  );

  const value = useMemo<AuthValue>(
    () => ({
      user,
      async login(email, password) {
        const { token } = await api.login(email, password);
        localStorage.setItem(TOKEN_KEY, token);
        setUser(userFromToken(token));
      },
      async register(username, email, password) {
        await api.register(username, email, password);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
      },
    }),
    [user],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}
