import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, ChevronRight, Loader2, Timer } from 'lucide-react'
import { cn } from 'cn'
import { api, ApiError, mensajeDe } from '@/api/client'
import type { Catalogos, Duracion, EstadoSimulacro, Pagina, ResumenSimulacro } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { EstadoVacio } from '@/components/EstadoVacio'
import { RosaDeLosVientos } from '@/components/Marca'
import { Paginacion } from '@/components/Paginacion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { duracion, fecha, porcentaje } from '@/utils/formato'

function SelectorDeDuracion({
  duraciones,
  valor,
  onCambiar,
}: {
  duraciones: Duracion[]
  valor: number | null
  onCambiar: (id: number) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const foco = Math.max(0, duraciones.findIndex(d => d.id === valor))

  function alTeclado(e: React.KeyboardEvent, i: number) {
    const total = duraciones.length
    const mapa: Record<string, number> = {
      ArrowRight: (i + 1) % total,
      ArrowDown: (i + 1) % total,
      ArrowLeft: (i + total - 1) % total,
      ArrowUp: (i + total - 1) % total,
      Home: 0,
      End: total - 1,
    }
    const destino = mapa[e.key]
    if (destino === undefined) return
    e.preventDefault()
    onCambiar(duraciones[destino].id)
    refs.current[destino]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Duración del simulacro" className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {duraciones.map((d, i) => {
        const activo = valor === d.id
        return (
          <button
            key={d.id}
            type="button"
            ref={el => { refs.current[i] = el }}
            role="radio"
            aria-checked={activo}
            tabIndex={i === foco ? 0 : -1}
            onClick={() => onCambiar(d.id)}
            onKeyDown={e => alTeclado(e, i)}
            className={cn(
              'flex flex-col items-center justify-center rounded-tarjeta border-2 border-b-[5px] px-3 py-4 transition-[transform,border-color,background-color]',
              activo
                ? 'border-violeta-600 bg-violeta-50 text-violeta-700'
                : 'border-borde-fuerte bg-superficie text-marino-800 hover:border-marino-200 active:translate-y-[3px] active:border-b-2',
            )}
          >
            <span className="font-titular text-3xl font-bold tracking-[-0.02em]">{d.minutos}</span>
            <span className={cn('text-sm font-bold', activo ? 'text-violeta-700' : 'text-texto-suave')}>minutos</span>
          </button>
        )
      })}
    </div>
  )
}

function FilaSimulacro({ s }: { s: ResumenSimulacro }) {
  return (
    <li>
      <Link
        to={`/simulacros/${s.id}/resultado`}
        className="tarjeta flex items-center gap-4 px-5 py-4 transition-colors hover:border-marino-200 sm:gap-6 sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <p className="font-titular text-md font-bold text-marino-800">{fecha(s.fechaInicio)}</p>
          <p className="text-sm text-texto-suave">
            {s.duracionMinutos} min configurados · {duracion(s.tiempoUtilizadoSeg)} usados · {s.respondidos}{' '}
            {s.respondidos === 1 ? 'respuesta' : 'respuestas'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-titular text-xl font-bold text-marino-800">
            {s.respondidos === 0 ? '—' : porcentaje(s.porcentajeAciertos)}
          </p>
          <p className="text-xs text-texto-suave">{s.respondidos === 0 ? 'sin respuestas' : 'de aciertos'}</p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-texto-tenue" aria-hidden="true" />
        <span className="sr-only">Ver el resultado</span>
      </Link>
    </li>
  )
}

export function SimulacrosPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const pagina = Number(params.get('pagina') ?? 0)

  const [duraciones, setDuraciones] = useState<Duracion[] | null>(null)
  const [enCurso, setEnCurso] = useState<EstadoSimulacro | null>(null)
  const [cargandoConfig, setCargandoConfig] = useState(true)
  const [errorConfig, setErrorConfig] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [iniciando, setIniciando] = useState(false)
  const [errorInicio, setErrorInicio] = useState<string | null>(null)

  const [historial, setHistorial] = useState<Pagina<ResumenSimulacro> | null>(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  const [errorHistorial, setErrorHistorial] = useState<string | null>(null)
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargandoConfig(true)
    Promise.all([
      api<Catalogos>('/catalogos'),
      api<EstadoSimulacro | undefined>('/simulacros/en-curso'),
    ])
      .then(([c, s]) => {
        if (!vivo) return
        setDuraciones([...(c.duraciones ?? [])].sort((a, b) => a.minutos - b.minutos))
        setEnCurso(s ?? null)
        setErrorConfig(null)
      })
      .catch(e => { if (vivo) setErrorConfig(mensajeDe(e)) })
      .finally(() => { if (vivo) setCargandoConfig(false) })
    return () => { vivo = false }
  }, [reintento])

  useEffect(() => {
    let vivo = true
    setCargandoHistorial(true)
    api<Pagina<ResumenSimulacro>>(`/simulacros/mios?pagina=${pagina}`)
      .then(h => { if (vivo) { setHistorial(h); setErrorHistorial(null) } })
      .catch(e => { if (vivo) { setHistorial(null); setErrorHistorial(mensajeDe(e)) } })
      .finally(() => { if (vivo) setCargandoHistorial(false) })
    return () => { vivo = false }
  }, [pagina, reintento])

  const elegida = duraciones?.find(d => d.id === seleccion) ?? null

  async function iniciar() {
    if (!elegida) return
    setIniciando(true); setErrorInicio(null)
    try {
      const s = await api<EstadoSimulacro>('/simulacros', { method: 'POST', body: { idDuracion: elegida.id } })
      navigate(`/simulacros/${s.id}`)
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'SIMULACRO_EN_CURSO' && e.extra.idSimulacro) {
        navigate(`/simulacros/${e.extra.idSimulacro}`)
        return
      }
      setErrorInicio(mensajeDe(e))
      setIniciando(false)
    }
  }

  function irPagina(p: number) {
    setParams({ pagina: String(p) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const reintentar = (
    <button
      type="button"
      className="mt-2 font-bold underline decoration-2 underline-offset-4"
      onClick={() => setReintento(n => n + 1)}
    >
      Reintentar
    </button>
  )

  return (
    <div className="animate-entrar space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-marino-800 sm:text-3xl">Simulacros</h1>
        <p className="mt-1.5 text-base text-texto-suave">Responde contra el reloj, como el día de la prueba.</p>
      </header>

      {cargandoConfig ? (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Cargando la configuración del simulacro</span>
          <Skeleton className="h-[300px] w-full rounded-panel" />
        </div>
      ) : errorConfig ? (
        <Aviso>
          <p>{errorConfig}</p>
          {reintentar}
        </Aviso>
      ) : enCurso ? (
        <section
          data-sobre-marino
          className="relative isolate overflow-hidden rounded-panel bg-marino-800 px-7 py-8 sm:px-[34px] sm:py-[30px]"
        >
          <RosaDeLosVientos
            className="pointer-events-none absolute -top-[46px] -right-[34px] -z-10 size-[220px] text-white opacity-[0.16]"
          />
          <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-[34px]">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-[0.1em] text-ambar-500 uppercase">Simulacro en curso</p>
              <h2 className="mt-2.5 text-2xl leading-[1.2] font-bold text-white sm:text-3xl">
                Te quedan {Math.max(1, Math.ceil(enCurso.tiempoRestanteSeg / 60))} de {enCurso.duracionMinutos} minutos
              </h2>
              <p className="mt-2 text-md leading-relaxed text-marino-200">
                Llevas {enCurso.respondidos} {enCurso.respondidos === 1 ? 'respuesta confirmada' : 'respuestas confirmadas'}.
                El reloj no se detuvo mientras no estabas.
              </p>
            </div>
            <Button asChild variant="acento" size="lg" className="max-sm:w-full">
              <Link to={`/simulacros/${enCurso.id}`}>
                Continuar
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      ) : duraciones && duraciones.length === 0 ? (
        <EstadoVacio
          titulo="Los simulacros no están disponibles"
          descripcion="Todavía no hay duraciones configuradas. Vuelve a intentarlo más tarde."
        />
      ) : duraciones && (
        <section aria-labelledby="titulo-iniciar" className="panel px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="grid size-[52px] shrink-0 place-items-center rounded-[16px] bg-ambar-50 text-ambar-600"
            >
              <Timer className="size-6" strokeWidth={2.25} />
            </span>
            <div>
              <h2 id="titulo-iniciar" className="text-xl font-bold text-marino-800">Iniciar simulacro</h2>
              <p className="text-base text-texto-suave">¿Cuánto tiempo tienes hoy?</p>
            </div>
          </div>

          <div className="mt-6">
            <SelectorDeDuracion duraciones={duraciones} valor={seleccion} onCambiar={setSeleccion} />
          </div>

          <div className="mt-7 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-texto-suave" aria-live="polite">
              {elegida
                ? <>Elegiste <strong className="text-marino-800">{elegida.minutos} minutos</strong> con ejercicios de todos los componentes.</>
                : 'Elige una duración para continuar.'}
            </p>
            <Button
              type="button"
              variant="acento"
              size="lg"
              disabled={!elegida}
              onClick={() => { setErrorInicio(null); setConfirmando(true) }}
              className="max-sm:w-full"
            >
              Iniciar simulacro
            </Button>
          </div>
        </section>
      )}

      <section aria-labelledby="titulo-historial" className="space-y-4">
        <h2 id="titulo-historial" className="text-xl font-bold text-marino-800">Tus simulacros</h2>

        {errorHistorial && (
          <Aviso>
            <p>{errorHistorial}</p>
            {reintentar}
          </Aviso>
        )}

        <div aria-busy={cargandoHistorial} aria-live="polite">
          {cargandoHistorial && (
            <div className="space-y-3">
              <span className="sr-only">Cargando tus simulacros</span>
              {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[76px] w-full rounded-tarjeta-lg" />)}
            </div>
          )}

          {!cargandoHistorial && historial && historial.contenido.length === 0 && (
            <EstadoVacio
              titulo="Aún no has terminado ningún simulacro"
              descripcion="Cuando termines el primero, aquí verás tu resultado y qué reforzar."
            />
          )}

          {!cargandoHistorial && historial && historial.contenido.length > 0 && (
            <ul className="space-y-3">
              {historial.contenido.map(s => <FilaSimulacro key={s.id} s={s} />)}
            </ul>
          )}
        </div>

        {!cargandoHistorial && historial && historial.totalPaginas > 1 && (
          <div className="pt-2">
            <Paginacion
              pagina={historial.pagina}
              totalPaginas={historial.totalPaginas}
              onCambiar={irPagina}
              etiqueta="Paginación de tus simulacros"
            />
          </div>
        )}
      </section>

      <Dialog open={confirmando} onOpenChange={abierto => { if (!iniciando) setConfirmando(abierto) }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>¿Empezamos?</DialogTitle>
            <DialogDescription>
              Vas a iniciar un simulacro de <strong className="text-marino-800">{elegida?.minutos} minutos</strong>.
              El tiempo empieza a correr apenas confirmes y ya no podrás cambiar la duración.
            </DialogDescription>
          </DialogHeader>
          {errorInicio && <Aviso>{errorInicio}</Aviso>}
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="contorno" disabled={iniciando}>Cancelar</Button>
            </DialogClose>
            <Button variant="acento" onClick={iniciar} disabled={iniciando}>
              {iniciando && <Loader2 className="animate-spin" aria-hidden="true" />}
              {iniciando ? 'Iniciando' : 'Iniciar ahora'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
