import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api, mensajeDe } from '@/api/client'
import type { Usuario } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { borrarSesion } from '@/auth/session'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { enfocarPrimerError } from '@/utils/foco'

const PASSWORD = /^(?=.*[a-záéíóúñ])(?=.*[A-ZÁÉÍÓÚÑ])(?=.*\d)(?=.*[.,+\-*_@])\S{8,15}$/

type ErroresPerfil = Partial<Record<'nombre' | 'apellido', string>>
type ErroresPassword = Partial<Record<'actual' | 'nueva' | 'confirmacion', string>>

export function PerfilPage() {
  const { usuario, actualizar } = useAuth()
  const navigate = useNavigate()
  const idCorreo = useId()

  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [apellido, setApellido] = useState(usuario?.apellido ?? '')
  const [erroresPerfil, setErroresPerfil] = useState<ErroresPerfil>({})
  const [avisoPerfil, setAvisoPerfil] = useState<{ tono: 'error' | 'confirmacion'; texto: string } | null>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [erroresPw, setErroresPw] = useState<ErroresPassword>({})
  const [avisoPw, setAvisoPw] = useState<{ tono: 'error' | 'confirmacion'; texto: string } | null>(null)
  const [guardandoPw, setGuardandoPw] = useState(false)

  useEffect(() => {
    setNombre(usuario?.nombre ?? '')
    setApellido(usuario?.apellido ?? '')
  }, [usuario])

  const editado = nombre !== (usuario?.nombre ?? '') || apellido !== (usuario?.apellido ?? '')

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setAvisoPerfil(null)

    const nuevos: ErroresPerfil = {}
    if (!nombre.trim()) nuevos.nombre = 'Escribe tus nombres.'
    if (!apellido.trim()) nuevos.apellido = 'Escribe tus apellidos.'
    setErroresPerfil(nuevos)
    if (Object.keys(nuevos).length) { enfocarPrimerError(form); return }

    setGuardandoPerfil(true)
    try {
      const u = await api<Usuario>('/perfil', { method: 'PUT', body: { nombre: nombre.trim(), apellido: apellido.trim() } })
      actualizar(u)
      setAvisoPerfil({ tono: 'confirmacion', texto: 'Guardamos tus datos.' })
    } catch (err) {
      setAvisoPerfil({ tono: 'error', texto: mensajeDe(err) })
    } finally {
      setGuardandoPerfil(false)
    }
  }

  function cancelar() {
    setNombre(usuario?.nombre ?? '')
    setApellido(usuario?.apellido ?? '')
    setErroresPerfil({})
    setAvisoPerfil(null)
  }

  async function cambiarPassword(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setAvisoPw(null)

    const nuevos: ErroresPassword = {}
    if (!actual) nuevos.actual = 'Escribe tu contraseña actual.'
    if (!nueva) nuevos.nueva = 'Define una contraseña nueva.'
    else if (!PASSWORD.test(nueva)) nuevos.nueva = 'La contraseña no cumple los requisitos.'
    if (!confirmacion) nuevos.confirmacion = 'Repite la contraseña nueva.'
    else if (confirmacion !== nueva) nuevos.confirmacion = 'Las dos contraseñas no coinciden.'
    setErroresPw(nuevos)
    if (Object.keys(nuevos).length) { enfocarPrimerError(form); return }

    setGuardandoPw(true)
    try {
      await api('/perfil/password', {
        method: 'PUT',
        body: { passwordActual: actual, passwordNueva: nueva, confirmacionPassword: confirmacion },
      })
      setActual(''); setNueva(''); setConfirmacion('')
      navigate('/login', { replace: true, state: { aviso: 'Tu contraseña cambió. Entra de nuevo con la nueva contraseña.' } })
      borrarSesion()
    } catch (err) {
      setAvisoPw({ tono: 'error', texto: mensajeDe(err) })
      setGuardandoPw(false)
    }
  }

  return (
    <div className="animate-subir">
      <header className="mb-7">
        <h1 className="text-2xl font-bold text-gris-900 sm:text-3xl">Mi perfil</h1>
        <p className="mt-1.5 text-sm text-gris-500">Actualiza tus datos o cambia tu contraseña.</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <form onSubmit={guardarPerfil} noValidate className="superficie space-y-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gris-900">Datos personales</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo etiqueta="Nombres" error={erroresPerfil.nombre}>
              {p => (
                <Input {...p} value={nombre} maxLength={30} autoComplete="given-name"
                  onChange={e => { setNombre(e.target.value); setErroresPerfil(x => ({ ...x, nombre: undefined })) }} />
              )}
            </Campo>
            <Campo etiqueta="Apellidos" error={erroresPerfil.apellido}>
              {p => (
                <Input {...p} value={apellido} maxLength={50} autoComplete="family-name"
                  onChange={e => { setApellido(e.target.value); setErroresPerfil(x => ({ ...x, apellido: undefined })) }} />
              )}
            </Campo>
          </div>

          <div className="space-y-2">
            <Label htmlFor={idCorreo} className="text-gris-700">Correo electrónico</Label>
            <Input id={idCorreo} value={usuario?.email ?? ''} readOnly aria-readonly="true" aria-describedby={`${idCorreo}-ayuda`} className="bg-gris-50 text-gris-700" />
            <p id={`${idCorreo}-ayuda`} className="text-xs text-gris-500">
              El correo proviene de tu cuenta de Google y no puede modificarse.
            </p>
          </div>

          <div aria-live="polite">{avisoPerfil && <Aviso tono={avisoPerfil.tono}>{avisoPerfil.texto}</Aviso>}</div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!editado || guardandoPerfil}>
              {guardandoPerfil && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {guardandoPerfil ? 'Guardando' : 'Guardar cambios'}
            </Button>
            <Button type="button" variant="outline" onClick={cancelar} disabled={!editado || guardandoPerfil}>
              Cancelar
            </Button>
          </div>
        </form>

        <form onSubmit={cambiarPassword} noValidate className="superficie space-y-5 p-5 sm:p-6">
          <h2 className="text-xl font-semibold text-gris-900">Cambiar contraseña</h2>

          <Campo etiqueta="Contraseña actual" error={erroresPw.actual}>
            {p => (
              <Input {...p} type="password" autoComplete="current-password" value={actual}
                onChange={e => { setActual(e.target.value); setErroresPw(x => ({ ...x, actual: undefined })) }} />
            )}
          </Campo>

          <Campo
            etiqueta="Nueva contraseña"
            error={erroresPw.nueva}
            ayuda="De 8 a 15 caracteres, con mayúscula, minúscula, número y un signo (. , + - * _ @)."
          >
            {p => (
              <Input {...p} type="password" autoComplete="new-password" maxLength={15} value={nueva}
                onChange={e => { setNueva(e.target.value); setErroresPw(x => ({ ...x, nueva: undefined })) }} />
            )}
          </Campo>

          <Campo etiqueta="Confirmar nueva contraseña" error={erroresPw.confirmacion}>
            {p => (
              <Input {...p} type="password" autoComplete="new-password" maxLength={15} value={confirmacion}
                onChange={e => { setConfirmacion(e.target.value); setErroresPw(x => ({ ...x, confirmacion: undefined })) }} />
            )}
          </Campo>

          <div aria-live="polite">{avisoPw && <Aviso tono={avisoPw.tono}>{avisoPw.texto}</Aviso>}</div>

          <p className="text-xs text-gris-500">
            Al cambiarla cerramos tus sesiones abiertas y tendrás que entrar de nuevo.
          </p>

          <Button type="submit" disabled={guardandoPw}>
            {guardandoPw && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {guardandoPw ? 'Actualizando' : 'Actualizar contraseña'}
          </Button>
        </form>
      </div>
    </div>
  )
}
