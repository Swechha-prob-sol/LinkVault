import { createContext, useCallback, useEffect, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser } from '../api/auth';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCurrentUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    setError(null);
    try {
      await registerUser({ username, email, password });
      const data = await loginUser({ email, password });
      localStorage.setItem('access_token', data.access_token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setUser(null);
  }, []);

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
