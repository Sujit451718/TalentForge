import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, getApiError } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [booting, setBooting] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    async function hydrate() {
      if (!token) {
        setBooting(false);
        return;
      }
      try {
        const response = await authApi.me();
        const freshUser = response.data.data;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setBooting(false);
      }
    }

    hydrate();
  }, [token]);

  const login = async (payload) => {
    try {
      const response = await authApi.login(payload);
      const { token: authToken, user: authUser } = response.data.data;
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(authUser));
      setToken(authToken);
      setUser(authUser);
      return authUser;
    } catch (error) {
      throw new Error(getApiError(error));
    }
  };

  const register = async (payload) => {
    try {
      await authApi.register(payload);
      return login({ email: payload.email, password: payload.password });
    } catch (error) {
      throw new Error(getApiError(error));
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // The frontend owns token invalidation in this simulated setup.
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      register,
      updateUser,
    }),
    [token, user, booting],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
