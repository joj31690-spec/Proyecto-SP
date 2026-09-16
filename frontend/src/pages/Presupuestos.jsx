// frontend/src/pages/Presupuestos.jsx
// Presupuestos mensuales por categoría: define límites y controla el gasto real.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { formatMonto } from '../components/TarjetaResumen';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function hoy() {
  const d = new Date();
  return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
}

function etiquetaPeriodo(p) {
  return `${MESES[p.mes - 1]} ${p.anio}`;
}

function formatearMes(m) {
  return String(m).padStart(2, '0');
}

export default function Presupuestos() {
  const [periodo, setPeriodo] = useState(hoy);
  const [presupuestos, setPresupuestos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({ categoriaId: '', monto: '' });

  const cargar = () => {
    setCargando(true);
    Promise.all([api.getPresupuestos(periodo.anio, periodo.mes), api.getCategorias()])
      .then(([p, c]) => {
        setPresupuestos(p);
        setCategorias(c.filter((cat) => cat.tipo === 'gasto'));
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, [periodo]);

  const moverMes = (delta) => {
    const total = periodo.anio * 12 + (periodo.mes - 1) + delta;
    const anio = Math.floor(total / 12);
    const mes = (total % 12) + 1;
    setPeriodo({ anio, mes });
  };

  const onInput = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.savePresupuesto({
        categoriaId: Number(form.categoriaId),
        monto: Number(form.monto),
        anio: periodo.anio,
        mes: periodo.mes,
      });
      setForm({ categoriaId: '', monto: '' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;
    try {
      await api.deletePresupuesto(id);
      setPresupuestos((ps) => ps.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const pct = (p) => (p.monto > 0 ? Math.round((p.gastado / p.monto) * 100) : 0);
  const sobrepasado = (p) => p.gastado > p.monto;

  return (
    <div className="page">
      <div className="row-between row-wrap">
        <div>
          <h1 className="page-title">Presupuestos</h1>
          <p className="page-subtitle">Define límites de gasto por categoría y controla tu mes.</p>
        </div>

        <div className="row budget-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => moverMes(-1)}>← Anterior</button>
          <div className="budget-nav-label">{etiquetaPeriodo(periodo)}</div>
          <button className="btn btn-ghost btn-sm" onClick={() => moverMes(1)}>Siguiente →</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Formulario de alta */}
        <form onSubmit={guardar} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>Nuevo presupuesto</h2>

          <div className="field">
            <label htmlFor="categoriaId">Categoría</label>
            <select
              id="categoriaId"
              className="input"
              name="categoriaId"
              value={form.categoriaId}
              onChange={onInput}
              required
            >
              <option value="">Selecciona…</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="monto">Límite mensual (Bs)</label>
            <input
              id="monto"
              className="input"
              name="monto"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={form.monto}
              onChange={onInput}
              required
            />
          </div>

          <button className="btn btn-primary" type="submit">Guardar presupuesto</button>
          <p className="muted" style={{ fontSize: '0.78rem' }}>
            Se aplicará a <strong>{etiquetaPeriodo(periodo)}</strong>. Si ya existe uno, se actualiza el límite.
          </p>
        </form>

        {/* Listado de presupuestos del periodo */}
        <div className="stack">
          <h2 style={{ fontSize: '1.1rem' }}>Presupuestos de {etiquetaPeriodo(periodo)}</h2>
          {cargando ? (
            <div className="spinner" />
          ) : presupuestos.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">Sin presupuestos</div>
              <p>Define tu primer presupuesto con el formulario.</p>
            </div>
          ) : (
            presupuestos.map((p) => {
              const porcentaje = pct(p);
              const excedido = sobrepasado(p);
              return (
                <div key={p.id} className={`card card-pad-sm ${excedido ? 'budget-over' : ''}`}>
                  <div className="row-between">
                    <div className="row grow" style={{ minWidth: 0 }}>
                      <span className="mov-dot" style={{ backgroundColor: p.categoria.color }} />
                      <div className="mov-info">
                        <div className="mov-desc">{p.categoria.nombre}</div>
                        <div className="muted mov-meta">
                          Gastado <strong className="monto">{formatMonto(p.gastado)}</strong> de {formatMonto(p.monto)}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => eliminar(p.id)} title="Eliminar">✕</button>
                  </div>

                  <div className="budget-track" style={{ marginTop: 'var(--space-3)' }}>
                    <div
                      className={`budget-fill${excedido ? ' over' : ''}`}
                      style={{ width: `${Math.min(porcentaje, 100)}%`, backgroundColor: excedido ? undefined : p.categoria.color }}
                    />
                  </div>

                  <div className="row-between" style={{ marginTop: 'var(--space-2)' }}>
                    <span className={`muted ${excedido ? 'budget-warn' : ''}`} style={{ fontSize: '0.78rem' }}>
                      {excedido
                        ? `Sobrepasado por ${formatMonto(p.gastado - p.monto)}`
                        : `Restante ${formatMonto(p.restante)}`}
                    </span>
                    <span className={`budget-pct ${excedido ? 'budget-over-pct' : ''}`}>{porcentaje}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}