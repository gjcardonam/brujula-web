/**
 * UUID v4 para el token de idempotencia de los intentos (HU-016).
 *
 * No se usa `crypto.randomUUID()` directamente porque solo existe en contextos seguros
 * (HTTPS o localhost). Al abrir la aplicación por la IP de la red en HTTP —como se hace
 * en las pruebas del equipo— no está definido, y llamarlo rompía la pantalla del ejercicio.
 */
export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()

  const bytes = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40   // versión 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80   // variante RFC 4122
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
