// frontend/src/pages/Movimientos.jsx
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import MovimientoItem from '../components/MovimientoItem';
import { hoy } from '../lib/fechas';

const filtrosVacios = { buscar: '', desde: '', hasta: '', categoriaId: '', tipo: '', metodoPago: '' };
const nuevo = () => ({ tipo: 'gasto', monto: '', descripcion: '', fecha: hoy(), metodoPago: '', categoriaId: '' });

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [aplicados, setAplicados] = useState(filtrosVacios);
  const [metodos, setMetodos] = useState([]);
  const secuencia = useRef(0);

  const [form, setForm] = useState({
    tipo: 'gasto',
    monto: '',
    descripcion: '',
    fecha: hoy(),
    metodoPago: '',
    categoriaId: '',
  });

  const cargar = () => {
    const turno = ++secuencia.current;
    setCargando(true);
    Promise.all([api.getMovimientos(aplicados), api.getCategorias(), api.getMetodos()])
      .then(([m, c, pagos]) => {
        if (turno !== secuencia.current) return;
        setMovimientos(m);
        setCategorias(c);
        setMetodos(pagos);
        setError('');
      })
      .catch((e) => { if (turno === secuencia.current) setError(e.message); })
      .finally(() => { if (turno === secuencia.current) setCargando(false); });
  };

  useEffect(() => { cargar(); return () => { secuencia.current++; }; }, [aplicados]);

  const onInput = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const crear = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const payload = {
        ...form,
        categoriaId: Number(form.categoriaId),
      };
      if (editando) await api.updateMovimiento(editando, payload);
      else await api.createMovimiento(payload);
      setMensaje(editando ? 'Movimiento actualizado. Si no aparece, revisa los filtros activos.' : 'Movimiento registrado.');
      setEditando(null);
      setForm(nuevo());
      cargar();
    } catch (err) {
      setError(err.message);
    } finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    const movimiento = movimientos.find((m) => m.id === id);
    const aviso = movimiento?.recurrenteId ? '¿Eliminar este pago de movimientos? El calendario del gasto recurrente no retrocederá.' : '¿Eliminar este movimiento?';
    if (!window.confirm(aviso)) return;
    try {
      await api.deleteMovimiento(id);
      if (editando === id) { setEditando(null); setForm(nuevo()); }
      cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filtrar categorías según el tipo seleccionado
  const categoriasVisibles = categorias.filter((c) => c.tipo === form.tipo);
  const editar = (m) => {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(m.fecha));
    setEditando(m.id);
    setForm({ tipo: m.tipo, monto: String(m.monto), descripcion: m.descripcion || '', fecha: date, metodoPago: m.metodoPago || '', categoriaId: String(m.categoriaId) });
    setMensaje('');
    document.getElementById('form-movimiento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      <div className="row-between row-wrap">
        <div>
          <h1 className="page-title">Movimientos</h1>
          <p className="page-subtitle">Registra y administra tus ingresos y gastos.</p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}
      {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}

      <form className="card stack section-gap" onSubmit={(e) => { e.preventDefault(); setMensaje(''); setAplicados({ ...filtros }); }}>
        <h2>Buscar y filtrar</h2>
        <div className="filters-grid">
          <div className="field"><label htmlFor="buscar">Buscar descripción</label><input className="input" id="buscar" value={filtros.buscar} onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })} placeholder="Ej. alquiler" /></div>
          <div className="field"><label htmlFor="desde">Desde</label><input className="input" id="desde" type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></div>
          <div className="field"><label htmlFor="hasta">Hasta</label><input className="input" id="hasta" type="date" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></div>
          <div className="field"><label htmlFor="filtro-tipo">Tipo</label><select id="filtro-tipo" className="input" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value, categoriaId: '' })}><option value="">Todos</option><option value="ingreso">Ingresos</option><option value="gasto">Gastos</option></select></div>
          <div className="field"><label htmlFor="filtro-categoria">Categoría</label><select id="filtro-categoria" className="input" value={filtros.categoriaId} onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}><option value="">Todas</option>{categorias.filter((c) => !filtros.tipo || c.tipo === filtros.tipo).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
          <div className="field"><label htmlFor="filtro-pago">Método de pago</label><select id="filtro-pago" className="input" value={filtros.metodoPago} onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}><option value="">Todos</option>{metodos.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="row row-wrap"><button className="btn btn-primary">Aplicar filtros</button><button type="button" className="btn btn-ghost" onClick={() => { setFiltros(filtrosVacios); setAplicados({ ...filtrosVacios }); }}>Limpiar filtros</button><span className="muted" aria-live="polite">{cargando ? 'Buscando…' : `${movimientos.length} ${movimientos.length === 1 ? 'resultado' : 'resultados'}`}</span></div>
      </form>

      <div className="grid work-grid">
        {/* Formulario de alta */}
        <form id="form-movimiento" onSubmit={crear} className="card stack">
          <h2 style={{ fontSize: '1.1rem' }}>{editando ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>

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
              maxLength={255}
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
              list="metodos-pago"
              maxLength={50}
              value={form.metodoPago}
              onChange={onInput}
            />
          </div>
          <datalist id="metodos-pago">{[...new Set(['Efectivo', 'QR', 'Transferencia', 'Tarjeta', ...metodos])].map((m) => <option key={m} value={m} />)}</datalist>

          <button className="btn btn-primary" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar movimiento'}</button>
          {editando && <button className="btn btn-ghost" type="button" disabled={guardando} onClick={() => { setEditando(null); setForm(nuevo()); }}>Cancelar edición</button>}
        </form>

        {/* Listado */}
        <div className="stack">
          <h2 style={{ fontSize: '1.1rem' }}>Historial</h2>
          {cargando ? (
            <div className="spinner" />
          ) : movimientos.length === 0 ? (
            <div className="card empty">
              <div className="empty-title">Sin resultados</div>
              <p>Prueba otros filtros o registra un movimiento con el formulario.</p>
            </div>
          ) : (
            movimientos.map((m) => (
              <MovimientoItem key={m.id} movimiento={m} onEliminar={eliminar} onEditar={editar} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
