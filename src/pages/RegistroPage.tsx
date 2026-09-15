import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { api, mensajeDe } from '@/api/client'
import { LayoutAcceso } from '@/components/LayoutAcceso'
import { Aviso } from '@/components/Aviso'
import { Campo } from '@/components/Campo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { enfocarPrimerError } from '@/utils/foco'

interface Estado { registroToken: string; email: string; nombre: string; apellido: string; simulado: boolean }

const PASSWORD = /^(?=.*[a-záéíóúñ])(?=.*[A-ZÁÉÍÓÚÑ])(?=.*\d)(?=.*[.,+\-*_@])\S{8,15}$/

type Errores = Partial<Record<'nombre' | 'apellido' | 'password' | 'confirmacion' | 'terminos', string>>

export function RegistroPage() {
  const loc = useLocation()
  const navigate = useNavigate()
  const st = loc.state as Estado | null
  const idTerminos = useId()

  const [nombre, setNombre] = useState(st?.nombre ?? '')
  const [apellido, setApellido] = useState(st?.apellido ?? '')
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [terminos, setTerminos] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!st?.registroToken) return <Navigate to="/login" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const form = e.currentTarget as HTMLFormElement
    setError(null)

    const nuevos: Errores = {}
    if (!nombre.trim()) nuevos.nombre = 'Escribe tus nombres.'
    if (!apellido.trim()) nuevos.apellido = 'Escribe tus apellidos.'
    if (!password) nuevos.password = 'Define una contraseña.'
    else if (!PASSWORD.test(password)) nuevos.password = 'La contraseña no cumple los requisitos.'
    if (!confirmacion) nuevos.confirmacion = 'Repite la contraseña.'
    else if (confirmacion !== password) nuevos.confirmacion = 'Las dos contraseñas no coinciden.'
    if (!terminos) nuevos.terminos = 'Necesitas aceptar los términos y la política de datos para continuar.'
    setErrores(nuevos)
    if (Object.keys(nuevos).length) { enfocarPrimerError(form); return }

    setEnviando(true)
    try {
      await api('/auth/registro', {
        method: 'POST',
        auth: false,
        body: {
          registroToken: st!.registroToken,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          password,
          confirmacionPassword: confirmacion,
          aceptoTerminos: terminos,
        },
      })
      navigate('/login', { replace: true, state: { aviso: 'Tu cuenta quedó creada. Inicia sesión con tu correo y contraseña.' } })
    } catch (err) {
      setError(mensajeDe(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LayoutAcceso
      texto="Ya verificamos tu cuenta de Google. Completa tus datos para crear tu cuenta de estudiante."
      nota="No solicitamos ni guardamos la contraseña de tu cuenta de Google."
    >
      <form onSubmit={enviar} noValidate className="superficie space-y-5 p-6 sm:p-7">
        <h1 className="text-2xl font-bold text-gris-900">Completa tu registro</h1>

        <Aviso tono="confirmacion">
          Correo verificado con Google: <span className="font-semibold">{st.email}</span>
        </Aviso>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Nombres" error={errores.nombre}>
            {p => (
              <Input {...p} value={nombre} maxLength={30} autoComplete="given-name"
                onChange={e => { setNombre(e.target.value); setErrores(x => ({ ...x, nombre: undefined })) }} />
            )}
          </Campo>
          <Campo etiqueta="Apellidos" error={errores.apellido}>
            {p => (
              <Input {...p} value={apellido} maxLength={50} autoComplete="family-name"
                onChange={e => { setApellido(e.target.value); setErrores(x => ({ ...x, apellido: undefined })) }} />
            )}
          </Campo>
        </div>

        <Campo
          etiqueta="Contraseña"
          error={errores.password}
          ayuda="De 8 a 15 caracteres, con mayúscula, minúscula, número y un signo (. , + - * _ @)."
        >
          {p => (
            <Input {...p} type="password" autoComplete="new-password" maxLength={15} value={password}
              onChange={e => { setPassword(e.target.value); setErrores(x => ({ ...x, password: undefined })) }} />
          )}
        </Campo>

        <Campo etiqueta="Confirmación de contraseña" error={errores.confirmacion}>
          {p => (
            <Input {...p} type="password" autoComplete="new-password" maxLength={15} value={confirmacion}
              onChange={e => { setConfirmacion(e.target.value); setErrores(x => ({ ...x, confirmacion: undefined })) }} />
          )}
        </Campo>

        <div className="space-y-2">
          <div className="flex items-start gap-3 rounded-md border border-gris-200 bg-gris-50 p-3.5">
            <Checkbox
              id={idTerminos}
              checked={terminos}
              aria-invalid={errores.terminos ? true : undefined}
              aria-describedby={errores.terminos ? `${idTerminos}-error` : undefined}
              onCheckedChange={v => { setTerminos(v === true); setErrores(x => ({ ...x, terminos: undefined })) }}
              className="mt-0.5"
            />
            <label htmlFor={idTerminos} className="text-sm leading-snug text-gris-700">
              Acepto los <span className="font-medium text-gris-900">Términos y Condiciones</span> y la{' '}
              <span className="font-medium text-gris-900">Política de Tratamiento de Datos Personales</span>.
            </label>
          </div>
          {errores.terminos && (
            <p id={`${idTerminos}-error`} className="text-xs font-medium text-error-700">{errores.terminos}</p>
          )}
        </div>

        {error && <Aviso>{error}</Aviso>}

        <div className="space-y-3">
          <Button type="submit" size="lg" className="w-full" disabled={enviando}>
            {enviando && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {enviando ? 'Creando cuenta' : 'Crear cuenta'}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/login')}>
            Cancelar
          </Button>
        </div>
      </form>
    </LayoutAcceso>
  )
}
