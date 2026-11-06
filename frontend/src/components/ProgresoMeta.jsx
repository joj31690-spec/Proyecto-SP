import { formatMonto } from './TarjetaResumen';
import { dia, fechaVisible, hoy } from '../lib/fechas';

export default function ProgresoMeta({ meta }) {
  const porcentaje = Math.min(100, Math.floor(Number(meta.ahorrado) / Number(meta.objetivo) * 100));
  const vencida = !meta.completada && meta.fechaObjetivo && dia(meta.fechaObjetivo) < hoy();
  return (
    <div className="stack goal-progress">
      <div className="row-between row-wrap">
        <h3>{meta.nombre}</h3>
        <span className={`badge ${meta.completada ? 'badge-ingreso' : vencida ? 'badge-gasto' : ''}`}>{meta.completada ? 'Meta alcanzada' : vencida ? 'Fecha superada' : 'En progreso'}</span>
      </div>
      <div className="row-between row-wrap"><span><strong className="monto goal-amount">{formatMonto(meta.ahorrado)}</strong><span className="muted"> de {formatMonto(meta.objetivo)}</span></span><strong className="monto">{porcentaje}%</strong></div>
      <div className="budget-track goal-track" role="progressbar" aria-label={`Progreso de ${meta.nombre}`} aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}><div className="budget-fill goal-fill" style={{ width: `${porcentaje}%` }} /></div>
      <div className="row-between row-wrap muted"><span>{meta.completada ? '¡Objetivo cumplido!' : `Faltan ${formatMonto(meta.restante)}`}</span><span>{fechaVisible(meta.fechaObjetivo)}</span></div>
    </div>
  );
}
