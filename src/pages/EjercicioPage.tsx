import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Clock, History, Loader2, RotateCcw } from 'lucide-react'
import { cn } from 'cn'
import { api, ApiError, mensajeDe, urlDeArchivo } from '@/api/client'
import type { EjercicioEstudiante, OpcionEstudiante, ResultadoIntento, SiguienteEjercicio } from '@/api/types'
import { useAuth } from '@/auth/AuthContext'
import { Aviso } from '@/components/Aviso'
import { IconoComponente, tonoDeComponente } from '@/components/Componente'
import { cajaDeOpcion, ContenidoDeOpcion, estiloOpcion, type EstadoOpcion } from '@/components/Opciones'
import { SelectorDeConfianza } from '@/components/SelectorDeConfianza'
import { BarraDeContinuar, Revision } from '@/components/Revision'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cuandoSeHabilita, fechaHora } from '@/utils/formato'
import { uuid } from '@/utils/uuid'
import { alResponder, momentoDeInicio, type Retroalimentacion } from '@/retro/memoria'

function estadoOpcion(o: OpcionEstudiante, seleccion: number | null, resultado: ResultadoIntento | null): EstadoOpcion {
  if (!resultado) return seleccion === o.id ? 'seleccionada' : 'libre'
  if (o.id === resultado.idOpcionCorrecta) return 'correcta'
  if (o.id === resultado.idOpcionSeleccionada) return 'incorrecta'
  return 'descartada'
}

function Esqueleto() {
  return (
    <div className="w-full max-w-[820px]">
      <Skeleton className="h-8 w-full rounded-control" />
      <Skeleton className="mt-3 h-8 w-4/5 rounded-control" />
      <div className="mt-8 grid gap-3.5 sm:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[82px] w-full rounded-tarjeta" />)}
      </div>
      <Skeleton className="mt-7 h-[100px] w-full rounded-[20px]" />
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

export function EjercicioPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const componente = params.get('componente') ? Number(params.get('componente')) : null
  const navigate = useNavigate()
  const idUsuario = useAuth().usuario?.id ?? null
  const refOpciones = useRef<(HTMLButtonElement | null)[]>([])
  const refResultado = useRef<HTMLDivElement>(null)
  const refEnunciado = useRef<HTMLHeadingElement>(null)
  // Cronómetro oculto: solo cuenta el tiempo con la pestaña visible.
  const cronometro = useRef({ acumulado: 0, desde: 0 })

  const [ejercicio, setEjercicio] = useState<EjercicioEstudiante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [noDisponible, setNoDisponible] = useState(false)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const [confianza, setConfianza] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoIntento | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [buscandoSiguiente, setBuscandoSiguiente] = useState(false)
  const [sinMas, setSinMas] = useState<string | null>(null)
  const [token, setToken] = useState(() => uuid())
  const [inicio, setInicio] = useState<string | null>(null)
  const [retro, setRetro] = useState<Retroalimentacion | null>(null)
  const [bloqueo, setBloqueo] = useState<{ disponibleDesde: string | null } | null>(null)
  const [mostrarEnunciado, setMostrarEnunciado] = useState(0)

  const cargar = useCallback(() => {
    setEjercicio(null); setError(null); setNoDisponible(false)
    setSeleccion(null); setConfianza(null); setResultado(null); setSinMas(null); setRetro(null); setInicio(null)
    setBloqueo(null)
    setToken(uuid())
    api<EjercicioEstudiante>(`/ejercicios/${id}`)
      .then(e => {
        setEjercicio(e)
        if (e.intentosRestantes === 0) setBloqueo({ disponibleDesde: null })
        else if (e.disponibleDesde && new Date(e.disponibleDesde) > new Date()) setBloqueo({ disponibleDesde: e.disponibleDesde })
        cronometro.current = { acumulado: 0, desde: document.hidden ? 0 : performance.now() }
        const momento = idUsuario === null ? null : momentoDeInicio(idUsuario, e.componente.nombre)
        if (momento) setInicio(momento)
      })
      .catch(e => {
        if (e instanceof ApiError && e.estado === 410) setNoDisponible(true)
        else setError(mensajeDe(e))
      })
  }, [id, idUsuario])

  useEffect(cargar, [cargar])

  useEffect(() => {
    function alCambiarVisibilidad() {
      const c = cronometro.current
      if (document.hidden) {
        if (c.desde) c.acumulado += performance.now() - c.desde
        c.desde = 0
      } else {
        c.desde = performance.now()
      }
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [])

  function tiempoDeRespuestaMs() {
    const c = cronometro.current
    const total = Math.round(c.acumulado + (c.desde ? performance.now() - c.desde : 0))
    return total > 0 ? total : null
  }

  useEffect(() => {
    if (!resultado) return
    refResultado.current?.focus({ preventScroll: true })
  }, [resultado])

  const volver = `/banco${componente ? `?componente=${componente}` : ''}`

  async function confirmar() {
    if (!ejercicio || seleccion === null || confianza === null) return
    setEnviando(true); setError(null)
    try {
      const r = await api<ResultadoIntento>('/intentos', {
        method: 'POST',
        body: {
          idEjercicio: ejercicio.id, idOpcion: seleccion, nivelConfianza: confianza, tokenIdempotencia: token,
          tiempoRespuestaMs: tiempoDeRespuestaMs(),
        },
      })
      setResultado(r)
      setInicio(null)
      if (idUsuario !== null && !r.repetido) {
        setRetro(alResponder(idUsuario, {
          correcto: r.esCorrecto, tipoError: r.tipoError, componente: ejercicio.componente.nombre, confianza: r.nivelConfianza,
        }))
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      if (e instanceof ApiError && e.estado === 410) setNoDisponible(true)
      else if (e instanceof ApiError && e.codigo === 'SIN_INTENTOS') setBloqueo({ disponibleDesde: null })
      else if (e instanceof ApiError && e.codigo === 'REINTENTO_EN_ESPERA') {
        setBloqueo({ disponibleDesde: String(e.extra.disponibleDesde ?? '') || null })
      } else setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  async function siguiente(filtro = componente) {
    if (!ejercicio) return
    setBuscandoSiguiente(true); setError(null)
    try {
      const r = await api<SiguienteEjercicio>(`/ejercicios/${ejercicio.id}/siguiente${filtro ? `?componente=${filtro}` : ''}`)
      if (r.hayMas && r.idEjercicio) navigate(`/ejercicios/${r.idEjercicio}${filtro ? `?componente=${filtro}` : ''}`)
      else setSinMas(r.mensaje ?? 'Ya resolviste todos los ejercicios disponibles con este filtro.')
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setBuscandoSiguiente(false)
    }
  }

  function verEnunciado() {
    setMostrarEnunciado(n => n + 1)
  }

  function teclasOpciones(e: React.KeyboardEvent, i: number) {
    if (!ejercicio || resultado) return
    const total = ejercicio.opciones.length
    const mapa: Record<string, number> = {
      ArrowDown: (i + 1) % total,
      ArrowRight: (i + 1) % total,
      ArrowUp: (i + total - 1) % total,
      ArrowLeft: (i + total - 1) % total,
      Home: 0,
      End: total - 1,
    }
    const destino = mapa[e.key]
    if (destino === undefined) return
    e.preventDefault()
    setSeleccion(ejercicio.opciones[destino].id)
    refOpciones.current[destino]?.focus()
  }

  if (noDisponible) {
    return (
      <Marco>
        <h1 className="text-xl font-bold text-marino-800">Este ejercicio ya no está disponible</h1>
        <p className="mt-2.5 text-base text-texto-suave">Fue retirado del banco. Elige otro y sigue practicando.</p>
        <Button asChild className="mt-7">
          <Link to={volver}>Volver a la ruta</Link>
        </Button>
      </Marco>
    )
  }

  if (error && !ejercicio) {
    return (
      <Marco>
        <Aviso className="text-left">{error}</Aviso>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={cargar}>Reintentar</Button>
          <Button asChild variant="contorno"><Link to={volver}>Volver a la ruta</Link></Button>
        </div>
      </Marco>
    )
  }

  const respondido = resultado !== null
  const tono = tonoDeComponente(ejercicio?.componente.nombre)
  const indiceFoco = ejercicio && seleccion ? ejercicio.opciones.findIndex(o => o.id === seleccion) : 0
  const restantesAntes = ejercicio?.intentosRestantes ?? null
  const restantesDespues = restantesAntes === null ? null : Math.max(0, restantesAntes - 1)

  const accionDelMensaje = !resultado || resultado.esCorrecto || !retro?.tipo ? undefined
    : retro.tipo === 'Error cognitivo' ? (
      <Button type="button" variant="contorno" size="sm" disabled={buscandoSiguiente || !!sinMas}
        onClick={() => siguiente(ejercicio?.componente.id ?? null)}>
        Probar otro de {ejercicio?.componente.nombre}
      </Button>
    ) : retro.tipo === 'Error de hábito' ? (
      <Button type="button" variant="contorno" size="sm" onClick={verEnunciado}>
        Ver el enunciado otra vez
      </Button>
    ) : undefined

  const botonSiguiente = sinMas ? (
    <>
      {componente !== null && (
        <Button type="button" variant="contorno" size="lg" onClick={() => siguiente(null)} disabled={buscandoSiguiente}>
          Quitar el filtro
        </Button>
      )}
      <Button asChild size="lg"><Link to={volver}>Volver a la ruta</Link></Button>
    </>
  ) : (
    <Button type="button" size="lg" onClick={() => siguiente()} disabled={buscandoSiguiente}>
      {buscandoSiguiente && <Loader2 className="animate-spin" aria-hidden="true" />}
      Siguiente ejercicio
      {!buscandoSiguiente && <ArrowRight aria-hidden="true" strokeWidth={2.5} />}
    </Button>
  )

  return (
    <div className="flex min-h-screen flex-col fondo-vivo">
      <header className="flex min-h-[66px] shrink-0 flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3 sm:px-10">
        <Link
          to={volver}
          className="inline-flex items-center gap-2.5 text-base font-bold text-sobre-fondo-suave transition-colors hover:text-white"
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
          Salir de la práctica
        </Link>
        {ejercicio && (
          <span
            className={cn('ml-auto inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full px-4 py-2 text-sm font-bold max-sm:ml-0', tono.pildora)}
          >
            <IconoComponente nombre={ejercicio.componente.nombre} className="size-[15px]" />
            Ejercicio {ejercicio.numero} · {ejercicio.componente.nombre} · {ejercicio.competencia.nombre} · {ejercicio.nivel}
          </span>
        )}
      </header>

      <main className={cn('flex flex-1 flex-col items-center px-5 pt-5 sm:px-10', respondido ? 'pb-48 sm:pb-36' : 'pb-12')}>
        {!ejercicio ? (
          <div aria-busy="true" aria-live="polite" className="my-auto w-full max-w-[820px]">
            <span className="sr-only">Cargando el ejercicio</span>
            <Esqueleto />
          </div>
        ) : bloqueo && !respondido ? (
          <div className="my-auto w-full max-w-[560px] animate-aparecer">
            <div className="panel p-7 text-center sm:p-9">
              <span aria-hidden="true" className="mx-auto grid size-16 place-items-center rounded-full bg-ambar-50 text-ambar-600">
                {bloqueo.disponibleDesde ? <Clock className="size-8" strokeWidth={2.2} /> : <History className="size-8" strokeWidth={2.2} />}
              </span>
              <h1 className="mt-5 text-2xl font-bold text-marino-800">
                {bloqueo.disponibleDesde ? 'Este ejercicio está descansando' : 'Ya usaste tus dos intentos'}
              </h1>
              <p className="mt-2.5 text-md leading-relaxed text-texto-suave">
                {bloqueo.disponibleDesde
                  ? `Volver a responderlo enseguida, con la respuesta fresca, no te dice si lo aprendiste. Podrás intentarlo de nuevo ${cuandoSeHabilita(bloqueo.disponibleDesde)}`
                  : 'Cada ejercicio se puede practicar dos veces. Revisa tus intentos en el historial y sigue con otros ejercicios.'}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild variant="contorno"><Link to="/historial">Ver mi historial</Link></Button>
                {botonSiguiente}
              </div>
              {sinMas && <p className="mt-4 text-sm text-texto-suave">{sinMas}</p>}
            </div>
          </div>
        ) : resultado ? (
          <div ref={refResultado} tabIndex={-1} aria-live="polite" className="w-full max-w-[820px] outline-none">
            <Revision
              datos={{
                enunciado: ejercicio.enunciado,
                imagenEnunciado: ejercicio.imagenEnunciado,
                opciones: ejercicio.opciones,
                idOpcionSeleccionada: resultado.idOpcionSeleccionada,
                idOpcionCorrecta: resultado.idOpcionCorrecta,
                esCorrecto: resultado.esCorrecto,
                retroalimentacion: resultado.retroalimentacion,
                retroalimentacionDisponible: resultado.retroalimentacionDisponible,
              }}
              mensaje={retro?.mensaje}
              tipo={resultado.esCorrecto ? null : retro?.tipo}
              accionDelMensaje={accionDelMensaje}
              abrirEnunciado={mostrarEnunciado}
              nota={`Intento ${resultado.numeroIntento} · ${fechaHora(resultado.respondidoEn)} · confianza ${resultado.nivelConfianza} de 5`}
            />
            {retro?.pausa && <Aviso tono="informacion" className="mt-5">{retro.pausa}</Aviso>}
          </div>
        ) : (
          <div className="my-auto w-full max-w-[820px] animate-entrar">
            {inicio && <Aviso tono="informacion" className="mb-5">{inicio}</Aviso>}

            {restantesAntes !== null && (
              <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-superficie px-3.5 py-1.5 text-xs font-bold text-texto-suave shadow-[0_0_0_1px_var(--color-borde)]">
                <RotateCcw className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                {ejercicio.intentosPrevios === 0 || restantesAntes > 1
                  ? `${restantesAntes} intentos en este ejercicio: el segundo se habilita un día después del primero`
                  : 'Último intento para este ejercicio'}
              </p>
            )}

            <section className="tarjeta px-6 py-6 sm:px-8 sm:py-7">
            <h1
              ref={refEnunciado}
              tabIndex={-1}
              className={
                ejercicio.enunciado.length > 180
                  ? 'outline-none font-sans text-[17px] leading-[1.65] font-medium tracking-normal whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[19px]'
                  : 'outline-none text-2xl leading-[1.35] font-semibold whitespace-pre-line text-marino-800 [text-wrap:pretty] sm:text-[29px]'
              }
            >
              {ejercicio.enunciado}
            </h1>

            {ejercicio.imagenEnunciado && (
              <img
                src={urlDeArchivo(ejercicio.imagenEnunciado)}
                alt="Ilustración del enunciado"
                className="mt-6 max-h-[460px] w-full rounded-tarjeta border border-borde bg-superficie object-contain"
              />
            )}
            </section>

            <div role="radiogroup" aria-label="Opciones de respuesta" className="mt-7 grid gap-3.5 sm:grid-cols-2">
              {ejercicio.opciones.map((o, i) => {
                const estado = estadoOpcion(o, seleccion, resultado)
                return (
                  <button
                    key={o.id}
                    type="button"
                    ref={el => { refOpciones.current[i] = el }}
                    role="radio"
                    aria-checked={seleccion === o.id}
                    tabIndex={i === Math.max(0, indiceFoco) ? 0 : -1}
                    disabled={enviando}
                    onClick={() => setSeleccion(o.id)}
                    onKeyDown={e => teclasOpciones(e, i)}
                    className={cn(cajaDeOpcion, 'disabled:cursor-default', estiloOpcion(estado).caja)}
                  >
                    <ContenidoDeOpcion opcion={o} estado={estado} />
                  </button>
                )
              })}
            </div>

            <div className="tarjeta mt-6 flex flex-col gap-5 rounded-[20px] px-6 py-5 sm:flex-row sm:items-center sm:gap-[22px]">
              <div className="shrink-0">
                <p className="font-titular text-md font-bold tracking-[-0.02em] text-marino-800">¿Qué tan seguro estás?</p>
                <p className="text-xs text-texto-suave">Nos dice por qué fallaste, no solo que fallaste</p>
              </div>
              <div className="flex flex-1 sm:justify-end">
                <SelectorDeConfianza
                  valor={confianza}
                  onCambiar={setConfianza}
                  disabled={enviando}
                  etiqueta="Nivel de confianza, de 1 a 5"
                />
              </div>
            </div>

            {error && <Aviso className="mt-6">{error}</Aviso>}

            <div className="mt-6 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-sobre-fondo-suave">
                {seleccion === null
                  ? 'Elige una opción para continuar.'
                  : confianza === null
                    ? 'Marca qué tan seguro estás de tu respuesta.'
                    : 'Al confirmar te explicamos la opción que elegiste.'}
              </p>
              <Button
                type="button"
                size="lg"
                variant="acento"
                onClick={confirmar}
                disabled={seleccion === null || confianza === null || enviando}
                className="max-sm:w-full"
              >
                {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
                {enviando ? 'Registrando' : 'Confirmar respuesta'}
              </Button>
            </div>
          </div>
        )}
      </main>

      {resultado && (
        <BarraDeContinuar
          correcto={resultado.esCorrecto}
          detalle={
            sinMas ?? (
              restantesDespues === null ? null
                : restantesDespues === 0 ? 'Usaste los dos intentos de este ejercicio.'
                  : `Te queda 1 intento en este ejercicio, disponible ${cuandoSeHabilita(new Date(Date.parse(resultado.respondidoEn) + 24 * 3600 * 1000).toISOString())}`
            )
          }
        >
          {botonSiguiente}
        </BarraDeContinuar>
      )}
    </div>
  )
}
