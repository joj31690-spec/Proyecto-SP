// frontend/src/components/MovimientoItem.jsx
// Fila visual de un movimiento (reutilizada en Dashboard y Movimientos).
import { formatMonto } from './TarjetaResumen';

function formatFecha(fechaStr) {
  const d = new Date(fechaStr);
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export default function MovimientoItem({ movimiento: m, onEliminar }) {
  const esIngreso = m.tipo === 'ingreso';

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
          {m.categoria?.nombre || 'Sin categoría'}
          {m.metodoPago ? ` · ${m.metodoPago}` : ''}
          {' · '}
          {formatFecha(m.fecha)}
        </div>
      </div>
      <div className={`monto ${esIngreso ? 'monto-pos' : 'monto-neg'}`}>
        {esIngreso ? '+' : '−'}
        {formatMonto(m.monto)}
      </div>
      {onEliminar && (
        <button className="btn btn-danger btn-sm" onClick={() => onEliminar(m.id)} title="Eliminar">
          ✕
        </button>
      )}
    </div>
  );
}
