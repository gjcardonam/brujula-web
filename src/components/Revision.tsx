import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Brain, Check, ChevronDown, Eye, Lightbulb, Sparkles, Wind, X } from 'lucide-react'
import { cn } from 'cn'
import { urlDeArchivo } from '@/api/client'
import type { OpcionEstudiante } from '@/api/types'
import { cajaDeOpcion, ContenidoDeOpcion, estiloOpcion } from '@/components/Opciones'
import type { TipoDeError } from '@/retro/mensajes'

// Después de responder ya no hace falta todo el ejercicio: se ve el resultado, las dos opciones que importan
// (la elegida y la correcta) y la explicación. El enunciado queda a un clic.

const VOZ: Record<TipoDeError, { icono: typeof Brain; circulo: string; burbuja: string; texto: string }> = {
  'Error cognitivo': { icono: Brain, circulo: 'bg-violeta-600', burbuja: 'border-violeta-200 bg-violeta-50', texto: 'text-violeta-700' },
  'Error de hábito': { icono: Eye, circulo: 'bg-teal-600', burbuja: 'border-teal-200 bg-teal-50', texto: 'text-teal-700' },
  'Error de ansiedad': { icono: Wind, circulo: 'bg-ocre-600', burbuja: 'border-ocre-200 bg-ocre-50', texto: 'text-ocre-700' },
}

export interface DatosDeRevision {
  enunciado: string
  imagenEnunciado: string | null
  opciones: OpcionEstudiante[]
  idOpcionSeleccionada: number
  idOpcionCorrecta: number | null
  esCorrecto: boolean
  retroalimentacion: string
  retroalimentacionDisponible: boolean
}

export function Revision({
  datos,
  mensaje,
  tipo,
  accionDelMensaje,
  nota,
  abrirEnunciado = 0,
}: {
  datos: DatosDeRevision
  mensaje?: string | null
  tipo?: TipoDeError | null
  accionDelMensaje?: ReactNode
  nota?: ReactNode
  abrirEnunciado?: number
}) {
  const refEnunciado = useRef<HTMLDetailsElement>(null)
  const [enunciadoAbierto, setEnunciadoAbierto] = useState(false)
  const elegida = datos.opciones.find(o => o.id === datos.idOpcionSeleccionada) ?? null
  const correcta = datos.opciones.find(o => o.id === datos.idOpcionCorrecta) ?? null
  const Icono = datos.esCorrecto ? Check : X
  const voz = tipo ? VOZ[tipo] : null
  const IconoVoz = voz?.icono ?? Sparkles

  useEffect(() => {
    if (!abrirEnunciado) return
    setEnunciadoAbierto(true)
    refEnunciado.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    refEnunciado.current?.querySelector('summary')?.focus({ preventScroll: true })
  }, [abrirEnunciado])

  return (
    <div className="flex flex-col gap-5">
      <section
        className={cn(
          'relative isolate overflow-hidden rounded-panel px-6 py-6 text-white animate-aparecer sm:px-8 sm:py-7',
          datos.esCorrecto
            ? 'bg-[linear-gradient(125deg,var(--color-exito-700),var(--color-exito-600)_60%,#34c49a)]'
            : 'bg-[linear-gradient(125deg,#9b1c1c,var(--color-error-600)_60%,#f0645b)]',
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute -top-16 -right-10 -z-10 size-56 rounded-full bg-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 right-[30%] -z-10 size-40 rounded-full bg-white/8" />
        <div className="flex items-center gap-4">
          <span
            aria-hidden="true"
            className={cn(
              'grid size-14 shrink-0 place-items-center rounded-full bg-white shadow-[0_4px_0_rgb(0_0_0/0.15)] animate-latido',
              datos.esCorrecto ? 'text-exito-600' : 'text-error-600',
            )}
          >
            <Icono className="size-8" strokeWidth={3.2} />
          </span>
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{datos.esCorrecto ? '¡Correcto!' : 'Esta no era'}</h2>
            <p className="text-sm text-white/85">
              {datos.esCorrecto ? 'Elegiste la respuesta correcta.' : 'Mira abajo cuál era y por qué.'}
            </p>
          </div>
        </div>

        {mensaje && (
          <div className="mt-5 flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn('grid size-10 shrink-0 place-items-center rounded-full text-white ring-4 ring-white/25', voz?.circulo ?? 'bg-ambar-500')}
            >
              <IconoVoz className="size-5" strokeWidth={2.5} />
            </span>
            <div className="relative flex-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-marino-800 shadow-[0_3px_0_rgb(0_0_0/0.12)]">
              <p className="text-md leading-relaxed font-semibold">{mensaje}</p>
              {accionDelMensaje && <div className="mt-3">{accionDelMensaje}</div>}
            </div>
          </div>
        )}
      </section>

      <section aria-label="Respuestas" className={cn('grid gap-3.5', !datos.esCorrecto && correcta && 'sm:grid-cols-2')}>
        {elegida && (
          <div
            className={cn(
              cajaDeOpcion,
              'animate-entrar [animation-delay:120ms]',
              estiloOpcion(datos.esCorrecto ? 'correcta' : 'incorrecta').caja,
              !datos.esCorrecto && 'animate-sacudir',
            )}
          >
            <ContenidoDeOpcion
              opcion={elegida}
              estado={datos.esCorrecto ? 'correcta' : 'incorrecta'}
              tuRespuesta={datos.esCorrecto}
            />
          </div>
        )}
        {!datos.esCorrecto && correcta && (
          <div className={cn(cajaDeOpcion, 'animate-entrar [animation-delay:220ms]', estiloOpcion('correcta').caja)}>
            <ContenidoDeOpcion opcion={correcta} estado="correcta" />
          </div>
        )}
      </section>

      <section className="tarjeta animate-entrar px-6 py-5 [animation-delay:300ms]">
        <h3 className="flex items-center gap-2.5 text-lg font-bold text-marino-800">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-ambar-50 text-ambar-600">
            <Lightbulb className="size-[18px]" strokeWidth={2.5} />
          </span>
          ¿Por qué?
        </h3>
        <p className="mt-2.5 text-md leading-relaxed text-marino-800">
          {datos.retroalimentacionDisponible
            ? datos.retroalimentacion
            : 'Todavía no hay una explicación escrita para la opción que elegiste.'}
        </p>
        {nota && <p className="mt-3 text-xs text-texto-suave">{nota}</p>}
      </section>

      <details
        ref={refEnunciado}
        open={enunciadoAbierto}
        onToggle={e => setEnunciadoAbierto((e.target as HTMLDetailsElement).open)}
        className="group tarjeta animate-entrar scroll-mt-24 px-6 py-4 [animation-delay:380ms]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold text-marino-800 [&::-webkit-details-marker]:hidden">
          {enunciadoAbierto ? 'Ocultar el enunciado' : 'Ver el enunciado y todas las opciones'}
          <ChevronDown aria-hidden="true" className="size-5 transition-transform group-open:rotate-180" strokeWidth={2.5} />
        </summary>
        <p className="mt-4 text-md leading-relaxed whitespace-pre-line text-marino-800">{datos.enunciado}</p>
        {datos.imagenEnunciado && (
          <img
            src={urlDeArchivo(datos.imagenEnunciado)}
            alt="Ilustración del enunciado"
            className="mt-4 max-h-[420px] w-full rounded-tarjeta border border-borde object-contain"
          />
        )}
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {datos.opciones.map(o => {
            const estado = o.id === datos.idOpcionCorrecta ? 'correcta' : o.id === datos.idOpcionSeleccionada ? 'incorrecta' : 'descartada'
            return (
              <li key={o.id} className={cn(cajaDeOpcion, 'py-3.5', estiloOpcion(estado).caja)}>
                <ContenidoDeOpcion opcion={o} estado={estado} />
              </li>
            )
          })}
        </ul>
      </details>
    </div>
  )
}

/** Barra fija con las acciones después de responder, como la franja de continuar de las apps de práctica. */
export function BarraDeContinuar({
  correcto,
  detalle,
  children,
}: {
  correcto: boolean
  detalle?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t-2 bg-superficie/95 px-5 py-4 backdrop-blur-md animate-subir-franja sm:px-10',
        correcto ? 'border-exito-200' : 'border-error-200',
      )}
    >
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm text-texto-suave">{detalle}</div>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center">{children}</div>
      </div>
    </div>
  )
}
