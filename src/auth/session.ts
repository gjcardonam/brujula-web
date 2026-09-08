import type { Sesion, Usuario } from '../api/types'

const CLAVE = 'brujula.sesion'

export interface SesionGuardada { token: string; expiraEn: string; emitidoEn: string; usuario: Usuario }

type Oyente = (s: SesionGuardada | null) => void
const oyentes = new Set<Oyente>()

export function leerSesion(): SesionGuardada | null {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return null
    const s = JSON.parse(raw) as SesionGuardada
    if (!s.token || !s.usuario) return null
    return s
  } catch {
    return null
  }
}

export function guardarSesion(s: Sesion): SesionGuardada {
  const g: SesionGuardada = { token: s.token, expiraEn: s.expiraEn, emitidoEn: new Date().toISOString(), usuario: s.usuario }
  try { localStorage.setItem(CLAVE, JSON.stringify(g)) } catch { /* sin almacenamiento */ }
  oyentes.forEach(o => o(g))
  return g
}

export function actualizarUsuario(u: Usuario) {
  const s = leerSesion()
  if (!s) return
  const g = { ...s, usuario: u }
  try { localStorage.setItem(CLAVE, JSON.stringify(g)) } catch { /* sin almacenamiento */ }
  oyentes.forEach(o => o(g))
}

export function borrarSesion() {
  try { localStorage.removeItem(CLAVE) } catch { /* sin almacenamiento */ }
  oyentes.forEach(o => o(null))
}

export function suscribir(o: Oyente) {
  oyentes.add(o)
  return () => { oyentes.delete(o) }
}

export function sesionVencida(s: SesionGuardada | null): boolean {
  if (!s) return true
  return new Date(s.expiraEn).getTime() <= Date.now()
}
