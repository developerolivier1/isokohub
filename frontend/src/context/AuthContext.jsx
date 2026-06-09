import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getMe()
        .then(({ data }) => {
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.data.token);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.user.tenantId) localStorage.setItem('tenantId', data.data.user.tenantId);
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const { data } = await authAPI.register(userData);
      localStorage.setItem('token', data.data.token);
      if (data.data.refreshToken) localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      if (data.data.user.tenantId) localStorage.setItem('tenantId', data.data.user.tenantId);
      setUser(data.data.user);
      return data.data.user;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isAuthenticated = !!user;
  const isVendor = user?.role === 'vendor';
  const isAdmin = ['tenant_admin', 'superadmin'].includes(user?.role);
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user, loading, error, isAuthenticated, isVendor, isAdmin, isCustomer,
      login, register, logout, updateUser, clearError, setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
