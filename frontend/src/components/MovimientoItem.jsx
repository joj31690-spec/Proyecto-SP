// frontend/src/components/MovimientoItem.jsx
// Fila visual de un movimiento (reutilizada en Dashboard y Movimientos).
import { formatMonto } from './TarjetaResumen';
import { Link } from 'react-router-dom';

function formatFecha(fechaStr) {
  const d = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/La_Paz' }).format(d);
}

export default function MovimientoItem({ movimiento: m, onEliminar, onEditar }) {
  const esIngreso = m.tipo === 'ingreso';
  const vinculo = m.ahorro ? '/metas' : m.capitalPrestamo || m.interesPrestamo || m.naturaleza === 'capital' ? '/prestamos' : null;

  return (
    <div className="card card-pad-sm mov-item">
      <span
        className="mov-dot"
        style={{ backgroundColor: m.categoria?.color || 'var(--green)' }}
        title={m.categoria?.nombre || 'Sin categoría'}
      />
      <div className="mov-info grow">
        <div className="mov-desc">{m.descripcion || 'Sin descripción'}</div>
        <div className="muted mov-meta">
          {m.naturaleza === 'capital' ? 'Capital de préstamo' : m.categoria?.nombre || 'Sin categoría'}
          {m.metodoPago ? ` · ${m.metodoPago}` : ''}
          {' · '}
          {formatFecha(m.fecha)}
        </div>
      </div>
      <div className={`monto ${esIngreso ? 'monto-pos' : 'monto-neg'}`}>
        {esIngreso ? '+' : '−'}
        {formatMonto(m.monto)}
      </div>
      {vinculo && <Link to={vinculo} className="btn btn-ghost btn-sm">Ver {vinculo === '/metas' ? 'meta' : 'préstamo'}</Link>}
      {onEditar && !vinculo && <button className="btn btn-ghost btn-sm" onClick={() => onEditar(m)} aria-label={`Editar ${m.descripcion || 'movimiento'}`}>Editar</button>}
      {onEliminar && !vinculo && (
        <button className="btn btn-danger btn-sm" onClick={() => onEliminar(m.id)} title="Eliminar" aria-label={`Eliminar ${m.descripcion || 'movimiento'}`}>
          ✕
        </button>
      )}
    </div>
  );
}
