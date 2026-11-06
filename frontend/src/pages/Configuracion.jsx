import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import Dialogo from '../components/Dialogo';

const referencias = (c) => Object.values(c._count || {}).reduce((s, n) => s + n, 0);
export default function Configuracion() {
  const [categorias, setCategorias] = useState([]);
  const [tipo, setTipo] = useState('gasto');
  const [archivadas, setArchivadas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [dialogo, setDialogo] = useState(null);
  const [form, setForm] = useState({});
  const [destinoId, setDestinoId] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const cargar = async () => setCategorias(await api.getCategorias(true));
  useEffect(() => { cargar().catch((e) => setError(e.message)).finally(() => setCargando(false)); }, []);
  const ejecutar = async (accion, exito, enDialogo = false) => {
    setOcupado(true); setError(''); setErrorForm('');
    try { await accion(); await cargar(); setMensaje(exito); setDialogo(null); }
    catch (e) { (enDialogo ? setErrorForm : setError)(e.message); }
    finally { setOcupado(false); }
  };
  const abrir = (c) => { setForm(c ? { nombre: c.nombre, tipo: c.tipo, color: c.color } : { nombre: '', tipo, color: '#22c55e' }); setDialogo({ accion: 'editar', categoria: c }); setErrorForm(''); };
  const elegida = dialogo?.categoria;
  return <div className="page stack">
    <header><h1 className="page-title">Configuración</h1><p className="muted">Adapta las categorías a tu forma de organizar el dinero.</p></header>
    <div className="row-between row-wrap"><h2>Categorías</h2><button className="btn btn-primary" onClick={() => abrir(null)}>+ Nueva categoría</button></div>
    <p className="muted">Las categorías iniciales son editables. Archiva las que ya no uses para conservar su historial.</p>
    <div className="tabs" role="tablist" aria-label="Tipo de categorías">{[['gasto', 'Gastos'], ['ingreso', 'Ingresos']].map(([value, label]) => <button key={value} role="tab" aria-selected={tipo === value} className={`tab${tipo === value ? ' active' : ''}`} onClick={() => setTipo(value)}>{label}</button>)}</div>
    <label className="row"><input type="checkbox" checked={archivadas} onChange={(e) => setArchivadas(e.target.checked)} /> Mostrar también archivadas</label>
    {error && <div className="alert alert-error" role="alert">{error}</div>}{mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    {cargando ? <div className="spinner" /> : <div className="stack">{categorias.filter((c) => c.tipo === tipo && (archivadas || !c.archivada)).map((c) => <div key={c.id} className="card row-between row-wrap"><div className="row"><span className="mov-dot" style={{ background: c.color }} /><div><strong>{c.nombre}</strong><div className="muted">{c.archivada ? 'Archivada · ' : ''}{c._count.movimientos} movimientos · {c._count.presupuestos} presupuestos · {c._count.recurrentes} recurrentes</div></div></div><details className="menu-actions"><summary className="btn btn-ghost btn-sm" aria-label={`Opciones de ${c.nombre}`}>Opciones ⋯</summary><div className="menu-options"><button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => abrir(c)}>Editar</button><button className="btn btn-ghost btn-sm" disabled={ocupado} onClick={() => ejecutar(() => api.saveCategoria(c.id, { ...c, archivada: !c.archivada }), c.archivada ? 'Categoría reactivada.' : 'Categoría archivada. Se conservan sus registros y programaciones existentes.')}>{c.archivada ? 'Reactivar' : 'Archivar'}</button><button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { setDialogo({ accion: 'eliminar', categoria: c }); setDestinoId(''); setErrorForm(''); }}>Eliminar</button></div></details></div>)}{!categorias.some((c) => c.tipo === tipo && (archivadas || !c.archivada)) && <div className="card empty">No hay categorías de este tipo. Crea una para empezar.</div>}</div>}
    {dialogo && <Dialogo titulo={dialogo.accion === 'eliminar' ? 'Eliminar categoría' : elegida ? 'Editar categoría' : 'Nueva categoría'} ocupado={ocupado} onCerrar={() => setDialogo(null)}>
      <form className="stack" onSubmit={(e) => { e.preventDefault(); if (dialogo.accion === 'eliminar') ejecutar(() => api.deleteCategoria(elegida.id, destinoId || undefined), 'Categoría eliminada y registros conservados.', true); else ejecutar(() => api.saveCategoria(elegida?.id, form), 'Categoría guardada.', true); }}>
        {errorForm && <div className="alert alert-error" role="alert">{errorForm}</div>}
        {dialogo.accion === 'eliminar' ? <><p>Vas a eliminar <strong>{elegida.nombre}</strong>.</p>{referencias(elegida) > 0 ? <><p className="muted">Tiene registros asociados. Elige otra categoría del mismo tipo para conservarlos. Si prefieres mantenerlos separados, cancela y archiva esta categoría.</p><div className="field"><label htmlFor="categoria-destino">Reasignar registros a</label><select id="categoria-destino" className="input" required value={destinoId} onChange={(e) => setDestinoId(e.target.value)}><option value="">Selecciona…</option>{categorias.filter((c) => c.id !== elegida.id && c.tipo === elegida.tipo && !c.archivada).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></div></> : <p className="muted">No tiene registros asociados.</p>}</> : <>
          <div className="field"><label htmlFor="cat-nombre">Nombre</label><input id="cat-nombre" className="input" required maxLength={80} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></div>
          <div className="field"><label htmlFor="cat-tipo">Tipo</label><select id="cat-tipo" className="input" disabled={Boolean(elegida && referencias(elegida))} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}><option value="gasto">Gasto</option><option value="ingreso">Ingreso</option></select></div>
          <div className="field"><label htmlFor="cat-color">Color</label><input id="cat-color" type="color" className="input color-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        </>}
        <button className={`btn ${dialogo.accion === 'eliminar' ? 'btn-danger' : 'btn-primary'}`} disabled={ocupado}>{ocupado ? 'Guardando…' : dialogo.accion === 'eliminar' ? 'Eliminar categoría' : 'Guardar categoría'}</button>
      </form>
    </Dialogo>}
  </div>;
}
