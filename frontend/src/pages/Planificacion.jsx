import { NavLink, Outlet } from 'react-router-dom';

export default function Planificacion() {
  return <><div className="page planning-header"><h1 className="page-title">Planificación</h1><nav className="tabs" aria-label="Planificación"><NavLink to="presupuestos" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>Presupuestos</NavLink><NavLink to="recurrentes" className={({ isActive }) => `tab${isActive ? ' active' : ''}`}>Pagos recurrentes</NavLink></nav></div><Outlet /></>;
}
