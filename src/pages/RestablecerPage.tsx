import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import type { Mensaje } from '../api/types'
import { Acceso } from '../components/Acceso'
import { Alerta, Cargando } from '../components/ui'

/** M-03 (abajo) · Definir nueva contraseña desde el enlace del correo (HU-003 CA-04 a CA-08). */
export function RestablecerPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [valido, setValido] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!token) { setValido(false); setError('Este enlace no es válido. Solicita uno nuevo.'); return }
    api(`/auth/restablecer/validar?token=${encodeURIComponent(token)}`, { auth: false })
      .then(() => setValido(true))
      .catch(e => { setValido(false); setError(mensajeDe(e)) })
  }, [token])

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null); setCargando(true)
    try {
      const r = await api<Mensaje>('/auth/restablecer', { method: 'POST', auth: false, body: { token, password, confirmacionPassword: confirmacion } })
      navigate('/login', { replace: true, state: { aviso: r.mensaje, tipo: 'ok' } })      // CA-08
    } catch (err) { setError(mensajeDe(err)) } finally { setCargando(false) }
  }

  return (
    <Acceso texto="Define una nueva contraseña para tu cuenta." nota="Al guardarla, cualquier sesión abierta se cerrará y deberás iniciar sesión de nuevo.">
      <form className="card" onSubmit={enviar} noValidate>
        <h2>Definir nueva contraseña</h2>
        {valido === null && <Cargando texto="Validando el enlace…" />}
        {valido === false && (
          <>
            <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>
            <Link className="btn block" to="/recuperar">Solicitar un nuevo enlace</Link>
          </>
        )}
        {valido && (
          <>
            <div className="field"><label htmlFor="pw">Nueva contraseña</label>
              <input id="pw" className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={15} />
              <div className="help">8 a 15 caracteres, con mayúscula, minúscula, número y un carácter especial (. , + - * _ @).</div></div>
            <div className="field"><label htmlFor="pw2">Confirmar nueva contraseña</label>
              <input id="pw2" className="input" type="password" autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} maxLength={15} /></div>
            {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
            <button className="btn block" type="submit" disabled={cargando}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
          </>
        )}
      </form>
    </Acceso>
  )
}
