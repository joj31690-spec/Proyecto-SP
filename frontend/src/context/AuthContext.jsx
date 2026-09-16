// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { getUser, saveSession, clearSession } from '../lib/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(getUser());

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    saveSession(data);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
