import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { api, mensajeDe } from '../api/client'
import { Acceso } from '../components/Acceso'
import { Alerta } from '../components/ui'

interface Estado { registroToken: string; email: string; nombre: string; apellido: string; simulado: boolean }

/** M-02 · Completar el registro tras verificar el correo con Google (HU-001 CA-04 a CA-09). */
export function RegistroPage() {
  const loc = useLocation()
  const navigate = useNavigate()
  const st = loc.state as Estado | null
  const [nombre, setNombre] = useState(st?.nombre ?? '')
  const [apellido, setApellido] = useState(st?.apellido ?? '')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [terminos, setTerminos] = useState(false)                                       // CA-07: desmarcada por defecto
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  if (!st?.registroToken) return <Navigate to="/login" replace />                         // CA-10: sin Google no hay registro

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!terminos) { setError('Debes aceptar los Términos y Condiciones y la Política de Tratamiento de Datos Personales.'); return }
    setCargando(true)
    try {
      await api('/auth/registro', { method: 'POST', auth: false, body: {
        registroToken: st!.registroToken, nombre, apellido, password, confirmacionPassword: confirmacion, aceptoTerminos: terminos,
      } })
      navigate('/login', { replace: true, state: { aviso: 'Tu cuenta fue creada exitosamente. Inicia sesión con tu correo y contraseña.', tipo: 'ok' } })   // CA-09
    } catch (err) {
      setError(mensajeDe(err))
    } finally { setCargando(false) }
  }

  return (
    <Acceso
      texto="Ya verificamos tu cuenta de Google. Completa tus datos para crear tu cuenta de estudiante."
      nota="No solicitamos ni guardamos la contraseña de tu cuenta de Google.">
      <form className="card" onSubmit={enviar} noValidate>
        <h2 style={{ fontSize: 22 }}>Completa tu registro</h2>
        <Alerta tipo="ok" style={{ marginBottom: 14 }}>Correo verificado con Google{st.simulado ? ' (simulado)' : ''}: <b>{st.email}</b></Alerta>
        <div className="row keep">
          <div className="col field"><label htmlFor="nombre">Nombres</label><input id="nombre" className="input" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={30} /></div>
          <div className="col field"><label htmlFor="apellido">Apellidos</label><input id="apellido" className="input" value={apellido} onChange={e => setApellido(e.target.value)} maxLength={50} /></div>
        </div>
        <div className="field"><label htmlFor="pw">Contraseña</label>
          <input id="pw" className="input" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} maxLength={15} />
          <div className="help">8 a 15 caracteres, con mayúscula, minúscula, número y un carácter especial (. , + - * _ @).</div></div>
        <div className="field"><label htmlFor="pw2">Confirmación de contraseña</label>
          <input id="pw2" className="input" type="password" autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} maxLength={15} /></div>
        <label className="chk">
          <input type="checkbox" checked={terminos} onChange={e => setTerminos(e.target.checked)} />
          <span>Acepto los <u>Términos y Condiciones</u> y la <u>Política de Tratamiento de Datos Personales</u>.</span>
        </label>
        {error && <Alerta style={{ marginBottom: 12 }}>{error}</Alerta>}
        <button className="btn block" type="submit" disabled={cargando}>{cargando ? 'Creando cuenta…' : 'Crear cuenta'}</button>
        <button className="btn ghost sm block" type="button" style={{ marginTop: 10 }} onClick={() => navigate('/login')}>Cancelar</button>
      </form>
    </Acceso>
  )
}
