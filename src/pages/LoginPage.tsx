import { useCallback, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api, ApiError, mensajeDe } from '@/api/client'
import type { Sesion } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { LayoutAcceso } from '@/components/LayoutAcceso'
import { GoogleButton } from '@/components/GoogleButton'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { enfocarPrimerError } from '@/utils/foco'

interface GooglePendiente { registroToken: string; email: string; nombre: string; apellido: string; simulado: boolean }

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function LoginPage() {
  const { usuario, iniciar } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const traido = loc.state as { aviso?: string } | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<{ email?: string; password?: string }>({})
  const [error, setError] = useState<string | null>(null)
  const [confirmacion, setConfirmacion] = useState<string | null>(traido?.aviso ?? null)
  const [enviando, setEnviando] = useState(false)

  const conGoogle = useCallback(async (credential: string) => {
    setError(null)
    try {
      const r = await api<GooglePendiente>('/auth/google', { method: 'POST', body: { credential }, auth: false })
      navigate('/registro', { state: r })
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'CUENTA_EXISTENTE') {
        setConfirmacion(e.message)
        setEmail(String(e.extra.email ?? ''))
      } else setError(mensajeDe(e))
    }
  }, [navigate])

  const errorGoogle = useCallback((m: string) => setError(m), [])

  if (usuario) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setError(null); setConfirmacion(null)

    const nuevos: { email?: string; password?: string } = {}
    if (!email.trim()) nuevos.email = 'Escribe tu correo electrónico.'
    else if (!CORREO.test(email.trim())) nuevos.email = 'Escribe un correo electrónico válido.'
    if (!password) nuevos.password = 'Escribe tu contraseña.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) { enfocarPrimerError(form); return }

    setEnviando(true)
    try {
      const s = await api<Sesion>('/auth/login', { method: 'POST', body: { email: email.trim(), password }, auth: false })
      iniciar(s)
      navigate(s.usuario.rol === 'Administrador' ? '/admin/banco' : '/banco', { replace: true })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LayoutAcceso
      texto={<>Prepárate para la prueba Saber 11 en matemáticas con una práctica que te dice <strong className="font-bold text-white">por qué</strong> te equivocaste, no solo si acertaste.</>}
      nota="Gratis, alineada a los componentes y competencias del ICFES."
    >
      <form onSubmit={enviar} noValidate className="panel space-y-6 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-marino-800">Entrar</h1>

        {confirmacion && <Aviso tono="confirmacion">{confirmacion}</Aviso>}

        <Campo etiqueta="Correo electrónico" error={errores.email}>
          {p => (
            <Input
              {...p}
              type="email"
              autoComplete="username"
              autoFocus
              placeholder="tu.correo@gmail.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrores(x => ({ ...x, email: undefined })) }}
            />
          )}
        </Campo>

        <Campo etiqueta="Contraseña" error={errores.password}>
          {p => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrores(x => ({ ...x, password: undefined })) }}
            />
          )}
        </Campo>

        {error && <Aviso>{error}</Aviso>}

        <div className="space-y-4">
          <Button type="submit" size="bloque" disabled={enviando}>
            {enviando && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
            {enviando ? 'Validando' : 'Entrar'}
          </Button>
          <div className="text-center">
            <Link to="/recuperar" className="text-sm font-bold text-marino-700 underline decoration-2 underline-offset-4 hover:text-violeta-600">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-texto-suave">
          <span className="h-px flex-1 bg-borde" />
          ¿Aún no tienes cuenta?
          <span className="h-px flex-1 bg-borde" />
        </div>

        <GoogleButton onCredential={conGoogle} onError={errorGoogle} />
      </form>
    </LayoutAcceso>
  )
}
