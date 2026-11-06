import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import MovimientoItem from '../components/MovimientoItem';
import Dialogo from '../components/Dialogo';
import { hoy } from '../lib/fechas';

const vacios = { buscar: '', desde: '', hasta: '', categoriaId: '', tipo: '', metodoPago: '' };
const nuevo = () => ({ tipo: 'gasto', monto: '', descripcion: '', fecha: hoy(), metodoPago: '', categoriaId: '' });

export default function Movimientos() {
  const [movimientos, setMovimientos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [metodos, setMetodos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [panelFiltros, setPanelFiltros] = useState(false);
  const [filtros, setFiltros] = useState(vacios);
  const [aplicados, setAplicados] = useState(vacios);
  const [buscar, setBuscar] = useState('');
  const [form, setForm] = useState(nuevo);
  const secuencia = useRef(0);

  const cargar = () => {
    const turno = ++secuencia.current;
    setCargando(true);
    Promise.all([api.getMovimientos(aplicados), api.getCategorias(true), api.getMetodos()])
      .then(([m, c, pagos]) => { if (turno === secuencia.current) { setMovimientos(m); setCategorias(c); setMetodos(pagos); setError(''); } })
      .catch((e) => { if (turno === secuencia.current) setError(e.message); })
      .finally(() => { if (turno === secuencia.current) setCargando(false); });
  };
  useEffect(() => { cargar(); return () => { secuencia.current++; }; }, [aplicados]);
  useEffect(() => { const timer = setTimeout(() => setAplicados((prev) => prev.buscar === buscar ? prev : { ...prev, buscar }), 300); return () => clearTimeout(timer); }, [buscar]);

  const guardar = async (e) => {
    e.preventDefault(); setErrorForm(''); setGuardando(true);
    try {
      if (editando) await api.updateMovimiento(editando, form);
      else await api.createMovimiento(form);
      setMensaje(editando ? 'Movimiento actualizado.' : 'Movimiento registrado.');
      setAbierto(false); cargar();
    } catch (err) { setErrorForm(err.message); }
    finally { setGuardando(false); }
  };
  const editar = (m) => {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(m.fecha));
    setEditando(m.id); setForm({ tipo: m.tipo, monto: String(m.monto), descripcion: m.descripcion || '', fecha: date, metodoPago: m.metodoPago || '', categoriaId: String(m.categoriaId) }); setErrorForm(''); setAbierto(true);
  };
  const eliminar = async (id) => {
    const m = movimientos.find((item) => item.id === id);
    if (!window.confirm(m?.recurrenteId ? '¿Eliminar este pago? El calendario recurrente no retrocederá.' : '¿Eliminar este movimiento?')) return;
    try { await api.deleteMovimiento(id); setMensaje('Movimiento eliminado.'); cargar(); }
    catch (e) { setError(e.message); }
  };
  const onInput = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const aplicar = (e) => { e.preventDefault(); setAplicados({ ...filtros, buscar }); setPanelFiltros(false); };
  const quitar = (key) => {
    if (key === 'buscar') setBuscar('');
    setAplicados((prev) => ({ ...prev, [key]: '' })); setFiltros((prev) => ({ ...prev, [key]: '' }));
  };
  const activos = Object.entries(aplicados).filter(([, value]) => value !== '');
  const etiquetas = { desde: 'Desde', hasta: 'Hasta', tipo: 'Tipo', metodoPago: 'Pago', buscar: 'Búsqueda', categoriaId: 'Categoría' };
  const valorEtiqueta = (key, value) => key === 'categoriaId' ? categorias.find((c) => c.id === Number(value))?.nombre || value : value;

  return <div className="page stack">
    <header className="row-between row-wrap"><div><h1 className="page-title">Movimientos</h1><p className="muted">Tu historial de ingresos y salidas de dinero.</p></div><button className="btn btn-primary" onClick={() => { setEditando(null); setForm(nuevo()); setErrorForm(''); setAbierto(true); }}>+ Nuevo movimiento</button></header>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    <div className="toolbar"><div className="search-field"><label htmlFor="buscar" className="sr-only">Buscar movimiento</label><input id="buscar" className="input" type="search" placeholder="Buscar movimiento…" maxLength={255} value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div><button className="btn btn-ghost" aria-expanded={panelFiltros} aria-controls="panel-filtros" onClick={() => { if (!panelFiltros) setFiltros(aplicados); setPanelFiltros(!panelFiltros); }}>Filtros{activos.filter(([k]) => k !== 'buscar').length ? ` · ${activos.filter(([k]) => k !== 'buscar').length}` : ''}</button></div>
    {panelFiltros && <form id="panel-filtros" className="card stack" onSubmit={aplicar}>
      <div className="filters-grid">
        <div className="field"><label htmlFor="desde">Desde</label><input id="desde" className="input" type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} /></div>
        <div className="field"><label htmlFor="hasta">Hasta</label><input id="hasta" className="input" type="date" min={filtros.desde || undefined} value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} /></div>
        <div className="field"><label htmlFor="filtro-tipo">Tipo</label><select id="filtro-tipo" className="input" value={filtros.tipo} onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value, categoriaId: '' })}><option value="">Todos</option><option value="ingreso">Entradas</option><option value="gasto">Salidas</option></select></div>
        <div className="field"><label htmlFor="filtro-categoria">Categoría</label><select id="filtro-categoria" className="input" value={filtros.categoriaId} onChange={(e) => setFiltros({ ...filtros, categoriaId: e.target.value })}><option value="">Todas</option>{categorias.filter((c) => !filtros.tipo || c.tipo === filtros.tipo).map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.archivada ? ' (archivada)' : ''}</option>)}</select></div>
        <div className="field"><label htmlFor="filtro-pago">Método de pago</label><select id="filtro-pago" className="input" value={filtros.metodoPago} onChange={(e) => setFiltros({ ...filtros, metodoPago: e.target.value })}><option value="">Todos</option>{metodos.map((m) => <option key={m}>{m}</option>)}</select></div>
      </div>
      <div className="row"><button className="btn btn-primary">Aplicar filtros</button><button className="btn btn-ghost" type="button" onClick={() => setPanelFiltros(false)}>Cancelar</button></div>
    </form>}
    {activos.length > 0 && <div className="chips">{activos.map(([key, value]) => <button key={key} className="chip" aria-label={`Quitar filtro ${etiquetas[key]}`} onClick={() => quitar(key)}>{etiquetas[key]}: {valorEtiqueta(key, value)} ×</button>)}<button className="btn btn-ghost btn-sm" onClick={() => { setBuscar(''); setFiltros(vacios); setAplicados(vacios); }}>Limpiar filtros</button></div>}
    <div className="row-between"><h2>Historial</h2><span className="muted" aria-live="polite">{cargando ? 'Buscando…' : `${movimientos.length} ${movimientos.length === 1 ? 'resultado' : 'resultados'}`}</span></div>
    {cargando ? <div className="spinner" /> : !movimientos.length ? <div className="card empty"><h3 className="empty-title">Sin resultados</h3><p>Prueba otros filtros o registra tu primer movimiento.</p></div> : <div className="stack">{movimientos.map((m) => <MovimientoItem key={m.id} movimiento={m} onEditar={editar} onEliminar={eliminar} />)}</div>}
    {abierto && <Dialogo titulo={editando ? 'Editar movimiento' : 'Nuevo movimiento'} lateral onCerrar={() => setAbierto(false)} ocupado={guardando}>
      <form className="stack" onSubmit={guardar}>
        {errorForm && <div className="alert alert-error" role="alert">{errorForm}</div>}
        <div className="tipo-toggle">{['gasto', 'ingreso'].map((tipo) => <button key={tipo} type="button" className={`tipo-btn tipo-${tipo}${form.tipo === tipo ? ' active' : ''}`} onClick={() => setForm({ ...form, tipo, categoriaId: '' })}>{tipo === 'gasto' ? 'Gasto' : 'Ingreso'}</button>)}</div>
        <div className="field"><label htmlFor="monto">Monto (Bs)</label><input id="monto" name="monto" className="input" required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.monto} onChange={onInput} /></div>
        <div className="field"><label htmlFor="descripcion">Descripción</label><input id="descripcion" name="descripcion" className="input" maxLength={255} value={form.descripcion} onChange={onInput} /></div>
        <div className="field"><label htmlFor="categoriaId">Categoría</label><select id="categoriaId" name="categoriaId" className="input" required value={form.categoriaId} onChange={onInput}><option value="">Selecciona…</option>{categorias.filter((c) => c.tipo === form.tipo && (!c.archivada || String(c.id) === form.categoriaId)).map((c) => <option key={c.id} value={c.id}>{c.nombre}{c.archivada ? ' (archivada)' : ''}</option>)}</select><Link to="/configuracion">Administrar categorías</Link></div>
        <div className="field"><label htmlFor="fecha">Fecha</label><input id="fecha" name="fecha" className="input" type="date" required value={form.fecha} onChange={onInput} /></div>
        <div className="field"><label htmlFor="metodoPago">Método de pago</label><input id="metodoPago" name="metodoPago" className="input" list="metodos-pago" maxLength={50} value={form.metodoPago} onChange={onInput} /><datalist id="metodos-pago">{[...new Set(['Efectivo', 'QR', 'Transferencia', 'Tarjeta', ...metodos])].map((m) => <option key={m} value={m} />)}</datalist></div>
        <button className="btn btn-primary" disabled={guardando}>{guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar movimiento'}</button>
      </form>
    </Dialogo>}
  </div>;
}
