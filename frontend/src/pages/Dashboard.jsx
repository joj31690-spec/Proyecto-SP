// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import TarjetaResumen, { formatMonto } from '../components/TarjetaResumen';
import MovimientoItem from '../components/MovimientoItem';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
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
