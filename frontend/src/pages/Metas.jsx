import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { dia, fechaVisible, hoy } from '../lib/fechas';
import { formatMonto } from '../components/TarjetaResumen';
import ProgresoMeta from '../components/ProgresoMeta';

const nueva = () => ({ nombre: '', objetivo: '', fechaObjetivo: '' });
const aporteNuevo = () => ({ monto: '', fecha: hoy(), nota: '' });

export default function Metas() {
  const [metas, setMetas] = useState([]);
  const [form, setForm] = useState(nueva);
  const [editando, setEditando] = useState(null);
  const [abierta, setAbierta] = useState(null);
  const [aporte, setAporte] = useState(aporteNuevo);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => setMetas(await api.getMetas());
  useEffect(() => { cargar().catch((e) => setError(e.message)).finally(() => setCargando(false)); }, []);
  const ejecutar = async (accion, exito) => {
    if (ocupado) return;
    setOcupado(true); setError(''); setMensaje('');
    try { await accion(); await cargar(); setMensaje(exito); }
    catch (e) { setError(e.message); }
    finally { setOcupado(false); }
  };
  const guardar = (e) => {
    e.preventDefault();
    ejecutar(async () => { await api.saveMeta(editando, form); setForm(nueva()); setEditando(null); }, editando ? 'Meta actualizada.' : 'Meta creada. Ya puedes registrar tu primer aporte.');
  };
  const editar = (meta) => {
    setEditando(meta.id); setForm({ nombre: meta.nombre, objetivo: String(meta.objetivo), fechaObjetivo: dia(meta.fechaObjetivo) });
    document.getElementById('form-meta')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const total = metas.reduce((s, m) => s + Number(m.ahorrado), 0);

  return <div className="page stack">
    <header><h1 className="page-title">Metas de ahorro</h1><p className="muted">Ponle nombre a lo que quieres lograr y sigue cada aporte.</p></header>
    <div className="card goal-summary row-between row-wrap"><div><span className="muted">Ahorrado en tus metas</span><div className="monto goal-total">{formatMonto(total)}</div></div><div><strong>{metas.filter((m) => m.completada).length}</strong> de {metas.length} metas alcanzadas</div></div>
    <p className="muted">Los aportes registran dinero que ya separaste para ahorrar. No generan gastos ni cambian tu saldo financiero. No asignes el mismo ahorro a más de una meta.</p>
    {error && <div className="alert alert-error" role="alert">{error}</div>}
    {mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    <form id="form-meta" className="card stack" onSubmit={guardar}>
      <h2>{editando ? 'Editar meta' : 'Nueva meta'}</h2>
      <div className="filters-grid">
        <div className="field"><label htmlFor="meta-nombre">Nombre de la meta</label><input id="meta-nombre" className="input" required maxLength={100} placeholder="Ej. Fondo para imprevistos" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
        <div className="field"><label htmlFor="meta-objetivo">Objetivo (Bs)</label><input id="meta-objetivo" className="input" required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} /></div>
        <div className="field"><label htmlFor="meta-fecha">Fecha objetivo (opcional)</label><input id="meta-fecha" className="input" type="date" value={form.fechaObjetivo} onChange={(e) => setForm({ ...form, fechaObjetivo: e.target.value })} /></div>
      </div>
      <div className="row row-wrap"><button className="btn btn-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : editando ? 'Guardar meta' : 'Crear meta'}</button>{editando && <button type="button" className="btn btn-ghost" disabled={ocupado} onClick={() => { setEditando(null); setForm(nueva()); }}>Cancelar edición</button>}</div>
    </form>
    {cargando ? <div className="spinner" /> : metas.length === 0 ? <div className="card empty"><h2 className="empty-title">Tu primera meta empieza aquí</h2><p>Define un objetivo y registra los aportes que vayas separando.</p></div> : <div className="grid goals-grid">{metas.map((meta) => <article className="card stack" key={meta.id}>
      <ProgresoMeta meta={meta} />
      <div className="row row-wrap">
        <button className="btn btn-primary btn-sm" disabled={ocupado} onClick={() => { setAbierta(abierta === meta.id ? null : meta.id); setAporte(aporteNuevo()); }}>{abierta === meta.id ? 'Cerrar aportes' : 'Ver y añadir aportes'}</button>
        <button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => editar(meta)}>Editar meta</button>
        <button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { if (window.confirm(`¿Eliminar la meta “${meta.nombre}” y su historial de aportes? Tu saldo financiero no cambiará.`)) ejecutar(async () => { await api.deleteMeta(meta.id); if (editando === meta.id) { setEditando(null); setForm(nueva()); } }, 'Meta eliminada.'); }}>Eliminar meta</button>
      </div>
      {abierta === meta.id && <div className="stack contribution-panel">
        <form className="stack" onSubmit={(e) => { e.preventDefault(); ejecutar(async () => { await api.createAporte(meta.id, aporte); setAporte(aporteNuevo()); }, 'Aporte registrado.'); }}>
          <h4>Registrar aporte</h4>
          <div className="filters-grid">
            <div className="field"><label htmlFor={`aporte-monto-${meta.id}`}>Aporte (Bs)</label><input id={`aporte-monto-${meta.id}`} className="input" type="number" required min="0.01" max="9999999999.99" step="0.01" value={aporte.monto} onChange={(e) => setAporte({ ...aporte, monto: e.target.value })} /></div>
            <div className="field"><label htmlFor={`aporte-fecha-${meta.id}`}>Fecha del aporte</label><input id={`aporte-fecha-${meta.id}`} className="input" type="date" required max={hoy()} value={aporte.fecha} onChange={(e) => setAporte({ ...aporte, fecha: e.target.value })} /></div>
          </div>
          <div className="field"><label htmlFor={`aporte-nota-${meta.id}`}>Nota (opcional)</label><input id={`aporte-nota-${meta.id}`} className="input" maxLength={255} value={aporte.nota} onChange={(e) => setAporte({ ...aporte, nota: e.target.value })} /></div>
          <button className="btn btn-primary" disabled={ocupado}>Registrar aporte</button>
        </form>
        <h4>Historial de aportes</h4>
        {!meta.aportes.length && <p className="muted">Aún no hay aportes en esta meta.</p>}
        {meta.aportes.map((a) => <div className="row-between" key={a.id}><div><strong className="monto">{formatMonto(a.monto)}</strong><div className="muted">{fechaVisible(a.fecha)}{a.nota ? ` · ${a.nota}` : ''}</div></div><button className="btn btn-danger btn-sm" disabled={ocupado} aria-label={`Eliminar aporte de ${formatMonto(a.monto)}`} onClick={() => { if (window.confirm('¿Eliminar este aporte del seguimiento de ahorro?')) ejecutar(() => api.deleteAporte(meta.id, a.id), 'Aporte eliminado.'); }}>Eliminar</button></div>)}
      </div>}
    </article>)}</div>}
  </div>;
}
