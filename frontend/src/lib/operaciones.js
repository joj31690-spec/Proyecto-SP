// getRandomValues también funciona al abrir la VM por HTTP en la red local.
export function nuevaSolicitud() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');
}
