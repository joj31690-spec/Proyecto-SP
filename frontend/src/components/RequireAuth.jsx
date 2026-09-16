// frontend/src/components/RequireAuth.jsx
// Envuelve rutas protegidas: redirige a /login si no hay sesión.
import { Navigate, useLocation } from 'react-router-dom';
import { isAutenticado } from '../lib/auth';

export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAutenticado()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}
