import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movimientos from './pages/Movimientos';
import Presupuestos from './pages/Presupuestos';
import Metas from './pages/Metas';
import Recurrentes from './pages/Recurrentes';
import Planificacion from './pages/Planificacion';
import Configuracion from './pages/Configuracion';
import Prestamos from './pages/Prestamos';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="movimientos" element={<Movimientos />} />
            <Route path="presupuestos" element={<Navigate to="/planificacion/presupuestos" replace />} />
            <Route path="metas" element={<Metas />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="prestamos" element={<Prestamos />} />
            <Route path="recurrentes" element={<Navigate to="/planificacion/recurrentes" replace />} />
            <Route path="planificacion" element={<Planificacion />}>
              <Route index element={<Navigate to="presupuestos" replace />} />
              <Route path="presupuestos" element={<Presupuestos />} />
              <Route path="recurrentes" element={<Recurrentes />} />
            </Route>
          </Route>
          <Route path="*" element={<RequireAuth><AppLayout /></RequireAuth>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
