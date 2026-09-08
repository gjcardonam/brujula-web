import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import type { Mensaje } from '../api/types'
import { Acceso } from '../components/Acceso'
import { Alerta } from '../components/ui'

/** M-03 (arriba) · Solicitar enlace de restablecimiento (HU-003 CA-01 a CA-03). */
export function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null); setMensaje(null)
    if (!email.trim()) { setError('Ingresa tu correo electrónico.'); return }
    setCargando(true)
    try {
      const r = await api<Mensaje>('/auth/recuperar', { method: 'POST', auth: false, body: { email: email.trim() } })
      setMensaje(r.mensaje)
    } catch (err) { setError(mensajeDe(err)) } finally { setCargando(false) }
  }

  return (
    <Acceso texto="¿Olvidaste tu contraseña? Te enviamos un enlace para restablecerla." nota="El enlace tiene una vigencia de 30 minutos y solo puede usarse una vez.">
      <form className="card" onSubmit={enviar} noValidate>
        <h2>Solicitar restablecimiento</h2>
        <div className="field"><label htmlFor="email">Correo electrónico</label>
          <input id="email" className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
        {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
        <button className="btn block" type="submit" disabled={cargando}>{cargando ? 'Enviando…' : 'Enviar enlace'}</button>
        {mensaje && <Alerta tipo="ok" style={{ marginTop: 12 }}>{mensaje}</Alerta>}
        <div className="help">El mensaje es el mismo exista o no la cuenta, para no revelar qué correos están registrados.</div>
        <div className="note" style={{ textAlign: 'center', marginTop: 12 }}><Link to="/login"><u>Volver a iniciar sesión</u></Link></div>
      </form>
    </Acceso>
  )
}
