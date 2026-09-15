import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api, mensajeDe } from '@/api/client'
import type { Mensaje } from '@/api/types'
import { LayoutAcceso } from '@/components/LayoutAcceso'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function RecuperarPage() {
  const [email, setEmail] = useState('')
  const [errorCampo, setErrorCampo] = useState<string | undefined>()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null); setMensaje(null)
    if (!email.trim()) { setErrorCampo('Escribe tu correo electrónico.'); return }
    if (!CORREO.test(email.trim())) { setErrorCampo('Escribe un correo electrónico válido.'); return }
    setErrorCampo(undefined)
    setEnviando(true)
    try {
      const r = await api<Mensaje>('/auth/recuperar', { method: 'POST', auth: false, body: { email: email.trim() } })
      setMensaje(r.mensaje)
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LayoutAcceso
      texto="¿Olvidaste tu contraseña? Te enviamos un enlace para restablecerla."
      nota="El enlace tiene una vigencia de 30 minutos y solo puede usarse una vez."
    >
      <form onSubmit={enviar} noValidate className="superficie space-y-5 p-6 sm:p-7">
        <h1 className="text-2xl font-bold text-gris-900">Solicitar restablecimiento</h1>

        <Campo etiqueta="Correo electrónico" error={errorCampo}>
          {p => (
            <Input {...p} type="email" autoComplete="username" autoFocus value={email}
              onChange={e => { setEmail(e.target.value); setErrorCampo(undefined) }} />
          )}
        </Campo>

        {error && <Aviso>{error}</Aviso>}
        {mensaje && <Aviso tono="confirmacion">{mensaje}</Aviso>}

        <Button type="submit" size="lg" className="w-full" disabled={enviando}>
          {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {enviando ? 'Enviando' : 'Enviar enlace'}
        </Button>

        <div className="text-center">
          <Link to="/login" className="rounded-sm text-sm text-marino-700 underline underline-offset-4 hover:text-marino-900">
            Volver a iniciar sesión
          </Link>
        </div>
      </form>
    </LayoutAcceso>
  )
}
