// frontend/src/layout/AppLayout.jsx
// Estructura base de la app autenticada: barra lateral de navegación + contenido.
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Resumen', icon: '◈', end: true },
  { to: '/movimientos', label: 'Movimientos', icon: '↕' },
];

export default function AppLayout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const salir = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">💸</span>
          <div>
            <strong>Finanzas</strong>
            <span>Personal</span>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="side-user">
            <div className="avatar">{usuario?.nombre?.charAt(0) || '?'}</div>
            <div className="side-user-info">
              <strong>{usuario?.nombre}</strong>
              <span className="muted" style={{ fontSize: '0.75rem' }}>{usuario?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={salir} style={{ width: '100%' }}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
