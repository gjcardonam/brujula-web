import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, alExpirarSesion } from '@/api/client'
import type { Sesion, Usuario } from '@/api/types'
import { actualizarUsuario, borrarSesion, guardarSesion, leerSesion, sesionVencida, suscribir, type SesionGuardada } from '@/auth/session'

interface Ctx {
  sesion: SesionGuardada | null
  usuario: Usuario | null
  esAdmin: boolean
  iniciar: (s: Sesion) => void
  cerrar: () => Promise<void>
  actualizar: (u: Usuario) => void
  sesionExpirada: boolean
  descartarExpirada: () => void
}

const AuthCtx = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<SesionGuardada | null>(() => {
    const s = leerSesion()
    if (sesionVencida(s)) { borrarSesion(); return null }
    return s
  })
  const [sesionExpirada, setSesionExpirada] = useState(false)

  useEffect(() => suscribir(setSesion), [])
  useEffect(() => { alExpirarSesion(() => setSesionExpirada(true)) }, [])

  useEffect(() => {
    if (!sesion) return
    const t = setInterval(() => {
      if (sesionVencida(leerSesion())) { borrarSesion(); setSesionExpirada(true) }
    }, 15000)
    return () => clearInterval(t)
  }, [sesion])

  const iniciar = useCallback((s: Sesion) => { setSesionExpirada(false); guardarSesion(s) }, [])
  const cerrar = useCallback(async () => {
    try { await api('/auth/logout', { method: 'POST' }) } catch { void 0 }
    borrarSesion()
  }, [])
  const actualizar = useCallback((u: Usuario) => actualizarUsuario(u), [])
  const descartarExpirada = useCallback(() => setSesionExpirada(false), [])

  const value = useMemo<Ctx>(() => ({
    sesion, usuario: sesion?.usuario ?? null, esAdmin: sesion?.usuario.rol === 'Administrador',
    iniciar, cerrar, actualizar, sesionExpirada, descartarExpirada,
  }), [sesion, iniciar, cerrar, actualizar, sesionExpirada, descartarExpirada])

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx)
  if (!c) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return c
}
