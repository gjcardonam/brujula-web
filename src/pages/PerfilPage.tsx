import { useEffect, useState, type FormEvent } from 'react'
import { api, mensajeDe } from '../api/client'
import type { Mensaje, Usuario } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alerta } from '../components/ui'

/** M-04 · Mi perfil y cambio de contraseña (HU-005). */
export function PerfilPage() {
  const { usuario, actualizar } = useAuth()
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [apellido, setApellido] = useState(usuario?.apellido ?? '')
  const [msgPerfil, setMsgPerfil] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [msgPw, setMsgPw] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { setNombre(usuario?.nombre ?? ''); setApellido(usuario?.apellido ?? '') }, [usuario])

  const editado = nombre !== (usuario?.nombre ?? '') || apellido !== (usuario?.apellido ?? '')

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault()
    setMsgPerfil(null); setGuardando(true)
    try {
      const u = await api<Usuario>('/perfil', { method: 'PUT', body: { nombre, apellido } })
      actualizar(u)
      setMsgPerfil({ tipo: 'ok', texto: 'Tu información fue actualizada exitosamente.' })          // CA-06
    } catch (err) { setMsgPerfil({ tipo: 'err', texto: mensajeDe(err) }) } finally { setGuardando(false) }
  }

  function cancelar() {                                                                          // CA-07
    setNombre(usuario?.nombre ?? ''); setApellido(usuario?.apellido ?? ''); setMsgPerfil(null)
  }

  async function cambiarPw(e: FormEvent) {
    e.preventDefault()
    setMsgPw(null); setGuardando(true)
    try {
      const r = await api<Mensaje>('/perfil/password', { method: 'PUT', body: { passwordActual: actual, passwordNueva: nueva, confirmacionPassword: confirmacion } })
      setMsgPw({ tipo: 'ok', texto: r.mensaje })
      setActual(''); setNueva(''); setConfirmacion('')
    } catch (err) { setMsgPw({ tipo: 'err', texto: mensajeDe(err) }) } finally { setGuardando(false) }
  }

  return (
    <>
      <h1>Mi perfil</h1>
      <div className="sub">Actualiza tus datos personales o cambia tu contraseña.</div>
      <div className="two">
        <form className="col card" onSubmit={guardarPerfil} noValidate>
          <h2>Datos personales</h2>
          <div className="row keep">
            <div className="col field"><label htmlFor="nombre">Nombres</label><input id="nombre" className="input" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={30} /></div>
            <div className="col field"><label htmlFor="apellido">Apellidos</label><input id="apellido" className="input" value={apellido} onChange={e => setApellido(e.target.value)} maxLength={50} /></div>
          </div>
          <div className="field"><label htmlFor="email">Correo electrónico</label>
            <input id="email" className="input ro" value={usuario?.email ?? ''} disabled readOnly />
            <div className="help">El correo proviene de tu cuenta de Google y no puede modificarse.</div></div>
          {msgPerfil && <Alerta tipo={msgPerfil.tipo} style={{ marginBottom: 12 }}>{msgPerfil.texto}</Alerta>}
          <div className="row keep">
            <button className="btn" type="submit" disabled={!editado || guardando}>Guardar cambios</button>
            <button className="btn ghost" type="button" onClick={cancelar} disabled={!editado}>Cancelar</button>
          </div>
        </form>
        <form className="col card" onSubmit={cambiarPw} noValidate>
          <h2>Cambiar contraseña</h2>
          <div className="field"><label htmlFor="actual">Contraseña actual</label><input id="actual" className="input" type="password" autoComplete="current-password" value={actual} onChange={e => setActual(e.target.value)} /></div>
          <div className="field"><label htmlFor="nueva">Nueva contraseña</label><input id="nueva" className="input" type="password" autoComplete="new-password" value={nueva} onChange={e => setNueva(e.target.value)} maxLength={15} />
            <div className="help">8 a 15 caracteres, con mayúscula, minúscula, número y un carácter especial (. , + - * _ @).</div></div>
          <div className="field"><label htmlFor="conf">Confirmar nueva contraseña</label><input id="conf" className="input" type="password" autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} maxLength={15} /></div>
          {msgPw && <Alerta tipo={msgPw.tipo} style={{ marginBottom: 12 }}>{msgPw.texto}</Alerta>}
          <button className="btn" type="submit" disabled={guardando || !actual || !nueva || !confirmacion}>Actualizar contraseña</button>
        </form>
      </div>
      <div className="card soft" style={{ marginTop: 16 }}>
        <div className="note"><b>Expiración de sesión:</b> por seguridad, la sesión se cierra automáticamente tras 2 horas sin actividad. Si eso ocurre, te pediremos iniciar sesión de nuevo.</div>
      </div>
    </>
  )
}
