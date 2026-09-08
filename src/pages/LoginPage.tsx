import { useCallback, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, ApiError, mensajeDe } from '../api/client'
import type { Sesion } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Acceso } from '../components/Acceso'
import { GoogleButton } from '../components/GoogleButton'
import { Alerta } from '../components/ui'

interface GooglePendiente { registroToken: string; email: string; nombre: string; apellido: string; simulado: boolean }

/** M-01 · Inicio de sesión (HU-002) con acceso a registro (HU-001) y recuperación (HU-003). */
export function LoginPage() {
  const { usuario, iniciar } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const aviso = (loc.state as { aviso?: string; tipo?: 'ok' | 'err' | 'warn' } | null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<{ tipo: 'ok' | 'err' | 'warn'; texto: string } | null>(aviso?.aviso ? { tipo: aviso.tipo ?? 'ok', texto: aviso.aviso } : null)
  const [cargando, setCargando] = useState(false)

  const conGoogle = useCallback(async (credential: string) => {
    setError(null)
    try {
      const r = await api<GooglePendiente>('/auth/google', { method: 'POST', body: { credential }, auth: false })
      navigate('/registro', { state: r })
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'CUENTA_EXISTENTE') {
        setInfo({ tipo: 'warn', texto: e.message })                                   // HU-001 CA-03
        setEmail(String(e.extra.email ?? ''))
      } else setError(mensajeDe(e))
    }
  }, [navigate])
  const errorGoogle = useCallback((m: string) => setError(m), [])

  if (usuario) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null); setInfo(null)
    const faltan: string[] = []
    if (!email.trim()) faltan.push('el correo electrónico')
    if (!password) faltan.push('la contraseña')
    if (faltan.length) { setError(`Falta ${faltan.join(' y ')}.`); return }                 // HU-002 CA-05
    setCargando(true)
    try {
      const s = await api<Sesion>('/auth/login', { method: 'POST', body: { email: email.trim(), password }, auth: false })
      iniciar(s)
      navigate(s.usuario.rol === 'Administrador' ? '/admin/banco' : '/banco', { replace: true })   // CA-07
    } catch (err) {
      setError(mensajeDe(err))
    } finally { setCargando(false) }
  }

  return (
    <Acceso
      texto={<>Prepárate para la prueba Saber 11 en matemáticas con retroalimentación que te dice <b>por qué</b> te equivocaste, no solo si acertaste.</>}
      nota="Gratis · Alineada a los componentes y competencias del ICFES">
      <form className="card" onSubmit={enviar} noValidate>
        <h2 style={{ fontSize: 22 }}>Iniciar sesión</h2>
        {info && <Alerta tipo={info.tipo} style={{ marginBottom: 14 }}>{info.texto}</Alerta>}
        <div className="field"><label htmlFor="email">Correo electrónico</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="password">Contraseña</label>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <Alerta style={{ marginBottom: 14 }}>{error}</Alerta>}
        <button className="btn block" type="submit" disabled={cargando}>{cargando ? 'Validando…' : 'Iniciar Sesión'}</button>
        <div className="note" style={{ textAlign: 'center', margin: '12px 0' }}><Link to="/recuperar"><u>¿Olvidaste tu contraseña?</u></Link></div>
        <div className="divider">¿Aún no tienes cuenta?</div>
        <GoogleButton onCredential={conGoogle} onError={errorGoogle} />
        <div className="help" style={{ marginTop: 10 }}>Tras 5 intentos fallidos la cuenta se bloquea 10 minutos.</div>
      </form>
    </Acceso>
  )
}
