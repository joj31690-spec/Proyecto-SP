// frontend/src/components/TarjetaResumen.jsx
// Tarjeta informativa para cada métrica del dashboard.
export function formatMonto(monto) {
  return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(Number(monto));
}

export default function TarjetaResumen({ titulo, monto, tipo = 'neutral', icono }) {
  const colorClase =
    tipo === 'ingreso' ? 'monto-pos' : tipo === 'gasto' ? 'monto-neg' : '';

  return (
    <div className="card card-pad-sm card-hover">
      <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
        <span className="muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {titulo}
        </span>
        {icono && <span style={{ fontSize: '1.3rem' }}>{icono}</span>}
      </div>
      <div className={`monto ${colorClase}`} style={{ fontSize: '1.5rem' }}>
        {formatMonto(monto)}
      </div>
    </div>
  );
}
