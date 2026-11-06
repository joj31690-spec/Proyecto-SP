// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import TarjetaResumen, { formatMonto } from '../components/TarjetaResumen';
import MovimientoItem from '../components/MovimientoItem';
import ProgresoMeta from '../components/ProgresoMeta';
import { fechaVisible } from '../lib/fechas';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [presupuestos, setPresupuestos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [metas, setMetas] = useState(null);
  const [errorMetas, setErrorMetas] = useState('');
  const [recordatorios, setRecordatorios] = useState(null);
  const [errorRecordatorios, setErrorRecordatorios] = useState('');

  useEffect(() => {
    api.getMetas().then(setMetas).catch((e) => setErrorMetas(e.message));
    api.getRecurrentes().then((rows) => setRecordatorios(rows.filter((r) => ['vencido', 'hoy', 'proximo'].includes(r.estado)))).catch((e) => setErrorRecordatorios(e.message));
  }, []);

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

      <section className="card dashboard-goals" aria-labelledby="titulo-metas">
        <div className="row-between row-wrap"><div><h2 id="titulo-metas">Tus metas de ahorro</h2><p className="muted">Cada aporte te acerca a lo que quieres lograr.</p></div><Link to="/metas" className="btn btn-primary btn-sm">{metas?.length ? 'Administrar metas' : 'Crear mi primera meta'}</Link></div>
        {errorMetas ? <p className="alert alert-error">No se pudieron cargar las metas: {errorMetas}</p> : !metas ? <div className="spinner" /> : metas.length === 0 ? <p className="section-gap" style={{ marginTop: 'var(--space-4)' }}>¿Un fondo para imprevistos, estudios o una herramienta de trabajo? Define tu objetivo y sigue tu progreso aquí.</p> : <>
          <div className="row-between row-wrap contribution-panel" style={{ marginTop: 'var(--space-4)' }}><span><strong className="monto goal-amount">{formatMonto(metas.reduce((s, m) => s + Number(m.ahorrado), 0))}</strong> <span className="muted">separados para tus metas</span></span><span className="muted">{metas.filter((m) => m.completada).length} de {metas.length} alcanzadas</span></div>
          <div className="grid goals-grid">{[...metas.filter((m) => !m.completada), ...metas.filter((m) => m.completada)].slice(0, 3).map((meta) => <div key={meta.id} className="goal-preview"><ProgresoMeta meta={meta} /><Link to="/metas" className="btn btn-ghost btn-sm" style={{ marginTop: 'var(--space-4)' }}>Ver y registrar aportes</Link></div>)}</div>
          {metas.length > 3 && <Link to="/metas">Ver las {metas.length} metas →</Link>}
        </>}
      </section>

      <section className="card" style={{ marginTop: 'var(--space-6)' }} aria-labelledby="titulo-recordatorios">
        <div className="row-between row-wrap"><h2 id="titulo-recordatorios">Recordatorios de pago</h2><Link to="/recurrentes" className="btn btn-ghost btn-sm">Ver pagos recurrentes →</Link></div>
        {errorRecordatorios ? <p className="alert alert-error">No se pudieron cargar los recordatorios: {errorRecordatorios}</p> : !recordatorios ? <div className="spinner" /> : recordatorios.length === 0 ? <p className="muted" style={{ marginTop: 'var(--space-3)' }}>No tienes pagos por vencer dentro de tu periodo de aviso ni pagos atrasados.</p> : <div className="stack" style={{ marginTop: 'var(--space-4)' }}>{recordatorios.map((r) => <div key={r.id} className="row-between row-wrap"><div><strong>{r.nombre}</strong><p className={r.estado === 'vencido' ? 'monto-neg' : 'muted'}>{r.estado === 'vencido' ? 'Vencido' : r.estado === 'hoy' ? 'Vence hoy' : 'Próximo a vencer'} · {fechaVisible(r.proximoVencimiento)}</p></div><span className="monto">{formatMonto(r.monto)}</span><Link to="/recurrentes" className="btn btn-ghost btn-sm">Revisar pago</Link></div>)}</div>}
      </section>

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
