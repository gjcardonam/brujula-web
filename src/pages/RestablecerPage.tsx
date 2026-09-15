import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api, mensajeDe } from '@/api/client'
import type { Mensaje } from '@/api/types'
import { LayoutAcceso } from '@/components/LayoutAcceso'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { enfocarPrimerError } from '@/utils/foco'

const PASSWORD = /^(?=.*[a-záéíóúñ])(?=.*[A-ZÁÉÍÓÚÑ])(?=.*\d)(?=.*[.,+\-*_@])\S{8,15}$/

type Errores = Partial<Record<'password' | 'confirmacion', string>>

export function RestablecerPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const [valido, setValido] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!token) {
      setValido(false)
      setError('Este enlace no es válido. Solicita uno nuevo.')
      return
    }
    let vivo = true
    api(`/auth/restablecer/validar?token=${encodeURIComponent(token)}`, { auth: false })
      .then(() => { if (vivo) setValido(true) })
      .catch(e => { if (vivo) { setValido(false); setError(mensajeDe(e)) } })
    return () => { vivo = false }
  }, [token])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setError(null)

    const nuevos: Errores = {}
    if (!password) nuevos.password = 'Define una contraseña.'
    else if (!PASSWORD.test(password)) nuevos.password = 'La contraseña no cumple los requisitos.'
    if (!confirmacion) nuevos.confirmacion = 'Repite la contraseña.'
    else if (confirmacion !== password) nuevos.confirmacion = 'Las dos contraseñas no coinciden.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) { enfocarPrimerError(form); return }

    setEnviando(true)
    try {
      const r = await api<Mensaje>('/auth/restablecer', { method: 'POST', auth: false, body: { token, password, confirmacionPassword: confirmacion } })
      navigate('/login', { replace: true, state: { aviso: r.mensaje } })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LayoutAcceso
      texto="Define una contraseña nueva y vuelve a tu ruta de práctica."
      nota="Al guardarla cerramos las sesiones abiertas y tendrás que entrar de nuevo."
    >
      <form onSubmit={enviar} noValidate className="panel space-y-6 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-marino-800">Elige una contraseña nueva</h1>

        {valido === null && (
          <div className="space-y-5" aria-live="polite" aria-busy="true">
            <span className="sr-only">Validando el enlace</span>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full rounded-control" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-12 w-full rounded-control" />
            <Skeleton className="h-13 w-full rounded-control-lg" />
          </div>
        )}

        {valido === false && (
          <>
            <Aviso>{error}</Aviso>
            <Button asChild size="bloque">
              <Link to="/recuperar">Solicitar un enlace nuevo</Link>
            </Button>
          </>
        )}

        {valido === true && (
          <>
            <Campo
              etiqueta="Contraseña"
              error={errores.password}
              ayuda="De 8 a 15 caracteres, con mayúscula, minúscula, número y un signo (. , + - * _ @)."
            >
              {p => (
                <Input {...p} type="password" autoComplete="new-password" maxLength={15} autoFocus value={password}
                  onChange={e => { setPassword(e.target.value); setErrores(x => ({ ...x, password: undefined })) }} />
              )}
            </Campo>

            <Campo etiqueta="Repite la contraseña" error={errores.confirmacion}>
              {p => (
                <Input {...p} type="password" autoComplete="new-password" maxLength={15} value={confirmacion}
                  onChange={e => { setConfirmacion(e.target.value); setErrores(x => ({ ...x, confirmacion: undefined })) }} />
              )}
            </Campo>

            {error && <Aviso>{error}</Aviso>}

            <Button type="submit" size="bloque" disabled={enviando}>
              {enviando && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
              {enviando ? 'Guardando' : 'Guardar contraseña'}
            </Button>
          </>
        )}
      </form>
    </LayoutAcceso>
  )
}
