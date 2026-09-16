// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import TarjetaResumen, { formatMonto } from '../components/TarjetaResumen';
import MovimientoItem from '../components/MovimientoItem';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [presupuestos, setPresupuestos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const ahora = new Date();
    Promise.all([
      api.getDashboard(),
      api.getPresupuestos(ahora.getFullYear(), ahora.getMonth() + 1),
    ])
      .then(([d, p]) => {
        setData(d);
        setPresupuestos(p);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <div className="page"><div className="spinner" /></div>;

  if (!data) {
    return (
      <div className="page">
        <div className="alert alert-error">No se pudo cargar el resumen: {error}</div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="page-title">Resumen</h1>
      <p className="page-subtitle">Tu panorama financiero general.</p>

      <div className="grid grid-cards">
        <TarjetaResumen titulo="Saldo total" monto={data.saldo} icono="🏦" />
        <TarjetaResumen titulo="Ingresos totales" monto={data.totalIngresos} tipo="ingreso" icono="📈" />
        <TarjetaResumen titulo="Gastos totales" monto={data.totalGastos} tipo="gasto" icono="📉" />
        <TarjetaResumen titulo="Balance del mes" monto={data.balanceMes} tipo={data.balanceMes >= 0 ? 'ingreso' : 'gasto'} icono="🗓️" />
      </div>

      {presupuestos && (
        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
          <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Control de presupuestos</h2>
            <Link to="/presupuestos" className="btn btn-ghost btn-sm">Ver presupuestos →</Link>
          </div>

          {presupuestos.length === 0 ? (
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Aún no has definido presupuestos para este mes. <Link to="/presupuestos">Configúralos aquí</Link>.
            </p>
          ) : (
            <div className="stack">
              {presupuestos.map((p) => {
                const pct = p.monto > 0 ? Math.round((p.gastado / p.monto) * 100) : 0;
                const excedido = p.gastado > p.monto;
                return (
                  <div key={p.id} className="row" style={{ gap: 'var(--space-3)' }}>
                    <span className="mov-dot" style={{ backgroundColor: p.categoria.color }} />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <div className="row-between">
                        <span className="mov-desc" style={{ fontSize: '0.9rem' }}>{p.categoria.nombre}</span>
                        <span className={`monto ${excedido ? 'monto-neg' : ''}`} style={{ fontSize: '0.82rem' }}>
                          {formatMonto(p.gastado)} / {formatMonto(p.monto)}
                        </span>
                      </div>
                      <div className="budget-track" style={{ marginTop: 'var(--space-1)' }}>
                        <div
                          className={`budget-fill${excedido ? ' over' : ''}`}
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: excedido ? undefined : p.categoria.color }}
                        />
                      </div>
                    </div>
                    <span className={`budget-pct ${excedido ? 'budget-over-pct' : ''}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 'var(--space-6)' }}>
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '1.2rem' }}>Movimientos recientes</h2>
        </div>

        {data.recientes.length === 0 ? (
          <div className="card empty">
            <div className="empty-title">Sin movimientos todavía</div>
            <p>Registra tu primer movimiento para verlo aquí.</p>
          </div>
        ) : (
          <div className="stack">
            {data.recientes.map((m) => (
              <MovimientoItem key={m.id} movimiento={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
