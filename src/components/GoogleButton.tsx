import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api/client'
import { Aviso } from '@/components/Aviso'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Campo } from '@/components/Campo'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

function LogoGoogle() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="size-4">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.2-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.4-4.6 7l7.6 5.9c4.4-4.1 6.7-10.1 6.7-17.4z" />
      <path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  )
}

export function GoogleButton({ onCredential, onError }: { onCredential: (credential: string) => void; onError: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [simulado, setSimulado] = useState<boolean | null>(null)
  const [abierto, setAbierto] = useState(false)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')

  useEffect(() => {
    if (CLIENT_ID) { setSimulado(false); return }
    let vivo = true
    api<{ simulado: boolean }>('/auth/google/config', { auth: false })
      .then(c => { if (vivo) setSimulado(c.simulado) })
      .catch(() => { if (vivo) setSimulado(false) })
    return () => { vivo = false }
  }, [])

  const alFallar = useCallback(() => {
    onError('No fue posible cargar el acceso con Google. Intenta de nuevo en unos minutos.')
  }, [onError])

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
    s.onerror = alFallar
    document.head.appendChild(s)
  }, [simulado, onCredential, alFallar])

  if (simulado === null) return <Skeleton className="h-10 w-full" />

  if (simulado) {
    return (
      <>
        <Button type="button" variant="outline" className="w-full" onClick={() => setAbierto(true)}>
          <LogoGoogle />
          Continuar con Google
        </Button>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogHeader>
              <DialogTitle>Continuar con Google</DialogTitle>
              <DialogDescription>
                Este servidor está en modo de pruebas. Escribe el correo que Google verificaría.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Campo etiqueta="Correo">
                {p => <Input {...p} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ana.perez@gmail.com" />}
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Nombres">
                  {p => <Input {...p} value={nombre} onChange={e => setNombre(e.target.value)} />}
                </Campo>
                <Campo etiqueta="Apellidos">
                  {p => <Input {...p} value={apellido} onChange={e => setApellido(e.target.value)} />}
                </Campo>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                disabled={!email.trim()}
                onClick={() => { setAbierto(false); onCredential(`dev:${email.trim()}:${nombre.trim()}:${apellido.trim()}`) }}
              >
                Continuar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (!CLIENT_ID) {
    return <Aviso tono="informacion">El acceso con Google no está habilitado en este servidor.</Aviso>
  }
  return <div ref={ref} className="flex justify-center [&>div]:max-w-full" />
}
