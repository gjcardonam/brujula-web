import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * "Continuar con Google" (HU-001 CA-01/CA-02). Con VITE_GOOGLE_CLIENT_ID usa Google Identity Services y
 * entrega el ID token a la API. Sin client id, y solo si la API está en modo desarrollo, muestra un
 * formulario simulado para poder probar el registro sin cuenta de Google.
 */
export function GoogleButton({ onCredential, onError }: { onCredential: (credential: string) => void; onError: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [simulado, setSimulado] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    let vivo = true
    if (CLIENT_ID) { setSimulado(false); return }
    api<{ simulado: boolean }>('/auth/google/config', { auth: false })
      .then(c => { if (vivo) setSimulado(c.simulado) })
      .catch(() => { if (vivo) setSimulado(false) })
    return () => { vivo = false }
  }, [])

  useEffect(() => {
    if (!CLIENT_ID || simulado !== false) return
    const cargar = () => {
      if (!window.google || !ref.current) return
      window.google.accounts.id.initialize({ client_id: CLIENT_ID, callback: r => onCredential(r.credential) })
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: 360, text: 'continue_with', locale: 'es' })
    }
    if (window.google) { cargar(); return }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = cargar
    s.onerror = () => onError('No fue posible cargar el servicio de Google. Intenta de nuevo más tarde.')   // HU-001 CA-11
    document.head.appendChild(s)
  }, [simulado, onCredential, onError])

  if (simulado === null) return <div className="google-btn note">Cargando…</div>

  if (simulado) {
    return (
      <div>
        {!abierto ? (
          <button type="button" className="btn ghost block" onClick={() => setAbierto(true)}>
            <b style={{ fontFamily: 'serif' }}>G</b>&nbsp; Continuar con Google
          </button>
        ) : (
          <div className="card soft" style={{ padding: 12 }}>
            <div className="note" style={{ marginBottom: 8 }}><b>Modo desarrollo:</b> Google está simulado. Escribe el correo que verificaría Google.</div>
            <div className="field"><label>Correo de Google</label><input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana.perez@gmail.com" /></div>
            <div className="row keep"><div className="col field"><label>Nombre (opcional)</label><input className="input" value={nombre} onChange={e => setNombre(e.target.value)} /></div>
              <div className="col field"><label>Apellido (opcional)</label><input className="input" value={apellido} onChange={e => setApellido(e.target.value)} /></div></div>
            <div className="row keep">
              <button type="button" className="btn sm" onClick={() => onCredential(`dev:${email.trim()}:${nombre.trim()}:${apellido.trim()}`)} disabled={!email.trim()}>Continuar</button>
              <button type="button" className="btn ghost sm" onClick={() => setAbierto(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    )
  }
  if (!CLIENT_ID) return <Alerta>El inicio con Google no está configurado en este servidor.</Alerta>
  return <div className="google-btn" ref={ref} />
}

function Alerta({ children }: { children: React.ReactNode }) {
  return <div className="warnbox">{children}</div>
}
