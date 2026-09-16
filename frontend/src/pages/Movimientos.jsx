// frontend/src/pages/Movimientos.jsx
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import MovimientoItem from '../components/MovimientoItem';

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    tipo: 'gasto',
    monto: '',
    descripcion: '',
    fecha: new Date().toISOString().slice(0, 10),
    metodoPago: '',
    categoriaId: '',
  });

  const cargar = () => {
    setCargando(true);
    Promise.all([api.getMovimientos(), api.getCategorias()])
      .then(([m, c]) => {
        setMovimientos(m);
        setCategorias(c);
        setError('');
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargar, []);

  const onInput = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.createMovimiento({
        ...form,
        monto: Number(form.monto),
        categoriaId: Number(form.categoriaId),
        fecha: new Date(form.fecha).toISOString(),
      });
      setForm((f) => ({ ...f, monto: '', descripcion: '', metodoPago: '' }));
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm('¿Eliminar este movimiento?')) return;
    try {
      await api.deleteMovimiento(id);
      setMovimientos((ms) => ms.filter((m) => m.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtrar categorías según el tipo seleccionado
  const categoriasVisibles = categorias.filter((c) => c.tipo === form.tipo);

  return (
    <div className="page">
      <div className="row-between row-wrap">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle">Registra y administra tus ingresos y gastos.</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Formulario de alta */}
        <form onSubmit={crear} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>Nuevo movimiento</h2>

          <div className="field">
            <label>Tipo</label>
            <div className="tipo-toggle">
              <button
                type="button"
                className={`tipo-btn ${form.tipo === 'gasto' ? 'tipo-gasto active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, tipo: 'gasto', categoriaId: '' }))}
              >
                Gasto
              </button>
              <button
                type="button"
                className={`tipo-btn ${form.tipo === 'ingreso' ? 'tipo-ingreso active' : ''}`}
                onClick={() => setForm((f) => ({ ...f, tipo: 'ingreso', categoriaId: '' }))}
              >
                Ingreso
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="monto">Monto (Bs)</label>
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

          <div className="field">
            <label htmlFor="descripcion">Descripción</label>
            <input
              id="descripcion"
              className="input"
              name="descripcion"
              type="text"
              placeholder="Ej. Supermercado"
              value={form.descripcion}
              onChange={onInput}
            />
          </div>

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
              {categoriasVisibles.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              className="input"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={onInput}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="metodoPago">Método de pago</label>
            <input
              id="metodoPago"
              className="input"
              name="metodoPago"
              type="text"
              placeholder="Efectivo / Tarjeta / Transferencia"
              value={form.metodoPago}
              onChange={onInput}
            />
          </div>

          <button className="btn btn-primary" type="submit">Guardar movimiento</button>
        </form>

        {/* Listado */}
        <div className="stack">
          <h2 style={{ fontSize: '1.1rem' }}>Historial</h2>
          {cargando ? (
            <div className="spinner" />
          ) : movimientos.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">Sin movimientos</div>
              <p>Registra tu primer movimiento con el formulario.</p>
            </div>
          ) : (
            movimientos.map((m) => (
              <MovimientoItem key={m.id} movimiento={m} onEliminar={eliminar} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
