import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Clock, Flag, Loader2, WifiOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { api, ApiError, mensajeDe, urlDeArchivo } from '@/api/client'
import type { EjercicioEstudiante, EstadoSimulacro, ResultadoIntento, SiguienteSimulacro } from '@/api/types'
import { Aviso } from '@/components/Aviso'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { FranjaDeCorreccion } from '@/components/FranjaDeCorreccion'
import { OpcionesDeRespuesta } from '@/components/OpcionesDeRespuesta'
import { SelectorDeConfianza } from '@/components/SelectorDeConfianza'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { reloj } from '@/utils/formato'
import { uuid } from '@/utils/uuid'

export type MotivoDeCierre = 'TIEMPO' | 'SIN_EJERCICIOS'

interface Respuesta { idEjercicio: number; idOpcion: number; nivelConfianza: number; tokenIdempotencia: string }

const SEGUNDOS_ENTRE_REINTENTOS = 5

function Esqueleto() {
  return (
    <div className="w-full max-w-[820px]">
      <Skeleton className="h-8 w-56 rounded-full" />
      <Skeleton className="mt-6 h-8 w-full rounded-control" />
      <Skeleton className="mt-3 h-8 w-4/5 rounded-control" />
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[82px] w-full rounded-tarjeta" />)}
      </div>
      <Skeleton className="mt-7 h-[100px] w-full rounded-[20px]" />
    </div>
  )
}

function Reloj({ restante, total }: { restante: number | null; total: number | null }) {
  const critico = restante !== null && restante <= 60
  const bajo = restante !== null && restante <= 300
  const avance = restante !== null && total ? Math.min(100, Math.max(0, (restante / total) * 100)) : 100
  return (
    <div
      role="timer"
      aria-label="Tiempo restante"
      className={cn(
        'relative inline-flex h-11 items-center gap-2 overflow-hidden rounded-full px-4 font-titular text-lg font-bold tabular-nums transition-colors',
        critico ? 'bg-error-600 text-white' : bajo ? 'bg-ambar-500 text-marino-800' : 'bg-marino-800 text-white',
      )}
    >
      <Clock className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
      {restante === null ? '--:--' : reloj(restante)}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-white/35 transition-transform duration-1000 ease-linear"
        style={{ transform: `scaleX(${avance / 100})` }}
      />
    </div>
  )
}

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo px-5 py-10">
      <div className="panel w-full max-w-lg p-7 text-center sm:p-9">{children}</div>
    </div>
  )
}

export function SimulacroEnCursoPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const refResultado = useRef<HTMLDivElement>(null)
  const refEnunciado = useRef<HTMLHeadingElement>(null)

  const [estado, setEstado] = useState<EstadoSimulacro | null>(null)
  const [ejercicio, setEjercicio] = useState<EjercicioEstudiante | null>(null)
  const [numeroPregunta, setNumeroPregunta] = useState(1)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)
  const [restante, setRestante] = useState<number | null>(null)
  const [cargando, setCargando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enEspera, setEnEspera] = useState(false)
  const [sinConexion, setSinConexion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorInicial, setErrorInicial] = useState<string | null>(null)
  const [confirmarFin, setConfirmarFin] = useState(false)
  const [finalizando, setFinalizando] = useState(false)
  const [errorFin, setErrorFin] = useState<string | null>(null)
  const [altoFranja, setAltoFranja] = useState(0)

  // El reloj del servidor manda: se guarda su diferencia con el del navegador.
  const desfase = useRef(0)
  const salio = useRef(false)
  const desconectado = useRef(false)
  const enviandoAhora = useRef(false)
  const token = useRef(uuid())
  // La respuesta confirmada que todavía no llegó al servidor; se reenvía con el mismo token.
  const pendiente = useRef<Respuesta | null>(null)

  const agotado = restante === 0
  const bloqueado = agotado || finalizando

  const irAlResultado = useCallback((motivo?: MotivoDeCierre) => {
    if (salio.current) return
    salio.current = true
    navigate(`/simulacros/${id}/resultado`, { replace: true, state: motivo ? { motivo } : undefined })
  }, [navigate, id])

  const aplicarEstado = useCallback((e: EstadoSimulacro) => {
    desfase.current = new Date(e.ahora).getTime() - Date.now()
    setEstado(e)
    if (e.estado === 'Finalizado') {
      irAlResultado(new Date(e.finPrevisto).getTime() <= new Date(e.ahora).getTime() ? 'TIEMPO' : undefined)
    }
  }, [irAlResultado])

  const perderConexion = useCallback(() => {
    if (desconectado.current) return
    desconectado.current = true
    setSinConexion(true)
    toast('Perdiste la conexión', {
      description: 'El tiempo sigue corriendo. Lo que ya confirmaste está guardado.',
      icon: <WifiOff className="size-4 text-error-600" aria-hidden="true" />,
    })
  }, [])

  const recuperarConexion = useCallback(() => {
    if (!desconectado.current) return
    desconectado.current = false
    setSinConexion(false)
    toast('Volvió la conexión', { description: 'Puedes seguir respondiendo donde ibas.' })
  }, [])

  const cargarSiguiente = useCallback(async () => {
    setCargando(true); setError(null)
    try {
      const r = await api<SiguienteSimulacro>(`/simulacros/${id}/siguiente-ejercicio`)
      recuperarConexion()
      aplicarEstado(r.estado)
      if (r.finalizado || !r.ejercicio) {
        if (r.motivo === 'SIN_EJERCICIOS') {
          toast('Ya no quedan ejercicios', { description: 'Respondiste todos los disponibles, así que cerramos el simulacro.' })
        }
        irAlResultado(r.motivo === 'SIN_EJERCICIOS' || r.motivo === 'TIEMPO' ? r.motivo : undefined)
        return
      }
      token.current = uuid()
      setEjercicio(r.ejercicio)
      setNumeroPregunta(r.estado.respondidos + 1)
      setSeleccion(null); setConfianza(null); setResultado(null)
      window.scrollTo({ top: 0 })
      requestAnimationFrame(() => refEnunciado.current?.focus({ preventScroll: true }))
    } catch (e) {
      if (e instanceof ApiError && e.esRed) perderConexion()
      else if (e instanceof ApiError && (e.estado === 404 || e.estado === 403)) setErrorInicial(mensajeDe(e))
      else setError(mensajeDe(e))
    } finally {
      setCargando(false)
    }
  }, [id, aplicarEstado, irAlResultado, perderConexion, recuperarConexion])

  const mandar = useCallback(async () => {
    const respuesta = pendiente.current
    if (!respuesta || enviandoAhora.current || salio.current) return
    enviandoAhora.current = true
    setEnviando(true); setError(null)
    try {
      const r = await api<ResultadoIntento>('/intentos', {
        method: 'POST',
        body: { ...respuesta, idSimulacro: Number(id) },
      })
      pendiente.current = null
      setEnEspera(false)
      recuperarConexion()
      setResultado(r)
      if (!r.repetido) {
        setEstado(s => s && { ...s, respondidos: s.respondidos + 1, correctas: s.correctas + (r.esCorrecto ? 1 : 0) })
      }
    } catch (e) {
      if (e instanceof ApiError && e.esRed) {
        setEnEspera(true)
        perderConexion()
        return
      }
      pendiente.current = null
      setEnEspera(false)
      if (e instanceof ApiError && e.codigo === 'SIMULACRO_FINALIZADO') irAlResultado()
      else if (e instanceof ApiError && e.codigo === 'EJERCICIO_YA_RESPONDIDO') void cargarSiguiente()
      else if (e instanceof ApiError && e.estado === 410) {
        toast('Este ejercicio fue retirado del banco', { description: 'Te mostramos otro.' })
        void cargarSiguiente()
      } else setError(mensajeDe(e))
    } finally {
      enviandoAhora.current = false
      setEnviando(false)
    }
  }, [id, cargarSiguiente, irAlResultado, perderConexion, recuperarConexion])

  function confirmar() {
    if (!ejercicio || seleccion === null || confianza === null || bloqueado || pendiente.current) return
    pendiente.current = {
      idEjercicio: ejercicio.id,
      idOpcion: seleccion,
      nivelConfianza: confianza,
      tokenIdempotencia: token.current,
    }
    void mandar()
  }

  // Pregunta al servidor cómo va el simulacro. Si respondió, la conexión volvió.
  const sincronizar = useCallback(async () => {
    let e: EstadoSimulacro
    try {
      e = await api<EstadoSimulacro>(`/simulacros/${id}`)
    } catch (err) {
      if (!(err instanceof ApiError && err.esRed)) setError(mensajeDe(err))
      return
    }
    recuperarConexion()
    aplicarEstado(e)
    if (e.estado !== 'En curso') return
    if (pendiente.current) void mandar()
    else if (!ejercicio) void cargarSiguiente()
  }, [id, ejercicio, aplicarEstado, recuperarConexion, mandar, cargarSiguiente])

  // La primera carga solo depende del simulacro; si no, cualquier cambio de dependencias cambiaría de ejercicio.
  const cargarAlEntrar = useRef(cargarSiguiente)
  useEffect(() => { cargarAlEntrar.current = cargarSiguiente })
  useEffect(() => {
    salio.current = false
    void cargarAlEntrar.current()
  }, [id])

  useEffect(() => {
    if (!estado) return
    const fin = new Date(estado.finPrevisto).getTime()
    const contar = () => setRestante(Math.max(0, Math.ceil((fin - (Date.now() + desfase.current)) / 1000)))
    contar()
    const temporizador = setInterval(contar, 500)
    return () => clearInterval(temporizador)
  }, [estado])

  // Al llegar a cero se deja de aceptar respuestas y el servidor cierra el simulacro.
  useEffect(() => {
    if (!agotado) return
    setConfirmarFin(false)
    let vivo = true
    const revisar = () => {
      api<EstadoSimulacro>(`/simulacros/${id}`)
        .then(e => {
          if (!vivo) return
          recuperarConexion()
          if (e.estado === 'Finalizado') irAlResultado('TIEMPO')
          else desfase.current = new Date(e.ahora).getTime() - Date.now()
        })
        .catch(e => {
          if (!vivo) return
          if (e instanceof ApiError && e.esRed) perderConexion()
          else setError(mensajeDe(e))
        })
    }
    revisar()
    const intervalo = setInterval(revisar, SEGUNDOS_ENTRE_REINTENTOS * 1000)
    return () => { vivo = false; clearInterval(intervalo) }
  }, [agotado, id, irAlResultado, perderConexion, recuperarConexion])

  useEffect(() => {
    const alPerder = () => perderConexion()
    window.addEventListener('offline', alPerder)
    return () => window.removeEventListener('offline', alPerder)
  }, [perderConexion])

  // Mientras no haya conexión se insiste cada pocos segundos y cuando el navegador avisa que volvió.
  useEffect(() => {
    if (!sinConexion) return
    const alVolver = () => void sincronizar()
    window.addEventListener('online', alVolver)
    const intervalo = setInterval(alVolver, SEGUNDOS_ENTRE_REINTENTOS * 1000)
    return () => {
      window.removeEventListener('online', alVolver)
      clearInterval(intervalo)
    }
  }, [sinConexion, sincronizar])

  useEffect(() => {
    if (!resultado) return
    refResultado.current?.focus({ preventScroll: true })
  }, [resultado])

  useEffect(() => {
    const el = refResultado.current
    if (!el || !resultado) { setAltoFranja(0); return }
    const medir = () => setAltoFranja(el.offsetHeight)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(el)
    return () => observador.disconnect()
  }, [resultado])

  async function finalizar() {
    setFinalizando(true); setErrorFin(null)
    try {
      await api(`/simulacros/${id}/finalizar`, { method: 'POST' })
      irAlResultado()
    } catch (e) {
      if (e instanceof ApiError && e.esRed) perderConexion()
      setErrorFin(mensajeDe(e))
      setFinalizando(false)
    }
  }

  if (errorInicial) {
    return (
      <Marco>
        <Aviso className="text-left">{errorInicial}</Aviso>
        <Button asChild className="mt-7">
          <Link to="/simulacros">Volver a simulacros</Link>
        </Button>
      </Marco>
    )
  }

  const tono = tonoDeComponente(ejercicio?.componente.nombre)
  const respondido = resultado !== null
  const opcionCorrecta = resultado && ejercicio
    ? ejercicio.opciones.find(o => o.id === resultado.idOpcionCorrecta) ?? null
    : null
  const sinConfirmar = seleccion !== null && !respondido
  const avisoDeTiempo = restante === null ? '' : restante <= 60 ? 'Queda menos de un minuto.' : restante <= 300 ? 'Quedan menos de cinco minutos.' : ''

  return (
    <div className="flex min-h-screen flex-col bg-fondo">
      <header className="sticky top-0 z-20 border-b border-borde bg-superficie">
        <div className="mx-auto flex min-h-[66px] w-full max-w-[1280px] items-center gap-3 px-5 py-3 sm:gap-5 sm:px-10">
          <Button
            type="button"
            variant="fantasma"
            size="sm"
            onClick={() => { setErrorFin(null); setConfirmarFin(true) }}
            disabled={!estado || bloqueado}
            className="-ml-2"
          >
            <Flag aria-hidden="true" strokeWidth={2.5} />
            <span className="max-sm:sr-only">Finalizar simulacro</span>
          </Button>
          <p className="ml-auto text-sm text-texto-suave">
            <strong className="font-titular text-base text-marino-800">{estado?.respondidos ?? 0}</strong>{' '}
            {estado?.respondidos === 1 ? 'respondida' : 'respondidas'}
          </p>
          <Reloj restante={restante} total={estado ? estado.duracionMinutos * 60 : null} />
        </div>
        <p className="sr-only" aria-live="polite">{avisoDeTiempo}</p>
      </header>

      {(sinConexion || agotado) && (
        <div className="mx-auto w-full max-w-[860px] px-5 pt-5 sm:px-10">
          {agotado ? (
            <Aviso tono="informacion">
              <strong>Se acabó el tiempo.</strong>{' '}
              {sinConexion
                ? 'Cerraremos el simulacro y te mostraremos el resultado en cuanto vuelva la conexión.'
                : 'Estamos cerrando el simulacro para mostrarte el resultado.'}
            </Aviso>
          ) : (
            <Aviso>
              <strong>Sin conexión.</strong> El tiempo sigue corriendo y lo que ya confirmaste está guardado.
              {enEspera && ' Tu última respuesta se enviará sola cuando vuelva la conexión.'}
            </Aviso>
          )}
        </div>
      )}

      <main
        className="flex flex-1 flex-col items-center px-5 pt-6 pb-12 sm:px-10"
        style={altoFranja ? { paddingBottom: altoFranja + 32 } : undefined}
      >
        {!ejercicio ? (
          <div aria-busy="true" aria-live="polite" className="my-auto w-full max-w-[820px]">
            <span className="sr-only">Preparando el ejercicio</span>
            {error ? (
              <Aviso>
                <p>{error}</p>
                <button
                  type="button"
                  className="mt-2 font-bold underline decoration-2 underline-offset-4"
                  onClick={() => void cargarSiguiente()}
                >
                  Reintentar
                </button>
              </Aviso>
            ) : <Esqueleto />}
          </div>
        ) : (
          <div key={ejercicio.id} className="my-auto w-full max-w-[820px] animate-entrar">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-bold tracking-[0.08em] text-texto-suave uppercase">
                Pregunta {numeroPregunta}
              </span>
              <span className={cn('inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-bold', tono.pildora)}>
                <IconoComponente nombre={ejercicio.componente.nombre} className="size-[15px]" />
                {ejercicio.componente.nombre}
              </span>
              <span className="inline-flex rounded-full bg-hueso px-3.5 py-1.5 text-sm font-bold text-marino-800">
                {ejercicio.competencia.nombre}
              </span>
            </div>

            <h1
              ref={refEnunciado}
              tabIndex={-1}
              className={cn(
                'outline-none',
                ejercicio.enunciado.length > 180
                  ? 'font-sans text-[17px] leading-[1.65] font-medium tracking-normal whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[19px]'
                  : 'text-2xl leading-[1.35] font-semibold whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[29px]',
              )}
            >
              {ejercicio.enunciado}
            </h1>

            {ejercicio.imagenEnunciado && (
              <img
                src={urlDeArchivo(ejercicio.imagenEnunciado)}
                alt="Ilustración del enunciado"
                className="mt-6 max-h-[460px] w-full rounded-tarjeta border border-borde object-contain"
              />
            )}

            <OpcionesDeRespuesta
              opciones={ejercicio.opciones}
              seleccion={seleccion}
              onSeleccionar={setSeleccion}
              correccion={resultado}
              disabled={enviando || enEspera || bloqueado}
            />

            <div className="tarjeta mt-6 flex flex-col gap-5 rounded-[20px] px-6 py-5 sm:flex-row sm:items-center sm:gap-[22px]">
              <div className="shrink-0">
                <p className="font-titular text-md font-bold tracking-[-0.02em] text-marino-800">
                  {respondido ? '¿Qué tan seguro estabas?' : '¿Qué tan seguro estás?'}
                </p>
                <p className="text-xs text-texto-suave">Nos dice por qué fallaste, no solo que fallaste</p>
              </div>
              <div className="flex flex-1 sm:justify-end">
                <SelectorDeConfianza
                  valor={confianza}
                  onCambiar={setConfianza}
                  disabled={respondido || enviando || enEspera || bloqueado}
                  etiqueta="Nivel de confianza, de 1 a 5"
                />
              </div>
            </div>

            {error && <Aviso className="mt-6">{error}</Aviso>}

            {!respondido && !bloqueado && (
              <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-texto-suave">
                  {enEspera
                    ? 'Tu respuesta está lista; la enviamos apenas vuelva la conexión.'
                    : seleccion === null
                      ? 'Elige una opción para continuar.'
                      : confianza === null
                        ? 'Marca qué tan seguro estás de tu respuesta.'
                        : 'Al confirmar te explicamos la opción que elegiste.'}
                </p>
                <Button
                  type="button"
                  size="lg"
                  onClick={enEspera ? () => void mandar() : confirmar}
                  disabled={seleccion === null || confianza === null || enviando}
                  className="max-sm:w-full"
                >
                  {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
                  {enviando ? 'Registrando' : enEspera ? 'Reintentar envío' : 'Confirmar respuesta'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      <div ref={refResultado} tabIndex={-1} aria-live="polite" className="fixed inset-x-0 bottom-0 z-30 outline-none">
        {resultado && (
          <FranjaDeCorreccion
            correcto={resultado.esCorrecto}
            titulo={resultado.esCorrecto ? 'Respuesta correcta' : 'No es la respuesta correcta'}
            detalle={
              <>
                {resultado.retroalimentacionDisponible
                  ? resultado.retroalimentacion
                  : 'Todavía no hay una explicación escrita para la opción que elegiste.'}
                {!resultado.esCorrecto && opcionCorrecta && (
                  <>
                    {' '}La respuesta correcta es{' '}
                    <strong>
                      {opcionCorrecta.letra}
                      {opcionCorrecta.descripcion ? `. ${opcionCorrecta.descripcion}` : ''}
                    </strong>.
                  </>
                )}
              </>
            }
            nota={
              resultado.repetido
                ? `Esta respuesta ya estaba registrada; no se guardó dos veces · confianza ${resultado.nivelConfianza} de 5`
                : `Confianza ${resultado.nivelConfianza} de 5`
            }
            accion={
              <Button
                type="button"
                size="lg"
                onClick={() => void cargarSiguiente()}
                disabled={cargando || bloqueado}
                className="max-sm:w-full"
              >
                {cargando && <Loader2 className="animate-spin" aria-hidden="true" />}
                Siguiente ejercicio
                {!cargando && <ArrowRight aria-hidden="true" strokeWidth={2.5} />}
              </Button>
            }
          />
        )}
      </div>

      <Dialog open={confirmarFin} onOpenChange={abierto => { if (!finalizando) setConfirmarFin(abierto) }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>¿Terminar el simulacro ahora?</DialogTitle>
            <DialogDescription>
              Guardamos {estado?.respondidos === 1 ? 'la respuesta que confirmaste' : `las ${estado?.respondidos ?? 0} respuestas que confirmaste`}{' '}
              y ya no podrás responder más.
              {sinConfirmar && ' La opción que marcaste sin confirmar no se guardará.'}
            </DialogDescription>
          </DialogHeader>
          {errorFin && <Aviso>{errorFin}</Aviso>}
          <DialogFooter className="mt-2">
            <DialogClose asChild>
              <Button variant="contorno" disabled={finalizando}>Seguir respondiendo</Button>
            </DialogClose>
            <Button onClick={finalizar} disabled={finalizando}>
              {finalizando && <Loader2 className="animate-spin" aria-hidden="true" />}
              {finalizando ? 'Terminando' : 'Terminar simulacro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
