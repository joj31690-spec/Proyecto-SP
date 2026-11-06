import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { dia, fechaVisible, hoy } from '../lib/fechas';
import { formatMonto } from '../components/TarjetaResumen';
import Dialogo from '../components/Dialogo';
import { nuevaSolicitud } from '../lib/operaciones';

export default function Prestamos() {
  const [rows, setRows] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [tipo, setTipo] = useState('debo');
  const [dialogo, setDialogo] = useState(null);
  const [form, setForm] = useState({});
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [mensaje, setMensaje] = useState('');
  const cargar = async () => { const [p, c] = await Promise.all([api.getPrestamos(), api.getCategorias()]); setRows(p); setCategorias(c); };
  useEffect(() => { cargar().catch((e) => setError(e.message)).finally(() => setCargando(false)); }, []);
  const abrir = (accion, p) => {
    setDialogo({ accion, id: p?.id }); setErrorForm('');
    setForm(accion === 'pago' ? { capital: '', intereses: '', categoriaId: '', fecha: hoy(), metodoPago: 'Efectivo', nota: '', solicitud: nuevaSolicitud() } : { persona: p?.persona || '', tipo, monto: '', fecha: hoy(), vencimiento: dia(p?.vencimiento), nota: p?.nota || '', metodoPago: 'Efectivo', solicitud: nuevaSolicitud() });
  };
  const ejecutar = async (accion, exito, cerrar = true) => {
    if (ocupado) return;
    setOcupado(true); setErrorForm(''); setError('');
    try { await accion(); await cargar(); setMensaje(exito); if (cerrar) setDialogo(null); }
    catch (e) { (dialogo ? setErrorForm : setError)(e.message); }
    finally { setOcupado(false); }
  };
  const p = rows.find((r) => r.id === dialogo?.id);
  const accion = dialogo?.accion;
  const onInput = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const guardar = (e) => {
    e.preventDefault();
    if (accion === 'nuevo') ejecutar(() => api.createPrestamo(form), 'Préstamo y movimiento de capital registrados.');
    else if (accion === 'editar') ejecutar(() => api.updatePrestamo(p.id, form), 'Datos del préstamo actualizados.');
    else ejecutar(() => api.createDevolucion(p.id, { ...form, capital: form.capital || '0' }), 'Devolución registrada. El capital pendiente y el saldo fueron actualizados.');
  };
  const titulo = accion === 'nuevo' ? 'Registrar préstamo' : accion === 'editar' ? 'Editar datos del préstamo' : accion === 'pago' ? 'Registrar devolución' : 'Historial del préstamo';
  const lista = [...rows.filter((r) => r.tipo === tipo && r.estado !== 'saldado'), ...rows.filter((r) => r.tipo === tipo && r.estado === 'saldado')];

  return <div className="page stack">
    <header className="row-between row-wrap"><div><h1 className="page-title">Deudas y préstamos</h1><p className="muted">Distingue lo que debes de lo que tienes por cobrar.</p></div><button className="btn btn-primary" onClick={() => abrir('nuevo')}>+ Registrar préstamo</button></header>
    <div className="grid grid-cards">{[['debo', 'Debo en total'], ['me_deben', 'Me deben en total']].map(([value, label]) => <div className="card" key={value}><p className="muted">{label}</p><strong className="monto goal-amount">{formatMonto(rows.filter((r) => r.tipo === value).reduce((s, r) => s + Number(r.pendiente), 0))}</strong></div>)}</div>
    <div className="tabs" role="tablist" aria-label="Dirección del préstamo">{[['debo', 'Debo'], ['me_deben', 'Me deben']].map(([value, label]) => <button key={value} className={`tab${tipo === value ? ' active' : ''}`} role="tab" aria-selected={tipo === value} onClick={() => setTipo(value)}>{label}</button>)}</div>
    {error && <div className="alert alert-error" role="alert">{error}</div>}{mensaje && <div className="alert alert-success" role="status">{mensaje}</div>}
    {cargando ? <div className="spinner" /> : !lista.length ? <div className="card empty"><h2 className="empty-title">{tipo === 'debo' ? 'Sin deudas registradas' : 'Sin préstamos por cobrar'}</h2><p>Registra el dinero que recibiste prestado o que prestaste a otra persona.</p></div> : <div className="stack">{lista.map((r) => <article key={r.id} className={`card stack${r.estado === 'vencido' ? ' budget-over' : ''}`}>
      <div className="row-between row-wrap"><div><h2>{r.persona}</h2><p className="muted">{r.tipo === 'debo' ? 'Recibiste' : 'Prestaste'} {formatMonto(r.monto)} · {fechaVisible(r.fecha)}</p></div><span className={`badge ${r.estado === 'saldado' ? 'badge-ingreso' : r.estado === 'vencido' ? 'badge-gasto' : ''}`}>{r.estado === 'saldado' ? 'Saldado' : r.estado === 'vencido' ? 'Vencido' : 'Pendiente'}</span></div>
      <div className="row-between row-wrap"><span>Pendiente: <strong className="monto">{formatMonto(r.pendiente)}</strong></span><span className="muted">{r.vencimiento ? `Vence: ${fechaVisible(r.vencimiento)}` : 'Sin vencimiento'}</span></div>
      {r.nota && <p className="muted">{r.nota}</p>}
      <div className="row-between row-wrap"><button className="btn btn-primary btn-sm" disabled={ocupado || r.estado === 'saldado'} onClick={() => abrir('pago', r)}>Registrar devolución</button><details className="menu-actions"><summary className="btn btn-ghost btn-sm" aria-label={`Opciones del préstamo de ${r.persona}`}>Más opciones ⋯</summary><div className="menu-options"><button className="btn btn-ghost btn-sm" onClick={() => abrir('historial', r)}>Ver historial</button><button className="btn btn-ghost btn-sm" onClick={() => abrir('editar', r)}>Editar datos</button><button className="btn btn-danger btn-sm" disabled={ocupado} onClick={() => { if (window.confirm('¿Eliminar este registro de préstamo y todos sus movimientos vinculados? Esto corrige el registro y recalcula tu saldo; no equivale a devolver el dinero.')) ejecutar(() => api.deletePrestamo(r.id), 'Registro de préstamo y movimientos vinculados eliminados.'); }}>Eliminar registro</button></div></details></div>
    </article>)}</div>}
    {dialogo && <Dialogo titulo={titulo} ocupado={ocupado} onCerrar={() => setDialogo(null)}>
      {errorForm && <div className="alert alert-error section-gap" role="alert">{errorForm}</div>}
      {accion === 'historial' ? <div className="stack"><h3>{p?.persona}</h3>{p?.pagos.map((pago) => <div key={pago.id} className="contribution-panel stack"><strong>{pago.clase === 'desembolso' ? 'Préstamo inicial' : 'Devolución'}</strong><p>Capital: <span className="monto">{formatMonto(pago.capital)}</span>{Number(pago.intereses) > 0 && <> · Intereses: <span className="monto">{formatMonto(pago.intereses)}</span></>}</p><p className="muted">{fechaVisible(pago.fecha)}{pago.nota ? ` · ${pago.nota}` : ''}</p>{pago.clase === 'devolucion' && <button className="btn btn-danger btn-sm align-start" disabled={ocupado} onClick={() => { if (window.confirm('¿Eliminar esta devolución incorrecta y sus movimientos de capital e intereses? El importe volverá a quedar pendiente.')) ejecutar(() => api.deleteDevolucion(p.id, pago.id), 'Devolución corregida.', false); }}>Corregir devolución</button>}</div>)}</div> : <form className="stack" onSubmit={guardar}>
        {accion === 'pago' ? <>
          <h3>{p?.persona}</h3><p className="muted">Capital pendiente: {formatMonto(p?.pendiente || 0)}. Registra únicamente lo que {p?.tipo === 'debo' ? 'ya devolviste' : 'ya te devolvieron'}.</p>
          <div className="field"><label htmlFor="prest-capital">Capital devuelto (Bs)</label><input id="prest-capital" name="capital" className="input" type="number" min="0" max={Number(p?.pendiente)} step="0.01" value={form.capital} onChange={onInput} placeholder="0.00" /></div>
          <details><summary>Incluir intereses</summary><div className="stack contribution-panel"><div className="field"><label htmlFor="prest-intereses">Intereses {p?.tipo === 'debo' ? 'pagados' : 'cobrados'} (Bs)</label><input id="prest-intereses" name="intereses" className="input" type="number" min="0" max="9999999999.99" step="0.01" value={form.intereses} onChange={onInput} /></div>{Number(form.intereses) > 0 && <div className="field"><label htmlFor="prest-categoria">Categoría de los intereses</label><select id="prest-categoria" name="categoriaId" className="input" required value={form.categoriaId} onChange={onInput}><option value="">Selecciona…</option>{categorias.filter((c) => c.tipo === (p?.tipo === 'debo' ? 'gasto' : 'ingreso')).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select><Link to="/configuracion">Administrar categorías</Link></div>}</div></details>
        </> : <>
          {accion === 'nuevo' && <div className="field"><label htmlFor="prest-tipo">Qué ocurrió</label><select id="prest-tipo" name="tipo" className="input" value={form.tipo} onChange={onInput}><option value="debo">Recibí dinero prestado · Debo</option><option value="me_deben">Presté dinero · Me deben</option></select></div>}
          <div className="field"><label htmlFor="prest-persona">Persona o entidad</label><input id="prest-persona" name="persona" className="input" required maxLength={100} value={form.persona} onChange={onInput} /></div>
          {accion === 'nuevo' && <><div className="field"><label htmlFor="prest-monto">Monto del préstamo (Bs)</label><input id="prest-monto" name="monto" className="input" required type="number" min="0.01" max="9999999999.99" step="0.01" value={form.monto} onChange={onInput} /></div><p className="muted">Se creará la entrada o salida de dinero automáticamente. No la registres otra vez en Movimientos. El capital no se contará como ingreso o gasto habitual.</p></>}
          <div className="field"><label htmlFor="prest-vencimiento">Vencimiento (opcional)</label><input id="prest-vencimiento" name="vencimiento" className="input" type="date" min={accion === 'editar' ? dia(p?.fecha) : form.fecha} value={form.vencimiento} onChange={onInput} /></div>
        </>}
        {accion !== 'editar' && <><div className="field"><label htmlFor="prest-fecha">Fecha de la operación</label><input id="prest-fecha" name="fecha" className="input" required type="date" max={hoy()} min={accion === 'pago' ? dia(p?.fecha) : undefined} value={form.fecha} onChange={onInput} /></div><div className="field"><label htmlFor="prest-metodo">Método de pago</label><input id="prest-metodo" name="metodoPago" className="input" maxLength={50} value={form.metodoPago} onChange={onInput} /></div></>}
        <div className="field"><label htmlFor="prest-nota">Nota (opcional)</label><input id="prest-nota" name="nota" className="input" maxLength={255} value={form.nota} onChange={onInput} /></div>
        <button className="btn btn-primary" disabled={ocupado}>{ocupado ? 'Guardando…' : accion === 'pago' ? 'Registrar devolución' : accion === 'editar' ? 'Guardar datos' : 'Registrar préstamo'}</button>
      </form>}
    </Dialogo>}
  </div>;
}
