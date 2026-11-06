import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { dia, fechaVisible, hoy } from '../lib/fechas';
import { formatMonto } from '../components/TarjetaResumen';

const nuevo = () => ({ nombre: '', monto: '', categoriaId: '', metodoPago: 'Efectivo', frecuencia: 'mensual', fechaInicio: hoy(), diasAviso: '3' });
export const estadoTexto = (r) => r.estado === 'vencido' ? `Vencido hace ${Math.abs(r.diasRestantes)} días` : r.estado === 'hoy' ? 'Vence hoy' : r.estado === 'pausado' ? 'Pausado' : `Vence en ${r.diasRestantes} días`;
const frecuencias = { semanal: 'Cada semana', quincenal: 'Cada 14 días', mensual: 'Cada mes', anual: 'Cada año' };

export default function Recurrentes() {
  const [rows, setRows] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [form, setForm] = useState(nuevo);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [pago, setPago] = useState(null);
  const [fechaPago, setFechaPago] = useState(hoy);
  const cargar = async () => { const [r, c] = await Promise.all([api.getRecurrentes(), api.getCategorias()]); setRows(r); setCategorias(c.filter((cat) => cat.tipo === 'gasto')); };
  useEffect(() => { cargar().catch((e) => setError(e.message)).finally(() => setCargando(false)); }, []);
  const ejecutar = async (accion, exito) => {
    if (ocupado) return;
    setOcupado(true); setError(''); setMensaje('');
    try { await accion(); await cargar(); setMensaje(exito); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  };

  return <div className="page stack">
    <header><h1 className="page-title">Gastos recurrentes</h1><p className="muted">Organiza tus pagos y revisa lo que está por vencer.</p></header>
    <div className="alert alert-info">Los recordatorios aparecen aquí y en el resumen desde los días de aviso elegidos. No se envían correos ni notificaciones fuera de la aplicación. Un gasto solo afecta tu saldo al registrar su pago.</div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    <form className="card stack" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { await api.createRecurrente(form); setForm(nuevo()); }, 'Gasto recurrente creado.'); }}>
      <h2>Nuevo gasto recurrente</h2>
      <div className="filters-grid">
        <div className="field"><label htmlFor="rec-nombre">Nombre del gasto</label><input id="rec-nombre" className="input" required maxLength={100} placeholder="Ej. Internet del hogar" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
        <div className="field"><label htmlFor="rec-monto">Monto por pago (Bs)</label><input id="rec-monto" className="input" required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} /></div>
        <div className="field"><label htmlFor="rec-categoria">Categoría del gasto</label><select id="rec-categoria" className="input" required value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}><option value="">Selecciona…</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div>
        <div className="field"><label htmlFor="rec-pago">Método de pago</label><input id="rec-pago" className="input" maxLength={50} list="rec-metodos" value={form.metodoPago} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })} /><datalist id="rec-metodos">{['Efectivo', 'QR', 'Transferencia', 'Tarjeta'].map((m) => <option key={m} value={m} />)}</datalist></div>
        <div className="field"><label htmlFor="rec-frecuencia">Frecuencia</label><select id="rec-frecuencia" className="input" value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}>{Object.entries(frecuencias).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
        <div className="field"><label htmlFor="rec-inicio">Primer vencimiento pendiente</label><input id="rec-inicio" className="input" required type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} /></div>
        <div className="field"><label htmlFor="rec-aviso">Avisar con días de anticipación</label><input id="rec-aviso" className="input" required type="number" min="0" max="30" step="1" value={form.diasAviso} onChange={(e) => setForm({ ...form, diasAviso: e.target.value })} /></div>
      </div>
      <p className="muted">Si eliges el día 29, 30 o 31, los meses más cortos vencerán el último día del mes. El día original se recupera en el siguiente mes.</p>
      <button className="btn btn-primary align-start" disabled={ocupado}>Crear gasto recurrente</button>
    </form>
    <h2>Pagos programados</h2>
    {cargando ? <div className="spinner" /> : rows.length === 0 ? <div className="card empty"><h3 className="empty-title">Sin pagos programados</h3><p>Agrega tu alquiler, servicios u otro gasto que se repita.</p></div> : <div className="stack">{rows.map((r) => <article className={`card stack ${r.estado === 'vencido' ? 'budget-over' : ''}`} key={r.id}>
      <div className="row-between row-wrap"><div><h3>{r.nombre}</h3><p className="muted">{r.categoria.nombre} · {frecuencias[r.frecuencia]} · {r.metodoPago || 'Sin método de pago'}</p></div><strong className="monto">{formatMonto(r.monto)}</strong></div>
      <div className="row-between row-wrap"><span className={`badge ${['vencido', 'hoy'].includes(r.estado) ? 'badge-gasto' : ''}`}>{estadoTexto(r)}</span><span className="muted">Vencimiento: {fechaVisible(r.proximoVencimiento)} · Aviso: {r.diasAviso} días antes</span></div>
      <div className="row row-wrap">
        {r.activo && <button className="btn btn-primary btn-sm" disabled={ocupado} onClick={() => { setPago(r.id); setFechaPago(hoy()); }}>Registrar pago</button>}
        <button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => ejecutar(() => api.estadoRecurrente(r.id, !r.activo), r.activo ? 'Gasto pausado. Se conserva el vencimiento pendiente.' : 'Gasto reactivado.')}>{r.activo ? 'Pausar' : 'Reactivar'}</button>
        <button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { if (window.confirm(`¿Eliminar “${r.nombre}”? Los pagos ya registrados se conservarán en movimientos.`)) ejecutar(() => api.deleteRecurrente(r.id), 'Gasto recurrente eliminado.'); }}>Eliminar</button>
      </div>
      {pago === r.id && r.activo && <form className="stack contribution-panel" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { await api.pagarRecurrente(r.id, { vencimiento: dia(r.proximoVencimiento), fecha: fechaPago }); setPago(null); }, 'Pago registrado en movimientos. El próximo vencimiento fue actualizado.'); }}>
        <p>Se registrará un gasto de <strong>{formatMonto(r.monto)}</strong> por el vencimiento del {fechaVisible(r.proximoVencimiento)}. Si hay cuotas atrasadas, se registran una por una.</p>
        <div className="field"><label htmlFor={`fecha-pago-${r.id}`}>Fecha real del pago</label><input id={`fecha-pago-${r.id}`} className="input" required type="date" max={hoy()} value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} /></div>
        <div className="row row-wrap"><button className="btn btn-primary" disabled={ocupado}>Confirmar pago</button><button className="btn btn-ghost" type="button" disabled={ocupado} onClick={() => setPago(null)}>Cancelar pago</button></div>
      </form>}
    </article>)}</div>}
  </div>;
}
