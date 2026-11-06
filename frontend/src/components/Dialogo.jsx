import { useEffect, useId, useRef } from 'react';

export default function Dialogo({ titulo, children, onCerrar, ocupado = false, lateral = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previo; };
  }, []);
  return <dialog ref={ref} className={`dialogo${lateral ? ' dialogo-lateral' : ''}`} aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); if (!ocupado) onCerrar(); }}>
    <div className="dialogo-header"><h2 id={titleId}>{titulo}</h2><button type="button" className="btn btn-ghost btn-sm" aria-label="Cerrar formulario" disabled={ocupado} onClick={onCerrar}>✕</button></div>
    {children}
  </dialog>;
}
