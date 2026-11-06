import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { dia, fechaVisible, hoy } from '../lib/fechas';
import { formatMonto } from '../components/TarjetaResumen';
import ProgresoMeta from '../components/ProgresoMeta';
import Dialogo from '../components/Dialogo';
import { nuevaSolicitud } from '../lib/operaciones';

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [dialogo, setDialogo] = useState(null);
  const [form, setForm] = useState({});
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const cargar = async () => {
    const [m, r, c] = await Promise.all([api.getMetas(), api.getDashboard(), api.getCategorias()]);
    setMetas(m); setResumen(r); setCategorias(c.filter((cat) => cat.tipo === 'gasto'));
  };
  useEffect(() => { cargar().catch((e) => setError(e.message)).finally(() => setCargando(false)); }, []);
  const abrir = (accion, meta) => {
    setErrorForm(''); setDialogo({ accion, metaId: meta?.id });
    setForm(accion === 'meta' ? { nombre: meta?.nombre || '', objetivo: meta ? String(meta.objetivo) : '', fechaObjetivo: dia(meta?.fechaObjetivo) } : { monto: '', fecha: hoy(), nota: '', categoriaId: '', metodoPago: 'Efectivo', solicitud: nuevaSolicitud() });
  };
  const ejecutar = async (accion, exito, cerrar = true) => {
    if (ocupado) return;
    setOcupado(true); setErrorForm(''); setError('');
    try { await accion(); await cargar(); setMensaje(exito); if (cerrar) setDialogo(null); }
    catch (e) { (dialogo ? setErrorForm : setError)(e.message); }
    finally { setOcupado(false); }
  };
  const meta = metas.find((m) => m.id === dialogo?.metaId);
  const accion = dialogo?.accion;
  const guardar = (e) => {
    e.preventDefault();
    if (accion === 'meta') ejecutar(() => api.saveMeta(meta?.id, form), meta ? 'Meta actualizada.' : 'Meta creada.');
    else if (accion === 'aporte') ejecutar(() => api.createAporte(meta.id, form), 'Aporte reservado en tu meta.');
    else ejecutar(() => api.createRetiro(meta.id, { ...form, crearGasto: accion === 'gasto' }), accion === 'gasto' ? 'Retiro y gasto registrados juntos.' : 'Ahorro liberado: vuelve a estar disponible.');
  };
  const onInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const titulos = { meta: meta ? 'Editar meta' : 'Nueva meta', aporte: 'Añadir aporte', retiro: 'Retirar ahorro', gasto: 'Usar ahorro para un gasto', historial: 'Historial de la meta' };

  return <div className="page stack">
    <header className="row-between row-wrap"><div><h1 className="page-title">Metas de ahorro</h1><p className="muted">Reserva dinero para tus objetivos y sigue cada aporte o retiro.</p></div><button className="btn btn-primary" onClick={() => abrir('meta')}>+ Nueva meta</button></header>
    <div className="card goal-summary row-between row-wrap"><div><span className="muted">Reservado en tus metas</span><div className="monto goal-total">{formatMonto(resumen?.reservado || 0)}</div></div><div><span className="muted">Disponible para reservar</span><div className="monto">{formatMonto(resumen?.disponible || 0)}</div></div></div>
    {resumen?.disponible < 0 && <div className="alert alert-error">Tus reservas superan el saldo registrado. Conservamos tus aportes anteriores: revisa tus movimientos o retira ahorro de las metas para ajustar lo reservado.</div>}
    {error && <div className="alert alert-error" role="alert">{error}</div>}{mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    {cargando ? <div className="spinner" /> : !metas.length ? <div className="card empty"><h2 className="empty-title">Tu primera meta empieza aquí</h2><p>Crea un objetivo y reserva parte de tu dinero disponible.</p></div> : <div className="grid goals-grid">{metas.map((m) => <article key={m.id} className="card stack">
      <ProgresoMeta meta={m} />
      <div className="row-between row-wrap"><button className="btn btn-primary btn-sm" disabled={ocupado} onClick={() => abrir('aporte', m)}>Añadir aporte</button><details className="menu-actions"><summary className="btn btn-ghost btn-sm" aria-label={`Opciones de ${m.nombre}`}>Más opciones ⋯</summary><div className="menu-options">
        <button className="btn btn-ghost btn-sm" disabled={ocupado || Number(m.ahorrado) <= 0} onClick={() => abrir('retiro', m)}>Retirar ahorro</button>
        <button className="btn btn-ghost btn-sm" disabled={ocupado || Number(m.ahorrado) <= 0} onClick={() => abrir('gasto', m)}>Usar para un gasto</button>
        <button className="btn btn-ghost btn-sm" onClick={() => abrir('historial', m)}>Ver historial</button>
        <button className="btn btn-ghost btn-sm" onClick={() => abrir('meta', m)}>Editar meta</button>
        <button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { if (window.confirm(`¿Eliminar “${m.nombre}” y su historial? El dinero reservado quedará disponible. Los gastos ya realizados se conservarán.`)) ejecutar(() => api.deleteMeta(m.id), 'Meta eliminada. Los gastos realizados se conservan.'); }}>Eliminar meta</button>
      </div></details></div>
    </article>)}</div>}
    {dialogo && <Dialogo titulo={titulos[accion]} ocupado={ocupado} onCerrar={() => setDialogo(null)}>
      {errorForm && <div className="alert alert-error section-gap" role="alert">{errorForm}</div>}
      {accion === 'historial' ? <div className="stack"><h3>{meta?.nombre}</h3>{!meta?.aportes.length && <p className="muted">Todavía no hay operaciones.</p>}{meta?.aportes.map((a) => <div key={a.id} className="contribution-panel stack"><div className="row-between row-wrap"><strong className={`monto ${a.tipo === 'retiro' ? 'monto-neg' : 'monto-pos'}`}>{a.tipo === 'retiro' ? '−' : '+'}{formatMonto(a.monto)}</strong><span className="badge">{a.tipo === 'aporte' ? 'Aporte' : a.movimientoId ? 'Retiro con gasto' : 'Retiro'}</span></div><p className="muted">{fechaVisible(a.fecha)}{a.nota ? ` · ${a.nota}` : ''}</p><div className="row row-wrap">{a.movimientoId && <Link to="/movimientos" className="btn btn-ghost btn-sm">Ver movimientos</Link>}<button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { if (window.confirm(a.movimientoId ? '¿Corregir esta operación? Se eliminarán el retiro y su gasto vinculado.' : '¿Eliminar este registro incorrecto? Para una retirada real, utiliza Retirar ahorro.')) ejecutar(() => api.deleteAporte(meta.id, a.id), 'Operación corregida.', false); }}>Corregir registro</button></div></div>)}</div> : <form className="stack" onSubmit={guardar}>
        {accion === 'meta' ? <>
          <div className="field"><label htmlFor="meta-nombre">Nombre de la meta</label><input id="meta-nombre" name="nombre" className="input" required maxLength={100} value={form.nombre} onChange={onInput} /></div>
          <div className="field"><label htmlFor="meta-objetivo">Objetivo (Bs)</label><input id="meta-objetivo" name="objetivo" className="input" required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.objetivo} onChange={onInput} /></div>
          <div className="field"><label htmlFor="meta-fecha">Fecha objetivo (opcional)</label><input id="meta-fecha" name="fechaObjetivo" className="input" type="date" value={form.fechaObjetivo} onChange={onInput} /></div>
        </> : <>
          <h3>{meta?.nombre}</h3><p className="muted">{accion === 'aporte' ? `Puedes reservar hasta ${formatMonto(Math.max(0, resumen?.disponible || 0))}. Esto no crea un gasto.` : accion === 'gasto' ? 'Se reducirán el ahorro reservado y el saldo por el mismo importe, una sola vez.' : 'Este dinero dejará de estar reservado. Tu saldo total no cambia.'}</p>
          <div className="field"><label htmlFor="ahorro-monto">Monto (Bs)</label><input id="ahorro-monto" name="monto" className="input" type="number" required min="0.01" max={accion === 'aporte' ? Math.max(0, resumen?.disponible || 0) : Number(meta?.ahorrado || 0)} step="0.01" value={form.monto} onChange={onInput} /></div>
          <div className="field"><label htmlFor="ahorro-fecha">Fecha</label><input id="ahorro-fecha" name="fecha" className="input" type="date" required max={hoy()} value={form.fecha} onChange={onInput} /></div>
          <div className="field"><label htmlFor="ahorro-nota">Motivo o nota</label><input id="ahorro-nota" name="nota" className="input" maxLength={255} value={form.nota} onChange={onInput} /></div>
          {accion === 'gasto' && <><div className="field"><label htmlFor="ahorro-categoria">Categoría del gasto</label><select id="ahorro-categoria" name="categoriaId" className="input" required value={form.categoriaId} onChange={onInput}><option value="">Selecciona…</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><Link to="/configuracion">Administrar categorías</Link></div><div className="field"><label htmlFor="ahorro-pago">Método de pago</label><input id="ahorro-pago" name="metodoPago" className="input" maxLength={50} value={form.metodoPago} onChange={onInput} /></div></>}
        </>}
        <button className="btn btn-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : accion === 'meta' ? 'Guardar meta' : accion === 'aporte' ? 'Reservar aporte' : accion === 'gasto' ? 'Registrar retiro y gasto' : 'Retirar ahorro'}</button>
      </form>}
    </Dialogo>}
  </div>;
}
