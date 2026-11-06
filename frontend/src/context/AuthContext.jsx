// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../lib/api';
import { getUser, saveSession, clearSession, SESSION_EXPIRED_EVENT } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getUser());
  const [sesionExpirada, setSesionExpirada] = useState(false);

  useEffect(() => {
    const onSessionExpired = () => {
      setUsuario(null);
      setSesionExpirada(true);
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    saveSession(data);
    setSesionExpirada(false);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSesionExpirada(false);
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, sesionExpirada }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
