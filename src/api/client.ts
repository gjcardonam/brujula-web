import { borrarSesion, guardarSesion, leerSesion } from '@/auth/session'
import type { Sesion } from '@/api/types'

const BASE = import.meta.env.VITE_API_URL ?? '/api'

export function urlDeArchivo(url: string): string {
  return url.startsWith('/api/') ? BASE + url.slice(4) : url
}

export class ApiError extends Error {
  estado: number
  codigo: string
  detalles: string[]
  extra: Record<string, unknown>
  constructor(estado: number, codigo: string, mensaje: string, detalles: string[] = [], extra: Record<string, unknown> = {}) {
    super(mensaje)
    this.estado = estado
    this.codigo = codigo
    this.detalles = detalles
    this.extra = extra
  }
  get esRed() { return this.estado === 0 }
}

type Opciones = { method?: string; body?: unknown; form?: FormData; auth?: boolean; signal?: AbortSignal }

let oyenteSesionExpirada: (() => void) | null = null
export function alExpirarSesion(f: () => void) { oyenteSesionExpirada = f }

let refrescando: Promise<void> | null = null
const MINUTOS_ENTRE_REFRESCOS = 15

async function refrescarSiConviene() {
  const s = leerSesion()
  if (!s) return
  const emitidoHace = Date.now() - new Date(s.emitidoEn).getTime()
  if (emitidoHace < MINUTOS_ENTRE_REFRESCOS * 60 * 1000) return
  if (refrescando) return refrescando
  refrescando = (async () => {
    try {
      const r = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { Authorization: `Bearer ${s.token}` } })
      if (r.ok) guardarSesion((await r.json()) as Sesion)
    } catch { void 0 } finally { refrescando = null }
  })()
  return refrescando
}

function mensajePorEstado(estado: number): string {
  if (estado >= 500) return 'El servidor no pudo responder. Intenta de nuevo en unos minutos.'
  if (estado === 404) return 'No encontramos lo que buscabas.'
  if (estado === 403) return 'No tienes permiso para hacer esto.'
  return 'No fue posible completar la acción. Intenta de nuevo.'
}

export async function api<T = unknown>(path: string, opts: Opciones = {}): Promise<T> {
  const { method = 'GET', body, form, auth = true, signal } = opts
  const headers: Record<string, string> = {}
  if (!form) headers['Content-Type'] = 'application/json'
  const sesion = leerSesion()
  if (auth && sesion) headers['Authorization'] = `Bearer ${sesion.token}`

  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)), signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError(0, 'SIN_CONEXION', 'No hay conexión con el servidor. Revisa tu red e intenta de nuevo.')
  }

  if (res.status === 204) {
    if (auth && sesion) void refrescarSiConviene()
    return undefined as T
  }
  let datos: unknown = null
  const texto = await res.text()
  if (texto) { try { datos = JSON.parse(texto) } catch { datos = null } }

  if (!res.ok) {
    const d = (datos ?? {}) as Record<string, unknown>
    const err = new ApiError(res.status, String(d.codigo ?? 'ERROR'), String(d.mensaje ?? mensajePorEstado(res.status)),
      Array.isArray(d.detalles) ? (d.detalles as string[]) : [], d)
    if (res.status === 401 && auth && sesion) {
      borrarSesion()
      oyenteSesionExpirada?.()
    }
    throw err
  }
  if (auth && sesion) void refrescarSiConviene()
  return datos as T
}

export function mensajeDe(e: unknown): string {
  if (e instanceof ApiError) return e.detalles.length ? e.detalles.join(' ') : e.message
  if (e instanceof Error) return e.message
  return 'Ocurrió un error inesperado.'
}
