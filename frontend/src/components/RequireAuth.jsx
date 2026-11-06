// frontend/src/components/RequireAuth.jsx
// Envuelve rutas protegidas: redirige a /login si no hay sesión.
import { Navigate, useLocation } from 'react-router-dom';
import { isAutenticado } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { usuario } = useAuth();
  if (!usuario || !isAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
