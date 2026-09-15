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
      texto="¿Olvidaste tu contraseña? Escribe tu correo y te enviamos un enlace para volver a entrar."
      nota="El enlace vence en 30 minutos y solo puede usarse una vez."
    >
      <form onSubmit={enviar} noValidate className="panel space-y-6 p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-marino-800">Recuperar contraseña</h1>

        <Campo etiqueta="Correo electrónico" error={errorCampo}>
          {p => (
            <Input {...p} type="email" autoComplete="username" autoFocus placeholder="tu.correo@gmail.com" value={email}
              onChange={e => { setEmail(e.target.value); setErrorCampo(undefined) }} />
          )}
        </Campo>

        {error && <Aviso>{error}</Aviso>}
        {mensaje && <Aviso tono="confirmacion">{mensaje}</Aviso>}

        <Button type="submit" size="bloque" disabled={enviando}>
          {enviando && <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />}
          {enviando ? 'Enviando' : 'Enviar enlace'}
        </Button>

        <div className="text-center">
          <Link to="/login" className="text-sm font-bold text-marino-700 underline decoration-2 underline-offset-4 hover:text-violeta-600">
            Volver a entrar
          </Link>
        </div>
      </form>
    </LayoutAcceso>
  )
}
