import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, ChevronDown, X } from 'lucide-react'
import { cn } from 'cn'
import { api, ApiError, mensajeDe, urlDeArchivo } from '@/api/client'
import type { DesempenoArea, IntentoDetalle, Recomendacion, ResultadoSimulacro } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { BarraDeDesempeno, Cifra } from '@/components/Desempeno'
import { EstadoVacio } from '@/components/EstadoVacio'
import { RosaDeLosVientos } from '@/components/Marca'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { MotivoDeCierre } from '@/pages/SimulacroEnCursoPage'
import { duracion, fecha, fechaHora, porcentaje } from '@/utils/formato'

const AVISO_POR_MOTIVO: Record<MotivoDeCierre, string> = {
  TIEMPO: 'Se acabó el tiempo. Guardamos todas las respuestas que alcanzaste a confirmar.',
  SIN_EJERCICIOS: 'Respondiste todos los ejercicios disponibles, así que cerramos el simulacro.',
}

function VolverASimulacros() {
  return (
    <Link
      to="/simulacros"
      className="inline-flex items-center gap-2 text-sm font-bold text-texto-suave transition-colors hover:text-marino-800"
    >
      <ArrowLeft className="size-[17px]" aria-hidden="true" />
      Volver a simulacros
    </Link>
  )
}

function Areas({ titulo, areas, esComponente }: { titulo: string; areas: DesempenoArea[]; esComponente?: boolean }) {
  return (
    <section className="tarjeta px-6 py-5">
      <h2 className="mb-4 text-lg font-bold text-marino-800">{titulo}</h2>
      {areas.length === 0 ? (
        <p className="text-sm text-texto-suave">Sin respuestas confirmadas.</p>
      ) : (
        <ul className="divide-y divide-borde">
          {areas.map(a => (
            <BarraDeDesempeno
              key={a.id}
              nombre={a.nombre}
              valor={a.porcentaje}
              esComponente={esComponente}
              detalle={`${a.correctas} de ${a.intentos} ${a.intentos === 1 ? 'correcta' : 'correctas'}`}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function Recomendaciones({ r }: { r: ResultadoSimulacro }) {
  if (r.recomendaciones.length === 0) {
    if (r.respondidos === 0) {
      return (
        <p className="text-base text-texto-suave">
          {r.mensajeRecomendacion ?? 'No confirmaste respuestas en este simulacro, así que no hay nada que recomendar todavía.'}
        </p>
      )
    }
    return (
      <Aviso tono="confirmacion">
        {r.mensajeRecomendacion ?? 'Tienes un buen desempeño general. Sigue practicando para mantenerlo.'}
      </Aviso>
    )
  }
  return (
    <ol className="space-y-3">
      {[...r.recomendaciones].sort((a, b) => a.orden - b.orden).map((rec: Recomendacion) => (
        <li key={rec.orden} className="tarjeta flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-error-50 font-titular text-sm font-bold text-error-700"
          >
            {rec.orden}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-marino-800">
              {rec.area}{' '}
              <span className="font-normal text-texto-suave">
                · {rec.tipo.toLowerCase()} · {porcentaje(rec.porcentaje)} de aciertos
              </span>
            </p>
            <p className="mt-0.5 text-base text-marino-800">{rec.mensaje}</p>
          </div>
          {rec.idComponente && (
            <Button asChild variant="contorno" size="sm" className="max-sm:w-full">
              <Link to={`/banco?componente=${rec.idComponente}`}>
                Practicar
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          )}
        </li>
      ))}
    </ol>
  )
}

function DetalleDeRespuesta({ d, indice }: { d: IntentoDetalle; indice: number }) {
  const Icono = d.esCorrecto ? Check : X
  return (
    <li>
      <details className="tarjeta group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
          <span
            aria-hidden="true"
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-full text-white',
              d.esCorrecto ? 'bg-exito-600' : 'bg-error-600',
            )}
          >
            <Icono className="size-[18px]" strokeWidth={3} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-marino-800">
              {indice}. Ejercicio {d.numeroEjercicio}
              <span className="sr-only">, {d.esCorrecto ? 'correcta' : 'incorrecta'}</span>
            </span>
            <span className="block text-sm text-texto-suave">
              {d.componente} · {d.competencia} · confianza {d.nivelConfianza} de 5
            </span>
          </span>
          <ChevronDown
            className="size-5 shrink-0 text-texto-tenue transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="border-t border-borde px-5 py-5">
          <p className="text-md leading-relaxed whitespace-pre-line text-marino-800">{d.enunciado}</p>
          {d.imagenEnunciado && (
            <img
              src={urlDeArchivo(d.imagenEnunciado)}
              alt="Ilustración del enunciado"
              className="mt-4 max-h-[360px] w-full rounded-tarjeta border border-borde object-contain"
            />
          )}

          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {d.opciones.map(o => (
              <li
                key={o.id}
                className={cn(
                  'flex items-center gap-3 rounded-control-lg border-2 px-4 py-3',
                  o.esCorrecta
                    ? 'border-exito-600 bg-exito-50'
                    : o.seleccionada
                      ? 'border-error-600 bg-error-50'
                      : 'border-borde-fuerte bg-superficie opacity-70',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-ficha font-titular text-xs font-bold',
                    o.esCorrecta ? 'bg-exito-600 text-white' : o.seleccionada ? 'bg-error-600 text-white' : 'bg-hueso text-texto-suave',
                  )}
                >
                  {o.letra}
                </span>
                <span className="min-w-0 flex-1 text-base font-semibold text-marino-800">
                  <span className="sr-only">Opción {o.letra}: </span>
                  {o.descripcion}
                  {o.imagen && (
                    <img
                      src={urlDeArchivo(o.imagen)}
                      alt={`Opción ${o.letra}`}
                      className="mt-2 max-h-[160px] w-full rounded-ficha border border-borde object-contain"
                    />
                  )}
                </span>
                {(o.seleccionada || o.esCorrecta) && (
                  <span
                    className={cn(
                      'shrink-0 text-right text-[11px] leading-[1.25] font-bold tracking-[0.06em] uppercase',
                      o.esCorrecta ? 'text-exito-700' : 'text-error-700',
                    )}
                  >
                    {o.seleccionada ? 'Tu respuesta' : 'Correcta'}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div
            className={cn(
              'mt-4 rounded-control-lg border-2 px-4 py-3.5',
              d.esCorrecto ? 'border-exito-200 bg-exito-50 text-exito-900' : 'border-error-200 bg-error-50 text-error-900',
            )}
          >
            <p className={cn('text-sm font-bold', d.esCorrecto ? 'text-exito-700' : 'text-error-700')}>
              {d.esCorrecto ? 'Respuesta correcta' : 'No es la respuesta correcta'}
            </p>
            <p className="mt-1 text-base leading-relaxed">
              {d.retroalimentacion || 'Todavía no hay una explicación escrita para la opción que elegiste.'}
            </p>
          </div>
          <p className="mt-3 text-xs text-texto-suave">Respondida el {fechaHora(d.fechaHora)}</p>
        </div>
      </details>
    </li>
  )
}

export function ResultadoSimulacroPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const motivo = (state as { motivo?: MotivoDeCierre } | null)?.motivo
  const [r, setR] = useState<ResultadoSimulacro | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enCurso, setEnCurso] = useState(false)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vivo = true
    setError(null)
    api<ResultadoSimulacro>(`/simulacros/${id}/resultado`)
      .then(d => { if (vivo) setR(d) })
      .catch(e => {
        if (!vivo) return
        if (e instanceof ApiError && e.codigo === 'SIMULACRO_EN_CURSO') setEnCurso(true)
        else setError(mensajeDe(e))
      })
    return () => { vivo = false }
  }, [id, reintento])

  if (enCurso) {
    return (
      <div className="animate-entrar space-y-6">
        <VolverASimulacros />
        <EstadoVacio
          titulo="Este simulacro sigue en curso"
          descripcion="El resultado aparece cuando termines o se acabe el tiempo."
          accion={<Button asChild variant="acento"><Link to={`/simulacros/${id}`}>Continuar simulacro</Link></Button>}
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="animate-entrar space-y-6">
        <VolverASimulacros />
        <Aviso>
          <p>{error}</p>
          <button
            type="button"
            className="mt-2 font-bold underline decoration-2 underline-offset-4"
            onClick={() => setReintento(n => n + 1)}
          >
            Reintentar
          </button>
        </Aviso>
      </div>
    )
  }

  if (!r) {
    return (
      <div aria-busy="true" aria-live="polite" className="space-y-6">
        <span className="sr-only">Calculando tu resultado</span>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-[188px] w-full rounded-panel" />
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[92px] rounded-tarjeta-lg" />)}
        </div>
        <Skeleton className="h-[220px] w-full rounded-tarjeta-lg" />
      </div>
    )
  }

  const sinRespuestas = r.respondidos === 0

  return (
    <div className="animate-entrar space-y-8">
      <div className="space-y-5">
        <VolverASimulacros />
        {motivo && AVISO_POR_MOTIVO[motivo] && <Aviso tono="informacion">{AVISO_POR_MOTIVO[motivo]}</Aviso>}

        <section
          data-sobre-marino
          aria-labelledby="titulo-resultado"
          className="relative isolate overflow-hidden rounded-panel bg-marino-800 px-7 py-8 sm:px-[34px] sm:py-[30px]"
        >
          <RosaDeLosVientos
            className="pointer-events-none absolute -top-[46px] -right-[34px] -z-10 size-[220px] text-white opacity-[0.16]"
          />
          <p className="text-xs font-bold tracking-[0.1em] text-ambar-500 uppercase">Resultado del simulacro</p>
          <h1 id="titulo-resultado" className="mt-2.5 text-2xl leading-[1.2] font-bold text-white sm:text-3xl">
            {sinRespuestas ? 'No confirmaste respuestas' : `${porcentaje(r.porcentajeAciertos)} de aciertos`}
          </h1>
          <p className="mt-2 text-md leading-relaxed text-marino-200">
            {fecha(r.fechaInicio)} · {r.duracionMinutos} minutos configurados
          </p>
        </section>

        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
          <Cifra valor={`${r.duracionMinutos} min`} etiqueta="Duración configurada" />
          <Cifra valor={duracion(r.tiempoUtilizadoSeg)} etiqueta="Tiempo utilizado" />
          <Cifra valor={r.respondidos} etiqueta={r.respondidos === 1 ? 'Ejercicio resuelto' : 'Ejercicios resueltos'} />
          <Cifra valor={r.correctas} etiqueta={r.correctas === 1 ? 'Correcta' : 'Correctas'} />
          <Cifra valor={r.incorrectas} etiqueta={r.incorrectas === 1 ? 'Incorrecta' : 'Incorrectas'} />
        </div>
      </div>

      <section aria-labelledby="titulo-recomendaciones" className="space-y-4">
        <h2 id="titulo-recomendaciones" className="text-xl font-bold text-marino-800">Qué reforzar</h2>
        <Recomendaciones r={r} />
      </section>

      {!sinRespuestas && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Areas titulo="Por componente" areas={r.porComponente} esComponente />
          <Areas titulo="Por competencia" areas={r.porCompetencia} />
        </div>
      )}

      {r.detalle.length > 0 && (
        <section aria-labelledby="titulo-detalle" className="space-y-4">
          <div>
            <h2 id="titulo-detalle" className="text-xl font-bold text-marino-800">Tus respuestas</h2>
            <p className="text-base text-texto-suave">Abre cada una para ver la opción que elegiste y su explicación.</p>
          </div>
          <ol className="space-y-3">
            {r.detalle.map((d, i) => <DetalleDeRespuesta key={d.id} d={d} indice={i + 1} />)}
          </ol>
        </section>
      )}
    </div>
  )
}
